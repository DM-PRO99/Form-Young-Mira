import { NextRequest, NextResponse } from 'next/server'
import { connectToMongoDB } from '@/lib/mongodb'
import Event from '@/models/Event'
import Registration from '@/models/Registration'
import { withCors, corsPreflight } from '@/lib/cors'
import { invalidIdResponse } from '@/lib/objectId'

type RouteContext = { params: Promise<{ id: string }> }

export { corsPreflight as OPTIONS }

export const GET = withCors(async (_req: NextRequest, { params }: RouteContext) => {
  const { id } = await params
  const invalid = invalidIdResponse(id)
  if (invalid) return invalid
  await connectToMongoDB()

  const event = await Event.findById(id).select('nombre descripcionPublica fechas lugar capacidadMaxima estado').lean()
  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  let cupoAbierto = event.estado === 'publicado'
  if (cupoAbierto && event.capacidadMaxima) {
    const inscritos = await Registration.countDocuments({ eventoId: id, estado: { $ne: 'cancelado' } })
    cupoAbierto = inscritos < event.capacidadMaxima * event.fechas.length
  }

  return NextResponse.json({
    data: {
      nombre: event.nombre,
      descripcionPublica: event.descripcionPublica ?? '',
      fechas: event.fechas,
      lugar: event.lugar,
      estado: event.estado,
      cupoAbierto,
    },
  })
})
