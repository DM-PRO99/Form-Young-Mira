import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import Entrega from '@/models/Entrega'
import User from '@/models/User'
import { withCors, corsPreflight } from '@/lib/cors'
import { isBlobUrl } from '@/lib/estudio'
import { MAX_ENTREGA_BYTES, MAX_TEXTO_ENTREGA, archivoEsDeLaPersona, cargarTarea } from '@/lib/estudioTareas'
import { z } from 'zod'

type RouteContext = { params: Promise<{ id: string; tareaId: string }> }

export { corsPreflight as OPTIONS }

export const GET = withCors(async (_req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const esAdmin = session.user.role === 'admin'

  const { id, tareaId } = await params
  await connectToMongoDB()
  const encontrado = await cargarTarea(id, tareaId, esAdmin)
  if (!encontrado) return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })

  if (!esAdmin) {
    const mia = await Entrega.findOne({ courseId: id, tareaId, userId: session.user.id }).lean()
    return NextResponse.json({ data: { miEntrega: mia } })
  }

  const [entregas, coordinadores] = await Promise.all([
    Entrega.find({ courseId: id, tareaId }).sort({ entregadaEn: -1 }).populate('userId', 'nombre email').lean(),
    User.find({ role: 'coordinador', activo: true }).select('nombre email').sort({ nombre: 1 }).lean(),
  ])
  const entregaron = new Set(entregas.map((e) => (e.userId as unknown as { _id: { toString(): string } })._id.toString()))
  const pendientes = coordinadores.filter((c) => !entregaron.has(c._id.toString()))

  return NextResponse.json({ data: { entregas, pendientes } })
})

const entregaSchema = z.object({
  texto: z.string().max(MAX_TEXTO_ENTREGA, 'El texto es demasiado largo').optional(),
  archivoUrl: z.string().refine(isBlobUrl, 'Archivo inválido').nullable().optional(),
  archivoNombre: z.string().max(300).optional(),
  tamano: z.number().int().nonnegative().max(MAX_ENTREGA_BYTES).optional(),
})

export const POST = withCors(async (req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const esAdmin = session.user.role === 'admin'

  const { id, tareaId } = await params
  const parsed = entregaSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  await connectToMongoDB()
  const encontrado = await cargarTarea(id, tareaId, esAdmin)
  if (!encontrado) return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
  const { tarea } = encontrado

  const texto = tarea.entregaTexto ? parsed.data.texto?.trim() || undefined : undefined
  const archivoUrl = tarea.entregaArchivo ? parsed.data.archivoUrl || undefined : undefined
  if (!texto && !archivoUrl) {
    return NextResponse.json({ error: 'Escribe tu respuesta o adjunta un archivo para entregar' }, { status: 400 })
  }
  if (archivoUrl && !archivoEsDeLaPersona(archivoUrl, id, session.user.id)) {
    return NextResponse.json({ error: 'Archivo inválido' }, { status: 400 })
  }

  const anterior = await Entrega.findOne({ courseId: id, tareaId, userId: session.user.id })
  if (anterior && anterior.calificacion !== undefined && anterior.calificacion !== null) {
    return NextResponse.json({ error: 'Esta entrega ya fue calificada y no se puede cambiar' }, { status: 409 })
  }
  const archivoViejo = anterior?.archivoUrl && anterior.archivoUrl !== archivoUrl ? anterior.archivoUrl : null

  const entrega = await Entrega.findOneAndUpdate(
    { courseId: id, tareaId, userId: session.user.id },
    {
      $set: {
        texto,
        archivoUrl,
        archivoNombre: archivoUrl ? parsed.data.archivoNombre : undefined,
        tamano: archivoUrl ? parsed.data.tamano : undefined,
        entregadaEn: new Date(),
      },
    },
    { upsert: true, new: true }
  ).lean()

  if (archivoViejo) {
    try {
      await del(archivoViejo)
    } catch (err) {
      console.error('Error al borrar la entrega anterior (no fatal):', err)
    }
  }

  return NextResponse.json({ data: entrega })
})
