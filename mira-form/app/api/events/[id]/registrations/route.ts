import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import { canAccessEvent } from '@/lib/rbac'
import Event from '@/models/Event'
import Registration from '@/models/Registration'
import { withCors, corsPreflight } from '@/lib/cors'
import { checkApiRateLimit, getClientIp } from '@/lib/apiRateLimit'
import { z } from 'zod'

type RouteContext = { params: Promise<{ id: string }> }
type MongoFilter = Record<string, unknown>

export { corsPreflight as OPTIONS }

export const GET = withCors(async (req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await connectToMongoDB()

  const event = await Event.findById(id)
  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  if (!canAccessEvent(session.user.id, session.user.role, event)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const q = req.nextUrl.searchParams.get('q') ?? ''
  const filter: MongoFilter = { eventoId: id }
  if (q) {
    filter.$or = [
      { cedula: { $regex: q, $options: 'i' } },
      { nombreCompleto: { $regex: q, $options: 'i' } },
    ]
  }

  const data = await Registration.find(filter).sort({ createdAt: -1 }).lean()

  return NextResponse.json({ data })
})

const acudienteSchema = z.object({
  nombre: z.string().optional(),
  telefono: z.string().optional(),
})

const registerSchema = z.object({
  nombreCompleto: z.string().min(1, 'El nombre es requerido'),
  cedula: z.string().min(1, 'La cédula es requerida'),
  telefono: z.string().min(1, 'El teléfono es requerido'),
  correo: z.string().email().optional().or(z.literal('')),
  edad: z.number().int().positive().optional(),
  acudiente: acudienteSchema.optional(),
})

export const POST = withCors(async (req: NextRequest, { params }: RouteContext) => {
  const { id } = await params

  const ip = getClientIp(req)
  const allowed = await checkApiRateLimit(`registro-evento:${ip}`, 10, 10 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { success: false, message: 'Demasiadas solicitudes, intenta de nuevo más tarde' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Datos inválidos' }, { status: 400 })
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.errors[0].message },
      { status: 400 }
    )
  }

  await connectToMongoDB()

  const event = await Event.findById(id)
  if (!event) return NextResponse.json({ success: false, message: 'Evento no encontrado' }, { status: 404 })

  if (event.estado !== 'publicado') {
    return NextResponse.json(
      { success: false, message: 'Este evento no está recibiendo inscripciones' },
      { status: 409 }
    )
  }

  if (event.capacidadMaxima) {
    const inscritos = await Registration.countDocuments({ eventoId: id, estado: { $ne: 'cancelado' } })
    if (inscritos >= event.capacidadMaxima) {
      return NextResponse.json({ success: false, message: 'Cupo agotado para este evento' }, { status: 409 })
    }
  }

  try {
    await Registration.create({
      eventoId: id,
      nombreCompleto: parsed.data.nombreCompleto,
      cedula: parsed.data.cedula,
      telefono: parsed.data.telefono,
      correo: parsed.data.correo || undefined,
      edad: parsed.data.edad,
      acudiente: parsed.data.acudiente,
    })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Esta cédula ya está inscrita en este evento' },
        { status: 409 }
      )
    }
    throw err
  }

  return NextResponse.json({ success: true, message: 'Inscripción exitosa' })
})
