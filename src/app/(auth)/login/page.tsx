'use client'
import { useState } from 'react'
import { Shield, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [showPw, setShowPw] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Compliance Hub</h1>
          <p className="text-navy-300 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Real HTML form — browser handles the POST + redirect + cookies natively */}
          <form method="POST" action="/auth/login-action" className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input name="email" type="email" required className="input"
                placeholder="you@example.com" autoComplete="email" />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input name="password" type={showPw ? 'text' : 'password'} required
                  className="input pr-10" placeholder="••••••••"
                  autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-2.5 mt-2">
              Sign in
            </button>
          </form>
        </div>

        <p className="text-center text-navy-400 text-xs mt-6">
          © {new Date().getFullYear()} Fintec Group. All rights reserved.
        </p>
      </div>
    </div>
  )
}