import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import User from '@/models/User'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
  }

  await connectToMongoDB()
  const users = await User.find().sort({ createdAt: -1 }).select('-passwordHash').lean()
  return NextResponse.json({ data: users })
}

const createSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  municipios: z.array(z.string()).default([]),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
  }

  const body: unknown = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  await connectToMongoDB()

  const exists = await User.findOne({ email: parsed.data.email.toLowerCase() })
  if (exists) {
    return NextResponse.json({ error: 'El correo ya está registrado' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)
  await User.create({
    email: parsed.data.email.toLowerCase(),
    passwordHash,
    nombre: parsed.data.nombre,
    role: 'coordinador',
    municipios: parsed.data.municipios,
    activo: true,
  })

  const user = await User.findOne({ email: parsed.data.email.toLowerCase() })
    .select('-passwordHash')
    .lean()

  return NextResponse.json({ data: user }, { status: 201 })
}
