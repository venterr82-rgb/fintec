'use client'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TaxFiguresForm({ taxCaseId, taxCase }: { taxCaseId: string; taxCase: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({
    taxable_income: taxCase?.taxable_income ?? '',
    tax_liability: taxCase?.tax_liability ?? '',
    paye_credits: taxCase?.paye_credits ?? '',
    prov_tax_p1: taxCase?.prov_tax_p1 ?? '',
    prov_tax_p2: taxCase?.prov_tax_p2 ?? '',
    ra_deduction: taxCase?.ra_deduction ?? '',
    result_amount: taxCase?.result_amount ?? '',
    effective_rate: taxCase?.effective_rate ?? '',
    current_ra_monthly: taxCase?.current_ra_monthly ?? '',
    suggested_ra_monthly: taxCase?.suggested_ra_monthly ?? '',
    prov_p1_due: taxCase?.prov_p1_due ?? '',
    prov_p2_due: taxCase?.prov_p2_due ?? '',
    accountant_note: taxCase?.accountant_note ?? '',
    status: taxCase?.status ?? 'awaiting_docs',
  })
  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function save() {
    setLoading(true)
    await fetch('/api/tax-cases', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taxCaseId, ...form }),
    })
    setLoading(false); setShow(false); router.refresh()
  }

  if (!show) return (
    <button onClick={() => setShow(true)} className="btn-secondary w-full text-xs">Enter tax figures</button>
  )

  return (
    <div className="space-y-3 text-sm">
      {[
        ['Taxable Income', 'taxable_income'],
        ['Tax Liability', 'tax_liability'],
        ['PAYE Credits', 'paye_credits'],
        ['Prov Tax P1', 'prov_tax_p1'],
        ['Prov Tax P2', 'prov_tax_p2'],
        ['RA Deduction', 'ra_deduction'],
        ['Result (+ refund / - owing)', 'result_amount'],
        ['Effective Rate %', 'effective_rate'],
        ['Current RA monthly', 'current_ra_monthly'],
        ['Suggested RA monthly', 'suggested_ra_monthly'],
      ].map(([label, key]) => (
        <div key={key} className="flex items-center gap-2">
          <label className="text-xs text-slate-500 w-36 shrink-0">{label}</label>
          <input type="number" className="input py-1 text-xs" value={(form as any)[key]} onChange={set(key)} />
        </div>
      ))}
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-500 w-36 shrink-0">Status</label>
        <select className="input py-1 text-xs" value={form.status} onChange={set('status')}>
          <option value="awaiting_docs">Awaiting docs</option>
          <option value="in_review">In review</option>
          <option value="calc_complete">Calc complete</option>
          <option value="filed">Filed</option>
          <option value="complete">Complete</option>
        </select>
      </div>
      <textarea className="input text-xs" rows={2} value={form.accountant_note} onChange={set('accountant_note')} placeholder="Note to client…" />
      <button onClick={save} disabled={loading} className="btn-primary w-full text-xs">
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save figures'}
      </button>
    </div>
  )
}
