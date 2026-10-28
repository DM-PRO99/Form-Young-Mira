import { NextRequest, NextResponse } from 'next/server'
import { isValidObjectId } from 'mongoose'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import Course, { type ICourse } from '@/models/Course'
import { estadoDelCurso } from '@/lib/estudioEstado'
import { cargarAvance } from '@/lib/estudioProgreso'
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

  const course = await Course.findOne({ _id: courseId, 'modulos.lecciones._id': leccionId })
    .select('estado desbloqueoSecuencial modulos._id modulos.lecciones._id modulos.cuestionario')
    .lean<ICourse>()
  const esAdmin = session.user.role === 'admin'
  if (!course || (course.estado !== 'publicado' && !esAdmin)) {
    return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 })
  }

  const avance = await cargarAvance(session.user.id, courseId)
  if (!esAdmin) {
    const indice = course.modulos.findIndex((m) => m.lecciones.some((l) => l._id.toString() === leccionId))
    const estado = estadoDelCurso(course, avance.completadas, avance.mejoresPuntajes)
    if (indice >= 0 && estado[indice].bloqueado) {
      return NextResponse.json({ error: 'Completa el tema anterior para desbloquear esta lección' }, { status: 403 })
    }
  }

  const filter = { userId: session.user.id, leccionId }
  if (completada) {
    await LessonProgress.updateOne(filter, { $setOnInsert: { ...filter, courseId } }, { upsert: true })
    avance.completadas.add(leccionId)
  } else {
    await LessonProgress.deleteOne(filter)
    avance.completadas.delete(leccionId)
  }

  return NextResponse.json({ success: true, estadoModulos: estadoDelCurso(course, avance.completadas, avance.mejoresPuntajes) })
})
