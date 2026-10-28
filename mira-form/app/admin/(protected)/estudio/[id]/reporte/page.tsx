'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { BarChart3, CheckCircle2, Download, GraduationCap, Percent, Trophy, Users } from 'lucide-react'
import {
  Avatar,
  BackLink,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  KpiCard,
  PageHeader,
  ResponsiveTable,
  SearchInput,
  Skeleton,
  type Column,
} from '@/components/admin/ui'
import { cn } from '@/lib/cn'

interface ModuloReporte {
  _id: string
  titulo: string
  tieneCuestionario: boolean
  notaMinima: number | null
}

interface Participante {
  userId: string
  nombre: string
  email: string
  municipios: string[]
  leccionesVistas: number
  totalLecciones: number
  porcentaje: number
  temasCompletados: number
  totalTemas: number
  notas: Record<string, number | null>
  completo: boolean
  ultimaActividad: string | null
}

interface Reporte {
  curso: { _id: string; titulo: string; totalLecciones: number; modulos: ModuloReporte[] }
  participantes: Participante[]
}

function formatFecha(iso: string | null): string {
  if (!iso) return 'Sin actividad'
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function celdaCsv(v: unknown): string {
  const s = String(v ?? '')
  const seguro = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
  return `"${seguro.replace(/"/g, '""')}"`
}

function BarraAvance({ pct, completo }: { pct: number; completo: boolean }) {
  return (
    <div className="flex items-center gap-2.5 min-w-[140px]">
      <div className="flex-1 h-1.5 bg-canvas rounded-full overflow-hidden">
        <div className={cn('progress-fill h-full w-full rounded-full', completo ? 'bg-success' : 'bg-primary')} style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
      <span className="text-[12px] font-bold tabular-nums text-ink w-9 text-right">{pct}%</span>
    </div>
  )
}

function Nota({ valor, minima }: { valor: number | null | undefined; minima: number | null }) {
  if (valor === null || valor === undefined) return <span className="text-[12px] text-ink-faint">—</span>
  return <Badge tone={minima !== null && valor >= minima ? 'success' : 'warning'}>{valor}%</Badge>
}

export default function ReporteCursoPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [reporte, setReporte] = useState<Reporte | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')

  const fetchReporte = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/estudio/cursos/${id}/reporte`)
      if (!res.ok) throw new Error()
      setReporte(((await res.json()) as { data: Reporte }).data)
    } catch {
      setError('No se pudo cargar el reporte.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void fetchReporte()
    function handleRefresh() {
      void fetchReporte()
    }
    window.addEventListener('mira:refresh', handleRefresh)
    return () => window.removeEventListener('mira:refresh', handleRefresh)
  }, [fetchReporte])

  const quizzes = useMemo(() => reporte?.curso.modulos.filter((m) => m.tieneCuestionario) ?? [], [reporte])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const lista = reporte?.participantes ?? []
    return (q ? lista.filter((p) => p.nombre.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)) : lista).sort(
      (a, b) => b.porcentaje - a.porcentaje
    )
  }, [reporte, busqueda])

  if (loading && !reporte) {
    return (
      <div className="admin-view space-y-5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-80" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-card" />
          ))}
        </div>
        <Skeleton className="h-[300px] rounded-card" />
      </div>
    )
  }

  if (error || !reporte) {
    return (
      <Card className="admin-view">
        <ErrorState message={error ?? 'Reporte no disponible'} onRetry={() => void fetchReporte()} />
      </Card>
    )
  }

  const participantes = reporte.participantes
  const conActividad = participantes.filter((p) => p.ultimaActividad).length
  const promedio = participantes.length ? Math.round(participantes.reduce((s, p) => s + p.porcentaje, 0) / participantes.length) : 0
  const completaron = participantes.filter((p) => p.completo).length
  const notas = participantes.flatMap((p) => Object.values(p.notas).filter((n): n is number => n !== null))
  const notaPromedio = notas.length ? Math.round(notas.reduce((s, n) => s + n, 0) / notas.length) : null

  function exportarCsv() {
    const header = ['Nombre', 'Correo', 'Municipios', 'Avance %', 'Lecciones vistas', 'Temas completados', ...quizzes.map((q) => `Nota: ${q.titulo}`), 'Última actividad']
    const filas = filtrados.map((p) =>
      [
        p.nombre,
        p.email,
        p.municipios.join('; '),
        p.porcentaje,
        `${p.leccionesVistas}/${p.totalLecciones}`,
        `${p.temasCompletados}/${p.totalTemas}`,
        ...quizzes.map((q) => p.notas[q._id] ?? ''),
        p.ultimaActividad ? new Date(p.ultimaActividad).toLocaleString('es-CO') : '',
      ]
        .map(celdaCsv)
        .join(',')
    )
    const blob = new Blob(['﻿' + [header.map(celdaCsv).join(','), ...filas].join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `avance-${reporte!.curso.titulo.replace(/[^\w-]+/g, '-').toLowerCase()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const columnas: Column<Participante>[] = [
    {
      header: 'Coordinador',
      cell: (p) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={p.nombre} email={p.email} />
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold text-ink truncate">{p.nombre}</p>
            <p className="text-[12px] text-ink-muted truncate">{p.email}</p>
          </div>
        </div>
      ),
    },
    { header: 'Avance', cell: (p) => <BarraAvance pct={p.porcentaje} completo={p.completo} /> },
    {
      header: 'Temas',
      cell: (p) => (
        <span className="tabular-nums text-ink-muted">
          {p.completo ? <CheckCircle2 className="inline w-4 h-4 text-success mr-1 -mt-0.5" strokeWidth={2} /> : null}
          {p.temasCompletados}/{p.totalTemas}
        </span>
      ),
    },
    ...quizzes.map<Column<Participante>>((q) => ({
      header: <span title={q.titulo}>{q.titulo.length > 14 ? q.titulo.slice(0, 13) + '…' : q.titulo}</span>,
      cell: (p) => <Nota valor={p.notas[q._id]} minima={q.notaMinima} />,
    })),
    { header: 'Última actividad', cell: (p) => <span className="text-[12.5px] text-ink-muted whitespace-nowrap">{formatFecha(p.ultimaActividad)}</span> },
  ]

  return (
    <div className="admin-view space-y-5">
      <div>
        <BackLink href={`/admin/estudio/${id}`}>Volver al curso</BackLink>
        <PageHeader
          title="Reporte de avance"
          description={reporte.curso.titulo}
          className="mb-0"
          actions={
            <Button variant="secondary" icon={<Download className="w-4 h-4" strokeWidth={1.8} />} disabled={filtrados.length === 0} onClick={exportarCsv}>
              Exportar CSV
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <KpiCard label="Coordinadores" icon={Users} tone="primary" value={participantes.length}>
          {conActividad} con actividad
        </KpiCard>
        <KpiCard label="Avance promedio" icon={Percent} tone="violet" value={`${promedio}%`} />
        <KpiCard label="Completaron el curso" icon={Trophy} tone="success" value={completaron}>
          {participantes.length ? Math.round((completaron / participantes.length) * 100) : 0}% del equipo
        </KpiCard>
        <KpiCard label="Nota promedio" icon={GraduationCap} tone="warning" value={notaPromedio === null ? '—' : `${notaPromedio}%`}>
          {quizzes.length} cuestionario{quizzes.length === 1 ? '' : 's'}
        </KpiCard>
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          icon={BarChart3}
          title="Avance por coordinador"
          description="Lecciones vistas y cuestionarios aprobados cuentan como pasos del curso."
          actions={<SearchInput value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar coordinador…" className="w-full sm:w-60" />}
        />
        <ResponsiveTable
          rows={filtrados}
          columns={columnas}
          rowKey={(p) => p.userId}
          mobileCard={(p) => (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <Avatar name={p.nombre} email={p.email} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-ink truncate">{p.nombre}</p>
                  <p className="text-[12px] text-ink-muted">
                    {p.temasCompletados}/{p.totalTemas} temas · {formatFecha(p.ultimaActividad)}
                  </p>
                </div>
              </div>
              <BarraAvance pct={p.porcentaje} completo={p.completo} />
              {quizzes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {quizzes.map((q) => (
                    <span key={q._id} className="inline-flex items-center gap-1 text-[11.5px] text-ink-muted">
                      {q.titulo}: <Nota valor={p.notas[q._id]} minima={q.notaMinima} />
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          empty={
            <EmptyState
              icon={Users}
              title={busqueda ? 'Nadie coincide con la búsqueda' : 'No hay coordinadores activos'}
              description={busqueda ? undefined : 'Crea coordinadores en la sección Usuarios para ver su avance aquí.'}
            />
          }
        />
      </Card>
    </div>
  )
}
