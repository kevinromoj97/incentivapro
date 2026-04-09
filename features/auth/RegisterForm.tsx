'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/auth/client'
import { Eye, EyeOff, Loader2, Mail, Lock, User, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Position, League } from '@/types'

interface RegisterFormProps {
  positions: Position[]
  leagues: League[]
}

export function RegisterForm({ positions, leagues }: RegisterFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    employeeCode: '',
    positionId: '',
    leagueId: '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.positionId || !form.leagueId) {
      setError('Selecciona tu puesto y liga.')
      return
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      // 1. Crear usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.fullName } },
      })

      if (authError) {
        setError(authError.message === 'User already registered'
          ? 'Este correo ya está registrado.'
          : 'Error al crear cuenta. Intenta de nuevo.')
        return
      }

      if (!authData.user) {
        setError('No se pudo crear el usuario.')
        return
      }

      // 2. Crear perfil via API route (usa service role, no depende del trigger)
      const res = await fetch('/api/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName:     form.fullName,
          email:        form.email,
          positionId:   form.positionId,
          leagueId:     form.leagueId,
          employeeCode: form.employeeCode,
        }),
      })

      if (!res.ok) {
        setError('Error al guardar tu perfil. Contacta a soporte.')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Ocurrió un error inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">Nombre completo</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text" required
            value={form.fullName}
            onChange={e => set('fullName', e.target.value)}
            className="input-clean pl-9"
            placeholder="Ana García López"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">Correo electrónico</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="email" required
            value={form.email}
            onChange={e => set('email', e.target.value)}
            className="input-clean pl-9"
            placeholder="tu.nombre@bbva.com"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">Contraseña</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type={showPassword ? 'text' : 'password'} required
            value={form.password}
            onChange={e => set('password', e.target.value)}
            className="input-clean pl-9 pr-10"
            placeholder="Mínimo 8 caracteres"
          />
          <button type="button" onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Puesto */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">Puesto</label>
        <select
          required
          value={form.positionId}
          onChange={e => set('positionId', e.target.value)}
          className="input-clean"
        >
          <option value="">Selecciona tu puesto...</option>
          {positions.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Liga */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">Liga</label>
        <select
          required
          value={form.leagueId}
          onChange={e => set('leagueId', e.target.value)}
          className="input-clean"
        >
          <option value="">Selecciona tu liga...</option>
          {leagues.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      {/* Código empleado */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          Código de empleado <span className="text-text-secondary font-normal">(opcional)</span>
        </label>
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            value={form.employeeCode}
            onChange={e => set('employeeCode', e.target.value)}
            className="input-clean pl-9"
            placeholder="EMP-001"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-danger/8 border border-danger/20 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <button
        type="submit" disabled={loading}
        className={cn(
          'w-full flex items-center justify-center gap-2 bg-primary text-white rounded-lg py-3 font-semibold text-sm transition-all mt-2',
          loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-dark active:scale-[0.99]'
        )}
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando cuenta...</> : 'Crear cuenta'}
      </button>
    </form>
  )
}
