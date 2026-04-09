/**
 * Lógica de ranking — posición actual y proyectada
 */

import type { RankingEntry } from '@/types'

/** Obtiene la posición actual de un ejecutivo en el ranking */
export function findCurrentRank(
  entries: RankingEntry[],
  employeeCode: string | null,
  employeeName?: string
): number | null {
  if (!entries.length) return null

  const entry = entries.find(e => {
    if (employeeCode && e.employee_code === employeeCode) return true
    if (employeeName && e.employee_name.toLowerCase().includes(employeeName.toLowerCase())) return true
    return false
  })

  return entry?.rank_position ?? null
}

const MONTH_COLS: (keyof RankingEntry)[] = [
  'jan_pts','feb_pts','mar_pts','apr_pts','may_pts','jun_pts',
  'jul_pts','aug_pts','sep_pts','oct_pts','nov_pts','dec_pts',
]

/** Promedio mensual de un competidor basado en sus meses con puntos > 0 */
function competitorMonthlyAvg(entry: RankingEntry): number {
  const monthPts = MONTH_COLS.map(k => entry[k] as number | null)
  const captured = monthPts.filter(v => v != null && v > 0) as number[]
  if (!captured.length) return entry.total_points  // fallback si no hay desglose
  return captured.reduce((s, v) => s + v, 0) / captured.length
}

/** Devuelve true si la entrada corresponde al usuario, evitando match null===null */
function isMyEntry(e: RankingEntry, employeeCode: string | null, employeeName: string | null): boolean {
  if (employeeCode && e.employee_code) return e.employee_code === employeeCode
  if (employeeName) return e.employee_name.toLowerCase().includes(employeeName.toLowerCase())
  return false
}

/**
 * Calcula posición proyectada comparando promedios mensuales.
 * Usa nombre como fallback cuando employee_code es null en el ranking.
 */
export function calcProjectedRank(
  entries: RankingEntry[],
  myMonthlyAvg: number,
  employeeCode: string | null,
  employeeName?: string | null
): number | null {
  if (!entries.length) return null

  const withProjected = entries.map(e => ({
    isMe: isMyEntry(e, employeeCode, employeeName ?? null),
    avg: competitorMonthlyAvg(e),
  })).map(e => ({ ...e, avg: e.isMe ? myMonthlyAvg : e.avg }))

  withProjected.sort((a, b) => b.avg - a.avg)

  const idx = withProjected.findIndex(e => e.isMe)
  return idx >= 0 ? idx + 1 : null
}

/**
 * Clasifica el ranking mostrando los N primeros y la fila del usuario resaltada.
 */
export function paginateRanking(
  entries: RankingEntry[],
  employeeCode: string | null,
  pageSize = 20,
  page = 1
): {
  rows: RankingEntry[]
  userEntry: RankingEntry | null
  totalPages: number
} {
  const sorted = [...entries].sort((a, b) => a.rank_position - b.rank_position)
  const totalPages = Math.ceil(sorted.length / pageSize)
  const start = (page - 1) * pageSize
  const rows = sorted.slice(start, start + pageSize)
  const userEntry = employeeCode
    ? sorted.find(e => e.employee_code === employeeCode) ?? null
    : null

  return { rows, userEntry, totalPages }
}

/** Delta de posición (+N subió, -N bajó) */
export function rankDelta(current: number | null, projected: number | null): number | null {
  if (current === null || projected === null) return null
  return current - projected  // número menor = mejor posición
}
