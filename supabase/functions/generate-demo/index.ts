import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { validateGenerateOnePagerInput, sanitizeForPrompt } from "../_shared/validation.ts";
import { corsHeaders, jsonResponse, errorResponse, handleCors } from "../_shared/cors.ts";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rateLimit.ts";
import { callAIWithRetry, validateOnePagerOutput, detectHallucinatedNumbers, ABSOLUTE_TRUST_RULE, stripBoldFromFlaggedNumbers } from "../_shared/aiHelpers.ts";

const DEMO_RATE_LIMIT = { windowMs: 24 * 60 * 60 * 1000, maxRequests: 1 };

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // IP-based rate limiting — no auth required
    const clientIP = getClientIP(req);
    const rateLimitResult = await checkRateLimit(`demo:${clientIP}`, DEMO_RATE_LIMIT);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult);
    }

    const body = await req.json();
    const validation = validateGenerateOnePagerInput(body);
    if (!validation.valid) {
      return jsonResponse({ error: validation.error }, 400);
    }

    const { scenario, targetAudience } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return errorResponse("Service configuration error", 500, "LOVABLE_API_KEY is not configured");
    }

    console.log("Generating demo one-pager for IP:", clientIP);

    const sanitizedScenario = sanitizeForPrompt(scenario);
    const sanitizedAudience = targetAudience ? sanitizeForPrompt(targetAudience) : "";

    const systemPrompt = `${ABSOLUTE_TRUST_RULE}IDENTITY: You are a clarity engine. Someone comes to you with scattered thoughts, half-formed ideas, and anxiety about something they need to say. Your job is to find the structure hiding inside their mess and hand it back clean. You don't add. You don't invent. You don't polish beyond recognition. You CLARIFY.

CORE PRINCIPLE: The test for every output: would the user read this and say "that's exactly what I meant" — not "wow that sounds professional." If they don't recognize their own voice and ideas, you failed. Clarity means the user sees THEIR thoughts organized, not a polished version written by someone else.

VOICE MATCHING: Match the user's register exactly. If they typed casually with no punctuation, the output feels direct and informal inside the rigid 3-section structure. If they were emotional, the output feels human and grounded — not clinical. If they were formal, match that formality. The structure is always rigid. The voice inside it is always theirs.

TRUST: The user is trusting you with messy, vulnerable, unfiltered thoughts. Inventing facts, adding claims they didn't make, or inserting language they wouldn't use BREAKS THAT TRUST. Be a mirror that organizes, not a ghostwriter that embellishes. If the user said it, structure it. If the user didn't say it, don't.

STEP 1 — DETECT CONTEXT AND MODE from the parsed input (audience, goal, content).

First, determine the MODE:
- PERFORMANCE MODE: The user is preparing to deliver, persuade, or present to someone. They need authority and structure.
- CLARITY MODE: The user is trying to think through something, organize their own thoughts, or prepare for a conversation where honesty matters more than authority.

Then pick the BEST context match:

PERFORMANCE CONTEXTS:
- Business Pitch → sections: THE PROBLEM / PROVEN RESULTS / THE PROPOSAL
- Meeting Prep → sections: THE SITUATION / THE EVIDENCE / THE ASK
- Job Interview → sections: THE FIT / THE TRACK RECORD / THE VALUE
- Networking → sections: THE CONTEXT / THE CREDIBILITY / THE CONNECTION
- Sales → sections: THE PAIN / THE PROOF / THE NEXT STEP
- Education / Academic → sections: THE QUESTION / THE EVIDENCE / THE CONTRIBUTION
- Creative Performance → sections: THE SETUP / THE TURN / THE CLOSER

CLARITY CONTEXTS:
- Difficult Conversation → sections: HERE'S WHAT'S GOING ON / HERE'S WHAT I KNOW / HERE'S WHAT I NEED
- Personal / Life → sections: HERE'S WHAT'S GOING ON / HERE'S WHAT I KNOW / HERE'S WHAT I NEED
- Thinking / Ideas → sections: HERE'S THE IDEA / HERE'S HOW IT WORKS / HERE'S WHAT'S NEXT
- General → sections: HERE'S WHAT'S GOING ON / HERE'S WHAT I KNOW / HERE'S WHAT I NEED

If the input has no clear audience or listener, default to clarity mode with labels: HERE'S THE IDEA / HERE'S HOW IT WORKS / HERE'S WHAT'S NEXT.

STEP 2 — GENERATE using these HARD RULES:
- Exactly 3 sections
- Max 2 points per section
- Bold ONLY numbers/metrics with **bold**
- Never invent facts
- Match user's tone

OUTPUT SCHEMA (return ONLY this JSON, nothing else):
{
  "title": "short label, max 8 words",
  "context_line": "[What] for [Who], one sentence",
  "sections": [
    {
      "title": "detected section label",
      "points": ["each point is 1-2 sentences, max 2 points per section"]
    }
  ]
}

STRUCTURE RULES:
- Maximum 2 points per section.
- The last section should have exactly 1 point.
- Each point is self-contained.
- Max 2 sentences per point.
- Front-load the key detail in the first 5 words.
- Never repeat the same fact across points.

DO NOT:
- Invent statistics, numbers, or names the user did not provide
- Use placeholder brackets like [Company Name]
- Add greetings, sign-offs, or pleasantries
- Include any text outside the JSON

USER CONTEXT:
- Preferred tone: clear, confident, and human
- Industry: not specified
- Avoid: corporate filler`;

    const userPrompt = `Create a clarity cheat sheet from this input:

**Scenario:** ${sanitizedScenario}
${sanitizedAudience ? `**Target Audience:** ${sanitizedAudience}` : '**Target Audience:** None specified — the user is organizing their own thoughts, not preparing to present to anyone. Use CLARITY/THINKING mode with labels: HERE\'S THE IDEA / HERE\'S HOW IT WORKS / HERE\'S WHAT\'S NEXT.'}

Generate the JSON now. Output ONLY the JSON object, no other text.`;

    const { data, error } = await callAIWithRetry(LOVABLE_API_KEY, systemPrompt, userPrompt);
    if (error) return error;

    const onePager = data as Record<string, unknown>;

    if (onePager.needs_more) {
      return jsonResponse({ needs_more: true, suggestion: onePager.suggestion || "Try describing who you're talking to and what you need to communicate." });
    }

    // Enforce section limits
    if (Array.isArray(onePager.sections) && onePager.sections.length > 3) {
      const sections = onePager.sections as Array<Record<string, unknown>>;
      const lastTwo = sections.splice(-2, 2);
      const merged = {
        title: lastTwo[1].title || lastTwo[0].title,
        points: [
          ...((lastTwo[0].points as unknown[]) || []),
          ...((lastTwo[1].points as unknown[]) || []),
        ].slice(0, 2),
      };
      sections.push(merged);
      onePager.sections = sections;
    }

    // Enforce point limits
    if (Array.isArray(onePager.sections)) {
      for (const section of onePager.sections as Array<Record<string, unknown>>) {
        if (Array.isArray(section.points) && section.points.length > 2) {
          section.points = (section.points as unknown[]).slice(0, 2);
        }
      }
    }

    const structureCheck = validateOnePagerOutput(onePager);
    if (!structureCheck.valid) {
      return errorResponse("AI generated invalid output: " + structureCheck.error, 500, structureCheck.error);
    }

    const allInputText = [scenario, targetAudience].filter(Boolean).join(" ");
    const flaggedNumbers = detectHallucinatedNumbers(allInputText, onePager);

    // Strip bold from flagged numbers
    if (flaggedNumbers.length > 0) {
      stripBoldFromFlaggedNumbers(onePager, flaggedNumbers);
    }

    (onePager as any).generated_at = new Date().toISOString();
    (onePager as any).format = "one-pager";

    console.log("Generated demo one-pager for IP:", clientIP);

    return jsonResponse({
      onePager,
      ...(flaggedNumbers.length > 0 ? { flaggedNumbers, trust_warning: "Some details in this output could not be verified against your input. Review before using." } : {}),
    });

  } catch (error) {
    return errorResponse("An error occurred while generating your one-pager", 500, error);
  }
});
