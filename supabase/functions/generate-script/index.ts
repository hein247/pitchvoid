import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateRequest, checkPitchLimit, checkFormatAccess, incrementPitchCount } from "../_shared/auth.ts";
import { validateGenerateScriptInput, sanitizeForPrompt } from "../_shared/validation.ts";
import { corsHeaders, jsonResponse, errorResponse, handleCors } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";

interface ScriptSection {
  name: string;
  duration: string;
  content: string;
  cue: string;
}

interface ScriptData {
  title: string;
  total_duration: string;
  sections: ScriptSection[];
  key_phrases: string[];
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

    // Rate limiting based on user plan
    const plan = profile.plan || "free";
    const rateConfig = plan === "free" ? RATE_LIMITS.aiGeneration.free : RATE_LIMITS.aiGeneration.paid;
    const rateLimitResult = await checkRateLimit(`script:${user.id}`, rateConfig);
    if (!rateLimitResult.allowed) {
      console.log("Rate limit exceeded for user:", user.id);
      return rateLimitResponse(rateLimitResult);
    }

    // Check pitch limit (server-side paywall)
    const limitCheck = checkPitchLimit(profile);
    if (!limitCheck.allowed) {
      return jsonResponse({ error: limitCheck.error }, limitCheck.statusCode || 402);
    }

    // Check format access (script is Pro only)
    const formatCheck = checkFormatAccess(profile, 'script');
    if (!formatCheck.allowed) {
      return jsonResponse({ error: formatCheck.error }, formatCheck.statusCode || 402);
    }

    // Parse and validate request body
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

    console.log("Generating script for user:", user.id);

    // Sanitize inputs
    const sanitizedScenario = sanitizeForPrompt(scenario);
    const sanitizedAudience = targetAudience ? sanitizeForPrompt(targetAudience) : "";
    const sanitizedContext = documentContext ? sanitizeForPrompt(documentContext) : "";
    const sanitizedTone = tone ? sanitizeForPrompt(tone) : "";

    const docContext = sanitizedContext
      ? `\n\n**Document Context:**\n${sanitizedContext}`
      : '';

    const imageContext = imageDescriptions && imageDescriptions.length > 0
      ? `\n\n**Visual Assets (${imageDescriptions.length} images):**\n${imageDescriptions.map((desc: string, i: number) => `- Image ${i + 1}: ${sanitizeForPrompt(desc)}`).join('\n')}`
      : '';

    // Determine duration based on length preference
    const durationMap: Record<string, { sections: number; total: string }> = {
      'quick': { sections: 3, total: '30-60 seconds' },
      'standard': { sections: 5, total: '2-3 minutes' },
      'detailed': { sections: 7, total: '5-7 minutes' }
    };
    const { sections: sectionCount, total: totalDuration } = durationMap[length] || durationMap['standard'];

    const systemPrompt = `You are an expert speech writer and presentation coach. Create a timed speaking script with natural delivery cues.

SCRIPT PRINCIPLES:
- Conversational yet polished language
- Clear timing for each section
- Stage directions and delivery cues
- Memorable phrases to emphasize
- Natural transitions between sections

Output ONLY a valid JSON object with this structure:
{
  "title": "Script title",
  "total_duration": "${totalDuration}",
  "sections": [
    {
      "name": "Opening",
      "duration": "15 seconds",
      "content": "What to say word-for-word",
      "cue": "Stage direction: make eye contact, pause, etc."
    }
  ],
  "key_phrases": ["Memorable phrase 1", "Memorable phrase 2"]
}

SECTION STRUCTURE (${sectionCount} sections):
1. HOOK - Grab attention immediately (15-20 seconds)
2. CONTEXT - Set the stage, why this matters
3. SUBSTANCE - Main points with evidence
4. PROOF - Specific achievements or examples
5. ASK/PROPOSAL - What you want
6. CLOSE - Memorable ending

Adjust sections based on the ${length || 'standard'} length preference.

TONE: ${sanitizedTone || 'confident and professional'}
Keep it human, not robotic. Write like people actually speak.`;

    const userPrompt = `Create a speaking script:

**Scenario:** ${sanitizedScenario}

**Audience:** ${sanitizedAudience || "Decision makers"}

**Length:** ${length || 'standard'} (${totalDuration})

**Tone:** ${sanitizedTone || 'confident'}
${docContext}${imageContext}

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
      return errorResponse("Failed to generate script", 500, `AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;
    
    if (!aiContent) {
      return errorResponse("Failed to generate script", 500, "No content received from AI");
    }

    console.log("AI response received for user:", user.id);

    // Parse the JSON from the response
    let script: ScriptData;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        script = JSON.parse(jsonMatch[0]);
      } else {
        script = JSON.parse(aiContent);
      }
    } catch (parseError) {
      return errorResponse("Failed to generate script", 500, parseError);
    }

    // Validate structure
    if (!script.title || !script.sections || !Array.isArray(script.sections)) {
      return errorResponse("Failed to generate script", 500, "Invalid script structure");
    }

    // Increment pitch count after successful generation
    await incrementPitchCount(user.id);

    console.log("Generated script for user:", user.id);

    return jsonResponse({ script });

  } catch (error) {
    return errorResponse("An error occurred while generating your script", 500, error);
  }
});
