import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { authenticateRequest } from "../_shared/auth.ts";
import { validateRefineOutputInput, sanitizeForPrompt } from "../_shared/validation.ts";
import { corsHeaders, jsonResponse, errorResponse, handleCors } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { callAIWithRetry, validateOnePagerOutput, validateScriptOutput } from "../_shared/aiHelpers.ts";

/** Map chip labels to detailed refinement instructions */
const CHIP_INSTRUCTIONS: Record<string, string> = {
  shorter:
    "Rewrite all points to be 30% shorter. Cut filler words. Keep the specific details and bold metrics. A section can have fewer points — removing a weak point is better than shortening a strong one.",
  bolder:
    "Rewrite with more confident, direct language. Replace hedging words like might, could, possibly, somewhat with definitive statements. Keep the same structure and facts.",
  simpler:
    "Rewrite using simpler vocabulary. Replace any jargon or complex phrasing with plain language a high schooler would understand. Keep all the specific numbers and details.",
  casual:
    "Rewrite in a more casual, conversational tone. Use contractions. Shorter sentences. How would you say this to a friend over coffee? Keep all facts and numbers.",
  "more casual":
    "Rewrite in a more casual, conversational tone. Use contractions. Shorter sentences. How would you say this to a friend over coffee? Keep all facts and numbers.",
};

/** Count content items in a one-pager output */
function countOnePagerPoints(output: Record<string, unknown>): number {
  const sections = output.sections as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(sections)) return 0;
  return sections.reduce((sum, s) => {
    const points = s.points as unknown[];
    return sum + (Array.isArray(points) ? points.length : 0);
  }, 0);
}

