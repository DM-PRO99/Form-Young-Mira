'use client'

import Link from 'next/link'
import { BarChart3, ClipboardCheck, ClipboardList, GraduationCap } from 'lucide-react'
import { Badge, Card, EmptyState, Eyebrow, KpiCard, buttonClass, type BadgeTone } from '@/components/admin/ui'
import { cn } from '@/lib/cn'
import { tareaVencida } from '../../_types'
import { useCurso } from '../_curso'

interface Fila {
  key: string
  tipo: 'cuestionario' | 'tarea'
  titulo: string
  href: string
  nota: string
  estado: { label: string; tone: BadgeTone }
}

export default function CalificacionesPage() {
  const { course, esAdmin } = useCurso()
  const base = `/admin/estudio/${course._id}`
  const estados = course.estadoModulos ?? []

  if (esAdmin) {
    const porCalificar = course.tareas.reduce((s, t) => s + (t.sinCalificar ?? 0), 0)
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-[18px] font-extrabold text-ink tracking-[-0.01em]">Calificaciones</h3>
            <p className="text-[13px] text-ink-muted">El avance y las notas de cuestionarios de cada persona están en el reporte del curso.</p>
          </div>
          <Link href={`${base}/reporte`} className={buttonClass('secondary', 'sm')}>
            <BarChart3 className="w-3.5 h-3.5" strokeWidth={1.8} />
            Ver reporte
          </Link>
        </div>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-b border-border bg-surface-muted">
            <Eyebrow>Tareas</Eyebrow>
            {porCalificar > 0 && <Badge tone="warning">{porCalificar} entregas por calificar</Badge>}
          </div>
          {course.tareas.length === 0 ? (
            <EmptyState icon={ClipboardList} className="py-10" title="No hay tareas" description="Crea tareas en la sección «Tareas»." />
          ) : (
            <ul className="divide-y divide-[#F1F2F5]">
              {course.tareas.map((t) => (
                <li key={t._id}>
                  <Link href={`${base}/tareas/${t._id}`} className="flex flex-wrap items-center gap-3 px-5 py-3.5 hover:bg-surface-muted">
                    <ClipboardList className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={1.8} />
                    <span className="flex-1 min-w-[160px] text-[13.5px] font-semibold text-ink truncate">{t.titulo}</span>
                    <span className="text-[12.5px] text-ink-muted tabular-nums">
                      {t.totalEntregas ?? 0} entrega{t.totalEntregas === 1 ? '' : 's'}
                    </span>
                    {t.sinCalificar ? <Badge tone="warning">{t.sinCalificar} por calificar</Badge> : <Badge tone="success">Al día</Badge>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    )
  }

  const filas: Fila[] = []
  course.modulos.forEach((m, mi) => {
    const est = estados[mi]
    if (!est?.tieneCuestionario) return
    const presentado = est.mejorPuntaje !== null
    filas.push({
      key: `q-${mi}`,
      tipo: 'cuestionario',
      titulo: `Cuestionario · ${m.titulo}`,
      href: `${base}/modulos?paso=quiz:${mi}`,
      nota: presentado ? `${est.mejorPuntaje}%` : '—',
      estado: est.aprobado
        ? { label: 'Aprobado', tone: 'success' }
        : presentado
          ? { label: 'No aprobado', tone: 'warning' }
          : { label: est.bloqueado ? 'Bloqueado' : 'Sin presentar', tone: 'neutral' },
    })
  })
  course.tareas.forEach((t) => {
    const cal = t.miEntrega?.calificacion
    const calificada = cal !== null && cal !== undefined
    filas.push({
      key: `t-${t._id}`,
      tipo: 'tarea',
      titulo: t.titulo,
      href: `${base}/tareas/${t._id}`,
      nota: calificada ? `${cal}/${t.puntajeMaximo}` : '—',
      estado: calificada
        ? { label: 'Calificada', tone: 'success' }
        : t.miEntrega
          ? { label: 'En revisión', tone: 'primary' }
          : tareaVencida(t)
            ? { label: 'No entregada', tone: 'danger' }
            : { label: 'Pendiente', tone: 'warning' },
    })
  })

  const presentados = estados.filter((e) => e.tieneCuestionario && e.mejorPuntaje !== null)
  const promedioQuiz = presentados.length ? Math.round(presentados.reduce((s, e) => s + (e.mejorPuntaje ?? 0), 0) / presentados.length) : null
  const calificadas = course.tareas.filter((t) => t.miEntrega?.calificacion !== null && t.miEntrega?.calificacion !== undefined)
  const promedioTareas = calificadas.length
    ? Math.round(calificadas.reduce((s, t) => s + ((t.miEntrega!.calificacion ?? 0) / t.puntajeMaximo) * 100, 0) / calificadas.length)
    : null

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[18px] font-extrabold text-ink tracking-[-0.01em]">Mis calificaciones</h3>
        <p className="text-[13px] text-ink-muted">Tus resultados en los cuestionarios y las notas de tus tareas.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard label="Promedio en cuestionarios" value={promedioQuiz === null ? '—' : `${promedioQuiz}%`} icon={ClipboardCheck} tone="success" />
        <KpiCard label="Promedio en tareas" value={promedioTareas === null ? '—' : `${promedioTareas}%`} icon={ClipboardList} tone="primary" />
        <KpiCard label="Tareas calificadas" value={`${calificadas.length}/${course.tareas.length}`} icon={GraduationCap} tone="violet" />
      </div>

      <Card className="overflow-hidden">
        {filas.length === 0 ? (
          <EmptyState icon={GraduationCap} title="Aún no hay nada que calificar" description="Aquí verás tus notas cuando el curso tenga cuestionarios o tareas." />
        ) : (
          <ul className="divide-y divide-[#F1F2F5]">
            {filas.map((f) => {
              const Icon = f.tipo === 'cuestionario' ? ClipboardCheck : ClipboardList
              return (
                <li key={f.key}>
                  <Link href={f.href} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-muted transition-colors duration-150">
                    <Icon className={cn('w-4 h-4 flex-shrink-0', f.tipo === 'cuestionario' ? 'text-success' : 'text-primary')} strokeWidth={1.8} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13.5px] font-semibold text-ink truncate">{f.titulo}</span>
                      <span className="block text-[11.5px] text-ink-faint">{f.tipo === 'cuestionario' ? 'Cuestionario' : 'Tarea'}</span>
                    </span>
                    <Badge tone={f.estado.tone} className="hidden sm:inline-flex">
                      {f.estado.label}
                    </Badge>
                    <span className="w-[64px] text-right text-[14px] font-bold text-ink tabular-nums">{f.nota}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
