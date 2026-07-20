import { describe, it, expect } from 'vitest'
import { generateEngagementLetterPdf } from './generateEngagementLetterPdf'
import type { IndividualLetterFields, CompanyLetterFields } from './EngagementLetterPdf'

const individualFields: IndividualLetterFields = {
  EngagementDate: '20 July 2026',
  ReferenceNo: 'EL-IND-202607-TEST',
  ClientLegalName: 'Dewald Louw',
  RegistrationNumber: '9001015800086',
  TaxReferenceNumber: '1234567890',
  RegisteredAddress: '12 Main Road, Table View, Cape Town, 7441',
  ContactPerson: 'Dewald Louw',
  EmailAddress: 'dewaldlouw@hotmail.com',
  MobileNumber: '0821234567',
  FeeCompliance: '850.00',
  FeeTotal: '850.00',
}

const companyFields: CompanyLetterFields = {
  EngagementDate: '20 July 2026',
  ReferenceNo: 'EL-CO-202607-TEST',
  ClientLegalName: 'Acme Trading (Pty) Ltd',
  TradingName: 'Acme',
  RegistrationNumber: '2023/123456/07',
  TaxReferenceNumber: '9876543210',
  VATNumber: '4123456789',
  PAYEReferenceNumber: '7123456789',
  RegisteredAddress: '1 Long Street, Cape Town, 8001',
  ContactPerson: 'Jane Smith',
  EmailAddress: 'jane@acme.co.za',
  MobileNumber: '0827654321',
  FeeCompliance: '1500.00',
  FeeAccounting: '2500.00',
  FeePayroll: '800.00',
  FeeTotal: '4800.00',
  TurnoverTier: 'R1m - R5m',
  OnboardingFee: '3000.00',
}

describe('generateEngagementLetterPdf', () => {
  it('renders a valid PDF buffer for the individual template', async () => {
    const buf = await generateEngagementLetterPdf('individual', individualFields)
    expect(Buffer.isBuffer(buf)).toBe(true)
    expect(buf.subarray(0, 5).toString('latin1')).toBe('%PDF-')
    expect(buf.length).toBeGreaterThan(1000)
  })

  it('renders a valid PDF buffer for the company template', async () => {
    const buf = await generateEngagementLetterPdf('company', companyFields)
    expect(Buffer.isBuffer(buf)).toBe(true)
    expect(buf.subarray(0, 5).toString('latin1')).toBe('%PDF-')
    expect(buf.length).toBeGreaterThan(1000)
  })
})
