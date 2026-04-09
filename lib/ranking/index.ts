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

/**
 * Calcula posición proyectada:
 * Ordena todos los participantes por su total_points proyectado y devuelve la posición.
 */
export function calcProjectedRank(
  entries: RankingEntry[],
  myProjectedPoints: number,
  employeeCode: string | null
): number | null {
  if (!entries.length) return null

  // Simulamos el ranking con el total proyectado del ejecutivo actual
  const withProjected = entries.map(e => ({
    code: e.employee_code,
    points: e.employee_code === employeeCode ? myProjectedPoints : e.total_points,
  }))

  // Ordena descendente
  withProjected.sort((a, b) => b.points - a.points)

  const idx = withProjected.findIndex(e => e.code === employeeCode)
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
