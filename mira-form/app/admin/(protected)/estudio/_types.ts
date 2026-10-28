import type { LessonType } from '@/models/Course'
import type { EstadoModulo } from '@/lib/estudioEstado'

export type { LessonType, EstadoModulo }

// La teoría (contenido) y el adjunto (tipo + archivo) son opcionales: una lección puede tener uno, otro o ambos.
export interface Lesson {
  _id?: string
  // Clave temporal solo del cliente para lecciones nuevas que aún no tienen _id (la API la descarta).
  _key?: string
  titulo: string
  contenido?: string
  tipo?: LessonType
  archivoUrl?: string
  archivoNombre?: string
  tamano?: number
}

export interface Question {
  _id?: string
  enunciado: string
  opciones: string[]
  // Solo llega al admin; a los demás la API nunca les envía la respuesta correcta.
  correcta?: number
}

export interface Quiz {
  preguntas: Question[]
  notaMinima: number
  totalPreguntas?: number
}

export interface Module {
  _id?: string
  titulo: string
  descripcion?: string
  lecciones: Lesson[]
  cuestionario?: Quiz | null
}

export interface CourseDetail {
  _id: string
  titulo: string
  descripcion?: string
  estado: 'borrador' | 'publicado'
  desbloqueoSecuencial?: boolean
  modulos: Module[]
  completadas: string[]
  estadoModulos: EstadoModulo[]
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
  tipos: { teoria: number; video: number; pdf: number; presentacion: number; cuestionario: number }
}

export function tieneAdjunto(l: Lesson): l is Lesson & { tipo: LessonType; archivoUrl: string; archivoNombre: string; tamano: number } {
  return !!(l.tipo && l.archivoUrl)
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
