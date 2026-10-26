'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Download,
  FileText,
  Pencil,
  PlayCircle,
  Presentation,
} from 'lucide-react'
import { formatBytes } from '@/lib/estudio'
import { LESSON_LABEL, type CourseDetail, type Lesson, type LessonType } from '../_types'

const LESSON_ICON: Record<LessonType, typeof PlayCircle> = {
  video: PlayCircle,
  pdf: FileText,
  presentacion: Presentation,
}

function LessonViewer({ lesson }: { lesson: Lesson }) {
  if (lesson.tipo === 'video') {
    return (
      <video key={lesson.archivoUrl} src={lesson.archivoUrl} controls className="w-full aspect-video bg-black rounded-field" />
    )
  }
  const src =
    lesson.tipo === 'pdf'
      ? lesson.archivoUrl
      : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(lesson.archivoUrl)}`
  return <iframe key={src} src={src} title={lesson.titulo} className="w-full h-[70vh] rounded-field border border-border bg-canvas" />
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
    return <div className="admin-view py-16 text-center text-ink-muted text-sm">Cargando curso...</div>
  }
  if (!course) {
    return <div className="admin-view py-16 text-center text-ink-muted text-sm">Curso no encontrado.</div>
  }

  const currentIndex = lessons.findIndex((l) => l._id === currentId)
  const current = currentIndex >= 0 ? lessons[currentIndex] : null
  const pct = lessons.length > 0 ? Math.round((completadas.size / lessons.length) * 100) : 0

  async function toggleCompletada(lesson: Lesson) {
    if (!course || !lesson._id) return
    const completada = !completadas.has(lesson._id)
    setSaving(true)
    const res = await fetch('/api/estudio/progreso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: course._id, leccionId: lesson._id, completada }),
    })
    setSaving(false)
    if (!res.ok) {
      toast.error('No se pudo guardar tu progreso')
      return
    }
    setCourse({
      ...course,
      completadas: completada
        ? [...course.completadas, lesson._id]
        : course.completadas.filter((cid) => cid !== lesson._id),
    })
  }

  return (
    <div className="admin-view">
      <Link
        href="/admin/estudio"
        className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-primary transition-transform duration-150 hover:-translate-x-0.5 mb-3"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.8} />
        Volver a estudio
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <h2 className="text-[19px] font-semibold text-ink">{course.titulo}</h2>
            {course.estado === 'borrador' && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-canvas text-ink-faint">Borrador</span>
            )}
          </div>
          {course.descripcion && <p className="text-[13px] text-ink-muted max-w-2xl">{course.descripcion}</p>}
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="w-[180px]">
            <p className="text-[11.5px] text-ink-muted mb-1">
              Tu avance · <span className="font-mono">{completadas.size}/{lessons.length}</span>
            </p>
            <div className="h-1.5 bg-canvas rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-[width] duration-300" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {role === 'admin' && (
            <button
              onClick={() => router.push(`/admin/estudio/${course._id}/editar`)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-ink border border-border-input rounded-field bg-white hover:bg-canvas transition-colors duration-150"
            >
              <Pencil className="w-3.5 h-3.5" strokeWidth={1.8} />
              Editar
            </button>
          )}
        </div>
      </div>

      {lessons.length === 0 ? (
        <div className="bg-surface rounded-card border border-border shadow-card px-[22px] py-14 text-center">
          <p className="text-sm text-ink-muted">Este curso todavía no tiene lecciones.</p>
        </div>
      ) : (
        <div className="grid grid-cols-[300px_1fr] gap-6 items-start">
          <aside className="bg-surface rounded-card border border-border shadow-card p-3 sticky top-[88px] max-h-[calc(100vh-120px)] overflow-y-auto">
            {course.modulos.map((m, mi) => (
              <div key={m._id ?? mi} className="mb-2 last:mb-0">
                <p className="px-2.5 pt-2 pb-1.5 text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em]">
                  Módulo {mi + 1} · {m.titulo}
                </p>
                {m.lecciones.map((l) => {
                  const Icon = LESSON_ICON[l.tipo]
                  const active = l._id === currentId
                  const done = completadas.has(l._id!)
                  return (
                    <button
                      key={l._id}
                      onClick={() => setCurrentId(l._id!)}
                      className={
                        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] text-left text-[13px] transition-colors duration-150 ' +
                        (active ? 'bg-primary-tint text-primary font-medium' : 'text-ink hover:bg-canvas')
                      }
                    >
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" strokeWidth={1.8} />
                      ) : (
                        <Icon className="w-4 h-4 text-ink-faint flex-shrink-0" strokeWidth={1.8} />
                      )}
                      <span className="truncate">{l.titulo}</span>
                    </button>
                  )
                })}
              </div>
            ))}
          </aside>

          {current && (
            <section className="bg-surface rounded-card border border-border shadow-card p-5 min-w-0">
              <LessonViewer lesson={current} />

              <div className="flex items-start justify-between flex-wrap gap-4 mt-5">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-[0.08em] mb-1">
                    {LESSON_LABEL[current.tipo]} · {formatBytes(current.tamano)}
                  </p>
                  <h3 className="text-[16px] font-semibold text-ink">{current.titulo}</h3>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <a
                    href={`${current.archivoUrl}?download=1`}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-ink border border-border-input rounded-field bg-white hover:bg-canvas transition-colors duration-150"
                  >
                    <Download className="w-3.5 h-3.5" strokeWidth={1.8} />
                    Descargar
                  </a>
                  <button
                    disabled={saving}
                    onClick={() => void toggleCompletada(current)}
                    className={
                      'flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium rounded-field border transition-colors duration-150 disabled:opacity-60 ' +
                      (completadas.has(current._id!)
                        ? 'bg-success-tint text-success border-transparent'
                        : 'bg-white text-ink border-border-input hover:bg-canvas')
                    }
                  >
                    {completadas.has(current._id!) ? (
                      <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.8} />
                    ) : (
                      <Circle className="w-3.5 h-3.5" strokeWidth={1.8} />
                    )}
                    {completadas.has(current._id!) ? 'Vista' : 'Marcar como vista'}
                  </button>
                  {currentIndex < lessons.length - 1 && (
                    <button
                      onClick={() => setCurrentId(lessons[currentIndex + 1]._id!)}
                      className="btn-primary-3d flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium text-white rounded-field"
                    >
                      Siguiente
                      <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.8} />
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
