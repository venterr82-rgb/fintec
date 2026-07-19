-- Makes generate_tax_documents a real sync instead of an append-only insert.
-- Previously, re-running it (e.g. after editing a case's income profile or
-- entity name lists) re-inserted slots for entries that already existed —
-- there was no natural-key uniqueness check, only the random `id` PK. This
-- was made more likely to matter by multi-entity document slots
-- (20260719000012) and employer slots (20260719000013), and was never
-- actually exercised in practice because PUT /api/tax-cases never called
-- this function at all — editing a case's income profile silently left the
-- document checklist stale. Both are fixed here: the function now diffs
-- against existing rows by (document_type, label) instead of blindly
-- inserting, and the API route calls it on PUT too (see the accompanying
-- app-code change).
--
-- Sync semantics: a slot no longer implied by the case's current flags/name
-- lists is deleted ONLY if nothing has been uploaded to it yet
-- (status = 'outstanding') — an uploaded or approved document is never
-- silently discarded just because, say, a property was renamed.

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
  v_provided jsonb;
begin
  select * into v_case from public.tax_cases where id = p_case_id;
  v_year := v_case.tax_year::text;
  v_provided := coalesce(v_case.accountant_provided_types, '[]'::jsonb);

  create temporary table if not exists tmp_desired_docs (
    document_type text,
    label text,
    tax_year integer,
    description text,
    uploaded_by_role text
  ) on commit drop;
  -- truncate, not delete: this project's Supabase instance rejects any
  -- unqualified DELETE (SQLSTATE 21000, "DELETE requires a WHERE clause")
  -- — this was the actual statement raising that error live, not the
  -- tax_documents delete below (which does have a WHERE clause and was a
  -- red herring the first time this failed).
  truncate tmp_desired_docs;

  insert into tmp_desired_docs values (
    'ITA34', 'ITA34 – ' || (v_case.tax_year - 1)::text, v_case.tax_year - 1,
    'Previous year Notice of Assessment from SARS eFiling',
    case when v_provided ? 'ITA34' then 'accountant' else 'client' end
  );

  -- Employment — one client-managed IRP5 slot per named employer.
  if v_case.has_employment then
    if jsonb_array_length(coalesce(v_case.employers, '[]'::jsonb)) = 0 then
      insert into tmp_desired_docs values (
        'IRP5', 'IRP5 / IT3(a) – ' || v_year, v_case.tax_year,
        'Employee tax certificate from your employer',
        case when v_provided ? 'IRP5' then 'accountant' else 'client' end);
    else
      for v_name in select jsonb_array_elements_text(v_case.employers) loop
        insert into tmp_desired_docs values (
          'IRP5', 'IRP5 — ' || v_name || ' – ' || v_year, v_case.tax_year,
          'Employee tax certificate from your employer',
          case when v_provided ? 'IRP5' then 'accountant' else 'client' end);
      end loop;
    end if;
  end if;

  if v_case.has_medical then
    insert into tmp_desired_docs values (
      'Medical Aid Certificate', 'Medical Aid Certificate – ' || v_year, v_case.tax_year,
      'Annual tax certificate from your medical aid scheme',
      case when v_provided ? 'Medical Aid Certificate' then 'accountant' else 'client' end);
  end if;

  if v_case.has_ra then
    insert into tmp_desired_docs values (
      'RA Certificate', 'Retirement Annuity Certificate – ' || v_year, v_case.tax_year,
      'Annual contribution certificate from your RA provider (e.g. Allan Gray, Ninety One)',
      case when v_provided ? 'RA Certificate' then 'accountant' else 'client' end);
  end if;

  if v_case.has_investments then
    insert into tmp_desired_docs values (
      'Interest Certificate', 'Interest / IT3(b) Certificates – ' || v_year, v_case.tax_year,
      'Tax certificates from banks, unit trusts, and investment platforms',
      case when v_provided ? 'Interest Certificate' then 'accountant' else 'client' end);
  end if;

  -- Rental — one accountant-managed slot per named property.
  if v_case.has_rental then
    if jsonb_array_length(coalesce(v_case.rental_properties, '[]'::jsonb)) = 0 then
      insert into tmp_desired_docs values (
        'Rental Schedule', 'Rental Schedule – ' || v_year, v_case.tax_year,
        'Schedule of rental income received and all property expenses (rates, levies, insurance, interest, maintenance)',
        'accountant');
    else
      for v_name in select jsonb_array_elements_text(v_case.rental_properties) loop
        insert into tmp_desired_docs values (
          'Rental Schedule', 'Rental Schedule — ' || v_name || ' – ' || v_year, v_case.tax_year,
          'Schedule of rental income received and all property expenses (rates, levies, insurance, interest, maintenance)',
          'accountant');
      end loop;
    end if;
  end if;

  -- Sole proprietor / business income — one accountant-managed slot per business.
  if v_case.has_sole_prop then
    if jsonb_array_length(coalesce(v_case.sole_prop_businesses, '[]'::jsonb)) = 0 then
      insert into tmp_desired_docs values (
        'Sole Prop Financials', 'Business Income – ' || v_year, v_case.tax_year,
        'Annual income statement for your business / practice', 'accountant');
    else
      for v_name in select jsonb_array_elements_text(v_case.sole_prop_businesses) loop
        insert into tmp_desired_docs values (
          'Sole Prop Financials', 'Business Income — ' || v_name || ' – ' || v_year, v_case.tax_year,
          'Annual income statement for your business / practice', 'accountant');
      end loop;
    end if;
  end if;

  -- Airbnb — one accountant-managed slot per property.
  if v_case.has_airbnb then
    if jsonb_array_length(coalesce(v_case.airbnb_properties, '[]'::jsonb)) = 0 then
      insert into tmp_desired_docs values (
        'Airbnb Income', 'Airbnb Income – ' || v_year, v_case.tax_year,
        'Annual payout summary from Airbnb platform + property expense schedule', 'accountant');
    else
      for v_name in select jsonb_array_elements_text(v_case.airbnb_properties) loop
        insert into tmp_desired_docs values (
          'Airbnb Income', 'Airbnb Income — ' || v_name || ' – ' || v_year, v_case.tax_year,
          'Annual payout summary from Airbnb platform + property expense schedule', 'accountant');
      end loop;
    end if;
  end if;

  -- Partnership — one accountant-managed slot per partnership.
  if v_case.has_partnership then
    if jsonb_array_length(coalesce(v_case.partnership_names, '[]'::jsonb)) = 0 then
      insert into tmp_desired_docs values (
        'Partnership', 'Partnership Income – ' || v_year, v_case.tax_year,
        'Partnership financial statements and profit/loss allocation', 'accountant');
    else
      for v_name in select jsonb_array_elements_text(v_case.partnership_names) loop
        insert into tmp_desired_docs values (
          'Partnership', 'Partnership Income — ' || v_name || ' – ' || v_year, v_case.tax_year,
          'Partnership financial statements and profit/loss allocation', 'accountant');
      end loop;
    end if;
  end if;

  -- Drop slots that are no longer implied by the case's current flags/name
  -- lists — but only ones nothing has been uploaded to yet.
  delete from public.tax_documents td
  where td.tax_case_id = p_case_id
    and td.document_type in (
      'ITA34', 'IRP5', 'Medical Aid Certificate', 'RA Certificate', 'Interest Certificate',
      'Rental Schedule', 'Sole Prop Financials', 'Airbnb Income', 'Partnership'
    )
    and td.status = 'outstanding'
    and not exists (
      select 1 from tmp_desired_docs d
      where d.document_type = td.document_type and d.label = td.label
    );

  -- Insert only slots that don't already exist (by document_type + label) —
  -- this is what makes re-running the function idempotent.
  insert into public.tax_documents
    (tenant_id, tax_case_id, person_id, document_type, label, tax_year, description, uploaded_by_role)
  select
    v_case.tenant_id, p_case_id, v_case.person_id, d.document_type, d.label, d.tax_year, d.description, d.uploaded_by_role
  from tmp_desired_docs d
  where not exists (
    select 1 from public.tax_documents td
    where td.tax_case_id = p_case_id
      and td.document_type = d.document_type
      and td.label = d.label
  );
end;
$function$;
