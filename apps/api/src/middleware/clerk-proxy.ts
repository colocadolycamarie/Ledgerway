/**
 * Clerk Frontend API reverse proxy.
 *
 * Proxies Clerk Frontend API requests through this server's own domain, so
 * Clerk auth works on a custom domain without separate CNAME DNS records.
 * See: https://clerk.com/docs/deployments/set-up-proxy
 *
 * - Only active in production (Clerk's proxy setup doesn't apply to dev instances).
 * - Must be mounted BEFORE express.json() in app.ts.
 */

import type { IncomingHttpHeaders } from "http";
import type { RequestHandler } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const CLERK_FRONTEND_API = "https://frontend-api.clerk.dev";
export const CLERK_PROXY_PATH = "/api/__clerk";

/**
 * Returns the effective public hostname for a request, preferring
 * x-forwarded-host over the Host header so callers behind a reverse proxy
 * see the original client-facing host.
 *
 * x-forwarded-host can be undefined, a single string, or a comma-delimited
 * string when an upstream appends rather than replaces the header — the
 * leftmost value is always the original client-facing host.
 *
 * Exported so app.ts (the clerkMiddleware callback) and this proxy agree on
 * which hostname is canonical; disagreement here breaks custom-domain auth.
 */
export function getClerkProxyHost(req: { headers: IncomingHttpHeaders }): string | undefined {
  const forwarded = req.headers["x-forwarded-host"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const firstHop = raw?.split(",")[0]?.trim();
  return firstHop || req.headers.host?.trim() || undefined;
}

export function clerkProxyMiddleware(): RequestHandler {
  if (process.env.NODE_ENV !== "production") {
    return (_req, _res, next) => next();
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return (_req, _res, next) => next();
  }

  return createProxyMiddleware({
    target: CLERK_FRONTEND_API,
    changeOrigin: true,
    // Take over the response so it can be re-sent with a Content-Length
    // (see proxyRes) — some deployment edges reject chunked proxy responses.
    selfHandleResponse: true,
    pathRewrite: (path: string) => path.replace(new RegExp(`^${CLERK_PROXY_PATH}`), ""),
    on: {
      proxyReq: (proxyReq, req) => {
        const protocol = req.headers["x-forwarded-proto"] || "https";
        const host = getClerkProxyHost(req) || "";
        const proxyUrl = `${protocol}://${host}${CLERK_PROXY_PATH}`;

        proxyReq.setHeader("Clerk-Proxy-Url", proxyUrl);
        proxyReq.setHeader("Clerk-Secret-Key", secretKey);

        const xff = req.headers["x-forwarded-for"];
        const clientIp =
          (Array.isArray(xff) ? xff[0] : xff)?.split(",")[0]?.trim() || req.socket?.remoteAddress || "";
        if (clientIp) {
          proxyReq.setHeader("X-Forwarded-For", clientIp);
        }
      },
      // Clerk's dynamic Frontend API responses (/v1/environment, /v1/client,
      // JWKS, ...) arrive without a Content-Length, which would relay as
      // Transfer-Encoding: chunked — rejected by some deployment edges (e.g.
      // Cloud Run), turning a 200 into a 500. Buffer only those responses so
      // they can be re-sent with a Content-Length; the body is forwarded
      // untouched so Content-Encoding is preserved. Length-known responses
      // (e.g. /npm/* assets) and body-less responses stream through as-is.
      proxyRes: (proxyRes, req, res) => {
        const headers = { ...proxyRes.headers };
        // Transfer-Encoding/Connection are hop-by-hop (RFC 7230 §6.1).
        delete headers["transfer-encoding"];
        delete headers["connection"];
        delete headers["keep-alive"];

        const status = proxyRes.statusCode ?? 502;
        // Content-Length is forbidden on 1xx/204; HEAD/304 may keep theirs.
        if (status < 200 || status === 204) {
          delete headers["content-length"];
        }

        const bodyless = req.method === "HEAD" || status < 200 || status === 204 || status === 304;
        if (headers["content-length"] !== undefined || bodyless) {
          res.writeHead(status, headers);
          // Headers are already sent, so abort the response if the upstream
          // stream errors mid-pipe (e.g. ECONNRESET) rather than leaving an
          // unhandled 'error' or a hung client.
          proxyRes.on("error", () => res.destroy());
          proxyRes.pipe(res);
          return;
        }

        const chunks: Buffer[] = [];
        proxyRes.on("data", (chunk: Buffer) => chunks.push(chunk));
        proxyRes.on("end", () => {
          const body = Buffer.concat(chunks);
          headers["content-length"] = String(body.length);
          res.writeHead(status, headers);
          res.end(body);
        });
        proxyRes.on("error", () => {
          if (!res.headersSent) {
            // Set a length so the empty 502 isn't sent chunked (rejected the
            // same way as the original response would be).
            res.writeHead(502, { "content-length": "0" });
          }
          res.end();
        });
      },
    },
  }) as RequestHandler;
}
