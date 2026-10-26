import { cn } from '@/lib/cn'
import { municipioColor } from '@/lib/municipioColors'

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'violet'

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-canvas text-ink-muted border-border',
  primary: 'bg-primary-tint text-primary border-transparent',
  success: 'bg-success-tint text-success border-transparent',
  warning: 'bg-warning-tint text-warning border-transparent',
  danger: 'bg-danger-tint text-danger border-transparent',
  violet: 'bg-violet-tint text-violet border-transparent',
}

const DOT: Record<BadgeTone, string> = {
  neutral: 'bg-ink-faint',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  violet: 'bg-violet',
}

export function Badge({
  tone = 'neutral',
  dot,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; dot?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full border text-[11.5px] font-semibold whitespace-nowrap',
        TONE[tone],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', DOT[tone])} />}
      {children}
    </span>
  )
}

export function MunicipioBadge({ municipio }: { municipio: string }) {
  const colors = municipioColor(municipio)
  return (
    <span
      className="inline-flex items-center h-[22px] px-2 rounded-full text-[11.5px] font-semibold whitespace-nowrap"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {municipio}
    </span>
  )
}
