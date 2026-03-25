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
        suggestion: "Tell me a bit more. Who are you talking to and what do you need to say?"
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

    const systemPrompt = `You are PitchVoid's input parser. Your job is to read a raw brain dump and determine three things:

1. MODE — Is this person preparing to TALK TO SOMEONE, or organizing their OWN THOUGHTS?
2. CONTEXT — What specific situation is this about?
3. STRUCTURED FIELDS — Extract whatever useful information exists.

STEP 1: DETECT MODE

Read the input carefully. Ask: is there a specific person or audience this user needs to communicate with?

PERFORMANCE MODE — the user is preparing to say something to someone:
- They mention a specific audience: investors, boss, interviewer, client, landlord, therapist, audience, crowd, board, team
- They mention a specific event: meeting, interview, pitch, presentation, call, demo, review, conversation
- They mention a time pressure: tomorrow, next week, friday, in an hour, before the meeting
- Signal words: "need to tell", "how do I say", "presenting to", "talking to", "asking for", "pitching"
- CONFRONTATION TARGETS: If the input mentions a specific person they need to confront, negotiate with, or set boundaries with (landlord, boss, partner, roommate, neighbor, coworker, ex, family member), this is PERFORMANCE MODE even without a formal meeting. The presence of a confrontation target = performance mode.
- Confrontation signal words: "confront", "negotiate", "boundary", "raise", "ask for", "tell them", "deal with", "stand up to", "push back"

CLARITY MODE — the user is thinking, not performing:
- No specific audience mentioned AND no confrontation target
- No upcoming event or time pressure
- They're exploring an idea, making a decision, processing emotions, brainstorming, or just organizing scattered thoughts
- Signal words: "idea", "what if", "thinking about", "should I", "concept", "brainstorming", "random thought", "just need to organize", "i keep thinking", "notes on"
- The input reads like a note-to-self, not preparation for a conversation

CRITICAL RULE: If you cannot identify a SPECIFIC audience with HIGH confidence AND there is no confrontation target, default to CLARITY MODE. Do NOT invent an audience. "Software idea about a focus app" has no audience. "Meeting with boss tomorrow about a raise" has an audience (boss). "Need to tell my landlord to fix the heat" has a confrontation target (landlord) — this is PERFORMANCE/difficult_conversation.

STEP 2: DETECT CONTEXT

Based on the mode and content, pick the most specific context:

PERFORMANCE CONTEXTS:
- business_pitch: investors, clients, partners, funding, revenue
- meeting_prep: team sync, standup, manager update, board review
- job_interview: hiring, role, position, interviewer, portfolio
- networking: conference, event, introduce myself, new contacts
- sales: prospect, demo, close, deal, pricing, follow-up
- education: thesis, research, professor, class presentation
- creative_performance: comedy, speech, toast, open mic, keynote
- difficult_conversation: conflict, raise, landlord, boundary, breakup, fired, negotiate, confront, roommate, partner, neighbor — ALWAYS performance mode when a specific person/target is identified

CLARITY CONTEXTS:
- thinking_idea: product idea, business concept, creative project, brainstorming, "what if"
- thinking_decision: weighing options, should I, pros and cons, career change, life choice
- thinking_reflection: processing emotions, journaling, therapy prep, self-reflection, overwhelmed
- thinking_notes: organizing information, research notes, summarizing what I learned, consolidating thoughts
- general: doesn't fit any specific context

STEP 3: EXTRACT FIELDS

For PERFORMANCE MODE, extract:
- who: the specific audience (only if explicitly stated or strongly implied). Include confidence: high/medium/low
- what: what they need to communicate
- why: why this matters or what's at stake
- how: any specific approach, tone, or constraints mentioned
- urgency: any time pressure mentioned

For CLARITY MODE, extract:
- core_idea: the central thought or concept
- supporting_details: any facts, numbers, or specifics mentioned
- open_questions: things the user seems uncertain about
- emotional_tone: how the user seems to feel (anxious, excited, confused, frustrated, neutral)

STEP 4: RETURN JSON

Return ONLY this JSON structure:

{
  "mode": "performance" | "clarity",
  "context": "business_pitch" | "meeting_prep" | "job_interview" | "networking" | "sales" | "education" | "creative_performance" | "difficult_conversation" | "thinking_idea" | "thinking_decision" | "thinking_reflection" | "thinking_notes" | "general",
  "confidence": "high" | "medium" | "low",
  "performance_fields": {
    "who": { "value": "string or null", "confidence": "high|medium|low" },
    "what": "string",
    "why": "string or null",
    "how": "string or null",
    "urgency": "string or null"
  },
  "clarity_fields": {
    "core_idea": "string",
    "supporting_details": ["string"],
    "open_questions": ["string"],
    "emotional_tone": "string"
  },
  "title_suggestion": "short 3-6 word title for this project",
  "suggested_format": "one-pager" | "script",
  "suggested_length": "quick" | "standard" | "detailed"
}

Only populate performance_fields OR clarity_fields based on the detected mode, not both. Set the unused one to null.

EXAMPLES:

Input: "meeting with boss tomorrow want a raise been here 2 years"
Output: {"mode":"performance","context":"difficult_conversation","confidence":"high","performance_fields":{"who":{"value":"boss/manager","confidence":"high"},"what":"requesting a salary raise","why":"2 years tenure with no adjustment","how":null,"urgency":"tomorrow"},"clarity_fields":null,"title_suggestion":"Salary Raise Conversation","suggested_format":"one-pager","suggested_length":"standard"}

Input: "software idea to build a focus mode app that locks your screen to 3 apps blocks notifications has a timer and AI helpers"
Output: {"mode":"clarity","context":"thinking_idea","confidence":"high","performance_fields":null,"clarity_fields":{"core_idea":"Focus mode desktop app that locks screen to 3 pre-selected apps with notification blocking, timer, and integrated AI helpers","supporting_details":["screen locking","max 3 apps","notification blocking","built-in timer","AI helper integration"],"open_questions":["platform (desktop vs mobile vs browser extension)","monetization","technical feasibility"],"emotional_tone":"excited"},"title_suggestion":"Focus Mode App Concept","suggested_format":"one-pager","suggested_length":"standard"}

Input: "ok so what if i combine music therapy with sound healing and turn it into a physical space not a clinic more like a studio where people decompress through sound singing bowls frequency tuning maybe AI soundscapes my friend does reiki could collaborate rent in bushwick is manageable evenings only corporate wellness for burnt out tech workers i have 4k saved zero business plan"
Output: {"mode":"clarity","context":"thinking_idea","confidence":"high","performance_fields":null,"clarity_fields":{"core_idea":"Physical sound healing studio in Brooklyn combining music therapy, singing bowls, frequency tuning, and AI-generated soundscapes","supporting_details":["potential reiki collaboration","evening sessions in Bushwick","corporate wellness packages","$4K savings available"],"open_questions":["licensing requirements for sound healing","lease vs pop-up to start","business plan needed","art therapy integration"],"emotional_tone":"excited but uncertain"},"title_suggestion":"Sound Healing Studio Concept","suggested_format":"one-pager","suggested_length":"standard"}

Input: "doing 5 minute open mic set friday in brooklyn crowd is mostly tech workers my angle is about epstein and how we all just meme about broken things instead of fixing them"
Output: {"mode":"performance","context":"creative_performance","confidence":"high","performance_fields":{"who":{"value":"open mic audience, mostly tech workers in their 20s-30s","confidence":"high"},"what":"5 minute comedy set about collective inaction","why":"exploring how people meme about broken systems instead of acting","how":"shock hook with epstein, pivot to workplace parallel","urgency":"friday"},"clarity_fields":null,"title_suggestion":"Friday Open Mic Set","suggested_format":"script","suggested_length":"standard"}

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
