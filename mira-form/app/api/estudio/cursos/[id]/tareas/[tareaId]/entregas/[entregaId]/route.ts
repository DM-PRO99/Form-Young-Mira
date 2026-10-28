import { NextRequest, NextResponse } from 'next/server'
import { isValidObjectId } from 'mongoose'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import Entrega from '@/models/Entrega'
import { withCors, corsPreflight } from '@/lib/cors'
import { cargarTarea } from '@/lib/estudioTareas'
import { z } from 'zod'

type RouteContext = { params: Promise<{ id: string; tareaId: string; entregaId: string }> }

export { corsPreflight as OPTIONS }

const calificacionSchema = z.object({
  calificacion: z.number().min(0).nullable(),
  comentario: z.string().trim().max(5000).optional(),
})

export const PATCH = withCors(async (req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Solo el administrador puede calificar' }, { status: 403 })

  const { id, tareaId, entregaId } = await params
  if (!isValidObjectId(entregaId)) return NextResponse.json({ error: 'Entrega no encontrada' }, { status: 404 })

  const parsed = calificacionSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  await connectToMongoDB()
  const encontrado = await cargarTarea(id, tareaId, true)
  if (!encontrado) return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })

  const { calificacion, comentario } = parsed.data
  if (calificacion !== null && calificacion > encontrado.tarea.puntajeMaximo) {
    return NextResponse.json({ error: `La nota máxima de esta tarea es ${encontrado.tarea.puntajeMaximo}` }, { status: 400 })
  }

  // Quitar la nota (null) reabre la entrega para que la persona pueda volver a enviarla.
  const update =
    calificacion === null
      ? { $unset: { calificacion: 1, calificadaPor: 1, calificadaEn: 1 }, $set: { comentario: comentario || undefined } }
      : { $set: { calificacion, comentario: comentario || undefined, calificadaPor: session.user.id, calificadaEn: new Date() } }

  const entrega = await Entrega.findOneAndUpdate({ _id: entregaId, courseId: id, tareaId }, update, { new: true })
    .populate('userId', 'nombre email')
    .lean()
  if (!entrega) return NextResponse.json({ error: 'Entrega no encontrada' }, { status: 404 })

  return NextResponse.json({ data: entrega })
})
