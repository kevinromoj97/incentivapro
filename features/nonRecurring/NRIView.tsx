'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/auth/client'
import { insertNRI, deleteNRI } from '@/lib/db/queries'
import { MONTHS_ES } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Plus, Trash2, Loader2, CheckCircle2, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile, NonRecurringIncomeEntry, Period } from '@/types'

interface NRIViewProps {
  profile: Profile
  period: Period | null
  entries: NonRecurringIncomeEntry[]
  year: number
}

interface NewEntry {
  month: string
  client_name: string
  concept: string
  amount: string
  notes: string
}

const EMPTY_FORM: NewEntry = { month: '', client_name: '', concept: '', amount: '', notes: '' }

export function NRIView({ profile, period, entries: initialEntries, year }: NRIViewProps) {
  const [entries, setEntries] = useState(initialEntries)
  const [form, setForm] = useState<NewEntry>(EMPTY_FORM)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Agrupar por mes
  const byMonth: Record<number, NonRecurringIncomeEntry[]> = {}
  for (const e of entries) {
    if (!byMonth[e.month]) byMonth[e.month] = []
    byMonth[e.month].push(e)
  }
  const monthsWithEntries = Object.keys(byMonth).map(Number).sort((a, b) => a - b)
  const totalAnual = entries.reduce((s, e) => s + e.amount, 0)

  function setField(field: keyof NewEntry, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!period || !form.month || !form.client_name || !form.concept || !form.amount) return

    startTransition(async () => {
      const supabase = createClient()
      const { data, error } = await insertNRI(supabase, {
        user_id:     profile.id,
        period_id:   period.id,
        year,
        month:       parseInt(form.month),
        client_name: form.client_name.trim(),
        concept:     form.concept.trim(),
        amount:      parseFloat(form.amount) || 0,
        notes:       form.notes.trim() || null,
      })
      if (!error && data) {
        setEntries(prev => [...prev, data])
        setForm(EMPTY_FORM)
        setToast('Ingreso agregado correctamente.')
        setTimeout(() => setToast(null), 3000)
      }
    })
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const supabase = createClient()
    await deleteNRI(supabase, id)
    setEntries(prev => prev.filter(e => e.id !== id))
    setDeletingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-primary text-white rounded-xl p-5">
          <p className="text-xs text-white/70 font-semibold uppercase tracking-wider mb-1">Total Anual INF NR</p>
          <p className="text-2xl font-bold tabular-nums">{formatCurrency(totalAnual)}</p>
          <p className="text-xs text-white/60 mt-1">{entries.length} registros</p>
        </div>
        {monthsWithEntries.slice(0, 3).map(m => (
          <div key={m} className="bg-white rounded-xl p-5 border border-border shadow-card">
            <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-1">{MONTHS_ES[m - 1]}</p>
            <p className="text-xl font-bold text-text-primary tabular-nums">
              {formatCurrency(byMonth[m].reduce((s, e) => s + e.amount, 0))}
            </p>
            <p className="text-xs text-text-secondary mt-1">{byMonth[m].length} registros</p>
          </div>
        ))}
      </div>

      {/* Add form */}
      <div className="bg-white rounded-xl border border-border shadow-card p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Agregar ingreso no recurrente
        </h3>
        <form onSubmit={handleAdd} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Mes *</label>
            <select
              required
              value={form.month}
              onChange={e => setField('month', e.target.value)}
              className="input-clean text-sm"
            >
              <option value="">Seleccionar</option>
              {MONTHS_ES.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-text-secondary mb-1">Cliente *</label>
            <input
              type="text" required value={form.client_name}
              onChange={e => setField('client_name', e.target.value)}
              className="input-clean text-sm" placeholder="Nombre del cliente"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Concepto *</label>
            <input
              type="text" required value={form.concept}
              onChange={e => setField('concept', e.target.value)}
              className="input-clean text-sm" placeholder="Tipo de ingreso"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Importe *</label>
            <input
              type="number" required min="0" step="any" value={form.amount}
              onChange={e => setField('amount', e.target.value)}
              className="input-clean text-sm" placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Notas</label>
            <input
              type="text" value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              className="input-clean text-sm" placeholder="Opcional"
            />
          </div>
          <div className="flex items-end lg:col-span-6">
            <button
              type="submit" disabled={isPending}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Agregar
            </button>
          </div>
        </form>
        {toast && (
          <div className="mt-3 flex items-center gap-2 text-success text-sm">
            <CheckCircle2 className="w-4 h-4" /> {toast}
          </div>
        )}
      </div>

      {/* Entries by month */}
      {monthsWithEntries.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <TrendingUp className="w-10 h-10 text-text-secondary mx-auto mb-3 opacity-40" />
          <h3 className="font-semibold text-text-primary mb-1">Sin ingresos no recurrentes</h3>
          <p className="text-text-secondary text-sm">Agrega tu primer registro con el formulario de arriba.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {monthsWithEntries.map(m => {
            const monthEntries = byMonth[m]
            const monthTotal = monthEntries.reduce((s, e) => s + e.amount, 0)
            return (
              <div key={m} className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-border">
                  <h3 className="text-sm font-semibold text-text-primary">{MONTHS_ES[m - 1]}</h3>
                  <span className="text-sm font-bold text-primary">{formatCurrency(monthTotal)}</span>
                </div>
                <table className="w-full data-table">
                  <thead>
                    <tr>
                      <th className="text-left">Cliente</th>
                      <th className="text-left">Concepto</th>
                      <th className="text-right">Importe</th>
                      <th className="text-left hidden md:table-cell">Notas</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {monthEntries.map(entry => (
                      <tr key={entry.id}>
                        <td className="font-medium text-sm text-text-primary">{entry.client_name}</td>
                        <td className="text-sm text-text-secondary">{entry.concept}</td>
                        <td className="text-right tabular-nums text-sm font-semibold text-text-primary">{formatCurrency(entry.amount)}</td>
                        <td className="text-sm text-text-secondary hidden md:table-cell">{entry.notes ?? '—'}</td>
                        <td>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            disabled={deletingId === entry.id}
                            className="p-1.5 rounded text-text-secondary hover:text-danger hover:bg-danger/8 transition-colors"
                          >
                            {deletingId === entry.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />
                            }
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
