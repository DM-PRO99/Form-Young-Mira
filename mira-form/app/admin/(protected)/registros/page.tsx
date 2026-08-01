'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { municipioColor } from '@/lib/municipioColors'

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

const MUNICIPIOS = [
  'Itagüí',
  'Sabaneta',
  'San Antonio de Prado',
  'La Estrella',
  'Medellín',
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getNombre(datos: Record<string, unknown>): string {
  const v = datos['q_2']
  return typeof v === 'string' && v ? v : '—'
}

function MunicipioChip({ municipio }: { municipio: string }) {
  const { bg, text } = municipioColor(municipio)
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: bg, color: text }}
    >
      {municipio}
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-[22px] py-[14px]">
          <div className="h-4 bg-zinc-100 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

export default function RegistrosPage() {
  const router = useRouter()

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'admin' | 'coordinador'>('admin')
  const [userId, setUserId] = useState<string>('')

  const [searchInput, setSearchInput] = useState('')
  const [q, setQ] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const limit = 20

  const [userMunicipios, setUserMunicipios] = useState<string[]>(MUNICIPIOS)

  // Obtener información del usuario desde el layout
  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const userData = await res.json()
          setUserRole(userData.role || 'admin')
          setUserId(userData.id || '')

          if (userData.role !== 'admin') {
            setUserMunicipios(
              userData.municipios?.length ? userData.municipios : MUNICIPIOS
            )
          }
        }
      } catch (error) {
        console.error('Error al obtener información del usuario:', error)
      }
    }
    fetchUserInfo()
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

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const start = total === 0 ? 0 : (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <div className="admin-view">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none"
            strokeWidth={1.8}
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por cédula o nombre..."
            className="w-full pl-10 pr-3.5 py-2.5 text-[13.5px] bg-white border border-border-input rounded-field outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.16] transition-[border-color,box-shadow] duration-150"
          />
        </div>

        {/* Municipio select — chevron SVG inline (no data-uri) */}
        <div className="relative">
          <select
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
            className="appearance-none bg-white pl-3.5 pr-9 py-2.5 text-[13.5px] text-ink border border-border-input rounded-field outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/[0.16] transition-[border-color,box-shadow] duration-150"
          >
            <option value="">Todos los municipios</option>
            {userMunicipios.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-faint pointer-events-none"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M6 8l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Date range — un solo contenedor con divisor */}
        <div className="flex items-center bg-white border border-border-input rounded-field focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/[0.16] transition-[border-color,box-shadow] duration-150">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="Desde"
            className="px-3.5 py-2.5 text-[13.5px] text-ink outline-none bg-transparent"
          />
          <div className="w-px h-5 bg-border-input" />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="Hasta"
            className="px-3.5 py-2.5 text-[13.5px] text-ink outline-none bg-transparent"
          />
        </div>

        {/* Export */}
        <button
          onClick={handleExport}
          className="btn-primary-3d flex items-center gap-2 px-4 py-2.5 text-[13.5px] text-white rounded-field font-medium"
        >
          <Download className="w-4 h-4" strokeWidth={1.8} />
          Exportar CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-card border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="bg-[#FAFBFC] border-b border-border">
                <th className="px-[22px] py-[14px] text-left text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em]">
                  Cédula
                </th>
                <th className="px-[22px] py-[14px] text-left text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em]">
                  Nombre
                </th>
                <th className="px-[22px] py-[14px] text-left text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em]">
                  Municipio
                </th>
                <th className="px-[22px] py-[14px] text-left text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em]">
                  Actualizado
                </th>
                <th className="px-[22px] py-[14px] text-left text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F2F5]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-[22px] py-12 text-center">
                    <p className="text-sm text-ink-muted mb-3">{error}</p>
                    <button
                      onClick={() => void fetchData(page)}
                      className="text-sm text-primary hover:underline"
                    >
                      Reintentar
                    </button>
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-[22px] py-12 text-center">
                    <p className="text-sm text-ink-muted mb-3">No hay registros</p>
                    <button
                      onClick={clearFilters}
                      className="text-sm text-primary hover:underline"
                    >
                      Limpiar filtros
                    </button>
                  </td>
                </tr>
              ) : (
                submissions.map((row) => (
                  <tr
                    key={row._id}
                    onClick={() => router.push(`/admin/registros/${row._id}`)}
                    className="table-row-3d cursor-pointer"
                  >
                    <td className="px-[22px] py-[14px] font-mono tabular-nums text-[12.5px] text-ink">
                      {row.cedula}
                    </td>
                    <td className="px-[22px] py-[14px] text-ink">{getNombre(row.datos)}</td>
                    <td className="px-[22px] py-[14px]">
                      <MunicipioChip municipio={row.municipio} />
                    </td>
                    <td className="px-[22px] py-[14px] tabular-nums text-ink-muted">
                      {formatDate(row.updatedAt)}
                    </td>
                    <td className="px-[22px] py-[14px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/admin/registros/${row._id}`)
                        }}
                        className="text-[13px] font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20 rounded"
                      >
                        Ver ›
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && !error && total > 0 && (
          <div className="flex items-center justify-between px-[22px] py-3.5 border-t border-border">
            <p className="text-[13px] tabular-nums text-ink-muted">
              Mostrando {start}–{end} de {total.toLocaleString('es-CO')} registros
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium text-ink border border-border-input rounded-field hover:bg-canvas disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={1.8} />
                Anterior
              </button>
              <span className="text-[13px] tabular-nums text-ink-muted px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-[13px] font-medium text-ink border border-border-input rounded-field hover:bg-canvas disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" strokeWidth={1.8} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
