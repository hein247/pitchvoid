import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { authenticateRequest, checkPitchLimit, checkFormatAccess, incrementPitchCount } from "../_shared/auth.ts";
import { validateGenerateOnePagerInput, sanitizeForPrompt } from "../_shared/validation.ts";
import { corsHeaders, jsonResponse, errorResponse, handleCors } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { callAIWithRetry, validateOnePagerOutput, detectHallucinatedNumbers } from "../_shared/aiHelpers.ts";

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

    console.log("Generating one-pager for user:", user.id);

    const sanitizedScenario = sanitizeForPrompt(scenario);
    const sanitizedAudience = targetAudience ? sanitizeForPrompt(targetAudience) : "";
    const sanitizedContext = documentContext ? sanitizeForPrompt(documentContext) : "";
    const sanitizedStyle = visualStyle ? sanitizeForPrompt(visualStyle) : "";

    const imageContext = imageDescriptions && imageDescriptions.length > 0
      ? `\n\n**Uploaded Visual Assets (${imageDescriptions.length} images):**\n${imageDescriptions.map((desc: string, i: number) => `- Image ${i + 1}: ${sanitizeForPrompt(desc)}`).join('\n')}`
      : '';

    const systemPrompt = `You are PitchVoid's one-pager generator. You turn scattered thoughts into structured talking points that a busy person can glance at, copy, or send.

VOICE: Write like a smart friend who just organized someone's notes. No corporate filler. No jargon unless the user used it. Every sentence must contain at least one specific detail from the user's input.

OUTPUT SCHEMA (return ONLY this JSON, nothing else):
{
  "title": "short label, max 8 words",
  "context_line": "[What] for [Who] — one sentence",
  "sections": [
    {
      "title": "2-5 word label",
      "points": ["each point is 1-2 sentences with one **bold key phrase**"]
    }
  ]
}

STRUCTURE RULES:
- 2-4 sections. 1-4 points per section.
- Last section is ALWAYS the next step or ask.
- Each point is self-contained — readable without the others.
- Max 2 sentences per point.
- Front-load the key detail in the first 5 words.
- Every fact needs a "so what": [WHAT happened] — [WHY it matters].
- Bold the single most important phrase in each point using **markdown bold**.
- Never repeat the same fact across points, even rephrased.

STRUCTURE VARIETY (choose based on scenario):
- Persuasion (pitch, budget ask): Problem → Solution → Evidence → Ask
- Updates (review, status): Results → Insights → Next Steps
- Introductions (interview, new client): Capability → Proof → Fit → Next Step
- Proposals (project, rebrand): Opportunity → Approach → Cost → Ask

AUDIENCE ADAPTATION:
- Manager/boss: direct, results-focused, brief
- Executive/board: strategic, numbers-driven, confident
- Client: benefit-focused, approachable
- Interviewer: capability + specific examples
- Peer: collaborative, casual, practical

DO NOT:
- Invent statistics, numbers, or names the user did not provide
- Use placeholder brackets like [Company Name]
- Add greetings, sign-offs, or pleasantries
- Generate more than 4 sections or 4 points per section
- Use these phrases: "in today's fast-paced world", "leverage", "synergy", "passionate about", "excited to"
- Include any text outside the JSON

USER CONTEXT:
- Preferred tone: ${writing_preferences.tone || "clear, confident, and human"}
- Industry: ${writing_preferences.industry || "not specified"}
- This user typically prefers ${writing_preferences.avg_points || 3} points per section
- Avoid: ${writing_preferences.avoid_phrases || "corporate filler"}

FEW-SHOT EXAMPLES:

Input: "interview at tiffany for design role, i know adobe well, good at print production, can handle pressure and tight deadlines, want to discuss portfolio"
Output: {"title":"Tiffany Design Interview","context_line":"Design capability overview for Tiffany & Co. hiring manager","sections":[{"title":"Technical Mastery","points":["**Expert-level Adobe Creative Suite** — non-destructive editing, clean layer hierarchy for seamless team collaboration.","**Rigorous pre-flight for print**: ink density control, bleed management, spot-color accuracy (PMS 1837).","Digital optimization — **high-fidelity rendering with fast load times** for premium web experiences."]},{"title":"Working Under Pressure","points":["Navigate tight production windows by **catching bottlenecks early** in wireframing and prototyping.","Reconciled **conflicting stakeholder feedback** into a single cohesive visual direction on high-stakes projects."]},{"title":"Next Step","points":["Walk through the portfolio — **show how this translates** to the team's current needs."]}}

Input: "need to present Q3 to board, revenue up 40%, got 12 new enterprise deals, expanding to APAC next quarter, need them to approve budget for 20 new hires"
Output: {"title":"Q3 Board Review","context_line":"Quarterly performance and hiring request for the board of directors","sections":[{"title":"Q3 Performance","points":["Revenue grew **40% quarter-over-quarter**, driven by 12 new enterprise deals.","Net retention hit **135%** — existing customers expanding faster than new ones signing."]},{"title":"APAC Expansion","points":["Market entry planned for Q4 with **projected 60% growth** in the region.","Initial partnerships signed with **3 regional distributors**."]},{"title":"The Ask","points":["Approve budget for **20 new hires** across engineering and sales to support expansion.","Without headcount, APAC launch slips to Q2 — **$4M projected revenue at risk**."]}}

Input: "pitching a rebrand to a bakery owner, they have no online presence, their current logo looks dated, i can do logo + website + social templates, budget friendly"
Output: {"title":"Bakery Rebrand Pitch","context_line":"Brand refresh proposal for local bakery owner","sections":[{"title":"The Problem","points":["Current branding looks **dated compared to competitors** — customers choosing newer spots with stronger visual identity.","**Zero online presence** means missing foot traffic from people searching 'bakery near me'."]},{"title":"What I'd Do","points":["**Modern logo redesign** that keeps the warmth but feels fresh and Instagram-ready.","Simple **one-page website** with menu, hours, and online ordering link.","**10 social media templates** — ready-to-use designs for Instagram and Facebook."]},{"title":"Next Step","points":["Start with the logo — **2-week turnaround, budget-friendly flat fee**. Website and social follow from there."]}}`;

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

    // Enforce section limits: max 4 sections
    if (Array.isArray(onePager.sections) && onePager.sections.length > 4) {
      onePager.sections = (onePager.sections as unknown[]).slice(0, 4);
    }

    // Enforce point limits: max 4 points per section
    if (Array.isArray(onePager.sections)) {
      for (const section of onePager.sections as Array<Record<string, unknown>>) {
        if (Array.isArray(section.points) && section.points.length > 4) {
          section.points = (section.points as unknown[]).slice(0, 4);
        }
      }
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

    // Save to output_versions table
    const projectId = body.projectId;
    if (projectId) {
      try {
        // Get current max version number for this project+format
        const { data: existingVersions } = await supabaseClient
          .from("output_versions")
          .select("version_number")
          .eq("project_id", projectId)
          .eq("format", "one-pager")
          .order("version_number", { ascending: false })
          .limit(1);

        const nextVersion = existingVersions && existingVersions.length > 0
          ? existingVersions[0].version_number + 1
          : 1;

        await supabaseClient.from("output_versions").insert({
          project_id: projectId,
          user_id: user.id,
          version_number: nextVersion,
          output_json: onePager,
          trigger: "original",
          format: "one-pager",
        });
      } catch (versionError) {
        console.error("Failed to save version:", versionError);
        // Don't fail the request if version saving fails
      }
    }

    console.log("Generated one-pager for user:", user.id);

    return jsonResponse({
      onePager,
      ...(flaggedNumbers.length > 0 ? { flaggedNumbers } : {}),
    });

  } catch (error) {
    return errorResponse("An error occurred while generating your one-pager", 500, error);
  }
});
