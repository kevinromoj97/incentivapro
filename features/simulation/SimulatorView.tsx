'use client'

import { useState, useMemo } from 'react'
import { calcIndicatorResult, calcProjectedAnnualPoints, formatPct, formatPoints } from '@/lib/calculations'
import { calcProjectedRank } from '@/lib/ranking'
import { KPICard } from '@/components/shared/KPICard'
import { StatusBadge, logroToStatus } from '@/components/shared/StatusBadge'
import { MONTHS_ES } from '@/types'
import { cn, formatCurrency } from '@/lib/utils'
import { Zap, BarChart3, Trophy, TrendingUp, RotateCcw } from 'lucide-react'
import type { Profile, MonthlyInput, ScoringRule, Indicator, RankingEntry, Period } from '@/types'

interface SimulatorViewProps {
  profile: Profile
  period: Period | null
  inputs: MonthlyInput[]
  rules: ScoringRule[]
  indicators: Indicator[]
  rankingEntries: RankingEntry[]
  year: number
}

interface SimCell { budget: string; result: string }
type SimCells = Record<string, Record<number, SimCell>> // indicatorId → month → cell

export function SimulatorView({ profile, inputs, rules, indicators, rankingEntries, year }: SimulatorViewProps) {
  const currentMonth = new Date().getMonth() + 1

  // Indicadores con regla
  const myIndicators = indicators.filter(ind => rules.some(r => r.indicator_id === ind.id))

  // Estado del simulador — empieza con los datos oficiales
  const [cells, setCells] = useState<SimCells>(() => {
    const map: SimCells = {}
    for (const ind of myIndicators) {
      map[ind.id] = {}
      for (let m = 1; m <= 12; m++) {
        const inp = inputs.find(i => i.indicator_id === ind.id && i.month === m)
        map[ind.id][m] = {
          budget: inp ? String(inp.target_budget) : '',
          result: inp ? String(inp.actual_result) : '',
        }
      }
    }
    return map
  })

  function handleChange(indicatorId: string, month: number, field: 'budget' | 'result', value: string) {
    setCells(prev => ({
      ...prev,
      [indicatorId]: { ...prev[indicatorId], [month]: { ...prev[indicatorId]?.[month], [field]: value } },
    }))
  }

  function handleReset() {
    const map: SimCells = {}
    for (const ind of myIndicators) {
      map[ind.id] = {}
      for (let m = 1; m <= 12; m++) {
        const inp = inputs.find(i => i.indicator_id === ind.id && i.month === m)
        map[ind.id][m] = { budget: inp ? String(inp.target_budget) : '', result: inp ? String(inp.actual_result) : '' }
      }
    }
    setCells(map)
  }

  // Cálculo simulado
  const monthlyResults = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      let totalPoints = 0
      let hasData = false
      const results = []

      for (const ind of myIndicators) {
        const cell = cells[ind.id]?.[month]
        if (!cell) continue
        const budget = parseFloat(cell.budget) || 0
        const result = parseFloat(cell.result) || 0
        if (budget === 0) continue

        const rule = rules.find(r => r.indicator_id === ind.id)
        if (!rule) continue
        hasData = true

        const r = calcIndicatorResult(
          ind.id, ind.code, ind.name, ind.frequency, rule.weight, budget, result,
          { minLogro: rule.min_logro, pptoLogro: rule.ppto_logro, maxLogro: rule.max_logro, minCons: rule.min_cons, pptoCons: rule.ppto_cons, maxCons: rule.max_cons }
        )
        totalPoints += r.points
        results.push(r)
      }

      return { month, hasData, totalPoints, results }
    })
  }, [cells, myIndicators, rules])

  const monthsWithData = monthlyResults.filter(m => m.hasData && m.month <= currentMonth)
  const accumulatedPoints = monthsWithData.reduce((s, m) => s + m.totalPoints, 0)
  const projectedPoints  = calcProjectedAnnualPoints(monthlyResults.map(m => ({ month: m.month, points: m.totalPoints, hasData: m.hasData })))
  const projectedRank    = calcProjectedRank(rankingEntries, projectedPoints, profile.employee_code)

  const selectedMonth = currentMonth
  const currentMonthResult = monthlyResults.find(m => m.month === selectedMonth)

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center gap-3">
        <Zap className="w-5 h-5 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800 font-medium">
          Modo simulación — Los cambios aquí <strong>no afectan</strong> tus datos oficiales.
          Edita presupuesto o logro en cualquier mes para ver cómo cambian tus puntos y ranking proyectado.
        </p>
      </div>

      {/* KPIs simulados */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Puntos Acumulados (sim)" value={formatPoints(accumulatedPoints)} icon={BarChart3} variant="primary" />
        <KPICard title="Proyección Anual (sim)" value={formatPoints(projectedPoints)} icon={TrendingUp} variant={projectedPoints >= 100 ? 'success' : 'warning'} />
        <KPICard title="Posición Proyectada (sim)" value={projectedRank ? `#${projectedRank}` : '—'} icon={Trophy} />
        <div className="flex items-end">
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 bg-white border border-border rounded-xl py-4 text-sm font-semibold text-text-secondary hover:text-primary hover:border-primary transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Restablecer datos
          </button>
        </div>
      </div>

      {/* Simulator table — same month */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary">
            Simular {MONTHS_ES[currentMonth - 1]} {year} — indicadores
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] data-table">
            <thead>
              <tr>
                <th className="text-left">Indicador</th>
                <th className="text-right">Presupuesto (sim)</th>
                <th className="text-right">Logro (sim)</th>
                <th className="text-right">% Logro</th>
                <th className="text-right">Consecución</th>
                <th className="text-right">Puntos</th>
                <th className="text-center">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {currentMonthResult?.results.map(r => {
                const ind = myIndicators.find(i => i.id === r.indicator_id)
                const cell = ind ? cells[ind.id]?.[currentMonth] : undefined
                const rule = rules.find(rr => rr.indicator_id === r.indicator_id)
                return (
                  <tr key={r.indicator_id}>
                    <td className="font-medium text-sm text-text-primary">{r.indicator_name}</td>
                    <td className="py-2 px-2">
                      <input
                        type="number" min="0" step="any"
                        value={cell?.budget ?? ''}
                        onChange={e => ind && handleChange(ind.id, currentMonth, 'budget', e.target.value)}
                        className="input-clean text-right tabular-nums text-sm w-32"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number" min="0" step="any"
                        value={cell?.result ?? ''}
                        onChange={e => ind && handleChange(ind.id, currentMonth, 'result', e.target.value)}
                        className="input-clean text-right tabular-nums text-sm w-32"
                      />
                    </td>
                    <td className={cn('text-right tabular-nums text-sm font-medium', r.logro_pct >= 1 ? 'text-success' : r.logro_pct >= 0.9 ? 'text-warning' : 'text-danger')}>
                      {formatPct(r.logro_pct)}
                    </td>
                    <td className="text-right tabular-nums text-sm text-text-secondary">{formatPct(r.consecucion_pct)}</td>
                    <td className="text-right tabular-nums text-sm font-bold text-primary">{formatPoints(r.points)}</td>
                    <td className="text-center"><StatusBadge status={logroToStatus(r.logro_pct)} /></td>
                  </tr>
                )
              })}
              {(!currentMonthResult?.results || currentMonthResult.results.length === 0) && (
                <tr>
                  <td colSpan={7} className="text-center text-text-secondary text-sm py-8">
                    Ingresa presupuesto y logro para ver la simulación
                  </td>
                </tr>
              )}
              {currentMonthResult && currentMonthResult.results.length > 0 && (
                <tr className="bg-primary/5 font-semibold">
                  <td colSpan={5} className="text-right text-sm text-text-primary">Total simulado</td>
                  <td className="text-right tabular-nums text-primary font-bold">
                    {formatPoints(currentMonthResult.totalPoints)}
                  </td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
