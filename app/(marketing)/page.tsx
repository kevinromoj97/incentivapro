import Link from 'next/link'
import {
  BarChart3, TrendingUp, Trophy, Zap, Shield, Users,
  CalendarDays, ArrowRight, CheckCircle2, Target, LineChart,
  Building2, Globe, Lock, ChevronRight, LayoutDashboard,
} from 'lucide-react'

// ─── Landing Page ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <LandingNav />
      <HeroSection />
      <BenefitsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TrustSection />
      <CTASection />
      <LandingFooter />
    </div>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function LandingNav() {
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-primary text-lg">Tablero DOR</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
          <a href="#beneficios" className="hover:text-primary transition-colors">Beneficios</a>
          <a href="#funcionalidades" className="hover:text-primary transition-colors">Funcionalidades</a>
          <a href="#como-funciona" className="hover:text-primary transition-colors">Cómo funciona</a>
        </div>
        <Link
          href="/login"
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          Iniciar sesión
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-primary-light">
      {/* Grid decoration */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
      />
      {/* Blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-white/80 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Plataforma DOR 2026 — Red BEI
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              Controla tu
              <span className="block text-accent">desempeño.</span>
              Proyecta tu ranking.
            </h1>
            <p className="text-lg text-white/75 leading-relaxed mb-8 max-w-lg">
              La plataforma interna que reemplaza Excel. Captura, calcula y proyecta
              tus puntos DOR en tiempo real — con toda la lógica del manual de
              incentivos programada dentro del sistema.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 bg-white text-primary px-7 py-3.5 rounded-xl font-bold text-base hover:bg-gray-50 transition-all shadow-lg shadow-black/10"
              >
                Acceder a la plataforma
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#funcionalidades"
                className="flex items-center justify-center gap-2 bg-white/10 text-white px-7 py-3.5 rounded-xl font-semibold text-base hover:bg-white/20 transition-all border border-white/20"
              >
                Ver funcionalidades
              </a>
            </div>
            {/* Trust signals */}
            <div className="flex flex-wrap gap-6 mt-10 pt-10 border-t border-white/15">
              {[
                { value: '100%', label: 'Lógica DOR 2026' },
                { value: 'RLS', label: 'Seguridad por usuario' },
                { value: '0 Excel', label: 'Cálculo automático' },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-2xl font-bold text-white">{item.value}</p>
                  <p className="text-xs text-white/60 font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="hidden lg:block">
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  )
}

function DashboardMockup() {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-1 shadow-2xl border border-white/20">
      <div className="bg-white rounded-xl overflow-hidden shadow-xl">
        {/* Mock header */}
        <div className="bg-primary-dark px-4 py-3 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-white/20" />
            <div className="w-3 h-3 rounded-full bg-white/20" />
            <div className="w-3 h-3 rounded-full bg-white/20" />
          </div>
          <div className="flex-1 mx-4 bg-white/10 rounded-md h-5" />
        </div>
        {/* Mock content */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Puntos Actuales', value: '87.4', color: 'bg-primary/10 text-primary' },
              { label: 'Proyectados', value: '102.1', color: 'bg-success/10 text-success' },
              { label: 'Posición', value: '#14', color: 'bg-accent/10 text-accent' },
            ].map(card => (
              <div key={card.label} className={`rounded-lg p-3 ${card.color}`}>
                <p className="text-[10px] font-medium opacity-70">{card.label}</p>
                <p className="text-xl font-bold">{card.value}</p>
              </div>
            ))}
          </div>
          {/* Mock chart bars */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] text-gray-500 mb-2 font-medium">Puntos por mes</p>
            <div className="flex items-end gap-1 h-16">
              {[60, 75, 90, 85, 95, 88, 72, 80, 95, 100, 88, 75].map((h, i) => (
                <div key={i} className="flex-1 rounded-t" style={{
                  height: `${h}%`,
                  backgroundColor: i < 4 ? '#004481' : '#E5E7EB',
                }} />
              ))}
            </div>
            <div className="flex gap-1 mt-1">
              {['E','F','M','A','M','J','J','A','S','O','N','D'].map(m => (
                <p key={m} className="flex-1 text-center text-[8px] text-gray-400">{m}</p>
              ))}
            </div>
          </div>
          {/* Mock indicator rows */}
          <div className="space-y-1.5">
            {[
              { name: 'INF Recurrentes', pct: 95, status: 'bg-success' },
              { name: 'Vista MN',        pct: 88, status: 'bg-warning' },
              { name: 'Cartera',         pct: 73, status: 'bg-danger'  },
            ].map(row => (
              <div key={row.name} className="flex items-center gap-2">
                <p className="text-[10px] text-gray-600 w-28 truncate">{row.name}</p>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div className={`h-full rounded-full ${row.status}`} style={{ width: `${row.pct}%` }} />
                </div>
                <p className="text-[10px] font-medium text-gray-500 w-8 text-right">{row.pct}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Benefits ─────────────────────────────────────────────────────────────────

function BenefitsSection() {
  const benefits = [
    {
      icon: CalendarDays,
      title: 'Captura simple',
      description: 'Solo introduces presupuesto y logro mensual. El sistema calcula todo automáticamente.',
    },
    {
      icon: BarChart3,
      title: 'Cálculo automático',
      description: 'Todos los puntos DOR, consecuciones y ponderaciones calculados con la lógica del manual 2026.',
    },
    {
      icon: Trophy,
      title: 'Proyección de ranking',
      description: 'Visualiza tu posición actual y proyectada en el ranking nacional en tiempo real.',
    },
    {
      icon: Zap,
      title: 'Simulador de escenarios',
      description: 'Simula distintos logros y ve cómo impactan tus puntos y posición antes de comprometerte.',
    },
    {
      icon: Users,
      title: 'Administración centralizada',
      description: 'El admin gestiona usuarios, puestos, ligas y sube el ranking sin depender de hojas de cálculo.',
    },
    {
      icon: Shield,
      title: 'Datos seguros y persistentes',
      description: 'Cada ejecutivo ve solo sus datos. Todo queda guardado en base de datos con seguridad RLS.',
    },
  ]

  return (
    <section id="beneficios" className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-accent font-semibold text-sm uppercase tracking-wider mb-3">Por qué Tablero DOR</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-text-primary mb-4">
            Diseñado para tu equipo comercial
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Una sola plataforma que reemplaza Excel, centraliza la lógica y da visibilidad
            instantánea a cada ejecutivo.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map(b => (
            <div key={b.title} className="bg-white rounded-xl p-6 border border-gray-100 shadow-card hover:shadow-card-hover transition-shadow duration-200">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <b.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">{b.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────

function FeaturesSection() {
  const features = [
    { icon: LayoutDashboard2, title: 'Dashboard ejecutivo', description: 'KPIs, gráficas mensuales, semáforos y alertas visuales en una sola vista.' },
    { icon: CalendarDays,    title: 'Captura mensual',      description: 'Tabla editable con presupuesto y logro por indicador, para cada mes del año.' },
    { icon: TrendingUp,      title: 'Ingresos No Recurrentes', description: 'Registro detallado por cliente y concepto, sumado automáticamente al cálculo de INF NR.' },
    { icon: Trophy,          title: 'Ranking nacional',     description: 'Tabla completa importada por el admin, con tu posición resaltada y comparación proyectada.' },
    { icon: Zap,             title: 'Simulador',            description: 'Cambia números en tiempo real y ve cómo impactan tus puntos y ranking — sin afectar datos oficiales.' },
    { icon: Shield,          title: 'Panel de administración', description: 'Gestión de usuarios, carga de ranking Excel/CSV y edición de reglas de cálculo.' },
  ]

  return (
    <section id="funcionalidades" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-accent font-semibold text-sm uppercase tracking-wider mb-3">Módulos</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-text-primary mb-4">
            Todo lo que necesitas, en un solo lugar
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            6 módulos diseñados para el flujo de trabajo real de los ejecutivos de la Red BEI.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={f.title} className="group flex gap-4 p-5 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/2 transition-all duration-200 cursor-default">
              <div className="w-10 h-10 rounded-xl bg-primary/8 group-hover:bg-primary/15 flex items-center justify-center shrink-0 transition-colors">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-text-primary text-sm">{f.title}</h3>
                  <span className="text-[10px] text-text-secondary bg-muted px-1.5 py-0.5 rounded font-medium">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <p className="text-text-secondary text-xs leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// placeholder icon
function LayoutDashboard2(props: React.SVGProps<SVGSVGElement>) {
  return <LayoutDashboard {...props} />
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorksSection() {
  const steps = [
    { n: '01', title: 'El admin crea tu usuario', desc: 'Asigna nombre, puesto, liga y correo. Tú recibes acceso con contraseña.' },
    { n: '02', title: 'Inicia sesión', desc: 'Accede con tu correo y contraseña. La plataforma reconoce tu perfil y configuración.' },
    { n: '03', title: 'Captura tus datos', desc: 'Ingresa presupuesto y logro por mes. Agrega ingresos no recurrentes si aplica.' },
    { n: '04', title: 'Ve tus resultados', desc: 'Puntos calculados, posición en ranking y proyección anual actualizada automáticamente.' },
  ]

  return (
    <section id="como-funciona" className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-accent font-semibold text-sm uppercase tracking-wider mb-3">Proceso</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-text-primary mb-4">
            Tan simple como 4 pasos
          </h2>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.n} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(100%-1rem)] w-full h-0.5 bg-gradient-to-r from-primary/40 to-transparent z-10" />
              )}
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-card h-full">
                <div className="text-4xl font-black text-primary/15 mb-3">{s.n}</div>
                <h3 className="font-semibold text-text-primary mb-2 text-sm">{s.title}</h3>
                <p className="text-text-secondary text-xs leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Trust ────────────────────────────────────────────────────────────────────

function TrustSection() {
  const features = [
    'Lógica del Manual DOR 2026 v3 programada',
    'Row Level Security — cada usuario solo ve sus datos',
    'Base de datos Postgres en Supabase Cloud',
    'Autenticación segura con Supabase Auth',
    'Deploy en Vercel con URL estable',
    'Interfaz completamente en español',
  ]

  return (
    <section className="py-20 md:py-28 bg-primary-dark">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-accent font-semibold text-sm uppercase tracking-wider mb-4">Confianza corporativa</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6 leading-tight">
              Construida para el estándar de la banca empresarial
            </h2>
            <p className="text-white/65 text-lg leading-relaxed mb-8">
              Tablero DOR reemplaza el proceso manual con una plataforma robusta, segura
              y lista para escalar. Sin hojas de cálculo, sin fórmulas expuestas,
              sin dependencias externas para el cálculo.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-accent text-primary-dark px-6 py-3 rounded-lg font-bold text-sm hover:bg-accent/90 transition-colors"
            >
              Acceder ahora <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {features.map(f => (
              <div key={f} className="flex items-center gap-3 bg-white/5 rounded-xl px-5 py-4 border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                <p className="text-white/85 text-sm font-medium">{f}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-text-primary mb-4">
          Listo para tomar el control de tu desempeño
        </h2>
        <p className="text-text-secondary text-lg mb-8 leading-relaxed">
          Accede con tu usuario y contraseña. Tus datos, tus puntos
          y tu ranking — siempre disponibles.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25"
        >
          Iniciar sesión
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function LandingFooter() {
  return (
    <footer className="bg-gray-950 text-white/60 py-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white">Tablero DOR</span>
            <span className="text-white/30">DOR 2026</span>
          </div>
          <div className="flex items-center gap-8 text-sm">
            <Link href="/login" className="hover:text-white transition-colors">Acceso</Link>
            <a href="mailto:kevin.romo@bbva.com" className="hover:text-white transition-colors">Soporte</a>
          </div>
          <div className="text-sm text-center space-y-1">
            <p>© {new Date().getFullYear()} Tablero DOR. Uso interno.</p>
            <p className="text-white/40">Made by Kevin Romo Jester</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
