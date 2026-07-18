import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  awaiting_docs:      { label: 'Awaiting docs',     cls: 'badge-yellow' },
  docs_received:      { label: 'Docs received',     cls: 'badge-blue' },
  in_review:          { label: 'In review',          cls: 'badge-blue' },
  calc_complete:      { label: 'Calc complete',      cls: 'badge-green' },
  awaiting_approval:  { label: 'Awaiting approval',  cls: 'badge-yellow' },
  filed:              { label: 'Filed',              cls: 'badge-green' },
  complete:           { label: 'Complete',           cls: 'badge-green' },
}

export default async function TaxPage() {
  const supabase = await createServerSupabaseClient()

  const { data: cases } = await supabase
    .from('tax_cases')
    .select('*, people(first_name, last_name, email)')
    .order('tax_year', { ascending: false })
    .order('created_at', { ascending: false })

  const { data: openDocs } = await supabase
    .from('tax_documents')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'outstanding')

  return (
    <div className="max-w-7xl space-y-4">
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tax Cases</h2>
          <p className="text-sm text-slate-500">{cases?.length ?? 0} cases · {(openDocs as any)?.count ?? 0} outstanding documents</p>
        </div>
        <Link href="/tax/new" className="btn-primary"><Plus className="w-4 h-4" />New Tax Case</Link>
      </div>

      <div className="card">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="th">Client</th>
              <th className="th">Year</th>
              <th className="th">Profile</th>
              <th className="th">Status</th>
              <th className="th">Taxable Income</th>
              <th className="th">Tax</th>
              <th className="th">Result</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {cases?.length === 0 && (
              <tr><td colSpan={8} className="td text-center py-12 text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No tax cases yet. <Link href="/tax/new" className="text-navy-600 underline">Create the first one</Link>
              </td></tr>
            )}
            {cases?.map((c: any) => {
              const s = STATUS_LABELS[c.status] ?? { label: c.status, cls: 'badge-gray' }
              const profile = [
                c.has_employment && 'Employment',
                c.has_rental && 'Rental',
                c.has_sole_prop && 'Sole Prop',
                c.has_airbnb && 'Airbnb',
                c.has_investments && 'Investments',
                c.has_partnership && 'Partnership',
              ].filter(Boolean).join(' · ')
              return (
                <tr key={c.id} className="table-row">
                  <td className="td">
                    <p className="font-medium text-slate-800">{c.people?.first_name} {c.people?.last_name}</p>
                    <p className="text-xs text-slate-400">{c.people?.email}</p>
                  </td>
                  <td className="td font-semibold">{c.tax_year}</td>
                  <td className="td text-xs text-slate-500">{profile || '—'}</td>
                  <td className="td"><span className={s.cls}>{s.label}</span></td>
                  <td className="td text-sm">{c.taxable_income ? `R ${Number(c.taxable_income).toLocaleString()}` : '—'}</td>
                  <td className="td text-sm">{c.tax_liability ? `R ${Number(c.tax_liability).toLocaleString()}` : '—'}</td>
                  <td className="td text-sm">
                    {c.result_amount !== null ? (
                      <span className={c.result_amount >= 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                        {c.result_amount >= 0 ? 'Refund' : 'Owing'} R {Math.abs(Number(c.result_amount)).toLocaleString()}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="td"><Link href={`/tax/${c.id}`} className="text-xs text-navy-600 hover:underline">Manage →</Link></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
