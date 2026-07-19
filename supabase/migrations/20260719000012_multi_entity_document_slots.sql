-- Multiple document slots per income type, for clients with several
-- rental properties / businesses / Airbnb listings / partnerships.

alter table tax_cases add column rental_properties jsonb default '[]';
-- stores array of property names
-- e.g. ["Mooi Nooi 001800140029", "Seaspray Air BNB 001800170034",
--        "Winterland 001800140031", "Eureka"]

alter table tax_cases add column sole_prop_businesses jsonb default '[]';
-- e.g. ["Private Practice 001800140023", "Jumping Castels 004300140048"]

alter table tax_cases add column partnership_names jsonb default '[]';
-- e.g. ["D Louw Artist Partnership"]

-- Not in the original request's schema, but CHANGE 2 explicitly asks for the
-- same dynamic add-a-name UI for Airbnb ("Airbnb property 1: ... [+ Add
-- property]") — without a column, there'd be nowhere to store those names.
alter table tax_cases add column airbnb_properties jsonb default '[]';

alter table tax_income_lines add column if not exists entity_name text;
-- "Mooi Nooi 001800140029", "Private Practice", etc. — shown in the income
-- breakdown table alongside the SARS code.

-- Not in the original request's schema either, but required for CHANGE 3's
-- "uploaded_by_role = 'accountant', hidden from client checklist" — no such
-- concept existed on tax_documents before this.
alter table tax_documents add column if not exists uploaded_by_role text default 'client'
  check (uploaded_by_role in ('client', 'accountant'));

