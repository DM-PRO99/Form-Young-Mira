import { cn } from '@/lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('bg-zinc-100 rounded animate-pulse', className)} />
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('px-6 py-14 text-center', className)}>
      {Icon && (
        <div className="w-11 h-11 rounded-full bg-primary-tint flex items-center justify-center mx-auto mb-3.5">
          <Icon className="w-5 h-5 text-primary" strokeWidth={1.7} />
        </div>
      )}
      <p className="text-[14.5px] font-semibold text-ink">{title}</p>
      {description && <p className="text-[13px] text-ink-muted mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-[13.5px] text-ink-muted mb-3">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="press text-[13px] font-medium text-primary hover:underline">
          Reintentar
        </button>
      )}
    </div>
  )
}
