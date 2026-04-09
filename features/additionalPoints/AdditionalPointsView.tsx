'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/auth/client'
import { insertAdditionalPoint, deleteAdditionalPoint } from '@/lib/db/queries'
import { MONTHS_ES } from '@/types'
import { Plus, Trash2, Loader2, CheckCircle2, AlertCircle, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile, Period, AdditionalPointEntry } from '@/types'

interface AdditionalPointsViewProps {
  profile: Profile
  period: Period | null
  entries: AdditionalPointEntry[]
  year: number
}

export function AdditionalPointsView({ profile, period, entries: initial, year }: AdditionalPointsViewProps) {
  const [entries, setEntries] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const [form, setForm] = useState({
    month: String(new Date().getMonth() + 1),
    points: '',
    description: '',
  })

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  function handleAdd() {
    if (!period) return
    const pts = parseFloat(form.points)
    if (!pts || !form.description.trim()) return

    startTransition(async () => {
      const supabase = createClient()
      const { data, error } = await insertAdditionalPoint(supabase, {
        user_id:     profile.id,
        period_id:   period.id,
        year,
        month:       parseInt(form.month),
        points:      pts,
        description: form.description.trim(),
      })
      if (!error && data) {
        setEntries(prev => [...prev, data].sort((a, b) => a.month - b.month))
        setForm(prev => ({ ...prev, points: '', description: '' }))
        showToast('success', 'Puntos adicionales registrados.')
      } else {
        showToast('error', 'Error al guardar. Intenta de nuevo.')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await deleteAdditionalPoint(supabase, id)
      if (!error) {
        setEntries(prev => prev.filter(e => e.id !== id))
        showToast('success', 'Registro eliminado.')
      }
    })
  }

  // Totales por mes
  const totalByMonth: Record<number, number> = {}
  for (const e of entries) {
    totalByMonth[e.month] = (totalByMonth[e.month] ?? 0) + e.points
  }
  const grandTotal = entries.reduce((s, e) => s + e.points, 0)

  return (
    <div className="space-y-6 max-w-3xl">

      <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-4">
        <p className="text-sm text-primary font-medium flex items-center gap-2">
          <Star className="w-4 h-4" />
          Registra aquí los puntos adicionales que recibes por criterios de oficina, como
          Sostenibilidad, One Team u otros bonos que no se miden en tus indicadores individuales.
          Estos puntos se suman a tu promedio mensual en el dashboard.
        </p>
      </div>

      {toast && (
        <div className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium',
          toast.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-danger/10 text-danger border border-danger/20'
        )}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Formulario */}
      <div className="bg-white rounded-xl border border-border shadow-card p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Agregar puntos adicionales</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Mes</label>
            <select
              value={form.month}
              onChange={e => setForm(p => ({ ...p, month: e.target.value }))}
              className="input-clean text-sm"
            >
              {MONTHS_ES.map((name, i) => (
                <option key={i + 1} value={String(i + 1)}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Puntos</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.points}
              onChange={e => setForm(p => ({ ...p, points: e.target.value }))}
              className="input-clean text-sm"
              placeholder="ej: 2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Descripción</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="input-clean text-sm"
              placeholder="ej: Sostenibilidad oficina"
            />
          </div>
        </div>
        <button
          onClick={handleAdd}
          disabled={isPending || !form.points || !form.description.trim() || !period}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Agregar
        </button>
        {!period && <p className="text-xs text-warning mt-2">No hay período activo configurado.</p>}
      </div>

      {/* Lista */}
      {entries.length > 0 ? (
        <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary">Registros {year}</h3>
            <span className="text-sm font-bold text-primary">Total: +{grandTotal.toFixed(2)} pts</span>
          </div>
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Mes</th>
                <th className="text-left">Descripción</th>
                <th className="text-right">Puntos</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id}>
                  <td className="font-medium">{MONTHS_ES[e.month - 1]}</td>
                  <td className="text-text-secondary">{e.description}</td>
                  <td className="text-right font-bold text-success tabular-nums">+{e.points.toFixed(2)}</td>
                  <td className="text-center">
                    <button
                      onClick={() => handleDelete(e.id)}
                      disabled={isPending}
                      className="text-text-secondary hover:text-danger transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <Star className="w-8 h-8 text-text-secondary mx-auto mb-2 opacity-30" />
          <p className="text-text-secondary text-sm">No hay puntos adicionales registrados para {year}.</p>
        </div>
      )}
    </div>
  )
}
