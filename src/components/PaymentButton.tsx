'use client'
import { useState } from 'react'
import { Loader2, X } from 'lucide-react'

export default function PaymentButton({ className, tierName, amount, children }: {
  className?: string
  tierName: string
  amount: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, amount, tierName }),
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Could not start payment. Please try again.')
      setLoading(false)
      return
    }

    window.location.href = json.redirectUrl
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm relative">
            <button type="button" onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-[#0e1c2f] mb-1">
              {tierName} — R{(amount / 100).toLocaleString()}
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              We'll send your registration link to this email once payment is confirmed.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="input" placeholder="you@email.com" autoComplete="email" />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue to payment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
