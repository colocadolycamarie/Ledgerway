import type { logger } from "../lib/logger";

type LoggableRequest = { log?: typeof logger };
type JsonResponse = { status: (code: number) => { json: (body: unknown) => void } };

export function procurementErrorHandler(
  error: unknown,
  req: LoggableRequest,
  res: JsonResponse,
  _next: unknown,
) {
  req.log?.error({ error }, "Procurement API route failed");
  res.status(500).json({ error: "Unexpected procurement API error" });
}
