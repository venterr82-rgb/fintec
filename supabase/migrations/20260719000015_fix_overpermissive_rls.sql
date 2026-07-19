-- Same privilege-escalation class already found and fixed on `users`/`people`
-- (see 20260719000004) is still present on companies, company_people,
-- documents, tax_cases, tax_documents, tasks, and tax_income_history: each
-- has a single "for all using (tenant_id = tenant)" policy with no
-- role/ownership restriction. Postgres OR's multiple policies for the same
-- command together, so even where a *stricter* SELECT-only policy also
-- exists (e.g. "Companies: client sees own companies"), the permissive
-- FOR ALL policy alone still authorizes UPDATE/DELETE — and for tables with
-- no second policy at all (tax_cases, tax_documents, tasks,
-- tax_income_history), it authorizes SELECT of every other client's data
-- too, not just UPDATE/DELETE.
--
-- Net effect being closed here: today, any authenticated user — including
-- role 'client' — can read, update, or delete any row of these tables
-- within their own tenant via a direct REST call, regardless of ownership.
-- This was previously masked in the UI only, since (portal)/layout.tsx had
-- no role check either (fixed separately) — but RLS, not page-level
-- routing, is the actual security boundary and needed fixing regardless.

-- --- companies: staff-only write, existing SELECT policies untouched ---
drop policy if exists "Companies: tenant isolation" on companies;

create policy "Companies: staff sees all" on companies
  for select
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );
-- "Companies: client sees own companies" (existing) still covers client SELECT.

create policy "Companies: staff write" on companies
  for insert
  with check (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Companies: staff update" on companies
  for update
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Companies: staff delete" on companies
  for delete
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

-- --- company_people: staff full access; client may read their own link ---
drop policy if exists "Company_people: tenant isolation" on company_people;

create policy "Company_people: staff sees all" on company_people
  for select
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Company_people: client sees own link" on company_people
  for select
  using (
    tenant_id = private.get_user_tenant_id()
    and person_id = private.get_user_person_id()
  );

create policy "Company_people: staff write" on company_people
  for insert
  with check (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Company_people: staff update" on company_people
  for update
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Company_people: staff delete" on company_people
  for delete
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

-- --- documents: staff-only write; existing "client visibility" SELECT kept ---
drop policy if exists "Documents: tenant isolation" on documents;

create policy "Documents: staff sees all" on documents
  for select
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );
-- "Documents: client visibility" (existing) still covers client SELECT.

create policy "Documents: staff write" on documents
  for insert
  with check (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Documents: staff update" on documents
  for update
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Documents: staff delete" on documents
  for delete
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

-- --- compliance_items: keep existing broad SELECT, restrict writes to staff ---
drop policy if exists "Compliance: staff sees all" on compliance_items;

create policy "Compliance: select" on compliance_items
  for select
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

create policy "Compliance: staff write" on compliance_items
  for insert
  with check (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Compliance: staff update" on compliance_items
  for update
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Compliance: staff delete" on compliance_items
  for delete
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

-- --- tasks: internal-only, no client access at all ---
drop policy if exists "Tasks: tenant isolation" on tasks;

create policy "Tasks: staff only" on tasks
  for all
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

-- --- tax_cases: staff sees/writes all; client reads only their own case ---
drop policy if exists "Tax cases: tenant isolation" on tax_cases;

create policy "Tax cases: staff sees all" on tax_cases
  for select
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Tax cases: client sees own" on tax_cases
  for select
  using (
    tenant_id = private.get_user_tenant_id()
    and person_id = private.get_user_person_id()
  );

create policy "Tax cases: staff write" on tax_cases
  for insert
  with check (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Tax cases: staff update" on tax_cases
  for update
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Tax cases: staff delete" on tax_cases
  for delete
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

-- --- tax_documents: staff sees/writes all; client reads only their own docs ---
-- (Client uploads/status changes go through the service-role API routes,
-- which already do their own ownership check and bypass RLS entirely — this
-- only governs direct anon/authenticated REST access.)
drop policy if exists "Tax docs: tenant isolation" on tax_documents;

create policy "Tax docs: staff sees all" on tax_documents
  for select
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Tax docs: client sees own" on tax_documents
  for select
  using (
    tenant_id = private.get_user_tenant_id()
    and person_id = private.get_user_person_id()
  );

create policy "Tax docs: staff write" on tax_documents
  for insert
  with check (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Tax docs: staff update" on tax_documents
  for update
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Tax docs: staff delete" on tax_documents
  for delete
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

-- --- tax_income_history: staff sees/writes all; client reads only their own ---
drop policy if exists "Income history: tenant isolation" on tax_income_history;

create policy "Income history: staff sees all" on tax_income_history
  for select
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Income history: client sees own" on tax_income_history
  for select
  using (
    tenant_id = private.get_user_tenant_id()
    and person_id = private.get_user_person_id()
  );

create policy "Income history: staff write" on tax_income_history
  for insert
  with check (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Income history: staff update" on tax_income_history
  for update
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Income history: staff delete" on tax_income_history
  for delete
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );
