// src/app/page.tsx
// Public landing page at portal.fintecgroup.co.za
// Replaces the current redirect — unauthenticated visitors see this
// Authenticated users are redirected by middleware to /dashboard or /my-company

import Link from 'next/link'
import { CheckCircle, FileText, Upload, TrendingUp, Shield, Clock } from 'lucide-react'
import PaymentButton from '@/components/PaymentButton'
import { siteConfig } from '@/lib/config/site'

const tierIcons = [FileText, TrendingUp, Shield]
const tiers = siteConfig.pricingTiers.map((tier, i) => ({ ...tier, icon: tierIcons[i] ?? FileText }))

const steps = [
  { num: '01', title: 'Pay online', desc: 'Secure payment via Yoco. Once paid you receive instant access.' },
  { num: '02', title: 'Create your account', desc: 'Register with your email and set a password. Takes 30 seconds.' },
  { num: '03', title: 'Upload your documents', desc: 'We guide you through exactly what we need. No paperwork, no emails.' },
  { num: '04', title: 'We handle the rest', desc: 'Your return is prepared, you approve it, we submit to SARS.' },
]

const included = [
  'Secure document upload portal',
  'Real-time status updates',
  'Tax calculation summary',
  'Provisional tax planning',
  'RA contribution advice',
  'Direct accountant access',
  'SARS correspondence handled',
  '5-year income history view',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8f6f1]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0e1c2f] border-b border-[#c89b4a]/20 h-16 flex items-center justify-between px-6 lg:px-12">
        <div className="flex items-center gap-3">
          <img src={siteConfig.logoPath} alt={siteConfig.companyName} className="h-10 w-auto" />
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login"
            className="text-sm text-white/60 hover:text-[#c89b4a] transition-colors hidden sm:block">
            Client Login
          </Link>
          <a href="#pricing"
            className="bg-[#c89b4a] hover:bg-[#e0b96a] text-[#0e1c2f] text-sm font-medium px-5 py-2.5 rounded transition-colors">
            Get Started
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-16 bg-[#0e1c2f] min-h-[90vh] flex items-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=80')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12 py-24">
          <p className="text-[#c89b4a] text-xs tracking-[0.18em] uppercase font-normal mb-7">
            {siteConfig.companyName} · Client Tax Portal
          </p>
          <h1 className="text-white font-bold leading-[1.1] mb-7"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(36px, 5vw, 64px)' }}>
            Your tax return,<br />
            <em className="text-[#c89b4a] font-normal italic">handled properly.</em>
          </h1>
          <p className="text-white/60 text-lg max-w-xl mb-10 leading-relaxed">
            Registered tax practitioner. 20+ years experience. Upload your documents online,
            track your return in real time, and get clarity on your tax position — without the back-and-forth emails.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#pricing"
              className="bg-[#c89b4a] hover:bg-[#e0b96a] text-[#0e1c2f] font-medium px-9 py-4 rounded text-base transition-all hover:-translate-y-0.5 inline-block">
              Get Started — Pay Online
            </a>
            <Link href="/login"
              className="border border-[#c89b4a]/50 hover:border-[#c89b4a] text-[#c89b4a] px-9 py-4 rounded text-base transition-colors inline-block">
              Existing Client Login
            </Link>
          </div>

          {/* Credentials */}
          <div className="mt-16 pt-10 border-t border-white/[0.08] flex flex-wrap gap-10">
            {siteConfig.credentials.map(({ val, label }) => (
              <div key={val} className="flex flex-col">
                <span className="text-[#c89b4a] font-bold leading-none mb-1.5"
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px' }}>{val}</span>
                <span className="text-white/35 text-xs tracking-wider uppercase">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6 lg:px-12 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#c89b4a] text-xs tracking-[0.18em] uppercase mb-4">Simple process</p>
          <h2 className="text-[#0e1c2f] font-bold mb-16"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3vw, 40px)' }}>
            From signup to submitted — in days, not weeks.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="relative">
                <div className="text-[#c89b4a]/15 font-bold mb-4 leading-none select-none"
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: '56px' }}>{num}</div>
                <h3 className="text-[#0e1c2f] font-medium text-lg mb-3">{title}</h3>
                <p className="text-[#5a6a7e] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-6 lg:px-12 bg-[#f8f6f1] scroll-mt-16">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#c89b4a] text-xs tracking-[0.18em] uppercase mb-4">What's included</p>
          <h2 className="text-[#0e1c2f] font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3vw, 40px)' }}>
            Personal tax services.
          </h2>
          <p className="text-[#5a6a7e] text-base max-w-lg mb-14 leading-relaxed">
            For individuals with employment income, rental properties, sole proprietor income, investments, or a combination.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-black/[0.06] rounded overflow-hidden border border-black/[0.06]">
            {tiers.map(({ icon: Icon, name, amount, desc, mostChosen }) => (
              <div key={name} className={`bg-white p-10 flex flex-col relative ${mostChosen ? 'ring-2 ring-inset ring-[#c89b4a]' : ''}`}>
                {mostChosen && (
                  <span className="absolute top-4 right-4 bg-[#c89b4a] text-[#0e1c2f] text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                    Most chosen
                  </span>
                )}
                <div className="w-12 h-12 bg-[#f5edd8] rounded flex items-center justify-center mb-6 shrink-0">
                  <Icon className="w-5 h-5 text-[#c89b4a]" strokeWidth={1.5} />
                </div>
                <h3 className="text-[#0e1c2f] font-medium text-lg mb-3">{name}</h3>
                <p className="text-[#5a6a7e] text-sm leading-relaxed flex-1 mb-6">{desc}</p>
                <div className="pt-5 border-t border-black/[0.06] space-y-4">
                  <span className="text-[#c89b4a] font-medium text-sm block">R {(amount / 100).toLocaleString()}</span>
                  <PaymentButton tierName={name} amount={amount}
                    className="btn-primary w-full justify-center text-sm">
                    Get Started
                  </PaymentButton>
                </div>
              </div>
            ))}
            <div className="bg-white p-10 flex flex-col">
              <div className="w-12 h-12 bg-[#f5edd8] rounded flex items-center justify-center mb-6 shrink-0">
                <Shield className="w-5 h-5 text-[#c89b4a]" strokeWidth={1.5} />
              </div>
              <h3 className="text-[#0e1c2f] font-medium text-lg mb-3">{siteConfig.customQuoteTier.name}</h3>
              <p className="text-[#5a6a7e] text-sm leading-relaxed flex-1 mb-6">
                {siteConfig.customQuoteTier.desc}
              </p>
              <div className="pt-5 border-t border-black/[0.06] space-y-4">
                <span className="text-[#c89b4a] font-medium text-sm block">Custom quote</span>
                <a href={`mailto:${siteConfig.contact.email}?subject=${encodeURIComponent(siteConfig.customQuoteTier.subject)}`}
                  className="btn-secondary w-full justify-center text-sm">
                  Contact us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="py-24 px-6 lg:px-12 bg-[#0e1c2f]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[#c89b4a] text-xs tracking-[0.18em] uppercase mb-4">Your portal includes</p>
              <h2 className="text-white font-bold mb-6"
                style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3vw, 36px)' }}>
                Everything in one place.<br />
                <em className="text-[#c89b4a] font-normal italic">No email chaos.</em>
              </h2>
              <p className="text-white/50 text-base leading-relaxed mb-8">
                Once you register, you get a private client portal where you can see your tax status,
                upload documents, view your calculation, and track your return — from any device.
              </p>
              <a href="#pricing"
                className="bg-[#c89b4a] hover:bg-[#e0b96a] text-[#0e1c2f] font-medium px-8 py-3.5 rounded text-sm transition-colors inline-block">
                Get Access Now
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {included.map(item => (
                <div key={item} className="flex items-start gap-3 bg-white/[0.05] rounded p-4">
                  <CheckCircle className="w-4 h-4 text-[#c89b4a] shrink-0 mt-0.5" strokeWidth={1.5} />
                  <span className="text-white/70 text-sm leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="py-20 px-6 lg:px-12 bg-[#c89b4a]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-[#0e1c2f] font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3vw, 36px)' }}>
            Tax season is now. Don't leave it late.
          </h2>
          <p className="text-[#0e1c2f]/60 mb-8 text-base">
            SARS auto-assessments open July. Provisional tax due August. Get ahead of it.
          </p>
          <a href="#pricing"
            className="bg-[#0e1c2f] hover:bg-[#162540] text-white font-medium px-10 py-4 rounded text-base transition-colors inline-block">
            Pay & Register Now →
          </a>
        </div>
      </section>

      {/* CONTACT */}
      <section className="py-20 px-6 lg:px-12 bg-[#0e1c2f] border-t border-[#c89b4a]/10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <img src={siteConfig.logoPath} alt={siteConfig.companyName} className="h-10 w-auto mb-4 opacity-80" />
            <p className="text-white/30 text-sm leading-relaxed">
              Independent accounting and tax practice.<br />
              {siteConfig.location}.
            </p>
          </div>
          {[
            { label: 'Email', val: siteConfig.contact.email, href: `mailto:${siteConfig.contact.email}` },
            { label: 'WhatsApp', val: siteConfig.contact.whatsappDisplay, href: siteConfig.contact.whatsappLink },
          ].map(({ label, val, href }) => (
            <div key={label}>
              <p className="text-white/30 text-xs uppercase tracking-wider mb-2">{label}</p>
              <a href={href} target="_blank" rel="noopener noreferrer"
                className="text-[#c89b4a] hover:text-[#e0b96a] text-base transition-colors">
                {val}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0e1c2f] border-t border-white/[0.06] px-6 lg:px-12 py-6">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-between gap-4">
          <p className="text-white/20 text-xs">{siteConfig.footerText}</p>
          <p className="text-white/20 text-xs">
            <a href={siteConfig.privacyUrl} className="hover:text-white/40">Privacy Policy</a>
            {' · '}
            <a href={`https://${siteConfig.domain}`} className="hover:text-white/40">{siteConfig.domain}</a>
          </p>
        </div>
      </footer>

      {/* WHATSAPP FLOAT */}
      <a href={siteConfig.contact.whatsappLink} target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
        style={{ background: '#25D366' }}>
        <svg viewBox="0 0 24 24" fill="white" width="28" height="28">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.114.554 4.1 1.522 5.828L0 24l6.341-1.499A11.935 11.935 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.214-3.727.881.936-3.618-.235-.372A9.818 9.818 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182c5.421 0 9.818 4.398 9.818 9.818 0 5.421-4.397 9.818-9.818 9.818z"/>
        </svg>
      </a>
    </div>
  )
}
