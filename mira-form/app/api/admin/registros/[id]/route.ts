import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import { getUserMunicipios } from '@/lib/rbac'
import Submission from '@/models/Submission'
import SyncFailure from '@/models/SyncFailure'
import { appendRow } from '@/lib/googleSheets'
import { z } from 'zod'
import { withCors, corsPreflight } from '@/lib/cors'

type RouteContext = { params: Promise<{ id: string }> }

export { corsPreflight as OPTIONS }

export const GET = withCors(async (_req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const { role } = session.user

  await connectToMongoDB()

  const submission = await Submission.findById(id).lean()
  if (!submission) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })

  if (role !== 'admin') {
    const municipios = await getUserMunicipios(session.user.id)
    if (!municipios.includes(submission.municipio)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
  }

  return NextResponse.json({ data: submission })
})

const updateSchema = z.object({
  datos: z.record(z.unknown()),
})

export const PATCH = withCors(async (req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const { role } = session.user

  const body: unknown = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  await connectToMongoDB()

  const submission = await Submission.findById(id)
  if (!submission) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })

  if (role !== 'admin') {
    const municipios = await getUserMunicipios(session.user.id)
    if (!municipios.includes(submission.municipio)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
  }

  const newDatos = { ...(submission.datos as Record<string, unknown>), ...parsed.data.datos }
  const newMunicipio = typeof newDatos.q_8 === 'string' ? newDatos.q_8 : submission.municipio

  submission.datos = newDatos
  submission.municipio = newMunicipio
  submission.syncedToSheets = false
  await submission.save()

  try {
    await appendRow('Sheet1', newDatos)
    submission.syncedToSheets = true
    await submission.save()
  } catch (err) {
    await SyncFailure.create({
      cedula: submission.cedula,
      datos: newDatos,
      error: err instanceof Error ? err.message : String(err),
    })
  }

  return NextResponse.json({ data: submission })
})

export const DELETE = withCors(async (_req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const { role } = session.user

  await connectToMongoDB()

  const submission = await Submission.findById(id)
  if (!submission) return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })

  if (role !== 'admin') {
    const municipios = await getUserMunicipios(session.user.id)
    if (!municipios.includes(submission.municipio)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
  }

  await submission.deleteOne()

  return NextResponse.json({ success: true })
})
