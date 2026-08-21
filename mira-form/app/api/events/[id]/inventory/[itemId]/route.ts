import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import { canAccessEvent } from '@/lib/rbac'
import Event from '@/models/Event'
import InventoryItem from '@/models/InventoryItem'
import { withCors, corsPreflight } from '@/lib/cors'
import { z } from 'zod'

type RouteContext = { params: Promise<{ id: string; itemId: string }> }

export { corsPreflight as OPTIONS }

const updateSchema = z.object({
  nombre: z.string().min(1).optional(),
  cantidad: z.string().optional(),
  responsable: z.string().nullable().optional(),
  estado: z.enum(['pendiente', 'comprado', 'conseguido']).optional(),
  notas: z.string().optional(),
})

export const PATCH = withCors(async (req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id, itemId } = await params
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

  const item = await InventoryItem.findOne({ _id: itemId, eventoId: id })
  if (!item) return NextResponse.json({ error: 'Ítem no encontrado' }, { status: 404 })

  if (parsed.data.nombre !== undefined) item.nombre = parsed.data.nombre
  if (parsed.data.cantidad !== undefined) item.cantidad = parsed.data.cantidad
  if (parsed.data.responsable !== undefined) {
    item.responsable = parsed.data.responsable || undefined
  }
  if (parsed.data.estado !== undefined) item.estado = parsed.data.estado
  if (parsed.data.notas !== undefined) item.notas = parsed.data.notas

  await item.save()

  return NextResponse.json({ data: item })
})

export const DELETE = withCors(async (_req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id, itemId } = await params
  await connectToMongoDB()

  const event = await Event.findById(id)
  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
  if (!canAccessEvent(session.user.id, session.user.role, event)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  await InventoryItem.deleteOne({ _id: itemId, eventoId: id })

  return NextResponse.json({ success: true })
})
