import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Clock, XCircle } from 'lucide-react'
import TaxDocumentManager from '@/components/tax/TaxDocumentManager'
import TaxFiguresForm from '@/components/tax/TaxFiguresForm'

const STATUS_STEPS = [
  { key: 'awaiting_docs', label: 'Awaiting docs' },
  { key: 'docs_received', label: 'Docs received' },
  { key: 'in_review', label: 'In review' },
  { key: 'calc_complete', label: 'Calc complete' },
  { key: 'filed', label: 'Filed' },
  { key: 'complete', label: 'Complete' },
]

export default async function TaxCaseDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()

  const { data: taxCase } = await supabase
    .from('tax_cases')
    .select('*, people(first_name, last_name, email, id_number, tax_number)')
    .eq('id', params.id)
    .single()

  if (!taxCase) notFound()

  const { data: documents } = await supabase
    .from('tax_documents')
    .select('*')
    .eq('tax_case_id', params.id)
    .order('document_type')

  const { data: history } = await supabase
    .from('tax_income_history')
    .select('*')
    .eq('person_id', taxCase.person_id)
    .order('tax_year', { ascending: false })
    .limit(5)

  const currentStep = STATUS_STEPS.findIndex(s => s.key === taxCase.status)
  const outstanding = documents?.filter((d: any) => d.status === 'outstanding').length ?? 0
  const uploaded = documents?.filter((d: any) => d.status !== 'outstanding' && d.status !== 'not_applicable').length ?? 0
  const total = documents?.filter((d: any) => d.status !== 'not_applicable').length ?? 0

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <Link href="/tax" className="text-sm text-slate-500 hover:text-navy-700 flex items-center gap-1 mb-3">
          <ArrowLeft className="w-3 h-3" /> Tax Cases
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {taxCase.people?.first_name} {taxCase.people?.last_name} — {taxCase.tax_year}
            </h2>
            <p className="text-sm text-slate-500">{taxCase.period_label ?? `Tax Year ${taxCase.tax_year}`}</p>
          </div>
          <Link href={`/tax/${params.id}/edit`} className="btn-secondary">Edit Case</Link>
        </div>
      </div>

      {/* Progress steps */}
      <div className="card p-5">
        <div className="flex items-center gap-0">
          {STATUS_STEPS.map((step, i) => (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className={`flex flex-col items-center gap-1`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                  ${i < currentStep ? 'bg-emerald-500 text-white' :
                    i === currentStep ? 'bg-navy-700 text-white' :
                    'bg-slate-200 text-slate-400'}`}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <span className={`text-xs whitespace-nowrap ${i === currentStep ? 'text-navy-700 font-medium' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 mb-4 ${i < currentStep ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: documents */}
        <div className="xl:col-span-2 space-y-4">
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="section-title">Documents</h3>
              <span className="text-sm text-slate-500">{uploaded}/{total} received · {outstanding} outstanding</span>
            </div>
            <TaxDocumentManager taxCaseId={params.id} documents={documents ?? []} />
          </div>
        </div>

        {/* Right: figures + history */}
        <div className="space-y-4">
          {/* Key figures */}
          <div className="card p-5">
            <h3 className="section-title mb-4">Tax Summary</h3>
            {taxCase.taxable_income ? (
              <div className="space-y-2 text-sm">
                {[
                  ['Taxable Income', taxCase.taxable_income],
                  ['Tax Liability', taxCase.tax_liability],
                  ['PAYE Credits', taxCase.paye_credits ? -taxCase.paye_credits : null],
                  ['Prov Tax P1', taxCase.prov_tax_p1 ? -taxCase.prov_tax_p1 : null],
                  ['Prov Tax P2', taxCase.prov_tax_p2 ? -taxCase.prov_tax_p2 : null],
                ].map(([label, val]) => val !== null && (
                  <div key={label as string} className="flex justify-between border-b border-slate-50 pb-1.5">
                    <span className="text-slate-500">{label as string}</span>
                    <span className="font-medium">R {Math.abs(Number(val)).toLocaleString()}</span>
                  </div>
                ))}
                {taxCase.result_amount !== null && (
                  <div className={`flex justify-between pt-1 font-semibold ${Number(taxCase.result_amount) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    <span>{Number(taxCase.result_amount) >= 0 ? 'Refund' : 'Amount Owing'}</span>
                    <span>R {Math.abs(Number(taxCase.result_amount)).toLocaleString()}</span>
                  </div>
                )}
              </div>
            ) : (
              <TaxFiguresForm taxCaseId={params.id} taxCase={taxCase} />
            )}
          </div>

          {/* RA planning */}
          {taxCase.taxable_income && taxCase.has_ra && (
            <div className="card p-5">
              <h3 className="section-title mb-3">RA Planning</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Max deductible (27.5%)</span>
                  <span className="font-medium">R {Math.min(Number(taxCase.taxable_income) * 0.275, 350000).toLocaleString()}</span>
                </div>
                {taxCase.ra_deduction && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current RA</span>
                    <span className="font-medium">R {Number(taxCase.ra_deduction).toLocaleString()}</span>
                  </div>
                )}
                {taxCase.current_ra_monthly && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Monthly contribution</span>
                    <span className="font-medium">R {Number(taxCase.current_ra_monthly).toLocaleString()}/mo</span>
                  </div>
                )}
                {taxCase.suggested_ra_monthly && (
                  <div className="flex justify-between border-t border-slate-100 pt-2 text-navy-700 font-semibold">
                    <span>Suggested monthly</span>
                    <span>R {Number(taxCase.suggested_ra_monthly).toLocaleString()}/mo</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5-year history */}
          {history && history.length > 0 && (
            <div className="card p-5">
              <h3 className="section-title mb-3">Income History</h3>
              <table className="w-full text-xs">
                <thead><tr>
                  <th className="text-left text-slate-400 pb-2">Year</th>
                  <th className="text-right text-slate-400 pb-2">Income</th>
                  <th className="text-right text-slate-400 pb-2">Tax</th>
                </tr></thead>
                <tbody>
                  {history.map((h: any) => (
                    <tr key={h.tax_year} className="border-t border-slate-50">
                      <td className="py-1.5 font-medium">{h.tax_year}</td>
                      <td className="py-1.5 text-right text-slate-600">R {Number(h.taxable_income).toLocaleString()}</td>
                      <td className="py-1.5 text-right text-slate-600">R {Number(h.tax_liability).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Accountant note */}
          {taxCase.accountant_note && (
            <div className="card p-5 border-l-4 border-navy-400">
              <p className="text-xs font-semibold text-slate-500 mb-1">NOTE TO CLIENT</p>
              <p className="text-sm text-slate-700">{taxCase.accountant_note}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
