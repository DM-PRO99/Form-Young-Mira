import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import User from '@/models/User'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

type RouteContext = { params: Promise<{ id: string }> }

const updateSchema = z.object({
  nombre: z.string().min(1).optional(),
  municipios: z.array(z.string()).optional(),
  activo: z.boolean().optional(),
  password: z.string().min(8).optional(),
})

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
  }

  const { id } = await params
  const body: unknown = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  await connectToMongoDB()

  const updateData: Record<string, unknown> = {}
  if (parsed.data.nombre !== undefined) updateData.nombre = parsed.data.nombre
  if (parsed.data.municipios !== undefined) updateData.municipios = parsed.data.municipios
  if (parsed.data.activo !== undefined) updateData.activo = parsed.data.activo
  if (parsed.data.password) {
    updateData.passwordHash = await bcrypt.hash(parsed.data.password, 12)
  }

  const user = await User.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  ).select('-passwordHash').lean()

  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  return NextResponse.json({ data: user })
}
