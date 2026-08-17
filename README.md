# Ledgerway

Procurement-to-payment control plane: requisitions → approvals → purchase
orders → receiving → invoice matching → payment batches, with a full audit
trail and budget tracking.

## Structure

```
apps/
  web/        React 19 + Vite frontend (Clerk auth, TanStack Query, wouter)
  api/        Express 5 API server (Clerk auth, Drizzle ORM over Postgres)
packages/
  db/         Drizzle schema + Postgres connection, shared by apps/api
  api-spec/   OpenAPI spec (source of truth for the API contract)
  api-schema/ Zod request/response schemas, generated from api-spec via Orval
  api-client/ TanStack Query hooks, generated from api-spec via Orval
```

## Local setup

Requires Node 20+ and [pnpm](https://pnpm.io) (`corepack enable`).

1. `cp .env.example .env` and fill in `DATABASE_URL` and your Clerk keys.
2. `pnpm install`
3. `pnpm db:push` — creates the schema in your Postgres database.
4. `pnpm dev:api` and, in another terminal, `pnpm dev:web`.

## Regenerating the API client

`packages/api-schema` and `packages/api-client` are generated, not hand-written.
After editing `packages/api-spec/openapi.yaml`, run:

```
pnpm --filter @workspace/api-spec run codegen
```

## Type checking & builds

- `pnpm typecheck` — type-checks every package and app.
- `pnpm build` — type-checks, then builds every app.

## Deploying (Vercel + a Node host)

`apps/web` is a static SPA (deploys to Vercel). `apps/api` is a long-running
Express server, not a set of serverless functions, so it needs a host that
runs Node processes — Railway, Render, and Fly.io all work with no code
changes.

**API** (Railway/Render/Fly):
- Root directory: `apps/api`
- Build command: `pnpm --filter @workspace/api run build`
- Start command: `pnpm --filter @workspace/api run start`
- Env vars: `DATABASE_URL`, `CLERK_SECRET_KEY`, `NODE_ENV=production`
- Note the URL the host gives you, e.g. `https://ledgerway-api.up.railway.app`.

**Web** (Vercel):
- Root directory: `apps/web`
- Framework preset: Vite (build command/output dir are auto-detected)
- Env vars: `VITE_CLERK_PUBLISHABLE_KEY`, and `VITE_API_BASE_URL` set to the
  API URL from the step above
- `vercel.json` in `apps/web` already rewrites all paths to `index.html`,
  which client-side routing (wouter) needs to avoid 404s on refresh.

**Database**: any hosted Postgres reachable from the API host (Neon, Supabase,
Railway Postgres, etc.) — run `pnpm db:push` against it once before first use.

