import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import Event from '@/models/Event'
import Registration from '@/models/Registration'
import { withCors, corsPreflight } from '@/lib/cors'
import { searchPattern } from '@/lib/searchRegex'
import { z } from 'zod'

type MongoFilter = Record<string, unknown>

export { corsPreflight as OPTIONS }

export const GET = withCors(async (req: NextRequest) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { role, id: userId } = session.user
  const { searchParams } = req.nextUrl

  const q = searchParams.get('q') ?? ''
  const estado = searchParams.get('estado') ?? ''

  await connectToMongoDB()

  const filters: MongoFilter[] = []

  if (role !== 'admin') {
    filters.push({ $or: [{ creadoPor: userId }, { coordinadoresAsignados: userId }] })
  }

  if (estado) filters.push({ estado })

  const pattern = searchPattern(q)
  if (pattern) {
    filters.push({
      $or: [
        { nombre: { $regex: pattern, $options: 'i' } },
        { lugar: { $regex: pattern, $options: 'i' } },
      ],
    })
  }

  const mongoFilter: MongoFilter =
    filters.length > 1 ? { $and: filters } : filters.length === 1 ? filters[0] : {}

  const events = await Event.find(mongoFilter)
    .sort({ 'fechas.0': -1 })
    .populate('coordinadoresAsignados', 'nombre email')
    .lean()

  const counts = await Registration.aggregate([
    { $match: { eventoId: { $in: events.map((e) => e._id) }, estado: { $ne: 'cancelado' } } },
    { $group: { _id: '$eventoId', count: { $sum: 1 } } },
  ])
  const countByEvent = new Map(counts.map((c) => [c._id.toString(), c.count]))

  const data = events.map((e) => ({
    ...e,
    inscritos: countByEvent.get(e._id.toString()) ?? 0,
  }))

  return NextResponse.json({ data })
})

const createSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcionPublica: z.string().optional(),
  fechas: z.array(z.string().min(1)).min(1, 'Agrega al menos una fecha'),
  lugar: z.string().min(1, 'El lugar es requerido'),
  capacidadMaxima: z.number().int().positive().optional(),
  estado: z.enum(['borrador', 'publicado']).default('borrador'),
  coordinadoresAsignados: z.array(z.string()).default([]),
})

export const POST = withCors(async (req: NextRequest) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body: unknown = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  await connectToMongoDB()

  const { role, id: userId } = session.user
  const coordinadoresAsignados =
    role === 'admin' ? parsed.data.coordinadoresAsignados : [userId]

  const event = await Event.create({
    nombre: parsed.data.nombre,
    descripcionPublica: parsed.data.descripcionPublica,
    fechas: parsed.data.fechas.map((f) => new Date(f)),
    lugar: parsed.data.lugar,
    capacidadMaxima: parsed.data.capacidadMaxima,
    estado: parsed.data.estado,
    creadoPor: userId,
    coordinadoresAsignados,
  })

  return NextResponse.json({ data: event }, { status: 201 })
})
