import { LoginForm } from '@/features/auth/LoginForm'
import { BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-primary to-primary-light flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl">Tablero DOR</span>
        </Link>

        <div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Tu desempeño,<br />
            <span className="text-accent">siempre a la mano.</span>
          </h1>
          <p className="text-white/65 text-lg leading-relaxed max-w-md">
            Plataforma interna para el seguimiento de incentivos, puntos DOR
            y ranking de la Red Empresas e Instituciones.
          </p>

          <div className="mt-10 space-y-4">
            {[
              'Lógica DOR 2026 programada',
              'Datos persistentes por usuario',
              'Ranking nacional en tiempo real',
              'Simulador de escenarios',
            ].map(f => (
              <div key={f} className="flex items-center gap-3 text-white/80 text-sm">
                <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/30 text-xs">
          © {new Date().getFullYear()} Tablero DOR — Uso interno. Acceso restringido.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-primary text-lg">Tablero DOR</span>
          </div>

          <div className="bg-white rounded-2xl shadow-modal p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-text-primary mb-1">Bienvenido</h2>
            <p className="text-text-secondary text-sm mb-8">
              Ingresa tus credenciales para acceder a tu plataforma.
            </p>
            <LoginForm />
          </div>

          <p className="text-center text-xs text-text-secondary mt-6">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Regístrate aquí
            </Link>
          </p>
          <p className="text-center text-xs text-text-secondary mt-2">
            ¿Problemas para acceder?{' '}
            <a href="mailto:kevin.romo@bbva.com" className="text-primary font-medium hover:underline">
              Contacta a soporte
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
