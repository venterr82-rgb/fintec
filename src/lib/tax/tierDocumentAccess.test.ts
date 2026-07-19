import { describe, it, expect } from 'vitest'
import { isDocumentTypeUnlocked, nextTierFor, TIER_ORDER, TIER_DOCUMENT_TYPES } from './tierDocumentAccess'

describe('isDocumentTypeUnlocked', () => {
  it('unlocks baseline document types for basic', () => {
    expect(isDocumentTypeUnlocked('basic', 'ITA34')).toBe(true)
    expect(isDocumentTypeUnlocked('basic', 'IRP5')).toBe(true)
  })

  it('does not unlock higher-tier-only document types for basic', () => {
    expect(isDocumentTypeUnlocked('basic', 'Rental Schedule')).toBe(false)
    expect(isDocumentTypeUnlocked('basic', 'Medical Aid Certificate')).toBe(false)
  })

  it('standard unlocks its own set but not premium-only types', () => {
    expect(isDocumentTypeUnlocked('standard', 'Medical Aid Certificate')).toBe(true)
    expect(isDocumentTypeUnlocked('standard', 'Rental Schedule')).toBe(false)
  })

  it('premium unlocks everything standard does plus multi-income-stream types', () => {
    expect(isDocumentTypeUnlocked('premium', 'Rental Schedule')).toBe(true)
    expect(isDocumentTypeUnlocked('premium', 'Partnership')).toBe(true)
    expect(isDocumentTypeUnlocked('premium', 'Airbnb Income')).toBe(true)
  })

  it('custom is unrestricted, same as premium', () => {
    for (const type of TIER_DOCUMENT_TYPES.premium) {
      expect(isDocumentTypeUnlocked('custom', type)).toBe(true)
    }
  })

  it('treats a null/missing tier as basic', () => {
    expect(isDocumentTypeUnlocked(null, 'ITA34')).toBe(true)
    expect(isDocumentTypeUnlocked(undefined, 'Rental Schedule')).toBe(false)
  })

  it('is case-insensitive on the tier value', () => {
    expect(isDocumentTypeUnlocked('Premium', 'Rental Schedule')).toBe(true)
  })

  it('rejects an unrecognized document type', () => {
    expect(isDocumentTypeUnlocked('premium', 'Nonexistent Doc Type')).toBe(false)
  })
})

describe('nextTierFor', () => {
  it('progresses basic -> standard -> premium', () => {
    expect(nextTierFor('basic')).toBe('standard')
    expect(nextTierFor('standard')).toBe('premium')
  })

  it('has no next tier beyond premium', () => {
    expect(nextTierFor('premium')).toBeNull()
  })

  it('never offers an upgrade path for custom clients', () => {
    expect(nextTierFor('custom')).toBeNull()
  })

  it('treats a missing tier as basic', () => {
    expect(nextTierFor(null)).toBe('standard')
  })
})

describe('TIER_ORDER', () => {
  it('does not include custom (custom is off the standard ladder)', () => {
    expect(TIER_ORDER).not.toContain('custom')
  })
})
