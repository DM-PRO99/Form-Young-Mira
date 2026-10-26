'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CalendarClock, CalendarDays, ChevronRight, MapPin, Plus, Send, Trash2, Users } from 'lucide-react'
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  KpiCard,
  PageHeader,
  SearchInput,
  Select,
  Skeleton,
  useConfirm,
} from '@/components/admin/ui'
import { DateTile, EventEstadoBadge, formatEventDate, type EventEstado } from './_shared'

interface Coordinador {
  _id: string
  nombre: string
  email: string
}

interface EventRow {
  _id: string
  nombre: string
  lugar: string
  fechas: string[]
  estado: EventEstado
  capacidadMaxima?: number
  coordinadoresAsignados: Coordinador[]
  inscritos: number
}

function CupoBar({ inscritos, capacidad }: { inscritos: number; capacidad?: number }) {
  if (!capacidad) {
    return (
      <p className="text-[12.5px] text-ink-muted">
        <span className="font-medium text-ink tabular-nums">{inscritos}</span> inscritos
      </p>
    )
  }
  const pct = Math.min(inscritos / capacidad, 1)
  return (
    <div className="w-full">
      <p className="text-[12.5px] text-ink-muted mb-1">
        <span className="font-medium text-ink tabular-nums">{inscritos}</span> / {capacidad}
      </p>
      <div className="h-1 bg-canvas rounded-full overflow-hidden">
        <div className={'progress-fill h-full w-full rounded-full ' + (pct >= 1 ? 'bg-danger' : 'bg-primary')} style={{ transform: `scaleX(${pct})` }} />
      </div>
    </div>
  )
}

