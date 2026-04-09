'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/auth/client'
import { upsertScoringRule } from '@/lib/db/queries'
import { formatPct } from '@/lib/calculations'
import { cn } from '@/lib/utils'
import { Save, Loader2, CheckCircle2, Settings } from 'lucide-react'
import type { ScoringRule, Position } from '@/types'

interface RulesEditorProps {
  rules: ScoringRule[]
  positions: Position[]
}

export function RulesEditor({ rules: initialRules, positions }: RulesEditorProps) {
  const [rules, setRules] = useState(initialRules)
  const [selectedPosition, setSelectedPosition] = useState(positions[0]?.id ?? '')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<ScoringRule>>({})
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<string | null>(null)

  const positionRules = rules.filter(r => r.position_id === selectedPosition)

  function startEdit(rule: ScoringRule) {
    setEditingId(rule.id)
    setEditValues({
      weight:     rule.weight,
      min_logro:  rule.min_logro,
      ppto_logro: rule.ppto_logro,
      max_logro:  rule.max_logro,
      min_cons:   rule.min_cons,
      ppto_cons:  rule.ppto_cons,
      max_cons:   rule.max_cons,
    })
  }

  async function saveEdit(rule: ScoringRule) {
    startTransition(async () => {
      const supabase = createClient()
      const { data, error } = await upsertScoringRule(supabase, { ...rule, ...editValues })
      if (!error && data) {
        setRules(prev => prev.map(r => r.id === rule.id ? { ...r, ...editValues } : r))
        setToast('Regla actualizada.')
        setTimeout(() => setToast(null), 3000)
      }
      setEditingId(null)
    })
  }

  function field(k: keyof ScoringRule, type: 'number' | 'pct' = 'number') {
    const val = editValues[k]
    const display = type === 'pct' && typeof val === 'number' ? (val * 100).toFixed(0) : String(val ?? '')
    return (
      <input
        type="number" step="any"
        value={display}
        onChange={e => {
          const parsed = parseFloat(e.target.value)
          setEditValues(prev => ({ ...prev, [k]: type === 'pct' ? parsed / 100 : parsed }))
        }}
        className="input-clean text-right tabular-nums text-sm w-20"
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-4">
        <p className="text-sm text-primary font-medium flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Las reglas de cálculo controlan cómo se convierten los logros en puntos para cada indicador y puesto.
          Los cambios se aplican a los siguientes cálculos.
        </p>
      </div>

      {/* Position selector */}
      <div className="flex flex-wrap gap-2">
        {positions.map(pos => (
          <button
            key={pos.id}
            onClick={() => setSelectedPosition(pos.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
              selectedPosition === pos.id
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-text-secondary border-border hover:border-primary/40'
            )}
          >
            {pos.name}
          </button>
        ))}
      </div>

      {toast && (
        <div className="flex items-center gap-2 text-success text-sm">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}

      {positionRules.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center text-text-secondary text-sm">
          No hay reglas configuradas para este puesto.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full data-table min-w-[900px]">
              <thead>
                <tr>
                  <th className="text-left">Indicador</th>
                  <th className="text-left hidden sm:table-cell">Periodicidad</th>
                  <th className="text-right">Peso</th>
                  <th className="text-right">Logro Mín %</th>
                  <th className="text-right">Logro Ppto %</th>
                  <th className="text-right">Logro Máx %</th>
                  <th className="text-right">Cons Mín %</th>
                  <th className="text-right">Cons Ppto %</th>
                  <th className="text-right">Cons Máx %</th>
                  <th className="w-24 text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {positionRules.map(rule => {
                  const isEditing = editingId === rule.id
                  return (
                    <tr key={rule.id}>
                      <td className="font-medium text-sm text-text-primary">{rule.indicator?.name ?? rule.indicator_id}</td>
                      <td className="hidden sm:table-cell text-xs text-text-secondary capitalize">{rule.indicator?.frequency}</td>
                      <td className="text-right tabular-nums">
                        {isEditing ? field('weight') : <span className="font-bold text-primary">{rule.weight}</span>}
                      </td>
                      <td className="text-right tabular-nums text-sm text-text-secondary">
                        {isEditing ? field('min_logro', 'pct') : `${(rule.min_logro * 100).toFixed(0)}%`}
                      </td>
                      <td className="text-right tabular-nums text-sm text-text-secondary">
                        {isEditing ? field('ppto_logro', 'pct') : `${(rule.ppto_logro * 100).toFixed(0)}%`}
                      </td>
                      <td className="text-right tabular-nums text-sm text-text-secondary">
                        {isEditing ? field('max_logro', 'pct') : `${(rule.max_logro * 100).toFixed(0)}%`}
                      </td>
                      <td className="text-right tabular-nums text-sm text-text-secondary">
                        {isEditing ? field('min_cons', 'pct') : `${(rule.min_cons * 100).toFixed(0)}%`}
                      </td>
                      <td className="text-right tabular-nums text-sm font-medium text-primary">
                        {isEditing ? field('ppto_cons', 'pct') : `${(rule.ppto_cons * 100).toFixed(0)}%`}
                      </td>
                      <td className="text-right tabular-nums text-sm text-text-secondary">
                        {isEditing ? field('max_cons', 'pct') : `${(rule.max_cons * 100).toFixed(0)}%`}
                      </td>
                      <td className="text-center">
                        {isEditing ? (
                          <button
                            onClick={() => saveEdit(rule)}
                            disabled={isPending}
                            className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-semibold mx-auto"
                          >
                            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            Guardar
                          </button>
                        ) : (
                          <button
                            onClick={() => startEdit(rule)}
                            className="text-xs text-primary font-medium hover:underline"
                          >
                            Editar
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
