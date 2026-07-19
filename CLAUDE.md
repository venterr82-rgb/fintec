@AGENTS.md

# Project state (updated 2026-07-19, session 2)

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
  means it's been applied — always confirm, and don't trust Supabase's
  lint-report dashboard to be real-time either (it lagged an actual fix
  once this session).
- `supabase/migrations/` is the current source of truth for schema
  (tables, RLS policies, `private` schema functions, views) — it was
  reconstructed from the live DB via direct pg_catalog introspection since
  none of it was ever in version control originally. Latest at time of
  writing: `20260719000012`. Check the directory for what's actually
  there before assuming this list is current.
- `REVOKE ... FROM anon` alone can be a no-op: Postgres grants EXECUTE on
  new functions to the `PUBLIC` pseudo-role by default, and `anon`
  inherits from `PUBLIC`. Revoking from the named role doesn't remove a
  grant that's actually coming from `PUBLIC` — revoke from `PUBLIC`
  directly, then re-grant explicitly to the roles that should have it.

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

**Storage bucket casing:** the real Supabase Storage bucket is named
`Documents` (capital D) — `storage.from('documents')` fails silently
against a bucket that doesn't exist under that name. Also, RLS on
`storage.objects` was never set up for this app's path conventions
(`tax/{tenant}/{person}/{year}/...`), so uploads/downloads go through
`/api/tax-docs/upload` and `/api/documents/signed-url` using the
service-role client with an explicit authorization check in code instead
of relying on storage RLS.

**Known missing pages (linked to, never built, will 404 if clicked):**
`/companies/[id]/compliance`, `/companies/[id]/documents`,
`/companies/[id]/edit`, `/tasks/new`.

**Test accounts:** `admin@fintecgroup.co.za` (admin), `venter.r@icloud.com`
(client — Reghardt's own account, used to verify RLS as a non-admin),
`dewaldlouw@hotmail.com` (client, Dewald Louw — has a populated tax case
with income lines/rebates, used for testing the tax dashboard).

**Live payment keys:** `YOCO_SECRET_KEY` is `sk_live_...` — real money. Never
run a test checkout without explicit confirmation from the user. The
Supabase CLI personal access token used earlier this session for direct
Postgres introspection was revoked by the user after use — don't assume
it's still valid; ask for a fresh one if that kind of access is needed
again (DDL still requires the real DB password regardless, which we've
never had — the CLI's temp login role is read-only).

## Features built this session (roughly chronological)

- Auth/session/middleware fixes, Yoco checkout + webhook (signature
  verification, event-type/endpoint corrections), `/for-firms` B2B page
  with its own lead-capture + setup-fee payment flow.
- **RLS audit**: recovered real policies via direct pg_catalog
  introspection (not just PostgREST's OpenAPI doc) and fixed two
  privilege-escalation bugs found this way — `users` and `people` both
  had `for all` policies with no ownership check, letting any
  authenticated user modify/delete any other row in the tenant. Both
  fixed to: SELECT tenant-wide, INSERT/UPDATE/DELETE restricted to own
  row or staff.
- **Tax income lines feature** (Phase 1 of a "Priority 1/2" work order):
  `tax_income_lines`/`tax_rebates` tables, admin inline editor with a
  searchable SARS-code combobox (`sars_codes` reference table), and a
  fully rebuilt client tax dashboard (`/my-company`) with a 5-year
  Recharts bar chart and a colour-coded income breakdown / tax
  calculation system (green=income, blue=tax-saving, red=tax owed,
  purple=refund, rose=owing, slate=subtotals) with a legend and
  plain-English captions.
- **Client onboarding wizard** (`/onboarding`, Priority 2): gated
  4-step flow — personal details + mandatory SARS Power-of-Attorney
  acknowledgement (blocks until an admin marks it authorised via a
  dashboard notice) → banking details → tier-locked document checklist
  with in-place tier-upgrade payments. New clients are routed here
  after registration; existing clients were backfilled to
  `onboarding_complete = true` so they weren't retroactively locked out.
- **People tier system**: `people.tier` (basic/standard/premium/custom,
  lowercase, CHECK-constrained — reconciled a real casing conflict with
  what the onboarding wizard had already been writing) + tier badge on
  the People list + a tier/engagement-description editor on the person
  detail page. `tierDocumentAccess.ts` maps tier → which document types
  are unlocked.
- **Multi-entity document slots**: `tax_cases` gained
  `rental_properties`/`sole_prop_businesses`/`partnership_names`/
  `airbnb_properties` jsonb arrays; `generate_tax_documents` now creates
  one labeled document slot per named property/business/partnership
  instead of one per income-type flag, tagged `uploaded_by_role =
  'accountant'` and hidden from client-facing checklists.
  **Known non-idempotency**: re-running generation after editing the
  name list re-inserts slots for entries that already exist too (no
  natural-key uniqueness constraint on `tax_documents` — was already
  true before this change, just more likely to matter now).

## As of end of this session

User has been testing live and reports most of it works. No specific
outstanding bug was flagged before context ran out — check with the user
directly for what (if anything) is still broken before assuming a clean
slate. The originally-planned "next task" (tenant-scoped branding,
replacing `site.ts` with per-tenant DB config) has not been started.
