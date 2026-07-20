// Renders Fintec's two engagement letter templates (individual / company)
// as a PDF directly in code, rather than populating the source .docx files
// and converting them — this app is hosted on Vercel (serverless), where a
// real docx→PDF conversion would need LibreOffice or an external service.
// The wording below was extracted verbatim from
// "Fintec_Engagement_Template_PowerAutomate {Individual,Company}.docx"
// (their MERGEFIELD names are preserved in the field type names/comments
// below for traceability back to the source template).
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 9.5, fontFamily: 'Helvetica', color: '#1a1a1a', lineHeight: 1.4 },
  title: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  subtitle: { fontSize: 10, color: '#5a6a7e', marginBottom: 14 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  sectionHeading: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginTop: 14, marginBottom: 6, color: '#0e1c2f' },
  subHeading: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', marginTop: 6, marginBottom: 3 },
  paragraph: { marginBottom: 6 },
  fieldRow: { flexDirection: 'row', marginBottom: 3 },
  fieldLabel: { width: 150, color: '#5a6a7e' },
  fieldValue: { flex: 1, fontFamily: 'Helvetica-Bold' },
  bulletRow: { flexDirection: 'row', marginBottom: 3 },
  bulletDot: { width: 12 },
  bulletText: { flex: 1 },
  table: { marginTop: 6, marginBottom: 6, borderWidth: 1, borderColor: '#dcdcdc' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#dcdcdc' },
  tableRowLast: { flexDirection: 'row' },
  tableCellLabel: { flex: 1, padding: 5, color: '#333' },
  tableCellValue: { width: 110, padding: 5, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  tableTotalRow: { flexDirection: 'row', backgroundColor: '#f5edd8' },
  signBlock: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#dcdcdc', paddingTop: 8, marginBottom: 14 },
  signLine: { borderBottomWidth: 1, borderBottomColor: '#999', height: 22, marginBottom: 4 },
  signLabel: { color: '#5a6a7e', fontSize: 8.5 },
  footer: { marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#dcdcdc', fontSize: 8, color: '#5a6a7e', textAlign: 'center' },
})

function SectionHeading({ n, children }: { n: string; children: string }) {
  return <Text style={styles.sectionHeading}>{n}.  {children}</Text>
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  )
}

function Bullet({ children }: { children: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  )
}

function SignBlock({ heading, roleLine, orgLine }: { heading: string; roleLine: string; orgLine?: string }) {
  return (
    <View style={styles.signBlock}>
      <Text style={{ ...styles.subHeading, marginBottom: 8 }}>{heading}</Text>
      <View style={styles.signLine} />
      <Text style={styles.signLabel}>{roleLine}</Text>
      <View style={{ ...styles.signLine, marginTop: 8 }} />
      <Text style={styles.signLabel}>Date</Text>
      {orgLine && <Text style={{ ...styles.signLabel, marginTop: 8 }}>{orgLine}</Text>}
    </View>
  )
}

function Footer() {
  return (
    <Text style={styles.footer}>
      Compliance isn't a burden — it's your launchpad.{'\n'}
      Fintec Group (Pty) Ltd  |  info@fintecgroup.co.za  |  www.fintecgroup.co.za
    </Text>
  )
}

const PROFESSIONAL_STANDARDS = [
  'The Chartered Institute for Business Accountants (CIBA) Code of Conduct and By-laws.',
  'The South African Institute of Taxation (SAIT) Code of Professional Conduct.',
  'The Tax Administration Act, No. 28 of 2011 (TAA).',
  'The Income Tax Act, No. 58 of 1962, and applicable subsidiary legislation.',
  'IFRS for SMEs (IASB 2009 as adopted in South Africa) for compilation engagements.',
]

// MERGEFIELD names from the source .docx preserved as keys for traceability.
export interface IndividualLetterFields {
  EngagementDate: string
  ReferenceNo: string
  ClientLegalName: string
  RegistrationNumber: string // labeled "Identity Number" in the individual template
  TaxReferenceNumber: string
  RegisteredAddress: string
  ContactPerson: string
  EmailAddress: string
  MobileNumber: string
  FeeCompliance: string
  FeeTotal: string
}

