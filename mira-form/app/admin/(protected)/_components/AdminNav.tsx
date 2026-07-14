'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { LogOut, ChevronDown } from 'lucide-react'

interface AdminNavUser {
  id: string
  name?: string | null
  email?: string | null
  role: string
  municipios?: string[]
}

interface AdminNavProps {
  user: AdminNavUser
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  if (email) {
    return email.slice(0, 2).toUpperCase()
  }
  return 'AD'
}

function roleLabel(role: string): string {
  if (role === 'admin') return 'Administrador'
  if (role === 'coordinador') return 'Coordinador'
  return role
}

interface NavTab {
  href: string
  label: string
  exact?: boolean
}

export default function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const tabs: NavTab[] = [
    { href: '/admin/dashboard', label: 'Dashboard', exact: true },
    { href: '/admin/registros', label: 'Registros' },
    ...(user.role === 'admin'
      ? [{ href: '/admin/usuarios', label: 'Usuarios' }]
      : []),
  ]

  function isActive(tab: NavTab): boolean {
    if (tab.exact) return pathname === tab.href
    return pathname.startsWith(tab.href)
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    setDropdownOpen(false)
    await signOut({ redirectTo: '/' })
  }

  return (
    <nav className="bg-white border-b border-zinc-200 px-6 h-14 flex items-center justify-between sticky top-0 z-40">
      {/* Left: brand + tabs */}
      <div className="flex items-center gap-6">
        <span className="text-sm font-semibold text-zinc-800">
          Mira <span className="text-zinc-400">·</span> Panel
        </span>

        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={
                'text-sm px-3 py-1.5 rounded-md font-medium transition-colors duration-150 ' +
                (isActive(tab)
                  ? 'bg-[#EEF2FD] text-[#1E3A9E]'
                  : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100')
              }
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Right: user chip */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-zinc-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#1E3A9E]/20"
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
        >
          <div className="w-8 h-8 bg-[#1E3A9E] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(user.name, user.email)}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-zinc-800 leading-tight">
              {user.name ?? user.email ?? 'Usuario'}
            </p>
            <p className="text-xs text-zinc-400 leading-tight">
              {roleLabel(user.role)}
            </p>
          </div>
          <ChevronDown
            className={
              'w-4 h-4 text-zinc-400 transition-transform duration-150 ' +
              (dropdownOpen ? 'rotate-180' : '')
            }
          />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl border border-zinc-200 shadow-lg py-1 z-50">
            <div className="px-3 py-2 border-b border-zinc-100">
              <p className="text-xs font-medium text-zinc-800 truncate">
                {user.name ?? 'Usuario'}
              </p>
              <p className="text-xs text-zinc-400 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors duration-150"
            >
              <LogOut className="w-4 h-4 text-zinc-400" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
