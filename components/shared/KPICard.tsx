'use client'

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: { value: number; label: string }
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'primary'
  className?: string
}

const variantStyles = {
  default:  'border-border',
  primary:  'border-primary/30 bg-primary text-white',
  success:  'border-success/30 bg-success/5',
  warning:  'border-warning/30 bg-warning/5',
  danger:   'border-danger/30 bg-danger/5',
}

const iconStyles = {
  default:  'bg-primary/10 text-primary',
  primary:  'bg-white/20 text-white',
  success:  'bg-success/15 text-success',
  warning:  'bg-warning/15 text-warning',
  danger:   'bg-danger/15 text-danger',
}

export function KPICard({
  title, value, subtitle, icon: Icon, trend, variant = 'default', className,
}: KPICardProps) {
  return (
    <div className={cn('kpi-card border', variantStyles[variant], className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-xs font-semibold uppercase tracking-wider mb-1',
            variant === 'primary' ? 'text-white/70' : 'text-text-secondary'
          )}>
            {title}
          </p>
          <p className={cn(
            'text-2xl font-bold tabular-nums leading-tight',
            variant === 'primary' ? 'text-white' : 'text-text-primary'
          )}>
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              'text-xs mt-1',
              variant === 'primary' ? 'text-white/60' : 'text-text-secondary'
            )}>
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn('p-2.5 rounded-lg shrink-0', iconStyles[variant])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span className={cn(
            'text-xs font-medium',
            trend.value >= 0 ? 'text-success' : 'text-danger'
          )}>
            {trend.value >= 0 ? '+' : ''}{trend.value}
          </span>
          <span className={cn(
            'text-xs',
            variant === 'primary' ? 'text-white/60' : 'text-text-secondary'
          )}>
            {trend.label}
          </span>
        </div>
      )}
    </div>
  )
}
