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

  const sections: { title: string; items: NavItem[] }[] = [
    {
      title: 'Juventudes',
      items: [
        { href: '/admin/dashboard', label: 'Resumen', icon: LayoutDashboard, exact: true },
        { href: '/admin/registros', label: 'Registros', icon: FileText, badge: totalRegistros ?? undefined },
        { href: '/admin/eventos', label: 'Eventos', icon: Calendar },
        { href: '/admin/estudio', label: 'Estudio', icon: GraduationCap },
      ],
    },
    ...(user.role === 'admin'
      ? [{ title: 'Administración', items: [{ href: '/admin/usuarios', label: 'Usuarios', icon: Users }] }]
      : []),
  ]

  function isActive(item: NavItem): boolean {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  return (
    <div className="h-full flex flex-col text-white bg-gradient-to-b from-sidebar-from to-sidebar-to">
      <div className="px-5 pt-6 pb-6 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mira-badge.png"
          alt="Mira"
          className="w-[34px] h-[34px] rounded-[9px] flex-shrink-0 object-cover"
          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)' }}
        />
        <div className="leading-tight flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-white">Mira</p>
          <p className="text-[10.5px] font-semibold tracking-[0.1em] text-sidebar-ink">PANEL JUVENTUDES</p>
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

      <nav className="flex-1 overflow-y-auto px-3 space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-1.5 text-[10.5px] font-semibold tracking-[0.1em] uppercase text-sidebar-ink/70">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'sidebar-item relative flex items-center justify-between gap-2.5 h-10 px-3 rounded-[10px] text-[13.5px]',
                      'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/25',
                      active ? 'bg-white/[0.11] text-white font-semibold' : 'text-sidebar-ink'
                    )}
                  >
                    {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-white" />}
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-[17px] h-[17px] flex-shrink-0" strokeWidth={1.8} />
                      {item.label}
                    </span>
                    {item.badge !== undefined && (
                      <span className="text-[11px] font-medium tabular-nums text-sidebar-ink">
                        {item.badge.toLocaleString('es-CO')}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 pb-5 pt-4 border-t border-white/[0.09]">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <Avatar name={user.name} email={user.email} className="bg-white/[0.14] text-white" />
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
