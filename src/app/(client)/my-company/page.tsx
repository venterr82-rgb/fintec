import { createServerSupabaseClient } from '@/lib/supabase/server'
import { FileText, CheckCircle, Clock, AlertCircle, Download, Upload, MessageSquare } from 'lucide-react'
import DocumentDownload from '@/components/documents/DocumentDownload'
import ClientUploadDoc from '@/components/tax/ClientUploadDoc'
import Link from 'next/link'
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

  // Get latest tax case
  const { data: taxCases } = await supabase
    .from('tax_cases')
    .select('*')
    .eq('person_id', userData.person_id)
    .order('tax_year', { ascending: false })
    .limit(3)

  const latestCase = taxCases?.[0]

  // Get documents for latest case
  const { data: documents } = latestCase ? await supabase
    .from('tax_documents')
    .select('*')
    .eq('tax_case_id', latestCase.id)
    .order('status')
    : { data: [] }

  // Get income history
  const { data: history } = await supabase
    .from('tax_income_history')
    .select('*')
    .eq('person_id', userData.person_id)
    .order('tax_year', { ascending: false })
    .limit(5)

  const outstanding = documents?.filter(d => d.status === 'outstanding') ?? []
  const received = documents?.filter(d => ['uploaded','approved'].includes(d.status)) ?? []
  const s = latestCase ? (STATUS_MAP[latestCase.status] ?? STATUS_MAP.awaiting_docs) : null

  return (
    <div className="max-w-3xl space-y-5">
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
            <p className="text-xs text-slate-500">Outstanding docs</p>
            <p className={`text-2xl font-bold ${outstanding.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{outstanding.length}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-slate-500">Received</p>
            <p className="text-2xl font-bold text-slate-800">{received.length}</p>
          </div>
          {latestCase.taxable_income && (
            <div className="stat-card">
              <p className="text-xs text-slate-500">Taxable income</p>
              <p className="text-xl font-bold text-slate-800">R {Number(latestCase.taxable_income).toLocaleString()}</p>
            </div>
          )}
          {latestCase.result_amount !== null && (
            <div className="stat-card">
              <p className="text-xs text-slate-500">{Number(latestCase.result_amount) >= 0 ? 'Refund due' : 'Amount owing'}</p>
              <p className={`text-xl font-bold ${Number(latestCase.result_amount) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                R {Math.abs(Number(latestCase.result_amount)).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Document checklist */}
      {documents && documents.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="section-title">Document Checklist — {latestCase?.tax_year}</h3>
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
                <div className="shrink-0">
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

      {/* Tax calculation summary */}
      {latestCase?.taxable_income && (
        <div className="card p-5">
          <h3 className="section-title mb-4">Tax Calculation Summary — {latestCase.tax_year}</h3>
          <div className="space-y-2 text-sm">
            {[
              ['Taxable income', latestCase.taxable_income, false],
              ['Tax liability', latestCase.tax_liability, false],
              ['PAYE deducted', latestCase.paye_credits, true],
              ['Provisional tax paid (P1)', latestCase.prov_tax_p1, true],
              ['Provisional tax paid (P2)', latestCase.prov_tax_p2, true],
            ].filter(([,v]) => v !== null && v !== undefined).map(([label, val, neg]) => (
              <div key={label as string} className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">{label as string}</span>
                <span className="font-medium">{neg ? '(' : ''}R {Number(val).toLocaleString()}{neg ? ')' : ''}</span>
              </div>
            ))}
            {latestCase.result_amount !== null && (
              <div className={`flex justify-between pt-2 font-bold text-base ${Number(latestCase.result_amount) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                <span>{Number(latestCase.result_amount) >= 0 ? '✓ Refund due to you' : '⚠ Amount owing to SARS'}</span>
                <span>R {Math.abs(Number(latestCase.result_amount)).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* RA suggestion */}
          {latestCase.suggested_ra_monthly && (
            <div className="mt-4 pt-4 border-t border-slate-100 bg-navy-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-navy-700 mb-1">RA Contribution Recommendation</p>
              <p className="text-xs text-slate-600">
                To maximise your tax deduction for next year, consider increasing your monthly RA contribution
                to <strong>R {Number(latestCase.suggested_ra_monthly).toLocaleString()}/month</strong>.
                {latestCase.current_ra_monthly && ` Your current contribution is R ${Number(latestCase.current_ra_monthly).toLocaleString()}/month.`}
              </p>
            </div>
          )}
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

      {/* 5-year history */}
      {history && history.length > 0 && (
        <div className="card p-5">
          <h3 className="section-title mb-3">Income & Tax History</h3>
          <table className="w-full text-sm">
            <thead><tr>
              <th className="text-left text-xs text-slate-400 font-medium pb-2">Year</th>
              <th className="text-right text-xs text-slate-400 font-medium pb-2">Taxable income</th>
              <th className="text-right text-xs text-slate-400 font-medium pb-2">Tax</th>
              <th className="text-right text-xs text-slate-400 font-medium pb-2">Rate</th>
            </tr></thead>
            <tbody>
              {history.map((h: any) => (
                <tr key={h.tax_year} className="border-t border-slate-50">
                  <td className="py-2 font-semibold text-slate-700">{h.tax_year}</td>
                  <td className="py-2 text-right text-slate-600">R {Number(h.taxable_income).toLocaleString()}</td>
                  <td className="py-2 text-right text-slate-600">R {Number(h.tax_liability).toLocaleString()}</td>
                  <td className="py-2 text-right text-slate-400">{h.effective_rate ? `${Number(h.effective_rate).toFixed(1)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
