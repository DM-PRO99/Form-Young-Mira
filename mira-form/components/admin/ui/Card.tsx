import { cn } from '@/lib/cn'

export type Tone = 'primary' | 'success' | 'violet' | 'warning' | 'danger' | 'neutral'

const TILE: Record<Tone, string> = {
  primary: 'bg-primary-tint text-primary',
  success: 'bg-success-tint text-success',
  violet: 'bg-violet-tint text-violet',
  warning: 'bg-warning-tint text-warning',
  danger: 'bg-danger-tint text-danger',
  neutral: 'bg-canvas text-ink-muted',
}

const ACCENT: Record<Tone, string> = {
  primary: 'before:bg-primary',
  success: 'before:bg-success',
  violet: 'before:bg-violet',
  warning: 'before:bg-warning',
  danger: 'before:bg-danger',
  neutral: 'before:bg-border-input',
}

type IconType = React.ComponentType<{ className?: string; strokeWidth?: number }>

export function IconTile({ icon: Icon, tone = 'primary', size = 'md', className }: { icon: IconType; tone?: Tone; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center flex-shrink-0',
        size === 'sm' && 'w-8 h-8 rounded-[9px]',
        size === 'md' && 'w-10 h-10 rounded-[11px]',
        size === 'lg' && 'w-12 h-12 rounded-[13px]',
        TILE[tone],
        className
      )}
    >
      <Icon className={size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4'} strokeWidth={1.8} />
    </span>
  )
}

export function Card({
  className,
  interactive,
  accent,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean; accent?: Tone }) {
  return (
    <div
      className={cn(
        'bg-surface rounded-card border border-border shadow-card',
        interactive && 'kpi-card',
        accent && 'relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px]',
        accent && ACCENT[accent],
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({
  title,
  description,
  actions,
  icon,
  tone = 'primary',
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  icon?: IconType
  tone?: Tone
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border', className)}>
      <div className="flex items-center gap-3 min-w-0">
        {icon && <IconTile icon={icon} tone={tone} size="sm" />}
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold text-ink leading-tight">{title}</h3>
          {description && <p className="text-[12.5px] text-ink-muted mt-0.5">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Eyebrow({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-[11px] font-bold text-ink-faint uppercase tracking-[0.08em]', className)} {...props} />
}

export function KpiCard({
  label,
  icon,
  tone = 'primary',
  value,
  aside,
  children,
  className,
}: {
  label: React.ReactNode
  icon: IconType
  tone?: Tone
  value: React.ReactNode
  aside?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  return (
    <Card interactive accent={tone} className={cn('p-5', className)}>
      <div className="flex items-center gap-3 mb-4">
        <IconTile icon={icon} tone={tone} />
        <p className="text-[13px] font-semibold text-ink leading-tight">{label}</p>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[32px] font-extrabold tabular-nums text-ink leading-none tracking-[-0.03em] truncate">{value}</p>
          {children && <div className="mt-2.5 text-[12px] text-ink-muted">{children}</div>}
        </div>
        {aside && <div className="flex-shrink-0">{aside}</div>}
      </div>
    </Card>
  )
}
