import { connectToMongoDB } from '@/lib/mongodb'
import RateLimit from '@/models/RateLimit'

// En Vercel ambos headers los fija la plataforma; x-real-ip es el que no puede anteponer el cliente.
export function getClientIp(req: Request): string {
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return 'unknown'
}

export async function checkApiRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  await connectToMongoDB()

  const doc = await RateLimit.findOneAndUpdate(
    { key },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(Date.now() + windowMs) } },
    { upsert: true, new: true }
  )

  return doc.count <= limit
}
