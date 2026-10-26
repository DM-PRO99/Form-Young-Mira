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
}

export const LESSON_LABEL: Record<LessonType, string> = {
  video: 'Video',
  pdf: 'PDF',
  presentacion: 'Presentación',
}
