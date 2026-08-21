import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import { canAccessEvent } from '@/lib/rbac'
import Event from '@/models/Event'
import Task from '@/models/Task'
import { withCors, corsPreflight } from '@/lib/cors'
import { z } from 'zod'

type RouteContext = { params: Promise<{ id: string }> }

export { corsPreflight as OPTIONS }

export const GET = withCors(async (_req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await connectToMongoDB()

  const event = await Event.findById(id)
  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  if (!canAccessEvent(session.user.id, session.user.role, event)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const data = await Task.find({ eventoId: id })
    .populate('responsableId', 'nombre email')
    .sort({ fechaLimite: 1, createdAt: 1 })
    .lean()

  return NextResponse.json({ data })
})

const createSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  responsableId: z.string().optional(),
  fechaLimite: z.string().optional(),
})

export const POST = withCors(async (req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body: unknown = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  await connectToMongoDB()

  const event = await Event.findById(id)
  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  if (!canAccessEvent(session.user.id, session.user.role, event)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const task = await Task.create({
    eventoId: id,
    titulo: parsed.data.titulo,
    responsableId: parsed.data.responsableId || undefined,
    fechaLimite: parsed.data.fechaLimite ? new Date(parsed.data.fechaLimite) : undefined,
  })

  return NextResponse.json({ data: task }, { status: 201 })
})
