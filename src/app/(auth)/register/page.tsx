// src/app/(auth)/register/page.tsx
// Self-registration after Yoco payment
// Registration email links to: /register?token={yoco_payment_id}

'use client'
import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shield, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const tier = searchParams.get('tier')
  const amount = searchParams.get('amount')

  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // If someone navigates directly without ?paid=true, warn them
  // but don't block — Yoco webhook verification handles this properly in Phase 2

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        token,
      }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Registration failed. Please try again.'); setLoading(false); return }

    // Auto-login after registration
    const loginRes = await fetch('/auth/login-action', {
      method: 'POST',
      body: (() => { const fd = new FormData(); fd.append('email', form.email); fd.append('password', form.password); return fd })(),
    })
    // login-action redirects — follow it
    window.location.href = '/my-company'
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <img src="https://fintecgroup.co.za/wp-content/uploads/2026/05/FG_Logo_transparent.png"
            alt="Fintec Group" style={{ height: '64px', width: 'auto' }} className="mb-4" />
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-navy-300 text-sm mt-1">Fintec Group Client Portal</p>
        </div>

        {/* Selected tier confirmation */}
        {tier && amount && (
          <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-xl px-5 py-4 mb-5 text-center">
            <p className="text-emerald-300 text-sm font-medium">✓ {tier} package — R{amount} paid</p>
          </div>
        )}

        {/* Payment confirmation banner */}
        {token && (
          <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-xl px-5 py-4 mb-5 text-center">
            <p className="text-emerald-300 text-sm font-medium">✓ Payment received — create your account below</p>
          </div>
        )}
        {!token && (
          <div className="bg-amber-500/20 border border-amber-400/40 rounded-xl px-5 py-4 mb-5 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-300 text-sm">
              Please complete payment before registering.{' '}
              <a href="/" className="underline hover:text-amber-200">Go back →</a>
            </p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input type="text" required value={form.full_name} onChange={set('full_name')}
                className="input" placeholder="Reghardt Venter" autoComplete="name" />
            </div>
            <div>
              <label className="label">Email address</label>
              <input type="email" required value={form.email} onChange={set('email')}
                className="input" placeholder="you@email.com" autoComplete="email" />
            </div>
            <div>
              <label className="label">Phone number</label>
              <input type="tel" value={form.phone} onChange={set('phone')}
                className="input" placeholder="071 234 5678" autoComplete="tel" />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required value={form.password}
                  onChange={set('password')} className="input pr-10" placeholder="Min 8 characters"
                  autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input type="password" required value={form.confirm} onChange={set('confirm')}
                className="input" placeholder="Repeat password" autoComplete="new-password" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create account & go to portal'}
            </button>

            <p className="text-center text-xs text-slate-400 mt-4">
              By creating an account you agree to our{' '}
              <a href="https://fintecgroup.co.za/terms"
                 className="text-navy-600 hover:underline">Terms of Use</a>
              {' '}and{' '}
              <a href="https://fintecgroup.co.za/privacy-policy"
                 className="text-navy-600 hover:underline">Privacy Policy</a>.
              {' '}Your information is handled in accordance with POPIA.
            </p>
          </form>

          <p className="text-center text-slate-400 text-xs mt-5">
            Already have an account?{' '}
            <a href="/login" className="text-navy-600 hover:underline">Sign in</a>
          </p>
        </div>

        <p className="text-center text-navy-400 text-xs mt-6">
          © 2026 Fintec Group (Pty) Ltd · SAIT 60630773 · SARS PR-0101146
        </p>
      </div>
    </div>
  )
}
