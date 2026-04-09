'use client'

import { cn } from '@/lib/utils'
import { formatPoints } from '@/lib/calculations'
import { MONTHS_ES } from '@/types'
import type { IndicatorResult } from '@/types'

interface MatrixIndicator {
  id: string
  name: string
  frequency: string
  weight: number
}

interface IndicatorMatrixProps {
  title: string
  indicators: MatrixIndicator[]
  // indicatorId → month → points
  matrix: Record<string, Record<number, number>>
  currentMonth: number
  monthsWithData: number[]
}

function pointsColor(points: number, weight: number): string {
  if (weight === 0) return ''
  const pct = points / weight
  if (pct >= 1.0) return 'bg-success/15 text-success font-semibold'
  if (pct >= 0.9) return 'bg-warning/15 text-warning font-semibold'
  if (pct > 0)    return 'bg-danger/10 text-danger'
  return 'text-text-secondary'
}

export function IndicatorMatrix({ title, indicators, matrix, currentMonth, monthsWithData }: IndicatorMatrixProps) {
  if (indicators.length === 0) return null

  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
      <div className="px-5 py-3 bg-primary/5 border-b border-border">
        <h3 className="text-sm font-bold text-primary uppercase tracking-wide">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-xs">
          <thead>
            <tr className="bg-muted border-b border-border">
              <th className="text-left py-2.5 px-4 font-semibold text-text-secondary uppercase tracking-wider w-44">Indicador</th>
              <th className="text-center py-2.5 px-2 font-semibold text-text-secondary w-10">Peso</th>
              {months.map(m => (
                <th
                  key={m}
                  className={cn(
                    'text-center py-2.5 px-1.5 font-semibold text-text-secondary w-14',
                    m === currentMonth && 'text-primary bg-primary/5'
                  )}
                >
                  {MONTHS_ES[m - 1].slice(0, 3)}
                </th>
              ))}
              <th className="text-center py-2.5 px-3 font-semibold text-text-secondary w-16">Total</th>
            </tr>
          </thead>
          <tbody>
            {indicators.map(ind => {
              const monthPoints = matrix[ind.id] ?? {}
              const total = Object.values(monthPoints).reduce((s, p) => s + p, 0)
              return (
                <tr key={ind.id} className="border-b border-border/60 last:border-0 hover:bg-gray-50/50">
                  <td className="py-2 px-4">
                    <div className="font-medium text-text-primary leading-tight">{ind.name}</div>
                    <div className="text-[10px] text-text-secondary capitalize mt-0.5">{ind.frequency}</div>
                  </td>
                  <td className="text-center py-2 px-2 font-bold text-primary">{ind.weight}</td>
                  {months.map(m => {
                    const pts = monthPoints[m]
                    const hasData = monthsWithData.includes(m)
                    return (
                      <td key={m} className={cn(
                        'text-center py-2 px-1',
                        m === currentMonth && 'bg-primary/3'
                      )}>
                        {pts !== undefined ? (
                          <span className={cn(
                            'inline-block w-full text-center tabular-nums rounded px-0.5',
                            pointsColor(pts, ind.weight)
                          )}>
                            {pts.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-border">—</span>
                        )}
                      </td>
                    )
                  })}
                  <td className="text-center py-2 px-3 font-bold text-primary tabular-nums">
                    {total > 0 ? total.toFixed(1) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-primary/5 border-t-2 border-primary/20">
              <td className="py-2.5 px-4 font-bold text-text-primary text-xs uppercase" colSpan={2}>Total mes</td>
              {months.map(m => {
                const monthTotal = indicators.reduce((s, ind) => s + (matrix[ind.id]?.[m] ?? 0), 0)
                const hasData = monthsWithData.includes(m)
                return (
                  <td key={m} className={cn(
                    'text-center py-2.5 px-1 font-bold tabular-nums',
                    m === currentMonth && 'bg-primary/5',
                    hasData ? 'text-primary' : 'text-border'
                  )}>
                    {hasData ? monthTotal.toFixed(1) : '—'}
                  </td>
                )
              })}
              <td className="text-center py-2.5 px-3 font-bold text-primary tabular-nums">
                {indicators.reduce((s, ind) => s + Object.values(matrix[ind.id] ?? {}).reduce((a, b) => a + b, 0), 0).toFixed(1)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
