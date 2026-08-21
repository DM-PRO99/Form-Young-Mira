'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  Search,
  Download,
  Plus,
  Trash2,
  Package,
  ListChecks,
  Users,
} from 'lucide-react'
import { getInitials } from '@/lib/initials'

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
  fecha: string
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
  edad?: number
  estado: 'pendiente' | 'confirmado' | 'cancelado'
  createdAt: string
}

interface InventoryRow {
  _id: string
  nombre: string
  cantidad?: string
  responsableId?: UserLite
  estado: 'pendiente' | 'comprado' | 'conseguido'
  notas?: string
}

interface TaskRow {
  _id: string
  titulo: string
  responsableId?: UserLite
  fechaLimite?: string
  completada: boolean
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

const ESTADO_BADGE: Record<RegistrationRow['estado'], string> = {
  confirmado: 'bg-success-tint text-success',
  pendiente: 'bg-warning-tint text-warning',
  cancelado: 'bg-danger-tint text-danger',
}

const INVENTORY_NEXT: Record<InventoryRow['estado'], InventoryRow['estado']> = {
  pendiente: 'comprado',
  comprado: 'conseguido',
  conseguido: 'pendiente',
}

const INVENTORY_BADGE: Record<InventoryRow['estado'], { cls: string; label: string }> = {
  pendiente: { cls: 'bg-warning-tint text-warning', label: 'Pendiente' },
  comprado: { cls: 'bg-primary-tint text-primary', label: 'Comprado' },
  conseguido: { cls: 'bg-success-tint text-success', label: 'Conseguido' },
}

export default function EventoDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const [role, setRole] = useState<'admin' | 'coordinador'>('coordinador')
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('resumen')
  const [copied, setCopied] = useState(false)

  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/inscribirse/${id}` : ''

  const fetchEvent = useCallback(async () => {
    const res = await fetch(`/api/events/${id}`)
    if (res.ok) {
      const json = (await res.json()) as { data: EventDetail }
      setEvent(json.data)
    }
  }, [id])

  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const meRes = await fetch('/api/auth/me')
        if (meRes.ok) {
          const me = await meRes.json()
          setRole(me.role || 'coordinador')
        }
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

  if (loading) {
    return <div className="admin-view py-16 text-center text-ink-muted text-sm">Cargando evento...</div>
  }

  if (!event) {
    return <div className="admin-view py-16 text-center text-ink-muted text-sm">Evento no encontrado o sin acceso.</div>
  }

  const tabs: { key: Tab; label: string; icon: typeof Package }[] = [
    { key: 'resumen', label: 'Resumen', icon: ListChecks },
    { key: 'inscripciones', label: 'Inscripciones', icon: Users },
    { key: 'inventario', label: 'Inventario', icon: Package },
    { key: 'tareas', label: 'Tareas', icon: ListChecks },
    { key: 'coordinadores', label: 'Coordinadores', icon: Users },
  ]

  return (
    <div className="admin-view">
      <Link
        href="/admin/eventos"
        className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-primary transition-transform duration-150 hover:-translate-x-0.5 mb-3"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.8} />
        Volver a eventos
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
        <div>
          <h2 className="text-[19px] font-semibold text-ink mb-1">{event.nombre}</h2>
          <p className="text-[13px] text-ink-muted font-mono">
            {formatDate(event.fecha)} · {event.lugar}
            {event.capacidadMaxima ? ` · cupo ${event.capacidadMaxima}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-tint text-success text-[11.5px] font-medium">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-50 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
            </span>
            En vivo · actualiza cada 20 s
          </div>
          <a
            href={`/inscribirse/${id}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-ink border border-border-input rounded-field bg-white hover:bg-canvas transition-colors duration-150"
          >
            <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.8} />
            Ver formulario
          </a>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-white btn-primary-3d rounded-field"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado' : 'Copiar enlace'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-5 border-b border-border mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              'relative pb-3 text-[13.5px] font-medium transition-colors duration-150 ' +
              (tab === t.key ? 'text-primary' : 'text-ink-muted hover:text-ink')
            }
          >
            {t.label}
            {tab === t.key && <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-primary rounded-full" />}
          </button>
        ))}
      </div>

      {tab === 'resumen' && <ResumenTab id={id} event={event} publicUrl={publicUrl} />}
      {tab === 'inscripciones' && <InscripcionesTab id={id} />}
      {tab === 'inventario' && <InventarioTab id={id} />}
      {tab === 'tareas' && <TareasTab id={id} />}
      {tab === 'coordinadores' && (
        <CoordinadoresTab id={id} role={role} event={event} onUpdated={fetchEvent} />
      )}
    </div>
  )
}

// ─── Resumen ────────────────────────────────────────────────────────────────

function ResumenTab({ id, event, publicUrl }: { id: string; event: EventDetail; publicUrl: string }) {
  const [summary, setSummary] = useState<Summary | null>(null)

  const fetchSummary = useCallback(async () => {
    const res = await fetch(`/api/events/${id}/summary`)
    if (res.ok) {
      const json = (await res.json()) as { data: Summary }
      setSummary(json.data)
    }
  }, [id])

  useEffect(() => {
    void fetchSummary()
    const interval = setInterval(() => void fetchSummary(), 20000)
    return () => clearInterval(interval)
  }, [fetchSummary])

  if (!summary) return <div className="text-sm text-ink-muted">Cargando resumen...</div>

  const cupoPct =
    summary.capacidadMaxima && summary.capacidadMaxima > 0
      ? Math.min(100, Math.round((summary.inscritos / summary.capacidadMaxima) * 100))
      : null

  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_320px] gap-5 kpi-perspective">
      <div className="kpi-card col-span-1 bg-surface rounded-card border border-border shadow-card p-5">
        <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em] mb-2">Inscritos</p>
        <p className="text-[34px] font-semibold font-mono text-primary leading-none mb-2">{summary.inscritos}</p>
        {summary.capacidadMaxima ? (
          <>
            <p className="text-[12.5px] text-ink-muted mb-2">
              de {summary.capacidadMaxima} cupos · quedan {summary.cuposDisponibles}
            </p>
            <div className="h-1.5 bg-canvas rounded-full overflow-hidden">
              <div
                className="chart-bar h-full bg-primary rounded-full"
                style={{ width: `${cupoPct}%`, transformOrigin: 'left' }}
              />
            </div>
          </>
        ) : (
          <p className="text-[12.5px] text-ink-muted">Cupo ilimitado</p>
        )}
      </div>

      <div className="kpi-card col-span-1 bg-surface rounded-card border border-border shadow-card p-5">
        <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em] mb-2">Inventario</p>
        <p className="text-[34px] font-semibold font-mono text-ink leading-none mb-2">{summary.inventario.porcentaje}%</p>
        <p className="text-[12.5px] text-ink-muted">
          {summary.inventario.conseguidos} / {summary.inventario.total} ítems listos
        </p>
      </div>

      <div className="kpi-card col-span-1 bg-surface rounded-card border border-border shadow-card p-5">
        <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em] mb-2">Tareas</p>
        <p className="text-[34px] font-semibold font-mono text-ink leading-none mb-2">
          {summary.tareas.completadas}/{summary.tareas.total}
        </p>
        <p className="text-[12.5px] text-ink-muted">completadas</p>
      </div>

      <div className="space-y-3">
        <div className="bg-primary-tint rounded-card p-4">
          <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.08em] mb-1.5">Enlace de inscripción</p>
          <p className="font-mono text-[11.5px] text-primary truncate">{publicUrl}</p>
        </div>
        <div className="bg-surface rounded-card border border-border shadow-card p-4">
          <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em] mb-2">Coordinadores</p>
          {event.coordinadoresAsignados.length === 0 ? (
            <p className="text-[12.5px] text-ink-faint">Sin coordinadores asignados</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {event.coordinadoresAsignados.map((c) => (
                <span key={c._id} className="text-[12px] px-2 py-1 rounded-full bg-canvas text-ink-muted">
                  {c.nombre}
                </span>
              ))}
            </div>
          )}
          <p className="text-[11.5px] text-ink-faint mt-3">Esta información es interna y no se comparte públicamente.</p>
        </div>
      </div>

      <div className="col-span-3 bg-surface rounded-card border border-border shadow-card overflow-hidden">
        <div className="px-[22px] py-3.5 border-b border-border">
          <p className="text-[13px] font-semibold text-ink">Últimas inscripciones</p>
        </div>
        {summary.ultimasInscripciones.length === 0 ? (
          <p className="px-[22px] py-8 text-center text-[13px] text-ink-muted">Aún no hay inscripciones</p>
        ) : (
          summary.ultimasInscripciones.map((r) => (
            <div key={r._id} className="table-row-3d flex items-center justify-between px-[22px] py-3 border-b border-border last:border-b-0">
              <div>
                <p className="text-[13.5px] text-ink">{r.nombreCompleto}</p>
                <p className="font-mono text-[12px] text-ink-muted">{r.cedula}</p>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ESTADO_BADGE[r.estado]}`}>
                {r.estado}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Inscripciones ──────────────────────────────────────────────────────────

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
    if (res.ok) {
      const json = (await res.json()) as { data: RegistrationRow[] }
      setRows(json.data)
    }
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
    const header = ['Cedula', 'Nombre', 'Telefono', 'Correo', 'Edad', 'Estado']
    const lines = rows.map((r) =>
      [r.cedula, r.nombreCompleto, r.telefono, r.correo ?? '', r.edad ?? '', r.estado]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
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
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" strokeWidth={1.8} />
          <input
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por cédula o nombre..."
            className="w-full pl-10 pr-3.5 py-2.5 text-[13.5px] bg-white border border-border-input rounded-field outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.16] transition-[border-color,box-shadow] duration-150"
          />
        </div>
        <p className="text-[13px] text-ink-muted flex-shrink-0">{rows.length} registros</p>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3.5 py-2.5 text-[13px] font-medium text-ink border border-border-input rounded-field bg-white hover:bg-canvas transition-colors duration-150 flex-shrink-0"
        >
          <Download className="w-4 h-4" strokeWidth={1.8} />
          Exportar CSV
        </button>
      </div>

      <div className="bg-surface rounded-card border border-border shadow-card overflow-hidden overflow-x-auto">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="bg-[#FAFBFC] border-b border-border">
              {['Cédula', 'Nombre', 'Teléfono', 'Correo', 'Edad', 'Estado'].map((h) => (
                <th key={h} className="px-[22px] py-[14px] text-left text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F2F5]">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-[22px] py-8 text-center text-ink-muted">Cargando...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-[22px] py-8 text-center text-ink-muted">No hay inscripciones</td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r._id} className="table-row-3d">
                  <td className="px-[22px] py-[14px] font-mono text-[12.5px] text-ink">{r.cedula}</td>
                  <td className="px-[22px] py-[14px] text-ink">{r.nombreCompleto}</td>
                  <td className="px-[22px] py-[14px] font-mono text-[12.5px] text-ink">{r.telefono}</td>
                  <td className="px-[22px] py-[14px] text-ink-muted">{r.correo ?? '—'}</td>
                  <td className="px-[22px] py-[14px] font-mono text-ink-muted">{r.edad ?? '—'}</td>
                  <td className="px-[22px] py-[14px]">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ESTADO_BADGE[r.estado]}`}>
                      {r.estado}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Inventario ─────────────────────────────────────────────────────────────

function InventarioTab({ id }: { id: string }) {
  const [items, setItems] = useState<InventoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [nombre, setNombre] = useState('')
  const [cantidad, setCantidad] = useState('')

  const fetchItems = useCallback(async () => {
    const res = await fetch(`/api/events/${id}/inventory`)
    if (res.ok) {
      const json = (await res.json()) as { data: InventoryRow[] }
      setItems(json.data)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    void fetchItems()
  }, [fetchItems])

  async function handleAdd() {
    if (!nombre.trim()) return
    const res = await fetch(`/api/events/${id}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, cantidad: cantidad || undefined }),
    })
    if (res.ok) {
      setNombre('')
      setCantidad('')
      void fetchItems()
    } else {
      toast.error('No se pudo agregar el ítem')
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

  async function handleDelete(itemId: string) {
    const res = await fetch(`/api/events/${id}/inventory/${itemId}`, { method: 'DELETE' })
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i._id !== itemId))
    } else {
      toast.error('No se pudo eliminar el ítem')
    }
  }

  const total = items.length
  const listos = items.filter((i) => i.estado !== 'pendiente').length
  const pct = total > 0 ? Math.round((listos / total) * 100) : 0
  const porConseguir = items.filter((i) => i.estado === 'pendiente')

  return (
    <div className="grid grid-cols-[1fr_280px] gap-5">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del ítem (ej. Cartulinas de colores)"
            className="flex-1 px-3.5 py-2.5 text-[13.5px] bg-white border border-border-input rounded-field outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.16] transition-[border-color,box-shadow] duration-150"
          />
          <input
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            placeholder="Cantidad (ej. 30 pliegos)"
            className="w-48 px-3.5 py-2.5 text-[13.5px] bg-white border border-border-input rounded-field outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.16] transition-[border-color,box-shadow] duration-150"
          />
          <button onClick={handleAdd} className="flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium text-white btn-primary-3d rounded-field flex-shrink-0">
            <Plus className="w-4 h-4" strokeWidth={1.8} />
            Agregar
          </button>
        </div>

        <div className="bg-surface rounded-card border border-border shadow-card overflow-hidden">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="bg-[#FAFBFC] border-b border-border">
                {['Ítem', 'Cantidad', 'Responsable', 'Estado', ''].map((h) => (
                  <th key={h} className="px-[22px] py-[14px] text-left text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F2F5]">
              {loading ? (
                <tr><td colSpan={5} className="px-[22px] py-8 text-center text-ink-muted">Cargando...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="px-[22px] py-8 text-center text-ink-muted">Sin ítems todavía</td></tr>
              ) : (
                items.map((item) => {
                  const badge = INVENTORY_BADGE[item.estado]
                  return (
                    <tr key={item._id} className="table-row-3d">
                      <td className="px-[22px] py-[14px] text-ink">{item.nombre}</td>
                      <td className="px-[22px] py-[14px] text-ink-muted font-mono text-[12.5px]">{item.cantidad ?? '—'}</td>
                      <td className="px-[22px] py-[14px]">
                        {item.responsableId ? (
                          <span className="inline-flex items-center gap-1.5 text-ink-muted">
                            <span className="w-5 h-5 rounded-full bg-primary-tint text-primary text-[9px] font-semibold flex items-center justify-center">
                              {getInitials(item.responsableId.nombre, item.responsableId.email)}
                            </span>
                            {item.responsableId.nombre}
                          </span>
                        ) : (
                          <span className="text-ink-faint">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-[22px] py-[14px]">
                        <button
                          onClick={() => void cycleEstado(item)}
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full transition-opacity duration-150 hover:opacity-80 ${badge.cls}`}
                        >
                          {badge.label}
                        </button>
                      </td>
                      <td className="px-[22px] py-[14px]">
                        <button onClick={() => void handleDelete(item._id)} className="text-ink-faint hover:text-danger transition-colors duration-150">
                          <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-surface rounded-card border border-border shadow-card p-4">
          <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em] mb-2">Avance</p>
          <p className="text-[26px] font-semibold font-mono text-ink mb-2">{pct}%</p>
          <div className="h-1.5 bg-canvas rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full transition-[width] duration-[450ms]" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="bg-surface rounded-card border border-border shadow-card p-4">
          <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em] mb-2">Por conseguir</p>
          {porConseguir.length === 0 ? (
            <p className="text-[12.5px] text-ink-faint">Todo listo</p>
          ) : (
            <ul className="space-y-1.5">
              {porConseguir.map((i) => (
                <li key={i._id} className="text-[13px] text-ink-muted">
                  {i.nombre}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tareas ─────────────────────────────────────────────────────────────────

function TareasTab({ id }: { id: string }) {
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [loading, setLoading] = useState(true)
  const [titulo, setTitulo] = useState('')

  const fetchTasks = useCallback(async () => {
    const res = await fetch(`/api/events/${id}/tasks`)
    if (res.ok) {
      const json = (await res.json()) as { data: TaskRow[] }
      setTasks(json.data)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    void fetchTasks()
  }, [fetchTasks])

  async function handleAdd() {
    if (!titulo.trim()) return
    const res = await fetch(`/api/events/${id}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo }),
    })
    if (res.ok) {
      setTitulo('')
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

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Nueva tarea..."
          className="flex-1 px-3.5 py-2.5 text-[13.5px] bg-white border border-border-input rounded-field outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.16] transition-[border-color,box-shadow] duration-150"
        />
        <button onClick={handleAdd} className="flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium text-white btn-primary-3d rounded-field flex-shrink-0">
          <Plus className="w-4 h-4" strokeWidth={1.8} />
          Agregar
        </button>
      </div>

      <div className="bg-surface rounded-card border border-border shadow-card overflow-hidden">
        {loading ? (
          <p className="px-[22px] py-8 text-center text-[13px] text-ink-muted">Cargando...</p>
        ) : tasks.length === 0 ? (
          <p className="px-[22px] py-8 text-center text-[13px] text-ink-muted">Sin tareas todavía</p>
        ) : (
          tasks.map((task) => (
            <div key={task._id} className="table-row-3d flex items-center gap-3 px-[22px] py-3.5 border-b border-border last:border-b-0">
              <input
                type="checkbox"
                checked={task.completada}
                onChange={() => void toggleCompletada(task)}
                className="w-4 h-4 rounded border-border-input accent-primary flex-shrink-0"
              />
              <p className={'flex-1 text-[13.5px] ' + (task.completada ? 'line-through text-ink-faint' : 'text-ink')}>
                {task.titulo}
              </p>
              {task.responsableId && (
                <span className="text-[12px] text-ink-muted flex-shrink-0">{task.responsableId.nombre}</span>
              )}
              {task.fechaLimite && (
                <span
                  className={
                    'text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ' +
                    (task.completada ? 'bg-canvas text-ink-faint' : 'bg-warning-tint text-warning')
                  }
                >
                  {formatDate(task.fechaLimite)}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Coordinadores ──────────────────────────────────────────────────────────

function CoordinadoresTab({
  id,
  role,
  event,
  onUpdated,
}: {
  id: string
  role: 'admin' | 'coordinador'
  event: EventDetail
  onUpdated: () => void
}) {
  const [allCoordinadores, setAllCoordinadores] = useState<UserLite[]>([])
  const [loading, setLoading] = useState(role === 'admin')

  useEffect(() => {
    if (role !== 'admin') return
    async function fetchUsers() {
      const res = await fetch('/api/admin/usuarios')
      if (res.ok) {
        const json = (await res.json()) as { data: UserLite[] }
        setAllCoordinadores(json.data.filter((u) => u.role === 'coordinador'))
      }
      setLoading(false)
    }
    void fetchUsers()
  }, [role])

  const assignedIds = useMemo(() => new Set(event.coordinadoresAsignados.map((c) => c._id)), [event])

  async function toggleAsignacion(userId: string, assigned: boolean) {
    const nextIds = assigned
      ? event.coordinadoresAsignados.filter((c) => c._id !== userId).map((c) => c._id)
      : [...event.coordinadoresAsignados.map((c) => c._id), userId]

    const res = await fetch(`/api/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinadoresAsignados: nextIds }),
    })
    if (res.ok) {
      onUpdated()
    } else {
      toast.error('No se pudo actualizar la asignación')
    }
  }

  if (role !== 'admin') {
    return (
      <div className="bg-surface rounded-card border border-border shadow-card overflow-hidden">
        {event.coordinadoresAsignados.length === 0 ? (
          <p className="px-[22px] py-8 text-center text-[13px] text-ink-muted">Sin coordinadores asignados</p>
        ) : (
          event.coordinadoresAsignados.map((c) => (
            <div key={c._id} className="flex items-center justify-between px-[22px] py-3.5 border-b border-border last:border-b-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary-tint text-primary text-[11px] font-semibold flex items-center justify-center">
                  {getInitials(c.nombre, c.email)}
                </div>
                <div>
                  <p className="text-[13.5px] text-ink">{c.nombre}</p>
                  <p className="text-[12px] text-ink-muted">{c.email}</p>
                </div>
              </div>
              <button disabled title="Solo el superadministrador puede asignar coordinadores" className="text-[12.5px] text-ink-faint cursor-not-allowed">
                Asignar / Retirar
              </button>
            </div>
          ))
        )}
        <p className="px-[22px] py-3 text-[12px] text-ink-faint border-t border-border">
          Solo el superadministrador puede asignar coordinadores.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-card border border-border shadow-card overflow-hidden">
      {loading ? (
        <p className="px-[22px] py-8 text-center text-[13px] text-ink-muted">Cargando...</p>
      ) : allCoordinadores.length === 0 ? (
        <p className="px-[22px] py-8 text-center text-[13px] text-ink-muted">No hay coordinadores registrados</p>
      ) : (
        allCoordinadores.map((c) => {
          const assigned = assignedIds.has(c._id)
          return (
            <div key={c._id} className="flex items-center justify-between px-[22px] py-3.5 border-b border-border last:border-b-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary-tint text-primary text-[11px] font-semibold flex items-center justify-center">
                  {getInitials(c.nombre, c.email)}
                </div>
                <div>
                  <p className="text-[13.5px] text-ink">{c.nombre}</p>
                  <p className="text-[12px] text-ink-muted">{c.email}</p>
                </div>
              </div>
              <button
                onClick={() => void toggleAsignacion(c._id, assigned)}
                className={
                  'text-[12.5px] font-medium px-3 py-1.5 rounded-field transition-colors duration-150 ' +
                  (assigned ? 'text-danger border border-danger/30 hover:bg-danger-tint' : 'text-primary border border-primary/30 hover:bg-primary-tint')
                }
              >
                {assigned ? 'Retirar' : 'Asignar'}
              </button>
            </div>
          )
        })
      )}
    </div>
  )
}
