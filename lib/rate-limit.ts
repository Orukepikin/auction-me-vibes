// Simple in-memory rate limiter for MVP
// In production, use Redis or similar

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

export function rateLimit({
  key,
  limit = 5,
  windowMs = 60000, // 1 minute
}: {
  key: string
  limit?: number
  windowMs?: number
}): { success: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const entry = store.get(key)

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    cleanup()
  }

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1, resetIn: windowMs }
  }

  if (entry.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetIn: entry.resetAt - now,
    }
  }

  entry.count++
  return {
    success: true,
    remaining: limit - entry.count,
    resetIn: entry.resetAt - now,
  }
}

function cleanup() {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}