export default function EventosPage() {
  const router = useRouter()
  const confirm = useConfirm()

  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<'admin' | 'coordinador'>('admin')

  const [searchInput, setSearchInput] = useState('')
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState('')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) setRole((await res.json()).role || 'admin')
      } catch {
        // el rol queda en el valor por defecto
      }
    }
    void fetchUserInfo()
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (estado) params.set('estado', estado)
      const res = await fetch(`/api/events?${params.toString()}`)
      if (!res.ok) throw new Error()
      setEvents(((await res.json()) as { data: EventRow[] }).data)
    } catch {
      setError('No se pudieron cargar los eventos.')
    } finally {
      setLoading(false)
    }
  }, [q, estado])

  useEffect(() => {
    void fetchData()
    function handleRefresh() {
      void fetchData()
    }
    window.addEventListener('mira:refresh', handleRefresh)
    return () => window.removeEventListener('mira:refresh', handleRefresh)
  }, [fetchData])

  function handleSearchChange(value: string) {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setQ(value), 300)
  }

  async function handleDelete(e: React.MouseEvent, event: EventRow) {
    e.stopPropagation()
    const ok = await confirm({
      title: 'Eliminar evento',
      description: (
        <>
          Se eliminará <span className="font-medium text-ink">{event.nombre}</span> junto con sus inscripciones, inventario y tareas. Esta acción no
          se puede deshacer.
        </>
      ),
      confirmLabel: 'Eliminar evento',
    })
    if (!ok) return
    const res = await fetch(`/api/events/${event._id}`, { method: 'DELETE' })
    if (res.ok) {
      setEvents((prev) => prev.filter((ev) => ev._id !== event._id))
      toast.success('Evento eliminado')
    } else {
      toast.error('No se pudo eliminar el evento')
    }
  }

  const hasFilters = Boolean(q || estado)
  const now = Date.now()
  const proximos = events.filter((e) => e.fechas.some((f) => new Date(f).getTime() >= now)).length
  const totalInscritos = events.reduce((s, e) => s + e.inscritos, 0)

  return (
    <div className="admin-view">
      <PageHeader
        title="Eventos"
        description={role === 'admin' ? 'Todos los eventos de juventudes' : 'Los eventos que creaste o donde estás asignado'}
        actions={
          <Button icon={<Plus className="w-4 h-4" strokeWidth={1.8} />} onClick={() => router.push('/admin/eventos/nuevo')}>
            Crear evento
          </Button>
        }
      />

      {!loading && !error && events.length > 0 && !hasFilters && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-5">
          <KpiCard label="Eventos" icon={CalendarDays} tone="primary" value={events.length} />
          <KpiCard label="Publicados" icon={Send} tone="success" value={events.filter((e) => e.estado === 'publicado').length} />
          <KpiCard label="Próximos" icon={CalendarClock} tone="violet" value={proximos} />
          <KpiCard label="Inscritos" icon={Users} tone="warning" value={totalInscritos.toLocaleString('es-CO')} />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
        <SearchInput value={searchInput} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Buscar por nombre o lugar…" className="flex-1" />
        <Select value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Estado" className="sm:w-[200px]">
          <option value="">Todos los estados</option>
          <option value="borrador">Borrador</option>
          <option value="publicado">Publicado</option>
          <option value="cerrado">Cerrado</option>
        </Select>
      </div>

      <Card>
        {loading ? (
          <div className="divide-y divide-[#F1F2F5]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="w-12 h-14 rounded-[10px]" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={() => void fetchData()} />
        ) : events.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={hasFilters ? 'Ningún evento coincide' : 'Aún no hay eventos'}
            description={hasFilters ? 'Prueba con otra búsqueda o cambia el estado.' : 'Crea un evento para generar el enlace de inscripción.'}
            action={
              !hasFilters && (
                <Button icon={<Plus className="w-4 h-4" strokeWidth={1.8} />} onClick={() => router.push('/admin/eventos/nuevo')}>
                  Crear evento
                </Button>
              )
            }
          />
        ) : (
          <div className="divide-y divide-[#F1F2F5]">
            {events.map((event, i) => (
              <div key={event._id} className="animate-riseIn first:rounded-t-card last:rounded-b-card" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                <div
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/admin/eventos/${event._id}`)}
                  onKeyDown={(e) => e.key === 'Enter' && router.push(`/admin/eventos/${event._id}`)}
                  className="table-row-3d group flex items-center gap-3 md:gap-4 p-4 cursor-pointer focus-visible:outline-none focus-visible:bg-[#F7F9FF]"
                >
                  <DateTile iso={event.fechas[0]} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-[14.5px] font-semibold text-ink truncate">{event.nombre}</p>
                      <EventEstadoBadge estado={event.estado} />
                    </div>
                    <p className="flex items-center gap-x-3 gap-y-0.5 flex-wrap text-[12.5px] text-ink-muted">
                      <span className="flex items-center gap-1 min-w-0">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.8} />
                        <span className="truncate">{event.lugar}</span>
                      </span>
                      <span className="tabular-nums">
                        {formatEventDate(event.fechas[0])}
                        {event.fechas.length > 1 && ` · +${event.fechas.length - 1} fecha${event.fechas.length > 2 ? 's' : ''}`}
                      </span>
                    </p>
                    <div className="md:hidden mt-2.5 max-w-[220px]">
                      <CupoBar inscritos={event.inscritos} capacidad={event.capacidadMaxima} />
                    </div>
                  </div>

                  <div className="hidden lg:flex items-center -space-x-2 w-[92px]">
                    {event.coordinadoresAsignados.slice(0, 3).map((c) => (
                      <Avatar key={c._id} name={c.nombre} email={c.email} size="sm" className="ring-2 ring-white" />
                    ))}
                    {event.coordinadoresAsignados.length > 3 && (
                      <span className="w-8 h-8 rounded-full bg-canvas ring-2 ring-white flex items-center justify-center text-[11px] font-semibold text-ink-muted">
                        +{event.coordinadoresAsignados.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="hidden md:block w-[140px]">
                    <CupoBar inscritos={event.inscritos} capacidad={event.capacidadMaxima} />
                  </div>

                  <IconButton label="Eliminar evento" tone="danger" onClick={(e) => void handleDelete(e, event)}>
                    <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                  </IconButton>
                  <ChevronRight className="hidden sm:block w-4 h-4 text-ink-faint flex-shrink-0" strokeWidth={1.8} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
