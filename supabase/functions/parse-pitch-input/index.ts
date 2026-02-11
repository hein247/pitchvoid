import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { authenticateRequest, checkPitchLimit } from "../_shared/auth.ts";
import { validateParsePitchInput, sanitizeForPrompt } from "../_shared/validation.ts";
import { corsHeaders, jsonResponse, errorResponse, handleCors } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { callAIWithRetry, SHARED_PROMPT_RULES, FEW_SHOT_EXAMPLES, validateParsedContextOutput } from "../_shared/aiHelpers.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { result: authResult, error: authError } = await authenticateRequest(req);
    if (authError) {
      return new Response(authError.body, { status: authError.status, headers: corsHeaders });
    }

    const { user, profile } = authResult!;

    const rateLimitResult = await checkRateLimit(`parse:${user.id}`, RATE_LIMITS.parseInput.default);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult);
    }

    const limitCheck = checkPitchLimit(profile);
    if (!limitCheck.allowed) {
      return jsonResponse({ error: limitCheck.error }, limitCheck.statusCode || 402);
    }

    const body = await req.json();
    const validation = validateParsePitchInput(body);
    if (!validation.valid) {
      return jsonResponse({ error: validation.error }, 400);
    }

    const { userInput } = body;
    const sanitizedInput = sanitizeForPrompt(userInput);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return errorResponse("Service configuration error", 500, "LOVABLE_API_KEY is not configured");
    }

    console.log("Parsing pitch input for user:", user.id);

    const ex = FEW_SHOT_EXAMPLES;

    const systemPrompt = `You are a sharp, intuitive thinking partner. The user is someone busy with scattered thoughts they need to communicate clearly. Your job is to extract structure from the mess.

Parse like a smart friend who immediately gets what you're trying to say, even when you can't articulate it yet.

For every input, extract these four dimensions:
- WHO: The audience. Be specific — "direct manager" not just "boss".
- WHAT: The core message. Strip away the noise and find the signal.
- WHY: Why it matters to THAT audience. Not why the user cares — why the LISTENER should care.
- HOW: The best angle or approach given the audience and goal.

CRITICAL RULES:
1. INFER missing information intelligently. Never leave fields vague when context clues exist.
2. Each field gets a confidence score from 0.0 to 1.0.
3. Never ask clarifying questions. Always make your best inference.

${SHARED_PROMPT_RULES}

FEW-SHOT EXAMPLES:

Example 1 (Job Interview) — Input: "${ex.jobInterview.input}"
${JSON.stringify(ex.jobInterview.parsed, null, 2)}

Example 2 (Board Presentation) — Input: "${ex.boardPresentation.input}"
${JSON.stringify(ex.boardPresentation.parsed, null, 2)}

Example 3 (Client Pitch) — Input: "${ex.clientPitch.input}"
${JSON.stringify(ex.clientPitch.parsed, null, 2)}

OUTPUT FORMAT — Return ONLY a JSON object with these exact fields:
{
  "audience": "specific audience label",
  "audience_detail": "expanded context about who they are",
  "audience_confidence": 0.0-1.0,
  "subject": "core message in one phrase",
  "subject_detail": "expanded details from input",
  "subject_confidence": 0.0-1.0,
  "goal": "what the user wants to achieve",
  "goal_confidence": 0.0-1.0,
  "tone": "confident" | "humble" | "balanced" | "bold" | "casual" | "formal" | "urgent" | "inspirational",
  "tone_confidence": 0.0-1.0,
  "urgency": "immediate" | "tomorrow" | "this week" | "not specified",
  "suggested_format": "one-pager" | "script",
  "suggested_length": "quick" | "standard" | "detailed",
  "summary": "MAX 5 WORDS."
}`;

    const userPrompt = `User input: "${sanitizedInput}"

Respond with ONLY the JSON object, no other text.`;

    const { data, error } = await callAIWithRetry(LOVABLE_API_KEY, systemPrompt, userPrompt);
    if (error) return error;

    const parsedContext = data as Record<string, unknown>;

    // Handle edge case: input too sparse
    if (parsedContext.needs_more) {
      return jsonResponse({ needs_more: true, suggestion: parsedContext.suggestion || "Try describing who you're talking to and what you need to communicate." });
    }

    // Fill defaults for any missing fields instead of hard-failing
    if (!parsedContext.audience || typeof parsedContext.audience !== "string") parsedContext.audience = "General audience";
    if (!parsedContext.subject || typeof parsedContext.subject !== "string") parsedContext.subject = "Not specified";
    if (!parsedContext.goal || typeof parsedContext.goal !== "string") parsedContext.goal = "Communicate effectively";
    if (!parsedContext.tone || typeof parsedContext.tone !== "string") parsedContext.tone = "balanced";
    if (!parsedContext.summary || typeof parsedContext.summary !== "string") parsedContext.summary = "Pitch overview";

    // Ensure valid format and length values
    if (!['one-pager', 'script'].includes(parsedContext.suggested_format as string)) {
      parsedContext.suggested_format = 'one-pager';
    }
    if (!['quick', 'standard', 'detailed'].includes(parsedContext.suggested_length as string)) {
      parsedContext.suggested_length = 'standard';
    }

    return jsonResponse({ parsedContext });

  } catch (error) {
    return errorResponse("An error occurred while processing your request", 500, error);
  }
});