/** Count content items in a script output */
function countScriptLines(output: Record<string, unknown>): number {
  const lines = output.lines as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(lines)) return 0;
  return lines.filter((l) => l.type === "line" || l.type === "opener" || l.type === "closer").length;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // 1. Authenticate
    const { result: authResult, error: authError } = await authenticateRequest(req);
    if (authError) {
      return new Response(authError.body, { status: authError.status, headers: corsHeaders });
    }
    const { user, profile } = authResult!;

    // 2. Parse & validate
    const body = await req.json();
    const validation = validateRefineOutputInput(body);
    if (!validation.valid) {
      return jsonResponse({ error: validation.error }, 400);
    }

    const {
      project_id,
      original_input,
      current_output,
      refine_instruction,
      format,
      user_edits,
    } = body as {
      project_id: string;
      original_input: string;
      current_output: Record<string, unknown>;
      refine_instruction: string;
      format: "one-pager" | "script";
      user_edits?: { title?: string; context_line?: string };
    };

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // 3. Verify project ownership
    const { data: project, error: projectError } = await supabaseClient
      .from("projects")
      .select("id")
      .eq("id", project_id)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return jsonResponse({ error: "Project not found or access denied" }, 404);
    }

    // 4. Rate limiting
    const plan = profile.plan || "free";
    const isPaid = plan === "pro" || plan === "teams";
    const rateConfig = isPaid ? RATE_LIMITS.refinement.paid : RATE_LIMITS.refinement.free;
    const rateLimitKey = `refine:${isPaid ? "paid" : "free"}:${user.id}`;
    const rateLimitResult = await checkRateLimit(rateLimitKey, rateConfig);

    if (!rateLimitResult.allowed) {
      const minutes = Math.ceil((rateLimitResult.retryAfterSeconds || 60) / 60);
      return jsonResponse(
        {
          error: `You've reached the refinement limit. Try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`,
          errorType: "rate_limit",
          retryAfter: rateLimitResult.retryAfterSeconds,
        },
        429
      );
    }

    // 5. Map instruction
    const instructionLower = refine_instruction.toLowerCase().trim();
    const mappedInstruction = CHIP_INSTRUCTIONS[instructionLower] || refine_instruction;

    // 6. Fetch writing preferences
    const { data: prefData } = await supabaseClient
      .from("profiles")
      .select("writing_preferences")
      .eq("id", user.id)
      .single();

    const writing_preferences = (prefData?.writing_preferences as Record<string, unknown>) || {};

    // 7. API key
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return errorResponse("Service configuration error", 500, "LOVABLE_API_KEY not configured");
    }

    // 8. Build prompt
    const sanitizedOriginal = sanitizeForPrompt(original_input);
    const currentOutputJson = JSON.stringify(current_output);

    let userEditsDirective = "";
    if (user_edits) {
      const parts: string[] = [];
      if (user_edits.title) parts.push(`the title to "${user_edits.title}"`);
      if (user_edits.context_line) parts.push(`the context_line to "${user_edits.context_line}"`);
      if (parts.length > 0) {
        userEditsDirective = `\n\nIMPORTANT: The user has manually set ${parts.join(" and ")}. Keep these exact values unchanged in your output.`;
      }
    }

    const prefTone = (writing_preferences.tone as string) || "clear, confident, and human";
    const prefIndustry = (writing_preferences.industry as string) || "not specified";

    let systemPrompt: string;

    if (format === "one-pager") {
      systemPrompt = `You are PitchVoid's refinement engine. You take an existing one-pager and modify it based on the user's instruction.

CURRENT OUTPUT (JSON):
${currentOutputJson}

ORIGINAL USER INPUT:
${sanitizedOriginal}

REFINEMENT INSTRUCTION:
${mappedInstruction}${userEditsDirective}

OUTPUT SCHEMA (return ONLY this JSON, nothing else):
{
  "title": "short label, max 8 words",
  "context_line": "[What] for [Who] — one sentence",
  "sections": [
    {
      "title": "2-5 word label",
      "points": ["each point is 1-2 sentences"]
    }
  ]
}

RULES:
- Keep the same number of sections and similar structure unless the instruction specifically asks for fewer.
- Apply the refinement instruction to ALL points, not just some.
- Preserve all specific facts, numbers, and details from the original.
- Maximum 4 sections, maximum 3 points per section.
- Every number must be wrapped in **double asterisks** for bold.
- Do not invent new facts or numbers not in the original.
- Do not add text outside the JSON.
- The Proven Results / Proven Approach section should almost always have exactly 1 point — the specific proof with numbers. Do not add a second point explaining WHY the proof matters. The numbers speak for themselves.

USER PREFERENCES:
- Preferred tone: ${prefTone}
- Industry: ${prefIndustry}`;
    } else {
      systemPrompt = `You are PitchVoid's refinement engine. You take an existing script and modify it based on the user's instruction.

CURRENT OUTPUT (JSON):
${currentOutputJson}

ORIGINAL USER INPUT:
${sanitizedOriginal}

REFINEMENT INSTRUCTION:
${mappedInstruction}${userEditsDirective}

OUTPUT SCHEMA (return ONLY this JSON, nothing else):
{
  "title": "max 8 words",
  "context_line": "[What] for [Who]",
  "total_duration": "estimated speaking time",
  "lines": [
    { "type": "opener", "text": "...", "note": "...", "duration": "..." },
    { "type": "line", "text": "...", "emphasis": "metric or null" },
    { "type": "pause", "note": "..." },
    { "type": "transition", "text": "..." },
    { "type": "closer", "text": "...", "note": "...", "duration": "..." }
  ]
}

RULES:
- Keep exactly 1 opener and 1 closer.
- Apply the refinement instruction to ALL lines, not just some.
- Preserve all specific facts, numbers, and details from the original.
- Bold ALL numbers in the text with **double asterisks**.
- The emphasis field contains ONLY the number/metric phrase, or null.
- Do not invent new facts or numbers not in the original.
- Do not add text outside the JSON.

USER PREFERENCES:
- Preferred tone: ${prefTone}
- Industry: ${prefIndustry}`;
    }

    const userPrompt = "Apply the refinement instruction and return the updated JSON. Output ONLY the JSON object.";

    // 9. Call AI
    console.log(`Refining ${format} for user ${user.id}: "${instructionLower}"`);
    const { data, error } = await callAIWithRetry(LOVABLE_API_KEY, systemPrompt, userPrompt);
    if (error) return error;

    const refined = data as Record<string, unknown>;

    // 10. Validate
    if (format === "one-pager") {
      const check = validateOnePagerOutput(refined);
      if (!check.valid) {
        return errorResponse("Refinement produced invalid output: " + check.error, 500, check.error);
      }
    } else {
      const check = validateScriptOutput(refined);
      if (!check.valid) {
        return errorResponse("Refinement produced invalid output: " + check.error, 500, check.error);
      }
    }

    // 11. Quality check — new output must have at least half the content of original
    if (format === "one-pager") {
      const originalCount = countOnePagerPoints(current_output);
      const newCount = countOnePagerPoints(refined);
      if (originalCount > 0 && newCount < originalCount / 2) {
        return jsonResponse({
          success: false,
          message: "Refinement produced too little content. Try a different instruction.",
        });
      }
    } else {
      const originalCount = countScriptLines(current_output);
      const newCount = countScriptLines(refined);
      if (originalCount > 0 && newCount < originalCount / 2) {
        return jsonResponse({
          success: false,
          message: "Refinement produced too little content. Try a different instruction.",
        });
      }
    }

    // 12. Post-processing: enforce limits
    if (format === "one-pager" && Array.isArray(refined.sections)) {
      const sections = refined.sections as Array<Record<string, unknown>>;
      if (sections.length > 4) refined.sections = sections.slice(0, 4);
      for (const s of refined.sections as Array<Record<string, unknown>>) {
        if (Array.isArray(s.points) && (s.points as unknown[]).length > 3) {
          s.points = (s.points as unknown[]).slice(0, 3);
        }
      }
    } else if (format === "script" && Array.isArray(refined.lines)) {
      const lines = refined.lines as Array<Record<string, unknown>>;
      let lineCount = 0;
      refined.lines = lines.filter((l) => {
        if (l.type !== "line") return true;
        lineCount++;
        return lineCount <= 8;
      });
    }

    // 13. Override with user_edits
    if (user_edits?.title) refined.title = user_edits.title;
    if (user_edits?.context_line) refined.context_line = user_edits.context_line;

    // 14. Save to output_versions
    const triggerLabel = CHIP_INSTRUCTIONS[instructionLower]
      ? instructionLower
      : refine_instruction.slice(0, 50);

    try {
      const { data: existingVersions } = await supabaseClient
        .from("output_versions")
        .select("version_number")
        .eq("project_id", project_id)
        .eq("format", format)
        .order("version_number", { ascending: false })
        .limit(1);

      const nextVersion =
        existingVersions && existingVersions.length > 0
          ? existingVersions[0].version_number + 1
          : 1;

      await supabaseClient.from("output_versions").insert({
        project_id,
        user_id: user.id,
        version_number: nextVersion,
        output_json: refined,
        trigger: triggerLabel,
        format,
      });
    } catch (versionError) {
      console.error("Failed to save version:", versionError);
    }

    // 15. Update refine_counts in writing_preferences
    if (CHIP_INSTRUCTIONS[instructionLower]) {
      try {
        const refine_counts = (writing_preferences.refine_counts as Record<string, number>) || {};
        refine_counts[instructionLower] = (refine_counts[instructionLower] || 0) + 1;
        await supabaseClient
          .from("profiles")
          .update({
            writing_preferences: { ...writing_preferences, refine_counts },
          })
          .eq("id", user.id);
      } catch (prefError) {
        console.error("Failed to update refine_counts:", prefError);
      }
    }

    // 16. Return
    console.log(`Refined ${format} for user ${user.id}`);
    return jsonResponse({
      success: true,
      new_output: refined,
      previous_output: current_output,
    });
  } catch (error) {
    return errorResponse("An error occurred while refining your pitch", 500, error);
  }
});