export interface CompanyLetterFields {
  EngagementDate: string
  ReferenceNo: string
  ClientLegalName: string
  TradingName: string
  RegistrationNumber: string
  TaxReferenceNumber: string
  VATNumber: string
  PAYEReferenceNumber: string
  RegisteredAddress: string
  ContactPerson: string
  EmailAddress: string
  MobileNumber: string
  FeeCompliance: string
  FeeAccounting: string
  FeePayroll: string
  FeeTotal: string
  TurnoverTier: string
  OnboardingFee: string
}

export function IndividualEngagementLetterDocument({ f }: { f: IndividualLetterFields }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>CLIENT ENGAGEMENT LETTER</Text>
        <Text style={styles.subtitle}>Professional Services Agreement</Text>
        <View style={styles.metaRow}>
          <Text>Date: {f.EngagementDate}</Text>
          <Text>Reference No.: {f.ReferenceNo}</Text>
        </View>

        <SectionHeading n="1">CLIENT DETAILS</SectionHeading>
        <Field label="Name and Surname" value={f.ClientLegalName} />
        <Field label="Identity Number" value={f.RegistrationNumber} />
        <Field label="Tax Reference Number" value={f.TaxReferenceNumber} />
        <Field label="Registered Address" value={f.RegisteredAddress} />
        <Field label="Contact" value={f.ContactPerson} />
        <Field label="Email Address" value={f.EmailAddress} />
        <Field label="Mobile / Tel" value={f.MobileNumber} />

        <SectionHeading n="2">SCOPE OF SERVICES</SectionHeading>
        <Text style={styles.paragraph}>
          Fintec Group (Pty) Ltd ("the Practice") is engaged to provide the following professional services to the
          Client, subject to the terms and conditions set out in this letter:
        </Text>
        <Text style={styles.subHeading}>2.1  Statutory Compliance</Text>
        <Bullet>SARS All mandatory filing</Bullet>
        <Text style={styles.subHeading}>2.4  Advisory Services (ad hoc)</Text>
        <Bullet>Tax planning and structuring advice</Bullet>
        <Bullet>SARS audit or verification support</Bullet>
        <Text style={styles.paragraph}>
          Services not listed above are excluded from this engagement unless agreed in writing via a separate addendum.
        </Text>

        <SectionHeading n="3">FEE & BILLING TERMS</SectionHeading>
        <Text style={styles.paragraph}>
          Fees are exclusive of VAT (Fintec Group is not registered for VAT). Ad hoc advisory work is quoted separately.
        </Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Statutory Compliance</Text>
            <Text style={styles.tableCellValue}>R {f.FeeCompliance}</Text>
          </View>
          <View style={styles.tableTotalRow}>
            <Text style={{ ...styles.tableCellLabel, fontFamily: 'Helvetica-Bold' }}>TOTAL Monthly Fee</Text>
            <Text style={styles.tableCellValue}>R {f.FeeTotal}</Text>
          </View>
        </View>
        <Text style={styles.paragraph}>
          Without prejudice to any other rights or remedies available in law, the Practice reserves the right to
          suspend, limit, or withhold services in the event of non-payment or late payment.
        </Text>

        <SectionHeading n="4">CLIENT RESPONSIBILITIES</SectionHeading>
        <Text style={styles.paragraph}>The Client agrees to:</Text>
        <Bullet>Provide complete, accurate and timely information, documentation and source data required for the Practice to perform its services.</Bullet>
        <Bullet>Notify the Practice promptly of any material changes.</Bullet>
        <Bullet>Maintain and provide supporting records for a minimum of five (5) years as required by the Tax Administration Act.</Bullet>
        <Bullet>Settle invoices on time to avoid interruption of services.</Bullet>
        <Bullet>Grant the Practice authority to act as tax practitioner on eFiling via a signed Power of Attorney where required.</Bullet>

        <SectionHeading n="5">PROFESSIONAL STANDARDS & INDEPENDENCE</SectionHeading>
        <Text style={styles.paragraph}>The Practice operates in accordance with:</Text>
        {PROFESSIONAL_STANDARDS.map(s => <Bullet key={s}>{s}</Bullet>)}
        <Text style={styles.paragraph}>
          The Practice will maintain objectivity and professional independence. Where a conflict of interest arises,
          the Practice will notify the Client and may be required to withdraw from the engagement.
        </Text>

        <SectionHeading n="6">CONFIDENTIALITY</SectionHeading>
        <Text style={styles.paragraph}>
          All Client information is treated as strictly confidential. The Practice will not disclose any Client
          information to third parties without prior written consent, except where required by law, professional
          standards, or a valid SARS request. Cloud-based accounting platforms used by the Practice are protected by
          industry-standard encryption and access controls. Data is retained in accordance with the Protection of
          Personal Information Act, No. 4 of 2013 (POPIA).
        </Text>

        <SectionHeading n="7">LIMITATION OF LIABILITY</SectionHeading>
        <Text style={styles.paragraph}>
          The liability of the Practice is limited to the total professional fees paid in the twelve (12) months
          preceding the event giving rise to the claim. The Practice shall not be liable for any penalties, interest
          or assessments arising from incorrect or incomplete information provided by the Client, or from the
          Client's failure to approve submissions timeously. The Practice shall not be liable for indirect,
          consequential or punitive damages.
        </Text>

        <SectionHeading n="8">TERMINATION</SectionHeading>
        <Text style={styles.paragraph}>
          Either party may terminate this engagement by providing thirty (30) calendar days' written notice. Upon
          termination:
        </Text>
        <Bullet>The Practice reserves the right to terminate immediately in the event of non-payment, fraud, or gross misconduct by the Client.</Bullet>

        <SectionHeading n="9">DISPUTE RESOLUTION & GOVERNING LAW</SectionHeading>
        <Text style={styles.paragraph}>
          In the event of a dispute, the parties agree to attempt resolution through good-faith negotiation. If
          unresolved within 20 business days, the dispute shall be referred to mediation under the auspices of the
          Arbitration Foundation of South Africa (AFSA). This agreement is governed by the laws of the Republic of
          South Africa. The parties consent to the jurisdiction of the Western Cape High Court.
        </Text>

        <SectionHeading n="10">DECLARATIONS & ACCEPTANCE</SectionHeading>
        <Text style={styles.paragraph}>I/We, the undersigned, confirm that:</Text>
        <Bullet>I have read and understood the terms and conditions of this Engagement Letter in full.</Bullet>
        <Bullet>The information provided to Fintec Group (Pty) Ltd is true, complete and accurate to the best of my knowledge.</Bullet>
        <Bullet>I authorise Fintec Group (Pty) Ltd to represent the Client before SARS.</Bullet>
        <Bullet>I accept the fee structure and payment terms as set out above.</Bullet>

        <SignBlock heading="THE CLIENT" roleLine="Full Name & Surname" />
        <SignBlock heading="FOR AND ON BEHALF OF FINTEC GROUP (PTY) LTD" roleLine="Reghardt Venter — Founder & Director" orgLine="CBA(SA), CIBA202110-2465  |  SAIT PR-0101146" />

        <Footer />
      </Page>
    </Document>
  )
}

