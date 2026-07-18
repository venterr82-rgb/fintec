// src/app/for-firms/page.tsx
// B2B landing page selling the platform itself to accounting firms.
// Deliberately separate from the root landing page (/), which sells
// Fintec's own tax service to individual taxpayers — do not merge
// messaging, pricing, or config between the two.

import type { Metadata } from 'next'
import { CheckCircle, Shield, Lock, Globe } from 'lucide-react'
import FirmLeadForm from '@/components/FirmLeadForm'
import { firmsConfig } from '@/lib/config/firms'

export const metadata: Metadata = {
  title: firmsConfig.pageTitle,
  description: firmsConfig.metaDescription,
}

export default function ForFirmsPage({ searchParams }: { searchParams: { paid?: string } }) {
  const justPaid = searchParams.paid === 'true'

  return (
    <div className="min-h-screen bg-[#f8f6f1]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0e1c2f] border-b border-[#c89b4a]/20 h-16 flex items-center px-6 lg:px-12">
        <img src="/logo.png" alt="Fintec Group" className="h-10 w-auto" />
      </nav>

      {/* HERO */}
      <section className="pt-16 bg-[#0e1c2f] min-h-[70vh] flex items-center relative overflow-hidden">
        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12 py-24">
          <p className="text-[#c89b4a] text-xs tracking-[0.18em] uppercase font-normal mb-7">
            For South African Accounting Firms
          </p>
          <h1 className="text-white font-bold leading-[1.1] mb-7"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(32px, 4.5vw, 56px)' }}>
            Your firm, <em className="text-[#c89b4a] font-normal italic">your brand,</em><br />
            a real tax &amp; compliance portal.
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mb-6 leading-relaxed">
            A white-label client portal built for the way South African firms actually work —
            SARS and CIPC-native, priced in Rand, and nothing like the enterprise overhead of
            GreatSoft or the generic international workflow of TaxDome and Karbon.
          </p>
          <p className="text-white/40 text-sm max-w-2xl">
            Accessible pricing for firms of every size. Your clients only ever see your firm's
            branding — never Fintec Group's, and never another firm on the platform.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-6 lg:px-12 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <p className="text-[#c89b4a] text-xs tracking-[0.18em] uppercase mb-4">Admin portal</p>
            <h2 className="text-[#0e1c2f] font-bold mb-6"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(22px, 2.5vw, 30px)' }}>
              Everything your team needs.
            </h2>
            <ul className="space-y-3">
              {firmsConfig.adminFeatures.map(item => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-[#c89b4a] shrink-0 mt-0.5" strokeWidth={1.5} />
                  <span className="text-[#5a6a7e] text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[#c89b4a] text-xs tracking-[0.18em] uppercase mb-4">Client portal</p>
            <h2 className="text-[#0e1c2f] font-bold mb-6"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(22px, 2.5vw, 30px)' }}>
              What your clients see.
            </h2>
            <ul className="space-y-3">
              {firmsConfig.clientFeatures.map(item => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-[#c89b4a] shrink-0 mt-0.5" strokeWidth={1.5} />
                  <span className="text-[#5a6a7e] text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-24 px-6 lg:px-12 bg-[#f8f6f1]">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#c89b4a] text-xs tracking-[0.18em] uppercase mb-4">Pricing</p>
          <h2 className="text-[#0e1c2f] font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3vw, 40px)' }}>
            Priced for how many active clients you run.
          </h2>
          <p className="text-[#5a6a7e] text-base max-w-lg mb-10 leading-relaxed">
            {firmsConfig.activeClientFootnote}
          </p>

          <div className="overflow-x-auto rounded border border-black/[0.06]">
            <table className="w-full text-sm bg-white min-w-[640px]">
              <thead className="bg-[#0e1c2f]">
                <tr>
                  <th className="text-left text-white/70 font-medium px-5 py-4">Tier</th>
                  <th className="text-left text-white/70 font-medium px-5 py-4">Monthly base</th>
                  <th className="text-left text-white/70 font-medium px-5 py-4">Included clients</th>
                  <th className="text-left text-white/70 font-medium px-5 py-4">Overage</th>
                  <th className="text-left text-white/70 font-medium px-5 py-4">Scope</th>
                </tr>
              </thead>
              <tbody>
                {firmsConfig.pricingTiers.map(tier => (
                  <tr key={tier.name} className="border-t border-black/[0.06]">
                    <td className="px-5 py-4 font-semibold text-[#0e1c2f]">{tier.name}</td>
                    <td className="px-5 py-4 text-[#5a6a7e]">R{tier.monthly}/mo</td>
                    <td className="px-5 py-4 text-[#5a6a7e]">Up to {tier.includedClients}</td>
                    <td className="px-5 py-4 text-[#5a6a7e]">R{tier.overageRate}/client above {tier.includedClients}</td>
                    <td className="px-5 py-4 text-[#5a6a7e]">{tier.scope}</td>
                  </tr>
                ))}
                <tr className="border-t border-black/[0.06]">
                  <td className="px-5 py-4 font-semibold text-[#0e1c2f]">{firmsConfig.enterpriseTier.name}</td>
                  <td className="px-5 py-4 text-[#5a6a7e]">{firmsConfig.enterpriseTier.monthly}</td>
                  <td className="px-5 py-4 text-[#5a6a7e]">{firmsConfig.enterpriseTier.includedClients}</td>
                  <td className="px-5 py-4 text-[#5a6a7e]">{firmsConfig.enterpriseTier.overageRate}</td>
                  <td className="px-5 py-4 text-[#5a6a7e]">{firmsConfig.enterpriseTier.scope}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="py-20 px-6 lg:px-12 bg-[#0e1c2f]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-start">
            <Lock className="w-6 h-6 text-[#c89b4a] mb-3" strokeWidth={1.5} />
            <h3 className="text-white font-medium mb-2">Your clients stay yours</h3>
            <p className="text-white/50 text-sm leading-relaxed">
              Every firm's data is isolated at the database level. Your clients never see
              another firm's data, and another firm never sees yours.
            </p>
          </div>
          <div className="flex flex-col items-start">
            <Shield className="w-6 h-6 text-[#c89b4a] mb-3" strokeWidth={1.5} />
            <h3 className="text-white font-medium mb-2">POPIA compliant</h3>
            <p className="text-white/50 text-sm leading-relaxed">
              Built around South Africa's Protection of Personal Information Act from the
              ground up, not retrofitted for it.
            </p>
          </div>
          <div className="flex flex-col items-start">
            <Globe className="w-6 h-6 text-[#c89b4a] mb-3" strokeWidth={1.5} />
            <h3 className="text-white font-medium mb-2">Hosted responsibly</h3>
            <p className="text-white/50 text-sm leading-relaxed">
              Infrastructure hosted in {firmsConfig.dataRegion}, on the same platform used by
              enterprise SaaS products worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* SETUP FEE / LEAD FORM */}
      <section className="py-24 px-6 lg:px-12 bg-[#c89b4a]" id="get-started">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            {justPaid ? (
              <>
                <h2 className="text-[#0e1c2f] font-bold mb-4"
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3vw, 36px)' }}>
                  Payment received — check your email.
                </h2>
                <p className="text-[#0e1c2f]/70 text-base leading-relaxed">
                  We've sent a link to book your onboarding call. If it doesn't arrive within a
                  few minutes, check spam or reach out from the email you used at checkout.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-[#0e1c2f] font-bold mb-4"
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3vw, 36px)' }}>
                  {firmsConfig.setupFeeLabel}
                </h2>
                <p className="text-[#0e1c2f]/70 text-base leading-relaxed mb-4">
                  A one-time, non-refundable setup fee covers onboarding your firm onto the
                  platform. Pay it below to book your onboarding call — this is the only way to
                  reach onboarding; there's no free discovery call.
                </p>
                <p className="text-[#0e1c2f]/50 text-sm">
                  Your approximate client count helps us suggest the right monthly tier during
                  onboarding — it doesn't change the setup fee.
                </p>
              </>
            )}
          </div>
          <div className="flex justify-center lg:justify-end">
            {!justPaid && <FirmLeadForm />}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0e1c2f] border-t border-white/[0.06] px-6 lg:px-12 py-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-white/20 text-xs">© 2026 Fintec Group (Pty) Ltd · SAIT 60630773 · SARS PR-0101146</p>
        </div>
      </footer>
    </div>
  )
}
