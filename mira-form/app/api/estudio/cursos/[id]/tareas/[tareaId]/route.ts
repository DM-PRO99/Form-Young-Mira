import { NextRequest, NextResponse } from 'next/server'
import { isValidObjectId } from 'mongoose'
import { del } from '@vercel/blob'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import Course from '@/models/Course'
import Entrega from '@/models/Entrega'
import { withCors, corsPreflight } from '@/lib/cors'
import { sanitizarHtml, urlsDeBlobEnHtml } from '@/lib/estudioContenido'
import { tareaSchema } from '@/lib/estudioTareas'

type RouteContext = { params: Promise<{ id: string; tareaId: string }> }

export { corsPreflight as OPTIONS }

async function deleteBlobs(urls: string[]) {
  if (urls.length === 0) return
  try {
    await del(urls)
  } catch (err) {
    console.error('Error al borrar archivos de Blob (no fatal):', err)
  }
}

async function cargar(id: string, tareaId: string) {
  if (!isValidObjectId(id) || !isValidObjectId(tareaId)) return null
  await connectToMongoDB()
  const course = await Course.findById(id)
  const tarea = course?.tareas.find((t) => t._id.toString() === tareaId)
  return course && tarea ? { course, tarea } : null
}

export const PATCH = withCors(async (req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Solo el administrador puede editar tareas' }, { status: 403 })

  const { id, tareaId } = await params
  const parsed = tareaSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const encontrado = await cargar(id, tareaId)
  if (!encontrado) return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
  const { course, tarea } = encontrado

  const imagenesAntes = urlsDeBlobEnHtml(tarea.instrucciones)
  const { fechaLimite, instrucciones, ...resto } = parsed.data
  Object.assign(tarea, resto)
  tarea.instrucciones = sanitizarHtml(instrucciones)
  tarea.fechaLimite = fechaLimite ? new Date(fechaLimite) : undefined
  const imagenesDespues = new Set(urlsDeBlobEnHtml(tarea.instrucciones))

  await course.save()
  await deleteBlobs(imagenesAntes.filter((u) => !imagenesDespues.has(u)))

  return NextResponse.json({ data: tarea })
})

export const DELETE = withCors(async (_req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Solo el administrador puede eliminar tareas' }, { status: 403 })

  const { id, tareaId } = await params
  const encontrado = await cargar(id, tareaId)
  if (!encontrado) return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
  const { course, tarea } = encontrado

  const entregas = await Entrega.find({ courseId: id, tareaId }).select('archivoUrl').lean()
  const urls = [...urlsDeBlobEnHtml(tarea.instrucciones), ...entregas.map((e) => e.archivoUrl).filter((u): u is string => !!u)]

  course.tareas.splice(course.tareas.indexOf(tarea), 1)
  await course.save()
  await Entrega.deleteMany({ courseId: id, tareaId })
  await deleteBlobs(urls)

  return NextResponse.json({ success: true })
})
