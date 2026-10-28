import { NextRequest, NextResponse } from 'next/server'
import { isValidObjectId } from 'mongoose'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import Course, { type ICourse } from '@/models/Course'
import QuizAttempt from '@/models/QuizAttempt'
import { withCors, corsPreflight } from '@/lib/cors'
import { estadoDelCurso, tieneCuestionario } from '@/lib/estudioEstado'
import { cargarAvance } from '@/lib/estudioProgreso'
import { z } from 'zod'

type RouteContext = { params: Promise<{ id: string; moduloId: string }> }

export { corsPreflight as OPTIONS }

const attemptSchema = z.object({
  respuestas: z.array(z.number().int().min(0)).max(50),
})

export const POST = withCors(async (req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id, moduloId } = await params
  if (!isValidObjectId(id) || !isValidObjectId(moduloId)) {
    return NextResponse.json({ error: 'Cuestionario no encontrado' }, { status: 404 })
  }

  const body: unknown = await req.json().catch(() => null)
  const parsed = attemptSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Respuestas inválidas' }, { status: 400 })

  await connectToMongoDB()

  const course = await Course.findById(id).lean<ICourse>()
  const esAdmin = session.user.role === 'admin'
  if (!course || (course.estado !== 'publicado' && !esAdmin)) {
    return NextResponse.json({ error: 'Cuestionario no encontrado' }, { status: 404 })
  }

  const indice = course.modulos.findIndex((m) => m._id.toString() === moduloId)
  const modulo = course.modulos[indice]
  if (!modulo || !tieneCuestionario(modulo.cuestionario)) {
    return NextResponse.json({ error: 'Este tema no tiene cuestionario' }, { status: 404 })
  }

  const avance = await cargarAvance(session.user.id, id)
  if (!esAdmin && estadoDelCurso(course, avance.completadas, avance.mejoresPuntajes)[indice].bloqueado) {
    return NextResponse.json({ error: 'Completa el tema anterior para presentar este cuestionario' }, { status: 403 })
  }

  const preguntas = modulo.cuestionario!.preguntas
  const { respuestas } = parsed.data
  if (respuestas.length !== preguntas.length) {
    return NextResponse.json({ error: 'Responde todas las preguntas' }, { status: 400 })
  }

  const aciertos = preguntas.map((p, i) => respuestas[i] === p.correcta)
  const puntaje = Math.round((aciertos.filter(Boolean).length / preguntas.length) * 100)
  const notaMinima = modulo.cuestionario!.notaMinima
  const aprobado = puntaje >= notaMinima

  await QuizAttempt.create({ userId: session.user.id, courseId: id, moduloId, respuestas, puntaje, aprobado })

  const anterior = avance.mejoresPuntajes.get(moduloId)
  const mejorPuntaje = anterior === undefined ? puntaje : Math.max(anterior, puntaje)
  avance.mejoresPuntajes.set(moduloId, mejorPuntaje)

  return NextResponse.json({
    data: {
      puntaje,
      aprobado,
      notaMinima,
      mejorPuntaje,
      aciertos,
      estadoModulos: estadoDelCurso(course, avance.completadas, avance.mejoresPuntajes),
    },
  })
})
