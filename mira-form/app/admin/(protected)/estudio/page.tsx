'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, GraduationCap, BookOpen } from 'lucide-react'
import type { CourseSummary } from './_types'

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
            <div key={i} className="h-[220px] bg-surface rounded-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-surface rounded-card border border-border shadow-card px-[22px] py-12 text-center">
          <p className="text-sm text-ink-muted mb-3">{error}</p>
          <button onClick={() => void fetchData()} className="text-sm text-primary hover:underline">
            Reintentar
          </button>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-surface rounded-card border border-border shadow-card px-[22px] py-14 text-center">
          <GraduationCap className="w-8 h-8 text-ink-faint mx-auto mb-3" strokeWidth={1.6} />
          <p className="text-sm text-ink-muted">
            {role === 'admin' ? 'Aún no hay cursos. Crea el primero.' : 'Aún no hay cursos publicados.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
          {courses.map((c, i) => {
            const pct = c.totalLecciones > 0 ? Math.round((c.completadas / c.totalLecciones) * 100) : 0
            return (
              <button
                key={c._id}
                onClick={() => router.push(`/admin/estudio/${c._id}`)}
                className="animate-riseIn text-left bg-surface rounded-card border border-border shadow-card overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div
                  className="h-[92px] px-5 flex items-end pb-4 relative"
                  style={{ background: 'linear-gradient(175deg, #00318C 0%, #001348 100%)' }}
                >
                  <BookOpen className="w-7 h-7 text-white/85" strokeWidth={1.6} />
                  {role === 'admin' && (
                    <span
                      className={
                        'absolute top-3 right-3 px-2 py-0.5 rounded-full text-[11px] font-semibold ' +
                        (c.estado === 'publicado' ? 'bg-success-tint text-success' : 'bg-white/90 text-ink-faint')
                      }
                    >
                      {c.estado === 'publicado' ? 'Publicado' : 'Borrador'}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-[14.5px] font-semibold text-ink mb-1 truncate">{c.titulo}</p>
                  <p className="text-[12.5px] text-ink-muted line-clamp-2 min-h-[36px]">{c.descripcion || 'Sin descripción'}</p>
                  <p className="text-[12px] text-ink-faint font-mono mt-3 mb-2">
                    {c.totalModulos} módulo{c.totalModulos === 1 ? '' : 's'} · {c.totalLecciones} lección
                    {c.totalLecciones === 1 ? '' : 'es'}
                  </p>
                  <div className="flex items-center gap-2.5">
                    <div className="flex-1 h-1.5 bg-canvas rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11.5px] font-mono text-ink-muted tabular-nums">{pct}%</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
