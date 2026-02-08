import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { authenticateRequest, checkPitchLimit } from "../_shared/auth.ts";
import { validateParsePitchInput, sanitizeForPrompt } from "../_shared/validation.ts";
import { corsHeaders, jsonResponse, errorResponse, handleCors } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";

interface ParsedContext {
  audience: string;
  audience_detail: string;
  subject: string;
  subject_detail: string;
  goal: string;
  tone: string;
  urgency: string;
  suggested_format: 'one-pager' | 'script';
  suggested_length: 'quick' | 'standard' | 'detailed';
  clarifying_questions: string[];
  summary: string;
}

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Authenticate the request
    const { result: authResult, error: authError } = await authenticateRequest(req);
    if (authError) {
      return new Response(authError.body, {
        status: authError.status,
        headers: corsHeaders,
      });
    }

    const { user, profile } = authResult!;

    // Rate limiting
    const rateLimitResult = await checkRateLimit(`parse:${user.id}`, RATE_LIMITS.parseInput.default);
    if (!rateLimitResult.allowed) {
      console.log("Rate limit exceeded for user:", user.id);
      return rateLimitResponse(rateLimitResult);
    }

    // Check pitch limit (server-side paywall)
    const limitCheck = checkPitchLimit(profile);
    if (!limitCheck.allowed) {
      return jsonResponse({ error: limitCheck.error }, limitCheck.statusCode || 402);
    }

    // Parse and validate request body
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

    console.log("Parsing pitch input for user:", authResult!.user.id);

    const systemPrompt = `You are an expert pitch strategist. Analyze the user's pitch request and extract key elements.

Analyze this pitch request and extract:

1. AUDIENCE: Who will receive this pitch? (e.g., investors, boss, team, interviewer, friend, panel, committee)
2. SUBJECT: What is being pitched? (e.g., myself for a job, my startup, an idea, a request, a proposal)
3. GOAL: What outcome does the user want? (e.g., get hired, get funded, get approval, persuade, inform, inspire)
4. TONE: What tone is appropriate? Infer from context. (e.g., formal, confident, humble, casual, urgent, inspirational)
5. URGENCY: When is this needed? (e.g., immediate, tomorrow, this week, not specified)
6. FORMAT SUGGESTION: Based on context, suggest output format:
   - "one-pager" for written summaries, executive briefs, email follow-ups, leave-behinds, proposals
   - "script" for interviews, phone calls, in-person meetings, speeches, presentations, conference talks
7. LENGTH SUGGESTION: Based on context:
   - "quick" for brief summary, 30-second pitch
   - "standard" for full page, 2-3 minute pitch
   - "detailed" for comprehensive document, 5-7 minute pitch

Respond in JSON format:
{
  "audience": "",
  "audience_detail": "",
  "subject": "",
  "subject_detail": "",
  "goal": "",
  "tone": "",
  "urgency": "",
  "suggested_format": "one-pager" | "script",
  "suggested_length": "quick" | "standard" | "detailed",
  "clarifying_questions": [],
  "summary": "MAX 5 WORDS. A punchy, short title for this pitch. Examples: 'Job Interview Pitch', 'Startup Funding Ask', 'Team Project Proposal', 'Product Launch Brief'"
}

Keep "clarifying_questions" empty unless truly ambiguous.`;

    const userPrompt = `User input: "${sanitizedInput}"

Respond with ONLY the JSON object, no other text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return jsonResponse({ error: "Rate limit exceeded. Please try again in a moment." }, 429);
      }
      if (response.status === 402) {
        return jsonResponse({ error: "AI credits exhausted. Please add credits to continue." }, 402);
      }
      return errorResponse("Failed to process your request", 500, `AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;
    
    if (!aiContent) {
      return errorResponse("Failed to process your request", 500, "No content received from AI");
    }

    console.log("AI response received for user:", authResult!.user.id);

    // Parse the JSON from the response
    let parsedContext: ParsedContext;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContext = JSON.parse(jsonMatch[0]);
      } else {
        parsedContext = JSON.parse(aiContent);
      }
    } catch (parseError) {
      return errorResponse("Failed to process your request", 500, parseError);
    }

    // Validate and normalize
    if (!parsedContext.audience || !parsedContext.goal) {
      return errorResponse("Failed to process your request", 500, "Invalid context structure");
    }

    // Ensure valid format and length values - default to one-pager
    if (!['one-pager', 'script'].includes(parsedContext.suggested_format)) {
      parsedContext.suggested_format = 'one-pager';
    }
    if (!['quick', 'standard', 'detailed'].includes(parsedContext.suggested_length)) {
      parsedContext.suggested_length = 'standard';
    }

    return jsonResponse({ parsedContext });

  } catch (error) {
    return errorResponse("An error occurred while processing your request", 500, error);
  }
});
