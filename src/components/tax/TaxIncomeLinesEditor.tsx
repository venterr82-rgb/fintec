'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import SarsCodeCombobox from './SarsCodeCombobox'

type Line = {
  id?: string
  sars_code: string
  description: string
  calculated: number | string
  exemption_expenses: number | string
  taxable_amount: number | string
  line_type: string
}

type Rebate = {
  id?: string
  description: string
  amount: number | string
}

function num(v: number | string) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export default function TaxIncomeLinesEditor({ taxCaseId, initialLines, initialRebates }: {
  taxCaseId: string
  initialLines: Line[]
  initialRebates: Rebate[]
}) {
  const router = useRouter()
  const [lines, setLines] = useState<Line[]>(initialLines)
  const [rebates, setRebates] = useState<Rebate[]>(initialRebates)
  const [savingIndex, setSavingIndex] = useState<string | null>(null)

  const totalTaxable = lines.reduce((sum, l) => sum + num(l.taxable_amount), 0)
  const totalRebates = rebates.reduce((sum, r) => sum + num(r.amount), 0)

  function updateLine(i: number, patch: Partial<Line>) {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l))
  }

  function addLine() {
    setLines(prev => [...prev, {
      sars_code: '', description: '', calculated: 0, exemption_expenses: 0, taxable_amount: 0, line_type: 'income',
    }])
  }

  async function saveLine(i: number, override?: Partial<Line>) {
    const line = { ...lines[i], ...override }
    setSavingIndex(`line-${i}`)
    const payload = {
      tax_case_id: taxCaseId,
      sort_order: i,
      sars_code: line.sars_code || null,
      description: line.description || null,
      calculated: num(line.calculated),
      exemption_expenses: num(line.exemption_expenses),
      taxable_amount: num(line.taxable_amount),
      line_type: line.line_type,
    }
    const res = await fetch('/api/tax-income-lines', {
      method: line.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(line.id ? { id: line.id, ...payload } : payload),
    })
    const json = await res.json()
    if (res.ok) updateLine(i, { id: json.data.id })
    setSavingIndex(null)
    router.refresh()
  }

  async function deleteLine(i: number) {
    const line = lines[i]
    if (line.id) await fetch(`/api/tax-income-lines?id=${line.id}`, { method: 'DELETE' })
    setLines(prev => prev.filter((_, idx) => idx !== i))
    router.refresh()
  }

  function updateRebate(i: number, patch: Partial<Rebate>) {
    setRebates(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r))
  }

  function addRebate() {
    setRebates(prev => [...prev, { description: '', amount: 0 }])
  }

  async function saveRebate(i: number) {
    const rebate = rebates[i]
    setSavingIndex(`rebate-${i}`)
    const payload = {
      tax_case_id: taxCaseId,
      sort_order: i,
      description: rebate.description || null,
      amount: num(rebate.amount),
    }
    const res = await fetch('/api/tax-rebates', {
      method: rebate.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rebate.id ? { id: rebate.id, ...payload } : payload),
    })
    const json = await res.json()
    if (res.ok) updateRebate(i, { id: json.data.id })
    setSavingIndex(null)
    router.refresh()
  }

  async function deleteRebate(i: number) {
    const rebate = rebates[i]
    if (rebate.id) await fetch(`/api/tax-rebates?id=${rebate.id}`, { method: 'DELETE' })
    setRebates(prev => prev.filter((_, idx) => idx !== i))
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="section-title">Income Lines</h3>
          <button onClick={addLine} className="btn-secondary text-xs"><Plus className="w-3 h-3" />Add Line</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Code</th>
                <th className="th">Description</th>
                <th className="th">Gross</th>
                <th className="th">Exempt/Expenses</th>
                <th className="th">Taxable</th>
                <th className="th">Type</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={line.id ?? i} className="border-t border-slate-50">
                  <td className="td">
                    <SarsCodeCombobox
                      value={line.sars_code}
                      onSelect={(code, description) => {
                        const patch = { sars_code: code, description: line.description || description }
                        updateLine(i, patch)
                        saveLine(i, patch)
                      }}
                    />
                  </td>
                  <td className="td"><input className="input py-1 text-xs min-w-[180px]" value={line.description} onChange={e => updateLine(i, { description: e.target.value })} onBlur={() => saveLine(i)} /></td>
                  <td className="td"><input type="number" className="input py-1 text-xs w-28" value={line.calculated} onChange={e => updateLine(i, { calculated: e.target.value })} onBlur={() => saveLine(i)} /></td>
                  <td className="td"><input type="number" className="input py-1 text-xs w-28" value={line.exemption_expenses} onChange={e => updateLine(i, { exemption_expenses: e.target.value })} onBlur={() => saveLine(i)} /></td>
                  <td className="td"><input type="number" className="input py-1 text-xs w-28" value={line.taxable_amount} onChange={e => updateLine(i, { taxable_amount: e.target.value })} onBlur={() => saveLine(i)} /></td>
                  <td className="td">
                    <select className="input py-1 text-xs" value={line.line_type} onChange={e => { updateLine(i, { line_type: e.target.value }); }} onBlur={() => saveLine(i)}>
                      <option value="income">income</option>
                      <option value="deduction">deduction</option>
                    </select>
                  </td>
                  <td className="td">
                    {savingIndex === `line-${i}` ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                      <button onClick={() => deleteLine(i)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </td>
                </tr>
              ))}
              {lines.length === 0 && (
                <tr><td colSpan={7} className="td text-center py-8 text-slate-400">No income lines yet.</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 font-semibold">
                <td className="td" colSpan={4}>TAXABLE INCOME (sum of lines above)</td>
                <td className="td">R {totalTaxable.toLocaleString()}</td>
                <td className="td" colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="section-title">Rebates & Credits</h3>
          <button onClick={addRebate} className="btn-secondary text-xs"><Plus className="w-3 h-3" />Add Rebate</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Description</th>
                <th className="th">Amount</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {rebates.map((rebate, i) => (
                <tr key={rebate.id ?? i} className="border-t border-slate-50">
                  <td className="td"><input className="input py-1 text-xs min-w-[200px]" value={rebate.description} onChange={e => updateRebate(i, { description: e.target.value })} onBlur={() => saveRebate(i)} /></td>
                  <td className="td"><input type="number" className="input py-1 text-xs w-28" value={rebate.amount} onChange={e => updateRebate(i, { amount: e.target.value })} onBlur={() => saveRebate(i)} /></td>
                  <td className="td">
                    {savingIndex === `rebate-${i}` ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                      <button onClick={() => deleteRebate(i)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </td>
                </tr>
              ))}
              {rebates.length === 0 && (
                <tr><td colSpan={3} className="td text-center py-8 text-slate-400">No rebates yet.</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 font-semibold">
                <td className="td">Total rebates/credits</td>
                <td className="td">R {totalRebates.toLocaleString()}</td>
                <td className="td"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
