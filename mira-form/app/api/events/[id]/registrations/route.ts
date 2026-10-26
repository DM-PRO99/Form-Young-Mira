import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import { canAccessEvent } from '@/lib/rbac'
import Event from '@/models/Event'
import Registration from '@/models/Registration'
import { withCors, corsPreflight } from '@/lib/cors'
import { invalidIdResponse } from '@/lib/objectId'
import { checkApiRateLimit, getClientIp } from '@/lib/apiRateLimit'
import { sendRegistrationThankYou } from '@/lib/email'
import { searchPattern } from '@/lib/searchRegex'
import { MUNICIPIOS } from '@/lib/municipios'
import { z } from 'zod'

type RouteContext = { params: Promise<{ id: string }> }
type MongoFilter = Record<string, unknown>

export { corsPreflight as OPTIONS }

export const GET = withCors(async (req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const invalid = invalidIdResponse(id)
  if (invalid) return invalid
  await connectToMongoDB()

  const event = await Event.findById(id)
  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  if (!canAccessEvent(session.user.id, session.user.role, event)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const pattern = searchPattern(req.nextUrl.searchParams.get('q') ?? '')
  const filter: MongoFilter = { eventoId: id }
  if (pattern) {
    filter.$or = [
      { cedula: { $regex: pattern, $options: 'i' } },
      { nombreCompleto: { $regex: pattern, $options: 'i' } },
    ]
  }

  const data = await Registration.find(filter).sort({ createdAt: -1 }).lean()

  return NextResponse.json({ data })
})

const acudienteSchema = z.object({
  nombre: z.string().trim().max(100).optional(),
  telefono: z.string().trim().max(30).optional(),
})

const registerSchema = z.object({
  nombreCompleto: z.string().trim().min(1, 'El nombre es requerido').max(100),
  cedula: z.string().trim().regex(/^\d{5,15}$/, 'Cédula inválida'),
  telefono: z.string().trim().min(1, 'El teléfono es requerido').max(30),
  correo: z.string().trim().email().max(254).optional().or(z.literal('')),
  municipio: z.enum(MUNICIPIOS, { message: 'Selecciona un municipio válido' }),
  fecha: z.string().min(1, 'Selecciona una fecha').max(40),
  edad: z.number().int().positive().max(120).optional(),
  acudiente: acudienteSchema.optional(),
})

export const POST = withCors(async (req: NextRequest, { params }: RouteContext) => {
  const { id } = await params
  const invalid = invalidIdResponse(id)
  if (invalid) return invalid

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
      { success: false, message: parsed.error.issues[0].message },
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

  const fechaSeleccionada = new Date(parsed.data.fecha)
  const esFechaValida = event.fechas.some((f) => f.getTime() === fechaSeleccionada.getTime())
  if (!esFechaValida) {
    return NextResponse.json({ success: false, message: 'La fecha seleccionada no es válida' }, { status: 400 })
  }

  if (event.capacidadMaxima) {
    const inscritos = await Registration.countDocuments({
      eventoId: id,
      fecha: fechaSeleccionada,
      estado: { $ne: 'cancelado' },
    })
    if (inscritos >= event.capacidadMaxima) {
      return NextResponse.json({ success: false, message: 'Cupo agotado para esta fecha' }, { status: 409 })
    }
  }

  try {
    await Registration.create({
      eventoId: id,
      nombreCompleto: parsed.data.nombreCompleto,
      cedula: parsed.data.cedula,
      telefono: parsed.data.telefono,
      correo: parsed.data.correo || undefined,
      municipio: parsed.data.municipio,
      fecha: fechaSeleccionada,
      edad: parsed.data.edad,
      acudiente: parsed.data.acudiente,
    })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Esta cédula ya está inscrita en esta fecha del evento' },
        { status: 409 }
      )
    }
    throw err
  }

  if (parsed.data.correo) {
    try {
      await sendRegistrationThankYou({
        to: parsed.data.correo,
        nombreCompleto: parsed.data.nombreCompleto,
        eventoNombre: event.nombre,
        eventoFecha: fechaSeleccionada,
        eventoLugar: event.lugar,
      })
    } catch (err) {
      console.error('Error al enviar correo de agradecimiento (no fatal):', err)
    }
  }

  return NextResponse.json({ success: true, message: 'Inscripción exitosa' })
})
