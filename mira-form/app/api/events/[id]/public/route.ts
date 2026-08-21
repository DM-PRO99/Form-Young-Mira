import { NextRequest, NextResponse } from 'next/server'
import { connectToMongoDB } from '@/lib/mongodb'
import Event from '@/models/Event'
import Registration from '@/models/Registration'
import { withCors, corsPreflight } from '@/lib/cors'

type RouteContext = { params: Promise<{ id: string }> }

export { corsPreflight as OPTIONS }

export const GET = withCors(async (_req: NextRequest, { params }: RouteContext) => {
  const { id } = await params
  await connectToMongoDB()

  const event = await Event.findById(id).select('nombre descripcionPublica fecha lugar capacidadMaxima estado').lean()
  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  let cupoAbierto = event.estado === 'publicado'
  if (cupoAbierto && event.capacidadMaxima) {
    const inscritos = await Registration.countDocuments({ eventoId: id, estado: { $ne: 'cancelado' } })
    cupoAbierto = inscritos < event.capacidadMaxima
  }

  return NextResponse.json({
    data: {
      nombre: event.nombre,
      descripcionPublica: event.descripcionPublica ?? '',
      fecha: event.fecha,
      lugar: event.lugar,
      estado: event.estado,
      cupoAbierto,
    },
  })
})
