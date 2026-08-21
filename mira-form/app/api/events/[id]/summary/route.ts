import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import { canAccessEvent } from '@/lib/rbac'
import Event from '@/models/Event'
import Registration from '@/models/Registration'
import InventoryItem from '@/models/InventoryItem'
import Task from '@/models/Task'
import { withCors, corsPreflight } from '@/lib/cors'

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

  const [inscritos, inventoryItems, tasks, ultimasInscripciones] = await Promise.all([
    Registration.countDocuments({ eventoId: id, estado: { $ne: 'cancelado' } }),
    InventoryItem.find({ eventoId: id }).select('estado').lean(),
    Task.find({ eventoId: id }).select('completada').lean(),
    Registration.find({ eventoId: id }).sort({ createdAt: -1 }).limit(4).lean(),
  ])

  const inventarioTotal = inventoryItems.length
  const inventarioConseguidos = inventoryItems.filter((i) => i.estado !== 'pendiente').length
  const tareasTotal = tasks.length
  const tareasCompletadas = tasks.filter((t) => t.completada).length

  const capacidadMaxima = event.capacidadMaxima ?? null
  const cuposDisponibles = capacidadMaxima !== null ? Math.max(0, capacidadMaxima - inscritos) : null

  return NextResponse.json({
    data: {
      inscritos,
      capacidadMaxima,
      cuposDisponibles,
      inventario: {
        total: inventarioTotal,
        conseguidos: inventarioConseguidos,
        porcentaje: inventarioTotal > 0 ? Math.round((inventarioConseguidos / inventarioTotal) * 100) : 0,
      },
      tareas: {
        total: tareasTotal,
        completadas: tareasCompletadas,
      },
      ultimasInscripciones,
    },
  })
})
