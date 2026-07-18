-- Fixes a privilege-escalation bug found during the Task 1 RLS extraction:
-- two separate `for all` policies on `users` ("own row", "tenant isolation")
-- were both PERMISSIVE and got OR'd together across every command,
-- including UPDATE and DELETE. Net effect: any authenticated user could
-- UPDATE or DELETE any other user row in the same tenant, including admin
-- rows — not just their own.
--
-- Fix: split by command. SELECT stays tenant-wide (staff/admin need to see
-- their team). INSERT is restricted to a user creating their own row only
-- (staff/admin creation goes through the service-role backend, which
-- bypasses RLS entirely — see src/app/api/auth/register/route.ts).
-- UPDATE/DELETE are restricted to: the user's own row, OR an admin acting
-- on a non-admin row within their own tenant. Admins cannot UPDATE/DELETE
-- other admins through this policy.

drop policy if exists "Users: own row" on users;
drop policy if exists "Users: tenant isolation" on users;

create policy "Users: select within tenant" on users
  for select
  using (tenant_id = private.get_user_tenant_id());

create policy "Users: insert own row" on users
  for insert
  with check (auth.uid() = id);

create policy "Users: update own row or admin manages non-admins" on users
  for update
  using (
    auth.uid() = id
    or (
      private.get_user_role() = 'admin'
      and tenant_id = private.get_user_tenant_id()
      and role <> 'admin'
    )
  );

create policy "Users: delete own row or admin manages non-admins" on users
  for delete
  using (
    auth.uid() = id
    or (
      private.get_user_role() = 'admin'
      and tenant_id = private.get_user_tenant_id()
      and role <> 'admin'
    )
  );
