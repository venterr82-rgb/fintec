import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Users, Building2, FileText, ArrowLeft } from 'lucide-react'
import TierSelector from '@/components/people/TierSelector'

export default async function PersonDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: person } = await supabase.from('people').select('*').eq('id', params.id).single()
  if (!person) notFound()

  const [{ data: companyLinks }, { data: taxCases }] = await Promise.all([
    supabase.from('company_people').select('*, companies(id, name, registration_number)').eq('person_id', params.id),
    supabase.from('tax_cases').select('*').eq('person_id', params.id).order('tax_year', { ascending: false }),
  ])

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
    <div className="max-w-6xl space-y-6">
      <div>
        <Link href="/people" className="text-sm text-slate-500 hover:text-navy-700 flex items-center gap-1 mb-3">
          <ArrowLeft className="w-3 h-3" /> People
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-navy-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-navy-700" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {person.first_name} {person.second_name ? person.second_name + ' ' : ''}{person.last_name}
              </h2>
              {person.email && <p className="text-sm text-slate-500">{person.email}</p>}
            </div>
          </div>
          <span className={person.has_portal_access ? 'badge-green' : 'badge-gray'}>
            {person.has_portal_access ? 'Portal Active' : 'No Portal Access'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="section-title mb-4">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div>
                <Row label="ID Number" value={person.id_number} />
                <Row label="Passport" value={person.passport_number} />
                <Row label="Tax Number" value={person.tax_number} />
                <Row label="Date of Birth" value={person.date_of_birth} />
                <Row label="Nationality" value={person.nationality} />
              </div>
              <div>
                <Row label="Phone" value={person.phone} />
                <Row label="Email" value={person.email} />
                <Row label="Address" value={[person.residential_address_line1, person.residential_city, person.residential_province, person.residential_postal_code].filter(Boolean).join(', ')} />
              </div>
            </div>
          </div>

          {/* Linked companies */}
          <div className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="section-title">Companies</h3>
              <span className="badge-gray">{companyLinks?.length ?? 0}</span>
            </div>
            {companyLinks && companyLinks.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {companyLinks.map((cl: any) => (
                  <Link key={cl.id} href={`/companies/${cl.companies?.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{cl.companies?.name}</p>
                        <p className="text-xs text-slate-400">{cl.role ?? '—'}</p>
                      </div>
                    </div>
                    {cl.shareholding_percentage && (
                      <span className="text-xs text-slate-500">{cl.shareholding_percentage}%</span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">No linked companies.</p>
            )}
          </div>
        </div>

        {/* Right: tier + tax cases */}
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Billing Tier</h3>
            <TierSelector
              personId={person.id}
              initialTier={person.tier}
              initialEngagementDescription={person.engagement_description}
            />
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" /> Tax Cases
            </h3>
            {taxCases && taxCases.length > 0 ? (
              <div className="space-y-1">
                {taxCases.map((tc: any) => (
                  <Link key={tc.id} href={`/tax/${tc.id}`}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50">
                    <span className="text-sm text-slate-700">{tc.tax_year}</span>
                    <span className="badge-gray">{tc.status}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No tax cases yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
