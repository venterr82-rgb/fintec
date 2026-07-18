# Setup runbook — deploying a new customer instance

This is a from-scratch checklist for standing up a fully separate copy of
this portal for a new customer (own Supabase project, own Vercel project,
own Yoco account, own Resend account — no shared infrastructure). Every
step marked **⚠ gotcha** cost real debugging time the first time through;
follow them exactly.

## 1. Supabase project

1. Create a new project at supabase.com.
2. Run the migrations in `supabase/migrations/` **in order** via the SQL
   editor, or `supabase db push` once linked:
   - `20260719000001_initial_schema.sql` — all tables + standard grants.
   - `20260719000002_rls_policies_functions_views.sql` — RLS policies,
     the `private` schema helper functions, `generate_tax_documents`,
     and both views. **Do not skip this file** — without it, every
     table is wide open to any authenticated user regardless of tenant,
     since RLS enforcement lives entirely here.
   - Any later-dated files in that folder (e.g. `leads`/checkout product
     discriminator additions) — check the folder for the current list.
3. Create the initial tenant row manually:
   ```sql
   insert into tenants (name, slug) values ('Customer Name', 'customer-slug');
   ```
   - **⚠ gotcha:** `/api/auth/register` picks a tenant via
     `.limit(1).single()` — it has no concept of "which tenant." This
     only works because each deployment has exactly one tenant row. If
     you ever run more than one tenant in a single project, this breaks
     silently (new registrations attach to whichever tenant row happens
     to sort first).
4. Create your own admin user directly (Authentication → Users → Add
   user, then insert a matching row into `public.users` with
   `role = 'admin'` and the correct `tenant_id`). There is no self-serve
   "create the first admin" flow in the app.
5. Note your project URL and both API keys (anon + service role) for
   step 4 below.

## 2. Vercel project

1. Import the repo (Add New → Project → connect the GitHub repo).
2. **⚠ gotcha — the big one:** check **Settings → General → Framework
   Preset**. If it shows **"Other"** instead of **"Next.js"**, every route
   will 404 in production even though the build succeeds — Vercel won't
   wire up Next.js's own routing on top of the build output. Set it to
   Next.js, leave Build/Output/Install command overrides off, save, and
   redeploy.
3. Add environment variables (Settings → Environment Variables) — see
   the full list in step 4.
4. Deploy once to confirm it builds, before touching the domain.

## 3. Custom domain + DNS

1. Settings → Domains → add the customer's domain, connect it to
   **Production**.
2. At the DNS host (Cloudflare or otherwise), add the CNAME Vercel gives
   you.
   - **⚠ gotcha (Cloudflare specifically):** set the record to **DNS
     only** (grey cloud), not **Proxied** (orange cloud). A proxied
     record breaks Vercel's own SSL/domain verification.
3. Settings → Deployment Protection → **Vercel Authentication**. If
   "Standard Protection" is selected, production custom domains are
   already excluded from the login gate — this is what you want for a
   public-facing portal. Don't need to touch this further unless you
   want previews open too (not recommended).

## 4. Environment variables (full list)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=              # https://<customer-domain>, no trailing slash
YOCO_SECRET_KEY=                  # Checkout API secret key (sk_live_... / sk_test_...)
YOCO_API_KEY=                     # SEPARATE personal API key — see step 5
YOCO_WEBHOOK_SECRET=              # printed by scripts/setup-yoco-webhook.ts — see step 5
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

Set these in **both** `.env.local` (for local dev) and Vercel's
Environment Variables (for production) — they are entirely separate and
easy to forget to sync.

## 5. Yoco

Two different credentials are needed, from two different places — do not
conflate them.

1. **`YOCO_SECRET_KEY`** — from the customer's Yoco Business Portal
   (business.yoco.com → Settings → API Keys). This authenticates
   `POST https://payments.yoco.com/api/checkouts` (the Checkout API,
   used by `/api/checkout` to start a payment).
