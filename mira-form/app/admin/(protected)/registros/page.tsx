'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react'

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

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-zinc-100 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

export default function RegistrosPage() {
  const router = useRouter()
  const { data: session } = useSession()

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

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const limit = 20

  const isAdmin = session?.user.role === 'admin'
  const userMunicipios =
    !isAdmin && session?.user.municipios ? session.user.municipios : MUNICIPIOS

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

  const totalPages = Math.ceil(total / limit)
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-zinc-900">Registros</h1>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por cédula o nombre..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-300 rounded-lg outline-none focus:border-[#1E3A9E] focus:ring-[3px] focus:ring-[#1E3A9E]/15 transition-[border-color,box-shadow] duration-150"
          />
        </div>

        {/* Municipio select */}
        <select
          value={municipio}
          onChange={(e) => setMunicipio(e.target.value)}
          className="px-3 py-2 text-sm border border-zinc-300 rounded-lg outline-none focus:border-[#1E3A9E] focus:ring-[3px] focus:ring-[#1E3A9E]/15 transition-[border-color,box-shadow] duration-150 bg-white"
        >
          <option value="">Todos los municipios</option>
          {userMunicipios.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {/* Date from */}
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          aria-label="Desde"
          className="px-3 py-2 text-sm border border-zinc-300 rounded-lg outline-none focus:border-[#1E3A9E] focus:ring-[3px] focus:ring-[#1E3A9E]/15 transition-[border-color,box-shadow] duration-150"
        />

        {/* Date to */}
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          aria-label="Hasta"
          className="px-3 py-2 text-sm border border-zinc-300 rounded-lg outline-none focus:border-[#1E3A9E] focus:ring-[3px] focus:ring-[#1E3A9E]/15 transition-[border-color,box-shadow] duration-150"
        />

        {/* Export */}
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-zinc-300 bg-white rounded-lg hover:bg-zinc-50 transition-[background-color] duration-150 active:scale-[0.97] transition-transform duration-[140ms] font-medium text-zinc-700"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Cédula
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Municipio
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Actualizado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <p className="text-sm text-zinc-500 mb-3">{error}</p>
                    <button
                      onClick={() => void fetchData(page)}
                      className="text-sm text-[#1E3A9E] hover:underline"
                    >
                      Reintentar
                    </button>
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <p className="text-sm text-zinc-500 mb-3">
                      No hay registros
                    </p>
                    <button
                      onClick={clearFilters}
                      className="text-sm text-[#1E3A9E] hover:underline"
                    >
                      Limpiar filtros
                    </button>
                  </td>
                </tr>
              ) : (
                submissions.map((row) => (
                  <tr
                    key={row._id}
                    onClick={() =>
                      router.push(`/admin/registros/${row._id}`)
                    }
                    className="cursor-pointer hover:bg-zinc-50 transition-colors duration-100"
                  >
                    <td className="px-4 py-3 font-mono tabular-nums text-zinc-800">
                      {row.cedula}
                    </td>
                    <td className="px-4 py-3 text-zinc-800">
                      {getNombre(row.datos)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {row.municipio}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-zinc-500">
                      {formatDate(row.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/admin/registros/${row._id}`)
                        }}
                        className="p-1.5 rounded-md text-zinc-400 hover:text-[#1E3A9E] hover:bg-[#EEF2FD] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#1E3A9E]/20"
                        aria-label="Ver registro"
                      >
                        <Eye className="w-4 h-4" />
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200">
            <p className="text-sm tabular-nums text-zinc-500">
              {start}–{end} de {total.toLocaleString('es-CO')} registros
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#1E3A9E]/20"
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm tabular-nums text-zinc-600 px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#1E3A9E]/20"
                aria-label="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
