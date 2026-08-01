'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, FileText, Users, LogOut } from 'lucide-react'

interface SidebarUser {
  id: string
  name?: string | null
  email?: string | null
  role: string
}

interface SidebarProps {
  user: SidebarUser
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  if (email) return email.slice(0, 2).toUpperCase()
  return 'AD'
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

export default function Sidebar({ user }: SidebarProps) {
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
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    {
      href: '/admin/registros',
      label: 'Registros',
      icon: FileText,
      badge: totalRegistros ?? undefined,
    },
    ...(user.role === 'admin'
      ? [{ href: '/admin/usuarios', label: 'Usuarios', icon: Users }]
      : []),
  ]

  function isActive(item: NavItem): boolean {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  async function handleSignOut() {
    await signOut({ redirectTo: '/' })
  }

  return (
    <aside
      className="w-[248px] flex-shrink-0 h-screen sticky top-0 flex flex-col text-white"
      style={{ background: 'linear-gradient(185deg, #00318C, #001348)' }}
    >
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mira-badge.png"
          alt="Mira"
          className="w-[34px] h-[34px] rounded-[9px] flex-shrink-0 object-cover"
          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)' }}
        />
        <div className="leading-tight">
          <p className="text-[13.5px] font-semibold text-white">Mira</p>
          <p className="text-[11px] font-semibold tracking-[0.08em] text-[#A6B0D0]">
            PANEL
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav flex-1 px-3 py-2 space-y-1">
        {items.map((item) => {
          const active = isActive(item)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                'sidebar-item flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-[10px] text-[13.5px] transition-colors duration-150 ' +
                (active
                  ? 'bg-white/[0.11] text-white font-semibold'
                  : 'text-[#A6B0D0] hover:text-white')
              }
            >
              <span className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.8} />
                {item.label}
              </span>
              {item.badge !== undefined && (
                <span className="text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-white/[0.14] text-white">
                  {item.badge.toLocaleString('es-CO')}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer: user */}
      <div className="px-3 pb-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.09)' }}>
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-white/[0.14] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(user.name, user.email)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-white truncate leading-tight">
              {user.name ?? user.email ?? 'Usuario'}
            </p>
            <p className="text-[11px] text-[#A6B0D0] truncate leading-tight">
              {roleLabel(user.role)}
            </p>
          </div>
          <button
            onClick={() => void handleSignOut()}
            aria-label="Cerrar sesión"
            className="p-1.5 rounded-md text-[#A6B0D0] hover:text-white hover:bg-white/[0.11] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/30"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </aside>
  )
}
