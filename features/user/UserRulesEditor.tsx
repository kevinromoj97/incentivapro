'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/auth/client'
import { upsertUserScoringRule, deleteUserScoringRule } from '@/lib/db/queries'
import { cn } from '@/lib/utils'
import { Save, Loader2, CheckCircle2, RotateCcw, Pencil, Settings } from 'lucide-react'
import type { ScoringRule, Profile, Position } from '@/types'

interface UserRulesEditorProps {
  profile: Profile
  globalRules: ScoringRule[]
  userRules: ScoringRule[]
}

// Fila combinada: override personal si existe, global si no
interface MergedRule {
  global: ScoringRule
  override: ScoringRule | null
  active: ScoringRule   // el que se aplica
}

export function UserRulesEditor({ profile, globalRules, userRules }: UserRulesEditorProps) {
  const [overrides, setOverrides] = useState<Record<string, ScoringRule>>(
    Object.fromEntries(userRules.map(r => [r.indicator_id, r]))
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<ScoringRule>>({})
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<string | null>(null)

  const merged: MergedRule[] = globalRules.map(global => {
    const override = overrides[global.indicator_id] ?? null
    return { global, override, active: override ?? global }
  })

  function startEdit(rule: ScoringRule) {
    setEditingId(rule.indicator_id)
    const active = overrides[rule.indicator_id] ?? rule
    const effectiveFrequency = (active.config_json?.frequency as string) || active.indicator?.frequency || global_freq(rule)
    setEditValues({
      weight:      active.weight,
      min_logro:   active.min_logro,
      ppto_logro:  active.ppto_logro,
      max_logro:   active.max_logro,
      min_cons:    active.min_cons,
      ppto_cons:   active.ppto_cons,
      max_cons:    active.max_cons,
      config_json: { ...(active.config_json ?? {}), frequency: effectiveFrequency },
    })
  }

  function global_freq(rule: ScoringRule) {
    return rule.indicator?.frequency ?? 'mensual'
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValues({})
  }

  async function saveEdit(globalRule: ScoringRule) {
    startTransition(async () => {
      const supabase = createClient()
      const { data, error } = await upsertUserScoringRule(supabase, profile.id, {
        indicator_id: globalRule.indicator_id,
        position_id:  globalRule.position_id,
        ...editValues,
        config_json: editValues.config_json ?? null,
      })
      if (!error && data) {
        setOverrides(prev => ({ ...prev, [globalRule.indicator_id]: data }))
        showToast('Regla personalizada guardada.')
      }
      setEditingId(null)
    })
  }

  async function resetRule(override: ScoringRule) {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await deleteUserScoringRule(supabase, override.id)
      if (!error) {
        setOverrides(prev => {
          const next = { ...prev }
          delete next[override.indicator_id]
          return next
        })
        showToast('Regla restablecida al valor global.')
      }
    })
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
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

  if (globalRules.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border p-12 text-center text-text-secondary text-sm">
        No hay reglas globales configuradas para tu puesto.
        Contacta al administrador.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-4">
        <p className="text-sm text-primary font-medium flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Puedes personalizar los umbrales y pesos de cada indicador. Tus cambios solo afectan
          tus propios cálculos, no los de otros ejecutivos. Usa &quot;Restablecer&quot; para volver al
          valor global configurado por el administrador.
        </p>
      </div>

      {toast && (
        <div className="flex items-center gap-2 text-success text-sm">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}

      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table min-w-[900px]">
            <thead>
              <tr>
                <th className="text-left">Indicador / Periodicidad</th>
                <th className="text-right">Peso</th>
                <th className="text-right">Logro Mín %</th>
                <th className="text-right">Logro Ppto %</th>
                <th className="text-right">Logro Máx %</th>
                <th className="text-right">Cons Mín %</th>
                <th className="text-right">Cons Ppto %</th>
                <th className="text-right">Cons Máx %</th>
                <th className="w-32 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {merged.map(({ global, override, active }) => {
                const isEditing = editingId === global.indicator_id
                const isCustom = override !== null

                return (
                  <tr key={global.indicator_id} className={cn(isCustom && 'bg-accent/3')}>
                    <td>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-text-primary">
                            {global.indicator?.name ?? global.indicator_id}
                          </span>
                          {isCustom && (
                            <span className="text-[10px] bg-accent/20 text-accent-dark px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                              Personalizada
                            </span>
                          )}
                        </div>
                        {isEditing ? (
                          <select
                            value={(editValues.config_json?.frequency as string) || global.indicator?.frequency || 'mensual'}
                            onChange={e => setEditValues(prev => ({
                              ...prev,
                              config_json: { ...(prev.config_json ?? {}), frequency: e.target.value },
                            }))}
                            className="input-clean text-xs py-1 w-36"
                          >
                            <option value="mensual">Mensual</option>
                            <option value="trimestral">Trimestral</option>
                            <option value="semestral">Semestral</option>
                            <option value="anual">Anual</option>
                          </select>
                        ) : (
                          <span className={cn(
                            'text-xs capitalize',
                            (override?.config_json?.frequency && override.config_json.frequency !== global.indicator?.frequency)
                              ? 'text-accent-dark font-semibold'
                              : 'text-text-secondary'
                          )}>
                            {(active.config_json?.frequency as string) || active.indicator?.frequency}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-right tabular-nums">
                      {isEditing ? field('weight') : <span className="font-bold text-primary">{active.weight}</span>}
                    </td>
                    <td className="text-right tabular-nums text-sm text-text-secondary">
                      {isEditing ? field('min_logro', 'pct') : `${(active.min_logro * 100).toFixed(0)}%`}
                    </td>
                    <td className="text-right tabular-nums text-sm text-text-secondary">
                      {isEditing ? field('ppto_logro', 'pct') : `${(active.ppto_logro * 100).toFixed(0)}%`}
                    </td>
                    <td className="text-right tabular-nums text-sm text-text-secondary">
                      {isEditing ? field('max_logro', 'pct') : `${(active.max_logro * 100).toFixed(0)}%`}
                    </td>
                    <td className="text-right tabular-nums text-sm text-text-secondary">
                      {isEditing ? field('min_cons', 'pct') : `${(active.min_cons * 100).toFixed(0)}%`}
                    </td>
                    <td className="text-right tabular-nums text-sm font-medium text-primary">
                      {isEditing ? field('ppto_cons', 'pct') : `${(active.ppto_cons * 100).toFixed(0)}%`}
                    </td>
                    <td className="text-right tabular-nums text-sm text-text-secondary">
                      {isEditing ? field('max_cons', 'pct') : `${(active.max_cons * 100).toFixed(0)}%`}
                    </td>
                    <td className="text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => saveEdit(global)}
                            disabled={isPending}
                            className="flex items-center gap-1 bg-primary text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                          >
                            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            Guardar
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-xs text-text-secondary hover:text-text-primary px-2 py-1.5 rounded-lg hover:bg-muted"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => startEdit(global)}
                            className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                          >
                            <Pencil className="w-3 h-3" /> Editar
                          </button>
                          {isCustom && override && (
                            <button
                              onClick={() => resetRule(override)}
                              disabled={isPending}
                              title="Restablecer al valor global"
                              className="flex items-center gap-1 text-xs text-text-secondary hover:text-danger font-medium"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
