import { cn } from '@/lib/utils'

type Status = 'success' | 'warning' | 'danger' | 'neutral'

interface StatusBadgeProps {
  status: Status
  label?: string
  className?: string
}

const styles: Record<Status, string> = {
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger:  'bg-danger/10  text-danger  border-danger/20',
  neutral: 'bg-muted text-text-secondary border-border',
}

const dots: Record<Status, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger:  'bg-danger',
  neutral: 'bg-text-secondary',
}

const defaultLabels: Record<Status, string> = {
  success: 'En meta',
  warning: 'En seguimiento',
  danger:  'Bajo meta',
  neutral: 'Sin datos',
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
      styles[status], className
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', dots[status])} />
      {label ?? defaultLabels[status]}
    </span>
  )
}

export function logroToStatus(logroPct: number): Status {
  if (logroPct >= 1.0) return 'success'
  if (logroPct >= 0.9) return 'warning'
  if (logroPct > 0)    return 'danger'
  return 'neutral'
}
