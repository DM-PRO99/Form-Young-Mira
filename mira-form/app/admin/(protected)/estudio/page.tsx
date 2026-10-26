'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, GraduationCap, BookOpen, PlayCircle, FileText, Presentation, CheckCircle2, ArrowRight } from 'lucide-react'
import { courseGradient, type CourseSummary, type LessonType } from './_types'

const TYPE_ICON: Record<LessonType, typeof PlayCircle> = {
  video: PlayCircle,
  pdf: FileText,
  presentacion: Presentation,
}

const TYPE_LABEL: Record<LessonType, [string, string]> = {
  video: ['video', 'videos'],
  pdf: ['PDF', 'PDF'],
  presentacion: ['presentación', 'presentaciones'],
}

function predominantType(tipos: CourseSummary['tipos']): LessonType | null {
  const entries = (Object.entries(tipos) as [LessonType, number][]).filter(([, n]) => n > 0)
  if (entries.length === 0) return null
  return entries.sort((a, b) => b[1] - a[1])[0][0]
}

function CourseStatus({ course }: { course: CourseSummary }) {
  if (course.totalLecciones === 0) {
    return <span className="text-[12px] text-ink-faint">Sin lecciones todavía</span>
  }
  if (course.completadas === course.totalLecciones) {
    return (
      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-success">
        <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
        Completado
      </span>
    )
  }
  if (course.completadas === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary">
        Empezar curso
        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary">
      Continuar · Lección {course.siguienteLeccion} de {course.totalLecciones}
      <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
    </span>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-surface rounded-card border border-border overflow-hidden">
      <div className="h-[104px] bg-zinc-100 animate-pulse" />
      <div className="p-5 space-y-2.5">
        <div className="h-4 w-3/4 bg-zinc-100 rounded animate-pulse" />
        <div className="h-3 w-full bg-zinc-100 rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-zinc-100 rounded animate-pulse" />
        <div className="h-1.5 w-full bg-zinc-100 rounded-full animate-pulse !mt-5" />
      </div>
    </div>
  )
}

export default function EstudioPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<CourseSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<'admin' | 'coordinador'>('coordinador')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [meRes, res] = await Promise.all([fetch('/api/auth/me'), fetch('/api/estudio/cursos')])
      if (meRes.ok) {
        const me = await meRes.json()
        setRole(me.role || 'coordinador')
      }
      if (!res.ok) throw new Error()
      const json = (await res.json()) as { data: CourseSummary[] }
      setCourses(json.data)
    } catch {
      setError('No se pudieron cargar los cursos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
    function handleRefresh() {
      void fetchData()
    }
    window.addEventListener('mira:refresh', handleRefresh)
    return () => window.removeEventListener('mira:refresh', handleRefresh)
  }, [fetchData])

  return (
    <div className="admin-view">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[17px] font-semibold text-ink">Cursos</h2>
          <p className="text-[13px] text-ink-muted">
            {role === 'admin' ? 'Crea y organiza el material de formación del equipo' : 'Material de formación del equipo'}
          </p>
        </div>
        {role === 'admin' && (
          <button
            onClick={() => router.push('/admin/estudio/nuevo')}
            className="btn-primary-3d flex items-center gap-2 px-4 py-2.5 text-[13.5px] text-white rounded-field font-medium"
          >
            <Plus className="w-4 h-4" strokeWidth={1.8} />
            Nuevo curso
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="bg-surface rounded-card border border-border shadow-card px-[22px] py-12 text-center">
          <p className="text-sm text-ink-muted mb-3">{error}</p>
          <button onClick={() => void fetchData()} className="press text-sm text-primary hover:underline">
            Reintentar
          </button>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-surface rounded-card border border-border shadow-card px-[22px] py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-primary-tint flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-6 h-6 text-primary" strokeWidth={1.6} />
          </div>
          <p className="text-[15px] font-semibold text-ink mb-1">
            {role === 'admin' ? 'Crea el primer curso' : 'Aún no hay cursos publicados'}
          </p>
          <p className="text-[13px] text-ink-muted max-w-sm mx-auto">
            {role === 'admin'
              ? 'Organiza videos, PDFs y presentaciones en módulos para la formación del equipo.'
              : 'Cuando el equipo publique material de formación, aparecerá aquí.'}
          </p>
          {role === 'admin' && (
            <button
              onClick={() => router.push('/admin/estudio/nuevo')}
              className="btn-primary-3d inline-flex items-center gap-2 px-4 py-2.5 mt-5 text-[13.5px] text-white rounded-field font-medium"
            >
              <Plus className="w-4 h-4" strokeWidth={1.8} />
              Nuevo curso
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
          {courses.map((c, i) => {
            const pct = c.totalLecciones > 0 ? (c.completadas / c.totalLecciones) * 100 : 0
            const tipo = predominantType(c.tipos)
            const Icon = tipo ? TYPE_ICON[tipo] : BookOpen
            const tipoChips = (Object.entries(c.tipos) as [LessonType, number][]).filter(([, n]) => n > 0)
            return (
              <div key={c._id} className="animate-riseIn flex" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
              <button
                onClick={() => router.push(`/admin/estudio/${c._id}`)}
                className="estudio-card w-full text-left bg-surface rounded-card border border-border shadow-card overflow-hidden flex flex-col"
              >
                <div className="h-[104px] px-5 pb-4 flex items-end relative overflow-hidden" style={{ background: courseGradient(c._id) }}>
                  <div
                    className="absolute -right-6 -top-8 w-32 h-32 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%)' }}
                  />
                  <div className="w-10 h-10 rounded-[11px] bg-white/[0.14] flex items-center justify-center backdrop-blur-[2px]">
                    <Icon className="w-5 h-5 text-white" strokeWidth={1.7} />
                  </div>
                  {role === 'admin' && (
                    <span
                      className={
                        'absolute top-3 right-3 px-2 py-0.5 rounded-full text-[11px] font-semibold ' +
                        (c.estado === 'publicado' ? 'bg-success-tint text-success' : 'bg-white/90 text-ink-muted')
                      }
                    >
                      {c.estado === 'publicado' ? 'Publicado' : 'Borrador'}
                    </span>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-[14.5px] font-semibold text-ink mb-1 truncate">{c.titulo}</p>
                  <p className="text-[12.5px] text-ink-muted line-clamp-2 min-h-[36px]">{c.descripcion || 'Sin descripción'}</p>
                  <p className="text-[11.5px] text-ink-faint mt-3">
                    {c.totalModulos} módulo{c.totalModulos === 1 ? '' : 's'}
                    {tipoChips.map(([t, n]) => ` · ${n} ${TYPE_LABEL[t][n === 1 ? 0 : 1]}`).join('')}
                  </p>
                  <div className="mt-auto pt-4">
                    <div className="h-1.5 bg-canvas rounded-full overflow-hidden mb-2.5">
                      <div
                        className={'progress-fill h-full w-full rounded-full ' + (pct === 100 ? 'bg-success' : 'bg-primary')}
                        style={{ transform: `scaleX(${pct / 100})` }}
                      />
                    </div>
                    <CourseStatus course={c} />
                  </div>
                </div>
              </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
