import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
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

export default async function CompanyCompliancePage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: company } = await supabase.from('companies').select('id, name').eq('id', params.id).single()
  if (!company) notFound()

  const { data: items } = await supabase.from('compliance_items')
    .select('*')
    .eq('company_id', params.id)
    .order('due_date', { ascending: true })

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <Link href={`/companies/${params.id}`} className="text-sm text-slate-500 hover:text-navy-700 flex items-center gap-1 mb-3">
          <ArrowLeft className="w-3 h-3" /> {company.name}
        </Link>
        <div className="page-header">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Compliance Items</h2>
            <p className="text-sm text-slate-500">{items?.length ?? 0} items · {company.name}</p>
          </div>
          <Link href={`/compliance/new?company=${params.id}`} className="btn-primary"><Plus className="w-4 h-4" />Add Item</Link>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
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
                <tr><td colSpan={6} className="td text-center py-12 text-slate-400">No compliance items for this company yet.</td></tr>
              )}
              {items?.map((item: any) => (
                <tr key={item.id} className="table-row">
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
