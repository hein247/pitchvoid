import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { authenticateRequest, checkPitchLimit, checkFormatAccess, incrementPitchCount } from "../_shared/auth.ts";
import { validateGenerateOnePagerInput, sanitizeForPrompt } from "../_shared/validation.ts";
import { corsHeaders, jsonResponse, errorResponse, handleCors } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { callAIWithRetry, SHARED_PROMPT_RULES, FEW_SHOT_EXAMPLES, validateOnePagerOutput, detectHallucinatedNumbers } from "../_shared/aiHelpers.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { result: authResult, error: authError } = await authenticateRequest(req);
    if (authError) {
      return new Response(authError.body, { status: authError.status, headers: corsHeaders });
    }

    const { user, profile } = authResult!;

    const plan = profile.plan || "free";
    const rateConfig = plan === "free" ? RATE_LIMITS.aiGeneration.free : RATE_LIMITS.aiGeneration.paid;
    const rateLimitResult = await checkRateLimit(`onepager:${user.id}`, rateConfig);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult);
    }

    const limitCheck = checkPitchLimit(profile);
    if (!limitCheck.allowed) {
      return jsonResponse({ error: limitCheck.error }, limitCheck.statusCode || 402);
    }

    const formatCheck = checkFormatAccess(profile, 'one-pager');
    if (!formatCheck.allowed) {
      return jsonResponse({ error: formatCheck.error }, formatCheck.statusCode || 402);
    }

    const body = await req.json();
    const validation = validateGenerateOnePagerInput(body);
    if (!validation.valid) {
      return jsonResponse({ error: validation.error }, 400);
    }

    const { scenario, targetAudience, documentContext, imageDescriptions, visualStyle } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return errorResponse("Service configuration error", 500, "LOVABLE_API_KEY is not configured");
    }

    console.log("Generating one-pager for user:", user.id);

    const sanitizedScenario = sanitizeForPrompt(scenario);
    const sanitizedAudience = targetAudience ? sanitizeForPrompt(targetAudience) : "";
    const sanitizedContext = documentContext ? sanitizeForPrompt(documentContext) : "";
    const sanitizedStyle = visualStyle ? sanitizeForPrompt(visualStyle) : "";

    const imageContext = imageDescriptions && imageDescriptions.length > 0
      ? `\n\n**Uploaded Visual Assets (${imageDescriptions.length} images):**\n${imageDescriptions.map((desc: string, i: number) => `- Image ${i + 1}: ${sanitizeForPrompt(desc)}`).join('\n')}`
      : '';

    const ex = FEW_SHOT_EXAMPLES;

    const systemPrompt = `You are a smart friend who just organized someone's scattered notes into clear talking points. You create clarity cheat sheets — structured points someone glances at before a meeting, interview, call, or email.

VOICE & TONE:
- Write like a smart friend, not a consultant. No corporate filler.
- Every sentence must contain at least one specific detail from the user's input.
- If the user said something vague, make it concrete using ONLY details they provided.
- Use the user's own language. If they said "boss", don't upgrade to "senior leadership."

STRUCTURE RULES:
- 2-4 sections, each with a clear thematic label (2-5 words).
- 1-4 points per section. Fewer is better. If you can say it in 2, don't use 4.
- Each point: 1-2 sentences max, self-contained.
- Bold the key phrase in each point using markdown **bold**.
- Last section should always be the next step or ask.

WHAT NOT TO GENERATE:
- No introduction or preamble paragraph.
- No conclusion or summary paragraph.
- No contact information.
- No "Dear [Name]" or letter formatting.
- No bullet symbols in text.
- No section numbering.

${SHARED_PROMPT_RULES}

FEW-SHOT EXAMPLES:

Example 1 (Job Interview) — Input: "${ex.jobInterview.input}"
${JSON.stringify(ex.jobInterview.onePager, null, 2)}

Example 2 (Board Presentation) — Input: "${ex.boardPresentation.input}"
${JSON.stringify(ex.boardPresentation.onePager, null, 2)}

Example 3 (Client Pitch) — Input: "${ex.clientPitch.input}"
${JSON.stringify(ex.clientPitch.onePager, null, 2)}

Output ONLY a valid JSON object matching this structure:
{
  "title": "short label, max 8 words",
  "context_line": "one sentence: [what] for [who]",
  "sections": [
    {
      "title": "2-5 word label",
      "points": ["1-2 sentences with **one bold key phrase**"]
    }
  ]
}`;

    const userPrompt = `Create a clarity cheat sheet from this input:

**Scenario:** ${sanitizedScenario}
${sanitizedAudience ? `**Target Audience:** ${sanitizedAudience}` : ''}
${sanitizedContext ? `**Additional Context:** ${sanitizedContext}` : ''}${imageContext}
${sanitizedStyle ? `**Tone/Style:** ${sanitizedStyle}` : ''}

Generate the JSON now. Output ONLY the JSON object, no other text.`;

    const { data, error } = await callAIWithRetry(LOVABLE_API_KEY, systemPrompt, userPrompt);
    if (error) return error;

    const onePager = data as Record<string, unknown>;

    // Handle edge case: input too sparse
    if (onePager.needs_more) {
      return jsonResponse({ needs_more: true, suggestion: onePager.suggestion || "Try describing who you're talking to and what you need to communicate." });
    }

    // Validate structure
    const structureCheck = validateOnePagerOutput(onePager);
    if (!structureCheck.valid) {
      return errorResponse("AI generated invalid output: " + structureCheck.error, 500, structureCheck.error);
    }

    // Detect hallucinated numbers
    const allInputText = [scenario, targetAudience, documentContext].filter(Boolean).join(" ");
    const flaggedNumbers = detectHallucinatedNumbers(allInputText, onePager);

    // Add metadata
    (onePager as any).generated_at = new Date().toISOString();
    (onePager as any).format = "one-pager";
    (onePager as any).version = 1;

    await incrementPitchCount(user.id);
    console.log("Generated one-pager for user:", user.id);

    return jsonResponse({
      onePager,
      ...(flaggedNumbers.length > 0 ? { flaggedNumbers } : {}),
    });

  } catch (error) {
    return errorResponse("An error occurred while generating your one-pager", 500, error);
  }
});
