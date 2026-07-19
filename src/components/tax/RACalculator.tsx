'use client'
import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceDot } from 'recharts'
import { buildScenarios, calculateTax, maxDeductibleRA } from '@/lib/tax/raCalculator'

function rand(n: number) { return `R ${Math.round(n).toLocaleString()}` }

export default function RACalculator({
  initialTaxableIncome,
  initialAge,
  initialCurrentRAMonthly,
  initialRemuneration,
}: {
  initialTaxableIncome: number
  initialAge: number
  initialCurrentRAMonthly: number
  initialRemuneration: number
}) {
  const [taxableIncome, setTaxableIncome] = useState(initialTaxableIncome)
  const [age, setAge] = useState(initialAge)
  const [currentRAMonthly, setCurrentRAMonthly] = useState(initialCurrentRAMonthly)
  const [remuneration, setRemuneration] = useState(initialRemuneration)
  const [selectedRA, setSelectedRA] = useState(0)

  const maxDeductible = useMemo(() => maxDeductibleRA(taxableIncome, remuneration), [taxableIncome, remuneration])
  const currentRAAnnual = currentRAMonthly * 12

  const scenarios = useMemo(() => buildScenarios({
    taxableIncome, age, currentRAAnnual, maxDeductible, step: 10000,
  }), [taxableIncome, age, currentRAAnnual, maxDeductible])

  const sliderMax = Math.max(Math.round(maxDeductible / 1000) * 1000, 1000)
  const effectiveRA = Math.min(selectedRA, maxDeductible)
  const adjustedTaxableIncome = Math.max(taxableIncome - effectiveRA, 0)
  const taxAtSelected = calculateTax(adjustedTaxableIncome, age)
  const taxAtCurrent = calculateTax(Math.max(taxableIncome - currentRAAnnual, 0), age)
  const savingVsCurrent = taxAtCurrent - taxAtSelected

  const optimal = scenarios[scenarios.length - 1] // highest allowed RA = max total saving
  const carryForward = Math.max(currentRAAnnual - maxDeductible, 0)

  const chartData = scenarios.map(s => ({
    ra: s.raAmount,
    saving: Math.round(s.savingVsNoRA),
  }))

  return (
    <div className="space-y-5">
      {/* Inputs */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Your Figures</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Taxable income before RA</label>
            <input type="number" className="input" value={taxableIncome}
              onChange={e => setTaxableIncome(Number(e.target.value) || 0)} />
          </div>
          <div>
            <label className="label">Age</label>
            <input type="number" className="input" value={age}
              onChange={e => setAge(Number(e.target.value) || 0)} />
          </div>
          <div>
            <label className="label">Current RA contribution (monthly)</label>
            <input type="number" className="input" value={currentRAMonthly}
              onChange={e => setCurrentRAMonthly(Number(e.target.value) || 0)} />
          </div>
          <div>
            <label className="label">IRP5 remuneration</label>
            <input type="number" className="input" value={remuneration}
              onChange={e => setRemuneration(Number(e.target.value) || 0)} />
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card">
          <p className="text-xs text-slate-500">Current RA (annual)</p>
          <p className="text-xl font-bold text-slate-800">{rand(currentRAAnnual)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500">Max deductible</p>
          <p className="text-xl font-bold text-slate-800">{rand(maxDeductible)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500">Tax saving (at slider)</p>
          <p className={`text-xl font-bold ${savingVsCurrent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{rand(savingVsCurrent)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-slate-500">Suggested monthly</p>
          <p className="text-xl font-bold text-navy-700">{rand(maxDeductible / 12)}/mo</p>
        </div>
      </div>

      {carryForward > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg">
          Your current RA contribution of {rand(currentRAAnnual)} exceeds the deductible cap of {rand(maxDeductible)}.
          The excess of {rand(carryForward)} carries forward to next tax year's deduction.
        </div>
      )}

      {/* Slider */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="section-title">Annual RA Contribution</h3>
          <span className="text-sm font-semibold text-navy-700">{rand(effectiveRA)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={sliderMax}
          step={1000}
          value={effectiveRA}
          onChange={e => setSelectedRA(Number(e.target.value))}
          className="w-full accent-navy-700"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>R 0</span>
          <span>{rand(sliderMax)}</span>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          To contribute {rand(effectiveRA)} annually, pay <strong>{rand(effectiveRA / 12)}/month</strong>.
        </p>
      </div>

      {/* Chart */}
      <div className="card p-5">
        <h3 className="section-title mb-3">Tax Saving by RA Contribution</h3>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="ra" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => rand(Number(v))} labelFormatter={(v: any) => `RA: ${rand(Number(v))}`} />
              <Line type="monotone" dataKey="saving" stroke="#c89b4a" strokeWidth={2} dot={{ r: 3, fill: '#c89b4a' }} />
              {optimal && (
                <ReferenceDot x={optimal.raAmount} y={Math.round(optimal.savingVsNoRA)} r={5} fill="#1e3a5f" stroke="none" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        {optimal && (
          <p className="text-xs text-slate-500 mt-2">
            Optimal: contributing {rand(optimal.raAmount)} (your full deductible cap) saves you {rand(optimal.savingVsNoRA)} in tax this year.
          </p>
        )}
      </div>

      {/* Scenario table */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="section-title">Scenarios (R10,000 increments)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">RA Amount</th>
                <th className="th">Monthly</th>
                <th className="th text-right">Adjusted Taxable Income</th>
                <th className="th text-right">Tax Payable</th>
                <th className="th text-right">Saving vs Current</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map(s => {
                const isOptimal = optimal && s.raAmount === optimal.raAmount
                return (
                  <tr key={s.raAmount} className={isOptimal ? 'bg-amber-50 font-semibold' : 'border-t border-slate-50'}>
                    <td className="td">{rand(s.raAmount)} {isOptimal && <span className="text-amber-600 text-xs ml-1">★ optimal</span>}</td>
                    <td className="td text-slate-500">{rand(s.raAmount / 12)}/mo</td>
                    <td className="td text-right">{rand(s.adjustedTaxableIncome)}</td>
                    <td className="td text-right">{rand(s.tax)}</td>
                    <td className={`td text-right ${s.savingVsCurrent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{rand(s.savingVsCurrent)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
