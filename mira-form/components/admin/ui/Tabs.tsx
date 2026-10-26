'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useId } from 'react'
import { cn } from '@/lib/cn'

export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
  className,
}: {
  value: T
  onChange: (value: T) => void
  tabs: { value: T; label: React.ReactNode; icon?: React.ComponentType<{ className?: string; strokeWidth?: number }> }[]
  className?: string
}) {
  const layoutId = useId()
  const reduceMotion = useReducedMotion()
  return (
    <div className={cn('-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto border-b border-border', className)}>
      <div role="tablist" className="flex items-center gap-5 min-w-max">
        {tabs.map((t) => {
          const active = t.value === value
          const Icon = t.icon
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(t.value)}
              className={cn(
                'relative flex items-center gap-1.5 pb-3 pt-1 text-[13.5px] font-medium transition-colors duration-150',
                'focus-visible:outline-none focus-visible:text-primary',
                active ? 'text-primary' : 'text-ink-muted hover:text-ink'
              )}
            >
              {Icon && <Icon className="w-4 h-4" strokeWidth={1.8} />}
              {t.label}
              {active && (
                <motion.span
                  layoutId={layoutId}
                  transition={reduceMotion ? { duration: 0 } : { type: 'spring', duration: 0.3, bounce: 0 }}
                  className="absolute left-0 right-0 -bottom-px h-[2px] bg-primary rounded-full"
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
