-- Repeatable employer slots for employment income, mirroring the
-- rental/business/airbnb/partnership pattern from the previous migration.

alter table tax_cases add column if not exists employers jsonb default '[]';
-- e.g. ["Discovery Health", "Previous Co (Jan-Mar 2025)"]

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

  -- Employment — one client-managed IRP5 slot per named employer.
  if v_case.has_employment then
    if jsonb_array_length(coalesce(v_case.employers, '[]'::jsonb)) = 0 then
      insert into public.tax_documents
        (tenant_id, tax_case_id, person_id, document_type, label, tax_year, description, uploaded_by_role)
      values (v_case.tenant_id, p_case_id, v_case.person_id,
        'IRP5', 'IRP5 / IT3(a) – ' || v_year, v_case.tax_year,
        'Employee tax certificate from your employer', 'client');
    else
      for v_name in select jsonb_array_elements_text(v_case.employers) loop
        insert into public.tax_documents
          (tenant_id, tax_case_id, person_id, document_type, label, tax_year, description, uploaded_by_role)
        values (v_case.tenant_id, p_case_id, v_case.person_id,
          'IRP5', 'IRP5 — ' || v_name || ' – ' || v_year, v_case.tax_year,
          'Employee tax certificate from your employer', 'client');
      end loop;
    end if;
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
