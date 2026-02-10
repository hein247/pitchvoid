import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { authenticateRequest, checkPitchLimit } from "../_shared/auth.ts";
import { validateParsePitchInput, sanitizeForPrompt } from "../_shared/validation.ts";
import { corsHeaders, jsonResponse, errorResponse, handleCors } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";

interface ParsedContext {
  audience: string;
  audience_detail: string;
  audience_confidence: number;
  subject: string;
  subject_detail: string;
  subject_confidence: number;
  goal: string;
  goal_confidence: number;
  tone: string;
  tone_confidence: number;
  urgency: string;
  suggested_format: 'one-pager' | 'script';
  suggested_length: 'quick' | 'standard' | 'detailed';
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

    const systemPrompt = `You are a sharp, intuitive thinking partner. The user is someone busy with scattered thoughts they need to communicate clearly to someone else. They're not writing a formal "pitch" — they're dumping rough ideas, bullet points, or rambling thoughts. Your job is to extract structure from the mess.

Parse like a smart friend who immediately gets what you're trying to say, even when you can't articulate it yet.

For every input, extract these four dimensions:
- WHO: The audience. Who will actually hear or read this? Be specific — "direct manager" not just "boss", "Series A investors" not just "investors".
- WHAT: The core message. What is the user actually trying to communicate? Strip away the noise and find the signal.
- WHY: Why it matters to THAT audience. Not why the user cares — why the LISTENER should care.
- HOW: The best angle or approach. What framing, tone, or structure will land best given the audience and goal?

CRITICAL RULES:
1. INFER missing information intelligently. Never leave fields vague when context clues exist. If someone says "need to talk to my boss about raise" — you know WHO=direct manager, WHAT=compensation increase discussion, WHY=retention risk + market alignment, HOW=data-driven with specific asks.
2. Each field gets a confidence score from 0.0 to 1.0. High (0.8-1.0) when the input is explicit. Medium (0.5-0.79) when you're making a strong inference. Low (0.2-0.49) when you're guessing from minimal context.
3. Never ask clarifying questions. Always make your best inference and let the confidence scores signal uncertainty.

## FEW-SHOT EXAMPLES

INPUT: "ugh ok so basically my team has been killing it this quarter but nobody knows about it. need to update leadership somehow. we shipped the new auth system, cut page load by 40%, and onboarded 3 enterprise clients. also sarah got poached by google so thats fun"
OUTPUT:
{
  "audience": "Engineering leadership / VP-level",
  "audience_detail": "Senior technical leaders who allocate resources and make promotion decisions",
  "audience_confidence": 0.7,
  "subject": "Q4 engineering team impact report",
  "subject_detail": "Key wins: new auth system shipped, 40% performance improvement, 3 enterprise clients onboarded. Team retention risk with recent departure to Google.",
  "subject_confidence": 0.95,
  "goal": "Get visibility and recognition for team performance, flag retention risk",
  "goal_confidence": 0.85,
  "tone": "confident",
  "tone_confidence": 0.8,
  "urgency": "this week",
  "suggested_format": "one-pager",
  "suggested_length": "standard",
  "summary": "Team Wins & Retention Flag"
}

INPUT: "meeting with investor tmrw. fintech app. we do expense tracking for freelancers, 8k users, growing 15% MoM. need money to hire engineers. i keep fumbling the 'why now' part"
OUTPUT:
{
  "audience": "Early-stage VC / angel investor",
  "audience_detail": "Investor evaluating product-market fit, growth trajectory, and team capability for seed/pre-seed round",
  "audience_confidence": 0.9,
  "subject": "Seed funding pitch for freelancer expense tracking app",
  "subject_detail": "Fintech product with 8K users growing 15% month-over-month. Seeking engineering hires. Founder needs help articulating market timing.",
  "subject_confidence": 0.95,
  "goal": "Secure investment by demonstrating traction and market timing",
  "goal_confidence": 0.95,
  "tone": "confident",
  "tone_confidence": 0.85,
  "urgency": "immediate",
  "suggested_format": "script",
  "suggested_length": "standard",
  "summary": "Freelancer Fintech Seed Pitch"
}

INPUT: "need to talk to my boss about raise. been here 2 years, took on the entire mobile project when jake left, havent had a bump since i started"
OUTPUT:
{
  "audience": "Direct manager",
  "audience_detail": "Immediate supervisor who can approve or advocate for compensation changes",
  "audience_confidence": 0.9,
  "subject": "Compensation increase request",
  "subject_detail": "2-year tenure with no salary adjustment. Took on expanded responsibilities (full mobile project ownership) after team member departure. Case built on scope increase and tenure.",
  "subject_confidence": 0.95,
  "goal": "Secure a salary increase reflecting expanded role and market rate",
  "goal_confidence": 0.95,
  "tone": "balanced",
  "tone_confidence": 0.75,
  "urgency": "this week",
  "suggested_format": "script",
  "suggested_length": "quick",
  "summary": "Salary Raise Conversation"
}

## OUTPUT FORMAT

Return ONLY a JSON object with these exact fields:
{
  "audience": "specific audience label",
  "audience_detail": "expanded context about who they are and what they care about",
  "audience_confidence": 0.0-1.0,
  "subject": "core message in one phrase",
  "subject_detail": "expanded details including all relevant facts from input",
  "subject_confidence": 0.0-1.0,
  "goal": "what the user wants to achieve",
  "goal_confidence": 0.0-1.0,
  "tone": "confident" | "humble" | "balanced" | "bold" | "casual" | "formal" | "urgent" | "inspirational",
  "tone_confidence": 0.0-1.0,
  "urgency": "immediate" | "tomorrow" | "this week" | "not specified",
  "suggested_format": "one-pager" | "script",
  "suggested_length": "quick" | "standard" | "detailed",
  "summary": "MAX 5 WORDS. Punchy title for this communication."
}`;

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
