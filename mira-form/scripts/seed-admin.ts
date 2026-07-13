// Uso: npx tsx scripts/seed-admin.ts
// Requiere SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD en .env.local
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Cargar variables de entorno ANTES de cualquier importación
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { connectToMongoDB } from '../lib/mongodb'
import User from '../models/User'

async function seed() {
  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD

  if (!email || !password) {
    console.error('❌  Faltan SEED_ADMIN_EMAIL o SEED_ADMIN_PASSWORD en .env.local')
    process.exit(1)
  }

  console.log('🔌  Conectando a MongoDB...')
  await connectToMongoDB()

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      $set: {
        email: email.toLowerCase(),
        passwordHash,
        nombre: 'Administrador',
        role: 'admin',
        municipios: [],
        activo: true,
      },
    },
    { upsert: true, new: true }
  )

  console.log(`✅  Admin creado/actualizado: ${user.email}`)
  await mongoose.disconnect()
  console.log('🔌  Desconectado.')
}

seed().catch((err: Error) => {
  console.error('❌  Error al crear admin:', err.message)
  process.exit(1)
})
