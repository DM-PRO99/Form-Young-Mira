import { cn } from '@/lib/cn'

export function Card({
  className,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn('bg-surface rounded-card border border-border shadow-card', interactive && 'kpi-card', className)}
      {...props}
    />
  )
}

export function CardHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 px-5 py-4 border-b border-border', className)}>
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold text-ink leading-tight">{title}</h3>
        {description && <p className="text-[12.5px] text-ink-muted mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Eyebrow({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em]', className)} {...props} />
}
