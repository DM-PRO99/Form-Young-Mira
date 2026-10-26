import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import User, { MIRA_ROLES } from '@/models/User'
import { isValidObjectId } from 'mongoose'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { withCors, corsPreflight } from '@/lib/cors'

type RouteContext = { params: Promise<{ id: string }> }

const updateSchema = z.object({
  nombre: z.string().min(1).optional(),
  municipios: z.array(z.string()).optional(),
  activo: z.boolean().optional(),
  password: z.string().min(8).optional(),
})

export { corsPreflight as OPTIONS }

export const GET = withCors(async (req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const isAdmin = session.user.role === 'admin'
  const isOwnProfile = session.user.id === id

  if (!isAdmin && !isOwnProfile) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  if (!isValidObjectId(id)) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  await connectToMongoDB()

  const user = await User.findOne({ _id: id, role: { $in: MIRA_ROLES } }).select('-passwordHash').lean()
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  return NextResponse.json({ data: user })
})

export const PATCH = withCors(async (req: NextRequest, { params }: RouteContext) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
  }

  const { id } = await params
  if (!isValidObjectId(id)) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const body: unknown = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  await connectToMongoDB()

  const updateData: Record<string, unknown> = {}
  if (parsed.data.nombre !== undefined) updateData.nombre = parsed.data.nombre
  if (parsed.data.municipios !== undefined) updateData.municipios = parsed.data.municipios
  if (parsed.data.activo !== undefined) updateData.activo = parsed.data.activo
  if (parsed.data.password) {
    updateData.passwordHash = await bcrypt.hash(parsed.data.password, 12)
  }

  const user = await User.findOneAndUpdate(
    { _id: id, role: { $in: MIRA_ROLES } },
    { $set: updateData },
    { new: true }
  ).select('-passwordHash').lean()

  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  return NextResponse.json({ data: user })
})
