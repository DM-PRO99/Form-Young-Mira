'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  CalendarDays,
  Check,
  ClipboardList,
  Copy,
  Download,
  ExternalLink,
  LayoutGrid,
  ListChecks,
  MapPin,
  Package,
  Plus,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react'
import {
  Avatar,
  BackLink,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Eyebrow,
  IconButton,
  Input,
  ResponsiveTable,
  SearchInput,
  Skeleton,
  Tabs,
  useConfirm,
  type BadgeTone,
  type Column,
} from '@/components/admin/ui'
import { cn } from '@/lib/cn'
import { EventEstadoBadge, formatEventDate as formatDate } from '../_shared'

type Tab = 'resumen' | 'inscripciones' | 'inventario' | 'tareas' | 'coordinadores'

interface UserLite {
  _id: string
  nombre: string
  email: string
  role?: 'admin' | 'coordinador'
}

interface EventDetail {
  _id: string
  nombre: string
  descripcionPublica?: string
  fechas: string[]
  lugar: string
  capacidadMaxima?: number
  estado: 'borrador' | 'publicado' | 'cerrado'
  creadoPor: string
  coordinadoresAsignados: UserLite[]
}

interface Summary {
  inscritos: number
  capacidadMaxima: number | null
  cuposDisponibles: number | null
  inventario: { total: number; conseguidos: number; porcentaje: number }
  tareas: { total: number; completadas: number }
  ultimasInscripciones: RegistrationRow[]
}

interface RegistrationRow {
  _id: string
  nombreCompleto: string
  cedula: string
  telefono: string
  correo?: string
  municipio: string
  fecha: string
  edad?: number
  estado: 'pendiente' | 'confirmado' | 'cancelado'
  createdAt: string
}

interface InventoryRow {
  _id: string
  nombre: string
  cantidad?: string
  responsable?: string
  estado: 'pendiente' | 'comprado' | 'conseguido'
  notas?: string
}

interface TaskRow {
  _id: string
  titulo: string
  responsable?: string
  fechaLimite?: string
  completada: boolean
}

const REGISTRATION_TONE: Record<RegistrationRow['estado'], { tone: BadgeTone; label: string }> = {
  confirmado: { tone: 'success', label: 'Confirmado' },
  pendiente: { tone: 'warning', label: 'Pendiente' },
  cancelado: { tone: 'danger', label: 'Cancelado' },
}

const INVENTORY_NEXT: Record<InventoryRow['estado'], InventoryRow['estado']> = {
  pendiente: 'comprado',
  comprado: 'conseguido',
  conseguido: 'pendiente',
}

const INVENTORY_TONE: Record<InventoryRow['estado'], { tone: BadgeTone; label: string }> = {
  pendiente: { tone: 'warning', label: 'Pendiente' },
  comprado: { tone: 'primary', label: 'Comprado' },
  conseguido: { tone: 'success', label: 'Conseguido' },
}

function RegistrationBadge({ estado }: { estado: RegistrationRow['estado'] }) {
  const s = REGISTRATION_TONE[estado]
  return <Badge tone={s.tone}>{s.label}</Badge>
}

function ProgressBar({ value, tone = 'primary' }: { value: number; tone?: 'primary' | 'success' | 'danger' }) {
  return (
    <div className="h-1.5 bg-canvas rounded-full overflow-hidden">
      <div
        className={cn('progress-fill h-full w-full rounded-full', tone === 'success' ? 'bg-success' : tone === 'danger' ? 'bg-danger' : 'bg-primary')}
        style={{ transform: `scaleX(${Math.max(0, Math.min(value, 1))})` }}
      />
    </div>
  )
}

