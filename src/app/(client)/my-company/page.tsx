import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CheckCircle, Clock, AlertCircle, MessageSquare } from 'lucide-react'
import DocumentDownload from '@/components/documents/DocumentDownload'
import ClientUploadDoc from '@/components/tax/ClientUploadDoc'
import IncomeTaxHistoryChart from '@/components/tax/IncomeTaxHistoryChart'
import { siteConfig } from '@/lib/config/site'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  awaiting_docs:     { label: 'Awaiting your documents', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  docs_received:     { label: 'Documents received — under review', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  in_review:         { label: 'Your return is being prepared', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  calc_complete:     { label: 'Calculation complete — please review', color: 'text-navy-700', bg: 'bg-navy-50 border-navy-200' },
  awaiting_approval: { label: 'Awaiting your approval to file', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  filed:             { label: 'Filed with SARS', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  complete:          { label: 'Complete', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
}

function n(v: any) { return v === null || v === undefined ? 0 : Number(v) }

export default async function ClientDashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: userData } = await supabase.from('users').select('person_id, full_name').eq('id', session.user.id).single()
  if (!userData?.person_id) {
    return (
      <div className="max-w-lg">
        <div className="card p-8 text-center">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h2 className="font-semibold text-slate-700 mb-1">Account not linked</h2>
          <p className="text-sm text-slate-500">Your account hasn't been linked to a client profile yet. Please contact {siteConfig.companyName}.</p>
        </div>
      </div>
    )
  }

  const { data: taxCases } = await supabase
    .from('tax_cases')
    .select('*')
    .eq('person_id', userData.person_id)
    .order('tax_year', { ascending: false })
    .limit(3)

  const latestCase = taxCases?.[0]

  const [{ data: documents }, { data: history }, { data: incomeLines }, { data: rebates }] = await Promise.all([
    latestCase ? supabase.from('tax_documents').select('*').eq('tax_case_id', latestCase.id).order('status') : Promise.resolve({ data: [] as any[] }),
    supabase.from('tax_income_history').select('*').eq('person_id', userData.person_id).order('tax_year', { ascending: false }).limit(4),
    latestCase ? supabase.from('tax_income_lines').select('*').eq('tax_case_id', latestCase.id).order('sort_order') : Promise.resolve({ data: [] as any[] }),
    latestCase ? supabase.from('tax_rebates').select('*').eq('tax_case_id', latestCase.id).order('sort_order') : Promise.resolve({ data: [] as any[] }),
  ])

  const outstanding = documents?.filter(d => d.status === 'outstanding') ?? []
  const received = documents?.filter(d => ['uploaded','approved'].includes(d.status)) ?? []
  const s = latestCase ? (STATUS_MAP[latestCase.status] ?? STATUS_MAP.awaiting_docs) : null

  const incomeTotal = (incomeLines ?? []).filter(l => l.line_type === 'income').reduce((sum, l) => sum + n(l.taxable_amount), 0)
  const deductionLines = (incomeLines ?? []).filter(l => l.line_type === 'deduction')
  const rebateTotal = (rebates ?? []).reduce((sum, r) => sum + n(r.amount), 0)
  const taxOnTaxableIncome = latestCase ? n(latestCase.tax_liability) - rebateTotal : 0

  // Merge tax_income_history with the current case's own figures for the
  // 5-year table/chart, so this year shows even before history is imported.
  const historyByYear = new Map<number, { tax_year: number; taxable_income: number; tax_liability: number; effective_rate: number | null }>()
  ;(history ?? []).forEach((h: any) => historyByYear.set(h.tax_year, {
    tax_year: h.tax_year, taxable_income: n(h.taxable_income), tax_liability: n(h.tax_liability), effective_rate: h.effective_rate,
  }))
  if (latestCase?.taxable_income) {
    historyByYear.set(latestCase.tax_year, {
      tax_year: latestCase.tax_year,
      taxable_income: n(latestCase.taxable_income),
      tax_liability: n(latestCase.tax_liability),
      effective_rate: latestCase.effective_rate,
    })
  }
  const fiveYear = [...historyByYear.values()].sort((a, b) => b.tax_year - a.tax_year).slice(0, 5)

  return (
    <div className="max-w-4xl space-y-5">
      {/* Welcome + status */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Welcome, {userData.full_name?.split(' ')[0] ?? 'there'}</h2>
        {latestCase && (
          <p className="text-sm text-slate-500 mt-0.5">Tax Year {latestCase.tax_year} · {latestCase.period_label}</p>
        )}
      </div>

      {latestCase && s && (
        <div className={`border rounded-xl px-5 py-4 ${s.bg}`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${latestCase.status === 'complete' || latestCase.status === 'filed' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            <p className={`text-sm font-semibold ${s.color}`}>{s.label}</p>
          </div>
          {latestCase.accountant_note && (
            <div className="mt-3 pt-3 border-t border-current/10">
              <p className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Message from your accountant</p>
              <p className="text-sm text-slate-700">{latestCase.accountant_note}</p>
            </div>
          )}
        </div>
      )}

      {/* Stat cards */}
      {latestCase && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat-card">
            <p className="text-xs text-slate-500">Taxable Income</p>
            <p className="text-xl font-bold text-slate-800">{latestCase.taxable_income ? `R ${Number(latestCase.taxable_income).toLocaleString()}` : '—'}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-slate-500">Tax Payable</p>
            <p className="text-xl font-bold text-slate-800">{latestCase.tax_liability ? `R ${Number(latestCase.tax_liability).toLocaleString()}` : '—'}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-slate-500">Effective Rate</p>
            <p className="text-xl font-bold text-slate-800">{latestCase.effective_rate ? `${Number(latestCase.effective_rate).toFixed(1)}%` : '—'}</p>
          </div>
          {latestCase.result_amount !== null ? (
            <div className="stat-card">
              <p className="text-xs text-slate-500">{Number(latestCase.result_amount) >= 0 ? 'Refund' : 'Owing'}</p>
              <p className={`text-xl font-bold ${Number(latestCase.result_amount) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                R {Math.abs(Number(latestCase.result_amount)).toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="stat-card">
              <p className="text-xs text-slate-500">Outstanding docs</p>
              <p className={`text-xl font-bold ${outstanding.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{outstanding.length}</p>
            </div>
          )}
        </div>
      )}

      {/* Document checklist */}
      {documents && documents.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="section-title">Document Checklist — {latestCase?.tax_year}</h3>
            <span className="text-xs text-slate-500">{received.length}/{documents.filter(d => d.status !== 'not_applicable').length} received</span>
          </div>
          <div className="divide-y divide-slate-50">
            {documents.filter(d => d.status !== 'not_applicable').map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  {doc.status === 'outstanding'
                    ? <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    : <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  }
                  <div>
                    <p className={`text-sm font-medium ${doc.status === 'outstanding' ? 'text-slate-800' : 'text-slate-500'}`}>{doc.label}</p>
                    {doc.status === 'outstanding' && doc.description && (
                      <p className="text-xs text-slate-400">{doc.description}</p>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {doc.status === 'outstanding' && (
                    <ClientUploadDoc docId={doc.id} taxCaseId={latestCase?.id} />
                  )}
                  {doc.file_path && (
                    <DocumentDownload filePath={doc.file_path} fileName={doc.file_name ?? doc.label} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Income breakdown */}
      {incomeLines && incomeLines.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="section-title">Income Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">Code</th>
                  <th className="th">Description</th>
                  <th className="th text-right">Gross</th>
                  <th className="th text-right">Exempt/Expenses</th>
                  <th className="th text-right">Taxable</th>
                </tr>
              </thead>
              <tbody>
                {incomeLines.filter(l => l.line_type === 'income').map((l: any) => (
                  <tr key={l.id} className="border-t border-slate-50">
                    <td className="td text-xs text-slate-500">{l.sars_code ?? '—'}</td>
                    <td className="td">{l.description}</td>
                    <td className="td text-right">{l.calculated ? Number(l.calculated).toLocaleString() : '—'}</td>
                    <td className="td text-right">{l.exemption_expenses ? `(${Math.abs(Number(l.exemption_expenses)).toLocaleString()})` : '—'}</td>
                    <td className="td text-right font-medium">{l.taxable_amount ? Number(l.taxable_amount).toLocaleString() : '—'}</td>
                  </tr>
                ))}
                <tr className="border-t border-slate-200 font-semibold bg-slate-50">
                  <td className="td" colSpan={4}>Total Income</td>
                  <td className="td text-right">{incomeTotal.toLocaleString()}</td>
                </tr>
                {deductionLines.map((l: any) => (
                  <tr key={l.id} className="border-t border-slate-50">
                    <td className="td text-xs text-slate-500">{l.sars_code ?? '—'}</td>
                    <td className="td">{l.description}</td>
                    <td className="td text-right">—</td>
                    <td className="td text-right">{l.exemption_expenses ? `(${Math.abs(Number(l.exemption_expenses)).toLocaleString()})` : '—'}</td>
                    <td className="td text-right font-medium">{l.taxable_amount ? `(${Math.abs(Number(l.taxable_amount)).toLocaleString()})` : '—'}</td>
                  </tr>
                ))}
                <tr className="border-t border-slate-200 font-bold">
                  <td className="td" colSpan={4}>TAXABLE INCOME</td>
                  <td className="td text-right">{latestCase?.taxable_income ? Number(latestCase.taxable_income).toLocaleString() : '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tax calculation */}
      {latestCase?.taxable_income && (
        <div className="card p-5">
          <h3 className="section-title mb-4">Tax Calculation</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500">Tax on taxable income</span>
              <span className="font-medium">R {taxOnTaxableIncome.toLocaleString()}</span>
            </div>
            {rebates?.map((r: any) => (
              <div key={r.id} className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">{r.description}</span>
                <span className="font-medium">{n(r.amount) < 0 ? `(R ${Math.abs(n(r.amount)).toLocaleString()})` : '—'}</span>
              </div>
            ))}
            <div className="flex justify-between border-b border-slate-50 pb-2 font-semibold">
              <span>Tax Payable</span>
              <span>R {Number(latestCase.tax_liability ?? 0).toLocaleString()}</span>
            </div>
            {latestCase.prov_tax_p1 && (
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">Provisional tax P1</span>
                <span className="font-medium">(R {Number(latestCase.prov_tax_p1).toLocaleString()})</span>
              </div>
            )}
            {latestCase.prov_tax_p2 && (
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">Provisional tax P2</span>
                <span className="font-medium">(R {Number(latestCase.prov_tax_p2).toLocaleString()})</span>
              </div>
            )}
            {latestCase.result_amount !== null && (
              <div className={`flex justify-between pt-2 font-bold text-base ${Number(latestCase.result_amount) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                <span>{Number(latestCase.result_amount) >= 0 ? '✓ Refund due to you' : '⚠ Amount owing to SARS'}</span>
                <span>R {Math.abs(Number(latestCase.result_amount)).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Provisional tax due dates */}
      {(latestCase?.prov_p1_due || latestCase?.prov_p2_due) && (
        <div className="card p-5">
          <h3 className="section-title mb-3">Provisional Tax Due Dates</h3>
          <div className="grid grid-cols-2 gap-4">
            {latestCase.prov_p1_due && (
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">First payment (P1)</p>
                <p className="text-base font-semibold text-slate-800">{new Date(latestCase.prov_p1_due).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            )}
            {latestCase.prov_p2_due && (
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Second payment (P2)</p>
                <p className="text-base font-semibold text-slate-800">{new Date(latestCase.prov_p2_due).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RA planning */}
      {latestCase?.taxable_income && latestCase.has_ra && (
        <div className="card p-5">
          <h3 className="section-title mb-3">RA Planning</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Max deductible (27.5%)</span>
              <span className="font-medium">R {Math.min(Number(latestCase.taxable_income) * 0.275, 350000).toLocaleString()}</span>
            </div>
            {latestCase.ra_deduction && (
              <div className="flex justify-between">
                <span className="text-slate-500">RA deducted this year</span>
                <span className="font-medium">R {Number(latestCase.ra_deduction).toLocaleString()}</span>
              </div>
            )}
            {latestCase.current_ra_monthly && (
              <div className="flex justify-between">
                <span className="text-slate-500">Current RA contribution</span>
                <span className="font-medium">R {Number(latestCase.current_ra_monthly).toLocaleString()}/mo</span>
              </div>
            )}
            {latestCase.ra_deduction && Number(latestCase.ra_deduction) > 350000 && (
              <p className="text-xs text-amber-600 font-medium">⚠ You are over the annual cap of R350,000</p>
            )}
            {latestCase.suggested_ra_monthly && (
              <div className="flex justify-between border-t border-slate-100 pt-2 text-navy-700 font-semibold">
                <span>Suggested monthly</span>
                <span>R {Number(latestCase.suggested_ra_monthly).toLocaleString()}/mo</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5-year history */}
      {fiveYear.length > 0 && (
        <div className="card p-5">
          <h3 className="section-title mb-3">5-Year Income & Tax History</h3>
          <table className="w-full text-sm mb-5">
            <thead><tr>
              <th className="text-left text-xs text-slate-400 font-medium pb-2">Year</th>
              <th className="text-right text-xs text-slate-400 font-medium pb-2">Taxable income</th>
              <th className="text-right text-xs text-slate-400 font-medium pb-2">Tax</th>
              <th className="text-right text-xs text-slate-400 font-medium pb-2">Rate</th>
            </tr></thead>
            <tbody>
              {fiveYear.map(h => (
                <tr key={h.tax_year} className="border-t border-slate-50">
                  <td className="py-2 font-semibold text-slate-700">
                    {h.tax_year}{latestCase && h.tax_year === latestCase.tax_year && <span className="text-navy-500 font-normal text-xs"> ← current</span>}
                  </td>
                  <td className="py-2 text-right text-slate-600">R {h.taxable_income.toLocaleString()}</td>
                  <td className="py-2 text-right text-slate-600">R {h.tax_liability.toLocaleString()}</td>
                  <td className="py-2 text-right text-slate-400">{h.effective_rate ? `${Number(h.effective_rate).toFixed(1)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <IncomeTaxHistoryChart data={fiveYear} />
        </div>
      )}
    </div>
  )
}
