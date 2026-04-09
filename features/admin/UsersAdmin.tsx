'use client'

import { useState, useTransition } from 'react'
import { createUserAction } from './actions'
import { MONTHS_ES } from '@/types'
import { cn, formatCurrency } from '@/lib/utils'
import { Plus, Users, CheckCircle2, AlertCircle, Loader2, User } from 'lucide-react'
import type { Profile, Position, League } from '@/types'

interface UsersAdminProps {
  profiles: Profile[]
  positions: Position[]
  leagues: League[]
}

interface NewUserForm {
  email: string
  password: string
  full_name: string
  employee_code: string
  role: string
  position_id: string
  league_id: string
}

const EMPTY_FORM: NewUserForm = {
  email: '', password: '', full_name: '', employee_code: '',
  role: 'ejecutivo', position_id: '', league_id: '',
}

export function UsersAdmin({ profiles, positions, leagues }: UsersAdminProps) {
  const [allProfiles, setAllProfiles] = useState(profiles)
  const [form, setForm] = useState<NewUserForm>(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  function setField(k: keyof NewUserForm, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await createUserAction(form)
      if (result.error) {
        setToast({ type: 'error', msg: result.error })
      } else {
        setToast({ type: 'success', msg: `Usuario ${form.full_name} creado correctamente.` })
        setForm(EMPTY_FORM)
        setShowForm(false)
        // Refrescar lista en cliente (simplificado)
        if (result.profile) setAllProfiles(p => [...p, result.profile!])
      }
      setTimeout(() => setToast(null), 4000)
    })
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-primary text-white rounded-xl p-5">
          <p className="text-xs text-white/70 font-medium uppercase tracking-wider mb-1">Total usuarios</p>
          <p className="text-3xl font-bold">{allProfiles.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 shadow-card">
          <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-1">Ejecutivos</p>
          <p className="text-3xl font-bold text-text-primary">{allProfiles.filter(p => p.role === 'ejecutivo').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 shadow-card">
          <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-1">Administradores</p>
          <p className="text-3xl font-bold text-text-primary">{allProfiles.filter(p => p.role === 'admin').length}</p>
        </div>
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

      {/* Add user button */}
      <div className="flex justify-between items-center">
        <h2 className="text-base font-semibold text-text-primary">Usuarios del sistema</h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Crear usuario
        </button>
      </div>

      {/* Create user form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-border shadow-card p-6">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Nuevo usuario</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Nombre completo *</label>
              <input type="text" required value={form.full_name} onChange={e => setField('full_name', e.target.value)} className="input-clean text-sm" placeholder="Nombre Apellido" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Correo *</label>
              <input type="email" required value={form.email} onChange={e => setField('email', e.target.value)} className="input-clean text-sm" placeholder="usuario@bbva.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Contraseña *</label>
              <input type="password" required minLength={6} value={form.password} onChange={e => setField('password', e.target.value)} className="input-clean text-sm" placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Código empleado</label>
              <input type="text" value={form.employee_code} onChange={e => setField('employee_code', e.target.value)} className="input-clean text-sm" placeholder="EMP-001" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Rol *</label>
              <select required value={form.role} onChange={e => setField('role', e.target.value)} className="input-clean text-sm">
                <option value="ejecutivo">Ejecutivo</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Puesto</label>
              <select value={form.position_id} onChange={e => setField('position_id', e.target.value)} className="input-clean text-sm">
                <option value="">Sin asignar</option>
                {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Liga</label>
              <select value={form.league_id} onChange={e => setField('league_id', e.target.value)} className="input-clean text-sm">
                <option value="">Sin asignar</option>
                {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-3 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-text-secondary border border-border hover:bg-muted transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={isPending} className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Crear
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users table */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th className="text-left">Usuario</th>
              <th className="text-left hidden md:table-cell">Puesto</th>
              <th className="text-left hidden lg:table-cell">Liga</th>
              <th className="text-center">Rol</th>
              <th className="text-center">Activo</th>
            </tr>
          </thead>
          <tbody>
            {allProfiles.map(p => (
              <tr key={p.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold text-sm">{p.full_name?.charAt(0) ?? '?'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{p.full_name}</p>
                      <p className="text-xs text-text-secondary">{p.email}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden md:table-cell text-sm text-text-secondary">{(p as any).position?.name ?? '—'}</td>
                <td className="hidden lg:table-cell text-sm text-text-secondary">{(p as any).league?.name ?? '—'}</td>
                <td className="text-center">
                  <span className={cn(
                    'inline-block px-2.5 py-0.5 rounded-full text-xs font-medium',
                    p.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                  )}>
                    {p.role === 'admin' ? 'Admin' : 'Ejecutivo'}
                  </span>
                </td>
                <td className="text-center">
                  <span className={cn('w-2 h-2 rounded-full inline-block', p.is_active ? 'bg-success' : 'bg-danger')} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
