import { NextRequest, NextResponse } from 'next/server'
import { isValidObjectId, Types } from 'mongoose'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import Course, { type ICourse } from '@/models/Course'
import LessonProgress from '@/models/LessonProgress'
import QuizAttempt from '@/models/QuizAttempt'
import User from '@/models/User'
import { withCors, corsPreflight } from '@/lib/cors'
import { estadoDelCurso, tieneCuestionario } from '@/lib/estudioEstado'

type RouteContext = { params: Promise<{ id: string }> }

export { corsPreflight as OPTIONS }

export const GET = withCors(async (_req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })

  const { id } = await params
  if (!isValidObjectId(id)) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })

  await connectToMongoDB()

  const course = await Course.findById(id).lean<ICourse>()
  if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })

  const courseId = new Types.ObjectId(id)
  const [usuarios, progreso, intentos] = await Promise.all([
    User.find({ role: 'coordinador', activo: true }).select('nombre email municipios').sort({ nombre: 1 }).lean(),
    LessonProgress.aggregate<{ _id: Types.ObjectId; lecciones: Types.ObjectId[]; ultima: Date }>([
      { $match: { courseId } },
      { $group: { _id: '$userId', lecciones: { $push: '$leccionId' }, ultima: { $max: '$createdAt' } } },
    ]),
    QuizAttempt.aggregate<{ _id: { userId: Types.ObjectId; moduloId: Types.ObjectId }; mejor: number; ultima: Date }>([
      { $match: { courseId } },
      { $group: { _id: { userId: '$userId', moduloId: '$moduloId' }, mejor: { $max: '$puntaje' }, ultima: { $max: '$createdAt' } } },
    ]),
  ])

  const progresoPorUsuario = new Map(progreso.map((p) => [p._id.toString(), p]))
  const intentosPorUsuario = new Map<string, { mejores: Map<string, number>; ultima: Date }>()
  for (const i of intentos) {
    const uid = i._id.userId.toString()
    const actual = intentosPorUsuario.get(uid) ?? { mejores: new Map<string, number>(), ultima: i.ultima }
    actual.mejores.set(i._id.moduloId.toString(), i.mejor)
    if (i.ultima > actual.ultima) actual.ultima = i.ultima
    intentosPorUsuario.set(uid, actual)
  }

  const totalLecciones = course.modulos.reduce((s, m) => s + m.lecciones.length, 0)
  const totalCuestionarios = course.modulos.filter((m) => tieneCuestionario(m.cuestionario)).length
  const totalPasos = totalLecciones + totalCuestionarios

  const participantes = usuarios.map((u) => {
    const uid = u._id.toString()
    const p = progresoPorUsuario.get(uid)
    const q = intentosPorUsuario.get(uid)
    const estado = estadoDelCurso(course, new Set((p?.lecciones ?? []).map((l) => l.toString())), q?.mejores ?? new Map())
    const leccionesVistas = estado.reduce((s, e) => s + e.leccionesVistas, 0)
    const cuestionariosAprobados = estado.filter((e) => e.tieneCuestionario && e.aprobado).length
    const fechas = [p?.ultima, q?.ultima].filter((d): d is Date => !!d)
    return {
      userId: uid,
      nombre: u.nombre,
      email: u.email,
      municipios: u.municipios ?? [],
      leccionesVistas,
      totalLecciones,
      porcentaje: totalPasos > 0 ? Math.round(((leccionesVistas + cuestionariosAprobados) / totalPasos) * 100) : 0,
      temasCompletados: estado.filter((e) => e.completo).length,
      totalTemas: course.modulos.length,
      notas: Object.fromEntries(estado.filter((e) => e.tieneCuestionario).map((e) => [e.moduloId, e.mejorPuntaje])),
      completo: course.modulos.length > 0 && estado.every((e) => e.completo),
      ultimaActividad: fechas.length ? new Date(Math.max(...fechas.map((d) => d.getTime()))) : null,
    }
  })

  return NextResponse.json({
    data: {
      curso: {
        _id: course._id,
        titulo: course.titulo,
        totalLecciones,
        modulos: course.modulos.map((m) => ({
          _id: m._id,
          titulo: m.titulo,
          tieneCuestionario: tieneCuestionario(m.cuestionario),
          notaMinima: m.cuestionario?.notaMinima ?? null,
        })),
      },
      participantes,
    },
  })
})
