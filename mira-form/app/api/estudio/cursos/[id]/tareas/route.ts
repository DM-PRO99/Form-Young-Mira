import { NextRequest, NextResponse } from 'next/server'
import { isValidObjectId } from 'mongoose'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import Course from '@/models/Course'
import { withCors, corsPreflight } from '@/lib/cors'
import { sanitizarHtml } from '@/lib/estudioContenido'
import { tareaSchema } from '@/lib/estudioTareas'

type RouteContext = { params: Promise<{ id: string }> }

export { corsPreflight as OPTIONS }

export const POST = withCors(async (req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Solo el administrador puede crear tareas' }, { status: 403 })

  const { id } = await params
  if (!isValidObjectId(id)) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })

  const parsed = tareaSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  await connectToMongoDB()
  const course = await Course.findById(id)
  if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
  if (course.tareas.length >= 200) return NextResponse.json({ error: 'El curso alcanzó el máximo de tareas' }, { status: 400 })

  const { fechaLimite, instrucciones, ...resto } = parsed.data
  course.tareas.push({
    ...resto,
    instrucciones: sanitizarHtml(instrucciones),
    fechaLimite: fechaLimite ? new Date(fechaLimite) : undefined,
  } as (typeof course.tareas)[number])
  await course.save()

  return NextResponse.json({ data: course.tareas[course.tareas.length - 1] }, { status: 201 })
})
