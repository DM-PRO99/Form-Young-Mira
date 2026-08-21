import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import { canAccessEvent } from '@/lib/rbac'
import Event from '@/models/Event'
import InventoryItem from '@/models/InventoryItem'
import { withCors, corsPreflight } from '@/lib/cors'
import { z } from 'zod'

type RouteContext = { params: Promise<{ id: string }> }

export { corsPreflight as OPTIONS }

async function loadEventForAccess(id: string, userId: string, role: string) {
  const event = await Event.findById(id)
  if (!event) return { error: NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 }) }
  if (!canAccessEvent(userId, role, event)) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 403 }) }
  }
  return { event }
}

export const GET = withCors(async (_req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await connectToMongoDB()

  const { error } = await loadEventForAccess(id, session.user.id, session.user.role)
  if (error) return error

  const data = await InventoryItem.find({ eventoId: id })
    .populate('responsableId', 'nombre email')
    .sort({ createdAt: 1 })
    .lean()

  return NextResponse.json({ data })
})

const createSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  cantidad: z.string().optional(),
  responsableId: z.string().optional(),
  notas: z.string().optional(),
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

  const { error } = await loadEventForAccess(id, session.user.id, session.user.role)
  if (error) return error

  const item = await InventoryItem.create({
    eventoId: id,
    nombre: parsed.data.nombre,
    cantidad: parsed.data.cantidad,
    responsableId: parsed.data.responsableId || undefined,
    notas: parsed.data.notas,
  })

  return NextResponse.json({ data: item }, { status: 201 })
})
