import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withCors, corsPreflight } from '@/lib/cors'
import { checkApiRateLimit, getClientIp } from '@/lib/apiRateLimit'
import { connectToMongoDB } from '@/lib/mongodb'
import { COLUMN_HEADERS } from '@/lib/googleSheets'
import Submission from '@/models/Submission'
import { CEDULA_REGEX, FECHA_HEADER, fechasCoinciden, findSheetRecord } from '@/lib/registroLookup'

export { corsPreflight as OPTIONS }

const lookupSchema = z.object({
  cedula: z.string().trim().regex(CEDULA_REGEX),
  fechaNacimiento: z.string().trim().min(1).max(20),
})

const NOT_FOUND = { error: 'No encontramos un registro con esa cédula y fecha de nacimiento' }

export const POST = withCors(async (request: NextRequest) => {
  const ip = getClientIp(request)
  const allowed = await checkApiRateLimit(`cedula:${ip}`, 10, 10 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json({ error: 'Demasiadas solicitudes, intenta de nuevo más tarde' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }
  const parsed = lookupSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json(NOT_FOUND, { status: 404 })

  const { cedula, fechaNacimiento } = parsed.data

  try {
    await connectToMongoDB()
    const submission = await Submission.findOne({ cedula }).select('datos').lean()

    let record: Record<string, string> | null = null
    if (submission) {
      const datos = (submission.datos ?? {}) as Record<string, unknown>
      record = Object.fromEntries(
        Object.entries(COLUMN_HEADERS).map(([key, header]) => [header, String(datos[key] ?? '')])
      )
    } else {
      record = await findSheetRecord(cedula)
    }

    if (!record || !fechasCoinciden(fechaNacimiento, record[FECHA_HEADER])) {
      return NextResponse.json(NOT_FOUND, { status: 404 })
    }

    return NextResponse.json({ data: record })
  } catch (error) {
    console.error('Error al buscar cédula:', error)
    return NextResponse.json({ error: 'No se pudo consultar el registro' }, { status: 500 })
  }
})
