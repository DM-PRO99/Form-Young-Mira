import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import Submission from '@/models/Submission'

type MongoFilter = Record<string, unknown>

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { role, municipios: sessionMunicipios } = session.user

  await connectToMongoDB()

  const rbacFilter: MongoFilter =
    role === 'admin' ? {} : { municipio: { $in: sessionMunicipios } }

  const now = new Date()
  const d7 = new Date(now); d7.setDate(d7.getDate() - 7)
  const d14 = new Date(now); d14.setDate(d14.getDate() - 14)

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
      { $match: { ...rbacFilter, createdAt: { $gte: d14 } } },
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

  const dailyCounts = (dailyRaw as Array<{ _id: string; count: number }>).map((d) => ({
    date: d._id,
    count: d.count,
  }))

  return NextResponse.json({
    total,
    last7Days,
    delta: last7Days - prev7Days,
    byMunicipio,
    dailyCounts,
    visibleMunicipios: role === 'admin' ? null : sessionMunicipios,
  })
}
