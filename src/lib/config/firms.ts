// Config for the B2B "sell the platform to accounting firms" page at
// /for-firms. Deliberately separate from src/lib/config/site.ts — that
// file is Fintec's own tax-service branding sold to individual taxpayers;
// this one is the platform's own pricing/positioning sold to firms. Do not
// merge them.

export const firmsConfig = {
  pageTitle: 'White-Label Tax & Compliance Portal for SA Accounting Firms',
  metaDescription:
    'A white-label client portal and tax compliance platform built for South African accounting firms. ZAR pricing, SARS/CIPC-native workflows, your branding, your clients.',

  setupFeeAmount: 150000, // cents = R1,500
  setupFeeLabel: 'Platform Setup Fee — R1,500',

  onboardingCalendarUrl: 'https://calendly.com/rventer-fintecgroup/30min',

  dataRegion: 'eu-west-1 (AWS, Ireland)',

  adminFeatures: [
    'Companies, people & director/shareholder records',
    'Tax case management with document checklists',
    'Compliance calendar with due-date tracking',
    'Document management with client visibility controls',
    'Task management',
    'Bulk import/export',
  ],

  clientFeatures: [
    'Document checklist — see exactly what’s outstanding',
    'Tax calculation summary',
    'Retirement annuity contribution recommendations',
    'Provisional tax due dates',
    '5-year income & tax history view',
  ],

  pricingTiers: [
    {
      name: 'Basic',
      monthly: 349,
      includedClients: 15,
      overageRate: 20,
      scope: 'Tax cases + documents + client portal',
    },
    {
      name: 'Standard',
      monthly: 699,
      includedClients: 40,
      overageRate: 18,
      scope: '+ compliance calendar + tasks',
    },
    {
      name: 'Premium',
      monthly: 1199,
      includedClients: 100,
      overageRate: 15,
      scope: '+ import/export + multi-staff',
    },
  ],

  enterpriseTier: {
    name: 'Enterprise',
    monthly: 'Custom quote',
    includedClients: '100+',
    overageRate: 'Negotiated',
    scope: 'Everything + dedicated onboarding + SLA',
  },

  activeClientFootnote: '"Active client" = a tax case opened for the current tax year.',
} as const
