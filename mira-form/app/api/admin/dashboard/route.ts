import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import { getUserMunicipios } from '@/lib/rbac'
import Submission from '@/models/Submission'
import { withCors, corsPreflight } from '@/lib/cors'

type MongoFilter = Record<string, unknown>

export { corsPreflight as OPTIONS }

export const GET = withCors(async (req: NextRequest) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { role } = session.user

  const daysParam = parseInt(req.nextUrl.searchParams.get('days') ?? '14', 10)
  const days = daysParam === 30 ? 30 : 14

  await connectToMongoDB()

  const sessionMunicipios = role !== 'admin' ? await getUserMunicipios(session.user.id) : []

  const rbacFilter: MongoFilter =
    role === 'admin' ? {} : { municipio: { $in: sessionMunicipios } }

  const now = new Date()
  const d7 = new Date(now); d7.setDate(d7.getDate() - 7)
  const d14 = new Date(now); d14.setDate(d14.getDate() - 14)

  // $dateToString agrupa en UTC por defecto, así que el rango y las claves
  // de fecha del gráfico también se calculan en UTC para que coincidan.
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const dRange = new Date(todayUTC)
  dRange.setUTCDate(dRange.getUTCDate() - (days - 1))

  const [total, last7Days, prev7Days, byMunicipioRaw, dailyRaw] = await Promise.all([
    Submission.countDocuments(rbacFilter),
    Submission.countDocuments({ ...rbacFilter, createdAt: { $gte: d7 } }),
    Submission.countDocuments({ ...rbacFilter, createdAt: { $gte: d14, $lt: d7 } }),
    Submission.aggregate([
      { $match: rbacFilter },
      { $group: { _id: '$municipio', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Submission.aggregate([
      { $match: { ...rbacFilter, createdAt: { $gte: dRange } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ])

  const byMunicipio: Record<string, number> = {}
  for (const item of byMunicipioRaw as Array<{ _id: string; count: number }>) {
    byMunicipio[item._id] = item.count
  }

  const countsByDate = new Map<string, number>()
  for (const d of dailyRaw as Array<{ _id: string; count: number }>) {
    countsByDate.set(d._id, d.count)
  }

  // Rellenar todos los días del rango, incluso los que no tienen registros
  const dailyCounts: { date: string; count: number }[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(dRange)
    d.setUTCDate(d.getUTCDate() + i)
    const key = d.toISOString().slice(0, 10)
    dailyCounts.push({ date: key, count: countsByDate.get(key) ?? 0 })
  }

  return NextResponse.json({
    total,
    last7Days,
    delta: last7Days - prev7Days,
    byMunicipio,
    dailyCounts,
    visibleMunicipios: role === 'admin' ? null : sessionMunicipios,
  })
})