export function CompanyEngagementLetterDocument({ f }: { f: CompanyLetterFields }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>CLIENT ENGAGEMENT LETTER</Text>
        <Text style={styles.subtitle}>Professional Services Agreement</Text>
        <View style={styles.metaRow}>
          <Text>Date: {f.EngagementDate}</Text>
          <Text>Reference No.: {f.ReferenceNo}</Text>
        </View>

        <SectionHeading n="1">CLIENT DETAILS</SectionHeading>
        <Field label="Full Legal Name / Entity" value={f.ClientLegalName} />
        <Field label="Trading Name (if any)" value={f.TradingName} />
        <Field label="Registration Number" value={f.RegistrationNumber} />
        <Field label="Tax Reference Number" value={f.TaxReferenceNumber} />
        <Field label="VAT Registration No." value={f.VATNumber} />
        <Field label="PAYE Reference No." value={f.PAYEReferenceNumber} />
        <Field label="Registered Address" value={f.RegisteredAddress} />
        <Field label="Contact Person" value={f.ContactPerson} />
        <Field label="Email Address" value={f.EmailAddress} />
        <Field label="Mobile / Tel" value={f.MobileNumber} />

        <SectionHeading n="2">SCOPE OF SERVICES</SectionHeading>
        <Text style={styles.paragraph}>
          Fintec Group (Pty) Ltd ("the Practice") is engaged to provide the following professional services to the
          Client, subject to the terms and conditions set out in this letter:
        </Text>
        <Text style={styles.subHeading}>2.1  Statutory Compliance</Text>
        <Bullet>CIPC All mandatory filing</Bullet>
        <Bullet>SARS All mandatory filing</Bullet>
        <Text style={styles.subHeading}>2.2  Accounting Services</Text>
        <Bullet>Preparation of management accounts (monthly / quarterly / annually — as agreed)</Bullet>
        <Bullet>Bank reconciliations</Bullet>
        <Bullet>Compilation of Annual Financial Statements in accordance with IFRS for SMEs (where mandated)</Bullet>
        <Text style={styles.subHeading}>2.3  Payroll Administration</Text>
        <Bullet>Monthly complete payroll processing</Bullet>
        <Text style={styles.subHeading}>2.4  Advisory Services (ad hoc)</Text>
        <Bullet>Tax planning and structuring advice</Bullet>
        <Bullet>SARS audit or verification support</Bullet>
        <Text style={styles.paragraph}>
          Services not listed above are excluded from this engagement unless agreed in writing via a separate addendum.
        </Text>

        <SectionHeading n="3">FEE SCHEDULE & BILLING TERMS</SectionHeading>
        <Text style={styles.paragraph}>
          Monthly fees are fixed for the services selected, based on the annual turnover tier applicable at
          engagement date. Fees are exclusive of VAT (Fintec Group is not registered for VAT). Ad hoc advisory work
          is quoted separately.
        </Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Statutory Compliance</Text>
            <Text style={styles.tableCellValue}>R {f.FeeCompliance}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>+ Accounting</Text>
            <Text style={styles.tableCellValue}>R {f.FeeAccounting}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>+ Payroll Administration</Text>
            <Text style={styles.tableCellValue}>R {f.FeePayroll}</Text>
          </View>
          <View style={styles.tableTotalRow}>
            <Text style={{ ...styles.tableCellLabel, fontFamily: 'Helvetica-Bold' }}>TOTAL Monthly Fee</Text>
            <Text style={styles.tableCellValue}>R {f.FeeTotal}</Text>
          </View>
        </View>
        <Text style={styles.paragraph}>Pricing tier applicable: {f.TurnoverTier}</Text>
        <View style={styles.table}>
          <View style={styles.tableRowLast}>
            <Text style={styles.tableCellLabel}>Onboarding / Setup Fee (once-off) — includes: first monthly fee, 45–60 min consultation</Text>
            <Text style={styles.tableCellValue}>R {f.OnboardingFee}</Text>
          </View>
        </View>
        <Text style={styles.paragraph}>
          Invoices shall be issued on the 20th day of each month, in advance, in respect of services to be rendered
          during the following month, and shall be payable within 7 (seven) calendar days from the date of invoice.
        </Text>
        <Text style={styles.paragraph}>
          Without prejudice to any other rights or remedies available in law, the Practice reserves the right to
          suspend, limit, or withhold services in the event of non-payment or late payment.
        </Text>
        <Text style={styles.paragraph}>
          The Practice reserves the right to review and adjust its fees annually. Any such adjustment shall be
          communicated to the Client in writing on not less than 30 (thirty) days' prior notice and shall become
          effective thereafter.
        </Text>
        <Text style={styles.paragraph}>
          In addition, fees are structured based on revenue-based pricing tiers. Should the Client's business move
          into a higher or lower revenue tier, whether as determined from financial statements, management accounts,
          or other reasonably required financial information, the Practice reserves the right to adjust the
          applicable fees accordingly. Such adjustment may be implemented upon written notice to the Client and shall
          take effect from the billing cycle following such notice.
        </Text>

        <SectionHeading n="4">CLIENT RESPONSIBILITIES</SectionHeading>
        <Text style={styles.paragraph}>The Client agrees to:</Text>
        <Bullet>Provide complete, accurate and timely information, documentation and source data required for the Practice to perform its services.</Bullet>
        <Bullet>Notify the Practice promptly of any material changes, including changes in business activities, turnover, employees, or ownership structure.</Bullet>
        <Bullet>Review and approve all returns, financial statements and reports submitted on the Client's behalf.</Bullet>
        <Bullet>Maintain and provide supporting records for a minimum of five (5) years as required by the Tax Administration Act.</Bullet>
        <Bullet>Settle invoices on time to avoid interruption of services.</Bullet>
        <Bullet>Grant the Practice authority to act as tax practitioner on eFiling via a signed Power of Attorney where required.</Bullet>

        <SectionHeading n="5">PROFESSIONAL STANDARDS & INDEPENDENCE</SectionHeading>
        <Text style={styles.paragraph}>The Practice operates in accordance with:</Text>
        {PROFESSIONAL_STANDARDS.map(s => <Bullet key={s}>{s}</Bullet>)}
        <Text style={styles.paragraph}>
          The Practice will maintain objectivity and professional independence. Where a conflict of interest arises,
          the Practice will notify the Client and may be required to withdraw from the engagement.
        </Text>

        <SectionHeading n="6">CONFIDENTIALITY</SectionHeading>
        <Text style={styles.paragraph}>
          All Client information is treated as strictly confidential. The Practice will not disclose any Client
          information to third parties without prior written consent, except where required by law, professional
          standards, or a valid SARS request. Cloud-based accounting platforms used by the Practice are protected by
          industry-standard encryption and access controls. Data is retained in accordance with the Protection of
          Personal Information Act, No. 4 of 2013 (POPIA).
        </Text>

        <SectionHeading n="7">LIMITATION OF LIABILITY</SectionHeading>
        <Text style={styles.paragraph}>
          The liability of the Practice is limited to the total professional fees paid in the twelve (12) months
          preceding the event giving rise to the claim. The Practice shall not be liable for any penalties, interest
          or assessments arising from incorrect or incomplete information provided by the Client, or from the
          Client's failure to approve submissions timeously. The Practice shall not be liable for indirect,
          consequential or punitive damages.
        </Text>

        <SectionHeading n="8">TERMINATION</SectionHeading>
        <Text style={styles.paragraph}>
          Either party may terminate this engagement by providing thirty (30) calendar days' written notice. Upon
          termination:
        </Text>
        <Bullet>All outstanding fees become immediately payable.</Bullet>
        <Bullet>The Practice will hand over Client files, records and access credentials within a reasonable period upon confirmation of full settlement.</Bullet>
        <Bullet>The Practice reserves the right to terminate immediately in the event of non-payment, fraud, or gross misconduct by the Client.</Bullet>

        <SectionHeading n="9">DISPUTE RESOLUTION & GOVERNING LAW</SectionHeading>
        <Text style={styles.paragraph}>
          In the event of a dispute, the parties agree to attempt resolution through good-faith negotiation. If
          unresolved within 20 business days, the dispute shall be referred to mediation under the auspices of the
          Arbitration Foundation of South Africa (AFSA). This agreement is governed by the laws of the Republic of
          South Africa. The parties consent to the jurisdiction of the Western Cape High Court.
        </Text>

        <SectionHeading n="10">DECLARATIONS & ACCEPTANCE</SectionHeading>
        <Text style={styles.paragraph}>I/We, the undersigned, confirm that:</Text>
        <Bullet>I/We have read and understood the terms and conditions of this Engagement Letter in full.</Bullet>
        <Bullet>The information provided to Fintec Group (Pty) Ltd is true, complete and accurate to the best of my/our knowledge.</Bullet>
        <Bullet>I/We authorise Fintec Group (Pty) Ltd to represent the Client before SARS, CIPC and the Department of Employment and Labour as required.</Bullet>
        <Bullet>I/We accept the fee structure and payment terms as set out above.</Bullet>

        <SignBlock heading="FOR AND ON BEHALF OF THE CLIENT" roleLine="Full Name & Designation" />
        <SignBlock heading="FOR AND ON BEHALF OF FINTEC GROUP (PTY) LTD" roleLine="Reghardt Venter — Founder & Director" orgLine="CBA(SA), CIBA202110-2465  |  SAIT PR-0101146" />

        <Footer />
      </Page>
    </Document>
  )
}
