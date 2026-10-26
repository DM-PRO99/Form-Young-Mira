import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

const VARIANT: Record<Variant, string> = {
  primary: 'btn-primary-3d text-white',
  secondary: 'press text-ink bg-white border border-border-input hover:bg-canvas',
  ghost: 'press text-ink-muted hover:text-ink hover:bg-canvas',
  danger: 'press text-white bg-danger hover:brightness-110',
}

const SIZE: Record<Size, string> = {
  sm: 'h-8 px-3 text-[12.5px] gap-1.5',
  md: 'h-10 px-4 text-[13.5px] gap-2',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
}

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', className?: string) =>
  cn(
    'inline-flex items-center justify-center rounded-field font-medium whitespace-nowrap select-none',
    'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20',
    'disabled:opacity-60 disabled:pointer-events-none',
    VARIANT[variant],
    SIZE[size],
    className
  )

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, className, children, disabled, type = 'button', ...props },
  ref
) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} className={buttonClass(variant, size, className)} {...props}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  )
})

export function IconButton({
  label,
  className,
  tone = 'default',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: 'default' | 'danger' }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'press inline-flex items-center justify-center w-8 h-8 rounded-[8px] text-ink-faint',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20',
        'disabled:opacity-30 disabled:pointer-events-none',
        tone === 'danger' ? 'hover:text-danger hover:bg-danger-tint' : 'hover:text-ink hover:bg-canvas',
        className
      )}
      {...props}
    />
  )
}
