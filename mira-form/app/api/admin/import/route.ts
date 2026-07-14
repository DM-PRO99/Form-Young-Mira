import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToMongoDB } from '@/lib/mongodb'
import Submission from '@/models/Submission'
import { getSheetData } from '@/lib/googleSheets'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { sheetName } = body

    console.log('Iniciando importación de hoja:', sheetName)

    if (!sheetName) {
      return NextResponse.json({ error: 'Se requiere el nombre de la hoja' }, { status: 400 })
    }

    // Verificar credenciales
    if (!process.env.GOOGLE_SHEET_ID) {
      return NextResponse.json({ error: 'Falta GOOGLE_SHEET_ID en configuración' }, { status: 500 })
    }
    if (!process.env.GOOGLE_CLIENT_EMAIL) {
      return NextResponse.json({ error: 'Falta GOOGLE_CLIENT_EMAIL en configuración' }, { status: 500 })
    }
    if (!process.env.GOOGLE_PRIVATE_KEY) {
      return NextResponse.json({ error: 'Falta GOOGLE_PRIVATE_KEY en configuración' }, { status: 500 })
    }

    console.log('Credenciales verificadas, obteniendo datos de Google Sheets...')

    // Obtener datos de Google Sheets
    const sheetData = await getSheetData(sheetName)
    console.log('Datos obtenidos del sheet:', sheetData.length, 'filas')

    await connectToMongoDB()

    let imported = 0
    let updated = 0
    let errors = 0

    for (const row of sheetData) {
      try {
        const numeroDocumento = row.numeroDocumento || ''

        if (!numeroDocumento) {
          errors++
          continue
        }

        // Verificar si ya existe
        const existing = await Submission.findOne({ cedula: numeroDocumento })

        if (existing) {
          // Actualizar existente — no sobrescribir municipio si la celda viene vacía
          const update: Record<string, unknown> = {
            datos: row,
            syncedToSheets: true,
          }
          if (row.q_8) update.municipio = row.q_8
          await Submission.findByIdAndUpdate(existing._id, update, { runValidators: true })
          updated++
        } else {
          // Crear nuevo
          await Submission.create({
            cedula: numeroDocumento,
            municipio: row.q_8 || '',
            datos: row,
            syncedToSheets: true,
          })
          imported++
        }
      } catch (error) {
        console.error('Error al procesar fila:', error)
        errors++
      }
    }

    console.log('Importación completada:', { imported, updated, errors })

    return NextResponse.json({
      success: true,
      message: `Importación completada: ${imported} nuevos, ${updated} actualizados, ${errors} errores`,
      imported,
      updated,
      errors,
      total: sheetData.length
    })
  } catch (error: any) {
    console.error('Error en importación:', error)
    return NextResponse.json({ 
      error: error.message || 'Error al importar datos',
      details: error.toString()
    }, { status: 500 })
  }
}
