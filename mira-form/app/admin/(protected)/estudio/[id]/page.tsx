'use client'

import Link from 'next/link'
import { ArrowRight, CalendarClock, ClipboardCheck, ClipboardList, ImagePlus, Layers, Pencil } from 'lucide-react'
import { Card, EmptyState, Eyebrow, buttonClass } from '@/components/admin/ui'
import { courseGradient, formatFechaLimite, tareaVencida } from '../_types'
import { Teoria, useCurso } from './_curso'

export default function InicioCursoPage() {
  const { course, esAdmin } = useCurso()
  const base = `/admin/estudio/${course._id}`
  const estados = course.estadoModulos ?? []

  const totalLecciones = estados.reduce((s, e) => s + e.totalLecciones, 0)
  const vistas = estados.reduce((s, e) => s + e.leccionesVistas, 0)
  const cuestionarios = estados.filter((e) => e.tieneCuestionario)
  const proximas = course.tareas
    .filter((t) => t.publicada && t.fechaLimite && !tareaVencida(t) && (esAdmin || !t.miEntrega))
    .sort((a, b) => new Date(a.fechaLimite!).getTime() - new Date(b.fechaLimite!).getTime())
    .slice(0, 3)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 lg:gap-6 items-start">
      <div className="space-y-5 min-w-0">
        {/* Carátula del curso */}
        <div className="relative overflow-hidden rounded-card border border-border shadow-card bg-surface">
          {course.portadaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.portadaUrl} alt={`Portada de ${course.titulo}`} className="w-full aspect-[16/7] object-cover" />
          ) : (
            <div className="relative w-full aspect-[16/7] flex items-end p-6 md:p-8" style={{ background: courseGradient(course._id) }}>
              <div className="absolute inset-0 opacity-[0.12] bg-[radial-gradient(circle_at_80%_20%,white,transparent_55%)]" />
              <div className="relative">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70 mb-1.5">Curso</p>
                <h3 className="text-[24px] md:text-[30px] font-extrabold text-white leading-tight tracking-[-0.02em] max-w-xl">{course.titulo}</h3>
              </div>
            </div>
          )}
          {esAdmin && (
            <Link
              href={`${base}/editar#caratula`}
              className="absolute top-3 right-3 press inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/90 backdrop-blur text-[12px] font-semibold text-ink shadow-card hover:bg-white"
            >
              {course.portadaUrl ? <Pencil className="w-3.5 h-3.5" strokeWidth={1.8} /> : <ImagePlus className="w-3.5 h-3.5" strokeWidth={1.8} />}
              {course.portadaUrl ? 'Cambiar portada' : 'Agregar portada'}
            </Link>
          )}
        </div>

        <Card className="p-5 md:p-7">
          {course.inicio ? (
            <Teoria html={course.inicio} />
          ) : (
            <EmptyState
              icon={Layers}
              className="py-8"
              title="Bienvenido al curso"
              description={
                esAdmin
                  ? 'Escribe aquí la bienvenida: de qué trata el curso, a quién va dirigido y cómo se trabaja. Se edita en «Editar» › Carátula del curso.'
                  : course.descripcion || 'Empieza por los módulos para ver los temas del curso.'
              }
              action={
                esAdmin ? (
                  <Link href={`${base}/editar#caratula`} className={buttonClass('secondary', 'sm')}>
                    <Pencil className="w-3.5 h-3.5" strokeWidth={1.8} />
                    Escribir la carátula
                  </Link>
                ) : undefined
              }
            />
          )}
        </Card>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-[88px]">
        <Card className="p-5">
          <Eyebrow className="mb-3">Empieza aquí</Eyebrow>
          <Link href={`${base}/modulos`} className={buttonClass('primary', 'md', 'w-full')}>
            {vistas > 0 ? 'Continuar el curso' : 'Ir a los módulos'}
            <ArrowRight className="w-4 h-4" strokeWidth={1.8} />
          </Link>
          <dl className="mt-4 space-y-2.5 text-[13px]">
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-2 text-ink-muted">
                <Layers className="w-4 h-4 text-primary" strokeWidth={1.8} />
                Temas
              </dt>
              <dd className="font-semibold text-ink tabular-nums">{course.modulos.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-2 text-ink-muted">
                <ClipboardCheck className="w-4 h-4 text-success" strokeWidth={1.8} />
                Lecciones vistas
              </dt>
              <dd className="font-semibold text-ink tabular-nums">
                {vistas}/{totalLecciones}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-2 text-ink-muted">
                <ClipboardCheck className="w-4 h-4 text-violet" strokeWidth={1.8} />
                Cuestionarios aprobados
              </dt>
              <dd className="font-semibold text-ink tabular-nums">
                {cuestionarios.filter((e) => e.aprobado).length}/{cuestionarios.length}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <Eyebrow>Próximas entregas</Eyebrow>
            <Link href={`${base}/tareas`} className="text-[12px] font-semibold text-primary hover:underline">
              Ver tareas
            </Link>
          </div>
          {proximas.length === 0 ? (
            <p className="text-[12.5px] text-ink-muted">{esAdmin ? 'No hay tareas con fecha próxima.' : 'No tienes entregas pendientes.'}</p>
          ) : (
            <ul className="space-y-1">
              {proximas.map((t) => (
                <li key={t._id}>
                  <Link href={`${base}/tareas/${t._id}`} className="flex items-start gap-2.5 -mx-2 px-2 py-2 rounded-[10px] hover:bg-canvas">
                    <ClipboardList className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" strokeWidth={1.8} />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold text-ink truncate">{t.titulo}</span>
                      <span className="flex items-center gap-1 text-[11.5px] text-ink-muted">
                        <CalendarClock className="w-3 h-3" strokeWidth={1.8} />
                        {formatFechaLimite(t.fechaLimite!)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </aside>
    </div>
  )
}
