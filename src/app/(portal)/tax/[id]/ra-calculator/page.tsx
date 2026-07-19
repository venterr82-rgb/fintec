import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
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

export default async function AdminRACalculatorPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()

  const { data: taxCase } = await supabase
    .from('tax_cases')
    .select('taxable_income, current_ra_monthly, tax_year, people(first_name, last_name, date_of_birth)')
    .eq('id', params.id)
    .single()

  if (!taxCase) notFound()

  const person = Array.isArray(taxCase.people) ? taxCase.people[0] : taxCase.people

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <Link href={`/tax/${params.id}`} className="text-sm text-slate-500 hover:text-navy-700 flex items-center gap-1 mb-3">
          <ArrowLeft className="w-3 h-3" /> Back to tax case
        </Link>
        <h2 className="text-2xl font-bold text-slate-800">
          RA Tax Savings Calculator — {person?.first_name} {person?.last_name}
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">Tax Year {taxCase.tax_year}</p>
      </div>

      <RACalculator
        initialTaxableIncome={Number(taxCase.taxable_income) || 0}
        initialAge={ageFromDOB(person?.date_of_birth ?? null)}
        initialCurrentRAMonthly={Number(taxCase.current_ra_monthly) || 0}
        initialRemuneration={Number(taxCase.taxable_income) || 0}
      />
    </div>
  )
}
