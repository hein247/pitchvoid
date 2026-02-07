/**
 * Persistent database-backed rate limiter for edge functions
 * Uses Supabase database for rate limit storage to survive cold starts
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfterSeconds?: number;
}

/**
 * Get Supabase client for rate limit operations (uses service role)
 */
function getSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );
}

/**
 * Check if a request is allowed based on rate limits using persistent storage
 * @param key - Unique identifier (e.g., "pitch:user-id")
 * @param config - Rate limit configuration
 * @returns RateLimitResult with allowed status and metadata
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const supabase = getSupabaseClient();
  const now = Date.now();
  const resetTime = now + config.windowMs;

  try {
    // Try to get existing rate limit entry
    const { data: existing, error: fetchError } = await supabase
      .from("rate_limits")
      .select("count, reset_time")
      .eq("key", key)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = no rows returned, which is expected for new keys
      console.error("Rate limit fetch error:", fetchError);
      // On error, allow the request but log it
      return { allowed: true, remaining: config.maxRequests - 1, resetTime };
    }

    // If no entry exists or window has expired, create/reset entry
    if (!existing || new Date(existing.reset_time).getTime() < now) {
      const { error: upsertError } = await supabase
        .from("rate_limits")
        .upsert({
          key,
          count: 1,
          reset_time: new Date(resetTime).toISOString(),
          created_at: new Date().toISOString(),
        }, { onConflict: "key" });

      if (upsertError) {
        console.error("Rate limit upsert error:", upsertError);
      }

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime,
      };
    }

    // Entry exists and is still valid - check if over limit
    const currentCount = existing.count;
    const entryResetTime = new Date(existing.reset_time).getTime();

    if (currentCount >= config.maxRequests) {
      const retryAfterSeconds = Math.ceil((entryResetTime - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTime: entryResetTime,
        retryAfterSeconds: Math.max(1, retryAfterSeconds),
      };
    }

    // Increment the count
    const { error: updateError } = await supabase
      .from("rate_limits")
      .update({ count: currentCount + 1 })
      .eq("key", key);

    if (updateError) {
      console.error("Rate limit update error:", updateError);
    }

    return {
      allowed: true,
      remaining: config.maxRequests - currentCount - 1,
      resetTime: entryResetTime,
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    // On unexpected error, allow the request
    return { allowed: true, remaining: config.maxRequests - 1, resetTime };
  }
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
  const resetDate = new Date(result.resetTime);
  const resetTimeStr = resetDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  
  return new Response(
    JSON.stringify({ 
      error: `Rate limit exceeded. Please try again after ${resetTimeStr}.`,
      errorType: "rate_limit",
      retryAfter: result.retryAfterSeconds,
      resetTime: result.resetTime,
      resetTimeFormatted: resetTimeStr,
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