-- =========================================================================
-- private.generate_tax_documents — one slot per named property/business/
-- partnership instead of one per income-type flag. Falls back to a single
-- generic (unnamed) slot when the flag is set but the array is still empty,
-- so existing tax cases created before this feature (or a case where the
-- admin hasn't filled in names yet) don't silently lose their document
-- checklist entirely.
--
-- Known limitation carried over from the original function: there's no
-- natural-key uniqueness constraint on tax_documents (only the `id` PK), so
-- re-running this after the property/business list changes will insert
-- fresh rows for entries that already exist, not just new ones — it was
-- already not idempotent before this change (the original ON CONFLICT DO
-- NOTHING only guards the random `id`, never a real duplicate). Worth a
-- proper dedup pass if this becomes a real problem in practice.
-- =========================================================================
create or replace function private.generate_tax_documents(p_case_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_case public.tax_cases%rowtype;
  v_year text;
  v_name text;
begin
  select * into v_case from public.tax_cases where id = p_case_id;
  v_year := v_case.tax_year::text;

  insert into public.tax_documents
    (tenant_id, tax_case_id, person_id, document_type, label, tax_year, description, uploaded_by_role)
  values (
    v_case.tenant_id, p_case_id, v_case.person_id,
    'ITA34', 'ITA34 – ' || (v_case.tax_year - 1)::text,
    v_case.tax_year - 1,
    'Previous year Notice of Assessment from SARS eFiling',
    'client'
  );

  if v_case.has_employment then
    insert into public.tax_documents
      (tenant_id, tax_case_id, person_id, document_type, label, tax_year, description, uploaded_by_role)
    values (v_case.tenant_id, p_case_id, v_case.person_id,
      'IRP5', 'IRP5 / IT3(a) – ' || v_year, v_case.tax_year,
      'Employee tax certificate from your employer', 'client');
  end if;

  if v_case.has_medical then
    insert into public.tax_documents
      (tenant_id, tax_case_id, person_id, document_type, label, tax_year, description, uploaded_by_role)
    values (v_case.tenant_id, p_case_id, v_case.person_id,
      'Medical Aid Certificate', 'Medical Aid Certificate – ' || v_year, v_case.tax_year,
      'Annual tax certificate from your medical aid scheme', 'client');
  end if;

  if v_case.has_ra then
    insert into public.tax_documents
      (tenant_id, tax_case_id, person_id, document_type, label, tax_year, description, uploaded_by_role)
    values (v_case.tenant_id, p_case_id, v_case.person_id,
      'RA Certificate', 'Retirement Annuity Certificate – ' || v_year, v_case.tax_year,
      'Annual contribution certificate from your RA provider (e.g. Allan Gray, Ninety One)', 'client');
  end if;

  if v_case.has_investments then
    insert into public.tax_documents
      (tenant_id, tax_case_id, person_id, document_type, label, tax_year, description, uploaded_by_role)
    values (v_case.tenant_id, p_case_id, v_case.person_id,
      'Interest Certificate', 'Interest / IT3(b) Certificates – ' || v_year, v_case.tax_year,
      'Tax certificates from banks, unit trusts, and investment platforms', 'client');
  end if;

  -- Rental — one accountant-managed slot per named property.
  if v_case.has_rental then
    if jsonb_array_length(coalesce(v_case.rental_properties, '[]'::jsonb)) = 0 then
      insert into public.tax_documents
        (tenant_id, tax_case_id, person_id, document_type, label, tax_year, description, uploaded_by_role)
      values (v_case.tenant_id, p_case_id, v_case.person_id,
        'Rental Schedule', 'Rental Schedule – ' || v_year, v_case.tax_year,
        'Schedule of rental income received and all property expenses (rates, levies, insurance, interest, maintenance)',
        'accountant');
    else
      for v_name in select jsonb_array_elements_text(v_case.rental_properties) loop
        insert into public.tax_documents
          (tenant_id, tax_case_id, person_id, document_type, label, tax_year, description, uploaded_by_role)
        values (v_case.tenant_id, p_case_id, v_case.person_id,
          'Rental Schedule', 'Rental Schedule — ' || v_name || ' – ' || v_year, v_case.tax_year,
          'Schedule of rental income received and all property expenses (rates, levies, insurance, interest, maintenance)',
          'accountant');
      end loop;
    end if;
  end if;

  -- Sole proprietor / business income — one accountant-managed slot per business.
  if v_case.has_sole_prop then
    if jsonb_array_length(coalesce(v_case.sole_prop_businesses, '[]'::jsonb)) = 0 then
      insert into public.tax_documents
        (tenant_id, tax_case_id, person_id, document_type, label, tax_year, description, uploaded_by_role)
      values (v_case.tenant_id, p_case_id, v_case.person_id,
        'Sole Prop Financials', 'Business Income – ' || v_year, v_case.tax_year,
        'Annual income statement for your business / practice', 'accountant');
    else
      for v_name in select jsonb_array_elements_text(v_case.sole_prop_businesses) loop
        insert into public.tax_documents
          (tenant_id, tax_case_id, person_id, document_type, label, tax_year, description, uploaded_by_role)
        values (v_case.tenant_id, p_case_id, v_case.person_id,
          'Sole Prop Financials', 'Business Income — ' || v_name || ' – ' || v_year, v_case.tax_year,
          'Annual income statement for your business / practice', 'accountant');
      end loop;
    end if;
  end if;

  -- Airbnb — one accountant-managed slot per property.
  if v_case.has_airbnb then
    if jsonb_array_length(coalesce(v_case.airbnb_properties, '[]'::jsonb)) = 0 then
      insert into public.tax_documents
        (tenant_id, tax_case_id, person_id, document_type, label, tax_year, description, uploaded_by_role)
      values (v_case.tenant_id, p_case_id, v_case.person_id,
        'Airbnb Income', 'Airbnb Income – ' || v_year, v_case.tax_year,
        'Annual payout summary from Airbnb platform + property expense schedule', 'accountant');
    else
      for v_name in select jsonb_array_elements_text(v_case.airbnb_properties) loop
        insert into public.tax_documents
          (tenant_id, tax_case_id, person_id, document_type, label, tax_year, description, uploaded_by_role)
        values (v_case.tenant_id, p_case_id, v_case.person_id,
          'Airbnb Income', 'Airbnb Income — ' || v_name || ' – ' || v_year, v_case.tax_year,
          'Annual payout summary from Airbnb platform + property expense schedule', 'accountant');
      end loop;
    end if;
  end if;

  -- Partnership — one accountant-managed slot per partnership.
  if v_case.has_partnership then
    if jsonb_array_length(coalesce(v_case.partnership_names, '[]'::jsonb)) = 0 then
      insert into public.tax_documents
        (tenant_id, tax_case_id, person_id, document_type, label, tax_year, description, uploaded_by_role)
      values (v_case.tenant_id, p_case_id, v_case.person_id,
        'Partnership', 'Partnership Income – ' || v_year, v_case.tax_year,
        'Partnership financial statements and profit/loss allocation', 'accountant');
    else
      for v_name in select jsonb_array_elements_text(v_case.partnership_names) loop
        insert into public.tax_documents
          (tenant_id, tax_case_id, person_id, document_type, label, tax_year, description, uploaded_by_role)
        values (v_case.tenant_id, p_case_id, v_case.person_id,
          'Partnership', 'Partnership Income — ' || v_name || ' – ' || v_year, v_case.tax_year,
          'Partnership financial statements and profit/loss allocation', 'accountant');
      end loop;
    end if;
  end if;
end;
$function$;

-- Public wrapper is unchanged — still just delegates. Re-stated here only
-- because CREATE OR REPLACE on the private function above doesn't affect it.
create or replace function public.generate_tax_documents(p_case_id uuid)
returns void
language sql
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select private.generate_tax_documents(p_case_id);
$function$;
