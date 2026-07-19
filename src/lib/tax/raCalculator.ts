// 2025/2026 SARS individual tax brackets and rebates (s6 primary/secondary/
// tertiary) and the s11F retirement fund contribution deduction cap.

export const TAX_BRACKETS_2026 = [
  { upTo: 237100, rate: 0.18, base: 0 },
  { upTo: 370500, rate: 0.26, base: 42678 },
  { upTo: 512800, rate: 0.31, base: 77362 },
  { upTo: 673000, rate: 0.36, base: 121475 },
  { upTo: 857900, rate: 0.39, base: 179147 },
  { upTo: 1817000, rate: 0.41, base: 251258 },
  { upTo: Infinity, rate: 0.45, base: 644489 },
]

const BRACKET_FLOORS = [0, 237100, 370500, 512800, 673000, 857900, 1817000]

export const PRIMARY_REBATE = 17235
export const SECONDARY_REBATE = 9444 // age 65+
export const TERTIARY_REBATE = 3145 // age 75+

export const RA_DEDUCTION_RATE = 0.275
export const RA_DEDUCTION_CAP = 350000

export function rebateForAge(age: number): number {
  let rebate = PRIMARY_REBATE
  if (age >= 65) rebate += SECONDARY_REBATE
  if (age >= 75) rebate += TERTIARY_REBATE
  return rebate
}

export function grossTaxForIncome(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0
  const bracketIndex = TAX_BRACKETS_2026.findIndex(b => taxableIncome <= b.upTo)
  const bracket = TAX_BRACKETS_2026[bracketIndex === -1 ? TAX_BRACKETS_2026.length - 1 : bracketIndex]
  const floor = BRACKET_FLOORS[bracketIndex === -1 ? BRACKET_FLOORS.length - 1 : bracketIndex]
  return bracket.base + (taxableIncome - floor) * bracket.rate
}

export function calculateTax(taxableIncome: number, age: number): number {
  const gross = grossTaxForIncome(taxableIncome)
  return Math.max(gross - rebateForAge(age), 0)
}

export function maxDeductibleRA(taxableIncome: number, remuneration: number): number {
  const basis = Math.max(taxableIncome, remuneration || 0)
  return Math.min(basis * RA_DEDUCTION_RATE, RA_DEDUCTION_CAP)
}

export interface RAScenario {
  raAmount: number
  adjustedTaxableIncome: number
  tax: number
  savingVsNoRA: number
  savingVsCurrent: number
}

export function buildScenarios({
  taxableIncome,
  age,
  currentRAAnnual,
  maxDeductible,
  step = 10000,
}: {
  taxableIncome: number
  age: number
  currentRAAnnual: number
  maxDeductible: number
  step?: number
}): RAScenario[] {
  const baseTax = calculateTax(taxableIncome, age)
  const taxAtCurrent = calculateTax(Math.max(taxableIncome - currentRAAnnual, 0), age)

  const amounts: number[] = []
  for (let ra = 0; ra <= maxDeductible; ra += step) amounts.push(ra)
  if (amounts[amounts.length - 1] !== maxDeductible && maxDeductible > 0) amounts.push(maxDeductible)

  return amounts.map(raAmount => {
    const adjustedTaxableIncome = Math.max(taxableIncome - raAmount, 0)
    const tax = calculateTax(adjustedTaxableIncome, age)
    return {
      raAmount,
      adjustedTaxableIncome,
      tax,
      savingVsNoRA: baseTax - tax,
      savingVsCurrent: taxAtCurrent - tax,
    }
  })
}
