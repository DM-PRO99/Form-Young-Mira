import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import { canAccessEvent } from '@/lib/rbac'
import Event from '@/models/Event'
import { withCors, corsPreflight } from '@/lib/cors'
import { z } from 'zod'

type RouteContext = { params: Promise<{ id: string }> }

export { corsPreflight as OPTIONS }

export const GET = withCors(async (_req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await connectToMongoDB()

  const event = await Event.findById(id).populate('coordinadoresAsignados', 'nombre email')
  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  if (!canAccessEvent(session.user.id, session.user.role, event)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  return NextResponse.json({ data: event })
})

const updateSchema = z.object({
  nombre: z.string().min(1).optional(),
  descripcionPublica: z.string().optional(),
  fecha: z.string().optional(),
  lugar: z.string().min(1).optional(),
  capacidadMaxima: z.number().int().positive().nullable().optional(),
  estado: z.enum(['borrador', 'publicado', 'cerrado']).optional(),
  coordinadoresAsignados: z.array(z.string()).optional(),
})

export const PATCH = withCors(async (req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body: unknown = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  await connectToMongoDB()

  const event = await Event.findById(id)
  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  const { role, id: userId } = session.user
  if (!canAccessEvent(userId, role, event)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  if (parsed.data.coordinadoresAsignados !== undefined) {
    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo el administrador puede asignar coordinadores' },
        { status: 403 }
      )
    }
    event.coordinadoresAsignados = parsed.data.coordinadoresAsignados as unknown as typeof event.coordinadoresAsignados
  }

  if (parsed.data.nombre !== undefined) event.nombre = parsed.data.nombre
  if (parsed.data.descripcionPublica !== undefined) event.descripcionPublica = parsed.data.descripcionPublica
  if (parsed.data.fecha !== undefined) event.fecha = new Date(parsed.data.fecha)
  if (parsed.data.lugar !== undefined) event.lugar = parsed.data.lugar
  if (parsed.data.capacidadMaxima !== undefined) event.capacidadMaxima = parsed.data.capacidadMaxima ?? undefined
  if (parsed.data.estado !== undefined) event.estado = parsed.data.estado

  await event.save()

  return NextResponse.json({ data: event })
})
