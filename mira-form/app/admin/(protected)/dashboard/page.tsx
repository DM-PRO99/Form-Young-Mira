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
  return <div className="bg-zinc-100 rounded-card animate-pulse h-32" />
}

function KpiCard({
  label,
  value,
  children,
}: {
  label: string
  value: string
  children?: React.ReactNode
}) {
  return (
    <div className="kpi-card bg-surface rounded-card border border-border shadow-card p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint mb-2">
        {label}
      </p>
      <p
        className="text-[40px] font-semibold tabular-nums text-ink leading-none"
        style={{ letterSpacing: '-0.035em' }}
      >
        {value}
      </p>
      {children}
    </div>
  )
}

const CHART_HEIGHT = 128

function BarChart({ dailyCounts }: { dailyCounts: DailyCount[] }) {
  if (dailyCounts.length === 0) return null
  const maxCount = Math.max(...dailyCounts.map((d) => d.count), 1)
  const showEveryLabel = dailyCounts.length <= 14
  const minWidth = Math.max(420, dailyCounts.length * 30)

  return (
    <div className="overflow-x-auto">
      <div
        className="flex items-end gap-1.5"
        style={{ minWidth: `${minWidth}px`, height: `${CHART_HEIGHT + 28}px` }}
      >
        {dailyCounts.map((d, i) => {
          const isPeak = d.count === maxCount && d.count > 0
          const barHeight =
            d.count > 0 ? Math.max((d.count / maxCount) * CHART_HEIGHT, 6) : 3
          const dateObj = new Date(d.date + 'T00:00:00')
          const label = dateObj.toLocaleDateString('es-CO', {
            month: '2-digit',
            day: '2-digit',
          })
          const showLabel = showEveryLabel || i % 2 === 0
          return (
            <div key={d.date} className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <span className="text-[10.5px] tabular-nums text-ink-muted h-3.5">
                {d.count > 0 ? d.count : ''}
              </span>
              <div className="w-full flex items-end justify-center" style={{ height: `${CHART_HEIGHT}px` }}>
                <div
                  className="chart-bar w-full rounded-t-[5px]"
                  style={{
                    height: `${barHeight}px`,
                    animationDelay: `${i * 28}ms`,
                    background: d.count === 0
                      ? '#EBEDF2'
                      : isPeak
                        ? 'linear-gradient(180deg, #2A63E8, #00289F)'
                        : 'linear-gradient(180deg, #B7CBF7, #7C9BEE)',
                  }}
                  title={`${d.date}: ${d.count}`}
                />
              </div>
              <span className="text-[10.5px] tabular-nums text-ink-faint whitespace-nowrap">
                {showLabel ? label : ''}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RangeToggle({
  value,
  onChange,
}: {
  value: 14 | 30
  onChange: (v: 14 | 30) => void
}) {
  return (
    <div className="flex items-center gap-0.5 bg-canvas rounded-field p-0.5 border border-border">
      <button
        onClick={() => onChange(14)}
        className={
          'px-3 py-1.5 text-[12.5px] font-medium rounded-[8px] transition-colors duration-150 ' +
          (value === 14 ? 'bg-white text-ink shadow-card' : 'text-ink-faint hover:text-ink')
        }
      >
        14d
      </button>
      <button
        onClick={() => onChange(30)}
        className={
          'px-3 py-1.5 text-[12.5px] font-medium rounded-[8px] transition-colors duration-150 ' +
          (value === 30 ? 'bg-white text-ink shadow-card' : 'text-ink-faint hover:text-ink')
        }
      >
        30d
      </button>
    </div>
  )
}

function MunicipioDistribution({
  byMunicipio,
}: {
  byMunicipio: Record<string, number>
}) {
  const entries = Object.entries(byMunicipio).sort((a, b) => b[1] - a[1])
  const max = Math.max(...entries.map(([, c]) => c), 1)
  const total = entries.reduce((sum, [, c]) => sum + c, 0)
  const colors = ['#00289F', '#4471E0', '#9FB4EC']

  return (
    <div className="space-y-3.5">
      {entries.map(([municipio, count], i) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        const width = Math.max((count / max) * 100, 4)
        return (
          <div key={municipio}>
            <div className="flex items-center justify-between mb-1.5 gap-2">
              <span className="text-[13.5px] text-ink truncate min-w-0">{municipio}</span>
              <span className="text-[12.5px] tabular-nums text-ink-muted flex-shrink-0">
                {count} · {pct}%
              </span>
            </div>
            <div className="h-[7px] rounded-full bg-canvas overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${width}%`,
                  backgroundColor: colors[Math.min(i, colors.length - 1)],
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rangeDays, setRangeDays] = useState<14 | 30>(14)

  async function fetchDashboard(days: 14 | 30) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/dashboard?days=${days}`)
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
    void fetchDashboard(rangeDays)
    function handleRefresh() {
      void fetchDashboard(rangeDays)
    }
    window.addEventListener('mira:refresh', handleRefresh)
    return () => window.removeEventListener('mira:refresh', handleRefresh)
  }, [rangeDays])

  if (loading) {
    return (
      <div className="admin-view">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="bg-zinc-100 rounded-card animate-pulse h-64 mt-5" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-view flex flex-col items-center justify-center py-24 gap-4">
        <BarChart3 className="w-10 h-10 text-zinc-300" strokeWidth={1.8} />
        <p className="text-sm text-ink-muted">{error}</p>
        <button
          onClick={() => void fetchDashboard(rangeDays)}
          className="text-sm text-primary hover:underline"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!data || data.total === 0) {
    return (
      <div className="admin-view flex flex-col items-center justify-center py-24 gap-3 text-ink-faint">
        <BarChart3 className="w-10 h-10" strokeWidth={1.8} />
        <p className="text-sm">No hay registros aún</p>
      </div>
    )
  }

  const municipioEntries = Object.entries(data.byMunicipio).sort((a, b) => b[1] - a[1])
  const leader = municipioEntries[0]
  const leaderPct = leader ? Math.round((leader[1] / data.total) * 100) : 0

  return (
    <div className="admin-view">
      {/* KPI row */}
      <div className="kpi-perspective grid grid-cols-1 sm:grid-cols-3 gap-5">
        <KpiCard label="Total registros" value={data.total.toLocaleString('es-CO')} />

        <KpiCard label="Últimos 7 días" value={data.last7Days.toLocaleString('es-CO')}>
          {data.delta !== 0 && (
            <span
              className={
                'inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[12px] font-medium ' +
                (data.delta > 0 ? 'bg-success-tint text-success' : 'bg-danger-tint text-danger')
              }
            >
              {data.delta > 0 ? (
                <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.8} />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" strokeWidth={1.8} />
              )}
              {data.delta > 0 ? '+' : ''}
              {data.delta}
            </span>
          )}
        </KpiCard>

        <KpiCard label="Municipio líder" value={leader ? leader[1].toLocaleString('es-CO') : '—'}>
          {leader && (
            <p className="text-[13px] text-ink-muted mt-2">
              {leader[0]} · {leaderPct}%
            </p>
          )}
        </KpiCard>
      </div>

      {/* Chart + distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-5 mt-5">
        <div className="section-panel min-w-0 bg-surface rounded-section border border-border shadow-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/mira-badge.png"
                alt="Mira"
                className="w-7 h-7 rounded-[8px] object-cover flex-shrink-0"
              />
              <h2 className="text-[14.5px] font-semibold text-ink">Registros por día</h2>
            </div>
            <RangeToggle value={rangeDays} onChange={setRangeDays} />
          </div>
          <BarChart dailyCounts={data.dailyCounts} />
        </div>

        <div className="section-panel min-w-0 bg-surface rounded-section border border-border shadow-card p-6">
          <h2 className="text-[14.5px] font-semibold text-ink mb-5">
            Distribución por municipio
          </h2>
          <MunicipioDistribution byMunicipio={data.byMunicipio} />
        </div>
      </div>
    </div>
  )
}
