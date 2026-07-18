import PersonForm from '@/components/people/PersonForm'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function NewPersonPage({ searchParams }: { searchParams: { company?: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: companies } = await supabase.from('companies').select('id, name').order('name')
  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Add Person</h2>
      <PersonForm companies={companies ?? []} defaultCompanyId={searchParams.company} />
    </div>
  )
}
