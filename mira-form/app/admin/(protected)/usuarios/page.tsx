'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  UserPlus,
  MoreHorizontal,
  X,
  Loader2,
  Eye,
  EyeOff,
  KeyRound,
  UserCheck,
  UserX,
  Plus,
  Download,
} from 'lucide-react'

interface AdminUser {
  _id: string
  email: string
  nombre: string
  role: 'admin' | 'coordinador'
  municipios: string[]
  activo: boolean
  createdAt: string
  updatedAt: string
}

const ALL_MUNICIPIOS = [
  'Itagüí',
  'Sabaneta',
  'San Antonio de Prado',
  'La Estrella',
  'Medellín',
]

function getInitials(nombre: string, email: string): string {
  if (nombre) {
    const parts = nombre.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return nombre.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function roleBadge(role: 'admin' | 'coordinador') {
  if (role === 'admin') {
    return (
      <span
        className="px-2 py-0.5 rounded-full text-xs font-medium"
        style={{ backgroundColor: '#F4EFFB', color: '#5B3E9E' }}
      >
        Administrador
      </span>
    )
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-tint text-primary">
      Coordinador
    </span>
  )
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void
  onCreated: (user: AdminUser) => void
}

function CreateModal({ onClose, onCreated }: CreateModalProps) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [selectedMunicipios, setSelectedMunicipios] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)

  function toggleMunicipio(m: string) {
    setSelectedMunicipios((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setFieldError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    setFieldError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          nombre,
          municipios: selectedMunicipios,
        }),
      })
      if (!res.ok) {
        const body = (await res.json()) as { message?: string }
        throw new Error(body.message ?? 'Error al crear usuario')
      }
      const json = (await res.json()) as { data: AdminUser }
      toast.success('Coordinador creado correctamente')
      onCreated(json.data)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo crear el usuario'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
        className="relative bg-surface rounded-section shadow-xl w-full max-w-md z-10 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-ink">Crear coordinador</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-ink-faint hover:text-ink hover:bg-canvas transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
          >
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-4">
          {fieldError && <p className="text-sm text-danger">{fieldError}</p>}

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Nombre completo
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-border-input rounded-field outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.16] transition-[border-color,box-shadow] duration-150"
              placeholder="Nombre del coordinador"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-border-input rounded-field outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.16] transition-[border-color,box-shadow] duration-150"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 text-sm border border-border-input rounded-field outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.16] transition-[border-color,box-shadow] duration-150"
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20 rounded"
                aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" strokeWidth={1.8} />
                ) : (
                  <Eye className="w-4 h-4" strokeWidth={1.8} />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Municipios asignados
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_MUNICIPIOS.map((m) => (
                <label key={m} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedMunicipios.includes(m)}
                    onChange={() => toggleMunicipio(m)}
                    className="w-4 h-4 rounded border-border-input accent-primary"
                  />
                  <span className="text-sm text-ink">{m}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 text-sm border border-border-input bg-white rounded-field font-medium text-ink hover:bg-canvas transition duration-150 active:scale-[0.97] disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary-3d flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-white rounded-field font-medium disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" strokeWidth={1.8} />
              )}
              Crear
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────

interface ResetPasswordModalProps {
  user: AdminUser
  onClose: () => void
}

function ResetPasswordModal({ user, onClose }: ResetPasswordModalProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setFieldError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setFieldError('Las contraseñas no coinciden.')
      return
    }
    setFieldError(null)
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${user._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) throw new Error('Error al resetear contraseña')
      toast.success('Contraseña actualizada correctamente')
      onClose()
    } catch {
      toast.error('No se pudo actualizar la contraseña')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
        className="relative bg-surface rounded-section shadow-xl w-full max-w-sm z-10 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-ink">Resetear contraseña</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-ink-faint hover:text-ink hover:bg-canvas transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
          >
            <X className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-4">
          <p className="text-sm text-ink-muted">
            Nueva contraseña para{' '}
            <span className="font-medium text-ink">{user.nombre}</span>
          </p>
          {fieldError && <p className="text-sm text-danger">{fieldError}</p>}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 text-sm border border-border-input rounded-field outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.16] transition-[border-color,box-shadow] duration-150"
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20 rounded"
              >
                {showPw ? (
                  <EyeOff className="w-4 h-4" strokeWidth={1.8} />
                ) : (
                  <Eye className="w-4 h-4" strokeWidth={1.8} />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Confirmar contraseña
            </label>
            <input
              type={showPw ? 'text' : 'password'}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-border-input rounded-field outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.16] transition-[border-color,box-shadow] duration-150"
              placeholder="Repite la contraseña"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 text-sm border border-border-input bg-white rounded-field font-medium text-ink hover:bg-canvas transition duration-150 active:scale-[0.97] disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary-3d flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-white rounded-field font-medium disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4" strokeWidth={1.8} />
              )}
              Guardar
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Municipio Popover ────────────────────────────────────────────────────────

