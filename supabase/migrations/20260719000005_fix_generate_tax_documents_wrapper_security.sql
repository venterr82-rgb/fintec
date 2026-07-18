-- public.generate_tax_documents was missing SECURITY DEFINER, so it ran
-- with the CALLER's privileges — and no role, including service_role, has
-- USAGE on the `private` schema by design (confirmed via has_schema_privilege
-- during the Task 1 RLS extraction). Every call to
-- supabase.rpc('generate_tax_documents', ...) has therefore been failing
-- with "permission denied for schema private" — meaning the tax-document
-- checklist has never actually been auto-generated for any tax case
-- created through the app, going all the way back before this session.
--
-- Fix: match the inner private function's own security model.

create or replace function public.generate_tax_documents(p_case_id uuid)
returns void
language sql
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select private.generate_tax_documents(p_case_id);
$function$;
