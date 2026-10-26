import { NextRequest, NextResponse } from 'next/server'
import { isValidObjectId } from 'mongoose'
import { del } from '@vercel/blob'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import Course from '@/models/Course'
import LessonProgress from '@/models/LessonProgress'
import { withCors, corsPreflight } from '@/lib/cors'
import { isBlobUrl } from '@/lib/estudio'
import { z } from 'zod'

type RouteContext = { params: Promise<{ id: string }> }

export { corsPreflight as OPTIONS }

async function deleteBlobs(urls: string[]) {
  if (urls.length === 0) return
  try {
    await del(urls)
  } catch (err) {
    console.error('Error al borrar archivos de Blob (no fatal):', err)
  }
}

export const GET = withCors(async (_req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  if (!isValidObjectId(id)) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })

  await connectToMongoDB()

  const course = await Course.findById(id).lean()
  if (!course || (course.estado !== 'publicado' && session.user.role !== 'admin')) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
  }

  const progress = await LessonProgress.find({ userId: session.user.id, courseId: id }).select('leccionId').lean()

  return NextResponse.json({
    data: { ...course, completadas: progress.map((p) => p.leccionId.toString()) },
  })
})

const lessonSchema = z.object({
  _id: z.string().optional(),
  titulo: z.string().trim().min(1, 'Cada lección necesita un título'),
  tipo: z.enum(['video', 'pdf', 'presentacion']),
  archivoUrl: z.string().refine(isBlobUrl, 'Archivo inválido'),
  archivoNombre: z.string().min(1),
  tamano: z.number().nonnegative(),
})

const moduleSchema = z.object({
  _id: z.string().optional(),
  titulo: z.string().trim().min(1, 'Cada módulo necesita un título'),
  lecciones: z.array(lessonSchema),
})

const updateSchema = z.object({
  titulo: z.string().trim().min(1, 'El título es requerido').optional(),
  descripcion: z.string().optional(),
  estado: z.enum(['borrador', 'publicado']).optional(),
  modulos: z.array(moduleSchema).optional(),
})

export const PATCH = withCors(async (req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Solo el administrador puede editar cursos' }, { status: 403 })
  }

  const { id } = await params
  if (!isValidObjectId(id)) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })

  const body: unknown = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  await connectToMongoDB()

  const course = await Course.findById(id)
  if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })

  if (parsed.data.titulo !== undefined) course.titulo = parsed.data.titulo
  if (parsed.data.descripcion !== undefined) course.descripcion = parsed.data.descripcion
  if (parsed.data.estado !== undefined) course.estado = parsed.data.estado

  let removedUrls: string[] = []
  let removedLessonIds: string[] = []

  if (parsed.data.modulos !== undefined) {
    const oldLessons = course.modulos.flatMap((m) => m.lecciones)
    const newLessons = parsed.data.modulos.flatMap((m) => m.lecciones)
    const newUrls = new Set(newLessons.map((l) => l.archivoUrl))
    const newIds = new Set(newLessons.map((l) => l._id).filter(Boolean))

    removedUrls = oldLessons.map((l) => l.archivoUrl).filter((url) => !newUrls.has(url))
    removedLessonIds = oldLessons.map((l) => l._id.toString()).filter((lid) => !newIds.has(lid))

    course.set('modulos', parsed.data.modulos)
  }

  await course.save()

  if (removedLessonIds.length > 0) {
    await LessonProgress.deleteMany({ courseId: id, leccionId: { $in: removedLessonIds } })
  }
  await deleteBlobs(removedUrls)

  return NextResponse.json({ data: course })
})

export const DELETE = withCors(async (_req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Solo el administrador puede eliminar cursos' }, { status: 403 })
  }

  const { id } = await params
  if (!isValidObjectId(id)) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })

  await connectToMongoDB()

  const course = await Course.findById(id)
  if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })

  const urls = course.modulos.flatMap((m) => m.lecciones.map((l) => l.archivoUrl))

  await LessonProgress.deleteMany({ courseId: id })
  await Course.deleteOne({ _id: id })
  await deleteBlobs(urls)

  return NextResponse.json({ success: true })
})
