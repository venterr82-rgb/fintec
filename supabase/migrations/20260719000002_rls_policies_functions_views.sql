-- Row Level Security, helper functions, and views.
--
-- Recovered 2026-07-19 via direct Postgres introspection against the live
-- project (pg_policies, pg_proc, pg_get_functiondef, pg_views) — this is
-- the piece that PostgREST's OpenAPI schema (used for the earlier
-- supabase/schema.sql) cannot expose at all. Every policy `qual` and view
-- definition below is copied verbatim from the live database, not
-- reconstructed by guesswork.
--
-- Confirmed at recovery time:
--   - 0 triggers exist anywhere in the public schema. update_updated_at()
--     is defined but not bound to any table — it is currently dead code,
--     not an active auto-updating trigger. generate_tax_documents is
--     invoked via `supabase.rpc('generate_tax_documents', ...)` from
--     src/app/api/tax-cases/api_tax_cases.ts after creating a tax case —
--     also not a trigger.
--   - relforcerowsecurity is false on every table (RLS applies to normal
--     roles; the table owner / service_role, which has BYPASSRLS, is
--     unaffected either way).

-- =========================================================================
-- private schema — helper functions, not exposed via PostgREST (no USAGE
-- grant to anon/authenticated, confirmed via has_schema_privilege).
-- =========================================================================
create schema if not exists private;
revoke all on schema private from public;

create or replace function private.get_user_tenant_id()
returns uuid
language sql
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select tenant_id from public.users where id = auth.uid()
$function$;

create or replace function private.get_user_role()
returns text
language sql
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select role from public.users where id = auth.uid()
$function$;

create or replace function private.get_user_person_id()
returns uuid
language sql
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select person_id from public.users where id = auth.uid()
$function$;

