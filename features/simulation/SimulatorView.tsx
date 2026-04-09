'use client'

import { useState, useMemo } from 'react'
import { calcIndicatorResult, formatPct, formatPoints } from '@/lib/calculations'
import { calcProjectedRank } from '@/lib/ranking'
import { KPICard } from '@/components/shared/KPICard'
import { StatusBadge, logroToStatus } from '@/components/shared/StatusBadge'
import { MONTHS_ES } from '@/types'
import { cn } from '@/lib/utils'
import { Zap, BarChart3, Trophy, TrendingUp, RotateCcw, Star } from 'lucide-react'
import type { Profile, MonthlyInput, ScoringRule, Indicator, RankingEntry, Period, AdditionalPointEntry } from '@/types'

interface SimulatorViewProps {
  profile: Profile
  period: Period | null
  inputs: MonthlyInput[]
  rules: ScoringRule[]
  indicators: Indicator[]
  rankingEntries: RankingEntry[]
  additionalPoints: AdditionalPointEntry[]
  year: number
}

interface SimCell { budget: string; result: string }
type SimCells = Record<string, Record<number, SimCell>> // ruleIndicatorId → month → cell

export function SimulatorView({ profile, inputs, rules, rankingEntries, additionalPoints, year }: SimulatorViewProps) {
  const currentMonth = new Date().getMonth() + 1

  // ── Separar reglas combinadas de individuales ──────────────────────────────
  const combiningRules = useMemo(() => rules.filter(r => r.config_json?.combines), [rules])
  const absorbedCodes = useMemo(
    () => new Set(combiningRules.flatMap(r => r.config_json!.combines as string[])),
    [combiningRules]
  )
  const individualRules = useMemo(
    () => rules.filter(r => !r.config_json?.combines && !absorbedCodes.has(r.indicator?.code ?? '')),
    [rules, absorbedCodes]
  )
  // Reglas visibles en la tabla: primero individuales, luego combinadas
  const visibleRules = useMemo(() => [...individualRules, ...combiningRules], [individualRules, combiningRules])

  // ── Estado: celdas del simulador ──────────────────────────────────────────
  const [cells, setCells] = useState<SimCells>(() => buildInitialCells(individualRules, combiningRules, inputs))

  function handleChange(indicatorId: string, month: number, field: 'budget' | 'result', value: string) {
    setCells(prev => ({
      ...prev,
      [indicatorId]: { ...prev[indicatorId], [month]: { ...prev[indicatorId]?.[month], [field]: value } },
    }))
  }

  function handleReset() {
    setCells(buildInitialCells(individualRules, combiningRules, inputs))
  }

  // ── Puntos adicionales simulados para el mes actual ────────────────────────
  const realAdditionalCurrent = additionalPoints
    .filter(e => e.month === currentMonth)
    .reduce((s, e) => s + e.points, 0)
  const [simAdditionalPts, setSimAdditionalPts] = useState<string>(
    realAdditionalCurrent > 0 ? String(realAdditionalCurrent) : ''
  )

  // Puntos adicionales reales de meses anteriores
  const additionalByPastMonth = useMemo(() => {
    const map: Record<number, number> = {}
    for (const e of additionalPoints) {
      if (e.month !== currentMonth) map[e.month] = (map[e.month] ?? 0) + e.points
    }
    return map
  }, [additionalPoints, currentMonth])

  // ── Cálculo simulado ───────────────────────────────────────────────────────
  const monthlyResults = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      let totalPoints = 0
      let hasData = false
      const results: ReturnType<typeof calcIndicatorResult>[] = []

      for (const rule of visibleRules) {
        const cell = cells[rule.indicator_id]?.[month]
        if (!cell) continue
        const budget = parseFloat(cell.budget) || 0
        const result = parseFloat(cell.result) || 0
        if (budget === 0) continue

        hasData = true
        const frequency = (rule.config_json?.frequency as string) || rule.indicator?.frequency || 'mensual'
        const r = calcIndicatorResult(
          rule.indicator_id,
          rule.indicator?.code ?? '',
          rule.indicator?.name ?? '',
          frequency,
          rule.weight,
          budget,
          result,
          { minLogro: rule.min_logro, pptoLogro: rule.ppto_logro, maxLogro: rule.max_logro, minCons: rule.min_cons, pptoCons: rule.ppto_cons, maxCons: rule.max_cons }
        )
        totalPoints += r.points
        results.push(r)
      }

      return { month, hasData, totalPoints, results }
    })
  }, [cells, visibleRules])

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const simAddPts = parseFloat(simAdditionalPts) || 0
  const monthsWithData = monthlyResults.filter(m => m.totalPoints > 0 && m.month <= currentMonth)

  const accumulatedPoints = monthsWithData.reduce((s, m) => {
    const extra = m.month === currentMonth ? simAddPts : (additionalByPastMonth[m.month] ?? 0)
    return s + m.totalPoints + extra
  }, 0)

  const monthlyAvg = monthsWithData.length > 0 ? accumulatedPoints / monthsWithData.length : 0
  const projectedRank = calcProjectedRank(rankingEntries, monthlyAvg, profile.employee_code)

  const currentMonthResult = monthlyResults.find(m => m.month === currentMonth)
  const currentMonthTotal = (currentMonthResult?.totalPoints ?? 0) + simAddPts

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center gap-3">
        <Zap className="w-5 h-5 text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800 font-medium">
          Modo simulación — Los cambios aquí <strong>no afectan</strong> tus datos oficiales.
          Edita presupuesto o logro para ver cómo cambian tus puntos y ranking proyectado.
        </p>
      </div>

      {/* KPIs simulados */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={`Puntos ${MONTHS_ES[currentMonth - 1]} (sim)`}
          value={formatPoints(currentMonthTotal)}
          icon={BarChart3}
          variant="primary"
        />
        <KPICard
          title="Promedio Mensual (sim)"
          value={formatPoints(monthlyAvg)}
          icon={TrendingUp}
          variant={monthlyAvg >= 100 ? 'success' : 'warning'}
        />
        <KPICard
          title="Posición Proyectada (sim)"
          value={projectedRank ? `#${projectedRank}` : '—'}
          icon={Trophy}
        />
        <div className="flex items-end">
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 bg-white border border-border rounded-xl py-4 text-sm font-semibold text-text-secondary hover:text-primary hover:border-primary transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Restablecer datos
          </button>
        </div>
      </div>

      {/* Tabla de simulación — mes actual */}
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
              {visibleRules.map(rule => {
                const cell = cells[rule.indicator_id]?.[currentMonth]
                const calcResult = currentMonthResult?.results.find(r => r.indicator_id === rule.indicator_id)
                const isCombined = !!rule.config_json?.combines

                return (
                  <tr key={rule.indicator_id}>
                    <td className="font-medium text-sm text-text-primary">
                      {rule.indicator?.name ?? rule.indicator_id}
                      {isCombined && (
                        <span className="ml-1.5 text-xs text-text-secondary font-normal">(combinado)</span>
                      )}
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number" min="0" step="any"
                        value={cell?.budget ?? ''}
                        onChange={e => handleChange(rule.indicator_id, currentMonth, 'budget', e.target.value)}
                        className="input-clean text-right tabular-nums text-sm w-32"
                        placeholder="—"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number" min="0" step="any"
                        value={cell?.result ?? ''}
                        onChange={e => handleChange(rule.indicator_id, currentMonth, 'result', e.target.value)}
                        className="input-clean text-right tabular-nums text-sm w-32"
                        placeholder="—"
                      />
                    </td>
                    {calcResult ? (
                      <>
                        <td className={cn('text-right tabular-nums text-sm font-medium',
                          calcResult.logro_pct >= 1 ? 'text-success' : calcResult.logro_pct >= 0.9 ? 'text-warning' : 'text-danger'
                        )}>
                          {formatPct(calcResult.logro_pct)}
                        </td>
                        <td className="text-right tabular-nums text-sm text-text-secondary">
                          {formatPct(calcResult.consecucion_pct)}
                        </td>
                        <td className="text-right tabular-nums text-sm font-bold text-primary">
                          {formatPoints(calcResult.points)}
                        </td>
                        <td className="text-center">
                          <StatusBadge status={logroToStatus(calcResult.logro_pct)} />
                        </td>
                      </>
                    ) : (
                      <td colSpan={4} className="text-right text-text-secondary text-xs py-2 pr-4">
                        Ingresa ppto y logro
                      </td>
                    )}
                  </tr>
                )
              })}

              {/* Fila puntos adicionales */}
              <tr className="bg-amber-50/60 border-t border-amber-100">
                <td className="font-medium text-sm text-text-primary flex items-center gap-1.5 py-3">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  Puntos Adicionales (sim)
                </td>
                <td colSpan={2} className="py-2 px-2">
                  <input
                    type="number" min="0" step="0.01"
                    value={simAdditionalPts}
                    onChange={e => setSimAdditionalPts(e.target.value)}
                    className="input-clean text-right tabular-nums text-sm w-32"
                    placeholder="0"
                  />
                </td>
                <td colSpan={2} className="text-right text-xs text-text-secondary">
                  sostenibilidad, bonos de oficina, etc.
                </td>
                <td className="text-right tabular-nums text-sm font-bold text-amber-600">
                  {simAddPts > 0 ? `+${formatPoints(simAddPts)}` : '—'}
                </td>
                <td />
              </tr>

              {/* Total simulado */}
              <tr className="bg-primary/5 font-semibold border-t border-border">
                <td colSpan={5} className="text-right text-sm text-text-primary">
                  Total simulado {MONTHS_ES[currentMonth - 1]}
                </td>
                <td className="text-right tabular-nums text-primary font-bold">
                  {formatPoints(currentMonthTotal)}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen del promedio */}
      {monthsWithData.length > 0 && (
        <div className="bg-white rounded-xl border border-border shadow-card p-5">
          <p className="text-xs text-text-secondary uppercase tracking-wide mb-3">
            Promedio mensual simulado ({monthsWithData.length} {monthsWithData.length === 1 ? 'mes' : 'meses'})
          </p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-extrabold text-primary tabular-nums">
              {monthlyAvg.toFixed(2)}
            </span>
            <span className="text-text-secondary text-sm pb-1">pts / mes</span>
          </div>
          <div className="mt-3 flex gap-6 text-sm text-text-secondary">
            <div>
              <span className="block text-xs uppercase tracking-wide opacity-70">Acumulado</span>
              <span className="font-semibold text-text-primary">{accumulatedPoints.toFixed(1)} pts</span>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-wide opacity-70">Proyección anual</span>
              <span className="font-semibold text-text-primary">{(monthlyAvg * 12).toFixed(1)} pts</span>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-wide opacity-70">Posición proyectada</span>
              <span className="font-semibold text-text-primary">{projectedRank ? `#${projectedRank}` : '—'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildInitialCells(
  individualRules: ScoringRule[],
  combiningRules: ScoringRule[],
  inputs: MonthlyInput[]
): SimCells {
  const map: SimCells = {}

  // Reglas individuales: pre-llenar desde inputs reales
  for (const rule of individualRules) {
    map[rule.indicator_id] = {}
    for (let m = 1; m <= 12; m++) {
      const inp = inputs.find(i => i.indicator_id === rule.indicator_id && i.month === m)
      map[rule.indicator_id][m] = {
        budget: inp && inp.target_budget > 0 ? String(inp.target_budget) : '',
        result: inp && inp.target_budget > 0 ? String(inp.actual_result) : '',
      }
    }
  }

  // Reglas combinadas: sumar sub-inputs absorbidos
  for (const rule of combiningRules) {
    const codes = rule.config_json!.combines as string[]
    map[rule.indicator_id] = {}
    for (let m = 1; m <= 12; m++) {
      const subInputs = inputs.filter(i => i.indicator && codes.includes(i.indicator.code) && i.month === m)
      const combinedBudget = subInputs.reduce((s, i) => s + i.target_budget, 0)
      const combinedResult = subInputs.reduce((s, i) => s + i.actual_result, 0)
      map[rule.indicator_id][m] = {
        budget: combinedBudget > 0 ? String(combinedBudget) : '',
        result: combinedResult > 0 ? String(combinedResult) : '',
      }
    }
  }

  return map
}
