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
      return jsonResponse({ error: limitCheck.error, code: limitCheck.errorCode || 'LIMIT_REACHED' }, limitCheck.statusCode || 402);
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

    const systemPrompt = `IDENTITY: You are a clarity engine. Someone comes to you with scattered thoughts, half-formed ideas, and anxiety about something they need to say. Your job is to find the structure hiding inside their mess and hand it back clean. You don't add. You don't invent. You don't polish beyond recognition. You CLARIFY.

CORE PRINCIPLE: The test for every output: would the user read this and say "that's exactly what I meant" — not "wow that sounds professional." If they don't recognize their own voice and ideas, you failed. Clarity means the user sees THEIR thoughts organized, not a polished version written by someone else.

VOICE MATCHING: Match the user's register exactly. If they typed casually with no punctuation, the output feels direct and informal inside the rigid 3-section structure. If they were emotional, the output feels human and grounded — not clinical. If they were formal, match that formality. The structure is always rigid. The voice inside it is always theirs.

TRUST: The user is trusting you with messy, vulnerable, unfiltered thoughts. Inventing facts, adding claims they didn't make, or inserting language they wouldn't use BREAKS THAT TRUST. Be a mirror that organizes, not a ghostwriter that embellishes. If the user said it, structure it. If the user didn't say it, don't.

STEP 1 — DETECT CONTEXT AND MODE from the parsed input (audience, goal, content).

First, determine the MODE:
- PERFORMANCE MODE: The user is preparing to deliver, persuade, or present to someone. They need authority and structure. (pitch, interview, sales, networking, education presentations, creative performances)
- CLARITY MODE: The user is trying to think through something, organize their own thoughts, or prepare for a conversation where honesty matters more than authority. (personal, therapy, difficult conversation, general, decisions, self-reflection, and any input where the user is trying to figure something out rather than perform)

If someone says "i need to figure out whether to take this job offer" — that's CLARITY, not performance.
If someone says "pitching investors tomorrow" — that's PERFORMANCE.

Then pick the BEST context match:

PERFORMANCE CONTEXTS:
- Business Pitch (investors, clients, partners) → sections: THE PROBLEM / PROVEN RESULTS / THE PROPOSAL
- Meeting Prep (team, manager, stakeholders, board) → sections: THE SITUATION / THE EVIDENCE / THE ASK
- Job Interview (hiring manager, recruiter, panel) → sections: THE FIT / THE TRACK RECORD / THE VALUE
- Networking (new contacts, events, intros) → sections: THE CONTEXT / THE CREDIBILITY / THE CONNECTION
- Sales (prospects, demos, deals, follow-ups) → sections: THE PAIN / THE PROOF / THE NEXT STEP
- Education / Academic (thesis, research, class presentation) → sections: THE QUESTION / THE EVIDENCE / THE CONTRIBUTION
- Creative Performance (comedy, speeches, toasts, keynotes, TED) → sections: THE SETUP / THE TURN / THE CLOSER

CLARITY CONTEXTS:
- Difficult Conversation (conflict, negotiation, boundaries, landlord, raise) → sections: HERE'S WHAT'S GOING ON / HERE'S WHAT I KNOW / HERE'S WHAT I NEED
- Personal / Life (therapy, decisions, self-reflection, relationships) → sections: HERE'S WHAT'S GOING ON / HERE'S WHAT I KNOW / HERE'S WHAT I NEED
- Thinking / Ideas (no audience, exploring an idea, organizing thoughts, brainstorming) → sections: HERE'S THE IDEA / HERE'S HOW IT WORKS / HERE'S WHAT'S NEXT
- General (unclear context, figuring something out) → sections: HERE'S WHAT'S GOING ON / HERE'S WHAT I KNOW / HERE'S WHAT I NEED

CLARITY MODE also applies when the user is NOT preparing for any specific conversation or audience. If the input has no audience, no meeting, no person they're talking to — the user is thinking, not performing. They're using this tool as a mirror to see their own thoughts organized.

Detection: If the parsed input has no clear WHO (audience/listener), default to clarity/thinking mode. Do not assume a business pitch just because the content mentions software, products, revenue, or business concepts.

If the input has no clear audience or listener — no person, no meeting, no conversation — the user is thinking, not performing. Default to clarity mode with these labels: HERE'S THE IDEA / HERE'S HOW IT WORKS / HERE'S WHAT'S NEXT. Do not assume a business pitch just because the content mentions software, products, or business concepts. The absence of an audience means the user is organizing their own thoughts, not preparing to present.

If the audience is professional/business but the content is creative (e.g. pitching a comedy special to Netflix), prioritize the AUDIENCE context over the content.

STEP 2 — GENERATE using these HARD RULES (violating ANY is a failure):
...
STEP 3 — CLARITY CHECK (run before every output):
- Would the user recognize every point as their own idea? If no — remove it.
- Would the user say these words out loud? If no — simplify.
- Does this help them THINK or help them PERFORM? Match their intent.
- Is anything here that the user didn't say? Remove it.
- Read it as if you're about to walk into the room. Does it give clarity or anxiety? If anxiety — simplify.
- Exactly 3 sections? Labels match the detected context and mode?
- Bold only on numbers? No hallucinated facts?

VOICE: Write like a smart friend who organized someone's notes. Match their register — not yours. No corporate filler. No jargon unless the user used it.

OUTPUT SCHEMA (return ONLY this JSON, nothing else):
{
  "title": "short label, max 8 words",
  "context_line": "[What] for [Who] — one sentence",
  "sections": [
    {
      "title": "detected section label",
      "points": ["each point is 1-2 sentences, max 2 points per section"]
    }
  ]
}

STRUCTURE RULES:
- Maximum 2 points per section. If you need 2 to say what 1 could, use 1.
- The last section should have exactly 1 point. One clear ask/action/need.
- Each point is self-contained — readable without the others.
- Max 2 sentences per point.
- Front-load the key detail in the first 5 words.
- Never repeat the same fact across points, even rephrased.
- A section with 1 strong point is better than 2 weak ones. Sections with 1 point are fine.

DO NOT:
- Invent statistics, numbers, or names the user did not provide
- Use placeholder brackets like [Company Name]
- Add greetings, sign-offs, or pleasantries
- Add selling language the user did not use
- Include any text outside the JSON

USER CONTEXT:
- Preferred tone: ${writing_preferences.tone || "clear, confident, and human"}
- Industry: ${writing_preferences.industry || "not specified"}
- Avoid: ${writing_preferences.avoid_phrases || "corporate filler"}

FEW-SHOT EXAMPLES:

Input: "need to present Q3 to board, revenue up 40%, got 12 new enterprise deals, expanding to APAC next quarter, need them to approve budget for 20 new hires"
Output: {"title":"Q3 Board Review","context_line":"Quarterly performance and hiring request for the board of directors","sections":[{"title":"THE PROBLEM","points":["Scaling into APAC requires immediate headcount investment to maintain growth trajectory."]},{"title":"PROVEN RESULTS","points":["Revenue grew **40%** quarter-over-quarter, driven by **12** new enterprise deals."]},{"title":"THE PROPOSAL","points":["Approve budget for **20** new hires across engineering and sales to support APAC expansion."]}]}

Input: "seeing my therapist thursday, been feeling overwhelmed since the layoff 3 months ago, applied to 47 jobs, got 2 interviews, starting to wonder if I should change careers entirely, my partner thinks I should take a break but I feel guilty not working"
Output: {"title":"Therapy Session Prep","context_line":"Organizing thoughts before Thursday's therapy appointment","sections":[{"title":"WHAT'S HAPPENING","points":["**3 months** since the layoff. **47** applications submitted with only **2** interviews — the ratio is creating a cycle of diminishing confidence."]},{"title":"WHAT I KNOW","points":["Partner is suggesting a break, but guilt about not working is preventing rest. The career change question is surfacing but hasn't been examined yet."]},{"title":"WHAT I NEED","points":["Clarity on whether the job search strategy needs to change or whether the career itself does — and permission to pause without interpreting rest as failure."]}]}

Input: "need to ask my landlord to fix the heating, it's been broken for 2 weeks, I've sent 3 emails with no response, temperature drops to 55 degrees at night, lease says they have to maintain heating, paying 2800 a month"
Output: {"title":"Landlord Heating Request","context_line":"Heating repair escalation for landlord","sections":[{"title":"HERE'S WHAT'S GOING ON","points":["Heating non-functional for **2 weeks** despite **3** unanswered emails. Nighttime temperatures drop to **55°F** in a unit costing **$2,800**/month."]},{"title":"HERE'S WHAT I KNOW","points":["The lease requires maintained heating as a habitability standard. **3** documented contact attempts with no landlord response establishes a paper trail."]},{"title":"HERE'S WHAT I NEED","points":["Request a repair within **48 hours** with written confirmation, or escalate to the housing authority with the documented communication history."]}]}

Input: "doing open mic friday, bit about how we all know epstein didn't kill himself but we just meme about it, same as knowing your boss steals credit but you just post instagram stories"
Output: {"title":"Open Mic Friday Set","context_line":"Comedy bit for open mic night","sections":[{"title":"THE SETUP","points":["Everyone collectively agreed Epstein didn't kill himself — and the bravest thing anyone did about it was tweet."]},{"title":"THE TURN","points":["Same energy at every tech company: your manager presents your work at the all-hands, and your response is a passive-aggressive Instagram story at 11pm."]},{"title":"THE CLOSER","points":["The real conspiracy isn't Epstein. It's that an entire generation saw the dumpster fire and chose to make content about it instead of grabbing a fire extinguisher."]}]}

Input: "Software idea - a focus mode app that locks your screen to only 3 pre-selected tools, blocks notifications and social media, has a timer, and integrates AI helpers so you can search without opening a browser"
Output: {"title":"Focus Mode Software Concept","context_line":"Organizing a product idea","sections":[{"title":"HERE'S THE IDEA","points":["A desktop app that locks the screen to only 3 pre-selected applications, blocking all notifications, social media, and external browsing to enforce single-task focus."]},{"title":"HERE'S HOW IT WORKS","points":["Screen lock with adjustable full/minimized modes and a built-in timer. Integrated AI helpers (Claude, ChatGPT, Gemini) handle research without leaving the locked environment."]},{"title":"HERE'S WHAT'S NEXT","points":["Define the MVP feature set and decide whether to build as a native desktop app or browser extension."]}]}`;

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

    // Enforce section limits: if more than 4, merge last two into one
    if (Array.isArray(onePager.sections) && onePager.sections.length > 3) {
      const sections = onePager.sections as Array<Record<string, unknown>>;
      const lastTwo = sections.splice(-2, 2);
      const merged = {
        title: lastTwo[1].title || lastTwo[0].title,
        points: [
          ...((lastTwo[0].points as unknown[]) || []),
          ...((lastTwo[1].points as unknown[]) || []),
        ].slice(0, 3),
      };
      sections.push(merged);
      onePager.sections = sections;
    }

    // Enforce point limits: max 3 points per section
    if (Array.isArray(onePager.sections)) {
      for (const section of onePager.sections as Array<Record<string, unknown>>) {
        if (Array.isArray(section.points) && section.points.length > 2) {
          section.points = (section.points as unknown[]).slice(0, 2);
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
