import { connectToMongoDB } from '@/lib/mongodb'
import User from '@/models/User'

// Los municipios ya no viajan en el JWT (ver auth.config.ts); se leen de la BD
// para que los cambios hechos por un admin apliquen sin necesidad de re-login.
export async function getUserMunicipios(userId: string): Promise<string[]> {
  await connectToMongoDB()
  const user = await User.findById(userId).select('municipios').lean()
  return user?.municipios ?? []
}