export default function EventoDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const confirm = useConfirm()
  const id = params.id

  const [role, setRole] = useState<'admin' | 'coordinador'>('coordinador')
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('resumen')
  const [copied, setCopied] = useState(false)

  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/inscribirse/${id}` : ''

  const fetchEvent = useCallback(async () => {
    const res = await fetch(`/api/events/${id}`)
    if (res.ok) setEvent(((await res.json()) as { data: EventDetail }).data)
  }, [id])

  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const meRes = await fetch('/api/auth/me')
        if (meRes.ok) setRole((await meRes.json()).role || 'coordinador')
        await fetchEvent()
      } finally {
        setLoading(false)
      }
    }
    void init()
  }, [fetchEvent])

  function handleCopy() {
    void navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function handleDeleteEvent() {
    if (!event) return
    const ok = await confirm({
      title: 'Eliminar evento',
      description: (
        <>
          Se eliminará <span className="font-medium text-ink">{event.nombre}</span> junto con sus inscripciones, inventario y tareas. Esta acción no se
          puede deshacer.
        </>
      ),
      confirmLabel: 'Eliminar evento',
    })
    if (!ok) return
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Evento eliminado')
      router.push('/admin/eventos')
    } else {
      toast.error('No se pudo eliminar el evento')
    }
  }

  if (loading) {
    return (
      <div className="admin-view space-y-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <Skeleton className="h-9 w-full max-w-lg mt-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-card" />
          ))}
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <Card className="admin-view">
        <EmptyState icon={CalendarDays} title="Evento no encontrado" description="El evento no existe o no tienes acceso a él." />
      </Card>
    )
  }

  return (
    <div className="admin-view">
      <BackLink href="/admin/eventos">Volver a eventos</BackLink>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap mb-2">
            <h2 className="text-[20px] md:text-[22px] font-semibold text-ink leading-tight tracking-[-0.01em]">{event.nombre}</h2>
            <EventEstadoBadge estado={event.estado} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-ink-muted">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" strokeWidth={1.8} />
              {event.lugar}
            </span>
            {event.capacidadMaxima && (
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" strokeWidth={1.8} />
                Cupo {event.capacidadMaxima} por fecha
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {event.fechas.map((f) => (
              <span key={f} className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-white border border-border text-[12px] text-ink tabular-nums">
                <CalendarDays className="w-3.5 h-3.5 text-primary" strokeWidth={1.8} />
                {formatDate(f, true)}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          <a
            href={`/inscribirse/${id}`}
            target="_blank"
            rel="noreferrer"
            className="press inline-flex items-center gap-2 h-10 px-4 text-[13.5px] font-medium text-ink border border-border-input rounded-field bg-white hover:bg-canvas focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
          >
            <ExternalLink className="w-4 h-4" strokeWidth={1.8} />
            Ver formulario
          </a>
          <Button onClick={handleCopy} icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" strokeWidth={1.8} />}>
            {copied ? 'Enlace copiado' : 'Copiar enlace'}
          </Button>
          <IconButton label="Eliminar evento" tone="danger" className="w-10 h-10 border border-border-input bg-white" onClick={() => void handleDeleteEvent()}>
            <Trash2 className="w-4 h-4" strokeWidth={1.8} />
          </IconButton>
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-5 md:mb-6"
        tabs={[
          { value: 'resumen', label: 'Resumen', icon: LayoutGrid },
          { value: 'inscripciones', label: 'Inscripciones', icon: Users },
          { value: 'inventario', label: 'Inventario', icon: Package },
          { value: 'tareas', label: 'Tareas', icon: ListChecks },
          { value: 'coordinadores', label: 'Coordinadores', icon: UserCog },
        ]}
      />

      <div key={tab} className="lesson-fade">
        {tab === 'resumen' && <ResumenTab id={id} event={event} publicUrl={publicUrl} onSeeAll={() => setTab('inscripciones')} />}
        {tab === 'inscripciones' && <InscripcionesTab id={id} />}
        {tab === 'inventario' && <InventarioTab id={id} />}
        {tab === 'tareas' && <TareasTab id={id} />}
        {tab === 'coordinadores' && <CoordinadoresTab id={id} role={role} event={event} onUpdated={fetchEvent} />}
      </div>
    </div>
  )
}

// ─── Resumen ────────────────────────────────────────────────────────────────

function StatCard({ label, value, children }: { label: string; value: React.ReactNode; children?: React.ReactNode }) {
  return (
    <Card interactive className="p-5">
      <Eyebrow className="mb-2.5">{label}</Eyebrow>
      <p className="text-[32px] font-semibold tabular-nums text-ink leading-none tracking-[-0.03em] mb-2.5">{value}</p>
      {children}
    </Card>
  )
}

function ResumenTab({ id, event, publicUrl, onSeeAll }: { id: string; event: EventDetail; publicUrl: string; onSeeAll: () => void }) {
  const [summary, setSummary] = useState<Summary | null>(null)

  const fetchSummary = useCallback(async () => {
    const res = await fetch(`/api/events/${id}/summary`)
    if (res.ok) setSummary(((await res.json()) as { data: Summary }).data)
  }, [id])

  useEffect(() => {
    void fetchSummary()
    const interval = setInterval(() => void fetchSummary(), 20000)
    return () => clearInterval(interval)
  }, [fetchSummary])

  if (!summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-card" />
        ))}
      </div>
    )
  }

  const cupo = summary.capacidadMaxima ? summary.inscritos / summary.capacidadMaxima : null

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-[1fr_1fr_1fr_300px] gap-4 md:gap-5">
      <StatCard label="Inscritos" value={<span className="text-primary">{summary.inscritos}</span>}>
        {summary.capacidadMaxima ? (
          <>
            <p className="text-[12.5px] text-ink-muted mb-2">
              de {summary.capacidadMaxima} cupos · quedan {summary.cuposDisponibles}
            </p>
            <ProgressBar value={cupo ?? 0} tone={cupo !== null && cupo >= 1 ? 'danger' : 'primary'} />
          </>
        ) : (
          <p className="text-[12.5px] text-ink-muted">Sin límite de cupo</p>
        )}
      </StatCard>

      <StatCard label="Inventario" value={`${summary.inventario.porcentaje}%`}>
        <p className="text-[12.5px] text-ink-muted mb-2">
          {summary.inventario.conseguidos} de {summary.inventario.total} ítems listos
        </p>
        <ProgressBar value={summary.inventario.porcentaje / 100} tone={summary.inventario.porcentaje === 100 ? 'success' : 'primary'} />
      </StatCard>

      <StatCard label="Tareas" value={`${summary.tareas.completadas}/${summary.tareas.total}`}>
        <p className="text-[12.5px] text-ink-muted mb-2">completadas</p>
        <ProgressBar
          value={summary.tareas.total ? summary.tareas.completadas / summary.tareas.total : 0}
          tone={summary.tareas.total > 0 && summary.tareas.completadas === summary.tareas.total ? 'success' : 'primary'}
        />
      </StatCard>

      <div className="space-y-4 md:col-span-3 xl:col-span-1 xl:row-span-2 grid md:grid-cols-2 xl:grid-cols-1 gap-4 md:space-y-0 xl:content-start">
        <Card className="p-4">
          <Eyebrow className="mb-2">Enlace de inscripción</Eyebrow>
          <p className="font-mono text-[11.5px] text-primary bg-primary-tint rounded-[8px] px-2.5 py-2 truncate">{publicUrl}</p>
          <p className="flex items-center gap-1.5 text-[11.5px] text-ink-faint mt-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            Datos en vivo · se actualizan cada 20 s
          </p>
        </Card>
        <Card className="p-4">
          <Eyebrow className="mb-2.5">Coordinadores</Eyebrow>
          {event.coordinadoresAsignados.length === 0 ? (
            <p className="text-[12.5px] text-ink-faint">Sin coordinadores asignados</p>
          ) : (
            <div className="space-y-2">
              {event.coordinadoresAsignados.map((c) => (
                <div key={c._id} className="flex items-center gap-2">
                  <Avatar name={c.nombre} email={c.email} size="xs" />
                  <span className="text-[13px] text-ink truncate">{c.nombre}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="md:col-span-3 overflow-hidden">
        <CardHeader
          title="Últimas inscripciones"
          actions={
            summary.ultimasInscripciones.length > 0 && (
              <Button variant="ghost" size="sm" onClick={onSeeAll}>
                Ver todas
              </Button>
            )
          }
        />
        {summary.ultimasInscripciones.length === 0 ? (
          <EmptyState icon={Users} title="Aún no hay inscripciones" description="Comparte el enlace para empezar a recibir inscritos." className="py-10" />
        ) : (
          <div className="divide-y divide-[#F1F2F5]">
            {summary.ultimasInscripciones.map((r) => (
              <div key={r._id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={r.nombreCompleto} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] text-ink truncate">{r.nombreCompleto}</p>
                  <p className="font-mono text-[12px] text-ink-muted">{r.cedula}</p>
                </div>
                <RegistrationBadge estado={r.estado} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Inscripciones ──────────────────────────────────────────────────────────

const REGISTRATION_COLUMNS: Column<RegistrationRow>[] = [
  { header: 'Nombre', cell: (r) => <span className="font-medium text-ink">{r.nombreCompleto}</span> },
  { header: 'Cédula', cell: (r) => <span className="font-mono text-[12.5px] text-ink-muted">{r.cedula}</span> },
  { header: 'Contacto', cell: (r) => (
      <div className="leading-tight">
        <p className="font-mono text-[12.5px] text-ink">{r.telefono}</p>
        {r.correo && <p className="text-[12px] text-ink-muted truncate max-w-[200px]">{r.correo}</p>}
      </div>
    ) },
  { header: 'Municipio', cell: (r) => <span className="text-ink-muted">{r.municipio}</span> },
  { header: 'Fecha', cell: (r) => <span className="tabular-nums text-ink-muted whitespace-nowrap">{formatDate(r.fecha)}</span> },
  { header: 'Edad', cell: (r) => <span className="tabular-nums text-ink-muted">{r.edad ?? '—'}</span> },
  { header: 'Estado', cell: (r) => <RegistrationBadge estado={r.estado} /> },
]

function InscripcionesTab({ id }: { id: string }) {
  const [rows, setRows] = useState<RegistrationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [q, setQ] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchRows = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    const res = await fetch(`/api/events/${id}/registrations?${params.toString()}`)
    if (res.ok) setRows(((await res.json()) as { data: RegistrationRow[] }).data)
    setLoading(false)
  }, [id, q])

  useEffect(() => {
    void fetchRows()
  }, [fetchRows])

  function handleSearchChange(value: string) {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setQ(value), 300)
  }

  function handleExport() {
    const header = ['Cedula', 'Nombre', 'Telefono', 'Correo', 'Municipio', 'Fecha', 'Edad', 'Estado']
    const lines = rows.map((r) =>
      [r.cedula, r.nombreCompleto, r.telefono, r.correo ?? '', r.municipio, formatDate(r.fecha), r.edad ?? '', r.estado]
        .map((v) => {
          const s = String(v)
          const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
          return `"${safe.replace(/"/g, '""')}"`
        })
        .join(',')
    )
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inscripciones.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-3 md:p-4 border-b border-border">
        <SearchInput value={searchInput} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Buscar por cédula o nombre…" className="flex-1 sm:max-w-sm" />
        <p className="text-[12.5px] text-ink-muted sm:ml-auto">
          {rows.length} inscrito{rows.length === 1 ? '' : 's'}
        </p>
        <Button variant="secondary" disabled={rows.length === 0} icon={<Download className="w-4 h-4" strokeWidth={1.8} />} onClick={handleExport}>
          Exportar CSV
        </Button>
      </div>
      <ResponsiveTable
        rows={rows}
        columns={REGISTRATION_COLUMNS}
        rowKey={(r) => r._id}
        loading={loading}
        mobileCard={(r) => (
          <div>
            <div className="flex items-start justify-between gap-2">
              <p className="text-[14px] font-medium text-ink">{r.nombreCompleto}</p>
              <RegistrationBadge estado={r.estado} />
            </div>
            <p className="text-[12px] text-ink-muted font-mono mt-0.5">
              CC {r.cedula} · {r.telefono}
            </p>
            <p className="text-[12px] text-ink-faint mt-1">
              {r.municipio} · {formatDate(r.fecha)}
              {r.edad ? ` · ${r.edad} años` : ''}
            </p>
          </div>
        )}
        empty={<EmptyState icon={Users} title={q ? 'Nadie coincide con la búsqueda' : 'Aún no hay inscripciones'} />}
      />
    </Card>
  )
}

