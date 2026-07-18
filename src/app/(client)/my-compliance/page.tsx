import { createServerSupabaseClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

export default async function MyCompliancePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: userData } = await supabase.from('users').select('person_id').eq('id', user!.id).single()
  const { data: memberships } = await supabase.from('company_people').select('company_id').eq('person_id', userData?.person_id)
  const companyIds = memberships?.map((m: any) => m.company_id) ?? []

  const { data: items } = await supabase.from('compliance_items')
    .select('*, companies(name)')
    .in('company_id', companyIds)
    .order('due_date', { ascending: true })

  return (
    <div className="max-w-3xl space-y-4">
      <h2 className="text-2xl font-bold text-slate-800">Compliance Status</h2>
      <div className="card">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr><th className="th">Type</th><th className="th">Period</th><th className="th">Due Date</th><th className="th">Status</th></tr>
          </thead>
          <tbody>
            {items?.map((item: any) => (
              <tr key={item.id} className="table-row">
                <td className="td font-medium">{item.type}</td>
                <td className="td text-xs">{item.period ?? '—'}</td>
                <td className="td text-xs">{format(new Date(item.due_date), 'd MMM yyyy')}</td>
                <td className="td">
                  <span className={item.status === 'submitted' ? 'badge-green' : item.status === 'overdue' ? 'badge-red' : 'badge-yellow'}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
            {(!items || items.length === 0) && (
              <tr><td colSpan={4} className="td text-center py-8 text-slate-400">No compliance items found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
