'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

const EASE_OUT = [0.23, 1, 0.32, 1] as const

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const focusable = panelRef.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-close])')
    ;(focusable ?? panelRef.current)?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previouslyFocused?.focus?.()
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            className="absolute inset-0 bg-[#0B1430]/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className={cn(
              'relative w-full bg-surface rounded-t-[18px] sm:rounded-section shadow-pop outline-none max-h-[90vh] flex flex-col',
              size === 'sm' && 'sm:max-w-sm',
              size === 'md' && 'sm:max-w-md',
              size === 'lg' && 'sm:max-w-xl'
            )}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.96) translateY(8px)' }}
            animate={{
              opacity: 1,
              transform: 'scale(1) translateY(0px)',
              transition: { duration: 0.2, ease: EASE_OUT },
            }}
            exit={{
              opacity: 0,
              transform: reduceMotion ? 'scale(1) translateY(0px)' : 'scale(0.97) translateY(4px)',
              transition: { duration: 0.15, ease: EASE_OUT },
            }}
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
              <div className="min-w-0">
                <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
                {description && <p className="text-[13px] text-ink-muted mt-1">{description}</p>}
              </div>
              <button
                type="button"
                data-close
                aria-label="Cerrar"
                onClick={onClose}
                className="press -mr-1.5 p-1.5 rounded-[8px] text-ink-faint hover:text-ink hover:bg-canvas focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
              >
                <X className="w-4 h-4" strokeWidth={1.8} />
              </button>
            </div>
            {children && <div className="px-6 pb-5 overflow-y-auto">{children}</div>}
            {footer && (
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-6 py-4 border-t border-border bg-surface-muted rounded-b-section">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
