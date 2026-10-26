'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Download, FileText, X } from 'lucide-react'
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  MunicipioBadge,
  ResponsiveTable,
  SearchInput,
  Select,
  type Column,
} from '@/components/admin/ui'
import { MUNICIPIOS } from '@/lib/municipios'

interface Submission {
  _id: string
  cedula: string
  municipio: string
  datos: Record<string, unknown>
  syncedToSheets: boolean
  createdAt: string
  updatedAt: string
}

interface ApiResponse {
  data: Submission[]
  total: number
  page: number
  limit: number
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getNombre(datos: Record<string, unknown>): string {
  const v = datos['q_2']
  return typeof v === 'string' && v ? v : '—'
}

const COLUMNS: Column<Submission>[] = [
  { header: 'Nombre', cell: (r) => <span className="font-medium text-ink">{getNombre(r.datos)}</span> },
  { header: 'Cédula', cell: (r) => <span className="font-mono tabular-nums text-[12.5px] text-ink-muted">{r.cedula}</span> },
  { header: 'Municipio', cell: (r) => <MunicipioBadge municipio={r.municipio} /> },
  { header: 'Actualizado', cell: (r) => <span className="tabular-nums text-ink-muted">{formatDate(r.updatedAt)}</span> },
  {
    header: <span className="sr-only">Abrir</span>,
    className: 'w-10 text-right',
    cell: () => <ChevronRight className="w-4 h-4 text-ink-faint inline" strokeWidth={1.8} />,
  },
]

export default function RegistrosPage() {
  const router = useRouter()

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [q, setQ] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [userMunicipios, setUserMunicipios] = useState<string[]>([...MUNICIPIOS])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const limit = 20

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) return
        const userData = await res.json()
        if (userData.role !== 'admin' && userData.municipios?.length) {
          setUserMunicipios(userData.municipios)
        }
      } catch {
        // si falla, el filtro muestra la lista completa
      }
    }
    void fetchUserInfo()
  }, [])

  const fetchData = useCallback(
    async (currentPage: number) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (q) params.set('q', q)
        if (municipio) params.set('municipio', municipio)
        if (dateFrom) params.set('dateFrom', dateFrom)
        if (dateTo) params.set('dateTo', dateTo)
        params.set('page', String(currentPage))

        const res = await fetch(`/api/admin/registros?${params.toString()}`)
        if (!res.ok) throw new Error('Error al cargar registros')
        const json = (await res.json()) as ApiResponse
        setSubmissions(json.data)
        setTotal(json.total)
      } catch {
        setError('No se pudieron cargar los registros.')
      } finally {
        setLoading(false)
      }
    },
    [q, municipio, dateFrom, dateTo]
  )

  useEffect(() => {
    setPage(1)
  }, [q, municipio, dateFrom, dateTo])

  useEffect(() => {
    void fetchData(page)
  }, [fetchData, page])

  useEffect(() => {
    function handleRefresh() {
      void fetchData(page)
    }
    window.addEventListener('mira:refresh', handleRefresh)
    return () => window.removeEventListener('mira:refresh', handleRefresh)
  }, [fetchData, page])

  function handleSearchChange(value: string) {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setQ(value), 300)
  }

  function clearFilters() {
    setSearchInput('')
    setQ('')
    setMunicipio('')
    setDateFrom('')
    setDateTo('')
  }

  function handleExport() {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (municipio) params.set('municipio', municipio)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    const a = document.createElement('a')
    a.href = `/api/admin/export?${params.toString()}`
    a.download = 'registros.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const hasFilters = Boolean(q || municipio || dateFrom || dateTo)
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const start = total === 0 ? 0 : (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <div className="admin-view">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-[20px] font-semibold text-ink leading-tight tracking-[-0.01em]">Registros</h2>
          <p className="text-[13px] text-ink-muted mt-1">
            {loading ? 'Cargando…' : `${total.toLocaleString('es-CO')} joven${total === 1 ? '' : 'es'}${hasFilters ? ' con estos filtros' : ''}`}
          </p>
        </div>
        <Button icon={<Download className="w-4 h-4" strokeWidth={1.8} />} onClick={handleExport}>
          Exportar CSV
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-2.5 p-3 md:p-4 border-b border-border">
          <SearchInput
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por cédula o nombre…"
            className="flex-1 min-w-0"
          />
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2.5">
            <Select value={municipio} onChange={(e) => setMunicipio(e.target.value)} aria-label="Municipio" className="lg:w-[200px]">
              <option value="">Todos los municipios</option>
              {userMunicipios.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
            <div className="flex items-center h-10 bg-white border border-border-input rounded-field focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/[0.16] transition-[border-color,box-shadow] duration-150">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="Desde"
                className="flex-1 min-w-0 px-3 text-[13px] text-ink outline-none bg-transparent"
              />
              <span className="text-ink-faint text-[12px]">–</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="Hasta"
                className="flex-1 min-w-0 px-3 text-[13px] text-ink outline-none bg-transparent"
              />
            </div>
          </div>
          {hasFilters && (
            <Button variant="ghost" icon={<X className="w-4 h-4" strokeWidth={1.8} />} onClick={clearFilters} className="self-start lg:self-auto">
              Limpiar
            </Button>
          )}
        </div>

        {error ? (
          <ErrorState message={error} onRetry={() => void fetchData(page)} />
        ) : (
          <ResponsiveTable
            rows={submissions}
            columns={COLUMNS}
            rowKey={(r) => r._id}
            loading={loading}
            onRowClick={(r) => router.push(`/admin/registros/${r._id}`)}
            mobileCard={(r) => (
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-ink truncate">{getNombre(r.datos)}</p>
                  <p className="text-[12px] text-ink-muted font-mono tabular-nums mt-0.5">CC {r.cedula}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <MunicipioBadge municipio={r.municipio} />
                    <span className="text-[11.5px] text-ink-faint">{formatDate(r.updatedAt)}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-faint flex-shrink-0" strokeWidth={1.8} />
              </div>
            )}
            empty={
              <EmptyState
                icon={FileText}
                title={hasFilters ? 'Ningún registro coincide' : 'Aún no hay registros'}
                description={hasFilters ? 'Prueba con otra búsqueda o quita algunos filtros.' : 'Cuando los jóvenes llenen la encuesta aparecerán aquí.'}
                action={
                  hasFilters ? (
                    <Button variant="secondary" onClick={clearFilters}>
                      Limpiar filtros
                    </Button>
                  ) : undefined
                }
              />
            }
          />
        )}

        {!loading && !error && total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-5 py-3 border-t border-border">
            <p className="text-[12.5px] tabular-nums text-ink-muted">
              {start}–{end} de {total.toLocaleString('es-CO')}
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                icon={<ChevronLeft className="w-4 h-4" strokeWidth={1.8} />}
              >
                <span className="hidden sm:inline">Anterior</span>
              </Button>
              <span className="text-[12.5px] tabular-nums text-ink-muted px-2">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="w-4 h-4" strokeWidth={1.8} />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
