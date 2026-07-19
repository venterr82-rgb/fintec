// Single source of truth for everything that changes per customer deployment.
// A new white-label instance should only need to edit this file (plus swap
// public/logo.png and the env vars listed in supabase/README or the setup
// runbook) — no hunting through page components for hardcoded strings.

export const siteConfig = {
  companyName: 'Fintec Group',
  legalName: 'Fintec Group (Pty) Ltd',
  logoPath: '/logo.png',
  domain: 'fintecgroup.co.za',
  termsUrl: 'https://fintecgroup.co.za/terms',
  privacyUrl: 'https://fintecgroup.co.za/privacy-policy',

  contact: {
    email: 'rventer@fintecgroup.co.za',
    whatsappDisplay: '+27 64 584 3869',
    whatsappLink: 'https://wa.me/27645843869',
  },

  credentials: [
    { val: '20+', label: 'Years in practice' },
    { val: 'SAIT', label: 'Registered Tax Practitioner' },
    { val: 'CIBA', label: 'Chartered Business Accountant' },
    { val: 'SARS', label: 'PR-0101146' },
  ],

  // Rendered verbatim in footers — keep this as the one place registration
  // numbers live, since they appear on the landing page, login, and register.
  footerText: '© 2026 Fintec Group (Pty) Ltd · SAIT 60630773 · SARS PR-0101146',

  location: 'Table View, Cape Town',

  pricingTiers: [
    {
      name: 'Basic',
      amount: 45000, // cents
      desc: 'One IRP5, no extra income, straightforward return',
      mostChosen: false,
    },
    {
      name: 'Standard',
      amount: 85000,
      desc: 'Medical aid, retirement annuity, multiple IRP5s, or small side income',
      mostChosen: true,
    },
    {
      name: 'Premium',
      amount: 150000,
      desc: 'Provisional tax, rental income, capital gains, or multiple income streams',
      mostChosen: false,
    },
  ],

  customQuoteTier: {
    name: 'SARS Verification',
    desc: 'SARS audit, verification, or dispute assistance. Scope and price depend on the case.',
    subject: 'SARS Verification Assistance',
  },

  complexProfileTier: {
    name: 'Complex Profile',
    subtitle: 'Multiple employers, rental portfolio, business income, partnerships, or Airbnb',
    features: [
      'Everything in Premium',
      'Custom fee based on complexity',
      'Direct engagement with Reghardt',
      'Priority turnaround',
    ],
    price: 'Request a quote',
    buttonLabel: 'Get a quote →',
    subject: 'Custom tax engagement enquiry',
  },
} as const
