'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { CourseDetail } from '../_types'

interface CursoContextValue {
  course: CourseDetail | null
  loading: boolean
  role: 'admin' | 'coordinador'
  esAdmin: boolean
  userId: string | null
  refetch: () => Promise<void>
  setCourse: React.Dispatch<React.SetStateAction<CourseDetail | null>>
}

const CursoContext = createContext<CursoContextValue | null>(null)

// Todas las secciones del curso (Inicio, Módulos, Tareas…) comparten una sola carga del curso.
export function CursoProvider({ id, children }: { id: string; children: React.ReactNode }) {
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<'admin' | 'coordinador'>('coordinador')
  const [userId, setUserId] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    const res = await fetch(`/api/estudio/cursos/${id}`)
    if (res.ok) setCourse(((await res.json()) as { data: CourseDetail }).data)
    else setCourse(null)
  }, [id])

  useEffect(() => {
    let vivo = true
    void (async () => {
      const [meRes] = await Promise.all([fetch('/api/auth/me'), refetch()])
      if (vivo && meRes.ok) {
        const me = (await meRes.json()) as { id?: string; role?: 'admin' | 'coordinador' }
        setRole(me.role ?? 'coordinador')
        setUserId(me.id ?? null)
      }
      if (vivo) setLoading(false)
    })()
    return () => {
      vivo = false
    }
  }, [refetch])

  return (
    <CursoContext.Provider value={{ course, loading, role, esAdmin: role === 'admin', userId, refetch, setCourse }}>
      {children}
    </CursoContext.Provider>
  )
}

export function useCurso(): CursoContextValue & { course: CourseDetail } {
  const ctx = useContext(CursoContext)
  if (!ctx || !ctx.course) throw new Error('useCurso debe usarse dentro del curso ya cargado')
  return ctx as CursoContextValue & { course: CourseDetail }
}

export function useCursoEstado(): CursoContextValue {
  const ctx = useContext(CursoContext)
  if (!ctx) throw new Error('useCursoEstado debe usarse dentro de CursoProvider')
  return ctx
}

export function Teoria({ html, className }: { html: string; className?: string }) {
  // El HTML ya viene sanitizado por el servidor al guardar (lib/estudioContenido.ts).
  return <div className={className ?? 'prose-mira max-w-[72ch]'} dangerouslySetInnerHTML={{ __html: html }} />
}
