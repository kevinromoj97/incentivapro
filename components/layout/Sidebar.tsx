'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'
import {
  LayoutDashboard, CalendarDays, TrendingUp, BarChart3, Trophy,
  Users, Upload, Settings, LogOut, ChevronRight, Zap, Star,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  adminOnly?: boolean
  hideForAdmin?: boolean  // solo visible para ejecutivos
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',              href: '/dashboard',                   icon: LayoutDashboard },
  { label: 'Captura Mensual',        href: '/captura',                     icon: CalendarDays },
  { label: 'Ingresos NR',            href: '/ingresos-no-recurrentes',     icon: TrendingUp },
  { label: 'Simulador',              href: '/simulador',                   icon: Zap },
  { label: 'Ranking',                href: '/ranking',                     icon: Trophy },
  { label: 'Cargar Ranking',         href: '/cargar-ranking',              icon: Upload,   hideForAdmin: true },
  { label: 'Puntos Adicionales',     href: '/puntos-adicionales',          icon: Star,     hideForAdmin: true },
  { label: 'Mis Reglas',             href: '/mis-reglas',                  icon: Settings, hideForAdmin: true },
  { label: 'Usuarios',               href: '/admin/usuarios',              icon: Users,    adminOnly: true },
  { label: 'Cargar Ranking',         href: '/admin/ranking',               icon: Upload,   adminOnly: true },
  { label: 'Reglas de Cálculo',      href: '/admin/reglas',                icon: Settings, adminOnly: true },
]

interface SidebarProps {
  profile: Profile | null
  onSignOut: () => void
}

export function Sidebar({ profile, onSignOut }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = profile?.role === 'admin'

  const visibleItems = NAV_ITEMS.filter(item =>
    (!item.adminOnly || isAdmin) && (!item.hideForAdmin || !isAdmin)
  )

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-primary-dark overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <BarChart3 className="w-4 h-4 text-primary-dark" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-none">TuTableroDOR</p>
          <p className="text-white/50 text-xs mt-0.5">DOR 2026</p>
        </div>
      </div>

      {/* Profile */}
      {profile && (
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <span className="text-accent font-bold text-sm">
                {profile.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{profile.full_name}</p>
              <p className="text-white/50 text-xs truncate">
                {profile.position?.name ?? profile.role}
              </p>
            </div>
          </div>
          {isAdmin && (
            <span className="mt-2 inline-block text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium">
              Administrador
            </span>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {!isAdmin && (
          <p className="text-white/30 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
            Mi desempeño
          </p>
        )}
        {!isAdmin && visibleItems.filter(i => !i.adminOnly).map(item => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        {isAdmin && (
          <>
            <p className="text-white/30 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
              Mi desempeño
            </p>
            {visibleItems.filter(i => !i.adminOnly).map(item => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
            <p className="text-white/30 text-xs font-semibold uppercase tracking-wider px-3 mt-4 mb-2">
              Administración
            </p>
            {visibleItems.filter(i => i.adminOnly).map(item => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </>
        )}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={onSignOut}
          className="nav-link w-full text-left text-danger/80 hover:text-danger hover:bg-danger/10"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
  const Icon = item.icon
  return (
    <Link href={item.href} className={cn('nav-link', isActive && 'active')}>
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1">{item.label}</span>
      {isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
    </Link>
  )
}
