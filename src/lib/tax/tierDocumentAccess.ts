// Which tax_documents.document_type values each paid tier unlocks.
// Basic gets the baseline; each higher tier adds to the one below it.
//
// Note: generate_tax_documents (see src/app/api/tax-cases/route.ts) can
// produce a few document types not explicitly named in the original tier
// spec (Partnership, Airbnb Income) — bucketed under Premium as the most
// complex/highest tier, alongside Rental and Sole Prop, since they're the
// same category of "additional income stream" documents. Worth confirming
// this grouping matches intent.

export const TIER_DOCUMENT_TYPES: Record<string, string[]> = {
  Basic: ['ITA34', 'IRP5'],
  Standard: ['ITA34', 'IRP5', 'Medical Aid Certificate', 'RA Certificate', 'Interest Certificate'],
  Premium: [
    'ITA34', 'IRP5', 'Medical Aid Certificate', 'RA Certificate', 'Interest Certificate',
    'Rental Schedule', 'Sole Prop Financials', 'Partnership', 'Airbnb Income',
  ],
}

export const TIER_ORDER = ['Basic', 'Standard', 'Premium']

export function isDocumentTypeUnlocked(tier: string | null | undefined, documentType: string): boolean {
  if (!tier) return TIER_DOCUMENT_TYPES.Basic.includes(documentType)
  return (TIER_DOCUMENT_TYPES[tier] ?? TIER_DOCUMENT_TYPES.Basic).includes(documentType)
}

export function nextTierFor(tier: string | null | undefined): string | null {
  const idx = TIER_ORDER.indexOf(tier ?? 'Basic')
  if (idx === -1 || idx >= TIER_ORDER.length - 1) return null
  return TIER_ORDER[idx + 1]
}
