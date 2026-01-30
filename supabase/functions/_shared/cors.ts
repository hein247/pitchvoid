/**
 * Shared CORS headers for edge functions
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

/**
 * Creates a JSON response with CORS headers
 */
export function jsonResponse(
  data: unknown,
  status = 200,
  additionalHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...additionalHeaders,
    },
  });
}

/**
 * Creates a generic error response (doesn't expose internal details)
 */
export function errorResponse(
  userMessage: string,
  status = 500,
  internalError?: unknown
): Response {
  // Log internal error server-side only
  if (internalError) {
    console.error("Internal error:", internalError);
  }

  return jsonResponse({ error: userMessage }, status);
}

/**
 * Handle CORS preflight requests
 */
export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}
