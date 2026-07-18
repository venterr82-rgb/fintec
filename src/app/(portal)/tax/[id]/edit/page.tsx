import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import TaxCaseForm from '@/components/tax/TaxCaseForm'

export default async function EditTaxCasePage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()

  const { data: taxCase } = await supabase
    .from('tax_cases')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!taxCase) notFound()

  const { data: people } = await supabase
    .from('people')
    .select('id, first_name, last_name, email')
    .order('last_name')

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Edit Tax Case</h2>
      <TaxCaseForm people={people ?? []} taxCase={taxCase} />
    </div>
  )
}
