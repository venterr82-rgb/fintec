@AGENTS.md

# Project state (updated 2026-07-19)

Fintec Group compliance/tax portal — Next.js 14 App Router + Supabase +
Yoco (payments) + Resend (email). Being evolved toward a white-label
product sold to other accounting firms; see `/for-firms` and
`src/lib/config/firms.ts` vs `src/lib/config/site.ts` (Fintec's own
tax-service branding — these two configs must stay separate).

**Infra:** Vercel project `fintec` (deploys `main` → `portal.fintecgroup.co.za`,
DNS via Cloudflare, DNS-only not proxied). Supabase project `yersjklqaluntasvfwiu`
(`eu-west-1`). GitHub `venterr82-rgb/fintec`. Full setup/gotcha runbook: `SETUP.md`.

**Database access constraints (important for any future schema work):**
- No Docker on this machine → `supabase db pull`/`db dump`/`db start` all fail.
- No direct Postgres/DB password → can't run DDL directly, even via a
  linked CLI session (the CLI auto-provisions a temporary read-only login
  role good enough for introspection, not writes).
- Working pattern: write migrations to `supabase/migrations/`, ask the
  user to run them in the Supabase SQL editor, then verify live via the
  service-role REST API (`/rest/v1/...`) or by minting a real user JWT
  via `/auth/v1/admin/generate_link` (no password needed) to test RLS as
  a specific non-admin user. Do not assume a migration file's existence
  means it's been applied — always confirm.
- `supabase/migrations/` is the current source of truth for schema
  (tables, RLS policies, `private` schema functions, views) — it was
  reconstructed from the live DB via direct pg_catalog introspection since
  none of it was ever in version control originally. Latest at time of
  writing: `20260719000006`. Check the directory for what's actually
  there before assuming this list is current.

**Recurring bug pattern — check for this first on any new "404" report:**
Several API route handlers were saved under the wrong filename (e.g.
`api_tax_cases.ts` instead of `route.ts`) — valid TypeScript, completely
inert as a Next.js route, since App Router only wires up a directory if
the file is literally named `route.ts`. Already fixed: `/api/auth/register`,
`/api/tax-cases`, `/api/tax-docs/status`, `/api/tax-docs/upload`. Check
`find src/app/api -type f | grep -v route.ts` if a new API 404 shows up.

**Middleware allowlist gotcha:** `src/middleware.ts` gates every route
behind a real session by default. Any new public-facing page or API route
(payment flows, webhooks, landing pages) must be added to `publicPaths`/
`publicApiPaths` there, or anonymous requests silently redirect to
`/login` (or 405, for POST routes). Bit us repeatedly with `/api/checkout`,
`/for-firms`, `/api/leads`.

**Known missing pages (linked to, never built, will 404 if clicked):**
`/companies/[id]/compliance`, `/companies/[id]/documents`.

**Test accounts:** `admin@fintecgroup.co.za` (admin), `venter.r@icloud.com`
(client — Reghardt's own account, used to verify RLS as a non-admin).

**Live payment keys:** `YOCO_SECRET_KEY` is `sk_live_...` — real money. Never
run a test checkout without explicit confirmation from the user.

**As of last session:** waiting on the user to independently verify a real
R1,500 Yoco checkout through `/for-firms` before starting the next planned
task (tenant-scoped branding — replacing the static `site.ts` with
per-tenant config pulled from the database).
