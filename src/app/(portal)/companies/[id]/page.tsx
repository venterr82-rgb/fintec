import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Building2, Users, Calendar, FolderOpen, ArrowLeft } from 'lucide-react'
import EngagementLetterGenerator from '@/components/documents/EngagementLetterGenerator'
import { joinAddress } from '@/lib/documents/engagementLetterHelpers'

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: company } = await supabase.from('companies').select('*').eq('id', params.id).single()
  if (!company) notFound()

  const [{ data: directors }, { data: complianceItems }, { data: docs }, { data: latestLetter }] = await Promise.all([
    supabase.from('company_people').select('*, people(id, first_name, last_name, email, id_number)').eq('company_id', params.id),
    supabase.from('compliance_items').select('*').eq('company_id', params.id).order('due_date').limit(5),
    supabase.from('documents').select('*').eq('company_id', params.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('engagement_letters').select('*').eq('company_id', params.id).eq('letter_type', 'company')
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const primaryContact = directors?.[0]?.people

  function Row({ label, value }: { label: string; value?: string | number | null }) {
    if (!value) return null
    return (
      <div className="flex justify-between py-2.5 border-b border-slate-50 last:border-0">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        <span className="text-sm text-slate-800 font-medium text-right max-w-xs">{value}</span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <Link href="/companies" className="text-sm text-slate-500 hover:text-navy-700 flex items-center gap-1 mb-3">
          <ArrowLeft className="w-3 h-3" /> Companies
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-navy-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-navy-700" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{company.name}</h2>
              {company.trade_name && <p className="text-sm text-slate-500">Trading as {company.trade_name}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <span className={company.status === 'In Business' ? 'badge-green' : 'badge-gray'}>{company.status}</span>
            <Link href={`/companies/${params.id}/edit`} className="btn-secondary">Edit</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Company details */}
        <div className="xl:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="section-title mb-4">Company Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div>
                <Row label="Reg Number" value={company.registration_number} />
                <Row label="Income Tax" value={company.tax_number} />
                <Row label="VAT Number" value={company.vat_number} />
                <Row label="PAYE Number" value={company.paye_number} />
                <Row label="UIF Number" value={company.uif_number} />
                <Row label="SDL Number" value={company.sdl_number} />
              </div>
              <div>
                <Row label="B-BBEE Level" value={company.bbbee_level} />
                <Row label="PIS Score" value={company.public_interest_score} />
                <Row label="Year End" value={company.financial_year_end} />
                <Row label="Incorporated" value={company.incorporation_date} />
                <Row label="Type" value={company.enterprise_type} />
                <Row label="Industry" value={company.industry} />
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="card p-6">
            <h3 className="section-title mb-4">Addresses & Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div>
                <Row label="Phone" value={company.phone} />
                <Row label="Email" value={company.email} />
                <Row label="Website" value={company.website} />
                <Row label="Bank" value={company.bank_details} />
              </div>
              <div>
                <Row label="Address" value={[company.registered_address_line1, company.registered_city, company.registered_province, company.registered_postal_code].filter(Boolean).join(', ')} />
                <Row label="Auditor" value={company.auditor} />
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick links */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Links</h3>
            <div className="space-y-1">
              {[
                { href: `/companies/${params.id}/directors`, icon: Users, label: 'Directors & Shareholders', count: directors?.length },
                { href: `/companies/${params.id}/compliance`, icon: Calendar, label: 'Compliance Items', count: complianceItems?.length },
                { href: `/companies/${params.id}/documents`, icon: FolderOpen, label: 'Documents', count: docs?.length },
              ].map(({ href, icon: Icon, label, count }) => (
                <Link key={href} href={href} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 group">
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-navy-600" />
                    <span className="text-sm text-slate-700">{label}</span>
                  </div>
                  <span className="badge-gray">{count ?? 0}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Engagement letter */}
          <EngagementLetterGenerator
            letterType="company"
            companyId={company.id}
            personId={primaryContact?.id}
            existingLetter={latestLetter}
            initialFields={{
              ClientLegalName: company.name ?? '',
              TradingName: company.trade_name ?? '',
              RegistrationNumber: company.registration_number ?? '',
              TaxReferenceNumber: company.tax_number ?? '',
              VATNumber: company.vat_number ?? '',
              PAYEReferenceNumber: company.paye_number ?? '',
              RegisteredAddress: joinAddress([
                company.registered_address_line1, company.registered_city,
                company.registered_province, company.registered_postal_code,
              ]),
              ContactPerson: primaryContact ? `${primaryContact.first_name} ${primaryContact.last_name}` : '',
              EmailAddress: primaryContact?.email ?? company.email ?? '',
              MobileNumber: company.phone ?? '',
            }}
          />

          {/* Recent compliance */}
          {complianceItems && complianceItems.length > 0 && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Upcoming Compliance</h3>
              <div className="space-y-2">
                {complianceItems.slice(0,4).map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{item.type}</span>
                    <span className={item.status === 'submitted' ? 'badge-green' : item.status === 'overdue' ? 'badge-red' : 'badge-yellow'}>
                      {item.due_date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
