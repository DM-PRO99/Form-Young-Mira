'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  ClipboardCheck,
  Eye,
  FileWarning,
  MapPin,
  Minus,
  RefreshCw,
  SlidersHorizontal,
  Trophy,
  Users,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  IconTile,
  KpiCard,
  ResponsiveTable,
  SearchInput,
  SegmentedControl,
  Skeleton,
  type Column,
  type Tone,
} from '@/components/admin/ui'
import { municipioColor } from '@/lib/municipioColors'
import { cn } from '@/lib/cn'

interface DailyCount {
  date: string
  count: number
}

interface RecentRow {
  _id: string
  cedula: string
  nombre: string
  municipio: string
  createdAt: string
  completo: boolean
}

interface DashboardData {
  total: number
  totalHace30: number
  last7Days: number
  prev7Days: number
  delta: number
  incompletos: number
  sinSincronizar: number
  byMunicipio: Record<string, number>
  dailyCounts: DailyCount[]
  recientes: RecentRow[]
  proximoEvento: { _id: string; nombre: string; fecha: string } | null
  visibleMunicipios: string[] | null
}

type Range = '7' | '14' | '30'

const TONE_COLOR: Record<Tone, string> = {
  primary: '#1E56E8',
  success: '#14915F',
  violet: '#5B3FE4',
  warning: '#D9730D',
  danger: '#D9455F',
  neutral: '#7A85A3',
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return Math.round(((current - previous) / previous) * 100)
}

function shortDate(iso: string): string {
  return new Date(iso.length === 10 ? iso + 'T00:00:00' : iso).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })
}

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    setWidth(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

// ─── Indicadores ────────────────────────────────────────────────────────────

function Delta({ value, label }: { value: number | null; label: string }) {
  if (value === null) return <span>{label}</span>
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('inline-flex items-center gap-0.5 font-bold', value > 0 ? 'text-success' : value < 0 ? 'text-danger' : 'text-ink-faint')}>
        <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
        {value > 0 ? '+' : ''}
        {value}%
      </span>
      {label}
    </span>
  )
}

function Sparkline({ values, tone }: { values: number[]; tone: Tone }) {
  const gradientId = useId()
  if (values.length < 2) return null
  const w = 96
  const h = 36
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const points = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - ((v - min) / (max - min || 1)) * (h - 6)])
  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const color = TONE_COLOR[tone]
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

// ─── Gráfico de registros por día ───────────────────────────────────────────

