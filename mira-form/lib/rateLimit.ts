import { connectToMongoDB } from '@/lib/mongodb'
import RateLimit from '@/models/RateLimit'

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  await connectToMongoDB()

  const doc = await RateLimit.findOneAndUpdate(
    { key },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(Date.now() + windowMs) } },
    { upsert: true, new: true }
  )

  return doc.count <= limit
}
