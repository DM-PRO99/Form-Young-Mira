import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import { canAccessEvent } from '@/lib/rbac'
import Event from '@/models/Event'
import Task from '@/models/Task'
import { withCors, corsPreflight } from '@/lib/cors'
import { z } from 'zod'

type RouteContext = { params: Promise<{ id: string; taskId: string }> }

export { corsPreflight as OPTIONS }

const updateSchema = z.object({
  titulo: z.string().min(1).optional(),
  responsableId: z.string().nullable().optional(),
  fechaLimite: z.string().nullable().optional(),
  completada: z.boolean().optional(),
})

export const PATCH = withCors(async (req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id, taskId } = await params
  const body: unknown = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  await connectToMongoDB()

  const event = await Event.findById(id)
  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  if (!canAccessEvent(session.user.id, session.user.role, event)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const task = await Task.findOne({ _id: taskId, eventoId: id })
  if (!task) return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })

  if (parsed.data.titulo !== undefined) task.titulo = parsed.data.titulo
  if (parsed.data.responsableId !== undefined) {
    task.responsableId = (parsed.data.responsableId || undefined) as unknown as typeof task.responsableId
  }
  if (parsed.data.fechaLimite !== undefined) {
    task.fechaLimite = parsed.data.fechaLimite ? new Date(parsed.data.fechaLimite) : undefined
  }
  if (parsed.data.completada !== undefined) task.completada = parsed.data.completada

  await task.save()

  return NextResponse.json({ data: task })
})

export const DELETE = withCors(async (_req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id, taskId } = await params
  await connectToMongoDB()

  const event = await Event.findById(id)
  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  if (!canAccessEvent(session.user.id, session.user.role, event)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  await Task.deleteOne({ _id: taskId, eventoId: id })

  return NextResponse.json({ success: true })
})
