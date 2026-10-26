import { sheets } from '@/lib/googleSheets'
import { connectToMongoDB } from '@/lib/mongodb'
import Submission from '@/models/Submission'

const CEDULA_HEADERS = ['CC', 'Número de Documento', 'numeroDocumento']
const FECHA_HEADER = 'Fecha de Nacimiento'

export const CEDULA_REGEX = /^\d{5,15}$/

// Acepta AAAA-MM-DD (lo que envía el formulario) y DD/MM/AAAA o DD-MM-AAAA (filas importadas a mano).
export function normalizeFecha(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim()
  let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  m = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return null
}

export function fechasCoinciden(a: unknown, b: unknown): boolean {
  const na = normalizeFecha(a)
  return na !== null && na === normalizeFecha(b)
}

export async function findSheetRecord(cedula: string): Promise<Record<string, string> | null> {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  if (!spreadsheetId) throw new Error('GOOGLE_SHEET_ID no está configurado')

  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Sheet1', majorDimension: 'ROWS' })
  const rows = response.data.values
  if (!rows || rows.length < 2) return null

  const header = rows[0] as string[]
  const ccIndex = header.findIndex((h) => CEDULA_HEADERS.includes(h))
  if (ccIndex === -1) return null

  const row = rows.find((r, i) => i > 0 && String(r[ccIndex] ?? '').trim() === cedula)
  if (!row) return null

  return header.reduce<Record<string, string>>((obj, key, i) => {
    obj[key] = String(row[i] ?? '')
    return obj
  }, {})
}

export async function getFechaNacimientoRegistrada(cedula: string): Promise<{ existe: boolean; fecha: unknown }> {
  await connectToMongoDB()
  const submission = await Submission.findOne({ cedula }).select('datos.q_4').lean()
  if (submission) return { existe: true, fecha: (submission.datos as Record<string, unknown>)?.q_4 }

  const record = await findSheetRecord(cedula)
  if (record) return { existe: true, fecha: record[FECHA_HEADER] }

  return { existe: false, fecha: null }
}

export { FECHA_HEADER }
