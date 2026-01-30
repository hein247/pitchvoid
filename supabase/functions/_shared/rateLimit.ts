/**
 * Simple in-memory rate limiter for edge functions
 * Uses a Map to track request counts per key (IP or user ID)
 * 
 * Note: This is a basic implementation. In production, consider using
 * Deno KV or an external Redis instance for distributed rate limiting.
 */

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (reset on function cold start)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfterSeconds?: number;
}

/**
 * Check if a request is allowed based on rate limits
 * @param key - Unique identifier (IP address or user ID)
 * @param config - Rate limit configuration
 * @returns RateLimitResult with allowed status and metadata
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // If no entry exists or window has expired, create new entry
  if (!entry || now > entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Increment count
  entry.count++;

  // Check if over limit
  if (entry.count > config.maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfterSeconds,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client IP from request headers
 */
export function getClientIP(req: Request): string {
  // Check various headers for client IP
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback to a default if no IP found
  return "unknown";
}

/**
 * Create rate limit response with proper headers
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({ 
      error: "Too many requests. Please try again later.",
      retryAfter: result.retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSeconds || 60),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(result.resetTime),
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
      },
    }
  );
}

// Predefined rate limit configs for different use cases
export const RATE_LIMITS = {
  // AI generation endpoints - more restrictive
  aiGeneration: {
    free: { windowMs: 60 * 60 * 1000, maxRequests: 10 },      // 10/hour for free users
    paid: { windowMs: 60 * 60 * 1000, maxRequests: 100 },     // 100/hour for paid users
  },
  // Checkout endpoint - very restrictive
  checkout: {
    default: { windowMs: 10 * 60 * 1000, maxRequests: 5 },    // 5 per 10 minutes
  },
  // Parse input endpoint
  parseInput: {
    default: { windowMs: 60 * 60 * 1000, maxRequests: 30 },   // 30/hour
  },
  // Image generation
  imageGeneration: {
    default: { windowMs: 60 * 60 * 1000, maxRequests: 20 },   // 20/hour
  },
};
