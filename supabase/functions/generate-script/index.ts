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

    const systemPrompt = `You are PitchVoid's script generator. You turn scattered thoughts into a linear conversation flow — a sequence of things to say out loud, in order, like cue cards.

VOICE: Write exactly how people talk. Short sentences. Contractions always: "we've", "it's", "don't", "here's". Start lines with action words. Every line should pass the test: would a real person actually say this in a meeting? If it sounds like a document, rewrite it.

OUTPUT SCHEMA (return ONLY this JSON, nothing else):
{
  "title": "max 8 words",
  "context_line": "[What] for [Who]",
  "total_duration": "estimated speaking time, e.g. '2-3 min'",
  "lines": [
    { "type": "opener", "text": "the first thing to say", "note": "brief delivery cue", "duration": "e.g. 10 sec" },
    { "type": "line", "text": "a talking point", "emphasis": "the key metric phrase within this line" },
    { "type": "pause", "note": "what to do during the pause" },
    { "type": "transition", "text": "bridge sentence to next topic" },
    { "type": "line", "text": "another talking point", "emphasis": "key metric" },
    { "type": "closer", "text": "the last thing to say", "note": "delivery cue", "duration": "e.g. 10 sec" }
  ]
}

LINE TYPES:
- "opener": The first thing the user says. Must be surprising, bold, or direct. NEVER a greeting, thank you, or self-introduction. Start with substance. Exactly 1 per script.
- "line": A regular talking point. One thing to say. 1-2 spoken sentences max. The "emphasis" field contains ONLY the number/metric within this line (e.g. "15%", "$180K"). If no number exists in the line, set emphasis to null.
- "pause": A breathing moment. No spoken text. The "note" is a brief cue like "Let that land" or "Check the room". Use 1-2 per script.
- "transition": A bridge sentence between topics. Conversational, not formal. Like "And here's the thing—" or "Which is exactly why—". Use 1-2 per script.
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
- Transitions are natural bridges: "And that connects to—", "Which is why—", "So here's what I'd do—"
- NEVER write: "Moving on to...", "Next I'd like to discuss...", "Let me now turn to..."

DO NOT:
- Group lines into sections with headers
- Write stage directions like "Make eye contact" or "Smile"
- Create "Key Phrases to Emphasize" chips
- Use pagination or Previous/Next slides
- Use formal presentation language
- Invent numbers or details not in the user's input
- Use: "leverage", "bridge the gap", "digital infrastructure", "strategic partnership", "long-term growth", "in today's fast-paced world"
- Add any text outside the JSON

EMPHASIS RULE:
- The "emphasis" field on each line should contain ONLY the number/metric phrase from that line, e.g. "15%", "$180K", "4 months"
- Include the unit with the number: "15%", "$180K", "4 months", "6-month", "2-week"
- If a line has no number or metric, set emphasis to null
- Do NOT put general phrases in emphasis

USER CONTEXT:
- Preferred tone: ${writing_preferences.tone || "clear, confident, and human"}
- Industry: ${writing_preferences.industry || "not specified"}

FEW-SHOT EXAMPLES:

Input: "meeting with CEO of mid-size retail company tomorrow, their stores are losing foot traffic, revenue dropped 15% year over year, no mobile app no loyalty program, their competitors all have online ordering now, my firm helped a restaurant chain with similar issues last year and they saw 35% increase in repeat customers within 4 months, I want to propose a 6-month engagement at $180K, starting with a 2-week diagnostic"
Output: {"title":"Retail Digital Pitch","context_line":"Digital transformation proposal for retail CEO","total_duration":"2-3 min","lines":[{"type":"opener","text":"You're down 15% this year — and every month without a digital strategy, that number gets harder to reverse.","note":"Lead with their pain. Not aggressive, just honest.","duration":"10 sec"},{"type":"line","text":"Your customers are going to competitors who are easier to find online. No app, no loyalty program — there's nothing pulling them back.","emphasis":"15%"},{"type":"line","text":"Everyone in your space has moved to online ordering. Right now you're the one they're leaving behind.","emphasis":null},{"type":"pause","note":"Let the urgency land."},{"type":"transition","text":"But here's the good news — we've solved this exact problem before."},{"type":"line","text":"We did this for a restaurant chain last year. They saw a 35% increase in repeat customers within 4 months.","emphasis":"35%"},{"type":"line","text":"Same playbook — digital presence, mobile ordering, loyalty program. It works.","emphasis":"4 months"},{"type":"transition","text":"So here's what I'd propose—"},{"type":"line","text":"A 6-month engagement at $180K. We start with a 2-week diagnostic to find the biggest revenue leaks.","emphasis":"$180K"},{"type":"line","text":"By month three, you'll have measurable results. Not a plan — actual numbers moving.","emphasis":"2-week"},{"type":"closer","text":"Can I send over a scope document this week so you can see what the first 30 days look like?","note":"Low pressure. Easy yes.","duration":"10 sec"}]}

Input: "interview for design lead at tiffany, i know adobe well, good at print production, can handle pressure and tight deadlines, want to walk them through my portfolio"
Output: {"title":"Tiffany Design Interview","context_line":"Design lead interview with Tiffany & Co.","total_duration":"2-3 min","lines":[{"type":"opener","text":"The hardest part of luxury design isn't making something beautiful — it's making Tiffany Blue look exactly right on every surface, every time.","note":"Shows you understand their world immediately.","duration":"10 sec"},{"type":"line","text":"I've spent years in Adobe building production-ready files. Clean layers, non-destructive editing — the kind of handoff that makes your team faster.","emphasis":null},{"type":"line","text":"On print, I'm obsessive about pre-flight. Ink density, bleed, spot-color accuracy. PMS 1837 has to be PMS 1837.","emphasis":null},{"type":"pause","note":"Let the craft speak for itself."},{"type":"transition","text":"That's the technical side. But here's what actually gets tested—"},{"type":"line","text":"I catch bottlenecks early. In wireframing, not in production — that's where tight deadlines get saved.","emphasis":null},{"type":"line","text":"I've been in rooms where five stakeholders want five different things. My job is to find the one direction that respects the brand.","emphasis":null},{"type":"closer","text":"I've got three projects that map directly to what your team is doing. Where would you like me to start?","note":"Hands control to them. Easy next step.","duration":"10 sec"}]}

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

    await incrementPitchCount(user.id);

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
