import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/cn'

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-primary mb-3 transition-colors duration-150"
    >
      <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.8} />
      {children}
    </Link>
  )
}

export function PageHeader({
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
    <div className={cn('flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5', className)}>
      <div className="min-w-0">
        <h2 className="text-[22px] font-extrabold text-ink leading-tight tracking-[-0.015em]">{title}</h2>
        {description && <p className="text-[13px] text-ink-muted mt-1">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
