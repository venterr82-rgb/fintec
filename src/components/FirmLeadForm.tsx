'use client'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function FirmLeadForm() {
  const [form, setForm] = useState({ firmName: '', contactName: '', email: '', phone: '', approxClientCount: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const leadRes = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firmName: form.firmName,
        contactName: form.contactName,
        email: form.email,
        phone: form.phone,
        approxClientCount: form.approxClientCount || null,
      }),
    })
    const leadJson = await leadRes.json()

    if (!leadRes.ok) {
      setError(leadJson.error ?? 'Could not save your details. Please try again.')
      setLoading(false)
      return
    }

    const checkoutRes = await fetch('/api/leads/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: leadJson.leadId }),
    })
    const checkoutJson = await checkoutRes.json()

    if (!checkoutRes.ok) {
      setError(checkoutJson.error ?? 'Could not start payment. Please try again.')
      setLoading(false)
      return
    }

    window.location.href = checkoutJson.redirectUrl
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
      <div>
        <label className="label">Firm name</label>
        <input type="text" required value={form.firmName} onChange={set('firmName')}
          className="input" placeholder="Your Accounting Firm" />
      </div>
      <div>
        <label className="label">Contact name</label>
        <input type="text" required value={form.contactName} onChange={set('contactName')}
          className="input" placeholder="Your name" autoComplete="name" />
      </div>
      <div>
        <label className="label">Email address</label>
        <input type="email" required value={form.email} onChange={set('email')}
          className="input" placeholder="you@yourfirm.co.za" autoComplete="email" />
      </div>
      <div>
        <label className="label">Phone number</label>
        <input type="tel" value={form.phone} onChange={set('phone')}
          className="input" placeholder="071 234 5678" autoComplete="tel" />
      </div>
      <div>
        <label className="label">Approximate number of clients</label>
        <input type="number" min={1} value={form.approxClientCount} onChange={set('approxClientCount')}
          className="input" placeholder="e.g. 25" />
        <p className="text-xs text-slate-400 mt-1">Used to suggest the right tier — doesn't affect the setup fee.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Pay R1,500 setup fee & book onboarding'}
      </button>
      <p className="text-xs text-slate-400 text-center">
        Non-refundable. Covers onboarding — not a deposit or credit against future fees.
      </p>
    </form>
  )
}