interface MunicipioPopoverProps {
  userId: string
  currentMunicipios: string[]
  onUpdated: (updated: AdminUser) => void
}

function MunicipioPopover({ userId, currentMunicipios, onUpdated }: MunicipioPopoverProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>(currentMunicipios)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSelected(currentMunicipios)
  }, [currentMunicipios])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleToggle(m: string) {
    const next = selected.includes(m)
      ? selected.filter((x) => x !== m)
      : [...selected, m]
    setSelected(next)
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ municipios: next }),
      })
      if (!res.ok) throw new Error('Error')
      const json = (await res.json()) as { data: AdminUser }
      onUpdated(json.data)
    } catch {
      setSelected(currentMunicipios)
      toast.error('No se pudo actualizar los municipios')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs border border-dashed border-border-input text-ink-muted px-2 py-0.5 rounded-full hover:border-primary hover:text-primary transition-colors duration-150"
      >
        <Plus className="w-3 h-3" strokeWidth={1.8} />
        Municipio
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="absolute left-0 top-7 z-20 w-48 bg-surface border border-border rounded-card shadow-elevated py-2"
          >
            {saving && (
              <div className="flex items-center justify-center py-1">
                <Loader2 className="w-3 h-3 animate-spin text-ink-faint" />
              </div>
            )}
            {ALL_MUNICIPIOS.map((m) => (
              <label
                key={m}
                className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-canvas transition-colors duration-100"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(m)}
                  onChange={() => void handleToggle(m)}
                  className="w-4 h-4 rounded border-border-input accent-primary"
                />
                <span className="text-sm text-ink">{m}</span>
              </label>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── User Row Menu ────────────────────────────────────────────────────────────

interface UserRowMenuProps {
  user: AdminUser
  onResetPassword: () => void
  onToggleActivo: () => void
}

function UserRowMenu({ user, onResetPassword, onToggleActivo }: UserRowMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-md border border-transparent text-ink-faint hover:text-ink hover:border-border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
        aria-label="Opciones"
      >
        <MoreHorizontal className="w-4 h-4" strokeWidth={1.8} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 top-8 z-20 w-48 bg-surface border border-border rounded-card shadow-elevated py-1"
          >
            <button
              onClick={() => {
                setOpen(false)
                onResetPassword()
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink hover:bg-canvas transition-colors duration-100"
            >
              <KeyRound className="w-4 h-4 text-ink-faint" strokeWidth={1.8} />
              Resetear contraseña
            </button>
            <button
              onClick={() => {
                setOpen(false)
                onToggleActivo()
              }}
              className={
                'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-100 ' +
                (user.activo
                  ? 'text-danger hover:bg-danger-tint'
                  : 'text-success hover:bg-success-tint')
              }
            >
              {user.activo ? (
                <>
                  <UserX className="w-4 h-4" strokeWidth={1.8} />
                  Desactivar
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" strokeWidth={1.8} />
                  Activar
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type FilterKey = 'todos' | 'activos' | 'inactivos'

export default function UsuariosPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminUser | null>(null)
  const [importing, setImporting] = useState(false)
  const [filter, setFilter] = useState<FilterKey>('todos')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/usuarios')
      if (!res.ok) throw new Error('Error al cargar usuarios')
      const json = (await res.json()) as { data: AdminUser[] }
      setUsers(json.data)
    } catch {
      setError('No se pudieron cargar los usuarios.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchUsers()
    function handleRefresh() {
      void fetchUsers()
    }
    window.addEventListener('mira:refresh', handleRefresh)
    return () => window.removeEventListener('mira:refresh', handleRefresh)
  }, [fetchUsers])

  function handleUserUpdated(updated: AdminUser) {
    setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)))
  }

  async function handleToggleActivo(user: AdminUser) {
    try {
      const res = await fetch(`/api/admin/usuarios/${user._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !user.activo }),
      })
      if (!res.ok) throw new Error('Error')
      const json = (await res.json()) as { data: AdminUser }
      handleUserUpdated(json.data)
      toast.success(json.data.activo ? 'Usuario activado' : 'Usuario desactivado')
    } catch {
      toast.error('No se pudo actualizar el estado del usuario')
    }
  }

  async function handleImportFromSheets() {
    const sheetName = prompt('Ingresa el nombre de la hoja de Google Sheets:')
    if (!sheetName) return

    setImporting(true)
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetName }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || `Error al importar (HTTP ${res.status})`)
      }

      const result = await res.json()
      toast.success(result.message)
    } catch (error: any) {
      toast.error(error.message || 'Error al importar datos')
    } finally {
      setImporting(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-view">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-zinc-100 rounded-card animate-pulse h-20" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-view flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-sm text-ink-muted">{error}</p>
        <button onClick={() => void fetchUsers()} className="text-sm text-primary hover:underline">
          Reintentar
        </button>
      </div>
    )
  }

  const activeCount = users.filter((u) => u.activo).length
  const inactiveCount = users.length - activeCount
  const filteredUsers = users.filter((u) => {
    if (filter === 'activos') return u.activo
    if (filter === 'inactivos') return !u.activo
    return true
  })

  const segments: { key: FilterKey; label: string; count: number }[] = [
    { key: 'todos', label: 'Todos', count: users.length },
    { key: 'activos', label: 'Activos', count: activeCount },
    { key: 'inactivos', label: 'Inactivos', count: inactiveCount },
  ]

  return (
    <div className="admin-view">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        {/* Segmented filter */}
        <div className="flex items-center gap-0.5 bg-canvas rounded-field p-0.5 border border-border">
          {segments.map((s) => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={
                'flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium rounded-[8px] transition-colors duration-150 ' +
                (filter === s.key
                  ? 'bg-white text-ink shadow-card'
                  : 'text-ink-muted hover:text-ink')
              }
            >
              {s.label}
              <span className="tabular-nums text-ink-faint">{s.count}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void handleImportFromSheets()}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-primary text-primary hover:bg-primary-tint rounded-field font-medium transition duration-150 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" strokeWidth={1.8} />
                Importar de Sheets
              </>
            )}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary-3d flex items-center gap-2 px-4 py-2 text-sm text-white rounded-field font-medium"
          >
            <UserPlus className="w-4 h-4" strokeWidth={1.8} />
            Crear coordinador
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-card border border-border shadow-card overflow-hidden">
        {filteredUsers.map((user, i) => (
          <div
            key={user._id}
            className={
              'user-row-3d flex items-center gap-4 p-4 ' +
              (i > 0 ? 'border-t border-[#F1F2F5]' : '')
            }
          >
            {/* Avatar */}
            <div
              className={
                'w-[38px] h-[38px] rounded-[11px] flex items-center justify-center text-sm font-bold flex-shrink-0 ' +
                (user.activo ? 'bg-primary text-white' : 'bg-[#EFF1F6] text-[#9AA0AD]')
              }
            >
              {getInitials(user.nombre, user.email)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p
                  className="font-medium"
                  style={{ color: user.activo ? '#10131A' : '#5A6070' }}
                >
                  {user.nombre}
                </p>
                {roleBadge(user.role)}
                {!user.activo && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#EFF1F6] text-[#9AA0AD]">
                    Inactivo
                  </span>
                )}
              </div>
              <p className="text-sm truncate" style={{ color: user.activo ? '#6B7280' : '#9AA0AD' }}>
                {user.email}
              </p>

              {/* Municipios */}
              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                {(user.municipios || []).map((m) => (
                  <span
                    key={m}
                    className="bg-canvas text-ink-muted text-xs px-2 py-0.5 rounded-full"
                  >
                    {m}
                  </span>
                ))}
                {user.role === 'coordinador' && (
                  <MunicipioPopover
                    userId={user._id}
                    currentMunicipios={user.municipios || []}
                    onUpdated={handleUserUpdated}
                  />
                )}
              </div>
            </div>

            {/* Status */}
            {user.activo && (
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-success-tint text-success flex-shrink-0">
                Activo
              </span>
            )}

            {/* Menu */}
            <UserRowMenu
              user={user}
              onResetPassword={() => setResetPasswordUser(user)}
              onToggleActivo={() => void handleToggleActivo(user)}
            />
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center py-16 text-sm text-ink-faint">
            No hay usuarios en este filtro
          </div>
        )}
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateModal
            onClose={() => setShowCreateModal(false)}
            onCreated={(user) => {
              setUsers((prev) => [user, ...prev])
              setShowCreateModal(false)
            }}
          />
        )}
      </AnimatePresence>

      {/* Reset password modal */}
      <AnimatePresence>
        {resetPasswordUser && (
          <ResetPasswordModal
            user={resetPasswordUser}
            onClose={() => setResetPasswordUser(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
