import { isValidObjectId } from 'mongoose'
import { z } from 'zod'
import Course, { type ICourse, type ITarea } from '@/models/Course'

export const MAX_TEXTO_ENTREGA = 20_000
export const MAX_ENTREGA_BYTES = 50 * 1024 * 1024
export const ENTREGA_CONTENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/webp',
  'video/mp4',
  'application/zip',
  'application/x-zip-compressed',
]

export const tareaSchema = z
  .object({
    titulo: z.string().trim().min(1, 'La tarea necesita un título').max(200),
    instrucciones: z.string().max(200_000, 'Las instrucciones son demasiado largas').optional(),
    fechaLimite: z.string().datetime({ offset: true }).nullable().optional(),
    puntajeMaximo: z.number().int().min(1).max(1000),
    entregaArchivo: z.boolean(),
    entregaTexto: z.boolean(),
    publicada: z.boolean(),
  })
  .refine((t) => t.entregaArchivo || t.entregaTexto, 'La tarea debe permitir entregar un archivo, un texto o ambos')

// Carga el curso y la tarea; quien no es admin solo accede a cursos y tareas publicados.
export async function cargarTarea(
  courseId: string,
  tareaId: string,
  esAdmin: boolean
): Promise<{ course: ICourse; tarea: ITarea } | null> {
  if (!isValidObjectId(courseId) || !isValidObjectId(tareaId)) return null
  const course = await Course.findById(courseId).lean<ICourse>()
  if (!course || (course.estado !== 'publicado' && !esAdmin)) return null
  const tarea = (course.tareas ?? []).find((t) => t._id.toString() === tareaId)
  if (!tarea || (!tarea.publicada && !esAdmin)) return null
  return { course, tarea }
}

// El archivo de una entrega debe estar en la carpeta de esa persona dentro del curso.
export function archivoEsDeLaPersona(url: string, courseId: string, userId: string): boolean {
  try {
    return new URL(url).pathname.startsWith(`/estudio/${courseId}/entregas/${userId}/`)
  } catch {
    return false
  }
}
