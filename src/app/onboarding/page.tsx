import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Clock } from 'lucide-react'
import { siteConfig } from '@/lib/config/site'
import PersonalDetailsStep from '@/components/onboarding/PersonalDetailsStep'
import BankingDetailsStep from '@/components/onboarding/BankingDetailsStep'
import DocumentChecklistStep from '@/components/onboarding/DocumentChecklistStep'

const STEPS = ['Your Details', 'Banking', 'Documents', 'Complete']

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('users').select('email, role, person_id').eq('id', user.id).single()
  if (me?.role !== 'client') redirect('/dashboard')
  if (!me.person_id) redirect('/my-company')

  const { data: person } = await supabase.from('people').select('*').eq('id', me.person_id).single()
  if (!person) redirect('/my-company')
  if (person.onboarding_complete) redirect('/my-company')

  const currentStepIndex = person.sars_poa_status === 'not_started' ? 0
    : person.onboarding_step === 2 ? 1
    : 2

  let taxCase: any = null
  let documents: any[] = []
  if (person.onboarding_step === 3) {
    const { data: cases } = await supabase.from('tax_cases').select('*').eq('person_id', me.person_id).order('tax_year', { ascending: false }).limit(1)
    taxCase = cases?.[0] ?? null
    if (taxCase) {
      const { data: docs } = await supabase.from('tax_documents').select('*').eq('tax_case_id', taxCase.id).order('status')
      // Accountant-managed slots (per-property rental/business/Airbnb/
      // partnership documents) are uploaded by the accountant directly.
      documents = (docs ?? []).filter(d => d.uploaded_by_role !== 'accountant')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex flex-col items-center mb-4">
          <img src={siteConfig.logoPath} alt={siteConfig.companyName} className="h-14 w-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-800">Welcome — let's get you set up</h1>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                ${i < currentStepIndex ? 'bg-emerald-500 text-white' : i === currentStepIndex ? 'bg-navy-700 text-white' : 'bg-slate-200 text-slate-400'}`}>
                {i < currentStepIndex ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`h-0.5 w-8 ${i < currentStepIndex ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-500 mb-4">Step {currentStepIndex + 1} of 4 — {STEPS[currentStepIndex]}</p>

        {person.sars_poa_status === 'not_started' && (
          <PersonalDetailsStep initial={{
            full_name: user.user_metadata?.full_name ?? `${person.first_name} ${person.last_name}`.trim(),
            id_number: person.id_number ?? '',
            tax_number: person.tax_number ?? '',
            phone: person.phone ?? '',
            residential_address_line1: person.residential_address_line1 ?? '',
            residential_city: person.residential_city ?? '',
            residential_province: person.residential_province ?? '',
            residential_postal_code: person.residential_postal_code ?? '',
            email: me.email,
          }} />
        )}

        {person.sars_poa_status === 'awaiting_authorisation' && (
          <div className="card p-8 text-center">
            <Clock className="w-10 h-10 text-amber-400 mx-auto mb-4" />
            <h2 className="font-semibold text-slate-800 mb-2">Step 1 of 4 — Awaiting SARS authorisation</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              We submitted the Power of Attorney request. Please approve it via SMS or on SARS
              eFiling. Usually takes 24 hours. We'll unlock the next steps as soon as it's confirmed.
            </p>
          </div>
        )}

        {person.sars_poa_status === 'authorised' && person.onboarding_step === 2 && (
          <BankingDetailsStep />
        )}

        {person.sars_poa_status === 'authorised' && person.onboarding_step === 3 && (
          <DocumentChecklistStep
            taxCaseId={taxCase?.id ?? null}
            documents={documents}
            tier={person.tier}
          />
        )}
      </div>
    </div>
  )
}
