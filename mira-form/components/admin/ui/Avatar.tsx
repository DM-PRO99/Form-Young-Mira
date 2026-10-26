import { getInitials } from '@/lib/initials'
import { cn } from '@/lib/cn'

const SIZE = {
  xs: 'w-6 h-6 text-[9.5px]',
  sm: 'w-8 h-8 text-[11px]',
  md: 'w-10 h-10 text-[13px]',
  lg: 'w-14 h-14 text-[17px]',
}

export function Avatar({
  name,
  email,
  size = 'sm',
  className,
}: {
  name?: string | null
  email?: string | null
  size?: keyof typeof SIZE
  className?: string
}) {
  return (
    <span
      title={name ?? email ?? undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-primary-tint text-primary font-semibold flex-shrink-0',
        SIZE[size],
        className
      )}
    >
      {getInitials(name, email)}
    </span>
  )
}
