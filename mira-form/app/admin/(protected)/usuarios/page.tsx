'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { toast } from 'sonner'
import { Check, Download, Eye, EyeOff, KeyRound, MoreHorizontal, Plus, UserCheck, UserCog, UserPlus, Users, UserX } from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  Input,
  KpiCard,
  Modal,
  PageHeader,
  SegmentedControl,
  Skeleton,
  useConfirm,
} from '@/components/admin/ui'
import { MUNICIPIOS } from '@/lib/municipios'
import { cn } from '@/lib/cn'

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

const EASE_OUT = [0.23, 1, 0.32, 1] as const

async function readError(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string }
  return body.error ?? body.message ?? fallback
}

// ─── Piezas reutilizables de la pantalla ────────────────────────────────────

function PasswordInput({ id, value, onChange, placeholder, show, onToggle }: {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  show: boolean
  onToggle: () => void
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        required
        minLength={8}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
        autoComplete="new-password"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-[6px] text-ink-faint hover:text-ink focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
      >
        {show ? <EyeOff className="w-4 h-4" strokeWidth={1.8} /> : <Eye className="w-4 h-4" strokeWidth={1.8} />}
      </button>
    </div>
  )
}

function MunicipioChips({ selected, onToggle, disabled }: { selected: string[]; onToggle: (m: string) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {MUNICIPIOS.map((m) => {
        const active = selected.includes(m)
        return (
          <button
            key={m}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            onClick={() => onToggle(m)}
            className={cn(
              'press inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-[12.5px] font-medium disabled:opacity-60',
              'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20',
              active ? 'bg-primary-tint border-primary/40 text-primary' : 'bg-white border-border-input text-ink-muted hover:border-primary/40'
            )}
          >
            {active && <Check className="w-3.5 h-3.5" strokeWidth={2} />}
            {m}
          </button>
        )
      })}
    </div>
  )
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onOutside: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onOutside()
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('keydown', onKey)
    }
  }, [ref, onOutside, active])
}

function Popover({ open, align, children }: { open: boolean; align: 'left' | 'right'; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion()
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.96)' }}
          animate={{ opacity: 1, transform: 'scale(1)', transition: { duration: 0.15, ease: EASE_OUT } }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
          style={{ transformOrigin: align === 'right' ? 'top right' : 'top left' }}
          className={cn(
            'absolute top-full mt-1.5 z-20 w-52 bg-surface border border-border rounded-card shadow-pop py-1.5',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Modales ────────────────────────────────────────────────────────────────

function CreateModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (user: AdminUser) => void }) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setNombre('')
    setEmail('')
    setPassword('')
    setSelected([])
    setFieldError(null)
  }, [open])

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
        body: JSON.stringify({ email, password, nombre, municipios: selected }),
      })
      if (!res.ok) throw new Error(await readError(res, 'No se pudo crear el usuario'))
      const json = (await res.json()) as { data: AdminUser }
      toast.success('Coordinador creado')
      onCreated(json.data)
    } catch (err) {
      setFieldError(err instanceof Error ? err.message : 'No se pudo crear el usuario')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Crear coordinador"
      description="Tendrá acceso a los registros de los municipios que le asignes."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" form="create-user-form" loading={submitting} icon={<UserPlus className="w-4 h-4" strokeWidth={1.8} />}>
            Crear coordinador
          </Button>
        </>
      }
    >
      <form id="create-user-form" onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {fieldError && <p className="text-[13px] text-danger bg-danger-tint rounded-field px-3 py-2">{fieldError}</p>}
        <Field label="Nombre completo">
          {(id) => <Input id={id} required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del coordinador" />}
        </Field>
        <Field label="Correo electrónico">
          {(id) => (
            <Input id={id} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" autoComplete="off" />
          )}
        </Field>
        <Field label="Contraseña" hint="Mínimo 8 caracteres.">
          {(id) => (
            <PasswordInput
              id={id}
              value={password}
              onChange={setPassword}
              placeholder="Contraseña inicial"
              show={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
          )}
        </Field>
        <div>
          <p className="text-[13px] font-medium text-ink mb-2">Municipios asignados</p>
          <MunicipioChips selected={selected} onToggle={(m) => setSelected((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))} />
        </div>
      </form>
    </Modal>
  )
}

