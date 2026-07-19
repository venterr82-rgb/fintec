// Static check for the exact RLS bug this project has hit twice now
// (20260719000004 on users/people, 20260719000015 on companies/tax_cases/
// tax_documents/etc.): a permissive UPDATE or DELETE policy scoped only by
// tenant_id, with no role or ownership qualifier, lets any authenticated
// user in the tenant — including role 'client' — mutate or delete any other
// row. Postgres OR's multiple permissive policies for the same command
// together, so a single such policy poisons the command even if a stricter
// policy also exists alongside it.
//
// This walks every migration file in order, replays create/drop policy
// statements to build up the *current* (post-migration) policy set per
// table, then flags any UPDATE/DELETE policy whose body contains no
// role/ownership marker. It is a heuristic text check, not a real SQL
// parser or a live DB test — it exists to catch a regression of this
// specific, previously-exploited pattern before it reaches production, not
// to replace live RLS verification (see the 2026-07 incident: a migration
// that "ran successfully" in the SQL editor still needed live verification
// against a real non-admin session before the fix could be trusted).

export interface PolicyViolation {
  table: string
  policyName: string
  command: string
  sourceFile: string
  body: string
}

interface PolicyRecord {
  commands: string[]
  body: string
  sourceFile: string
}

// Markers that indicate a policy is scoped by something other than a bare
// tenant check — role gating, row ownership (person_id/auth.uid()), or an
// explicit exists() ownership subquery (e.g. via company_people).
const OWNERSHIP_OR_ROLE_MARKER = /get_user_role\s*\(|person_id\s*=|auth\.uid\(\)\s*=|=\s*auth\.uid\(\)|cp\.person_id/i

// A deny-all policy ("using (false)", typically paired with "to authenticated"
// on a service-role-only table like pending_checkouts/leads) is maximally
// restrictive, not permissive — it's the safe end of the spectrum, not the bug.
const DENY_ALL_MARKER = /using\s*\(\s*false\s*\)/i

const CHECKED_COMMANDS = ['update', 'delete']

function stripDollarQuotedBodies(sql: string): string {
  // Function bodies (create function ... as $function$ ... $function$;) can
  // contain semicolons that aren't statement separators — strip them before
  // splitting on ';', since no create/drop policy statement ever appears
  // inside one in this codebase.
  return sql.replace(/\$(\w*)\$[\s\S]*?\$\1\$/g, '')
}

function splitStatements(sql: string): string[] {
  return stripDollarQuotedBodies(sql)
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
}

export function lintRlsPolicies(migrationFiles: { name: string; content: string }[]): PolicyViolation[] {
  // policiesByTable[table][policyName] = record; replayed in file order so
  // later migrations' drops/creates correctly supersede earlier ones.
  const policiesByTable: Record<string, Record<string, PolicyRecord>> = {}

  const sorted = [...migrationFiles].sort((a, b) => a.name.localeCompare(b.name))

  for (const file of sorted) {
    for (const statement of splitStatements(file.content)) {
      const dropMatch = statement.match(/^drop\s+policy\s+if\s+exists\s+"([^"]+)"\s+on\s+(\w+)/i)
      if (dropMatch) {
        const [, policyName, table] = dropMatch
        delete (policiesByTable[table] ??= {})[policyName]
        continue
      }

      const createMatch = statement.match(/^create\s+policy\s+"([^"]+)"\s+on\s+(\w+)\s+for\s+(all|select|insert|update|delete)\b([\s\S]*)$/i)
      if (createMatch) {
        const [, policyName, table, forCommand, body] = createMatch
        const commands = forCommand.toLowerCase() === 'all' ? ['select', 'insert', 'update', 'delete'] : [forCommand.toLowerCase()]
        ;(policiesByTable[table] ??= {})[policyName] = { commands, body, sourceFile: file.name }
      }
    }
  }

  const violations: PolicyViolation[] = []

  for (const [table, policies] of Object.entries(policiesByTable)) {
    for (const command of CHECKED_COMMANDS) {
      for (const [policyName, record] of Object.entries(policies)) {
        if (!record.commands.includes(command)) continue
        if (DENY_ALL_MARKER.test(record.body)) continue
        if (!OWNERSHIP_OR_ROLE_MARKER.test(record.body)) {
          violations.push({ table, policyName, command, sourceFile: record.sourceFile, body: record.body.trim() })
        }
      }
    }
  }

  return violations
}
