'use client'
// Import/Export hub — client component for interactivity
import { useState } from 'react'
import { Upload, Download, FileSpreadsheet, Users, Building2, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Papa from 'papaparse'
import { createClient } from '@/lib/supabase/client'

const COMPANY_TEMPLATE = 'company_name,registration_number,tax_number,vat_number,paye_number,enterprise_type,industry,status,bbbee_level,financial_year_end,incorporation_date,business_start_date,phone,email,registered_address_line1,registered_city,registered_province,registered_postal_code,notes'
const PEOPLE_TEMPLATE = 'first_name,last_name,id_number,tax_number,email,phone,date_of_birth,race_gender,country_of_origin,company_registration_number,role,appointment_date,shareholding_percentage,equity_percentage,residential_address_line1,residential_city,residential_province,residential_postal_code'

function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

type ImportResult = { success: number; errors: { row: number; message: string }[] }

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState<'companies'|'people'>('companies')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f); setResult(null)
    Papa.parse(f, {
      header: true, skipEmptyLines: true, preview: 5,
      complete: (r) => {
        setHeaders(Object.keys(r.data[0] as any))
        setPreview(r.data as any[])
      }
    })
  }

  async function handleImport() {
    if (!file) return
    setLoading(true)
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (r) => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user!.id).single()
        const tenantId = userData?.tenant_id
        let success = 0
        const errors: ImportResult['errors'] = []

        if (activeTab === 'companies') {
          for (let i = 0; i < r.data.length; i++) {
            const row = r.data[i] as any
            if (!row.company_name?.trim()) { errors.push({ row: i+2, message: 'company_name required' }); continue }
            const { error } = await supabase.from('companies').insert({
              tenant_id: tenantId, name: row.company_name.trim(),
              registration_number: row.registration_number || null,
              tax_number: row.tax_number || null, vat_number: row.vat_number || null,
              paye_number: row.paye_number || null, enterprise_type: row.enterprise_type || null,
              industry: row.industry || null, status: row.status || 'In Business',
              bbbee_level: row.bbbee_level || null, financial_year_end: row.financial_year_end || null,
              incorporation_date: row.incorporation_date || null,
              business_start_date: row.business_start_date || null,
              phone: row.phone || null, email: row.email || null,
              registered_address_line1: row.registered_address_line1 || null,
              registered_city: row.registered_city || null,
              registered_province: row.registered_province || null,
              registered_postal_code: row.registered_postal_code || null,
              notes: row.notes || null,
            })
            if (error) errors.push({ row: i+2, message: error.message }); else success++
          }
        } else {
          for (let i = 0; i < r.data.length; i++) {
            const row = r.data[i] as any
            if (!row.first_name?.trim() || !row.last_name?.trim()) { errors.push({ row: i+2, message: 'first_name and last_name required' }); continue }
            const { data: personData, error: pe } = await supabase.from('people').insert({
              tenant_id: tenantId, first_name: row.first_name.trim(), last_name: row.last_name.trim(),
              id_number: row.id_number || null, tax_number: row.tax_number || null,
              email: row.email || null, phone: row.phone || null,
              date_of_birth: row.date_of_birth || null, race_gender: row.race_gender || null,
              country_of_origin: row.country_of_origin || null,
              residential_address_line1: row.residential_address_line1 || null,
              residential_city: row.residential_city || null, residential_province: row.residential_province || null,
              residential_postal_code: row.residential_postal_code || null,
            }).select().single()
            if (pe) { errors.push({ row: i+2, message: pe.message }); continue }
            // Link to company if registration number provided
            if (row.company_registration_number && personData) {
              const { data: co } = await supabase.from('companies').select('id').eq('registration_number', row.company_registration_number).single()
              if (co) await supabase.from('company_people').insert({
                tenant_id: tenantId, company_id: co.id, person_id: personData.id,
                role: row.role || 'director', appointment_date: row.appointment_date || null,
                shareholding_percentage: row.shareholding_percentage ? Number(row.shareholding_percentage) : null,
                equity_percentage: row.equity_percentage ? Number(row.equity_percentage) : null,
                director_status: 'Active',
              })
            }
            success++
          }
        }
        setResult({ success, errors }); setLoading(false)
      }
    })
  }

  const tabs = [
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'people', label: 'People & Directors', icon: Users },
  ] as const

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Import / Export</h2>
        <p className="text-sm text-slate-500">Bulk import companies and people from CSV</p>
      </div>

      {/* Export card */}
      <div className="card p-5">
        <h3 className="section-title mb-3">Export Data</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={async () => {
            const supabase = createClient()
            const { data } = await supabase.from('companies').select('name,registration_number,tax_number,vat_number,status,enterprise_type,industry,phone,email,registered_city,registered_province')
            if (data) downloadCSV('companies_export.csv', Papa.unparse(data))
          }} className="btn-secondary"><Download className="w-4 h-4" />Export Companies</button>
          <button onClick={async () => {
            const supabase = createClient()
            const { data } = await supabase.from('people').select('first_name,last_name,id_number,tax_number,email,phone,residential_city,residential_province')
            if (data) downloadCSV('people_export.csv', Papa.unparse(data))
          }} className="btn-secondary"><Download className="w-4 h-4" />Export People</button>
          <button onClick={async () => {
            const supabase = createClient()
            const { data } = await supabase.from('compliance_items').select('*, companies(name)')
            if (data) downloadCSV('compliance_export.csv', Papa.unparse(data))
          }} className="btn-secondary"><Download className="w-4 h-4" />Export Compliance</button>
        </div>
      </div>

      {/* Import card */}
      <div className="card">
        <div className="flex border-b border-slate-100">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setActiveTab(id); setFile(null); setPreview([]); setResult(null) }}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === id ? 'border-navy-600 text-navy-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-3">
            <button onClick={() => downloadCSV(`${activeTab}_template.csv`, activeTab === 'companies' ? COMPANY_TEMPLATE : PEOPLE_TEMPLATE)}
              className="btn-secondary text-xs"><FileSpreadsheet className="w-3.5 h-3.5" />Download Template</button>
          </div>

          <div>
            <label className="label">Upload CSV File</label>
            <input type="file" accept=".csv" onChange={handleFile} className="input py-1.5" />
          </div>

          {preview.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">PREVIEW (first 5 rows)</p>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="text-xs w-full">
                  <thead className="bg-slate-50"><tr>{headers.slice(0,6).map(h => <th key={h} className="px-3 py-2 text-left text-slate-600 font-medium">{h}</th>)}</tr></thead>
                  <tbody>{preview.map((row, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      {headers.slice(0,6).map(h => <td key={h} className="px-3 py-2 text-slate-700">{row[h] ?? ''}</td>)}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400 mt-1">{headers.length > 6 ? `+ ${headers.length - 6} more columns` : ''}</p>
            </div>
          )}

          {file && !result && (
            <button onClick={handleImport} disabled={loading} className="btn-primary">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Importing…</> : <><Upload className="w-4 h-4" />Import {activeTab}</>}
            </button>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-sm text-emerald-700 font-medium">
                  <CheckCircle className="w-5 h-5" />{result.success} imported successfully
                </div>
                {result.errors.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
                    <XCircle className="w-5 h-5" />{result.errors.length} failed
                  </div>
                )}
              </div>
              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-1">
                  {result.errors.slice(0,10).map((e, i) => (
                    <p key={i} className="text-xs text-red-700">Row {e.row}: {e.message}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
