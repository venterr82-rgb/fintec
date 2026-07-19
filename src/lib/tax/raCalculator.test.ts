import { describe, it, expect } from 'vitest'
import {
  grossTaxForIncome,
  rebateForAge,
  calculateTax,
  maxDeductibleRA,
  buildScenarios,
  PRIMARY_REBATE,
  SECONDARY_REBATE,
  TERTIARY_REBATE,
  RA_DEDUCTION_CAP,
} from './raCalculator'

describe('grossTaxForIncome (2025/2026 SARS brackets)', () => {
  it('returns 0 for non-positive income', () => {
    expect(grossTaxForIncome(0)).toBe(0)
    expect(grossTaxForIncome(-100)).toBe(0)
  })

  it('taxes the bottom bracket at 18% flat with no base', () => {
    expect(grossTaxForIncome(100000)).toBeCloseTo(18000, 5)
    expect(grossTaxForIncome(237100)).toBeCloseTo(237100 * 0.18, 5)
  })

  it('applies base + marginal rate at a bracket boundary', () => {
    // Just above the first threshold: base carries over, marginal rate steps up.
    expect(grossTaxForIncome(237101)).toBeCloseTo(42678 + 1 * 0.26, 2)
  })

  it('matches known bracket bases at each threshold', () => {
    expect(grossTaxForIncome(370500)).toBeCloseTo(42678 + (370500 - 237100) * 0.26, 2)
    expect(grossTaxForIncome(512800)).toBeCloseTo(77362 + (512800 - 370500) * 0.31, 2)
    expect(grossTaxForIncome(673000)).toBeCloseTo(121475 + (673000 - 512800) * 0.36, 2)
    expect(grossTaxForIncome(857900)).toBeCloseTo(179147 + (857900 - 673000) * 0.39, 2)
    expect(grossTaxForIncome(1817000)).toBeCloseTo(251258 + (1817000 - 857900) * 0.41, 2)
  })

  it('taxes the top bracket at 45%', () => {
    expect(grossTaxForIncome(2000000)).toBeCloseTo(644489 + (2000000 - 1817000) * 0.45, 2)
  })
})

describe('rebateForAge', () => {
  it('gives only the primary rebate under 65', () => {
    expect(rebateForAge(30)).toBe(PRIMARY_REBATE)
    expect(rebateForAge(64)).toBe(PRIMARY_REBATE)
  })

  it('adds the secondary rebate at 65+', () => {
    expect(rebateForAge(65)).toBe(PRIMARY_REBATE + SECONDARY_REBATE)
    expect(rebateForAge(74)).toBe(PRIMARY_REBATE + SECONDARY_REBATE)
  })

  it('adds the tertiary rebate at 75+', () => {
    expect(rebateForAge(75)).toBe(PRIMARY_REBATE + SECONDARY_REBATE + TERTIARY_REBATE)
    expect(rebateForAge(90)).toBe(PRIMARY_REBATE + SECONDARY_REBATE + TERTIARY_REBATE)
  })
})

describe('calculateTax', () => {
  it('never goes negative once rebates exceed gross tax', () => {
    expect(calculateTax(50000, 30)).toBe(0)
  })

  it('subtracts the age-appropriate rebate from gross tax', () => {
    const gross = grossTaxForIncome(400000)
    expect(calculateTax(400000, 30)).toBeCloseTo(gross - PRIMARY_REBATE, 2)
    expect(calculateTax(400000, 66)).toBeCloseTo(gross - PRIMARY_REBATE - SECONDARY_REBATE, 2)
  })
})

describe('maxDeductibleRA', () => {
  it('is 27.5% of the higher of taxable income or remuneration', () => {
    expect(maxDeductibleRA(400000, 300000)).toBeCloseTo(400000 * 0.275, 5)
    expect(maxDeductibleRA(300000, 400000)).toBeCloseTo(400000 * 0.275, 5)
  })

  it('is capped at R350,000 regardless of income', () => {
    expect(maxDeductibleRA(5000000, 0)).toBe(RA_DEDUCTION_CAP)
  })

  it('treats a missing/zero remuneration as not raising the basis', () => {
    expect(maxDeductibleRA(200000, 0)).toBeCloseTo(200000 * 0.275, 5)
  })
})

describe('buildScenarios', () => {
  it('produces a scenario at RA=0 and includes the max deductible as the final entry', () => {
    const scenarios = buildScenarios({
      taxableIncome: 500000,
      age: 30,
      currentRAAnnual: 0,
      maxDeductible: 137500, // 500000 * 0.275
      step: 10000,
    })
    expect(scenarios[0].raAmount).toBe(0)
    expect(scenarios[scenarios.length - 1].raAmount).toBe(137500)
  })

  it('increasing RA never increases tax payable', () => {
    const scenarios = buildScenarios({
      taxableIncome: 800000,
      age: 40,
      currentRAAnnual: 0,
      maxDeductible: 220000,
      step: 10000,
    })
    for (let i = 1; i < scenarios.length; i++) {
      expect(scenarios[i].tax).toBeLessThanOrEqual(scenarios[i - 1].tax)
    }
  })

  it('savingVsNoRA is 0 at RA=0 and grows with contribution', () => {
    const scenarios = buildScenarios({
      taxableIncome: 600000,
      age: 30,
      currentRAAnnual: 0,
      maxDeductible: 165000,
      step: 10000,
    })
    expect(scenarios[0].savingVsNoRA).toBe(0)
    expect(scenarios[scenarios.length - 1].savingVsNoRA).toBeGreaterThan(0)
  })
})
