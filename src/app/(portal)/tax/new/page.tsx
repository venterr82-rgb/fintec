import { createServerSupabaseClient } from '@/lib/supabase/server'
import TaxCaseForm from '@/components/tax/TaxCaseForm'

export default async function NewTaxCasePage() {
  const supabase = await createServerSupabaseClient()
  const { data: people } = await supabase
    .from('people')
    .select('id, first_name, last_name, email')
    .order('last_name')
  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">New Tax Case</h2>
      <TaxCaseForm people={people ?? []} />
    </div>
  )
}