2. **`YOCO_API_KEY`** — a *separate* personal API key from
   **developer.yoco.com/ui/**, created with `application/webhooks:read`
   and `application/webhooks:write` permissions. This is required for
   `api.yoco.com/v1/webhooks/subscriptions` (registering the webhook)
   and is **not interchangeable** with the Checkout API secret key — using
   the wrong one here produces a 401 that looks identical either way.
3. Set `YOCO_API_KEY` in `.env.local`, then run:
   ```
   node --env-file=.env.local --experimental-strip-types scripts/setup-yoco-webhook.ts
   ```
   This registers `https://<customer-domain>/api/webhooks/yoco` for the
   `payment.created` event and prints a `secret` — that's
   `YOCO_WEBHOOK_SECRET`. Save it in both `.env.local` and Vercel.
   - **⚠ gotcha:** the only real payment-succeeded event Yoco has is
     `payment.created` — `payment.succeeded` does not exist, despite
     being an intuitive guess.
   - **⚠ gotcha:** the webhook body itself is thin
     (`{ business_id, event_type, order_id, payment_id }`) — no email,
     no amount, no metadata. This is why `/api/checkout` writes to
     `pending_checkouts` at checkout-creation time and the webhook
     handler looks up the payer's email by `order_id` afterward, rather
     than trusting the webhook payload to contain it.

## 6. Resend

1. Verify the sending domain in Resend (Domains → Add Domain, add the
   DNS records it gives you).
2. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` (must be an address on
   the verified domain).
3. **Also** wire up Supabase's own auth emails (confirmations, password
   resets) through the same Resend account — Supabase's default mailer
   is rate-limited to a handful of emails/hour and is not viable in
   production:
   - Supabase Dashboard → Authentication → SMTP Settings → enable custom
     SMTP:
     - Host: `smtp.resend.com`
     - Port: `465`
     - Username: `resend` (literally that string, not an email address)
     - Password: your Resend API key
     - Sender email: same verified-domain address as `RESEND_FROM_EMAIL`
4. **⚠ gotcha:** also set Authentication → URL Configuration → **Site
   URL** to the real production domain. It defaults to
   `http://localhost:3000`, and confirmation/magic-link emails will
   silently point there instead of the live site until you change it.
   Add the production domain to **Redirect URLs** too.

## 7. Branding

1. Replace `public/logo.png` with the customer's logo. It should have a
   genuinely transparent background (verify with e.g. `PIL`/Preview's
   alpha channel, not just visual inspection — a dark "glow" in a
   preview can just be the viewer's own background showing through
   transparency, or can be a real baked-in background; check before
   assuming either way).
2. Edit every value in `src/lib/config/site.ts` — company name, contact
   info, pricing tiers, footer registration numbers, terms/privacy URLs.
   This is the single file that should need editing; if you find
   yourself hardcoding a new customer-specific string somewhere else,
   it probably belongs in this file instead.

## 8. Post-deploy smoke test

Run through this whole list on the live domain before calling it done —
several of these broke silently in earlier sessions and only surfaced
under an actual end-to-end test, not `tsc`/`next build`:

- [ ] Landing page loads on the real domain (not a Vercel platform 404)
- [ ] Pricing tier button opens the modal, submits, redirects to Yoco
- [ ] Complete a real (or sandbox) Yoco payment
- [ ] Registration email arrives, link points at the real domain with
      `?token=&tier=&amount=`
- [ ] `/register` completes, auto-logs in, lands on `/my-company`
- [ ] Sign out from the client portal actually clears the session
      (reload and confirm you're redirected to `/login`, not still
      authenticated)
- [ ] Log in as the admin account, land on `/dashboard`
- [ ] Sign out from the admin portal also actually works
- [ ] Create a tax case for a client from the admin side, confirm it
      shows up on that client's `/my-company` dashboard
