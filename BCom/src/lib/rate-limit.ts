// src/lib/rate-limit.ts
// In-memory rate limiting with LRU expiration fallback

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

/**
 * Checks if a key (e.g. `order:ip:${ip}` or `lead:phone:${phone}`) has exceeded the limit.
 * @param key Unique identifier
 * @param limit Max requests allowed in the window
 * @param windowMs Window duration in milliseconds (e.g. 60000 for 1 minute)
 */
export async function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60 * 1000
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const record = memoryStore.get(key);

  // Clean up expired keys periodically if map grows large
  if (memoryStore.size > 10000) {
    for (const [k, v] of memoryStore.entries()) {
      if (v.resetAt < now) {
        memoryStore.delete(k);
      }
    }
  }

  if (!record || record.resetAt < now) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + windowMs,
    };
    memoryStore.set(key, newRecord);
    return {
      success: true,
      remaining: limit - 1,
      resetAt: newRecord.resetAt,
    };
  }

  if (record.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  record.count += 1;
  return {
    success: true,
    remaining: limit - record.count,
    resetAt: record.resetAt,
  };
}
