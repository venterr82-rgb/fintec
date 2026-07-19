import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { lintRlsPolicies, type PolicyViolation } from './lintRlsPolicies'

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../supabase/migrations')

function loadMigrations() {
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .map(name => ({ name, content: fs.readFileSync(path.join(MIGRATIONS_DIR, name), 'utf8') }))
}

function formatViolation(v: PolicyViolation): string {
  return `  [${v.table}] "${v.policyName}" (${v.command}, from ${v.sourceFile})\n    using: ${v.body.replace(/\s+/g, ' ')}`
}

describe('RLS policy lint — real migrations', () => {
  it('has no UPDATE/DELETE policy scoped by tenant_id alone with no role/ownership check', () => {
    const violations = lintRlsPolicies(loadMigrations())
    if (violations.length > 0) {
      const report = violations.map(formatViolation).join('\n')
      throw new Error(
        `Found ${violations.length} over-permissive RLS policy(ies) — this is the exact bug class ` +
        `already exploited and fixed twice this project (20260719000004, 20260719000015). ` +
        `Any authenticated user in the tenant, including role 'client', could mutate/delete rows ` +
        `they don't own via these policies:\n${report}`
      )
    }
    expect(violations).toHaveLength(0)
  })
})

describe('lintRlsPolicies (unit)', () => {
  it('flags a bare tenant_id policy on UPDATE and DELETE', () => {
    const violations = lintRlsPolicies([{
      name: '001.sql',
      content: `create policy "X: tenant isolation" on widgets for all using (tenant_id = private.get_user_tenant_id());`,
    }])
    const commands = violations.map(v => v.command).sort()
    expect(commands).toEqual(['delete', 'update'])
  })

  it('does not flag a policy scoped by role', () => {
    const violations = lintRlsPolicies([{
      name: '001.sql',
      content: `create policy "X: staff update" on widgets for update using (tenant_id = private.get_user_tenant_id() and private.get_user_role() = any (array['admin','staff']));`,
    }])
    expect(violations).toHaveLength(0)
  })

  it('does not flag a policy scoped by ownership (person_id)', () => {
    const violations = lintRlsPolicies([{
      name: '001.sql',
      content: `create policy "X: own row" on widgets for delete using (tenant_id = private.get_user_tenant_id() and person_id = private.get_user_person_id());`,
    }])
    expect(violations).toHaveLength(0)
  })

  it('respects a later migration dropping and replacing an unsafe policy', () => {
    const violations = lintRlsPolicies([
      {
        name: '001.sql',
        content: `create policy "X: tenant isolation" on widgets for all using (tenant_id = private.get_user_tenant_id());`,
      },
      {
        name: '002.sql',
        content: `
          drop policy if exists "X: tenant isolation" on widgets;
          create policy "X: staff update" on widgets for update using (private.get_user_role() = any (array['admin','staff']));
          create policy "X: staff delete" on widgets for delete using (private.get_user_role() = any (array['admin','staff']));
        `,
      },
    ])
    expect(violations).toHaveLength(0)
  })

  it('does not get confused by semicolons inside a function body', () => {
    const violations = lintRlsPolicies([{
      name: '001.sql',
      content: `
        create or replace function private.do_thing() returns void language plpgsql as $function$
        begin
          insert into widgets (id) values (1);
          insert into widgets (id) values (2);
        end;
        $function$;
        create policy "X: staff update" on widgets for update using (private.get_user_role() = any (array['admin','staff']));
      `,
    }])
    expect(violations).toHaveLength(0)
  })

  it('does not flag a deny-all service-role-only policy', () => {
    const violations = lintRlsPolicies([{
      name: '001.sql',
      content: `create policy "X: service role only" on widgets for all to authenticated using (false);`,
    }])
    expect(violations).toHaveLength(0)
  })

  it('re-flags if a later migration reintroduces an unsafe policy (regression case)', () => {
    const violations = lintRlsPolicies([
      {
        name: '001.sql',
        content: `create policy "X: staff update" on widgets for update using (private.get_user_role() = any (array['admin','staff']));`,
      },
      {
        name: '002.sql',
        content: `
          drop policy if exists "X: staff update" on widgets;
          create policy "X: staff update" on widgets for update using (tenant_id = private.get_user_tenant_id());
        `,
      },
    ])
    expect(violations).toHaveLength(1)
    expect(violations[0].command).toBe('update')
  })
})