// ─── Inventario ─────────────────────────────────────────────────────────────

function InventarioTab({ id }: { id: string }) {
  const [items, setItems] = useState<InventoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [nombre, setNombre] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [responsable, setResponsable] = useState('')
  const [adding, setAdding] = useState(false)

  const fetchItems = useCallback(async () => {
    const res = await fetch(`/api/events/${id}/inventory`)
    if (res.ok) setItems(((await res.json()) as { data: InventoryRow[] }).data)
    setLoading(false)
  }, [id])

  useEffect(() => {
    void fetchItems()
  }, [fetchItems])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return
    setAdding(true)
    const res = await fetch(`/api/events/${id}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, cantidad: cantidad || undefined, responsable: responsable || undefined }),
    })
    setAdding(false)
    if (res.ok) {
      setNombre('')
      setCantidad('')
      setResponsable('')
      void fetchItems()
    } else {
      toast.error('No se pudo agregar el ítem')
    }
  }

  async function handleUpdateResponsable(itemId: string, value: string) {
    setItems((prev) => prev.map((i) => (i._id === itemId ? { ...i, responsable: value } : i)))
    const res = await fetch(`/api/events/${id}/inventory/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responsable: value || null }),
    })
    if (!res.ok) {
      toast.error('No se pudo actualizar el responsable')
      void fetchItems()
    }
  }

  async function cycleEstado(item: InventoryRow) {
    const next = INVENTORY_NEXT[item.estado]
    setItems((prev) => prev.map((i) => (i._id === item._id ? { ...i, estado: next } : i)))
    const res = await fetch(`/api/events/${id}/inventory/${item._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: next }),
    })
    if (!res.ok) {
      toast.error('No se pudo actualizar el ítem')
      void fetchItems()
    }
  }

  async function handleDelete(item: InventoryRow) {
    setItems((prev) => prev.filter((i) => i._id !== item._id))
    const res = await fetch(`/api/events/${id}/inventory/${item._id}`, { method: 'DELETE' })
    if (res.ok) {
      toast(`«${item.nombre}» eliminado`)
    } else {
      toast.error('No se pudo eliminar el ítem')
      void fetchItems()
    }
  }

  const total = items.length
  const listos = items.filter((i) => i.estado !== 'pendiente').length
  const pct = total > 0 ? Math.round((listos / total) * 100) : 0
  const porConseguir = items.filter((i) => i.estado === 'pendiente')

  function renderEstado(item: InventoryRow) {
    const s = INVENTORY_TONE[item.estado]
    return (
      <button type="button" onClick={() => void cycleEstado(item)} title="Cambiar estado" className="press rounded-full focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20">
        <Badge tone={s.tone} dot>
          {s.label}
        </Badge>
      </button>
    )
  }

  function renderResponsable(item: InventoryRow) {
    return (
      <input
        key={`${item._id}-${item.responsable ?? ''}`}
        defaultValue={item.responsable ?? ''}
        onBlur={(e) => {
          if (e.target.value !== (item.responsable ?? '')) void handleUpdateResponsable(item._id, e.target.value)
        }}
        placeholder="Sin asignar"
        aria-label={`Responsable de ${item.nombre}`}
        className="w-full min-w-0 h-8 px-2 text-[13px] text-ink bg-transparent border border-transparent rounded-[8px] outline-none hover:border-border-input focus:border-primary focus:bg-white focus:ring-[3px] focus:ring-primary/[0.16] transition-[border-color,box-shadow] duration-150"
      />
    )
  }

  const columns: Column<InventoryRow>[] = [
    { header: 'Ítem', cell: (i) => <span className="font-medium text-ink">{i.nombre}</span> },
    { header: 'Cantidad', cell: (i) => <span className="text-ink-muted">{i.cantidad ?? '—'}</span> },
    { header: 'Responsable', className: 'w-[200px]', cell: (i) => renderResponsable(i) },
    { header: 'Estado', cell: (i) => renderEstado(i) },
    {
      header: <span className="sr-only">Acciones</span>,
      className: 'w-12 text-right',
      cell: (i) => (
        <IconButton label={`Eliminar ${i.nombre}`} tone="danger" onClick={() => void handleDelete(i)}>
          <Trash2 className="w-4 h-4" strokeWidth={1.8} />
        </IconButton>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 md:gap-5 items-start">
      <Card className="overflow-hidden min-w-0">
        <form onSubmit={(e) => void handleAdd(e)} className="grid grid-cols-1 sm:grid-cols-[1fr_150px_170px_auto] gap-2 p-3 md:p-4 border-b border-border">
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nuevo ítem (ej. Cartulinas)" aria-label="Nombre del ítem" />
          <Input value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="Cantidad" aria-label="Cantidad" />
          <Input value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Responsable" aria-label="Responsable" />
          <Button type="submit" loading={adding} disabled={!nombre.trim()} icon={<Plus className="w-4 h-4" strokeWidth={1.8} />}>
            Agregar
          </Button>
        </form>
        <ResponsiveTable
          rows={items}
          columns={columns}
          rowKey={(i) => i._id}
          loading={loading}
          mobileCard={(i) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-ink">{i.nombre}</p>
                  {i.cantidad && <p className="text-[12px] text-ink-muted">{i.cantidad}</p>}
                </div>
                <IconButton label={`Eliminar ${i.nombre}`} tone="danger" onClick={() => void handleDelete(i)}>
                  <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                </IconButton>
              </div>
              <div className="flex items-center gap-2">
                {renderEstado(i)}
                <div className="flex-1 min-w-0">{renderResponsable(i)}</div>
              </div>
            </div>
          )}
          empty={<EmptyState icon={Package} title="Sin ítems todavía" description="Agrega lo que hace falta conseguir para el evento." className="py-10" />}
        />
      </Card>

      <div className="space-y-4">
        <Card className="p-4">
          <Eyebrow className="mb-2">Avance</Eyebrow>
          <p className="text-[26px] font-semibold tabular-nums text-ink leading-none mb-2.5">{pct}%</p>
          <ProgressBar value={pct / 100} tone={pct === 100 && total > 0 ? 'success' : 'primary'} />
          <p className="text-[12px] text-ink-muted mt-2">
            {listos} de {total} listos
          </p>
        </Card>
        <Card className="p-4">
          <Eyebrow className="mb-2">Por conseguir</Eyebrow>
          {porConseguir.length === 0 ? (
            <p className="text-[12.5px] text-ink-faint">{total > 0 ? 'Todo listo' : 'Nada pendiente'}</p>
          ) : (
            <ul className="space-y-1.5">
              {porConseguir.map((i) => (
                <li key={i._id} className="flex items-center gap-2 text-[13px] text-ink-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" />
                  {i.nombre}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

// ─── Tareas ─────────────────────────────────────────────────────────────────

function TareasTab({ id }: { id: string }) {
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [loading, setLoading] = useState(true)
  const [titulo, setTitulo] = useState('')
  const [responsable, setResponsable] = useState('')
  const [adding, setAdding] = useState(false)

  const fetchTasks = useCallback(async () => {
    const res = await fetch(`/api/events/${id}/tasks`)
    if (res.ok) setTasks(((await res.json()) as { data: TaskRow[] }).data)
    setLoading(false)
  }, [id])

  useEffect(() => {
    void fetchTasks()
  }, [fetchTasks])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) return
    setAdding(true)
    const res = await fetch(`/api/events/${id}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, responsable: responsable || undefined }),
    })
    setAdding(false)
    if (res.ok) {
      setTitulo('')
      setResponsable('')
      void fetchTasks()
    } else {
      toast.error('No se pudo agregar la tarea')
    }
  }

  async function toggleCompletada(task: TaskRow) {
    setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, completada: !t.completada } : t)))
    const res = await fetch(`/api/events/${id}/tasks/${task._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completada: !task.completada }),
    })
    if (!res.ok) {
      toast.error('No se pudo actualizar la tarea')
      void fetchTasks()
    }
  }

  const pendientes = tasks.filter((t) => !t.completada)
  const hechas = tasks.filter((t) => t.completada)

  function renderTask(task: TaskRow) {
    return (
      <div key={task._id} className="table-row-3d flex items-center gap-3 px-4 md:px-5 py-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={task.completada}
          aria-label={task.completada ? `Marcar «${task.titulo}» como pendiente` : `Marcar «${task.titulo}» como hecha`}
          onClick={() => void toggleCompletada(task)}
          className={cn(
            'press w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0',
            'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20',
            task.completada ? 'bg-success border-success text-white' : 'border-border-input hover:border-primary'
          )}
        >
          {task.completada && <Check className="w-3 h-3" strokeWidth={3} />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={cn('text-[13.5px]', task.completada ? 'line-through text-ink-faint' : 'text-ink')}>{task.titulo}</p>
          {task.responsable && <p className="sm:hidden text-[12px] text-ink-muted mt-0.5">{task.responsable}</p>}
        </div>
        {task.responsable && (
          <span className="hidden sm:flex items-center gap-1.5 text-[12px] text-ink-muted flex-shrink-0">
            <Avatar name={task.responsable} size="xs" />
            {task.responsable}
          </span>
        )}
        {task.fechaLimite && <Badge tone={task.completada ? 'neutral' : 'warning'}>{formatDate(task.fechaLimite)}</Badge>}
      </div>
    )
  }

  return (
    <Card className="overflow-hidden">
      <form onSubmit={(e) => void handleAdd(e)} className="grid grid-cols-1 sm:grid-cols-[1fr_200px_auto] gap-2 p-3 md:p-4 border-b border-border">
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Nueva tarea…" aria-label="Nueva tarea" />
        <Input value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Responsable" aria-label="Responsable" />
        <Button type="submit" loading={adding} disabled={!titulo.trim()} icon={<Plus className="w-4 h-4" strokeWidth={1.8} />}>
          Agregar
        </Button>
      </form>
      {loading ? (
        <div className="divide-y divide-[#F1F2F5]">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <Skeleton className="w-5 h-5 rounded-full" />
              <Skeleton className="h-4 w-64" />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Sin tareas todavía" description="Organiza quién hace qué antes del evento." className="py-10" />
      ) : (
        <>
          <div className="divide-y divide-[#F1F2F5]">
            {pendientes.map(renderTask)}
          </div>
          {hechas.length > 0 && (
            <>
              <p className="px-5 pt-4 pb-2 text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em] border-t border-border bg-surface-muted">
                Completadas · {hechas.length}
              </p>
              <div className="divide-y divide-[#F1F2F5] bg-surface-muted">
                {hechas.map(renderTask)}
              </div>
            </>
          )}
        </>
      )}
    </Card>
  )
}

// ─── Coordinadores ──────────────────────────────────────────────────────────

function CoordinadoresTab({ id, role, event, onUpdated }: { id: string; role: 'admin' | 'coordinador'; event: EventDetail; onUpdated: () => void }) {
  const [allCoordinadores, setAllCoordinadores] = useState<UserLite[]>([])
  const [loading, setLoading] = useState(role === 'admin')
  const [pendingId, setPendingId] = useState<string | null>(null)

  useEffect(() => {
    if (role !== 'admin') return
    async function fetchUsers() {
      const res = await fetch('/api/admin/usuarios')
      if (res.ok) setAllCoordinadores(((await res.json()) as { data: UserLite[] }).data.filter((u) => u.role === 'coordinador'))
      setLoading(false)
    }
    void fetchUsers()
  }, [role])

  const assignedIds = useMemo(() => new Set(event.coordinadoresAsignados.map((c) => c._id)), [event])

  async function toggleAsignacion(userId: string, assigned: boolean) {
    const nextIds = assigned
      ? event.coordinadoresAsignados.filter((c) => c._id !== userId).map((c) => c._id)
      : [...event.coordinadoresAsignados.map((c) => c._id), userId]
    setPendingId(userId)
    const res = await fetch(`/api/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinadoresAsignados: nextIds }),
    })
    setPendingId(null)
    if (res.ok) onUpdated()
    else toast.error('No se pudo actualizar la asignación')
  }

  const list = role === 'admin' ? allCoordinadores : event.coordinadoresAsignados

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Coordinadores del evento"
        description={role === 'admin' ? 'Asigna quién puede ver y gestionar este evento.' : 'Solo un administrador puede cambiar la asignación.'}
      />
      {loading ? (
        <div className="divide-y divide-[#F1F2F5]">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title={role === 'admin' ? 'No hay coordinadores registrados' : 'Sin coordinadores asignados'}
          description={role === 'admin' ? 'Créalos desde la sección Usuarios.' : undefined}
          className="py-10"
        />
      ) : (
        <div className="divide-y divide-[#F1F2F5]">
          {list.map((c) => {
            const assigned = assignedIds.has(c._id)
            return (
              <div key={c._id} className="flex items-center gap-3 px-4 md:px-5 py-3">
                <Avatar name={c.nombre} email={c.email} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium text-ink truncate">{c.nombre}</p>
                  <p className="text-[12px] text-ink-muted truncate">{c.email}</p>
                </div>
                {role === 'admin' ? (
                  <Button
                    size="sm"
                    variant={assigned ? 'secondary' : 'primary'}
                    loading={pendingId === c._id}
                    className={assigned ? 'text-danger hover:bg-danger-tint' : undefined}
                    onClick={() => void toggleAsignacion(c._id, assigned)}
                  >
                    {assigned ? 'Retirar' : 'Asignar'}
                  </Button>
                ) : (
                  <Badge tone="primary">Asignado</Badge>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
