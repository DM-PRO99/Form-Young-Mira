'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, FileText, Users, Calendar, GraduationCap, LogOut, X } from 'lucide-react'
import { Avatar } from '@/components/admin/ui'
import { cn } from '@/lib/cn'

export interface SidebarUser {
  id: string
  name?: string | null
  email?: string | null
  role: string
}

function roleLabel(role: string): string {
  if (role === 'admin') return 'Administrador'
  if (role === 'coordinador') return 'Coordinador'
  return role
}

interface NavItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
  exact?: boolean
  badge?: number
}

export default function Sidebar({ user, onClose }: { user: SidebarUser; onClose?: () => void }) {
  const pathname = usePathname()
  const [totalRegistros, setTotalRegistros] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchTotal() {
      try {
        const res = await fetch('/api/admin/dashboard')
        if (!res.ok) return
        const json = (await res.json()) as { total: number }
        if (!cancelled) setTotalRegistros(json.total)
      } catch {
        // el badge simplemente no se muestra si falla
      }
    }
    void fetchTotal()
    function handleRefresh() {
      void fetchTotal()
    }
    window.addEventListener('mira:refresh', handleRefresh)
    return () => {
      cancelled = true
      window.removeEventListener('mira:refresh', handleRefresh)
    }
  }, [])

  const items: NavItem[] = [
    { href: '/admin/dashboard', label: 'Gestión de Juventudes', icon: LayoutDashboard, exact: true },
    { href: '/admin/registros', label: 'Registros', icon: FileText, badge: totalRegistros ?? undefined },
    ...(user.role === 'admin' ? [{ href: '/admin/usuarios', label: 'Usuarios', icon: Users }] : []),
    { href: '/admin/eventos', label: 'Eventos', icon: Calendar },
    { href: '/admin/estudio', label: 'Estudio', icon: GraduationCap },
  ]

  function isActive(item: NavItem): boolean {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  return (
    <div className="relative h-full flex flex-col text-white bg-gradient-to-b from-sidebar-from to-sidebar-to overflow-hidden">
      <div
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(30,86,232,0.45), transparent 70%)' }}
      />
      <div
        className="absolute -bottom-28 -left-20 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(91,63,228,0.35), transparent 70%)' }}
      />
      <div className="relative px-5 pt-6 pb-7 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mira-badge.png" alt="Mira" className="w-[44px] h-[44px] rounded-[12px] flex-shrink-0 object-cover" />
        <div className="leading-tight flex-1 min-w-0">
          <p className="text-[15px] font-extrabold text-white">Mira</p>
          <p className="text-[10.5px] font-bold tracking-[0.12em] text-sidebar-ink">PANEL</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="press p-1.5 -mr-1.5 rounded-[8px] text-sidebar-ink hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/30"
          >
            <X className="w-5 h-5" strokeWidth={1.8} />
          </button>
        )}
      </div>

      <nav className="relative flex-1 overflow-y-auto px-3 space-y-1">
        {items.map((item) => {
          const active = isActive(item)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'sidebar-item flex items-center justify-between gap-2.5 h-11 px-3 rounded-[12px] text-[13.5px]',
                'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/25',
                active ? 'bg-primary text-white font-semibold shadow-[0_8px_18px_-8px_rgba(30,86,232,0.8)]' : 'text-sidebar-ink font-medium'
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.8} />
                {item.label}
              </span>
              {item.badge !== undefined && (
                <span
                  className={cn(
                    'min-w-[28px] h-[22px] px-1.5 rounded-full flex items-center justify-center text-[11px] font-bold tabular-nums',
                    active ? 'bg-white/20 text-white' : 'bg-white/10 text-white'
                  )}
                >
                  {item.badge.toLocaleString('es-CO')}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="relative px-3 pb-5 pt-4 border-t border-white/[0.09]">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <Avatar name={user.name} email={user.email} size="md" className="bg-white/[0.14] text-white" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-white truncate leading-tight">{user.name ?? user.email ?? 'Usuario'}</p>
            <p className="text-[11px] text-sidebar-ink truncate leading-tight">{roleLabel(user.role)}</p>
          </div>
          <button
            onClick={() => void signOut({ redirectTo: '/' })}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="press p-1.5 rounded-[8px] text-sidebar-ink hover:text-white hover:bg-white/[0.11] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/30"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  )
}
