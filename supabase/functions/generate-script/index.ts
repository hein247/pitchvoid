import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { authenticateRequest, checkPitchLimit, checkFormatAccess, incrementPitchCount } from "../_shared/auth.ts";
import { validateGenerateScriptInput, sanitizeForPrompt } from "../_shared/validation.ts";
import { corsHeaders, jsonResponse, errorResponse, handleCors } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { callAIWithRetry, detectHallucinatedNumbers } from "../_shared/aiHelpers.ts";

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

    const limitCheck = checkPitchLimit(profile, user.email);
    if (!limitCheck.allowed) {
      return jsonResponse({ error: limitCheck.error, code: limitCheck.errorCode || 'LIMIT_REACHED' }, limitCheck.statusCode || 402);
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

    console.log("Generating script for user:", user.id);

    const sanitizedScenario = sanitizeForPrompt(scenario);
    const sanitizedAudience = targetAudience ? sanitizeForPrompt(targetAudience) : "";
    const sanitizedContext = documentContext ? sanitizeForPrompt(documentContext) : "";
    const sanitizedTone = tone ? sanitizeForPrompt(tone) : "";

    const docContext = sanitizedContext ? `\n\n**Document Context:**\n${sanitizedContext}` : '';
    const imageContext = imageDescriptions && imageDescriptions.length > 0
      ? `\n\n**Visual Assets (${imageDescriptions.length} images):**\n${imageDescriptions.map((desc: string, i: number) => `- Image ${i + 1}: ${sanitizeForPrompt(desc)}`).join('\n')}`
      : '';

    const durationMap: Record<string, string> = {
      'quick': '30-60 seconds',
      'standard': '2-3 minutes',
      'detailed': '5-7 minutes'
    };
    const totalDuration = durationMap[length] || durationMap['standard'];

    const systemPrompt = `You are PitchVoid's script engine. You turn messy thoughts into a linear conversation flow — a sequence of things to say out loud, in order, like cue cards.

STEP 1 — DETECT CONTEXT from the parsed input (audience, goal, content). Pick the BEST match:
- Business Pitch (investors, clients, partners)
- Meeting Prep (team, manager, stakeholders, board)
- Job Interview (hiring manager, recruiter, panel)
- Networking (new contacts, events, intros)
- Sales (prospects, demos, deals, follow-ups)
- Difficult Conversation (conflict, negotiation, boundaries, landlord, raise)
- Creative Performance (comedy, speeches, toasts, keynotes, TED)
- Personal / Life (therapy, decisions, self-reflection, relationships)
- Education / Academic (thesis, research, class presentation)
- General (unclear context)

If the audience is professional/business but the content is creative (e.g. pitching a comedy special to Netflix), prioritize the AUDIENCE context over the content.

STEP 2 — ADAPT LANGUAGE to detected context:

PAUSE NOTES by context:
- Business/Sales/Meeting/General: breathing/emphasis notes like "Let that land" or "Check the room"
- Comedy/Creative Performance: "[wait for laugh]", "[hold for reaction]", "[let it breathe]"
- Difficult Conversation: "[let them respond]", "[wait for their reaction]", "[give them space]"
- Speech/Toast: "[pause for effect]", "[let the moment land]", "[look at them]"
- Personal/Life: "[take a breath]", "[check in with yourself]"
- Education/Academic: "[let the audience absorb]", "[pause for questions]"

TRANSITION STYLE by context:
- Business: "And here's the thing—", "Which is exactly why—"
- Comedy: "[beat]", "And the worst part is—", "But here's what kills me—"
- Difficult Conversation: "And what I need from this is—", "The reason I'm bringing this up—"
- Speech/Toast: "And that's the thing about [person]—", "Which brings me to—"
- Personal/Life: "And the part I keep coming back to—", "What I haven't said yet—"

VOICE: Write exactly how people talk. Short sentences. Contractions always: "we've", "it's", "don't", "here's". Start lines with action words.

HARD RULES:
1. No first-person restrictions ONLY in Personal/Life and Creative contexts. All other contexts: third-person professional voice.
2. BANNED phrases in ALL contexts: "leverage", "synergy", "seamless", "drive innovation", "operational excellence", "thought leader", "paradigm shift", "move the needle", "circle back", "low-hanging fruit", "digital infrastructure", "strategic partnership", "in today's fast-paced world".
3. Every line must reference something the user actually said. No filler.
4. Do NOT invent facts, statistics, or details.
5. Do NOT calculate new percentages from user's numbers.
6. Match the user's tone. NEVER moralize or add disclaimers about the user's topic.
7. Plain language. A smart 16-year-old should understand every line.

OUTPUT SCHEMA (return ONLY this JSON, nothing else):
{
  "title": "max 8 words",
  "context_line": "[What] for [Who]",
  "total_duration": "estimated speaking time, e.g. '2-3 min'",
  "lines": [
    { "type": "opener", "text": "the first thing to say", "note": "brief delivery cue", "duration": "e.g. 10 sec" },
    { "type": "line", "text": "a talking point", "emphasis": "the key metric phrase within this line" },
    { "type": "pause", "note": "context-appropriate pause cue" },
    { "type": "transition", "text": "bridge sentence to next topic" },
    { "type": "line", "text": "another talking point", "emphasis": "key metric" },
    { "type": "closer", "text": "the last thing to say", "note": "delivery cue", "duration": "e.g. 10 sec" }
  ]
}

LINE TYPES:
- "opener": The first thing the user says. Must be surprising, bold, or direct. NEVER a greeting, thank you, or self-introduction. Start with substance. Exactly 1 per script.
- "line": A regular talking point. One thing to say. 1-2 spoken sentences max. The "emphasis" field contains ONLY the number/metric within this line (e.g. "15%", "$180K"). If no number exists in the line, set emphasis to null.
- "pause": A breathing moment. No spoken text. The "note" uses context-appropriate cues (see PAUSE NOTES above). Use 1-2 per script.
- "transition": A bridge sentence between topics. Uses context-appropriate style (see TRANSITION STYLE above). Use 1-2 per script.
- "closer": The last thing the user says. Must be an action or a question — never just "thank you." Exactly 1 per script.

STRUCTURE RULES:
- Total: 1 opener + 4-8 lines + 1-2 pauses + 1-2 transitions + 1 closer
- This is a FLAT sequence. No sections. No topic headers. No grouping.
- Order matters — the user follows this top to bottom
- Estimate total_duration at ~130 words per minute
- Each line's emphasis field contains ONLY numbers/metrics, nothing else

WRITING RULES:
- Contractions always. "We've done this" not "We have done this"
- Sentences: 8-15 words ideal. Never exceed 20 words in a single sentence.
- Start lines with action words: "I've...", "We did...", "Here's...", "You're..."
- NEVER write: "Moving on to...", "Next I'd like to discuss...", "Let me now turn to..."

BOLD RULE (MANDATORY):
- Bold ALL numbers and metrics in the output text. If a line says $62 vs $150, both numbers must be bolded: **$62** vs **$150**.
- Include the unit with the number: **15%**, **$180K**, **4 months**.
- Never bold just the number without its unit.

EMPHASIS RULE:
- The "emphasis" field should contain ONLY the number/metric phrase, e.g. "15%", "$180K", "4 months"
- Include the unit: "15%", "$180K", "4 months", "6-month", "2-week"
- If a line has no number or metric, set emphasis to null
- Do NOT put general phrases in emphasis

DO NOT:
- Group lines into sections with headers
- Write stage directions like "Make eye contact" or "Smile"
- Create "Key Phrases to Emphasize" chips
- Use pagination or Previous/Next slides
- Use formal presentation language
- Add any text outside the JSON

USER CONTEXT:
- Preferred tone: ${writing_preferences.tone || "clear, confident, and human"}
- Industry: ${writing_preferences.industry || "not specified"}

TONE: ${sanitizedTone || 'confident and conversational'}`;

    const userPrompt = `Write a speaking script:

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

    // Validate flat lines structure
    if (!Array.isArray(script.lines)) {
      return errorResponse("AI generated invalid output: missing lines array", 500, "Missing lines array");
    }

    const lines = script.lines as Array<Record<string, unknown>>;
    const validTypes = new Set(["opener", "line", "pause", "transition", "closer"]);

    // Filter to valid types only
    script.lines = lines.filter(l => validTypes.has(l.type as string));
    const filteredLines = script.lines as Array<Record<string, unknown>>;

    // Verify exactly 1 opener and 1 closer
    const openers = filteredLines.filter(l => l.type === "opener");
    const closers = filteredLines.filter(l => l.type === "closer");
    if (openers.length !== 1 || closers.length !== 1) {
      return errorResponse("AI generated invalid output: must have exactly 1 opener and 1 closer", 500, `openers: ${openers.length}, closers: ${closers.length}`);
    }

    // Check regular lines count (4-8), trim if over 8
    const regularLines = filteredLines.filter(l => l.type === "line");
    if (regularLines.length > 8) {
      // Keep first 8 regular lines, preserve openers/closers/pauses/transitions
      let lineCount = 0;
      script.lines = filteredLines.filter(l => {
        if (l.type !== "line") return true;
        lineCount++;
        return lineCount <= 8;
      });
    }

    // Detect hallucinated numbers
    const allInputText = [scenario, targetAudience, documentContext].filter(Boolean).join(" ");
    const flaggedNumbers = detectHallucinatedNumbers(allInputText, script);

    // Add metadata
    (script as any).generated_at = new Date().toISOString();
    (script as any).format = "script";
    (script as any).version = 1;

    await incrementPitchCount(user.id, user.email);

    // Save to output_versions table
    const projectId = body.projectId;
    if (projectId) {
      try {
        const { data: existingVersions } = await supabaseClient
          .from("output_versions")
          .select("version_number")
          .eq("project_id", projectId)
          .eq("format", "script")
          .order("version_number", { ascending: false })
          .limit(1);

        const nextVersion = existingVersions && existingVersions.length > 0
          ? existingVersions[0].version_number + 1
          : 1;

        await supabaseClient.from("output_versions").insert({
          project_id: projectId,
          user_id: user.id,
          version_number: nextVersion,
          output_json: script,
          trigger: "original",
          format: "script",
        });
      } catch (versionError) {
        console.error("Failed to save version:", versionError);
      }
    }

    console.log("Generated script for user:", user.id);

    return jsonResponse({
      script,
      ...(flaggedNumbers.length > 0 ? { flaggedNumbers } : {}),
    });

  } catch (error) {
    return errorResponse("An error occurred while generating your script", 500, error);
  }
});
