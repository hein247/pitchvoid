import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { authenticateRequest, checkPitchLimit, checkFormatAccess, incrementPitchCount } from "../_shared/auth.ts";
import { validateGenerateScriptInput, sanitizeForPrompt } from "../_shared/validation.ts";
import { corsHeaders, jsonResponse, errorResponse, handleCors } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { callAIWithRetry, SHARED_PROMPT_RULES, FEW_SHOT_EXAMPLES, validateScriptOutput, detectHallucinatedNumbers } from "../_shared/aiHelpers.ts";

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
    const rateLimitResult = await checkRateLimit(`script:${user.id}`, rateConfig);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult);
    }

    const limitCheck = checkPitchLimit(profile);
    if (!limitCheck.allowed) {
      return jsonResponse({ error: limitCheck.error }, limitCheck.statusCode || 402);
    }

    const formatCheck = checkFormatAccess(profile, 'script');
    if (!formatCheck.allowed) {
      return jsonResponse({ error: formatCheck.error }, formatCheck.statusCode || 402);
    }

    const body = await req.json();
    const validation = validateGenerateScriptInput(body);
    if (!validation.valid) {
      return jsonResponse({ error: validation.error }, 400);
    }

    const { scenario, targetAudience, documentContext, imageDescriptions, tone, length } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return errorResponse("Service configuration error", 500, "LOVABLE_API_KEY is not configured");
    }

    console.log("Generating script for user:", user.id);

    const sanitizedScenario = sanitizeForPrompt(scenario);
    const sanitizedAudience = targetAudience ? sanitizeForPrompt(targetAudience) : "";
    const sanitizedContext = documentContext ? sanitizeForPrompt(documentContext) : "";
    const sanitizedTone = tone ? sanitizeForPrompt(tone) : "";

    const docContext = sanitizedContext ? `\n\n**Document Context:**\n${sanitizedContext}` : '';
    const imageContext = imageDescriptions && imageDescriptions.length > 0
      ? `\n\n**Visual Assets (${imageDescriptions.length} images):**\n${imageDescriptions.map((desc: string, i: number) => `- Image ${i + 1}: ${sanitizeForPrompt(desc)}`).join('\n')}`
      : '';

    const durationMap: Record<string, { sections: number; total: string }> = {
      'quick': { sections: 3, total: '30-60 seconds' },
      'standard': { sections: 5, total: '2-3 minutes' },
      'detailed': { sections: 7, total: '5-7 minutes' }
    };
    const { sections: sectionCount, total: totalDuration } = durationMap[length] || durationMap['standard'];

    const ex = FEW_SHOT_EXAMPLES;

    const systemPrompt = `You are an expert speech writer and presentation coach. Create a timed speaking script with natural delivery cues.

SCRIPT PRINCIPLES:
- Conversational yet polished language
- Clear timing for each section
- Stage directions and delivery cues
- Memorable phrases to emphasize
- Natural transitions between sections
- Write how real people actually talk. Be specific, be direct, be memorable.

${SHARED_PROMPT_RULES}

FEW-SHOT EXAMPLES:

Example 1 (Job Interview) — Input: "${ex.jobInterview.input}"
${JSON.stringify(ex.jobInterview.script, null, 2)}

Example 2 (Board Presentation) — Input: "${ex.boardPresentation.input}"
${JSON.stringify(ex.boardPresentation.script, null, 2)}

Example 3 (Client Pitch) — Input: "${ex.clientPitch.input}"
${JSON.stringify(ex.clientPitch.script, null, 2)}

Output ONLY a valid JSON object with this structure:
{
  "title": "Script title",
  "total_duration": "${totalDuration}",
  "sections": [
    {
      "name": "Section name",
      "duration": "15 seconds",
      "content": "What to say word-for-word",
      "cue": "Stage direction"
    }
  ],
  "key_phrases": ["Memorable phrase 1", "Memorable phrase 2"]
}

Generate ${sectionCount} sections for a ${length || 'standard'} length (${totalDuration}).
TONE: ${sanitizedTone || 'confident and professional'}`;

    const userPrompt = `Create a speaking script:

**Scenario:** ${sanitizedScenario}
**Audience:** ${sanitizedAudience || "Decision makers"}
**Length:** ${length || 'standard'} (${totalDuration})
**Tone:** ${sanitizedTone || 'confident'}
${docContext}${imageContext}

Generate the JSON now. Output ONLY the JSON object, no other text.`;

    const { data, error } = await callAIWithRetry(LOVABLE_API_KEY, systemPrompt, userPrompt);
    if (error) return error;

    const script = data as Record<string, unknown>;

    // Handle edge case: input too sparse
    if (script.needs_more) {
      return jsonResponse({ needs_more: true, suggestion: script.suggestion || "Try describing who you're talking to and what you need to communicate." });
    }

    // Validate structure
    const structureCheck = validateScriptOutput(script);
    if (!structureCheck.valid) {
      return errorResponse("AI generated invalid output: " + structureCheck.error, 500, structureCheck.error);
    }

    // Detect hallucinated numbers
    const allInputText = [scenario, targetAudience, documentContext].filter(Boolean).join(" ");
    const flaggedNumbers = detectHallucinatedNumbers(allInputText, script);

    await incrementPitchCount(user.id);
    console.log("Generated script for user:", user.id);

    return jsonResponse({
      script,
      ...(flaggedNumbers.length > 0 ? { flaggedNumbers } : {}),
    });

  } catch (error) {
    return errorResponse("An error occurred while generating your script", 500, error);
  }
});
