-- Per-tax-case income line detail and rebates, matching the accountant's
-- Excel structure (SARS code, description, gross/exemption/taxable amounts).

create table tax_income_lines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  tax_case_id uuid references tax_cases(id) on delete cascade,
  sort_order integer default 0,
  sars_code text,           -- 4201, 3601, 4210, 2930, etc.
  description text,         -- "Local Interest", "Private Practice 001800140023"
  calculated numeric,       -- gross amount
  exemption_expenses numeric, -- negative = deduction
  taxable_amount numeric,   -- net taxable
  line_type text default 'income', -- income / deduction / rebate
  created_at timestamptz default now()
);

create table tax_rebates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  tax_case_id uuid references tax_cases(id) on delete cascade,
  description text,         -- "Primary rebate", "Med Aid credit", "Additional Med Exp"
  amount numeric,           -- negative values
  sort_order integer default 0
);

alter table tax_income_lines enable row level security;
alter table tax_rebates enable row level security;

-- SELECT: staff see everything in their tenant; clients see only their own
-- tax case's lines (matches the tightened tax_documents access model from
-- the earlier RLS fix, since these tables have the same shape of concern).
create policy "Income lines: select within tenant" on tax_income_lines
  for select
  using (
    tenant_id = private.get_user_tenant_id()
    and (
      private.get_user_role() = any (array['admin','staff'])
      or exists (
        select 1 from tax_cases tc
        where tc.id = tax_income_lines.tax_case_id
          and tc.person_id = private.get_user_person_id()
      )
    )
  );

create policy "Rebates: select within tenant" on tax_rebates
  for select
  using (
    tenant_id = private.get_user_tenant_id()
    and (
      private.get_user_role() = any (array['admin','staff'])
      or exists (
        select 1 from tax_cases tc
        where tc.id = tax_rebates.tax_case_id
          and tc.person_id = private.get_user_person_id()
      )
    )
  );

-- Write access: staff only — these are accountant-maintained figures, not
-- client-editable.
create policy "Income lines: staff manage" on tax_income_lines
  for insert
  with check (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Income lines: staff update" on tax_income_lines
  for update
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Income lines: staff delete" on tax_income_lines
  for delete
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Rebates: staff manage" on tax_rebates
  for insert
  with check (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Rebates: staff update" on tax_rebates
  for update
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Rebates: staff delete" on tax_rebates
  for delete
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );
