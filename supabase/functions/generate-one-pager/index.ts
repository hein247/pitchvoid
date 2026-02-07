import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { authenticateRequest, checkPitchLimit, checkFormatAccess, incrementPitchCount } from "../_shared/auth.ts";
import { validateGenerateOnePagerInput, sanitizeForPrompt } from "../_shared/validation.ts";
import { corsHeaders, jsonResponse, errorResponse, handleCors } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";

interface OnePagerSection {
  type: 'hero' | 'key-points' | 'value-prop' | 'cta';
  title: string;
  content: string;
  bullets?: string[];
}

interface OnePagerData {
  headline: string;
  subheadline: string;
  sections: OnePagerSection[];
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
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
    const rateLimitResult = await checkRateLimit(`onepager:${user.id}`, rateConfig);
    if (!rateLimitResult.allowed) {
      console.log("Rate limit exceeded for user:", user.id);
      return rateLimitResponse(rateLimitResult);
    }

    // Check pitch limit (server-side paywall)
    const limitCheck = checkPitchLimit(profile);
    if (!limitCheck.allowed) {
      return jsonResponse({ error: limitCheck.error }, limitCheck.statusCode || 402);
    }

    // Check format access (one-pager is Pro only)
    const formatCheck = checkFormatAccess(profile, 'one-pager');
    if (!formatCheck.allowed) {
      return jsonResponse({ error: formatCheck.error }, formatCheck.statusCode || 402);
    }

    // Parse and validate request body
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

    // Sanitize inputs
    const sanitizedScenario = sanitizeForPrompt(scenario);
    const sanitizedAudience = targetAudience ? sanitizeForPrompt(targetAudience) : "";
    const sanitizedContext = documentContext ? sanitizeForPrompt(documentContext) : "";
    const sanitizedStyle = visualStyle ? sanitizeForPrompt(visualStyle) : "";

    const imageContext = imageDescriptions && imageDescriptions.length > 0
      ? `\n\n**Uploaded Visual Assets (${imageDescriptions.length} images):**\n${imageDescriptions.map((desc: string, i: number) => `- Image ${i + 1}: ${sanitizeForPrompt(desc)}`).join('\n')}`
      : '';

    const systemPrompt = `You are an expert pitch strategist creating compelling one-pager documents. Create a single-page executive summary that is concise, impactful, and scannable.

DESIGN PRINCIPLES:
- Headline: Bold, attention-grabbing, benefit-focused (under 10 words)
- Subheadline: Clear value proposition (under 25 words)
- Sections: 3-4 focused sections with clear hierarchy
- Bullets: 2-4 per section, action-oriented
- CTA: Clear next step with urgency

Output ONLY a valid JSON object with this structure:
{
  "headline": "Bold attention-grabbing headline",
  "subheadline": "Clear value proposition that explains the benefit",
  "sections": [
    {
      "type": "key-points",
      "title": "Section Title",
      "content": "Brief description",
      "bullets": ["Point 1", "Point 2", "Point 3"]
    },
    {
      "type": "value-prop",
      "title": "Why Choose Us",
      "content": "Value proposition",
      "bullets": ["Benefit 1", "Benefit 2"]
    },
    {
      "type": "cta",
      "title": "Ready to Get Started?",
      "content": "Clear call to action with next steps"
    }
  ],
  "contactInfo": {
    "email": "contact@example.com",
    "website": "https://example.com"
  }
}

ONE-PAGER STRUCTURE:
1. Key Points - 3-4 most important facts/benefits
2. Value Proposition - Why this matters to the reader
3. Call to Action - Clear next steps

Keep everything scannable and impactful. Less is more.`;

    const userPrompt = `Create a one-pager executive summary:

**Scenario:** ${sanitizedScenario}

**Target Audience:** ${sanitizedAudience || "Decision makers"}

**Goal:** Concise, scannable single-page document
${sanitizedContext ? `\n**Document Context:** ${sanitizedContext}` : ''}${imageContext}
${sanitizedStyle ? `\n**Tone/Style:** ${sanitizedStyle}` : ''}

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

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;
    
    if (!aiContent) {
      return errorResponse("Failed to generate one-pager", 500, "No content received from AI");
    }

    console.log("AI response received for user:", user.id);

    // Parse the JSON from the response
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
    if (!onePager.headline || !onePager.subheadline || !Array.isArray(onePager.sections)) {
      return errorResponse("Failed to generate one-pager", 500, "Invalid one-pager structure");
    }

    // Increment pitch count after successful generation
    await incrementPitchCount(user.id);

    console.log("Generated one-pager for user:", user.id);

    return jsonResponse({ onePager });

  } catch (error) {
    return errorResponse("An error occurred while generating your one-pager", 500, error);
  }
});
