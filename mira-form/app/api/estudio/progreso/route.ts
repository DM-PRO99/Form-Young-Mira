import { NextRequest, NextResponse } from 'next/server'
import { isValidObjectId } from 'mongoose'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import Course from '@/models/Course'
import LessonProgress from '@/models/LessonProgress'
import { withCors, corsPreflight } from '@/lib/cors'
import { z } from 'zod'

export { corsPreflight as OPTIONS }

const progressSchema = z.object({
  courseId: z.string().refine(isValidObjectId),
  leccionId: z.string().refine(isValidObjectId),
  completada: z.boolean(),
})

export const POST = withCors(async (req: NextRequest) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body: unknown = await req.json()
  const parsed = progressSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

  const { courseId, leccionId, completada } = parsed.data
  await connectToMongoDB()

  const course = await Course.findOne({ _id: courseId, 'modulos.lecciones._id': leccionId }).select('estado').lean()
  if (!course || (course.estado !== 'publicado' && session.user.role !== 'admin')) {
    return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 })
  }

  const filter = { userId: session.user.id, leccionId }
  if (completada) {
    await LessonProgress.updateOne(filter, { $setOnInsert: { ...filter, courseId } }, { upsert: true })
  } else {
    await LessonProgress.deleteOne(filter)
  }

  return NextResponse.json({ success: true })
})
