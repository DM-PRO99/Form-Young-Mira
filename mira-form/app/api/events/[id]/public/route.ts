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

  // En un evento que se repite solo se ofrecen las fechas que no han pasado, de la más próxima a la más lejana.
  const now = Date.now()
  const futuras = event.fechas.filter((f) => f.getTime() >= now).sort((a, b) => a.getTime() - b.getTime())

  let fechasLlenas: Date[] = []
  if (event.capacidadMaxima && futuras.length > 0) {
    const porFecha = (await Registration.aggregate([
      { $match: { eventoId: event._id, estado: { $ne: 'cancelado' }, fecha: { $in: futuras } } },
      { $group: { _id: '$fecha', count: { $sum: 1 } } },
    ])) as Array<{ _id: Date; count: number }>
    const llenas = new Set(porFecha.filter((p) => p.count >= event.capacidadMaxima!).map((p) => p._id.getTime()))
    fechasLlenas = futuras.filter((f) => llenas.has(f.getTime()))
  }

  const terminado = event.fechas.length > 0 && futuras.length === 0
  const cupoAbierto = event.estado === 'publicado' && futuras.length > fechasLlenas.length

  return NextResponse.json({
    data: {
      nombre: event.nombre,
      descripcionPublica: event.descripcionPublica ?? '',
      fechas: futuras,
      fechasLlenas,
      totalFechas: event.fechas.length,
      terminado,
      lugar: event.lugar,
      estado: event.estado,
      cupoAbierto,
    },
  })
})
