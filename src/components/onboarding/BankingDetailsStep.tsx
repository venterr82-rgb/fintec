'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertTriangle } from 'lucide-react'

const BANKS = [
  { name: 'ABSA', branchCode: '632005' },
  { name: 'Capitec', branchCode: '470010' },
  { name: 'FNB', branchCode: '250655' },
  { name: 'Nedbank', branchCode: '198765' },
  { name: 'Standard Bank', branchCode: '051001' },
  { name: 'TymeBank', branchCode: '678910' },
  { name: 'Discovery Bank', branchCode: '679000' },
  { name: 'African Bank', branchCode: '430000' },
  { name: 'Other', branchCode: '' },
]

const ACCOUNT_TYPES = ['Cheque/Current', 'Savings', 'Transmission']

export default function BankingDetailsStep() {
  const router = useRouter()
  const [form, setForm] = useState({ bank_name: '', account_holder: '', account_number: '', account_type: '', branch_code: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function selectBank(name: string) {
    const bank = BANKS.find(b => b.name === name)
    setForm(f => ({ ...f, bank_name: name, branch_code: bank?.branchCode || f.branch_code }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/onboarding/banking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Something went wrong.'); setLoading(false); return }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card p-6 space-y-4">
        <h3 className="section-title">Banking Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Bank *</label>
            <select className="input" required value={form.bank_name} onChange={e => selectBank(e.target.value)}>
              <option value="">Select bank…</option>
              {BANKS.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Account type *</label>
            <select className="input" required value={form.account_type} onChange={e => setForm(f => ({ ...f, account_type: e.target.value }))}>
              <option value="">Select…</option>
              {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Account holder name *</label>
            <input className="input" required value={form.account_holder} onChange={e => setForm(f => ({ ...f, account_holder: e.target.value }))} />
          </div>
          <div>
            <label className="label">Account number *</label>
            <input className="input" required value={form.account_number} onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))} />
          </div>
          <div>
            <label className="label">Branch code</label>
            <input className="input" value={form.branch_code} onChange={e => setForm(f => ({ ...f, branch_code: e.target.value }))} />
          </div>
        </div>
      </div>

      <div className="card p-5 border-l-4 border-amber-400 bg-amber-50/50">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700">
            Your banking details are used by SARS to pay your refund directly into your account.
            Please ensure these details are correct and current. If SARS has old details on file,
            your refund will be delayed. This is your responsibility to maintain. Fintec Group
            cannot be held liable for refunds paid to incorrect accounts.
          </p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
      </button>
    </form>
  )
}
