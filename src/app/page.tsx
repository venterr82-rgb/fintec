// src/app/page.tsx
import Link from 'next/link'
import { 
  CheckCircle2, 
  FileText, 
  Shield, 
  Clock, 
  Layers, 
  Building2, 
  HelpCircle, 
  ArrowRight,
  Lock,
  UserCheck
} from 'lucide-react'
import PaymentButton from '@/components/PaymentButton'
import { siteConfig } from '@/lib/config/site'

const tierIcons = [FileText, Layers, Shield]
const tiers = siteConfig.pricingTiers.map((tier, i) => ({ 
  ...tier, 
  icon: tierIcons[i] ?? FileText 
}))

const steps = [
  { 
    num: '01', 
    title: 'Pay online', 
    desc: 'Secure payment via Yoco. Once paid, you gain instant access to your private workspace.' 
  },
  { 
    num: '02', 
    title: 'Create your account', 
    desc: 'Register with your email and set up your client credentials in under 30 seconds.' 
  },
  { 
    num: '03', 
    title: 'Upload your documents', 
    desc: 'Guided document checklist tailored to your return. No paper, no messy email threads.' 
  },
  { 
    num: '04', 
    title: 'We handle the rest', 
    desc: 'Your return is prepared by registered practitioners, approved by you, and submitted to SARS.' 
  },
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
    <div className="min-h-screen bg-[#f8f6f1] text-[#0e1c2f] antialiased" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0e1c2f]/95 backdrop-blur-md border-b border-[#c89b4a]/20 h-16 flex items-center justify-between px-6 lg:px-12">
        <div className="flex items-center gap-3">
          <img src={siteConfig.logoPath} alt={siteConfig.companyName} className="h-9 w-auto" />
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="/login"
            className="text-sm font-medium text-white/80 hover:text-[#c89b4a] transition-colors hidden sm:block"
          >
            Client Login
          </Link>
          <a 
            href="#pricing"
            className="bg-[#c89b4a] hover:bg-[#e0b96a] text-[#0e1c2f] text-sm font-semibold px-5 py-2 rounded-md transition-all duration-200 shadow-sm hover:shadow"
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-24 lg:pt-32 pb-20 bg-[#0e1c2f] relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=80')", backgroundSize: 'cover', backgroundPosition: 'center' }} 
        />
        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12">
          
          <div className="inline-flex items-center gap-2 bg-[#c89b4a]/10 border border-[#c89b4a]/20 px-3.5 py-1.5 rounded-full mb-8">
            <span className="w-2 h-2 rounded-full bg-[#c89b4a] animate-pulse" />
            <span className="text-[#c89b4a] text-xs font-semibold uppercase tracking-widest">
              {siteConfig.companyName} · Client Tax Portal
            </span>
          </div>

          <h1 
            className="text-white font-bold leading-[1.12] mb-6 max-w-3xl"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(38px, 5.5vw, 64px)' }}
          >
            Your tax return,<br />
            <span className="text-[#c89b4a] font-normal italic">handled properly.</span>
          </h1>

          <p className="text-white/70 text-lg sm:text-xl max-w-2xl mb-10 leading-relaxed font-light">
            Registered tax practitioner with 20+ years of expertise. Upload documents online, track progress live, and reach tax clarity without chaotic email exchanges.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-lg">
            <a 
              href="#pricing"
              className="bg-[#c89b4a] hover:bg-[#e0b96a] text-[#0e1c2f] font-semibold px-8 py-4 rounded-md text-base transition-all duration-200 text-center shadow-lg hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
            >
              Get Started — Pay Online
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link 
              href="/login"
              className="border border-[#c89b4a]/40 hover:border-[#c89b4a] text-[#c89b4a] hover:bg-[#c89b4a]/10 px-8 py-4 rounded-md text-base transition-all duration-200 text-center font-medium inline-block"
            >
              Existing Client Login
            </Link>
          </div>

          {/* CREDENTIALS BADGES */}
          <div className="mt-16 pt-10 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {siteConfig.credentials.map(({ val, label }) => (
              <div key={val} className="flex flex-col">
                <span 
                  className="text-[#c89b4a] font-bold leading-none mb-2"
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px' }}
                >
                  {val}
                </span>
                <span className="text-white/40 text-xs font-medium tracking-wider uppercase">{label}</span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6 lg:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <p className="text-[#c89b4a] text-xs font-semibold tracking-[0.2em] uppercase mb-3">Simple Process</p>
          <h2 
            className="text-[#0e1c2f] font-bold mb-16"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 3.5vw, 42px)' }}
          >
            From signup to submitted — in days, not weeks.
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="bg-[#f8f6f1]/50 border border-black/5 rounded-lg p-6 relative flex flex-col justify-between">
                <div>
                  <span 
                    className="text-[#c89b4a] font-bold block mb-2 leading-none opacity-40"
                    style={{ fontFamily: "'Playfair Display', serif", fontSize: '42px' }}
                  >
                    {num}
                  </span>
                  <h3 className="text-[#0e1c2f] font-semibold text-lg mb-2">{title}</h3>
                  <p className="text-[#5a6a7e] text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING & TIERS */}
      <section id="pricing" className="py-24 px-6 lg:px-12 bg-[#f8f6f1] scroll-mt-12">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-14">
            <p className="text-[#c89b4a] text-xs font-semibold tracking-[0.2em] uppercase mb-3">Transparent Pricing</p>
            <h2 
              className="text-[#0e1c2f] font-bold mb-4"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 3.5vw, 42px)' }}
            >
              Personal & Business Tax Services
            </h2>
            <p className="text-[#5a6a7e] text-base leading-relaxed">
              Tailored solutions for individuals, rental owners, sole proprietors, and custom corporate profiles.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            
            {/* Standard Tiers */}
            {tiers.map(({ icon: Icon, name, amount, desc, mostChosen }) => (
              <div 
                key={name} 
                className={`bg-white rounded-xl p-8 flex flex-col justify-between relative border transition-shadow duration-300 ${
                  mostChosen 
                    ? 'border-[#c89b4a] shadow-xl ring-2 ring-[#c89b4a]/20' 
                    : 'border-black/10 shadow-sm hover:shadow-md'
                }`}
              >
                {mostChosen && (
                  <span className="absolute -top-3 right-6 bg-[#c89b4a] text-[#0e1c2f] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                    Most Chosen
                  </span>
                )}
                <div>
                  <div className="w-12 h-12 bg-[#f5edd8] rounded-lg flex items-center justify-center mb-6 shrink-0">
                    <Icon className="w-6 h-6 text-[#c89b4a]" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[#0e1c2f] font-bold text-xl mb-2">{name}</h3>
                  <p className="text-[#5a6a7e] text-sm leading-relaxed mb-6">{desc}</p>
                </div>

                <div className="pt-6 border-t border-black/5 space-y-4 mt-auto">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#0e1c2f] font-bold text-3xl">R {(amount / 100).toLocaleString()}</span>
                    <span className="text-xs text-[#5a6a7e]">/ return</span>
                  </div>
                  <PaymentButton 
                    tierName={name} 
                    amount={amount}
                    className="w-full bg-[#0e1c2f] hover:bg-[#162540] text-white font-medium py-3 px-4 rounded-md text-sm transition-colors flex items-center justify-center"
                  >
                    Get Started
                  </PaymentButton>
                </div>
              </div>
            ))}

            {/* Complex Profile Tier */}
            <div className="bg-white rounded-xl p-8 flex flex-col justify-between border border-black/10 shadow-sm hover:shadow-md">
              <div>
                <div className="w-12 h-12 bg-[#f5edd8] rounded-lg flex items-center justify-center mb-6 shrink-0">
                  <Building2 className="w-6 h-6 text-[#c89b4a]" strokeWidth={1.5} />
                </div>
                <h3 className="text-[#0e1c2f] font-bold text-xl mb-2">{siteConfig.complexProfileTier.name}</h3>
                <p className="text-[#5a6a7e] text-sm leading-relaxed mb-4">
                  {siteConfig.complexProfileTier.subtitle}
                </p>
                <ul className="space-y-2.5 mb-6">
                  {siteConfig.complexProfileTier.features.map(feature => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-[#5a6a7e]">
                      <CheckCircle2 className="w-4 h-4 text-[#c89b4a] shrink-0 mt-0.5" strokeWidth={2} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-black/5 space-y-4 mt-auto">
                <span className="text-[#0e1c2f] font-bold text-2xl block">{siteConfig.complexProfileTier.price}</span>
                <a 
                  href={`mailto:${siteConfig.contact.email}?subject=${encodeURIComponent(siteConfig.complexProfileTier.subject)}`}
                  className="w-full border border-[#0e1c2f] text-[#0e1c2f] hover:bg-[#0e1c2f] hover:text-white font-medium py-3 px-4 rounded-md text-sm transition-colors block text-center"
                >
                  {siteConfig.complexProfileTier.buttonLabel}
                </a>
              </div>
            </div>

            {/* SARS Verification & Audit Tier */}
            <div className="bg-white rounded-xl p-8 flex flex-col justify-between border border-black/10 shadow-sm hover:shadow-md">
              <div>
                <div className="w-12 h-12 bg-[#f5edd8] rounded-lg flex items-center justify-center mb-6 shrink-0">
                  <HelpCircle className="w-6 h-6 text-[#c89b4a]" strokeWidth={1.5} />
                </div>
                <h3 className="text-[#0e1c2f] font-bold text-xl mb-2">{siteConfig.customQuoteTier.name}</h3>
                <p className="text-[#5a6a7e] text-sm leading-relaxed mb-6">
                  {siteConfig.customQuoteTier.desc}
                </p>
              </div>

              <div className="pt-6 border-t border-black/5 space-y-4 mt-auto">
                <span className="text-[#0e1c2f] font-bold text-2xl block">Custom Quote</span>
                <a 
                  href={`mailto:${siteConfig.contact.email}?subject=${encodeURIComponent(siteConfig.customQuoteTier.subject)}`}
                  className="w-full border border-[#0e1c2f] text-[#0e1c2f] hover:bg-[#0e1c2f] hover:text-white font-medium py-3 px-4 rounded-md text-sm transition-colors block text-center"
                >
                  Contact Us
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PORTAL FEATURES */}
      <section className="py-24 px-6 lg:px-12 bg-[#0e1c2f] text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            <div className="lg:col-span-5">
              <p className="text-[#c89b4a] text-xs font-semibold tracking-[0.2em] uppercase mb-3">Portal Features</p>
              <h2 
                className="text-white font-bold mb-6"
                style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 3.5vw, 40px)' }}
              >
                Everything in one place.<br />
                <span className="text-[#c89b4a] font-normal italic">No email chaos.</span>
              </h2>
              <p className="text-white/70 text-base leading-relaxed mb-8 font-light">
                Once registered, access your private client portal from any mobile or desktop device to submit paperwork, track submission milestones, and review annual calculations.
              </p>
              <a 
                href="#pricing"
                className="bg-[#c89b4a] hover:bg-[#e0b96a] text-[#0e1c2f] font-semibold px-8 py-3.5 rounded-md text-sm transition-all inline-flex items-center gap-2"
              >
                Get Access Now
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {included.map(item => (
                <div key={item} className="flex items-start gap-3 bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-lg p-4 transition-colors">
                  <CheckCircle2 className="w-5 h-5 text-[#c89b4a] shrink-0 mt-0.5" strokeWidth={1.75} />
                  <span className="text-white/80 text-sm font-medium leading-snug">{item}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="py-20 px-6 lg:px-12 bg-[#c89b4a]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 
            className="text-[#0e1c2f] font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 3.5vw, 40px)' }}
          >
            Tax season is active. Don't leave it late.
          </h2>
          <p className="text-[#0e1c2f]/80 mb-8 text-lg font-medium">
            SARS auto-assessments open July. Provisional tax submissions due August.
          </p>
          <a 
            href="#pricing"
            className="bg-[#0e1c2f] hover:bg-[#162540] text-white font-semibold px-10 py-4 rounded-md text-base transition-all duration-200 shadow-md inline-flex items-center gap-2"
          >
            Pay & Register Now
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* CONTACT & FOOTER */}
      <section className="py-16 px-6 lg:px-12 bg-[#0e1c2f] border-t border-[#c89b4a]/20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
          <div>
            <img src={siteConfig.logoPath} alt={siteConfig.companyName} className="h-9 w-auto mb-4 opacity-90" />
            <p className="text-white/40 text-sm leading-relaxed">
              Independent accounting and tax practice.<br />
              {siteConfig.location}.
            </p>
          </div>
          {[
            { label: 'Email', val: siteConfig.contact.email, href: `mailto:${siteConfig.contact.email}` },
            { label: 'WhatsApp', val: siteConfig.contact.whatsappDisplay, href: siteConfig.contact.whatsappLink },
          ].map(({ label, val, href }) => (
            <div key={label}>
              <p className="text-[#c89b4a] text-xs font-semibold uppercase tracking-wider mb-2">{label}</p>
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/80 hover:text-[#c89b4a] text-base transition-colors font-medium"
              >
                {val}
              </a>
            </div>
          ))}
        </div>

        <div className="max-w-6xl mx-auto pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/30">
          <p>{siteConfig.footerText}</p>
          <div className="flex items-center gap-4">
            <a href={siteConfig.privacyUrl} className="hover:text-white/60 transition-colors">Privacy Policy</a>
            <span>·</span>
            <a href={`https://${siteConfig.domain}`} className="hover:text-white/60 transition-colors">{siteConfig.domain}</a>
          </div>
        </div>
      </section>

      {/* WHATSAPP FLOATING BUTTON */}
      <a 
        href={siteConfig.contact.whatsappLink} 
        target="_blank" 
        rel="noopener noreferrer"
        aria-label="Contact on WhatsApp"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-110 active:scale-95"
        style={{ background: '#25D366' }}
      >
        <svg viewBox="0 0 24 24" fill="white" width="28" height="28">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.114.554 4.1 1.522 5.828L0 24l6.341-1.499A11.935 11.935 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.214-3.727.881.936-3.618-.235-.372A9.818 9.818 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182c5.421 0 9.818 4.398 9.818 9.818 0 5.421-4.397 9.818-9.818 9.818z"/>
        </svg>
      </a>

    </div>
  )
}