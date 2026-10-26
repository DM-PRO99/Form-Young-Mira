import type { LessonType } from '@/models/Course'

export type { LessonType }

export interface Lesson {
  _id?: string
  titulo: string
  tipo: LessonType
  archivoUrl: string
  archivoNombre: string
  tamano: number
}

export interface Module {
  _id?: string
  titulo: string
  lecciones: Lesson[]
}

export interface CourseDetail {
  _id: string
  titulo: string
  descripcion?: string
  estado: 'borrador' | 'publicado'
  modulos: Module[]
  completadas: string[]
}

export interface CourseSummary {
  _id: string
  titulo: string
  descripcion: string
  estado: 'borrador' | 'publicado'
  totalModulos: number
  totalLecciones: number
  completadas: number
  siguienteLeccion: number | null
  tipos: Record<LessonType, number>
}

export const LESSON_LABEL: Record<LessonType, string> = {
  video: 'Video',
  pdf: 'PDF',
  presentacion: 'Presentación',
}

// Tonos de la paleta MIRA; cada curso recibe siempre el mismo según su id.
const COURSE_THEMES = [
  ['#00318C', '#001348'],
  ['#1E56E8', '#0A2472'],
  ['#5B3FE4', '#2A1A8C'],
  ['#0E7490', '#083344'],
  ['#2563EB', '#1E3A8A'],
  ['#7C3AED', '#3B0764'],
] as const

export function courseGradient(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  const [from, to] = COURSE_THEMES[hash % COURSE_THEMES.length]
  return `linear-gradient(160deg, ${from} 0%, ${to} 100%)`
}
