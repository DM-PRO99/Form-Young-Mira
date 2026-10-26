'use client'

import { useEffect, useState } from 'react'
import { BarChart3, CalendarDays, MapPin, TrendingDown, TrendingUp, Users } from 'lucide-react'
import { Badge, Card, CardHeader, EmptyState, ErrorState, Eyebrow, SegmentedControl, Skeleton } from '@/components/admin/ui'
import { municipioColor } from '@/lib/municipioColors'

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

type Range = '14' | '30'

function KpiCard({
  label,
  icon: Icon,
  value,
  children,
}: {
  label: string
  icon: typeof Users
  value: string
  children?: React.ReactNode
}) {
  return (
    <Card interactive className="p-5">
      <div className="flex items-center justify-between mb-3">
        <Eyebrow>{label}</Eyebrow>
        <span className="w-8 h-8 rounded-[9px] bg-primary-tint flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" strokeWidth={1.8} />
        </span>
      </div>
      <p className="text-[34px] md:text-[38px] font-semibold tabular-nums text-ink leading-none tracking-[-0.035em]">{value}</p>
      <div className="mt-2.5 min-h-[22px] flex items-center">{children}</div>
    </Card>
  )
}

const CHART_HEIGHT = 140

function BarChart({ dailyCounts }: { dailyCounts: DailyCount[] }) {
  if (dailyCounts.length === 0) return null
  const maxCount = Math.max(...dailyCounts.map((d) => d.count), 1)
  const dense = dailyCounts.length > 14
  const gridLines = [maxCount, Math.round(maxCount / 2), 0]

  return (
    <div className="flex gap-3">
      <div className="flex flex-col justify-between text-[10.5px] tabular-nums text-ink-faint text-right pb-6" style={{ height: CHART_HEIGHT + 24 }}>
        {gridLines.map((v, i) => (
          <span key={i} className="leading-none">
            {v}
          </span>
        ))}
      </div>
      <div className="flex-1 min-w-0 overflow-x-auto">
        <div style={{ minWidth: dailyCounts.length * (dense ? 14 : 26) }}>
          <div className="relative" style={{ height: CHART_HEIGHT }}>
            {[0, 50, 100].map((top) => (
              <div key={top} className="absolute left-0 right-0 border-t border-dashed border-border" style={{ top: `${top}%` }} />
            ))}
            <div className="absolute inset-0 flex items-end gap-[3px] md:gap-1.5">
              {dailyCounts.map((d, i) => {
                const isPeak = d.count === maxCount && d.count > 0
                const barHeight = d.count > 0 ? Math.max((d.count / maxCount) * CHART_HEIGHT, 4) : 2
                return (
                  <div key={d.date} className="group relative flex-1 min-w-0 h-full flex items-end">
                    <div
                      className="chart-bar w-full rounded-t-[4px]"
                      style={{
                        height: barHeight,
                        animationDelay: `${Math.min(i * 15, 300)}ms`,
                        backgroundColor: d.count === 0 ? '#EBEDF2' : isPeak ? '#00289F' : '#9FB4EC',
                      }}
                    />
                    <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-[6px] bg-ink text-white text-[10.5px] tabular-nums whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                      {d.count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex gap-[3px] md:gap-1.5 mt-2">
            {dailyCounts.map((d, i) => {
              const label = new Date(d.date + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })
              const show = !dense || i % 3 === 0
              return (
                <span key={d.date} className="flex-1 min-w-0 text-center text-[10px] tabular-nums text-ink-faint whitespace-nowrap overflow-visible">
                  {show ? label : ''}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function MunicipioDistribution({ byMunicipio }: { byMunicipio: Record<string, number> }) {
  const entries = Object.entries(byMunicipio).sort((a, b) => b[1] - a[1])
  const max = Math.max(...entries.map(([, c]) => c), 1)
  const total = entries.reduce((sum, [, c]) => sum + c, 0)

  return (
    <div className="space-y-4">
      {entries.map(([municipio, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        const color = municipioColor(municipio)
        return (
          <div key={municipio}>
            <div className="flex items-center justify-between mb-1.5 gap-2">
              <span className="flex items-center gap-2 text-[13.5px] text-ink truncate min-w-0">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color.text }} />
                {municipio}
              </span>
              <span className="text-[12.5px] tabular-nums text-ink-muted flex-shrink-0">
                <span className="font-medium text-ink">{count.toLocaleString('es-CO')}</span> · {pct}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-canvas overflow-hidden">
              <div
                className="progress-fill h-full w-full rounded-full"
                style={{ transform: `scaleX(${Math.max(count / max, 0.03)})`, backgroundColor: color.text }}
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
  const [range, setRange] = useState<Range>('14')

  async function fetchDashboard(days: Range) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/dashboard?days=${days}`)
      if (!res.ok) throw new Error('Error al cargar datos')
      setData((await res.json()) as DashboardData)
    } catch {
      setError('No se pudieron cargar las métricas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchDashboard(range)
    function handleRefresh() {
      void fetchDashboard(range)
    }
    window.addEventListener('mira:refresh', handleRefresh)
    return () => window.removeEventListener('mira:refresh', handleRefresh)
  }, [range])

  if (loading && !data) {
    return (
      <div className="admin-view">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5 space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-4 w-20" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4 md:gap-5 mt-4 md:mt-5">
          <Card className="h-[260px] p-5">
            <Skeleton className="h-full w-full" />
          </Card>
          <Card className="h-[260px] p-5 space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="admin-view">
        <ErrorState message={error} onRetry={() => void fetchDashboard(range)} />
      </Card>
    )
  }

  if (!data || data.total === 0) {
    return (
      <Card className="admin-view">
        <EmptyState
          icon={BarChart3}
          title="Aún no hay registros"
          description="Cuando los jóvenes llenen la encuesta, aquí verás el resumen por día y por municipio."
        />
      </Card>
    )
  }

  const municipioEntries = Object.entries(data.byMunicipio).sort((a, b) => b[1] - a[1])
  const leader = municipioEntries[0]
  const leaderPct = leader ? Math.round((leader[1] / data.total) * 100) : 0

  return (
    <div className="admin-view">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
        <KpiCard label="Total registros" icon={Users} value={data.total.toLocaleString('es-CO')}>
          <span className="text-[12.5px] text-ink-muted">Jóvenes en la base</span>
        </KpiCard>

        <KpiCard label="Últimos 7 días" icon={CalendarDays} value={data.last7Days.toLocaleString('es-CO')}>
          {data.delta === 0 ? (
            <span className="text-[12.5px] text-ink-muted">Igual que la semana anterior</span>
          ) : (
            <Badge tone={data.delta > 0 ? 'success' : 'danger'}>
              {data.delta > 0 ? <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.8} /> : <TrendingDown className="w-3.5 h-3.5" strokeWidth={1.8} />}
              {data.delta > 0 ? '+' : ''}
              {data.delta} vs. semana anterior
            </Badge>
          )}
        </KpiCard>

        <KpiCard label="Municipio líder" icon={MapPin} value={leader ? leader[1].toLocaleString('es-CO') : '—'}>
          {leader && (
            <span className="text-[12.5px] text-ink-muted">
              <span className="font-medium text-ink">{leader[0]}</span> · {leaderPct}% del total
            </span>
          )}
        </KpiCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4 md:gap-5 mt-4 md:mt-5">
        <Card className="min-w-0">
          <CardHeader
            title="Registros por día"
            description={`Últimos ${range} días`}
            actions={
              <SegmentedControl
                value={range}
                onChange={setRange}
                options={[
                  { value: '14', label: '14 días' },
                  { value: '30', label: '30 días' },
                ]}
              />
            }
          />
          <div className={'p-5 transition-opacity duration-150 ' + (loading ? 'opacity-50' : '')}>
            <BarChart dailyCounts={data.dailyCounts} />
          </div>
        </Card>

        <Card className="min-w-0">
          <CardHeader title="Distribución por municipio" description={`${municipioEntries.length} municipios`} />
          <div className="p-5">
            <MunicipioDistribution byMunicipio={data.byMunicipio} />
          </div>
        </Card>
      </div>
    </div>
  )
}
