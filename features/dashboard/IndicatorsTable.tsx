'use client'

import { StatusBadge, logroToStatus } from '@/components/shared/StatusBadge'
import { formatPct, formatPoints, formatCurrency } from '@/lib/utils'
import type { IndicatorResult } from '@/types'

interface IndicatorsTableProps {
  results: IndicatorResult[]
}

export function IndicatorsTable({ results }: IndicatorsTableProps) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
      <table className="w-full data-table">
        <thead>
          <tr>
            <th className="text-left">Indicador</th>
            <th className="text-left hidden sm:table-cell">Periodicidad</th>
            <th className="text-right">Ppto</th>
            <th className="text-right">Logro</th>
            <th className="text-right">Consecución</th>
            <th className="text-right">Peso</th>
            <th className="text-right">Puntos</th>
            <th className="text-center">Estatus</th>
          </tr>
        </thead>
        <tbody>
          {results.map(r => (
            <tr key={r.indicator_id}>
              <td>
                <span className="font-medium text-text-primary text-sm">{r.indicator_name}</span>
              </td>
              <td className="hidden sm:table-cell">
                <span className="text-xs text-text-secondary capitalize">{r.frequency}</span>
              </td>
              <td className="text-right tabular-nums text-sm text-text-secondary">
                {r.target_budget > 0 ? formatCurrency(r.target_budget) : '—'}
              </td>
              <td className="text-right tabular-nums text-sm text-text-primary">
                {r.actual_result > 0 ? formatCurrency(r.actual_result) : '—'}
              </td>
              <td className="text-right tabular-nums text-sm font-medium">
                <span className={
                  r.consecucion_pct >= 1.0 ? 'text-success' :
                  r.consecucion_pct >= 0.5 ? 'text-warning' : 'text-danger'
                }>
                  {formatPct(r.consecucion_pct)}
                </span>
              </td>
              <td className="text-right tabular-nums text-sm text-text-secondary">
                {r.weight}
              </td>
              <td className="text-right tabular-nums text-sm font-semibold text-text-primary">
                {formatPoints(r.points)}
              </td>
              <td className="text-center">
                <StatusBadge status={logroToStatus(r.logro_pct)} />
              </td>
            </tr>
          ))}
          {/* Total row */}
          <tr className="bg-primary/5 font-semibold">
            <td colSpan={6} className="text-right text-sm text-text-primary">Total</td>
            <td className="text-right tabular-nums text-sm font-bold text-primary">
              {formatPoints(results.reduce((s, r) => s + r.points, 0))}
            </td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  )
}
