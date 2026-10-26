'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { BackLink } from '@/components/admin/ui'
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Download,
  FileText,
  Pencil,
  PlayCircle,
  Presentation,
  RotateCcw,
  Trophy,
} from 'lucide-react'
import { formatBytes } from '@/lib/estudio'
import { courseGradient, LESSON_LABEL, type CourseDetail, type Lesson, type LessonType } from '../_types'

const LESSON_ICON: Record<LessonType, typeof PlayCircle> = {
  video: PlayCircle,
  pdf: FileText,
  presentacion: Presentation,
}

function LessonViewer({ lesson }: { lesson: Lesson }) {
  if (lesson.tipo === 'video') {
    return <video src={lesson.archivoUrl} controls className="w-full aspect-video bg-black rounded-field" />
  }
  const src =
    lesson.tipo === 'pdf'
      ? lesson.archivoUrl
      : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(lesson.archivoUrl)}`
  return <iframe src={src} title={lesson.titulo} className="w-full h-[70vh] rounded-field border border-border bg-canvas" />
}

function CourseCompleted({ titulo, onRestart }: { titulo: string; onRestart: () => void }) {
  return (
    <div className="celebrate-in relative overflow-hidden bg-success-tint rounded-card border border-success/20 px-6 py-5 mb-5 flex items-center gap-4">
      <div className="relative flex-shrink-0">
        <span className="celebrate-ring absolute inset-0 rounded-full bg-success/40" />
        <div className="relative w-11 h-11 rounded-full bg-success flex items-center justify-center">
          <Trophy className="w-5 h-5 text-white" strokeWidth={1.8} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-ink">¡Curso completado!</p>
        <p className="text-[13px] text-ink-muted">Viste todas las lecciones de «{titulo}». Buen trabajo.</p>
      </div>
      <button
        onClick={onRestart}
        className="press flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-ink border border-border-input rounded-field bg-white hover:bg-canvas flex-shrink-0"
      >
        <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.8} />
        Repasar desde el inicio
      </button>
    </div>
  )
}

export default function CursoPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id

  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<'admin' | 'coordinador'>('coordinador')
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const lessons = useMemo(() => course?.modulos.flatMap((m) => m.lecciones) ?? [], [course])
  const completadas = useMemo(() => new Set(course?.completadas ?? []), [course])

  const fetchCourse = useCallback(async () => {
    const [meRes, res] = await Promise.all([fetch('/api/auth/me'), fetch(`/api/estudio/cursos/${id}`)])
    if (meRes.ok) {
      const me = await meRes.json()
      setRole(me.role || 'coordinador')
    }
    if (res.ok) {
      const json = (await res.json()) as { data: CourseDetail }
      setCourse(json.data)
      const all = json.data.modulos.flatMap((m) => m.lecciones)
      const done = new Set(json.data.completadas)
      setCurrentId((prev) => prev ?? (all.find((l) => !done.has(l._id!)) ?? all[0])?._id ?? null)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    void fetchCourse()
  }, [fetchCourse])

  if (loading) {
    return (
      <div className="admin-view">
        <div className="h-4 w-28 bg-zinc-100 rounded animate-pulse mb-4" />
        <div className="h-6 w-72 bg-zinc-100 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-[300px_1fr] gap-6">
          <div className="h-[420px] bg-surface rounded-card border border-border animate-pulse" />
          <div className="h-[420px] bg-surface rounded-card border border-border animate-pulse" />
        </div>
      </div>
    )
  }
  if (!course) {
    return <div className="admin-view py-16 text-center text-ink-muted text-sm">Curso no encontrado.</div>
  }

  const currentIndex = lessons.findIndex((l) => l._id === currentId)
  const current = currentIndex >= 0 ? lessons[currentIndex] : null
  const next = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null
  const pct = lessons.length > 0 ? (completadas.size / lessons.length) * 100 : 0
  const allDone = lessons.length > 0 && completadas.size === lessons.length
  const currentDone = current?._id ? completadas.has(current._id) : false

  async function setCompletada(lesson: Lesson, completada: boolean): Promise<boolean> {
    if (!course || !lesson._id) return false
    setSaving(true)
    const res = await fetch('/api/estudio/progreso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: course._id, leccionId: lesson._id, completada }),
    })
    setSaving(false)
    if (!res.ok) {
      toast.error('No se pudo guardar tu progreso')
      return false
    }
    const lessonId = lesson._id
    setCourse((prev) =>
      prev && {
        ...prev,
        completadas: completada
          ? Array.from(new Set([...prev.completadas, lessonId]))
          : prev.completadas.filter((cid) => cid !== lessonId),
      }
    )
    return true
  }

  async function markAndContinue() {
    if (!current) return
    if (!currentDone && !(await setCompletada(current, true))) return
    if (next?._id) setCurrentId(next._id)
  }

  return (
    <div className="admin-view">
      <BackLink href="/admin/estudio">Volver a estudio</BackLink>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-[12px] flex-shrink-0" style={{ background: courseGradient(course._id) }} />
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-0.5">
              <h2 className="text-[20px] md:text-[22px] font-extrabold text-ink tracking-[-0.015em] truncate">{course.titulo}</h2>
              {course.estado === 'borrador' && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-canvas text-ink-faint">Borrador</span>
              )}
            </div>
            {course.descripcion && <p className="text-[13px] text-ink-muted max-w-2xl">{course.descripcion}</p>}
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="w-[190px]">
            <p className="text-[11.5px] text-ink-muted mb-1 flex justify-between">
              <span>Tu avance</span>
              <span className="font-mono tabular-nums">
                {completadas.size}/{lessons.length}
              </span>
            </p>
            <div className="h-1.5 bg-canvas rounded-full overflow-hidden">
              <div
                className={'progress-fill h-full w-full rounded-full ' + (allDone ? 'bg-success' : 'bg-primary')}
                style={{ transform: `scaleX(${pct / 100})` }}
              />
            </div>
          </div>
          {role === 'admin' && (
            <button
              onClick={() => router.push(`/admin/estudio/${course._id}/editar`)}
              className="press flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-ink border border-border-input rounded-field bg-white hover:bg-canvas"
            >
              <Pencil className="w-3.5 h-3.5" strokeWidth={1.8} />
              Editar
            </button>
          )}
        </div>
      </div>

      {lessons.length === 0 ? (
        <div className="bg-surface rounded-card border border-border shadow-card px-[22px] py-14 text-center">
          <p className="text-[15px] font-semibold text-ink mb-1">Este curso todavía no tiene lecciones</p>
          <p className="text-[13px] text-ink-muted">
            {role === 'admin' ? 'Entra a «Editar» para agregar módulos y subir el material.' : 'Vuelve pronto.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 lg:gap-6 items-start">
          <aside className="order-2 lg:order-1 bg-surface rounded-card border border-border shadow-card p-3 lg:sticky lg:top-[88px] lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
            {course.modulos.map((m, mi) => {
              const vistas = m.lecciones.filter((l) => completadas.has(l._id!)).length
              const moduloCompleto = m.lecciones.length > 0 && vistas === m.lecciones.length
              return (
                <div key={m._id ?? mi} className="mb-2 last:mb-0">
                  <div className="flex items-baseline justify-between gap-2 px-2.5 pt-2 pb-1.5">
                    <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em] truncate">
                      Módulo {mi + 1} · {m.titulo}
                    </p>
                    <span
                      className={
                        'text-[11px] font-mono tabular-nums flex-shrink-0 ' + (moduloCompleto ? 'text-success' : 'text-ink-faint')
                      }
                    >
                      {vistas}/{m.lecciones.length}
                    </span>
                  </div>
                  {m.lecciones.map((l) => {
                    const Icon = LESSON_ICON[l.tipo]
                    const active = l._id === currentId
                    const done = completadas.has(l._id!)
                    return (
                      <button
                        key={l._id}
                        onClick={() => setCurrentId(l._id!)}
                        className={
                          'w-full flex items-start gap-2.5 px-2.5 py-2 rounded-[9px] text-left transition-colors duration-150 ' +
                          (active ? 'bg-primary-tint' : 'hover:bg-canvas')
                        }
                      >
                        {done ? (
                          <CheckCircle2 className="w-4 h-4 mt-0.5 text-success flex-shrink-0" strokeWidth={1.8} />
                        ) : (
                          <Icon
                            className={'w-4 h-4 mt-0.5 flex-shrink-0 ' + (active ? 'text-primary' : 'text-ink-faint')}
                            strokeWidth={1.8}
                          />
                        )}
                        <span className="min-w-0">
                          <span
                            className={
                              'block text-[13px] truncate ' + (active ? 'text-primary font-medium' : done ? 'text-ink-muted' : 'text-ink')
                            }
                          >
                            {l.titulo}
                          </span>
                          <span className="block text-[11px] text-ink-faint">
                            {LESSON_LABEL[l.tipo]} · {formatBytes(l.tamano)}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </aside>

          <div className="order-1 lg:order-2 min-w-0">
            {allDone && (
              <CourseCompleted titulo={course.titulo} onRestart={() => lessons[0]?._id && setCurrentId(lessons[0]._id)} />
            )}

            {current && (
              <section className="bg-surface rounded-card border border-border shadow-card p-5">
                <div key={current._id} className="lesson-fade">
                  <LessonViewer lesson={current} />

                  <div className="flex items-start justify-between flex-wrap gap-4 mt-5">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em] mb-1">
                        Lección {currentIndex + 1} de {lessons.length} · {LESSON_LABEL[current.tipo]}
                      </p>
                      <h3 className="text-[16px] font-semibold text-ink">{current.titulo}</h3>
                    </div>
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <a
                        href={`${current.archivoUrl}?download=1`}
                        className="press flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-ink-muted rounded-field hover:bg-canvas hover:text-ink"
                      >
                        <Download className="w-3.5 h-3.5" strokeWidth={1.8} />
                        Descargar
                      </a>
                      <button
                        disabled={saving}
                        onClick={() => void setCompletada(current, !currentDone)}
                        className={
                          'press flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium rounded-field border disabled:opacity-60 ' +
                          (currentDone
                            ? 'bg-success-tint text-success border-transparent'
                            : 'bg-white text-ink border-border-input hover:bg-canvas')
                        }
                      >
                        {currentDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.8} />
                        ) : (
                          <Circle className="w-3.5 h-3.5" strokeWidth={1.8} />
                        )}
                        {currentDone ? 'Vista' : 'Marcar como vista'}
                      </button>
                      {(next || !currentDone) && (
                        <button
                          disabled={saving}
                          onClick={() => void markAndContinue()}
                          className="btn-primary-3d flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white rounded-field disabled:opacity-60"
                        >
                          {next ? (currentDone ? 'Siguiente lección' : 'Marcar y continuar') : 'Marcar y terminar'}
                          <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.8} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
