export function formatZAR(amount: number | string | null | undefined): string {
  const n = Number(amount)
  if (!Number.isFinite(n)) return '0.00'
  return n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function joinAddress(parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(', ')
}

export function generateReferenceNo(prefix: 'IND' | 'CO'): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `EL-${prefix}-${y}${m}-${rand}`
}

export function formatLetterDate(d: Date = new Date()): string {
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
}
