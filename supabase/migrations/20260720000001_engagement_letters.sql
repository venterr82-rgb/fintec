-- Engagement letter auto-generation: staff generate a PDF from client/company
-- profile data (two templates — individual and company, based on the real
-- Fintec Power Automate mail-merge templates), email it via Resend, and the
-- client uploads the signed copy back through their portal.
--
-- person_id is always the "portal owner" who can see/upload against this
-- letter — for an individual letter that's the client themself; for a
-- company letter it's whichever director/contact staff designates when
-- generating it (there's no separate company-login concept in this app, so
-- this reuses the existing person-scoped client portal instead of building
-- a second one). company_id is set only for company-type letters, purely
-- for display/reference.

create table engagement_letters (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  letter_type text not null check (letter_type in ('individual', 'company')),
  person_id uuid references people(id),
  company_id uuid references companies(id),
  reference_no text,
  engagement_date date not null default current_date,
  fields jsonb not null default '{}',
  -- snapshot of every merge-field value used to generate the PDF, for audit
  -- / re-print — the underlying person/company record can change afterward.
  status text not null default 'draft' check (status in ('draft', 'sent', 'signed')),
  file_path text,
  file_name text,
  sent_to_email text,
  sent_at timestamptz,
  signed_file_path text,
  signed_file_name text,
  signed_at timestamptz,
  created_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table engagement_letters enable row level security;

create policy "Engagement letters: staff sees all" on engagement_letters
  for select
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Engagement letters: client sees own" on engagement_letters
  for select
  using (
    tenant_id = private.get_user_tenant_id()
    and person_id = private.get_user_person_id()
    and status in ('sent', 'signed')
    -- a draft not yet sent isn't visible to the client — nothing to act on yet.
  );

create policy "Engagement letters: staff write" on engagement_letters
  for insert
  with check (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Engagement letters: staff update" on engagement_letters
  for update
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

create policy "Engagement letters: staff delete" on engagement_letters
  for delete
  using (
    tenant_id = private.get_user_tenant_id()
    and private.get_user_role() = any (array['admin','staff'])
  );

-- Client-facing status/signed-copy updates go through a service-role API
-- route (mirroring tax-docs/upload's pattern) with an explicit ownership
-- check in code, not through RLS directly — so no client UPDATE policy here.
