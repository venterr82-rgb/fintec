-- Client onboarding wizard: SARS POA gate, banking details, tier tracking.

-- =========================================================================
-- Onboarding tracking on people
-- =========================================================================
alter table people add column onboarding_step integer default 1;
alter table people add column onboarding_complete boolean default false;
alter table people add column sars_poa_status text default 'not_started'; -- not_started | awaiting_authorisation | authorised
alter table people add column sars_poa_acknowledged_at timestamptz;
alter table people add column sars_added_at timestamptz;
alter table people add column sars_authorised_at timestamptz;
alter table people add column tier text; -- Basic | Standard | Premium

-- Existing clients (registered before this feature existed) already have
-- working portal access and no onboarding data to fill in — don't retroactively
-- lock them out of the portal behind a wizard they were never shown.
-- New registrations from here on start at onboarding_complete = false (the
-- column default) and go through the gate normally.
update people set onboarding_complete = true where has_portal_access = true;

-- =========================================================================
-- Banking details
-- =========================================================================
create table client_banking_details (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  person_id uuid references people(id),
  bank_name text,
  account_holder text,
  account_number text,
  account_type text,
  branch_code text,
  is_current boolean default true,
  confirmed_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table client_banking_details enable row level security;

create policy "Banking: select within tenant" on client_banking_details
  for select
  using (
    tenant_id = private.get_user_tenant_id()
    and (
      private.get_user_role() = any (array['admin','staff'])
      or person_id = private.get_user_person_id()
    )
  );

create policy "Banking: own row insert" on client_banking_details
  for insert
  with check (
    tenant_id = private.get_user_tenant_id()
    and (
      private.get_user_role() = any (array['admin','staff'])
      or person_id = private.get_user_person_id()
    )
  );

create policy "Banking: own row update" on client_banking_details
  for update
  using (
    tenant_id = private.get_user_tenant_id()
    and (
      private.get_user_role() = any (array['admin','staff'])
      or person_id = private.get_user_person_id()
    )
  );

-- =========================================================================
-- Tier tracking on payments, so /api/auth/register can set people.tier —
-- verified_payments previously dropped tier_name when the webhook copied
-- it over from pending_checkouts.
-- =========================================================================
alter table verified_payments add column tier_name text;

-- pending_checkouts needs a target person for tier-upgrade checkouts
-- (unlike the initial paid-registration flow, an upgrade happens for an
-- already-registered, already-logged-in client).
alter table pending_checkouts add column person_id uuid references people(id);

-- =========================================================================
-- Tighten people RLS: the existing "tenant isolation" policy was `for all`
-- with no ownership check, meaning any authenticated user (including a
-- client) could UPDATE/DELETE any other person's row in the tenant — same
-- category of gap as the earlier users-table and tax_documents fixes.
-- SELECT stays tenant-wide (staff need the People list; clients viewing a
-- shared company need to see co-director rows, not just their own).
-- =========================================================================
drop policy if exists "People: tenant isolation" on people;

create policy "People: select within tenant" on people
  for select
  using (tenant_id = private.get_user_tenant_id());

create policy "People: staff insert" on people
  for insert
  with check (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "People: update own row or staff" on people
  for update
  using (
    tenant_id = private.get_user_tenant_id()
    and (
      private.get_user_role() = any (array['admin','staff'])
      or id = private.get_user_person_id()
    )
  );

create policy "People: staff delete" on people
  for delete
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );
