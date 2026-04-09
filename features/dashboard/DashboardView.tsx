'use client'

import { useMemo } from 'react'
import { KPICard } from '@/components/shared/KPICard'
import { StatusBadge, logroToStatus } from '@/components/shared/StatusBadge'
import { DashboardCharts } from './DashboardCharts'
import { IndicatorsTable } from './IndicatorsTable'
import { calcIndicatorResult, calcProjectedAnnualPoints, calcEqualizedPoints, calcBudgetAchievementPct, formatPct, formatPoints, getMonthName } from '@/lib/calculations'
import { findCurrentRank, calcProjectedRank } from '@/lib/ranking'
import { MONTHS_ES } from '@/types'
import type { Profile, MonthlyInput, NonRecurringIncomeEntry, ScoringRule, RankingEntry } from '@/types'
import {
  BarChart3, TrendingUp, Target, Trophy, ArrowUp, ArrowDown, Minus, CircleDollarSign,
} from 'lucide-react'

interface DashboardViewProps {
  profile: Profile
  inputs: MonthlyInput[]
  nriEntries: NonRecurringIncomeEntry[]
  rules: ScoringRule[]
  rankingEntries: RankingEntry[]
  year: number
}

export function DashboardView({ profile, inputs, nriEntries, rules, rankingEntries, year }: DashboardViewProps) {
  const currentMonth = new Date().getMonth() + 1

  // Agrupar NRI por mes
  const nriByMonth = useMemo(() => {
    const map: Record<number, number> = {}
    for (const e of nriEntries) {
      map[e.month] = (map[e.month] ?? 0) + e.amount
    }
    return map
  }, [nriEntries])

  // Calcular resultados por indicador y por mes
  const monthlyResults = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const monthInputs = inputs.filter(inp => inp.month === month)

      if (monthInputs.length === 0) {
        return { month, monthName: MONTHS_ES[i], totalPoints: 0, hasData: false, results: [] }
      }

      let totalPoints = 0
      const results = []

      // Reglas que combinan sub-indicadores (ej: INF Total = INF_Rec + INF_NoRec)
      const combiningRules = rules.filter(r => r.config_json?.combines)
      // Códigos absorbidos por una regla combinada (no se calculan individualmente)
      const absorbedCodes = new Set(
        combiningRules.flatMap(r => (r.config_json!.combines as string[]))
      )

      // ── Indicadores individuales ──────────────────────────────────────────
      for (const inp of monthInputs) {
        if (!inp.indicator) continue
        // Saltar los que son parte de un combine (se procesan abajo)
        if (absorbedCodes.has(inp.indicator.code)) continue

        const rule = rules.find(r => r.indicator_id === inp.indicator_id)
        if (!rule) continue

        let actualResult = inp.actual_result
        if (inp.indicator.code === 'INF_NO_RECURRENTES' && nriByMonth[month]) {
          actualResult += nriByMonth[month]
        }

        const result = calcIndicatorResult(
          inp.indicator_id,
          inp.indicator.code,
          inp.indicator.name,
          inp.indicator.frequency,
          rule.weight,
          inp.target_budget,
          actualResult,
          {
            minLogro: rule.min_logro,
            pptoLogro: rule.ppto_logro,
            maxLogro: rule.max_logro,
            minCons: rule.min_cons,
            pptoCons: rule.ppto_cons,
            maxCons: rule.max_cons,
          }
        )
        totalPoints += result.points
        results.push(result)
      }

      // ── Indicadores combinados (ej: INF Total para Mediana Empresa) ───────
      for (const rule of combiningRules) {
        const codes = rule.config_json!.combines as string[]
        const subInputs = monthInputs.filter(inp => inp.indicator && codes.includes(inp.indicator.code))
        if (subInputs.length === 0) continue

        const combinedBudget = subInputs.reduce((s, i) => s + i.target_budget, 0)
        const combinedResult = subInputs.reduce((s, i) => {
          let res = i.actual_result
          if (i.indicator?.code === 'INF_NO_RECURRENTES' && nriByMonth[month]) {
            res += nriByMonth[month]
          }
          return s + res
        }, 0)

        const result = calcIndicatorResult(
          rule.indicator_id,
          rule.indicator?.code ?? 'INF_TOTAL',
          rule.indicator?.name ?? 'INF Total',
          rule.indicator?.frequency ?? 'trimestral',
          rule.weight,
          combinedBudget,
          combinedResult,
          {
            minLogro: rule.min_logro,
            pptoLogro: rule.ppto_logro,
            maxLogro: rule.max_logro,
            minCons: rule.min_cons,
            pptoCons: rule.ppto_cons,
            maxCons: rule.max_cons,
          }
        )
        totalPoints += result.points
        results.push(result)
      }

      return { month, monthName: MONTHS_ES[i], totalPoints, hasData: true, results }
    })
  }, [inputs, rules, nriByMonth])

  // KPIs principales
  const monthsWithData = monthlyResults.filter(m => m.hasData && m.month <= currentMonth)
  const accumulatedPoints = monthsWithData.reduce((s, m) => s + m.totalPoints, 0)
  const projectedPoints  = calcProjectedAnnualPoints(monthlyResults.map(m => ({ month: m.month, points: m.totalPoints, hasData: m.hasData })))
  const equalizedPoints  = calcEqualizedPoints(accumulatedPoints, monthsWithData.length)

  // Avance presupuestal global
  const totalBudget = inputs.reduce((s, i) => s + i.target_budget, 0)
  const totalResult = inputs.reduce((s, i) => s + i.actual_result, 0)
  const budgetPct = calcBudgetAchievementPct(totalResult, totalBudget)

  // Ranking
  const currentRank   = findCurrentRank(rankingEntries, profile.employee_code, profile.full_name)
  const projectedRank = calcProjectedRank(rankingEntries, projectedPoints, profile.employee_code)
  const rankDelta = currentRank && projectedRank ? currentRank - projectedRank : null

  // NRI total
  const nriTotal = nriEntries.reduce((s, e) => s + e.amount, 0)

  // Indicadores del mes actual
  const currentMonthResult = monthlyResults.find(m => m.month === currentMonth)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Puntos Acumulados"
          value={formatPoints(accumulatedPoints)}
          subtitle={`${monthsWithData.length} meses capturados`}
          icon={BarChart3}
          variant="primary"
        />
        <KPICard
          title="Puntos Proyectados"
          value={formatPoints(projectedPoints)}
          subtitle="Proyección anual"
          icon={TrendingUp}
          variant={projectedPoints >= 100 ? 'success' : projectedPoints >= 80 ? 'warning' : 'danger'}
        />
        <KPICard
          title="Puntos Ecualizados"
          value={formatPoints(equalizedPoints)}
          subtitle="Base anual / meses"
          icon={Target}
        />
        <KPICard
          title="Avance vs Ppto"
          value={formatPct(budgetPct)}
          subtitle="Acumulado"
          icon={CircleDollarSign}
          variant={budgetPct >= 1 ? 'success' : budgetPct >= 0.9 ? 'warning' : 'danger'}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Posición Actual"
          value={currentRank ? `#${currentRank}` : '—'}
          subtitle="En ranking nacional"
          icon={Trophy}
        />
        <KPICard
          title="Posición Proyectada"
          value={projectedRank ? `#${projectedRank}` : '—'}
          subtitle="Con tendencia actual"
          icon={Trophy}
          variant={rankDelta && rankDelta > 0 ? 'success' : rankDelta && rankDelta < 0 ? 'danger' : 'default'}
          trend={rankDelta !== null ? {
            value: rankDelta,
            label: rankDelta > 0 ? 'posiciones arriba' : rankDelta < 0 ? 'posiciones abajo' : 'sin cambio',
          } : undefined}
        />
        <KPICard
          title="INF No Recurrentes"
          value={nriTotal > 0 ? `$${(nriTotal / 1000).toFixed(0)}K` : '—'}
          subtitle={`${nriEntries.length} registros`}
          icon={CircleDollarSign}
        />
        <KPICard
          title="Mes Actual"
          value={MONTHS_ES[currentMonth - 1]}
          subtitle={currentMonthResult?.hasData ? `${formatPoints(currentMonthResult.totalPoints)} pts` : 'Sin captura'}
          icon={BarChart3}
          variant={currentMonthResult?.hasData ? 'default' : 'warning'}
        />
      </div>

      {/* Charts */}
      <DashboardCharts monthlyResults={monthlyResults} currentMonth={currentMonth} />

      {/* Indicators table */}
      {currentMonthResult?.hasData && currentMonthResult.results.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-text-primary mb-3">
            Indicadores — {MONTHS_ES[currentMonth - 1]} {year}
          </h2>
          <IndicatorsTable results={currentMonthResult.results} />
        </div>
      )}

      {/* Empty state */}
      {monthsWithData.length === 0 && (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <BarChart3 className="w-10 h-10 text-text-secondary mx-auto mb-3 opacity-40" />
          <h3 className="font-semibold text-text-primary mb-1">Sin datos capturados</h3>
          <p className="text-text-secondary text-sm">
            Ve a <strong>Captura Mensual</strong> para ingresar tu presupuesto y logro del mes.
          </p>
        </div>
      )}
    </div>
  )
}
