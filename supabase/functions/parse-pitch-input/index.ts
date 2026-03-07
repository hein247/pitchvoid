import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { authenticateRequest, checkPitchLimit } from "../_shared/auth.ts";
import { validateParsePitchInput, sanitizeForPrompt } from "../_shared/validation.ts";
import { corsHeaders, jsonResponse, errorResponse, handleCors } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { parseJsonFromAI } from "../_shared/aiHelpers.ts";

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

    // Input validation: skip AI if fewer than 5 words
    const wordCount = sanitizedInput.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 5) {
      return jsonResponse({
        needs_more: true,
        suggestion: "Tell me a bit more \u2014 who are you talking to and what do you need to say?"
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return errorResponse("Service configuration error", 500, "LOVABLE_API_KEY is not configured");
    }

    // Fetch user's writing preferences
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: prefData } = await supabaseClient
      .from("profiles")
      .select("writing_preferences")
      .eq("id", user.id)
      .single();

    const writing_preferences = (prefData?.writing_preferences as Record<string, string>) || {};

    console.log("Parsing pitch input for user:", user.id);

    const systemPrompt = `You are PitchVoid's parsing engine. Your job is to extract structure from messy, scattered user input.

The user is busy and overwhelmed. They're dumping rough thoughts — not writing polished text. Your job is to immediately understand what they mean, even when they can't articulate it clearly.

Extract these elements:
- audience: who will receive this communication (if anyone)
- audience_detail: more specific description of audience
- subject: what's the core topic
- subject_detail: expanded description
- goal: what the user wants to achieve
- tone: detected tone (confident, humble, balanced, bold)
- urgency: how urgent this feels
- suggested_format: "one-pager" or "script"
- suggested_length: "quick", "standard", or "detailed"
- summary: one-sentence summary of the input
- mode: "thinking" if there's no audience, "performance" if presenting/pitching, "clarity" if personal/emotional
- who_confidence: "high", "medium", or "low" — how confident you are that a real audience exists

Rules:
- If the user didn't mention who they're talking to, set audience to "" (empty string), audience_detail to "", who_confidence to "low", and mode to "thinking". Do NOT invent an audience.
- Do not assume a business pitch just because the content mentions software, products, revenue, or business concepts. The absence of an audience means the user is organizing their own thoughts.
- If there IS a clear audience, set who_confidence to "high" and mode to "performance" or "clarity" as appropriate.
- Use the user's own words where possible. If they say "boss", don't upgrade to "senior leadership."
- NEVER invent specific numbers, company names, or details the user didn't provide.
- Return ONLY valid JSON. No markdown, no explanation, no text outside the JSON.

Return this schema:
{
  "audience": "string (empty if no audience)",
  "audience_detail": "string (empty if no audience)",
  "subject": "string",
  "subject_detail": "string",
  "goal": "string",
  "tone": "confident|humble|balanced|bold",
  "urgency": "string",
  "suggested_format": "one-pager|script",
  "suggested_length": "quick|standard|detailed",
  "clarifying_questions": [],
  "summary": "string",
  "mode": "thinking|performance|clarity",
  "who_confidence": "high|medium|low"
}

USER CONTEXT:
- Preferred tone: ${writing_preferences.tone || "clear and human"}
- Industry: ${writing_preferences.industry || "not specified"}`;

    const userPrompt = `User input: "${sanitizedInput}"

Respond with ONLY the JSON object, no other text.`;

    // First AI attempt
    const callAI = async (extraInstruction?: string) => {
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];
      if (extraInstruction) {
        messages.push({ role: "user", content: extraInstruction });
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages,
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return { data: null, error: jsonResponse({ error: "Rate limit exceeded. Please try again in a moment." }, 429) };
        }
        if (response.status === 402) {
          return { data: null, error: jsonResponse({ error: "AI credits exhausted. Please add credits to continue." }, 402) };
        }
        return { data: null, error: errorResponse("AI generation failed", 500, `AI gateway error: ${response.status}`) };
      }

      const responseData = await response.json();
      const aiContent = responseData.choices?.[0]?.message?.content;
      if (!aiContent) {
        return { data: null, error: errorResponse("AI generation failed", 500, "No content received from AI") };
      }
      return { data: aiContent as string, error: undefined };
    };

    // First attempt
    const first = await callAI();
    if (first.error) return first.error;

    try {
      const parsed = parseJsonFromAI(first.data!);
      return jsonResponse({ parsedContext: parsed });
    } catch {
      console.warn("First AI response was invalid JSON, retrying...");
    }

    // Retry with extra instruction
    const second = await callAI("Your previous response was not valid JSON. Return ONLY a valid JSON object.");
    if (second.error) return second.error;

    try {
      const parsed = parseJsonFromAI(second.data!);
      return jsonResponse({ parsedContext: parsed });
    } catch {
      return errorResponse("AI returned invalid JSON after retry. Please try again.", 500, "JSON parse failed on retry");
    }

  } catch (error) {
    return errorResponse("An error occurred while processing your request", 500, error);
  }
});
