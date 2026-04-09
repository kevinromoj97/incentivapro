'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/auth/client'
import { upsertManyMonthlyInputs, deleteManyMonthlyInputs } from '@/lib/db/queries'
import { calcConsecucion, calcStatus, formatPct, formatPoints } from '@/lib/calculations'
import { StatusBadge, logroToStatus } from '@/components/shared/StatusBadge'
import { MONTHS_ES } from '@/types'
import { Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import type { Profile, MonthlyInput, ScoringRule, Indicator, Period } from '@/types'

interface CaptureTableProps {
  profile: Profile
  period: Period | null
  inputs: MonthlyInput[]
  rules: ScoringRule[]
  indicators: Indicator[]
  year: number
}

interface CellValue {
  budget: string
  result: string
}

type CellMap = Record<string, Record<number, CellValue>> // indicatorId → month → {budget, result}

export function CaptureTable({ profile, period, inputs, rules, indicators, year }: CaptureTableProps) {
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Códigos de sub-indicadores que se combinan en una regla (ej: INF para Mediana Empresa)
  const combinedCodes = rules.flatMap(r => (r.config_json?.combines as string[] | undefined) ?? [])
  // IDs de indicadores que actúan como "contenedor" de combines (no se capturan directamente)
  const combiningIds = rules.filter(r => r.config_json?.combines).map(r => r.indicator_id)

  // Mostrar: indicadores con regla propia (excepto los contenedores) + sub-indicadores de combines
  const myIndicators = indicators.filter(ind =>
    (rules.some(r => r.indicator_id === ind.id) && !combiningIds.includes(ind.id)) ||
    combinedCodes.includes(ind.code)
  )

  // Estado inicial desde los inputs existentes
  const [cells, setCells] = useState<CellMap>(() => {
    const map: CellMap = {}
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
      [indicatorId]: {
        ...prev[indicatorId],
        [month]: { ...prev[indicatorId]?.[month], [field]: value },
      },
    }))
  }

  async function handleSave() {
    if (!period) return

    const supabase = createClient()
    const toSave: Array<Omit<MonthlyInput, 'id' | 'created_at' | 'updated_at'>> = []

    for (const ind of myIndicators) {
      for (let m = 1; m <= 12; m++) {
        const cell = cells[ind.id]?.[m]
        if (!cell) continue
        const budget = parseFloat(cell.budget) || 0
        const result = parseFloat(cell.result) || 0
        if (budget === 0 && result === 0) continue

        toSave.push({
          user_id:      profile.id,
          period_id:    period.id,
          indicator_id: ind.id,
          year,
          month:        m,
          target_budget: budget,
          actual_result: result,
        })
      }
    }

    // Celdas en 0/0 que deben eliminarse (registros residuales)
    const toDelete: Record<number, string[]> = {} // month → indicatorIds
    for (const ind of myIndicators) {
      for (let m = 1; m <= 12; m++) {
        const cell = cells[ind.id]?.[m]
        if (!cell) continue
        const budget = parseFloat(cell.budget) || 0
        const result = parseFloat(cell.result) || 0
        if (budget === 0 && result === 0) {
          if (!toDelete[m]) toDelete[m] = []
          toDelete[m].push(ind.id)
        }
      }
    }

    startTransition(async () => {
      // Borrar registros que quedaron en 0/0
      await Promise.all(
        Object.entries(toDelete).map(([m, ids]) =>
          deleteManyMonthlyInputs(supabase, profile.id, year, parseInt(m), ids)
        )
      )
      const { error } = await upsertManyMonthlyInputs(supabase, toSave as Parameters<typeof upsertManyMonthlyInputs>[1])
      if (error) {
        setToast({ type: 'error', msg: 'Error al guardar. Intenta de nuevo.' })
      } else {
        setToast({ type: 'success', msg: `${toSave.length} registros guardados correctamente.` })
      }
      setTimeout(() => setToast(null), 4000)
    })
  }

  // Meses válidos para una frecuencia
  function validMonths(frequency: string): number[] {
    switch (frequency) {
      case 'trimestral': return [3, 6, 9, 12]
      case 'semestral':  return [6, 12]
      case 'anual':      return [12]
      default:           return [1,2,3,4,5,6,7,8,9,10,11,12]
    }
  }

  // Obtiene la frecuencia efectiva de un indicador (override personal o la del indicador)
  function getEffectiveFrequency(indicatorId: string, ind: { frequency: string }) {
    const rule = rules.find(r => r.indicator_id === indicatorId)
    return (rule?.config_json?.frequency as string) || ind.frequency
  }

  // Calcula consecución de una celda
  function getCons(indicatorId: string, month: number) {
    const cell = cells[indicatorId]?.[month]
    if (!cell) return null
    const budget = parseFloat(cell.budget) || 0
    const result = parseFloat(cell.result) || 0
    if (budget === 0) return null
    const rule = rules.find(r => r.indicator_id === indicatorId)
    if (!rule) return null
    const logro = result / budget
    return {
      logro,
      cons: calcConsecucion(logro, { minLogro: rule.min_logro, pptoLogro: rule.ppto_logro, maxLogro: rule.max_logro, minCons: rule.min_cons, pptoCons: rule.ppto_cons, maxCons: rule.max_cons }),
      pts: calcConsecucion(logro, { minLogro: rule.min_logro, pptoLogro: rule.ppto_logro, maxLogro: rule.max_logro, minCons: rule.min_cons, pptoCons: rule.ppto_cons, maxCons: rule.max_cons }) * rule.weight,
    }
  }

  const currentMonth = new Date().getMonth() + 1

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-text-secondary">
            Captura presupuesto y logro para cada indicador. Los puntos se calculan automáticamente.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all',
            isPending ? 'bg-primary/60 text-white cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-dark'
          )}
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar todo
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium',
          toast.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'
        )}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* No indicators message */}
      {myIndicators.length === 0 && (
        <div className="bg-warning/8 border border-warning/20 rounded-xl p-6 text-center">
          <p className="text-warning font-medium text-sm">
            No tienes indicadores configurados. Contacta al administrador para que te asigne un puesto.
          </p>
        </div>
      )}

      {/* Table per indicator */}
      {myIndicators.map(ind => {
        const rule = rules.find(r => r.indicator_id === ind.id)
        const effectiveFreq = getEffectiveFrequency(ind.id, ind)
        const allowed = validMonths(effectiveFreq)
        return (
          <div key={ind.id} className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
            {/* Indicator header */}
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{ind.name}</h3>
                <p className="text-xs text-text-secondary capitalize">{effectiveFreq} · Peso: {rule?.weight ?? '—'} pts</p>
              </div>
            </div>
            {/* Monthly table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider py-2 px-4 bg-muted w-28">Mes</th>
                    <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider py-2 px-3 bg-muted">Presupuesto</th>
                    <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider py-2 px-3 bg-muted">Logro</th>
                    <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider py-2 px-3 bg-muted">% Logro</th>
                    <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider py-2 px-3 bg-muted">Consecución</th>
                    <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider py-2 px-3 bg-muted">Puntos</th>
                    <th className="text-center text-xs font-semibold text-text-secondary uppercase tracking-wider py-2 px-3 bg-muted">Estatus</th>
                  </tr>
                </thead>
                <tbody>
                  {MONTHS_ES.map((monthName, i) => {
                    const month = i + 1
                    const cell = cells[ind.id]?.[month] ?? { budget: '', result: '' }
                    const calc = getCons(ind.id, month)
                    const isCurrentMonth = month === currentMonth
                    const isApplicable = allowed.includes(month)

                    return (
                      <tr key={month} className={cn(
                        'border-b border-border last:border-0 transition-colors',
                        !isApplicable ? 'opacity-40 bg-gray-50' : isCurrentMonth ? 'bg-primary/2' : 'hover:bg-gray-50/50'
                      )}>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text-primary">{monthName}</span>
                            {isCurrentMonth && isApplicable && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Actual</span>}
                            {!isApplicable && <span className="text-[10px] text-text-secondary italic">N/A</span>}
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={cell.budget}
                            onChange={e => handleChange(ind.id, month, 'budget', e.target.value)}
                            disabled={!isApplicable}
                            className={cn('input-clean text-right tabular-nums text-sm w-36', !isApplicable && 'cursor-not-allowed')}
                            placeholder="0"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={cell.result}
                            onChange={e => handleChange(ind.id, month, 'result', e.target.value)}
                            disabled={!isApplicable}
                            className={cn('input-clean text-right tabular-nums text-sm w-36', !isApplicable && 'cursor-not-allowed')}
                            placeholder="0"
                          />
                        </td>
                        <td className="text-right px-3 tabular-nums text-sm">
                          {calc ? (
                            <span className={cn(
                              'font-medium',
                              calc.logro >= 1 ? 'text-success' : calc.logro >= 0.9 ? 'text-warning' : 'text-danger'
                            )}>
                              {formatPct(calc.logro)}
                            </span>
                          ) : <span className="text-text-secondary">—</span>}
                        </td>
                        <td className="text-right px-3 tabular-nums text-sm text-text-secondary">
                          {calc ? formatPct(calc.cons) : '—'}
                        </td>
                        <td className="text-right px-3 tabular-nums text-sm font-semibold text-primary">
                          {calc ? formatPoints(calc.pts) : '—'}
                        </td>
                        <td className="text-center px-3">
                          {calc ? (
                            <StatusBadge status={logroToStatus(calc.logro)} />
                          ) : <span className="text-text-secondary text-xs">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