create or replace function private.generate_tax_documents(p_case_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_case public.tax_cases%rowtype;
  v_year text;
begin
  select * into v_case from public.tax_cases where id = p_case_id;
  v_year := v_case.tax_year::text;

  -- Always: previous ITA34
  insert into public.tax_documents
    (tenant_id, tax_case_id, person_id, document_type, label, tax_year, description)
  values (
    v_case.tenant_id, p_case_id, v_case.person_id,
    'ITA34', 'ITA34 – ' || (v_case.tax_year - 1)::text,
    v_case.tax_year - 1,
    'Previous year Notice of Assessment from SARS eFiling'
  ) on conflict do nothing;

  if v_case.has_employment then
    insert into public.tax_documents
      (tenant_id, tax_case_id, person_id, document_type, label, tax_year, description)
    values (v_case.tenant_id, p_case_id, v_case.person_id,
      'IRP5', 'IRP5 / IT3(a) – ' || v_year, v_case.tax_year,
      'Employee tax certificate from your employer')
    on conflict do nothing;
  end if;

  if v_case.has_medical then
    insert into public.tax_documents
      (tenant_id, tax_case_id, person_id, document_type, label, tax_year, description)
    values (v_case.tenant_id, p_case_id, v_case.person_id,
      'Medical Aid Certificate', 'Medical Aid Certificate – ' || v_year, v_case.tax_year,
      'Annual tax certificate from your medical aid scheme')
    on conflict do nothing;
  end if;

  if v_case.has_ra then
    insert into public.tax_documents
      (tenant_id, tax_case_id, person_id, document_type, label, tax_year, description)
    values (v_case.tenant_id, p_case_id, v_case.person_id,
      'RA Certificate', 'Retirement Annuity Certificate – ' || v_year, v_case.tax_year,
      'Annual contribution certificate from your RA provider (e.g. Allan Gray, Ninety One)')
    on conflict do nothing;
  end if;

  if v_case.has_rental then
    insert into public.tax_documents
      (tenant_id, tax_case_id, person_id, document_type, label, tax_year, description)
    values (v_case.tenant_id, p_case_id, v_case.person_id,
      'Rental Schedule', 'Rental Income & Expense Schedule – ' || v_year, v_case.tax_year,
      'Schedule of rental income received and all property expenses (rates, levies, insurance, interest, maintenance)')
    on conflict do nothing;
  end if;

  if v_case.has_sole_prop then
    insert into public.tax_documents
      (tenant_id, tax_case_id, person_id, document_type, label, tax_year, description)
    values (v_case.tenant_id, p_case_id, v_case.person_id,
      'Sole Prop Financials', 'Business Income & Expense Schedule – ' || v_year, v_case.tax_year,
      'Annual income statement for your business / practice')
    on conflict do nothing;
  end if;

  if v_case.has_airbnb then
    insert into public.tax_documents
      (tenant_id, tax_case_id, person_id, document_type, label, tax_year, description)
    values (v_case.tenant_id, p_case_id, v_case.person_id,
      'Airbnb Income', 'Airbnb Income Summary – ' || v_year, v_case.tax_year,
      'Annual payout summary from Airbnb platform + property expense schedule')
    on conflict do nothing;
  end if;

  if v_case.has_partnership then
    insert into public.tax_documents
      (tenant_id, tax_case_id, person_id, document_type, label, tax_year, description)
    values (v_case.tenant_id, p_case_id, v_case.person_id,
      'Partnership', 'Partnership Income Schedule – ' || v_year, v_case.tax_year,
      'Partnership financial statements and profit/loss allocation')
    on conflict do nothing;
  end if;

  if v_case.has_investments then
    insert into public.tax_documents
      (tenant_id, tax_case_id, person_id, document_type, label, tax_year, description)
    values (v_case.tenant_id, p_case_id, v_case.person_id,
      'Interest Certificate', 'Interest / IT3(b) Certificates – ' || v_year, v_case.tax_year,
      'Tax certificates from banks, unit trusts, and investment platforms')
    on conflict do nothing;
  end if;
end;
$function$;

-- Public wrapper — this is what the app actually calls via
-- supabase.rpc('generate_tax_documents', { p_case_id }).
create or replace function public.generate_tax_documents(p_case_id uuid)
returns void
language sql
set search_path to 'public', 'pg_temp'
as $function$
  select private.generate_tax_documents(p_case_id);
$function$;

-- Defined but currently unused (no triggers reference it) — kept for
-- fidelity with the live database. Wire it up with
-- `create trigger ... before update on <table> for each row execute
-- function public.update_updated_at();` per table if/when you want
-- automatic updated_at maintenance instead of the app setting it manually.
create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- =========================================================================
-- Row Level Security
-- =========================================================================
alter table tenants enable row level security;
alter table users enable row level security;
alter table people enable row level security;
alter table companies enable row level security;
alter table company_people enable row level security;
alter table compliance_items enable row level security;
alter table documents enable row level security;
alter table tasks enable row level security;
alter table import_batches enable row level security;
alter table tax_cases enable row level security;
alter table tax_documents enable row level security;
alter table tax_income_history enable row level security;
alter table activity_logs enable row level security;
alter table verified_payments enable row level security;
alter table pending_checkouts enable row level security;

-- --- tenants ---
create policy "Tenants: read own row" on tenants
  for select
  using (id = private.get_user_tenant_id());

-- --- users ---
create policy "Users: own row" on users
  for all
  using (auth.uid() = id);

create policy "Users: tenant isolation" on users
  for all
  using (tenant_id = private.get_user_tenant_id());

-- --- people ---
create policy "People: tenant isolation" on people
  for all
  using (tenant_id = private.get_user_tenant_id());

-- --- companies ---
create policy "Companies: tenant isolation" on companies
  for all
  using (tenant_id = private.get_user_tenant_id());

create policy "Companies: client sees own companies" on companies
  for select
  using (
    private.get_user_role() = any (array['admin','staff'])
    or exists (
      select 1 from company_people cp
      where cp.company_id = companies.id
        and cp.person_id = private.get_user_person_id()
        and cp.tenant_id = private.get_user_tenant_id()
    )
  );

-- --- company_people ---
create policy "Company_people: tenant isolation" on company_people
  for all
  using (tenant_id = private.get_user_tenant_id());

-- --- compliance_items ---
create policy "Compliance: staff sees all" on compliance_items
  for all
  using (
    tenant_id = private.get_user_tenant_id()
    and (
      private.get_user_role() = any (array['admin','staff'])
      or exists (
        select 1 from company_people cp
        where cp.company_id = compliance_items.company_id
          and cp.person_id = private.get_user_person_id()
      )
    )
  );

-- --- documents ---
create policy "Documents: tenant isolation" on documents
  for all
  using (tenant_id = private.get_user_tenant_id());

create policy "Documents: client visibility" on documents
  for select
  using (
    tenant_id = private.get_user_tenant_id()
    and (
      private.get_user_role() = any (array['admin','staff'])
      or (
        visibility = any (array['client','both'])
        and exists (
          select 1 from company_people cp
          where cp.company_id = documents.company_id
            and cp.person_id = private.get_user_person_id()
        )
      )
    )
  );

-- --- tasks ---
create policy "Tasks: tenant isolation" on tasks
  for all
  using (tenant_id = private.get_user_tenant_id());

-- --- import_batches ---
create policy "Imports: staff only" on import_batches
  for all
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

-- --- tax_cases ---
create policy "Tax cases: tenant isolation" on tax_cases
  for all
  using (tenant_id = private.get_user_tenant_id());

-- --- tax_documents ---
create policy "Tax docs: tenant isolation" on tax_documents
  for all
  using (tenant_id = private.get_user_tenant_id());

-- --- tax_income_history ---
create policy "Income history: tenant isolation" on tax_income_history
  for all
  using (tenant_id = private.get_user_tenant_id());

-- --- activity_logs ---
create policy "Logs: staff only" on activity_logs
  for all
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

-- --- verified_payments / pending_checkouts ---
-- Deny-all for `authenticated`; no policy exists for `anon` either, so
-- RLS's default-deny applies there too. Only service_role (BYPASSRLS)
-- can touch these tables — matches every query in the codebase, which
-- always uses the service-role admin client for both.
create policy "verified_payments: service role only" on verified_payments
  for all
  to authenticated
  using (false);

create policy "pending_checkouts: service role only" on pending_checkouts
  for all
  to authenticated
  using (false);

-- =========================================================================
-- Views
-- =========================================================================
create or replace view upcoming_compliance as
select
  ci.id,
  ci.tenant_id,
  ci.company_id,
  ci.type,
  ci.period,
  ci.due_date,
  ci.status,
  ci.submitted_date,
  ci.reference_number,
  ci.amount_due,
  ci.amount_paid,
  ci.penalty_amount,
  ci.assigned_to,
  ci.notes,
  ci.created_at,
  ci.updated_at,
  c.name as company_name,
  c.registration_number,
  (ci.due_date - current_date) as days_until_due
from compliance_items ci
join companies c on c.id = ci.company_id
where ci.status = any (array['pending', 'overdue'])
  and ci.due_date >= (current_date - interval '7 days')
  and ci.due_date <= (current_date + interval '60 days')
order by ci.due_date;

create or replace view company_compliance_summary as
select
  c.id as company_id,
  c.name as company_name,
  c.tenant_id,
  count(*) filter (where ci.status = 'pending') as pending_count,
  count(*) filter (where ci.status = 'overdue') as overdue_count,
  count(*) filter (where ci.status = 'submitted') as submitted_count,
  min(ci.due_date) filter (where ci.status = 'pending') as next_due_date
from companies c
left join compliance_items ci on ci.company_id = c.id
group by c.id, c.name, c.tenant_id;
