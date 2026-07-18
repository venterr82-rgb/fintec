-- Initial schema — table definitions.
--
-- Reconstructed from the live project (yersjklqaluntasvfwiu) via direct
-- Postgres introspection on 2026-07-19, since the original tables were
-- created directly in the Supabase dashboard/SQL editor and were never
-- captured in version control. This migration, together with
-- 20260719000002_rls_policies_functions_views.sql, is the first complete,
-- verified capture of the live schema (superseding the earlier
-- supabase/schema.sql, which was reconstructed only from PostgREST's
-- OpenAPI doc and was missing RLS/functions/views entirely).
--
-- Column names, types, defaults, and foreign keys below were confirmed
-- against pg_catalog on the live database, not guessed.

create extension if not exists pgcrypto;

-- =========================================================================
-- tenants
-- =========================================================================
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  logo_url text,
  primary_color text default '#1E3A5F',
  accent_color text default '#2E86AB',
  subscription_plan text default 'starter',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================================
-- users
-- id is expected to equal the corresponding auth.users.id (Supabase Auth
-- convention) — set explicitly at insert time, not auto-generated.
-- =========================================================================
create table users (
  id uuid primary key references auth.users(id),
  tenant_id uuid references tenants(id),
  email text not null,
  full_name text,
  role text not null,
  person_id uuid, -- soft reference to people.id; no DB-level FK on the live table
  avatar_url text,
  is_active boolean default true,
  last_login timestamptz,
  created_at timestamptz default now()
);

-- =========================================================================
-- people
-- =========================================================================
create table people (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  first_name text not null,
  second_name text,
  last_name text not null,
  id_number text,
  passport_number text,
  tax_number text,
  date_of_birth date,
  race_gender text,
  nationality text,
  country_of_origin text,
  email text,
  phone text,
  residential_address_line1 text,
  residential_address_line2 text,
  residential_city text,
  residential_province text,
  residential_postal_code text,
  residential_country text,
  has_portal_access boolean default false,
  user_id uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================================
-- companies
-- =========================================================================
create table companies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  name text not null,
  trade_name text,
  old_company_name text,
  registration_number text,
  old_registration_number text,
  tax_number text,
  vat_number text,
  paye_number text,
  uif_number text,
  uif_reference_number text,
  sdl_number text,
  compensation_fund_number text,
  enterprise_type text,
  industry text,
  status text default 'Active',
  bbbee_level text,
  public_interest_score integer,
  vat_category text,
  incorporation_date date,
  business_start_date date,
  financial_year_end text,
  registered_address_line1 text,
  registered_address_line2 text,
  registered_city text,
  registered_province text,
  registered_postal_code text,
  postal_address_line1 text,
  postal_address_line2 text,
  postal_city text,
  postal_province text,
  postal_postal_code text,
  phone text,
  email text,
  website text,
  auditor text,
  bank_details text,
  assigned_accountant_id uuid references users(id),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================================
-- company_people (directors / shareholders join table)
-- =========================================================================
create table company_people (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  company_id uuid references companies(id),
  person_id uuid references people(id),
  role text,
  shareholding_shares numeric,
  shareholding_type text,
  shareholding_percentage numeric,
  equity_percentage numeric,
  date_became_shareholder date,
  date_transferred date,
  appointment text,
  appointment_date date,
  resignation_date date,
  title text,
  occupation_level text,
  director_status text default 'Active',
  created_at timestamptz default now()
);

-- =========================================================================
-- compliance_items
-- =========================================================================
create table compliance_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  company_id uuid references companies(id),
  type text not null,
  period text,
  due_date date,
  status text default 'pending',
  submitted_date date,
  reference_number text,
  amount_due numeric,
  amount_paid numeric,
  penalty_amount numeric,
  assigned_to uuid references users(id),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================================
-- documents (general company/tenant documents — distinct from tax_documents)
-- =========================================================================
create table documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  company_id uuid references companies(id),
  name text not null,
  document_type text,
  folder text,
  description text,
  file_path text not null,
  file_name text,
  file_size bigint,
  file_type text,
  uploaded_by uuid references users(id),
  visibility text default 'internal',
  issue_date date,
  expiry_date date,
  tax_year text,
  created_at timestamptz default now()
);

-- =========================================================================
-- tasks
-- =========================================================================
create table tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  company_id uuid references companies(id),
  title text not null,
  description text,
  task_type text,
  assigned_to uuid references users(id),
  created_by uuid references users(id),
  due_date date,
  status text default 'pending',
  completed_at timestamptz,
  document_id uuid references documents(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================================
-- import_batches
-- =========================================================================
create table import_batches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  import_type text,
  file_name text,
  total_rows integer,
  success_rows integer,
  failed_rows integer,
  errors jsonb,
  imported_by uuid references users(id),
  status text default 'processing',
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- =========================================================================
-- tax_cases
-- =========================================================================
create table tax_cases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  person_id uuid references people(id),
  tax_year integer not null,
  period_label text,
  has_employment boolean default false,
  has_rental boolean default false,
  has_sole_prop boolean default false,
  has_partnership boolean default false,
  has_airbnb boolean default false,
  has_investments boolean default false,
  has_medical boolean default false,
  has_ra boolean default false,
  has_pension boolean default false,
  status text default 'awaiting_docs',
  taxable_income numeric,
  tax_liability numeric,
  paye_credits numeric,
  prov_tax_p1 numeric,
  prov_tax_p2 numeric,
  ra_deduction numeric,
  result_amount numeric,
  effective_rate numeric,
  current_ra_monthly numeric,
  suggested_ra_monthly numeric,
  ra_max_deductible numeric,
  prov_p1_due date,
  prov_p2_due date,
  accountant_note text,
  assigned_to uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================================
-- tax_documents (per-tax-case document checklist)
-- =========================================================================
create table tax_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  tax_case_id uuid references tax_cases(id),
  person_id uuid references people(id),
  document_type text not null,
  label text not null,
  tax_year integer,
  description text,
  required boolean default true,
  status text default 'outstanding',
  file_path text,
  file_name text,
  file_size bigint,
  uploaded_by uuid references users(id),
  uploaded_at timestamptz,
  reviewed_by uuid references users(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- =========================================================================
-- tax_income_history
-- =========================================================================
create table tax_income_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  person_id uuid references people(id),
  tax_year integer not null,
  taxable_income numeric,
  tax_liability numeric,
  effective_rate numeric,
  source text default 'manual',
  created_at timestamptz default now()
);

-- =========================================================================
-- activity_logs
-- =========================================================================
create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  user_id uuid references users(id),
  action text not null,
  entity text,
  entity_id uuid,
  entity_name text,
  details jsonb,
  ip_address text,
  created_at timestamptz default now()
);

-- =========================================================================
-- Payment / registration flow (added 2026-07-18)
-- =========================================================================
create table verified_payments (
  id uuid primary key default gen_random_uuid(),
  email text,
  amount numeric,
  yoco_payment_id text unique,
  used boolean default false,
  created_at timestamptz default now()
);

create table pending_checkouts (
  id uuid primary key default gen_random_uuid(),
  checkout_id text not null,
  email text not null,
  amount numeric,
  tier_name text,
  created_at timestamptz default now()
);

-- =========================================================================
-- Standard Supabase grants — access control is enforced entirely through
-- RLS (see 20260719000002), not through these grants. Confirmed live:
-- anon/authenticated/service_role all hold full table privileges
-- (arwdDxtm), matching Supabase's default template for the public schema.
-- =========================================================================
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;
