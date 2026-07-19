import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import RACalculator from '@/components/tax/RACalculator'

function ageFromDOB(dob: string | null): number {
  if (!dob) return 35
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default async function RACalculatorPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: userData } = await supabase.from('users').select('person_id').eq('id', session.user.id).single()
  if (!userData?.person_id) {
    return (
      <div className="max-w-lg">
        <div className="card p-8 text-center">
          <p className="text-sm text-slate-500">Your account hasn't been linked to a client profile yet.</p>
        </div>
      </div>
    )
  }

  const { data: person } = await supabase.from('people').select('date_of_birth').eq('id', userData.person_id).single()

  const { data: taxCases } = await supabase
    .from('tax_cases')
    .select('taxable_income, current_ra_monthly')
    .eq('person_id', userData.person_id)
    .order('tax_year', { ascending: false })
    .limit(1)

  const latestCase = taxCases?.[0]

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <Link href="/my-company" className="text-sm text-slate-500 hover:text-navy-700 flex items-center gap-1 mb-3">
          <ArrowLeft className="w-3 h-3" /> Back to my tax
        </Link>
        <h2 className="text-2xl font-bold text-slate-800">RA Tax Savings Calculator</h2>
        <p className="text-sm text-slate-500 mt-0.5">See how much tax you can save by contributing to a retirement annuity.</p>
      </div>

      <RACalculator
        initialTaxableIncome={Number(latestCase?.taxable_income) || 0}
        initialAge={ageFromDOB(person?.date_of_birth ?? null)}
        initialCurrentRAMonthly={Number(latestCase?.current_ra_monthly) || 0}
        initialRemuneration={Number(latestCase?.taxable_income) || 0}
      />
    </div>
  )
}
