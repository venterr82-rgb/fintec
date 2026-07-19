// Which tax_documents.document_type values each paid tier unlocks.
// Basic gets the baseline; each higher tier adds to the one below it.
// Values match people.tier's CHECK constraint: basic/standard/premium/custom.
//
// Note: generate_tax_documents (see src/app/api/tax-cases/route.ts) can
// produce a few document types not explicitly named in the original tier
// spec (Partnership, Airbnb Income) — bucketed under Premium as the most
// complex/highest tier, alongside Rental and Sole Prop, since they're the
// same category of "additional income stream" documents. Worth confirming
// this grouping matches intent.
//
// 'custom' is for bespoke retainer clients who don't fit the standard
// tiers at all — treated as unrestricted (same document set as premium)
// rather than gated, since there's no fixed price point to gate against.

export const TIER_DOCUMENT_TYPES: Record<string, string[]> = {
  basic: ['ITA34', 'IRP5'],
  standard: ['ITA34', 'IRP5', 'Medical Aid Certificate', 'RA Certificate', 'Interest Certificate'],
  premium: [
    'ITA34', 'IRP5', 'Medical Aid Certificate', 'RA Certificate', 'Interest Certificate',
    'Rental Schedule', 'Sole Prop Financials', 'Partnership', 'Airbnb Income',
  ],
  custom: [
    'ITA34', 'IRP5', 'Medical Aid Certificate', 'RA Certificate', 'Interest Certificate',
    'Rental Schedule', 'Sole Prop Financials', 'Partnership', 'Airbnb Income',
  ],
}

export const TIER_ORDER = ['basic', 'standard', 'premium']

export function isDocumentTypeUnlocked(tier: string | null | undefined, documentType: string): boolean {
  const key = (tier ?? 'basic').toLowerCase()
  return (TIER_DOCUMENT_TYPES[key] ?? TIER_DOCUMENT_TYPES.basic).includes(documentType)
}

export function nextTierFor(tier: string | null | undefined): string | null {
  const key = (tier ?? 'basic').toLowerCase()
  if (key === 'custom') return null // custom clients aren't upgraded through the standard tier ladder
  const idx = TIER_ORDER.indexOf(key)
  if (idx === -1 || idx >= TIER_ORDER.length - 1) return null
  return TIER_ORDER[idx + 1]
}

export const TIER_LABELS: Record<string, string> = {
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium',
  custom: 'Custom',
}
