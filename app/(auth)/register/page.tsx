import { RegisterForm } from '@/features/auth/RegisterForm'
import { createClient } from '@/lib/auth/server'
import { getPositions, getLeagues } from '@/lib/db/queries'
import { BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default async function RegisterPage() {
  const supabase = createClient()
  const [{ data: positions }, { data: leagues }] = await Promise.all([
    getPositions(supabase),
    getLeagues(supabase),
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-primary to-primary-light flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl">Tablero DOR</span>
        </Link>
        <div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Crea tu cuenta<br />
            <span className="text-accent">en minutos.</span>
          </h1>
          <p className="text-white/65 text-lg leading-relaxed max-w-md">
            Selecciona tu puesto y liga para que el sistema configure automáticamente
            tus indicadores y reglas de cálculo DOR 2026.
          </p>
        </div>
        <p className="text-white/30 text-xs">
          © {new Date().getFullYear()} Tablero DOR — Uso interno. Acceso restringido.
        </p>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-primary text-lg">Tablero DOR</span>
          </div>

          <div className="bg-white rounded-2xl shadow-modal p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-text-primary mb-1">Crear cuenta</h2>
            <p className="text-text-secondary text-sm mb-6">
              Completa tu información para acceder a la plataforma.
            </p>
            <RegisterForm positions={positions ?? []} leagues={leagues ?? []} />
          </div>

          <p className="text-center text-xs text-text-secondary mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
