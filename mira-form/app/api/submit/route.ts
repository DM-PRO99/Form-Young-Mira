import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { appendRow } from '@/lib/googleSheets'
import { connectToMongoDB } from '@/lib/mongodb'
import Submission from '@/models/Submission'
import SyncFailure from '@/models/SyncFailure'
import { withCors, corsPreflight } from '@/lib/cors'
import { checkApiRateLimit, getClientIp } from '@/lib/apiRateLimit'
import { CEDULA_REGEX, fechasCoinciden, getFechaNacimientoRegistrada } from '@/lib/registroLookup'

export { corsPreflight as OPTIONS }

const campo = (max = 300) => z.string().trim().max(max).default('')

const submitSchema = z.object({
  q_autorizacion_menor: campo(),
  q_1: campo(),
  q_2: z.string().trim().min(1, 'El nombre es requerido').max(150),
  q_3: campo(),
  q_4: z.string().trim().min(1, 'La fecha de nacimiento es requerida').max(20),
  q_5: campo(30),
  tipoDocumento: campo(50),
  numeroDocumento: z.string().trim().regex(CEDULA_REGEX, 'Número de documento inválido'),
  q_7: campo(),
  q_8: z.string().trim().min(1, 'El municipio es requerido').max(100),
  q_8b: campo(),
  q_8c: campo(),
  q_9: campo(),
  q_10: campo(),
  q_11: campo(),
  q_12: campo(),
  q_13: campo(),
  q_14: campo(),
  q_15: campo(1000),
  q_16: campo(1000),
  q_17: campo(1000),
  q_18: campo(1000),
  q_19: campo(1000),
  q_20: campo(1000),
  q_21: campo(),
  q_22: campo(),
  q_23: campo(),
  q_24: campo(),
  q_25: campo(1000),
})

export const POST = withCors(async (request: NextRequest) => {
  const ip = getClientIp(request)
  const allowed = await checkApiRateLimit(`submit:${ip}`, 10, 10 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { success: false, message: 'Demasiadas solicitudes, intenta de nuevo más tarde' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Datos inválidos' }, { status: 400 })
  }

  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 })
  }

  const data = parsed.data
  const cedula = data.numeroDocumento
  const municipio = data.q_8

  // 1. MongoDB — fuente de verdad. Si falla, responder error al usuario.
  try {
    const existente = await getFechaNacimientoRegistrada(cedula)
    if (existente.existe && !fechasCoinciden(data.q_4, existente.fecha)) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Ya existe un registro con este documento y la fecha de nacimiento no coincide. Si necesitas corregirla, comunícate con tu coordinador.',
        },
        { status: 409 }
      )
    }

    await connectToMongoDB()
    await Submission.findOneAndUpdate(
      { cedula },
      { $set: { cedula, municipio, datos: data, syncedToSheets: false } },
      { upsert: true, new: true }
    )
  } catch (err) {
    console.error('MongoDB submit error:', err)
    return NextResponse.json({ success: false, message: 'No se pudo guardar el registro' }, { status: 500 })
  }

  // 2. Google Sheets — espejo. Si falla, registrar en sync_failures (no fallar la request).
  try {
    await appendRow('Sheet1', data)
    await Submission.findOneAndUpdate({ cedula }, { $set: { syncedToSheets: true } })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error('Sheets sync error (non-fatal):', errMsg)
    try {
      await SyncFailure.create({ cedula, datos: data, error: errMsg })
    } catch {
      // best-effort
    }
  }

  return NextResponse.json({ success: true, message: 'Registro exitoso' })
})