function AreaChart({ data }: { data: DailyCount[] }) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const gradientId = useId()

  const height = 220
  const pad = { top: 16, right: 12, bottom: 28, left: 32 }
  const innerW = Math.max(width - pad.left - pad.right, 10)
  const innerH = height - pad.top - pad.bottom
  const rawMax = Math.max(...data.map((d) => d.count), 1)
  const step = rawMax <= 4 ? 1 : Math.ceil(rawMax / 4)
  const max = step * 4
  const x = (i: number) => pad.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW)
  const y = (v: number) => pad.top + innerH - (v / max) * innerH
  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.count).toFixed(1)}`).join(' ')
  const area = `${line} L${x(data.length - 1).toFixed(1)},${pad.top + innerH} L${x(0).toFixed(1)},${pad.top + innerH} Z`
  const labelEvery = data.length > 14 ? 3 : 1

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left - pad.left
    const idx = Math.round((px / innerW) * (data.length - 1))
    setHover(Math.max(0, Math.min(data.length - 1, idx)))
  }

  const hovered = hover !== null ? data[hover] : null

  return (
    <div ref={ref} className="relative w-full select-none">
      {width > 0 && (
        <svg width={width} height={height} onPointerMove={handleMove} onPointerLeave={() => setHover(null)} role="img" aria-label="Registros por día">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E56E8" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#1E56E8" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3, 4].map((i) => {
            const v = step * i
            return (
              <g key={i}>
                <line x1={pad.left} x2={pad.left + innerW} y1={y(v)} y2={y(v)} stroke="#E4E9F5" strokeDasharray={i === 0 ? undefined : '3 4'} />
                <text x={pad.left - 8} y={y(v) + 4} textAnchor="end" className="fill-ink-faint text-[10.5px] tabular-nums">
                  {v}
                </text>
              </g>
            )
          })}
          {data.map((d, i) =>
            i % labelEvery === 0 ? (
              <text key={d.date} x={x(i)} y={height - 8} textAnchor="middle" className="fill-ink-faint text-[10.5px] tabular-nums">
                {shortDate(d.date)}
              </text>
            ) : null
          )}
          <path d={area} fill={`url(#${gradientId})`} />
          <path d={line} fill="none" stroke="#1E56E8" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + innerH} stroke="#1E56E8" strokeOpacity="0.35" strokeDasharray="3 3" />
          )}
          {data.map((d, i) => (
            <circle
              key={d.date}
              cx={x(i)}
              cy={y(d.count)}
              r={hover === i ? 5 : data.length > 14 ? 0 : 3}
              fill={hover === i ? '#1E56E8' : '#FFFFFF'}
              stroke="#1E56E8"
              strokeWidth="2"
            />
          ))}
        </svg>
      )}
      {hovered && hover !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full px-2.5 py-1.5 rounded-[8px] bg-navy text-white shadow-pop text-[11.5px] leading-tight whitespace-nowrap"
          style={{ left: Math.min(Math.max(x(hover), 60), width - 60), top: y(hovered.count) - 10 }}
        >
          <p className="text-white/70">{shortDate(hovered.date)}</p>
          <p className="font-bold">
            {hovered.count} registro{hovered.count === 1 ? '' : 's'}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Distribución por municipio ─────────────────────────────────────────────

// Posiciones aproximadas en el Valle de Aburrá (norte arriba). Es una vista esquemática, no un mapa exacto.
const MAP_POSITIONS: Record<string, [number, number]> = {
  'Medellín': [54, 26],
  'San Antonio de Prado': [22, 60],
  'Itagüí': [44, 56],
  Envigado: [70, 52],
  'La Estrella': [36, 78],
  Sabaneta: [60, 76],
}

function MunicipioList({ entries, total }: { entries: [string, number][]; total: number }) {
  const max = Math.max(...entries.map(([, c]) => c), 1)
  return (
    <div className="space-y-3.5">
      {entries.map(([municipio, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        return (
          <div key={municipio}>
            <div className="flex items-center justify-between mb-1.5 gap-2 text-[13px]">
              <span className="font-semibold text-ink truncate min-w-0">{municipio}</span>
              <span className="tabular-nums text-ink-muted flex-shrink-0">
                <span className="font-bold text-ink">{count.toLocaleString('es-CO')}</span>
                <span className="inline-block w-11 text-right">{pct}%</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-canvas overflow-hidden">
              <div className="progress-fill h-full w-full rounded-full bg-primary" style={{ transform: `scaleX(${Math.max(count / max, 0.03)})`, opacity: 0.35 + 0.65 * (count / max) }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MunicipioMap({ entries }: { entries: [string, number][] }) {
  const max = Math.max(...entries.map(([, c]) => c), 1)
  const placed = entries.filter(([m]) => MAP_POSITIONS[m])
  const others = entries.filter(([m]) => !MAP_POSITIONS[m])
  return (
    <div>
      <div className="relative aspect-[4/3] w-full rounded-[14px] bg-gradient-to-br from-[#EEF2FE] to-[#F8FAFE] border border-border overflow-hidden">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden>
          <path d="M30,8 C48,4 70,10 78,24 C88,40 86,62 76,82 C66,96 40,98 26,88 C12,76 8,54 14,36 C18,22 22,12 30,8 Z" fill="#DCE5FB" opacity="0.7" />
          <path d="M28,92 C36,80 44,70 50,58 C56,44 58,30 60,6" fill="none" stroke="#9DB6F5" strokeWidth="1.2" strokeDasharray="2 2" />
        </svg>
        {placed.map(([m, count]) => {
          const [left, top] = MAP_POSITIONS[m]
          const size = 18 + Math.sqrt(count / max) * 34
          const color = municipioColor(m)
          return (
            <div key={m} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: `${left}%`, top: `${top}%` }}>
              <span
                className="rounded-full flex items-center justify-center text-[10.5px] font-bold text-white shadow-card ring-2 ring-white"
                style={{ width: size, height: size, backgroundColor: color.text }}
                title={`${m}: ${count}`}
              >
                {count}
              </span>
              <span className="mt-1 text-[10.5px] font-semibold text-ink bg-white/85 px-1.5 rounded-full whitespace-nowrap">{m}</span>
            </div>
          )
        })}
      </div>
      <p className="text-[11px] text-ink-faint mt-2">
        Vista esquemática del Valle de Aburrá · el tamaño indica la cantidad de jóvenes
        {others.length > 0 && ` · Otros: ${others.map(([m, c]) => `${m} (${c})`).join(', ')}`}
      </p>
    </div>
  )
}

// ─── Alertas ────────────────────────────────────────────────────────────────

interface Alerta {
  key: string
  icon: typeof Bell
  tone: Tone
  title: string
  description: string
  href: string
}

function buildAlertas(data: DashboardData): Alerta[] {
  const alertas: Alerta[] = []
  if (data.incompletos > 0) {
    alertas.push({
      key: 'incompletos',
      icon: FileWarning,
      tone: 'warning',
      title: 'Registros pendientes de revisión',
      description: `${data.incompletos} registro${data.incompletos === 1 ? '' : 's'} con datos faltantes`,
      href: '/admin/registros?estado=incompleto',
    })
  }
  if (data.sinSincronizar > 0) {
    alertas.push({
      key: 'sheets',
      icon: RefreshCw,
      tone: 'danger',
      title: 'Sin sincronizar con Google Sheets',
      description: `${data.sinSincronizar} registro${data.sinSincronizar === 1 ? '' : 's'} solo están en la base de datos`,
      href: '/admin/registros',
    })
  }
  if (data.last7Days === 0) {
    alertas.push({
      key: 'sin-recientes',
      icon: AlertCircle,
      tone: 'primary',
      title: 'Sin registros recientes',
      description: 'No hay registros nuevos en los últimos 7 días',
      href: '/admin/registros',
    })
  }
  if (data.proximoEvento) {
    const fecha = new Date(data.proximoEvento.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
    alertas.push({
      key: 'evento',
      icon: CalendarClock,
      tone: 'violet',
      title: 'Evento próximo',
      description: `${data.proximoEvento.nombre} · ${fecha}`,
      href: `/admin/eventos/${data.proximoEvento._id}`,
    })
  }
  return alertas
}

// ─── Página ─────────────────────────────────────────────────────────────────

const RECENT_COLUMNS: Column<RecentRow>[] = [
  {
    header: 'Fecha',
    cell: (r) => <span className="tabular-nums text-ink-muted whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString('es-CO')}</span>,
  },
  { header: 'Identificación', cell: (r) => <span className="font-mono tabular-nums text-[12.5px] text-ink">{r.cedula}</span> },
  { header: 'Nombre', cell: (r) => <span className="font-medium text-ink truncate block max-w-[180px]">{r.nombre || '—'}</span> },
  { header: 'Municipio', cell: (r) => <span className="text-ink-muted">{r.municipio}</span> },
  { header: 'Estado', cell: (r) => <Badge tone={r.completo ? 'success' : 'warning'}>{r.completo ? 'Completo' : 'Pendiente'}</Badge> },
  {
    header: 'Acción',
    className: 'text-right',
    cell: (r) => (
      <Link
        href={`/admin/registros/${r._id}`}
        onClick={(e) => e.stopPropagation()}
        className="press inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[8px] bg-primary-tint text-primary text-[12px] font-semibold hover:bg-primary hover:text-white"
      >
        <Eye className="w-3.5 h-3.5" strokeWidth={1.8} />
        Ver
      </Link>
    ),
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<Range>('14')
  const [vista, setVista] = useState<'lista' | 'mapa'>('lista')
  const [search, setSearch] = useState('')

  async function fetchDashboard(days: Range) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/dashboard?days=${days}`)
      if (!res.ok) throw new Error()
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
      <div className="admin-view space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-[11px]" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
          <Skeleton className="h-[310px] rounded-card" />
          <Skeleton className="h-[310px] rounded-card" />
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
        <EmptyState icon={BarChart3} title="Aún no hay registros" description="Cuando los jóvenes llenen la encuesta, aquí verás el resumen por día y por municipio." />
      </Card>
    )
  }

  const municipioEntries = Object.entries(data.byMunicipio).sort((a, b) => b[1] - a[1])
  const leader = municipioEntries[0]
  const leaderPct = leader ? Math.round((leader[1] / data.total) * 100) : 0
  const crecimientoMes = pctChange(data.total, data.totalHace30)
  const crecimientoSemana = pctChange(data.last7Days, data.prev7Days)
  const pendientesPct = Math.round((data.incompletos / data.total) * 100)

  const base = data.total - data.dailyCounts.reduce((s, d) => s + d.count, 0)
  let acumulado = base
  const totalSeries = data.dailyCounts.map((d) => (acumulado += d.count))
  const dailySeries = data.dailyCounts.map((d) => d.count)
  const alertas = buildAlertas(data)

  return (
    <div className="admin-view space-y-4 md:space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Total de jóvenes" icon={Users} tone="primary" value={data.total.toLocaleString('es-CO')} aside={<Sparkline values={totalSeries} tone="primary" />}>
          <Delta value={crecimientoMes} label="vs. mes anterior" />
        </KpiCard>
        <KpiCard
          label="Registros últimos 7 días"
          icon={CalendarDays}
          tone="success"
          value={data.last7Days.toLocaleString('es-CO')}
          aside={<Sparkline values={dailySeries} tone="success" />}
        >
          <Delta value={crecimientoSemana} label="vs. semana anterior" />
        </KpiCard>
        <KpiCard
          label="Municipio líder"
          icon={MapPin}
          tone="violet"
          value={<span className="text-[26px]">{leader ? leader[0] : '—'}</span>}
          aside={<Trophy className="w-6 h-6 text-violet/70" strokeWidth={1.6} />}
        >
          {leader && (
            <>
              <span className="font-bold text-ink">{leader[1].toLocaleString('es-CO')}</span> jóvenes ({leaderPct}%)
            </>
          )}
        </KpiCard>
        <KpiCard
          label="Pendientes de revisión"
          icon={ClipboardCheck}
          tone="warning"
          value={data.incompletos.toLocaleString('es-CO')}
          aside={
            <Link href="/admin/registros?estado=incompleto" className="text-[12px] font-semibold text-warning hover:underline">
              Revisar
            </Link>
          }
        >
          {pendientesPct}% del total · con datos faltantes
        </KpiCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 md:gap-5">
        <Card className="min-w-0">
          <CardHeader
            icon={BarChart3}
            title="Registros por día"
            description={`Últimos ${range} días`}
            actions={
              <SegmentedControl
                value={range}
                onChange={setRange}
                options={[
                  { value: '7', label: '7d' },
                  { value: '14', label: '14d' },
                  { value: '30', label: '30d' },
                ]}
              />
            }
          />
          <div className={cn('px-3 pt-4 pb-2 md:px-5 transition-opacity duration-150', loading && 'opacity-50')}>
            <AreaChart data={data.dailyCounts} />
          </div>
        </Card>

        <Card className="min-w-0">
          <CardHeader
            icon={MapPin}
            tone="violet"
            title="Distribución por municipio"
            actions={
              <SegmentedControl
                value={vista}
                onChange={setVista}
                options={[
                  { value: 'lista', label: 'Lista' },
                  { value: 'mapa', label: 'Mapa' },
                ]}
              />
            }
          />
          <div className="p-5">
            {vista === 'lista' ? <MunicipioList entries={municipioEntries} total={data.total} /> : <MunicipioMap entries={municipioEntries} />}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 md:gap-5">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader
            icon={ClipboardList}
            title="Actividad reciente"
            actions={
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  router.push(`/admin/registros${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''}`)
                }}
              >
                <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, cédula…" className="w-full sm:w-56" />
                <Button variant="secondary" icon={<SlidersHorizontal className="w-4 h-4" strokeWidth={1.8} />} onClick={() => router.push('/admin/registros')}>
                  <span className="hidden sm:inline">Filtrar</span>
                </Button>
              </form>
            }
          />
          <ResponsiveTable
            rows={data.recientes}
            columns={RECENT_COLUMNS}
            rowKey={(r) => r._id}
            onRowClick={(r) => router.push(`/admin/registros/${r._id}`)}
            mobileCard={(r) => (
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-ink truncate">{r.nombre || r.cedula}</p>
                  <p className="text-[12px] text-ink-muted mt-0.5">
                    CC {r.cedula} · {r.municipio}
                  </p>
                </div>
                <Badge tone={r.completo ? 'success' : 'warning'}>{r.completo ? 'Completo' : 'Pendiente'}</Badge>
              </div>
            )}
          />
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border">
            <p className="text-[12.5px] text-ink-muted">
              Mostrando {data.recientes.length} de {data.total.toLocaleString('es-CO')} registros
            </p>
            <Link href="/admin/registros" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary hover:underline">
              Ver todos
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
            </Link>
          </div>
        </Card>

        <Card className="min-w-0">
          <CardHeader icon={Bell} tone="warning" title="Alertas y tareas pendientes" />
          <div className="p-3 space-y-2">
            {alertas.length === 0 ? (
              <EmptyState icon={ClipboardCheck} title="Todo al día" description="No hay registros pendientes ni alertas por ahora." className="py-8" />
            ) : (
              alertas.map((a) => (
                <Link
                  key={a.key}
                  href={a.href}
                  className="press flex items-center gap-3 p-3 rounded-[12px] bg-surface-muted border border-transparent hover:border-border hover:bg-white transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20"
                >
                  <IconTile icon={a.icon} tone={a.tone} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-bold text-ink leading-tight">{a.title}</p>
                    <p className="text-[12px] text-ink-muted mt-0.5 truncate">{a.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-faint flex-shrink-0" strokeWidth={1.8} />
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
