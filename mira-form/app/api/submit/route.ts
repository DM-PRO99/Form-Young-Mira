import { NextResponse } from 'next/server'
import { appendRow } from '@/lib/googleSheets'
import { connectToMongoDB } from '@/lib/mongodb'
import Submission from '@/models/Submission'
import SyncFailure from '@/models/SyncFailure'

export async function POST(request: Request) {
  let data: Record<string, unknown>
  try {
    data = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ success: false, message: 'Datos inválidos' }, { status: 400 })
  }

  const cedula = typeof data.numeroDocumento === 'string' ? data.numeroDocumento.trim() : ''
  const municipio = typeof data.q_8 === 'string' ? data.q_8.trim() : ''

  // 1. MongoDB — fuente de verdad. Si falla, responder error al usuario.
  try {
    await connectToMongoDB()
    await Submission.findOneAndUpdate(
      { cedula },
      { $set: { cedula, municipio, datos: data, syncedToSheets: false } },
      { upsert: true, new: true }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al guardar en base de datos'
    console.error('MongoDB submit error:', msg)
    return NextResponse.json({ success: false, message: msg }, { status: 500 })
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
}
