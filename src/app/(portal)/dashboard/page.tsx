import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Building2, AlertTriangle, Clock, CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { format, differenceInDays } from 'date-fns'
import SarsAuthorisationNotice from '@/components/onboarding/SarsAuthorisationNotice'

function StatusBadge({ status, daysLeft }: { status: string; daysLeft?: number }) {
  if (status === 'submitted') return <span className="badge-green">Submitted</span>
  if (status === 'overdue' || (daysLeft !== undefined && daysLeft < 0)) return <span className="badge-red">Overdue</span>
  if (daysLeft !== undefined && daysLeft <= 7) return <span className="badge-red">{daysLeft}d left</span>
  if (daysLeft !== undefined && daysLeft <= 21) return <span className="badge-yellow">{daysLeft}d left</span>
  return <span className="badge-blue">{daysLeft !== undefined ? `${daysLeft}d left` : 'Pending'}</span>
}

export default async function DashboardPage() {
  let supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
  try {
    supabase = await createServerSupabaseClient()
  } catch (e) {
    // If supabase client fails (e.g. missing env vars), show a helpful error
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-red-700 font-bold text-lg mb-2">Configuration Error</h2>
          <p className="text-red-600 text-sm">Could not connect to Supabase. Check your <code>.env.local</code> file has <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.</p>
        </div>
      </div>
    )
  }

  const today = new Date()
  const in30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

  // Run all queries, but don't crash if tables are empty or missing
  const [
    companiesResult,
    upcomingResult,
    overdueResult,
    logsResult,
    sarsPendingResult,
  ] = await Promise.allSettled([
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('compliance_items')
      .select('*, companies(name)')
      .in('status', ['pending', 'overdue'])
      .gte('due_date', today.toISOString().split('T')[0])
      .lte('due_date', in30.toISOString().split('T')[0])
      .order('due_date', { ascending: true })
      .limit(10),
    supabase.from('compliance_items')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'overdue'),
    supabase.from('activity_logs')
      .select('*, users(full_name)')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('people')
      .select('id, first_name, last_name, tax_number, sars_added_at')
      .eq('sars_poa_status', 'awaiting_authorisation'),
  ])

  const companyCount = companiesResult.status === 'fulfilled' ? (companiesResult.value.count ?? 0) : 0
  const upcoming = upcomingResult.status === 'fulfilled' ? (upcomingResult.value.data ?? []) : []
  const overdueCount = overdueResult.status === 'fulfilled' ? (overdueResult.value.count ?? 0) : 0
  const recentLogs = logsResult.status === 'fulfilled' ? (logsResult.value.data ?? []) : []
  const sarsPending = sarsPendingResult.status === 'fulfilled' ? (sarsPendingResult.value.data ?? []) : []

  const stats = [
    { label: 'Total Companies',  value: companyCount,      icon: Building2,    color: 'text-navy-700',    bg: 'bg-navy-50'    },
    { label: 'Overdue Items',    value: overdueCount,      icon: AlertTriangle, color: 'text-red-600',    bg: 'bg-red-50'     },
    { label: 'Due This Month',   value: upcoming.length,   icon: Clock,         color: 'text-amber-600',  bg: 'bg-amber-50'   },
    { label: 'Submitted (30d)',  value: 0,                 icon: CheckCircle2,  color: 'text-emerald-600',bg: 'bg-emerald-50' },
  ]

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">{format(today, 'EEEE, d MMMM yyyy')}</p>
        </div>
        <Link href="/companies/new" className="btn-primary">+ Add Company</Link>
      </div>

      <SarsAuthorisationNotice people={sarsPending as any} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-2`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Upcoming deadlines */}
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="section-title">Upcoming Deadlines</h3>
            <Link href="/compliance" className="text-xs text-navy-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">Company</th>
                  <th className="th">Type</th>
                  <th className="th">Due Date</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.length === 0 && (
                  <tr>
                    <td colSpan={4} className="td text-center text-slate-400 py-8">
                      No upcoming deadlines 🎉
                    </td>
                  </tr>
                )}
                {upcoming.map((item: any) => {
                  const days = differenceInDays(new Date(item.due_date), today)
                  return (
                    <tr key={item.id} className="table-row">
                      <td className="td font-medium">{item.companies?.name ?? '—'}</td>
                      <td className="td">{item.type}</td>
                      <td className="td">{format(new Date(item.due_date), 'd MMM yyyy')}</td>
                      <td className="td"><StatusBadge status={item.status} daysLeft={days} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity log */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="section-title">Recent Activity</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {recentLogs.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">No activity yet</p>
            )}
            {recentLogs.map((log: any) => (
              <div key={log.id} className="px-5 py-3">
                <p className="text-xs text-slate-700">
                  <span className="font-medium">{log.users?.full_name ?? 'System'}</span>{' '}
                  {log.action}{log.entity_name ? ` — ${log.entity_name}` : ''}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {format(new Date(log.created_at), 'd MMM, HH:mm')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
