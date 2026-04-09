'use client'

import { useMemo } from 'react'
import { KPICard } from '@/components/shared/KPICard'
import { IndicatorMatrix } from './IndicatorMatrix'
import { DashboardCharts } from './DashboardCharts'
import {
  calcIndicatorResult, calcBudgetAchievementPct, formatPct, formatPoints,
} from '@/lib/calculations'
import { findCurrentRank, calcProjectedRank } from '@/lib/ranking'
import { MONTHS_ES } from '@/types'
import type { Profile, MonthlyInput, NonRecurringIncomeEntry, ScoringRule, RankingEntry, AdditionalPointEntry } from '@/types'
import { BarChart3, TrendingUp, Target, Trophy, Star } from 'lucide-react'

interface DashboardViewProps {
  profile: Profile
  inputs: MonthlyInput[]
  nriEntries: NonRecurringIncomeEntry[]
  rules: ScoringRule[]
  rankingEntries: RankingEntry[]
  additionalPoints: AdditionalPointEntry[]
  year: number
}

export function DashboardView({ profile, inputs, nriEntries, rules, rankingEntries, additionalPoints, year }: DashboardViewProps) {
  const currentMonth = new Date().getMonth() + 1

  // ── NRI por mes ───────────────────────────────────────────────────────────────
  const nriByMonth = useMemo(() => {
    const map: Record<number, number> = {}
    for (const e of nriEntries) map[e.month] = (map[e.month] ?? 0) + e.amount
    return map
  }, [nriEntries])

  // ── Puntos por mes (12 meses) ─────────────────────────────────────────────────
  const monthlyResults = useMemo(() => {
    const combiningRules = rules.filter(r => r.config_json?.combines)
    const absorbedCodes = new Set(combiningRules.flatMap(r => (r.config_json!.combines as string[])))

    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const monthInputs = inputs.filter(inp => inp.month === month)
      // Un mes solo cuenta como capturado si al menos un indicador tiene presupuesto > 0
      const hasRealData = monthInputs.some(inp => inp.target_budget > 0)
      if (!hasRealData) return { month, monthName: MONTHS_ES[i], totalPoints: 0, hasData: false, results: [] }

      let totalPoints = 0
      const results = []

      // Indicadores individuales
      for (const inp of monthInputs) {
        if (!inp.indicator) continue
        if (absorbedCodes.has(inp.indicator.code)) continue
        const rule = rules.find(r => r.indicator_id === inp.indicator_id)
        if (!rule) continue
        let actual = inp.actual_result
        if (inp.indicator.code === 'INF_NO_RECURRENTES' && nriByMonth[month]) actual += nriByMonth[month]
        const result = calcIndicatorResult(inp.indicator_id, inp.indicator.code, inp.indicator.name, inp.indicator.frequency, rule.weight, inp.target_budget, actual, { minLogro: rule.min_logro, pptoLogro: rule.ppto_logro, maxLogro: rule.max_logro, minCons: rule.min_cons, pptoCons: rule.ppto_cons, maxCons: rule.max_cons })
        totalPoints += result.points
        results.push(result)
      }

      // Indicadores combinados
      for (const rule of combiningRules) {
        const codes = rule.config_json!.combines as string[]
        const subInputs = monthInputs.filter(inp => inp.indicator && codes.includes(inp.indicator.code))
        if (subInputs.length === 0) continue
        const combinedBudget = subInputs.reduce((s, i) => s + i.target_budget, 0)
        const combinedResult = subInputs.reduce((s, i) => {
          let res = i.actual_result
          if (i.indicator?.code === 'INF_NO_RECURRENTES' && nriByMonth[month]) res += nriByMonth[month]
          return s + res
        }, 0)
        const result = calcIndicatorResult(rule.indicator_id, rule.indicator?.code ?? 'INF_TOTAL', rule.indicator?.name ?? 'INF Total', rule.indicator?.frequency ?? 'trimestral', rule.weight, combinedBudget, combinedResult, { minLogro: rule.min_logro, pptoLogro: rule.ppto_logro, maxLogro: rule.max_logro, minCons: rule.min_cons, pptoCons: rule.ppto_cons, maxCons: rule.max_cons })
        totalPoints += result.points
        results.push(result)
      }

      return { month, monthName: MONTHS_ES[i], totalPoints, hasData: true, results }
    })
  }, [inputs, rules, nriByMonth])

  // ── Puntos adicionales por mes ────────────────────────────────────────────────
  const additionalByMonth = useMemo(() => {
    const map: Record<number, number> = {}
    for (const e of additionalPoints) map[e.month] = (map[e.month] ?? 0) + e.points
    return map
  }, [additionalPoints])

  // ── KPIs ──────────────────────────────────────────────────────────────────────
  // Solo meses con puntos reales en indicadores base (excluye residuos y meses en cero)
  const monthsWithData = monthlyResults.filter(m => m.totalPoints > 0 && m.month <= currentMonth)
  const monthsWithDataNums = monthsWithData.map(m => m.month)
  // Cada mes acumula sus puntos de indicadores + sus puntos adicionales de ese mes
  const accumulatedPoints = monthsWithData.reduce(
    (s, m) => s + m.totalPoints + (additionalByMonth[m.month] ?? 0), 0
  )
  const additionalTotal = additionalPoints.reduce((s, e) => s + e.points, 0)
  const monthlyAvg = monthsWithData.length > 0 ? accumulatedPoints / monthsWithData.length : 0

  // Proyección: promedio actual × 12
  const projectedPoints = monthlyAvg * 12

  // Avance vs presupuesto
  const totalBudget = inputs.reduce((s, i) => s + i.target_budget, 0)
  const totalResult = inputs.reduce((s, i) => s + i.actual_result, 0)
  const budgetPct = calcBudgetAchievementPct(totalResult, totalBudget)

  // Ranking
  const currentRank = findCurrentRank(rankingEntries, profile.employee_code, profile.full_name)
  const projectedRank = calcProjectedRank(rankingEntries, monthlyAvg, profile.employee_code, profile.full_name)
  const rankDelta = currentRank && projectedRank ? currentRank - projectedRank : null

  // NRI total


  // ── Matriz de indicadores ─────────────────────────────────────────────────────
  // Recopila todos los indicadores únicos de todos los meses
  const allIndicators = useMemo(() => {
    const map = new Map<string, { id: string; name: string; frequency: string; weight: number; isAdditional: boolean }>()
    for (const month of monthlyResults) {
      for (const result of month.results) {
        if (!map.has(result.indicator_id)) {
          const rule = rules.find(r => r.indicator_id === result.indicator_id)
          map.set(result.indicator_id, {
            id: result.indicator_id,
            name: result.indicator_name,
            frequency: result.frequency,
            weight: result.weight,
            isAdditional: rule?.config_json?.is_additional === true,
          })
        }
      }
    }
    return Array.from(map.values())
  }, [monthlyResults, rules])

  // Construye la matriz: indicatorId → month → points
  const pointsMatrix = useMemo(() => {
    const matrix: Record<string, Record<number, number>> = {}
    for (const month of monthlyResults) {
      for (const result of month.results) {
        if (!matrix[result.indicator_id]) matrix[result.indicator_id] = {}
        matrix[result.indicator_id][month.month] = result.points
      }
    }
    return matrix
  }, [monthlyResults])

  const baseIndicators = allIndicators.filter(i => !i.isAdditional)
  const additionalIndicators = allIndicators.filter(i => i.isAdditional)

  // ── Sin datos ─────────────────────────────────────────────────────────────────
  if (monthsWithData.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <BarChart3 className="w-10 h-10 text-text-secondary mx-auto mb-3 opacity-40" />
          <h3 className="font-semibold text-text-primary mb-1">Sin datos capturados</h3>
          <p className="text-text-secondary text-sm">
            Ve a <strong>Captura Mensual</strong> para ingresar tu presupuesto y logro del mes.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Hero: promedio mensual + ranking ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Promedio mensual — número principal */}
        <div className="sm:col-span-2 bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-white shadow-lg">
          <p className="text-xs uppercase tracking-widest opacity-70 mb-1">Promedio Mensual de Puntos</p>
          <div className="flex items-end gap-3">
            <span className="text-6xl font-extrabold tabular-nums leading-none">
              {monthlyAvg.toFixed(2)}
            </span>
            <div className="pb-1 text-sm opacity-80">
              <p>pts / mes</p>
              <p>{monthsWithData.length} {monthsWithData.length === 1 ? 'mes capturado' : 'meses capturados'}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-6 text-sm opacity-80">
            <div>
              <span className="block text-xs uppercase tracking-wide opacity-70">Acumulado</span>
              <span className="font-semibold">{accumulatedPoints.toFixed(1)} pts</span>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-wide opacity-70">Proyección anual</span>
              <span className="font-semibold">{(monthlyAvg * 12).toFixed(1)} pts</span>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-wide opacity-70">vs Ppto</span>
              <span className="font-semibold">{formatPct(budgetPct)}</span>
            </div>
            {additionalTotal > 0 && (
              <div>
                <span className="block text-xs uppercase tracking-wide opacity-70">Pts Adicionales</span>
                <span className="font-semibold">+{additionalTotal.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Ranking */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-border shadow-card p-5 flex-1 flex flex-col justify-center">
            <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Posición Ranking</p>
            <p className="text-4xl font-extrabold text-primary tabular-nums">
              {currentRank ? `#${currentRank}` : '—'}
            </p>
            <p className="text-xs text-text-secondary mt-1">Ranking nacional actual</p>
            {rankDelta !== null && rankDelta !== 0 && (
              <p className={`text-xs mt-1 font-medium ${rankDelta > 0 ? 'text-success' : 'text-danger'}`}>
                {rankDelta > 0 ? `▲ ${rankDelta} posiciones arriba` : `▼ ${Math.abs(rankDelta)} posiciones abajo`} proyectado
              </p>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-border shadow-card p-5 flex-1 flex flex-col justify-center">
            <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Proyección Cierre Mes</p>
            <p className="text-4xl font-extrabold text-primary tabular-nums">
              {projectedRank ? `#${projectedRank}` : '—'}
            </p>
            <p className="text-xs text-text-secondary mt-1">Si cierras {MONTHS_ES[currentMonth - 1]} como vas</p>
            {currentRank && projectedRank && projectedRank < currentRank && (
              <p className="text-xs mt-1 font-medium text-success">
                ▲ Subirías {currentRank - projectedRank} {currentRank - projectedRank === 1 ? 'posición' : 'posiciones'}
              </p>
            )}
            {currentRank && projectedRank && projectedRank > currentRank && (
              <p className="text-xs mt-1 font-medium text-danger">
                ▼ Bajarías {projectedRank - currentRank} {projectedRank - currentRank === 1 ? 'posición' : 'posiciones'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Gráfica de tendencia ─────────────────────────────────────────────── */}
      <DashboardCharts monthlyResults={monthlyResults} currentMonth={currentMonth} />

      {/* ── Matrices de indicadores ──────────────────────────────────────────── */}
      <IndicatorMatrix
        title="Indicadores Base"
        indicators={baseIndicators}
        matrix={pointsMatrix}
        currentMonth={currentMonth}
        monthsWithData={monthsWithDataNums}
      />

      {additionalIndicators.length > 0 && (
        <IndicatorMatrix
          title="Indicadores Adicionales"
          indicators={additionalIndicators}
          matrix={pointsMatrix}
          currentMonth={currentMonth}
          monthsWithData={monthsWithDataNums}
        />
      )}

    </div>
  )
}
