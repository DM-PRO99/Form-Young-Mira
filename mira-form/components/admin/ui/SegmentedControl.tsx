'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useId } from 'react'
import { cn } from '@/lib/cn'

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: React.ReactNode }[]
  className?: string
}) {
  const layoutId = useId()
  const reduceMotion = useReducedMotion()
  return (
    <div role="tablist" className={cn('inline-flex p-0.5 rounded-field bg-canvas border border-border', className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative h-8 px-3 text-[12.5px] font-medium rounded-[8px] transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20',
              active ? 'text-ink' : 'text-ink-muted hover:text-ink'
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={reduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.3, bounce: 0 }}
                className="absolute inset-0 rounded-[8px] bg-white shadow-card border border-border"
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
