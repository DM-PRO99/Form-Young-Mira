import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import { getUserMunicipios } from '@/lib/rbac'
import { CAMPOS_CLAVE, FILTRO_INCOMPLETO, esRegistroCompleto } from '@/lib/registroEstado'
import Submission from '@/models/Submission'
import Event from '@/models/Event'
import { withCors, corsPreflight } from '@/lib/cors'

type MongoFilter = Record<string, unknown>

export { corsPreflight as OPTIONS }

export const GET = withCors(async (req: NextRequest) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { role, id: userId } = session.user

  const daysParam = parseInt(req.nextUrl.searchParams.get('days') ?? '14', 10)
  const days = daysParam === 7 || daysParam === 30 ? daysParam : 14

  await connectToMongoDB()

  const sessionMunicipios = role !== 'admin' ? await getUserMunicipios(userId) : []

  const rbacFilter: MongoFilter = role === 'admin' ? {} : { municipio: { $in: sessionMunicipios } }
  const eventFilter: MongoFilter = role === 'admin' ? {} : { $or: [{ creadoPor: userId }, { coordinadoresAsignados: userId }] }

  const now = new Date()
  const d7 = new Date(now)
  d7.setDate(d7.getDate() - 7)
  const d14 = new Date(now)
  d14.setDate(d14.getDate() - 14)
  const d30 = new Date(now)
  d30.setDate(d30.getDate() - 30)

  // $dateToString agrupa en UTC por defecto, así que el rango y las claves
  // de fecha del gráfico también se calculan en UTC para que coincidan.
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const dRange = new Date(todayUTC)
  dRange.setUTCDate(dRange.getUTCDate() - (days - 1))

  const recentProjection = ['cedula', 'municipio', 'createdAt', 'updatedAt', ...CAMPOS_CLAVE.map((k) => `datos.${k}`)].join(' ')

  const [total, totalHace30, last7Days, prev7Days, incompletos, sinSincronizar, byMunicipioRaw, dailyRaw, recientesRaw, eventos] =
    await Promise.all([
      Submission.countDocuments(rbacFilter),
      Submission.countDocuments({ ...rbacFilter, createdAt: { $lt: d30 } }),
      Submission.countDocuments({ ...rbacFilter, createdAt: { $gte: d7 } }),
      Submission.countDocuments({ ...rbacFilter, createdAt: { $gte: d14, $lt: d7 } }),
      Submission.countDocuments({ ...rbacFilter, ...FILTRO_INCOMPLETO }),
      Submission.countDocuments({ ...rbacFilter, syncedToSheets: false }),
      Submission.aggregate([
        { $match: rbacFilter },
        { $group: { _id: '$municipio', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Submission.aggregate([
        { $match: { ...rbacFilter, createdAt: { $gte: dRange } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Submission.find(rbacFilter).sort({ createdAt: -1 }).limit(5).select(recentProjection).lean(),
      Event.find({ ...eventFilter, estado: 'publicado', fechas: { $elemMatch: { $gte: now } } })
        .select('nombre fechas')
        .lean(),
    ])

  const byMunicipio: Record<string, number> = {}
  for (const item of byMunicipioRaw as Array<{ _id: string; count: number }>) {
    byMunicipio[item._id] = item.count
  }

  const countsByDate = new Map<string, number>()
  for (const d of dailyRaw as Array<{ _id: string; count: number }>) countsByDate.set(d._id, d.count)

  // Rellenar todos los días del rango, incluso los que no tienen registros
  const dailyCounts: { date: string; count: number }[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(dRange)
    d.setUTCDate(d.getUTCDate() + i)
    const key = d.toISOString().slice(0, 10)
    dailyCounts.push({ date: key, count: countsByDate.get(key) ?? 0 })
  }

  const recientes = recientesRaw.map((s) => {
    const datos = (s.datos ?? {}) as Record<string, unknown>
    return {
      _id: s._id,
      cedula: s.cedula,
      nombre: typeof datos.q_2 === 'string' ? datos.q_2 : '',
      municipio: s.municipio,
      createdAt: s.createdAt,
      completo: esRegistroCompleto(datos),
    }
  })

  let proximoEvento: { _id: string; nombre: string; fecha: Date } | null = null
  for (const e of eventos) {
    const fecha = e.fechas.filter((f) => f >= now).sort((a, b) => a.getTime() - b.getTime())[0]
    if (fecha && (!proximoEvento || fecha < proximoEvento.fecha)) {
      proximoEvento = { _id: e._id.toString(), nombre: e.nombre, fecha }
    }
  }

  return NextResponse.json({
    total,
    totalHace30,
    last7Days,
    prev7Days,
    delta: last7Days - prev7Days,
    incompletos,
    sinSincronizar,
    byMunicipio,
    dailyCounts,
    recientes,
    proximoEvento,
    visibleMunicipios: role === 'admin' ? null : sessionMunicipios,
  })
})
