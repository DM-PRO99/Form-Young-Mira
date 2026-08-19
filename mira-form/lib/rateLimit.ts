interface RateLimitRecord {
  count: number
  resetAt: number
}

// Nota: Map en memoria — válido para proceso único. En Vercel con múltiples instancias
// considera usar Redis (Upstash) para rate limiting distribuido.
const store = new Map<string, RateLimitRecord>()

export function checkRateLimit(
  key: string,
  limit = 5,
  windowMs = 60_000
): boolean {
  const now = Date.now()
  const record = store.get(key)

  if (!record || record.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (record.count >= limit) return false

  record.count++
  return true
}
