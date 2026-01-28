// Simple in-memory rate limiting

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Default: 10 requests per minute
const DEFAULT_LIMIT = 10
const DEFAULT_WINDOW_MS = 60 * 1000

export function rateLimit(
  key: string,
  limit: number = DEFAULT_LIMIT,
  windowMs: number = DEFAULT_WINDOW_MS
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = store.get(key)

  // If no entry or window expired, create new entry
  if (!entry || now > entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    }
    store.set(key, newEntry)
    return {
      success: true,
      remaining: limit - 1,
      resetAt: newEntry.resetAt,
    }
  }

  // Check if limit exceeded
  if (entry.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  // Increment count
  entry.count++
  return {
    success: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  }
}

// Cleanup old entries periodically
function cleanup() {
  const now = Date.now()
  const keys = Array.from(store.keys())
  for (const key of keys) {
    const entry = store.get(key)
    if (entry && now > entry.resetAt) {
      store.delete(key)
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanup, 5 * 60 * 1000)

export function checkRateLimit(userId: string, limit: number = 5): boolean {
  const result = rateLimit(`user:${userId}`, limit, 60 * 1000)
  return result.success
}