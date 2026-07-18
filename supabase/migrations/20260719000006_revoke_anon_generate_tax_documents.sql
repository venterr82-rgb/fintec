-- Security lint: generate_tax_documents was callable by the anon
-- (unauthenticated) role via RPC, as a SECURITY DEFINER function — meaning
-- anyone with just the public anon key could call it directly to insert
-- document-checklist rows against any guessed tax_case_id, no login
-- required. The only legitimate caller is the logged-in admin route
-- (src/app/api/tax-cases/route.ts), so anon access is revoked.

revoke execute on function public.generate_tax_documents(uuid) from anon;
