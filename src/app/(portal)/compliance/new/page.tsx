import ComplianceForm from '@/components/compliance/ComplianceForm'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function NewCompliancePage({ searchParams }: { searchParams: { company?: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: companies } = await supabase.from('companies').select('id, name').order('name')
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Add Compliance Item</h2>
      <ComplianceForm companies={companies ?? []} defaultCompanyId={searchParams.company} />
    </div>
  )
}
