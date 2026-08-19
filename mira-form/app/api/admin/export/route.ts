import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import { getUserMunicipios } from '@/lib/rbac'
import Submission from '@/models/Submission'
import { withCors, corsPreflight } from '@/lib/cors'

type MongoFilter = Record<string, unknown>

const COLUMN_ORDER = [
  'q_1', 'q_2', 'q_3', 'q_4', 'q_5',
  'tipoDocumento', 'numeroDocumento',
  'q_7', 'q_8', 'q_8b', 'q_8c', 'q_9', 'q_10',
  'q_11', 'q_12', 'q_13', 'q_14',
  'q_15', 'q_16', 'q_17', 'q_18', 'q_19', 'q_20',
  'q_21', 'q_22', 'q_23', 'q_24', 'q_25',
  'q_autorizacion_menor',
]

const COLUMN_HEADERS: Record<string, string> = {
  q_1: 'Aceptación Política de Datos',
  q_2: 'Nombre Completo',
  q_3: 'Género',
  q_4: 'Fecha de Nacimiento',
  q_5: 'Número de Celular',
  tipoDocumento: 'Tipo de Documento',
  numeroDocumento: 'Número de Documento',
  q_7: 'Grupo Poblacional',
  q_8: 'Municipio',
  q_8b: 'Barrio',
  q_8c: 'Comuna',
  q_9: 'Dirección',
  q_10: 'Libreta Militar',
  q_11: '¿Estás Estudiando?',
  q_12: '¿En que institucion estudias?',
  q_13: 'Qué Te Gustaría Estudiar',
  q_14: 'Qué Estás Estudiando',
  q_15: 'Actividades Deportivas',
  q_16: 'Actividades Políticas',
  q_17: 'Actividades Sociales/Cívicas',
  q_18: 'Idiomas',
  q_19: 'Redes Sociales',
  q_20: 'Conocimientos Tecnológicos',
  q_21: '¿Tienes Emprendimiento?',
  q_22: 'Cuál Emprendimiento',
  q_23: 'Tiempo Conociendo la Iglesia',
  q_24: 'Horario de Culto Preferido',
  q_25: '¿En cual de estas áreas has trabajado o tienes conocimiento?',
  q_autorizacion_menor: 'Autorización acudiente o mayor de edad (Ley 1581)',
}

function escapeCsv(value: unknown): string {
  const str = Array.isArray(value) ? value.join('; ') : String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export { corsPreflight as OPTIONS }

export const GET = withCors(async (req: NextRequest) => {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { role } = session.user
  const { searchParams } = req.nextUrl

  const q = searchParams.get('q') ?? ''
  const municipio = searchParams.get('municipio') ?? ''
  const dateFrom = searchParams.get('dateFrom') ?? ''
  const dateTo = searchParams.get('dateTo') ?? ''

  await connectToMongoDB()

  const sessionMunicipios = role !== 'admin' ? await getUserMunicipios(session.user.id) : []

  const filters: MongoFilter[] = []

  if (role !== 'admin') {
    filters.push({ municipio: { $in: sessionMunicipios } })
  }
  if (municipio) {
    if (role !== 'admin' && !sessionMunicipios.includes(municipio)) {
      const csvHeaders = '﻿' + COLUMN_ORDER.map(k => escapeCsv(COLUMN_HEADERS[k] ?? k)).join(',') + '\n'
      return new NextResponse(csvHeaders, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="registros.csv"',
        },
      })
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

  const submissions = await Submission.find(mongoFilter).sort({ updatedAt: -1 }).lean()

  const headerRow = COLUMN_ORDER.map(k => escapeCsv(COLUMN_HEADERS[k] ?? k)).join(',')
  const dataRows = submissions.map((sub) => {
    const datos = sub.datos as Record<string, unknown>
    return COLUMN_ORDER.map(k => escapeCsv(datos[k] ?? '')).join(',')
  })

  const today = new Date().toISOString().slice(0, 10)
  const csv = '﻿' + [headerRow, ...dataRows].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="registros-${today}.csv"`,
    },
  })
})
