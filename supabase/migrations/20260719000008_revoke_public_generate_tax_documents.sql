-- 20260719000006 revoked EXECUTE from the `anon` role specifically, but
-- verified live afterward that anon could still call the function — because
-- Postgres grants EXECUTE on a new function to the PUBLIC pseudo-role by
-- default, and every role (including anon) inherits from PUBLIC unless that
-- grant is revoked too. Revoking from a named role alone doesn't remove
-- access that's actually coming from PUBLIC.

revoke execute on function public.generate_tax_documents(uuid) from public;

-- Restore explicit access for the only two roles that should have it.
grant execute on function public.generate_tax_documents(uuid) to authenticated, service_role;
