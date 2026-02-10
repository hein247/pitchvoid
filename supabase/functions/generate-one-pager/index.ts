import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { authenticateRequest, checkPitchLimit, checkFormatAccess, incrementPitchCount } from "../_shared/auth.ts";
import { validateGenerateOnePagerInput, sanitizeForPrompt } from "../_shared/validation.ts";
import { corsHeaders, jsonResponse, errorResponse, handleCors } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";

interface OnePagerSection {
  title: string;
  points: string[];
}

interface OnePagerData {
  title: string;
  context_line: string;
  sections: OnePagerSection[];
  generated_at?: string;
  format?: string;
  version?: number;
}

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

    const systemPrompt = `You are a smart friend who just organized someone's scattered notes into clear talking points. You create clarity cheat sheets — structured points someone glances at before a meeting, interview, call, or email.

VOICE & TONE:
- Write like a smart friend, not a consultant. No corporate filler.
- No "In today's fast-paced world", "leverage synergies", "cutting-edge solutions", or templated speak.
- Every sentence must contain at least one specific detail from the user's input.
- If the user said something vague, make it concrete. "Good growth" → "40% month-over-month growth."
- Use the user's own language. If they said "boss", don't upgrade to "senior leadership."

STRUCTURE RULES:
- 2-4 sections, each with a clear thematic label (2-5 words).
- 1-4 points per section. Fewer is better. If you can say it in 2, don't use 4.
- Each point: 1-2 sentences max, self-contained.
- Bold the key phrase in each point using markdown **bold** — the one thing worth highlighting.
- Last section should always be the next step or ask. Label it "Next Step", "The Ask", or "Action Item" — whatever fits.

WHAT NOT TO GENERATE:
- No introduction or preamble paragraph.
- No conclusion or summary paragraph.
- No contact information.
- No "Dear [Name]" or letter formatting.
- No bullet symbols in text.
- No section numbering.

FEW-SHOT EXAMPLES:

Example 1 — User input: "interview at tiffany for design role, i know adobe well, good at print production, can handle pressure and tight deadlines, want to discuss portfolio"
{
  "title": "Tiffany Design Interview",
  "context_line": "Design capability overview for Tiffany & Co. hiring manager",
  "sections": [
    {
      "title": "Technical Mastery",
      "points": [
        "**Expert-level Adobe Creative Suite** — non-destructive editing, clean layer hierarchy for team collaboration.",
        "**Rigorous pre-flight for print**: ink density control, bleed management, spot-color accuracy (PMS 1837).",
        "Digital optimization — **high-fidelity rendering with fast load times** for premium web experiences."
      ]
    },
    {
      "title": "Working Under Pressure",
      "points": [
        "Navigate tight production windows by **catching bottlenecks early** in wireframing and prototyping.",
        "Reconciled **conflicting stakeholder feedback** into a single cohesive visual direction on high-stakes projects."
      ]
    },
    {
      "title": "Next Step",
      "points": [
        "Walk through the portfolio — **show how this translates** to the team's current needs."
      ]
    }
  ]
}

Example 2 — User input: "need to present Q3 to board, revenue up 40%, got 12 new enterprise deals, expanding to APAC next quarter, need them to approve budget for 20 new hires"
{
  "title": "Q3 Board Review",
  "context_line": "Quarterly performance and hiring request for the board of directors",
  "sections": [
    {
      "title": "Q3 Performance",
      "points": [
        "Revenue grew **40% quarter-over-quarter**, driven by 12 new enterprise deals.",
        "Net retention hit **135%** — existing customers are expanding faster than new ones are signing."
      ]
    },
    {
      "title": "APAC Expansion",
      "points": [
        "Market entry planned for Q4 with **projected 60% growth** in the region.",
        "Initial partnerships already signed with **3 regional distributors**."
      ]
    },
    {
      "title": "The Ask",
      "points": [
        "Approve budget for **20 new hires** across engineering and sales to support expansion timeline.",
        "Without headcount, APAC launch slips to Q2 — **$4M projected revenue at risk**."
      ]
    }
  ]
}

Example 3 — User input: "pitching a rebrand to a bakery owner, they have no online presence, their current logo looks dated, i can do logo + website + social templates, budget friendly"
{
  "title": "Bakery Rebrand Pitch",
  "context_line": "Brand refresh proposal for local bakery owner",
  "sections": [
    {
      "title": "The Problem",
      "points": [
        "Current branding looks **dated compared to competitors** — customers are choosing newer spots with stronger visual identity.",
        "**Zero online presence** means missing foot traffic from people searching 'bakery near me'."
      ]
    },
    {
      "title": "What I'd Do",
      "points": [
        "**Modern logo redesign** that keeps the warmth of the original but feels fresh and Instagram-ready.",
        "Simple **one-page website** with menu, hours, and online ordering link.",
        "**Social media templates** — 10 ready-to-use designs for Instagram and Facebook."
      ]
    },
    {
      "title": "Next Step",
      "points": [
        "Start with the logo — **2-week turnaround, budget-friendly flat fee**. Website and social follow from there."
      ]
    }
  ]
}

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
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return jsonResponse({ error: "Rate limit exceeded. Please try again in a moment." }, 429);
      }
      if (response.status === 402) {
        return jsonResponse({ error: "AI credits exhausted. Please add credits to continue." }, 402);
      }
      return errorResponse("Failed to generate one-pager", 500, `AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      return errorResponse("Failed to generate one-pager", 500, "No content received from AI");
    }

    console.log("AI response received for user:", user.id);

    let onePager: OnePagerData;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        onePager = JSON.parse(jsonMatch[0]);
      } else {
        onePager = JSON.parse(aiContent);
      }
    } catch (parseError) {
      return errorResponse("Failed to generate one-pager", 500, parseError);
    }

    // Validate structure
    if (!onePager.title || !onePager.context_line || !Array.isArray(onePager.sections)) {
      return errorResponse("Failed to generate one-pager", 500, "Invalid one-pager structure");
    }

    // Add metadata
    onePager.generated_at = new Date().toISOString();
    onePager.format = "one-pager";
    onePager.version = 1;

    await incrementPitchCount(user.id);
    console.log("Generated one-pager for user:", user.id);

    return jsonResponse({ onePager });

  } catch (error) {
    return errorResponse("An error occurred while generating your one-pager", 500, error);
  }
});