function ResetPasswordModal({ user, onClose }: { user: AdminUser | null; onClose: () => void }) {
  const [password, setPassword] = useState('')
  const [confirmValue, setConfirmValue] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setPassword('')
    setConfirmValue('')
    setFieldError(null)
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (password.length < 8) {
      setFieldError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirmValue) {
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
      if (!res.ok) throw new Error(await readError(res, 'No se pudo actualizar la contraseña'))
      toast.success('Contraseña actualizada')
      onClose()
    } catch (err) {
      setFieldError(err instanceof Error ? err.message : 'No se pudo actualizar la contraseña')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={user !== null}
      onClose={onClose}
      size="sm"
      title="Cambiar contraseña"
      description={user && <>Nueva contraseña para <span className="font-medium text-ink">{user.nombre}</span>.</>}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" form="reset-password-form" loading={submitting} icon={<KeyRound className="w-4 h-4" strokeWidth={1.8} />}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="reset-password-form" onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {fieldError && <p className="text-[13px] text-danger bg-danger-tint rounded-field px-3 py-2">{fieldError}</p>}
        <Field label="Nueva contraseña">
          {(id) => (
            <PasswordInput id={id} value={password} onChange={setPassword} placeholder="Mínimo 8 caracteres" show={showPw} onToggle={() => setShowPw((v) => !v)} />
          )}
        </Field>
        <Field label="Confirmar contraseña">
          {(id) => (
            <Input
              id={id}
              type={showPw ? 'text' : 'password'}
              required
              value={confirmValue}
              onChange={(e) => setConfirmValue(e.target.value)}
              placeholder="Repite la contraseña"
              autoComplete="new-password"
            />
          )}
        </Field>
      </form>
    </Modal>
  )
}

function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sheetName, setSheetName] = useState('Sheet1')
  const [importing, setImporting] = useState(false)

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    if (!sheetName.trim()) return
    setImporting(true)
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetName: sheetName.trim() }),
      })
      if (!res.ok) throw new Error(await readError(res, `Error al importar (HTTP ${res.status})`))
      const result = (await res.json()) as { message: string }
      toast.success(result.message)
      window.dispatchEvent(new Event('mira:refresh'))
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al importar datos')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Importar registros de Google Sheets"
      description="Se agregan los registros nuevos y se actualizan los existentes por cédula."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={importing}>
            Cancelar
          </Button>
          <Button type="submit" form="import-form" loading={importing} icon={<Download className="w-4 h-4" strokeWidth={1.8} />}>
            Importar
          </Button>
        </>
      }
    >
      <form id="import-form" onSubmit={(e) => void handleImport(e)}>
        <Field label="Nombre de la hoja" hint="Tal como aparece en la pestaña del Sheet.">
          {(id) => <Input id={id} required value={sheetName} onChange={(e) => setSheetName(e.target.value)} />}
        </Field>
      </form>
    </Modal>
  )
}

// ─── Fila de usuario ────────────────────────────────────────────────────────

function MunicipioEditor({ user, onUpdated }: { user: AdminUser; onUpdated: (u: AdminUser) => void }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useClickOutside(ref, close, open)

  async function toggle(m: string) {
    const current = user.municipios || []
    const next = current.includes(m) ? current.filter((x) => x !== m) : [...current, m]
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${user._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ municipios: next }),
      })
      if (!res.ok) throw new Error()
      onUpdated(((await res.json()) as { data: AdminUser }).data)
    } catch {
      toast.error('No se pudieron actualizar los municipios')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="press inline-flex items-center gap-1 h-[22px] px-2 rounded-full border border-dashed border-border-input text-[11.5px] font-medium text-ink-muted hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
      >
        <Plus className="w-3 h-3" strokeWidth={2} />
        Municipios
      </button>
      <Popover open={open} align="left">
        <p className="px-3 pt-1 pb-2 text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em]">Asignar municipios</p>
        {MUNICIPIOS.map((m) => {
          const active = (user.municipios || []).includes(m)
          return (
            <button
              key={m}
              type="button"
              disabled={saving}
              onClick={() => void toggle(m)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-[13px] text-ink hover:bg-canvas disabled:opacity-60 transition-colors duration-100"
            >
              {m}
              {active && <Check className="w-4 h-4 text-primary" strokeWidth={2} />}
            </button>
          )
        })}
      </Popover>
    </div>
  )
}

function UserRowMenu({ user, onResetPassword, onToggleActivo }: { user: AdminUser; onResetPassword: () => void; onToggleActivo: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useClickOutside(ref, close, open)

  return (
    <div className="relative" ref={ref}>
      <IconButton label="Opciones" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <MoreHorizontal className="w-4 h-4" strokeWidth={1.8} />
      </IconButton>
      <Popover open={open} align="right">
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            onResetPassword()
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-ink hover:bg-canvas transition-colors duration-100"
        >
          <KeyRound className="w-4 h-4 text-ink-faint" strokeWidth={1.8} />
          Cambiar contraseña
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            onToggleActivo()
          }}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors duration-100',
            user.activo ? 'text-danger hover:bg-danger-tint' : 'text-success hover:bg-success-tint'
          )}
        >
          {user.activo ? <UserX className="w-4 h-4" strokeWidth={1.8} /> : <UserCheck className="w-4 h-4" strokeWidth={1.8} />}
          {user.activo ? 'Desactivar acceso' : 'Reactivar acceso'}
        </button>
      </Popover>
    </div>
  )
}

// ─── Página ─────────────────────────────────────────────────────────────────

type FilterKey = 'todos' | 'activos' | 'inactivos'

