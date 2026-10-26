// Uso: npx tsx scripts/migrate-event-fechas.ts
// Migra los eventos existentes de `fecha: Date` a `fechas: Date[]`, y las
// inscripciones existentes para que queden ligadas a esa misma fecha.
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

import mongoose from 'mongoose'
import { connectToMongoDB } from '../lib/mongodb'

async function migrate() {
  console.log('🔌  Conectando a MongoDB...')
  await connectToMongoDB()

  const db = mongoose.connection.db
  if (!db) throw new Error('No se pudo obtener la conexión a la base de datos')

  const eventosSinFechas = await db
    .collection('events')
    .find({ fechas: { $exists: false }, fecha: { $exists: true } })
    .toArray()

  console.log(`📋  Eventos a migrar: ${eventosSinFechas.length}`)

  for (const doc of eventosSinFechas) {
    const fechaAntigua = doc.fecha as Date

    await db.collection('events').updateOne({ _id: doc._id }, { $set: { fechas: [fechaAntigua] }, $unset: { fecha: '' } })

    const { matchedCount } = await db
      .collection('registrations')
      .updateMany({ eventoId: doc._id, fecha: { $exists: false } }, { $set: { fecha: fechaAntigua } })
    await db
      .collection('registrations')
      .updateMany({ eventoId: doc._id, municipio: { $exists: false } }, { $set: { municipio: 'No especificado' } })

    console.log(`  ✅  Evento ${doc._id}: fechas=[${fechaAntigua.toISOString()}], inscripciones actualizadas=${matchedCount}`)
  }

  // El índice único viejo {eventoId, cedula} impediría inscribirse a varias fechas del mismo evento.
  const hasRegistrations = (await db.listCollections({ name: 'registrations' }).toArray()).length > 0
  const indexes = hasRegistrations ? await db.collection('registrations').indexes() : []
  if (indexes.some((i) => i.name === 'eventoId_1_cedula_1')) {
    await db.collection('registrations').dropIndex('eventoId_1_cedula_1')
    console.log('🗑️   Índice viejo eventoId_1_cedula_1 eliminado')
  }
  await db.collection('registrations').createIndex({ eventoId: 1, cedula: 1, fecha: 1 }, { unique: true })
  console.log('✅  Índice eventoId_1_cedula_1_fecha_1 asegurado')

  console.log('✅  Migración completa.')
  await mongoose.disconnect()
}

migrate().catch((err: Error) => {
  console.error('❌  Error en la migración:', err.message)
  process.exit(1)
})
