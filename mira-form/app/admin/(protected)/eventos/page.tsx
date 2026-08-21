'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, ChevronRight, MapPin } from 'lucide-react'
import { getInitials } from '@/lib/initials'

interface Coordinador {
  _id: string
  nombre: string
  email: string
}

interface EventRow {
  _id: string
  nombre: string
  lugar: string
  fecha: string
  estado: 'borrador' | 'publicado' | 'cerrado'
  capacidadMaxima?: number
  coordinadoresAsignados: Coordinador[]
  inscritos: number
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function EstadoBadge({ estado }: { estado: EventRow['estado'] }) {
  const styles: Record<EventRow['estado'], { bg: string; text: string; label: string }> = {
    publicado: { bg: 'bg-success-tint', text: 'text-success', label: 'Publicado' },
    borrador: { bg: 'bg-canvas', text: 'text-ink-faint', label: 'Borrador' },
    cerrado: { bg: 'bg-danger-tint', text: 'text-danger', label: 'Cerrado' },
  }
  const s = styles[estado]
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[1.7fr_1fr_0.8fr_auto] items-center gap-4 px-[22px] py-[16px] border-b border-border">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-4 bg-zinc-100 rounded animate-pulse" />
      ))}
    </div>
  )
}

export default function EventosPage() {
  const router = useRouter()

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
        if (res.ok) {
          const userData = await res.json()
          setRole(userData.role || 'admin')
        }
      } catch {
        // el rol simplemente queda en el valor por defecto
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
      if (!res.ok) throw new Error('Error al cargar eventos')
      const json = (await res.json()) as { data: EventRow[] }
      setEvents(json.data)
    } catch {
      setError('No se pudieron cargar los eventos.')
    } finally {
      setLoading(false)
    }
  }, [q, estado])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  function handleSearchChange(value: string) {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setQ(value), 300)
  }

  return (
    <div className="admin-view">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-[17px] font-semibold text-ink">Eventos</h2>
          <p className="text-[13px] text-ink-muted">
            {role === 'admin'
              ? 'Todos los eventos de juventudes'
              : 'Solo los eventos creados por ti o donde estás asignada'}
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/eventos/nuevo')}
          className="btn-primary-3d flex items-center gap-2 px-4 py-2.5 text-[13.5px] text-white rounded-field font-medium"
        >
          <Plus className="w-4 h-4" strokeWidth={1.8} />
          Crear evento
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 my-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none"
            strokeWidth={1.8}
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por nombre o lugar..."
            className="w-full pl-10 pr-3.5 py-2.5 text-[13.5px] bg-white border border-border-input rounded-field outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.16] transition-[border-color,box-shadow] duration-150"
          />
        </div>

        <div className="relative">
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="appearance-none bg-white pl-3.5 pr-9 py-2.5 text-[13.5px] text-ink border border-border-input rounded-field outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.16] transition-[border-color,box-shadow] duration-150"
          >
            <option value="">Todos los estados</option>
            <option value="borrador">Borrador</option>
            <option value="publicado">Publicado</option>
            <option value="cerrado">Cerrado</option>
          </select>
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-faint pointer-events-none"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Rows */}
      <div className="bg-surface rounded-card border border-border shadow-card overflow-hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
        ) : error ? (
          <div className="px-[22px] py-12 text-center">
            <p className="text-sm text-ink-muted mb-3">{error}</p>
            <button onClick={() => void fetchData()} className="text-sm text-primary hover:underline">
              Reintentar
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="px-[22px] py-12 text-center">
            <p className="text-sm text-ink-muted">No hay eventos todavía</p>
          </div>
        ) : (
          events.map((event, i) => (
            <div
              key={event._id}
              onClick={() => router.push(`/admin/eventos/${event._id}`)}
              className="animate-riseIn grid grid-cols-[1.7fr_1fr_0.8fr_auto] items-center gap-4 px-[22px] py-[16px] border-b border-border last:border-b-0 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated hover:z-10 relative"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <EstadoBadge estado={event.estado} />
                  <span className="font-mono text-[12px] text-ink-muted">{formatDate(event.fecha)}</span>
                </div>
                <p className="text-[14.5px] font-semibold text-ink truncate">{event.nombre}</p>
                <p className="text-[12.5px] text-ink-muted flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" strokeWidth={1.8} />
                  {event.lugar}
                </p>
              </div>

              <div className="flex items-center -space-x-2">
                {event.coordinadoresAsignados.slice(0, 4).map((c) => (
                  <div
                    key={c._id}
                    title={c.nombre}
                    className="w-7 h-7 rounded-full bg-primary-tint border-2 border-white flex items-center justify-center text-[10.5px] font-semibold text-primary"
                  >
                    {getInitials(c.nombre, c.email)}
                  </div>
                ))}
                {event.coordinadoresAsignados.length === 0 && (
                  <span className="text-[12.5px] text-ink-faint">Sin coordinadores</span>
                )}
              </div>

              <div>
                <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em] mb-0.5">Cupos</p>
                <p className="font-mono text-[13.5px] tabular-nums text-ink">
                  {event.inscritos}
                  {event.capacidadMaxima ? ` / ${event.capacidadMaxima}` : ''}
                </p>
              </div>

              <ChevronRight className="w-4 h-4 text-ink-faint" strokeWidth={1.8} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
