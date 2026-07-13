'use client'

import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react'

interface DailyCount {
  date: string
  count: number
}

interface DashboardData {
  total: number
  last7Days: number
  delta: number
  byMunicipio: Record<string, number>
  dailyCounts: DailyCount[]
  visibleMunicipios: string[] | null
}

function SkeletonCard() {
  return (
    <div className="bg-zinc-100 rounded-xl animate-pulse h-28" />
  )
}

function MetricCard({
  label,
  value,
  delta,
  showDelta = false,
}: {
  label: string
  value: number
  delta?: number
  showDelta?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-2xl font-medium tabular-nums text-zinc-900">
        {value.toLocaleString('es-CO')}
      </p>
      {showDelta && delta !== undefined && delta !== 0 && (
        <p
          className={
            'flex items-center gap-1 text-sm mt-1 ' +
            (delta > 0 ? 'text-green-600' : 'text-red-500')
          }
        >
          {delta > 0 ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5" />
          )}
          {delta > 0 ? '+' : ''}
          {delta} vs semana anterior
        </p>
      )}
    </div>
  )
}

function BarChart({ dailyCounts }: { dailyCounts: DailyCount[] }) {
  if (dailyCounts.length === 0) return null
  const maxCount = Math.max(...dailyCounts.map((d) => d.count), 1)

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5 mt-6">
      <h2 className="text-sm font-medium text-zinc-700 mb-5">
        Registros por día — últimos 14 días
      </h2>
      <div className="overflow-x-auto">
        <div className="flex items-end gap-2 min-w-[400px] h-36 pb-6">
          {dailyCounts.map((d) => {
            const barHeight = Math.max(
              (d.count / maxCount) * 120,
              d.count > 0 ? 4 : 0
            )
            const dateObj = new Date(d.date + 'T00:00:00')
            const label = dateObj.toLocaleDateString('es-CO', {
              month: '2-digit',
              day: '2-digit',
            })
            return (
              <div
                key={d.date}
                className="flex flex-col items-center gap-1 flex-1 min-w-0"
              >
                {d.count > 0 && (
                  <span className="text-[10px] tabular-nums text-zinc-500">
                    {d.count}
                  </span>
                )}
                <div className="w-full flex items-end justify-center">
                  <div
                    className="w-full rounded-t bg-[#1E3A9E] transition-[height] duration-300"
                    style={{ height: `${barHeight}px` }}
                    title={`${d.date}: ${d.count}`}
                  />
                </div>
                <span
                  className="text-[9px] tabular-nums text-zinc-400 origin-center"
                  style={{ transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}
                >
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchDashboard() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/dashboard')
      if (!res.ok) throw new Error('Error al cargar datos')
      const json = (await res.json()) as DashboardData
      setData(json)
    } catch {
      setError('No se pudieron cargar las métricas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div>
        <h1 className="text-lg font-semibold text-zinc-900 mb-6">Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="bg-zinc-100 rounded-xl animate-pulse h-52 mt-6" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <BarChart3 className="w-10 h-10 text-zinc-300" />
        <p className="text-sm text-zinc-500">{error}</p>
        <button
          onClick={() => void fetchDashboard()}
          className="text-sm text-[#1E3A9E] hover:underline"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!data || data.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-400">
        <BarChart3 className="w-10 h-10" />
        <p className="text-sm">No hay registros aún</p>
      </div>
    )
  }

  const municipioEntries = Object.entries(data.byMunicipio)

  return (
    <div>
      <h1 className="text-lg font-semibold text-zinc-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total registros" value={data.total} />
        <MetricCard
          label="Últimos 7 días"
          value={data.last7Days}
          delta={data.delta}
          showDelta
        />
        {municipioEntries.map(([municipio, count]) => (
          <MetricCard key={municipio} label={municipio} value={count} />
        ))}
      </div>

      <BarChart dailyCounts={data.dailyCounts} />
    </div>
  )
}
