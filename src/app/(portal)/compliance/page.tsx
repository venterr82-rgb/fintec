import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Download } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import ComplianceActions from '@/components/compliance/ComplianceActions'

function DaysChip({ dueDate, status }: { dueDate: string; status: string }) {
  if (status === 'submitted') return <span className="badge-green">✓ Submitted</span>
  const days = differenceInDays(new Date(dueDate), new Date())
  if (days < 0) return <span className="badge-red">Overdue {Math.abs(days)}d</span>
  if (days <= 7) return <span className="badge-red">{days}d left</span>
  if (days <= 21) return <span className="badge-yellow">{days}d left</span>
  return <span className="badge-blue">{days}d left</span>
}

export default async function CompliancePage({ searchParams }: { searchParams: { company?: string; type?: string; status?: string } }) {
  const supabase = await createServerSupabaseClient()

  let q = supabase.from('compliance_items')
    .select('*, companies(id, name)')
    .order('due_date', { ascending: true })

  if (searchParams.company) q = q.eq('company_id', searchParams.company)
  if (searchParams.type) q = q.eq('type', searchParams.type)
  if (searchParams.status) q = q.eq('status', searchParams.status)

  const { data: items } = await q
  const { data: companies } = await supabase.from('companies').select('id, name').order('name')

  const TYPES = ['VAT','PAYE','UIF','SDL','Provisional Tax','Income Tax (ITR14)','CIPC Annual Return','Workmen Compensation']

  return (
    <div className="max-w-7xl space-y-4">
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Compliance Calendar</h2>
          <p className="text-sm text-slate-500">{items?.length ?? 0} items</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary"><Download className="w-4 h-4" />Export</button>
          <Link href="/compliance/new" className="btn-primary"><Plus className="w-4 h-4" />Add Item</Link>
        </div>
      </div>

      <div className="card">
        <form className="flex flex-wrap gap-3 p-4 border-b border-slate-100">
          <select name="company" defaultValue={searchParams.company} className="input w-52">
            <option value="">All companies</option>
            {companies?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select name="type" defaultValue={searchParams.type} className="input w-48">
            <option value="">All types</option>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select name="status" defaultValue={searchParams.status} className="input w-36">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="overdue">Overdue</option>
          </select>
          <button type="submit" className="btn-primary">Filter</button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="th">Company</th>
                <th className="th">Type</th>
                <th className="th">Period</th>
                <th className="th">Due Date</th>
                <th className="th">Status</th>
                <th className="th">Amount Due</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items?.length === 0 && (
                <tr><td colSpan={7} className="td text-center py-12 text-slate-400">No compliance items found.</td></tr>
              )}
              {items?.map((item: any) => (
                <tr key={item.id} className="table-row">
                  <td className="td font-medium">
                    <Link href={`/companies/${item.companies?.id}/compliance`} className="text-navy-700 hover:underline">
                      {item.companies?.name ?? '—'}
                    </Link>
                  </td>
                  <td className="td"><span className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{item.type}</span></td>
                  <td className="td text-xs">{item.period ?? '—'}</td>
                  <td className="td text-xs">{format(new Date(item.due_date), 'd MMM yyyy')}</td>
                  <td className="td"><DaysChip dueDate={item.due_date} status={item.status} /></td>
                  <td className="td text-xs">{item.amount_due ? `R ${Number(item.amount_due).toLocaleString()}` : '—'}</td>
                  <td className="td"><ComplianceActions item={item} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