export default function UsuariosPage() {
  const confirm = useConfirm()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminUser | null>(null)
  const [filter, setFilter] = useState<FilterKey>('todos')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/usuarios')
      if (!res.ok) throw new Error()
      setUsers(((await res.json()) as { data: AdminUser[] }).data)
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
    if (user.activo) {
      const ok = await confirm({
        title: 'Desactivar acceso',
        description: (
          <>
            <span className="font-medium text-ink">{user.nombre}</span> ya no podrá entrar al panel. Puedes reactivarlo cuando quieras.
          </>
        ),
        confirmLabel: 'Desactivar',
      })
      if (!ok) return
    }
    try {
      const res = await fetch(`/api/admin/usuarios/${user._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !user.activo }),
      })
      if (!res.ok) throw new Error()
      const json = (await res.json()) as { data: AdminUser }
      handleUserUpdated(json.data)
      toast.success(json.data.activo ? 'Acceso reactivado' : 'Acceso desactivado')
    } catch {
      toast.error('No se pudo actualizar el estado del usuario')
    }
  }

  const activeCount = users.filter((u) => u.activo).length
  const filteredUsers = users.filter((u) => (filter === 'activos' ? u.activo : filter === 'inactivos' ? !u.activo : true))

  return (
    <div className="admin-view">
      <PageHeader
        title="Usuarios"
        description="Administradores y coordinadores con acceso al panel"
        actions={
          <>
            <Button variant="secondary" icon={<Download className="w-4 h-4" strokeWidth={1.8} />} onClick={() => setShowImport(true)}>
              Importar de Sheets
            </Button>
            <Button icon={<UserPlus className="w-4 h-4" strokeWidth={1.8} />} onClick={() => setShowCreate(true)}>
              Crear coordinador
            </Button>
          </>
        }
      />

      {!loading && !error && users.length > 0 && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-5">
          <KpiCard label="Usuarios" icon={Users} tone="primary" value={users.length} />
          <KpiCard label="Activos" icon={UserCheck} tone="success" value={activeCount} />
          <KpiCard label="Coordinadores" icon={UserCog} tone="violet" value={users.filter((u) => u.role === 'coordinador').length} />
          <KpiCard label="Inactivos" icon={UserX} tone="warning" value={users.length - activeCount} />
        </div>
      )}

      <div className="mb-4 overflow-x-auto">
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'todos', label: <>Todos <span className="tabular-nums text-ink-faint ml-1">{users.length}</span></> },
            { value: 'activos', label: <>Activos <span className="tabular-nums text-ink-faint ml-1">{activeCount}</span></> },
            { value: 'inactivos', label: <>Inactivos <span className="tabular-nums text-ink-faint ml-1">{users.length - activeCount}</span></> },
          ]}
        />
      </div>

      <Card>
        {loading ? (
          <div className="divide-y divide-[#F1F2F5]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={() => void fetchUsers()} />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={filter === 'todos' ? 'Aún no hay usuarios' : `No hay usuarios ${filter}`}
            description={filter === 'todos' ? 'Crea el primer coordinador para darle acceso al panel.' : undefined}
          />
        ) : (
          <div className="divide-y divide-[#F1F2F5]">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className={cn(
                  'user-row-3d flex items-start sm:items-center gap-3 sm:gap-4 p-4 first:rounded-t-card last:rounded-b-card',
                  !user.activo && 'bg-surface-muted'
                )}
              >
                <Avatar name={user.nombre} email={user.email} size="md" className={cn(!user.activo && 'bg-[#EFF1F6] text-ink-faint')} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={cn('text-[14px] font-medium', user.activo ? 'text-ink' : 'text-ink-muted')}>{user.nombre}</p>
                    <Badge tone={user.role === 'admin' ? 'violet' : 'primary'}>{user.role === 'admin' ? 'Administrador' : 'Coordinador'}</Badge>
                    {!user.activo && <Badge tone="neutral">Inactivo</Badge>}
                  </div>
                  <p className={cn('text-[12.5px] truncate mt-0.5', user.activo ? 'text-ink-muted' : 'text-ink-faint')}>{user.email}</p>

                  {(user.role === 'coordinador' || (user.municipios || []).length > 0) && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      {(user.municipios || []).map((m) => (
                        <span key={m} className="inline-flex items-center h-[22px] px-2 rounded-full bg-canvas border border-border text-[11.5px] text-ink-muted">
                          {m}
                        </span>
                      ))}
                      {user.role === 'coordinador' && <MunicipioEditor user={user} onUpdated={handleUserUpdated} />}
                    </div>
                  )}
                </div>

                {user.activo && (
                  <Badge tone="success" dot className="hidden sm:inline-flex">
                    Activo
                  </Badge>
                )}

                <UserRowMenu user={user} onResetPassword={() => setResetPasswordUser(user)} onToggleActivo={() => void handleToggleActivo(user)} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <CreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(user) => {
          setUsers((prev) => [user, ...prev])
          setShowCreate(false)
        }}
      />
      <ResetPasswordModal user={resetPasswordUser} onClose={() => setResetPasswordUser(null)} />
      <ImportModal open={showImport} onClose={() => setShowImport(false)} />
    </div>
  )
}
