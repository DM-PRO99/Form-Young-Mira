'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ConfirmProvider } from '@/components/admin/ui'
import Sidebar, { type SidebarUser } from './Sidebar'
import Topbar from './Topbar'

const EASE_DRAWER = [0.32, 0.72, 0, 1] as const

export default function AdminShell({ user, children }: { user: SidebarUser; children: React.ReactNode }) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!drawerOpen) return
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
    }
  }, [drawerOpen])

  return (
    <ConfirmProvider>
      <div className="flex min-h-screen">
        <aside className="hidden lg:block w-[248px] flex-shrink-0 h-screen sticky top-0">
          <Sidebar user={user} />
        </aside>

        <AnimatePresence>
          {drawerOpen && (
            <div className="lg:hidden fixed inset-0 z-40">
              <motion.div
                className="absolute inset-0 bg-[#0B1430]/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.24 } }}
                exit={{ opacity: 0, transition: { duration: 0.18 } }}
                onClick={() => setDrawerOpen(false)}
              />
              <motion.aside
                role="dialog"
                aria-modal="true"
                aria-label="Menú"
                className="absolute inset-y-0 left-0 w-[272px] max-w-[85vw] shadow-pop"
                initial={reduceMotion ? { opacity: 0 } : { transform: 'translateX(-100%)' }}
                animate={{
                  opacity: 1,
                  transform: 'translateX(0%)',
                  transition: { duration: 0.24, ease: EASE_DRAWER },
                }}
                exit={{
                  opacity: reduceMotion ? 0 : 1,
                  transform: reduceMotion ? 'translateX(0%)' : 'translateX(-100%)',
                  transition: { duration: 0.18, ease: EASE_DRAWER },
                }}
              >
                <Sidebar user={user} onClose={() => setDrawerOpen(false)} />
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col min-w-0">
          <Topbar onOpenMenu={() => setDrawerOpen(true)} />
          <main className="flex-1">
            <div className="max-w-[1240px] mx-auto px-4 md:px-8 pt-5 md:pt-7 pb-12">{children}</div>
          </main>
        </div>
      </div>
    </ConfirmProvider>
  )
}
