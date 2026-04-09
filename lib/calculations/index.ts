/**
 * Motor de cálculo DOR 2026
 * ─────────────────────────────────────────────────────────────────────────────
 * Toda la lógica de negocio vive aquí — nunca en componentes UI.
 * Fuente: Manual de Incentivación DOR 2026 v3, Anexo A y B.
 */

import { DEFAULT_SCORING, type ScoringThresholds } from '@/config/scoringRules'
import type { IndicatorResult, MonthlyInput, ScoringRule, MONTHS_ES } from '@/types'
import { MONTHS_ES as MONTHS } from '@/types'

// ─── Fórmula base (Anexo A) ───────────────────────────────────────────────────

/**
 * Calcula la consecución (0–150%) a partir del % de logro.
 *
 * Interpolación lineal en 3 tramos:
 *   [0, minLogro)       → 0 hasta minCons   (gradiente suave)
 *   [minLogro, pptoLogro] → minCons hasta pptoCons
 *   (pptoLogro, maxLogro] → pptoCons hasta maxCons
 *   > maxLogro           → maxCons (tope)
 */
export function calcConsecucion(
  logro: number,
  thresholds: ScoringThresholds = DEFAULT_SCORING
): number {
  const { minLogro, pptoLogro, maxLogro, minCons, pptoCons, maxCons } = thresholds

  if (logro <= 0) return 0

  if (logro < minLogro) {
    // Por debajo del mínimo → 0 puntos (DOR 2026: sin cobro por debajo del piso)
    return 0
  }

  if (logro <= pptoLogro) {
    // Interpolación de minLogro→minCons hasta pptoLogro→pptoCons
    const ratio = (logro - minLogro) / (pptoLogro - minLogro)
    return minCons + ratio * (pptoCons - minCons)
  }

  if (logro <= maxLogro) {
    // Interpolación de pptoLogro→pptoCons hasta maxLogro→maxCons
    const ratio = (logro - pptoLogro) / (maxLogro - pptoLogro)
    return pptoCons + ratio * (maxCons - pptoCons)
  }

  // Tope en maxCons (150%)
  return maxCons
}

/**
 * Calcula puntos de un indicador.
 * puntos = consecución * peso
 */
export function calcIndicatorPoints(
  budget: number,
  result: number,
  weight: number,
  thresholds: ScoringThresholds = DEFAULT_SCORING
): number {
  if (budget <= 0) return 0
  const logro = result / budget
  const cons = calcConsecucion(logro, thresholds)
  return cons * weight
}

/**
 * Porcentaje de logro con formato para UI
 */
export function calcLogroPct(budget: number, result: number): number {
  if (budget <= 0) return 0
  return result / budget
}

/**
 * Determina el estatus semáforo del logro
 */
export function calcStatus(logroPct: number): 'success' | 'warning' | 'danger' {
  if (logroPct >= 1.0) return 'success'
  if (logroPct >= 0.9) return 'warning'
  return 'danger'
}

// ─── Cálculo por indicador ────────────────────────────────────────────────────

export function calcIndicatorResult(
  indicatorId: string,
  indicatorCode: string,
  indicatorName: string,
  frequency: string,
  weight: number,
  budget: number,
  result: number,
  thresholds: ScoringThresholds = DEFAULT_SCORING
): IndicatorResult {
  const logroPct = calcLogroPct(budget, result)
  const consecucionPct = budget > 0 ? calcConsecucion(logroPct, thresholds) : 0
  const points = budget > 0 ? consecucionPct * weight : 0

  return {
    indicator_id: indicatorId,
    indicator_code: indicatorCode,
    indicator_name: indicatorName,
    frequency: frequency as IndicatorResult['frequency'],
    weight,
    target_budget: budget,
    actual_result: result,
    logro_pct: logroPct,
    consecucion_pct: consecucionPct,
    points,
    status: calcStatus(logroPct),
  }
}

// ─── Cálculo total ────────────────────────────────────────────────────────────

export interface InputWithRule {
  indicator_id: string
  indicator_code: string
  indicator_name: string
  frequency: string
  weight: number
  target_budget: number
  actual_result: number
  thresholds?: ScoringThresholds
}

export function calcTotalPoints(inputs: InputWithRule[]): {
  total: number
  results: IndicatorResult[]
} {
  let total = 0
  const results: IndicatorResult[] = []

  for (const input of inputs) {
    const r = calcIndicatorResult(
      input.indicator_id,
      input.indicator_code,
      input.indicator_name,
      input.frequency,
      input.weight,
      input.target_budget,
      input.actual_result,
      input.thresholds ?? DEFAULT_SCORING
    )
    total += r.points
    results.push(r)
  }

  return { total, results }
}

// ─── Proyección anual ─────────────────────────────────────────────────────────

/**
 * Proyecta puntos anuales basándose en el promedio de meses con datos.
 * Si el ejecutivo lleva 3 meses capturados, promedia y multiplica × 12.
 */
export function calcProjectedAnnualPoints(
  monthlyPoints: Array<{ month: number; points: number; hasData: boolean }>
): number {
  const withData = monthlyPoints.filter(m => m.hasData)
  if (withData.length === 0) return 0
  const avg = withData.reduce((s, m) => s + m.points, 0) / withData.length
  return avg * 12
}

/**
 * Puntos ecualizados: convierte puntos acumulados a base anual.
 * Ecualizados = (puntos_acumulados / meses_transcurridos) × 12
 */
export function calcEqualizedPoints(
  accumulatedPoints: number,
  monthsWithData: number
): number {
  if (monthsWithData === 0) return 0
  return (accumulatedPoints / monthsWithData) * 12
}

/**
 * Avance porcentual acumulado vs presupuesto.
 */
export function calcBudgetAchievementPct(
  totalResult: number,
  totalBudget: number
): number {
  if (totalBudget <= 0) return 0
  return totalResult / totalBudget
}

// ─── Recuperación de puntos (Anexo B) ─────────────────────────────────────────

/**
 * Recuperación de puntos semestral.
 * Si el logro semestral >= 100%, se reconocen puntos adicionales.
 * Puntos adicionales = max(0, 2×puntos_semestre - suma_trimestres)
 *
 * Fuente: Anexo B, sección 4.
 */
export function calcSemestralRecovery(
  q1Points: number,
  q2Points: number,
  semesterBudget: number,
  semesterResult: number,
  indicatorWeight: number,
  thresholds: ScoringThresholds = DEFAULT_SCORING
): number {
  if (semesterBudget <= 0) return 0
  const semesterLogro = semesterResult / semesterBudget
  if (semesterLogro < 1.0) return 0  // Solo aplica si logro semestral >= 100%

  const semesterCons = calcConsecucion(semesterLogro, thresholds)
  const semesterPoints = semesterCons * indicatorWeight
  const doublePoints = semesterPoints * 2
  const sumQuarters = q1Points + q2Points
  return Math.max(0, doublePoints - sumQuarters)
}

// ─── Helpers de formato ────────────────────────────────────────────────────────

export function formatPct(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatPoints(value: number, decimals = 2): string {
  return value.toFixed(decimals)
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function getMonthName(month: number): string {
  return MONTHS[month - 1] ?? `Mes ${month}`
}
