import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import { getUserMunicipios } from '@/lib/rbac'
import Submission from '@/models/Submission'

type MongoFilter = Record<string, unknown>

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { role } = session.user
  const { searchParams } = req.nextUrl

  const q = searchParams.get('q') ?? ''
  const municipio = searchParams.get('municipio') ?? ''
  const dateFrom = searchParams.get('dateFrom') ?? ''
  const dateTo = searchParams.get('dateTo') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = 20

  await connectToMongoDB()

  const sessionMunicipios = role !== 'admin' ? await getUserMunicipios(session.user.id) : []

  const filters: MongoFilter[] = []

  // RBAC — coordinador solo ve sus municipios
  if (role !== 'admin') {
    filters.push({ municipio: { $in: sessionMunicipios } })
  }

  if (municipio) {
    if (role !== 'admin' && !sessionMunicipios.includes(municipio)) {
      return NextResponse.json({ data: [], total: 0, page, limit })
    }
    filters.push({ municipio })
  }

  if (dateFrom || dateTo) {
    const dr: { $gte?: Date; $lte?: Date } = {}
    if (dateFrom) dr.$gte = new Date(dateFrom)
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      dr.$lte = to
    }
    filters.push({ updatedAt: dr })
  }

  if (q) {
    filters.push({
      $or: [
        { cedula: { $regex: q, $options: 'i' } },
        { 'datos.q_2': { $regex: q, $options: 'i' } } as unknown as MongoFilter,
      ],
    })
  }

  const mongoFilter: MongoFilter =
    filters.length > 1 ? { $and: filters } : filters.length === 1 ? filters[0] : {}

  const [data, total] = await Promise.all([
    Submission.find(mongoFilter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('cedula municipio datos updatedAt createdAt')
      .lean(),
    Submission.countDocuments(mongoFilter),
  ])

  return NextResponse.json({ data, total, page, limit })
}
