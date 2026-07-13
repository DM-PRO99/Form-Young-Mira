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
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
        Administrador
      </span>
    )
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
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
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md z-10 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="text-base font-semibold text-zinc-900">
            Crear coordinador
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#1E3A9E]/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-4">
          {fieldError && (
            <p className="text-sm text-red-600">{fieldError}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Nombre completo
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-lg outline-none focus:border-[#1E3A9E] focus:ring-[3px] focus:ring-[#1E3A9E]/15 transition-[border-color,box-shadow] duration-150"
              placeholder="Nombre del coordinador"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-lg outline-none focus:border-[#1E3A9E] focus:ring-[3px] focus:ring-[#1E3A9E]/15 transition-[border-color,box-shadow] duration-150"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 text-sm border border-zinc-300 rounded-lg outline-none focus:border-[#1E3A9E] focus:ring-[3px] focus:ring-[#1E3A9E]/15 transition-[border-color,box-shadow] duration-150"
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#1E3A9E]/20 rounded"
                aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Municipios asignados
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_MUNICIPIOS.map((m) => (
                <label
                  key={m}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={selectedMunicipios.includes(m)}
                    onChange={() => toggleMunicipio(m)}
                    className="w-4 h-4 rounded border-zinc-300 accent-[#1E3A9E]"
                  />
                  <span className="text-sm text-zinc-700">{m}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 text-sm border border-zinc-300 bg-white rounded-lg font-medium text-zinc-700 hover:bg-zinc-50 transition-[background-color] duration-150 active:scale-[0.97] transition-transform duration-[140ms] disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-[#14286E] hover:bg-[#1E3A9E] text-white rounded-lg font-medium transition-[background-color] duration-150 active:scale-[0.97] transition-transform duration-[140ms] disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
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
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm z-10 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="text-base font-semibold text-zinc-900">
            Resetear contraseña
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#1E3A9E]/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="px-6 py-5 space-y-4"
        >
          <p className="text-sm text-zinc-500">
            Nueva contraseña para{' '}
            <span className="font-medium text-zinc-800">{user.nombre}</span>
          </p>
          {fieldError && (
            <p className="text-sm text-red-600">{fieldError}</p>
          )}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 text-sm border border-zinc-300 rounded-lg outline-none focus:border-[#1E3A9E] focus:ring-[3px] focus:ring-[#1E3A9E]/15 transition-[border-color,box-shadow] duration-150"
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#1E3A9E]/20 rounded"
              >
                {showPw ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Confirmar contraseña
            </label>
            <input
              type={showPw ? 'text' : 'password'}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-zinc-300 rounded-lg outline-none focus:border-[#1E3A9E] focus:ring-[3px] focus:ring-[#1E3A9E]/15 transition-[border-color,box-shadow] duration-150"
              placeholder="Repite la contraseña"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 text-sm border border-zinc-300 bg-white rounded-lg font-medium text-zinc-700 hover:bg-zinc-50 transition-[background-color] duration-150 active:scale-[0.97] transition-transform duration-[140ms] disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-[#14286E] hover:bg-[#1E3A9E] text-white rounded-lg font-medium transition-[background-color] duration-150 active:scale-[0.97] transition-transform duration-[140ms] disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4" />
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

function MunicipioPopover({
  userId,
  currentMunicipios,
  onUpdated,
}: MunicipioPopoverProps) {
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
        className="flex items-center gap-1 text-xs border border-dashed border-zinc-300 text-zinc-500 px-2 py-0.5 rounded-full hover:border-[#1E3A9E] hover:text-[#1E3A9E] transition-colors duration-150"
      >
        <Plus className="w-3 h-3" />
        Municipio
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="absolute left-0 top-7 z-20 w-48 bg-white border border-zinc-200 rounded-xl shadow-lg py-2"
          >
            {saving && (
              <div className="flex items-center justify-center py-1">
                <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />
              </div>
            )}
            {ALL_MUNICIPIOS.map((m) => (
              <label
                key={m}
                className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-zinc-50 transition-colors duration-100"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(m)}
                  onChange={() => void handleToggle(m)}
                  className="w-4 h-4 rounded border-zinc-300 accent-[#1E3A9E]"
                />
                <span className="text-sm text-zinc-700">{m}</span>
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

function UserRowMenu({
  user,
  onResetPassword,
  onToggleActivo,
}: UserRowMenuProps) {
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
        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#1E3A9E]/20"
        aria-label="Opciones"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 top-8 z-20 w-48 bg-white border border-zinc-200 rounded-xl shadow-lg py-1"
          >
            <button
              onClick={() => {
                setOpen(false)
                onResetPassword()
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors duration-100"
            >
              <KeyRound className="w-4 h-4 text-zinc-400" />
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
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-green-700 hover:bg-green-50')
              }
            >
              {user.activo ? (
                <>
                  <UserX className="w-4 h-4" />
                  Desactivar
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
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

export default function UsuariosPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminUser | null>(
    null
  )

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
  }, [fetchUsers])

  function handleUserUpdated(updated: AdminUser) {
    setUsers((prev) =>
      prev.map((u) => (u._id === updated._id ? updated : u))
    )
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
      toast.success(
        json.data.activo ? 'Usuario activado' : 'Usuario desactivado'
      )
    } catch {
      toast.error('No se pudo actualizar el estado del usuario')
    }
  }

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold text-zinc-900">Usuarios</h1>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-zinc-100 rounded-xl animate-pulse h-20"
            />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-sm text-zinc-500">{error}</p>
        <button
          onClick={() => void fetchUsers()}
          className="text-sm text-[#1E3A9E] hover:underline"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold text-zinc-900">Usuarios</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-[#14286E] hover:bg-[#1E3A9E] text-white rounded-lg font-medium transition-[background-color] duration-150 active:scale-[0.97] transition-transform duration-[140ms]"
          >
            <UserPlus className="w-4 h-4" />
            Crear coordinador
          </button>
        </div>

        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user._id}
              className={
                'bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-4 ' +
                (!user.activo ? 'opacity-60' : '')
              }
            >
              {/* Avatar */}
              <div className="w-10 h-10 bg-[#1E3A9E]/10 text-[#1E3A9E] rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                {getInitials(user.nombre, user.email)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p
                    className={
                      'font-medium text-zinc-900 ' +
                      (!user.activo ? 'line-through' : '')
                    }
                  >
                    {user.nombre}
                  </p>
                  {roleBadge(user.role)}
                  {!user.activo && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-400">
                      Inactivo
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-500 truncate">{user.email}</p>

                {/* Municipios */}
                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                  {user.municipios.map((m) => (
                    <span
                      key={m}
                      className="bg-zinc-100 text-zinc-600 text-xs px-2 py-0.5 rounded-full"
                    >
                      {m}
                    </span>
                  ))}
                  {user.role === 'coordinador' && (
                    <MunicipioPopover
                      userId={user._id}
                      currentMunicipios={user.municipios}
                      onUpdated={handleUserUpdated}
                    />
                  )}
                </div>
              </div>

              {/* Active badge */}
              {user.activo && (
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 flex-shrink-0">
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

          {users.length === 0 && (
            <div className="text-center py-16 text-sm text-zinc-400">
              No hay usuarios registrados
            </div>
          )}
        </div>
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
    </>
  )
}
