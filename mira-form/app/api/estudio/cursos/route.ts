import { NextRequest, NextResponse } from 'next/server'
import { Types } from 'mongoose'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import Course, { type ICourse } from '@/models/Course'
import LessonProgress from '@/models/LessonProgress'
import QuizAttempt from '@/models/QuizAttempt'
import { estadoDelCurso } from '@/lib/estudioEstado'
import { withCors, corsPreflight } from '@/lib/cors'
import { z } from 'zod'

export { corsPreflight as OPTIONS }

export const GET = withCors(async () => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  await connectToMongoDB()

  const filter = session.user.role === 'admin' ? {} : { estado: 'publicado' as const }
  const courses = await Course.find(filter).sort({ updatedAt: -1 }).lean<ICourse[]>()

  const userId = new Types.ObjectId(session.user.id)
  const courseIds = courses.map((c) => c._id)
  const [progress, intentos] = await Promise.all([
    LessonProgress.aggregate<{ _id: Types.ObjectId; leccionIds: Types.ObjectId[] }>([
      { $match: { userId, courseId: { $in: courseIds } } },
      { $group: { _id: '$courseId', leccionIds: { $push: '$leccionId' } } },
    ]),
    QuizAttempt.aggregate<{ _id: { courseId: Types.ObjectId; moduloId: Types.ObjectId }; mejor: number }>([
      { $match: { userId, courseId: { $in: courseIds } } },
      { $group: { _id: { courseId: '$courseId', moduloId: '$moduloId' }, mejor: { $max: '$puntaje' } } },
    ]),
  ])
  const completedByCourse = new Map(progress.map((p) => [p._id.toString(), new Set(p.leccionIds.map((id) => id.toString()))]))
  const mejoresByCourse = new Map<string, Map<string, number>>()
  for (const i of intentos) {
    const cid = i._id.courseId.toString()
    if (!mejoresByCourse.has(cid)) mejoresByCourse.set(cid, new Map())
    mejoresByCourse.get(cid)!.set(i._id.moduloId.toString(), i.mejor)
  }

  const data = courses.map((c) => {
    const lecciones = c.modulos.flatMap((m) => m.lecciones)
    const done = completedByCourse.get(c._id.toString()) ?? new Set<string>()
    const estado = estadoDelCurso(c, done, mejoresByCourse.get(c._id.toString()) ?? new Map())
    const nextIndex = lecciones.findIndex((l) => !done.has(l._id.toString()))
    const cuestionarios = estado.filter((e) => e.tieneCuestionario)
    // El avance cuenta lecciones vistas y cuestionarios aprobados como pasos del curso.
    return {
      _id: c._id,
      titulo: c.titulo,
      descripcion: c.descripcion ?? '',
      estado: c.estado,
      updatedAt: c.updatedAt,
      totalModulos: c.modulos.length,
      totalLecciones: lecciones.length + cuestionarios.length,
      completadas: estado.reduce((s, e) => s + e.leccionesVistas, 0) + cuestionarios.filter((e) => e.aprobado).length,
      siguienteLeccion: nextIndex >= 0 ? nextIndex + 1 : null,
      tipos: {
        teoria: lecciones.filter((l) => !!l.contenido).length,
        video: lecciones.filter((l) => l.tipo === 'video').length,
        pdf: lecciones.filter((l) => l.tipo === 'pdf').length,
        presentacion: lecciones.filter((l) => l.tipo === 'presentacion').length,
        cuestionario: cuestionarios.length,
      },
    }
  })

  return NextResponse.json({ data })
})

const createSchema = z.object({
  titulo: z.string().trim().min(1, 'El título es requerido'),
  descripcion: z.string().optional(),
})

export const POST = withCors(async (req: NextRequest) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Solo el administrador puede crear cursos' }, { status: 403 })
  }

  const body: unknown = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  await connectToMongoDB()

  const course = await Course.create({
    titulo: parsed.data.titulo,
    descripcion: parsed.data.descripcion,
    creadoPor: session.user.id,
    modulos: [],
  })

  return NextResponse.json({ data: course }, { status: 201 })
})
