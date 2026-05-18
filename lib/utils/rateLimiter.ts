interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitRecord>()

export async function rateLimiter(
  identifier: string,
  maxRequests: number = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10'),
  windowMs: number = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000')
): Promise<boolean> {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)
  
  if (!record) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    })
    return false
  }
  
  if (now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    })
    return false
  }
  
  if (record.count >= maxRequests) {
    return true
  }
  
  record.count++
  rateLimitMap.set(identifier, record)
  return false
}

// Clean up expired records every hour
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of Array.from(rateLimitMap.entries())) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 3600000)