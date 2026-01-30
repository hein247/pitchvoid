import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateRequest, checkPitchLimit, checkFormatAccess, incrementPitchCount } from "../_shared/auth.ts";
import { validateGeneratePitchInput, sanitizeForPrompt } from "../_shared/validation.ts";
import { corsHeaders, jsonResponse, errorResponse, handleCors } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";

interface SlideContent {
  component_type: string;
  content: {
    title: string;
    description: string;
    bullets?: string[];
  };
  animation: {
    speed: string;
    type: string;
  };
  layout_type: string;
  visual_style?: string;
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
    const rateLimitResult = await checkRateLimit(`pitch:${user.id}`, rateConfig);
    if (!rateLimitResult.allowed) {
      console.log("Rate limit exceeded for user:", user.id);
      return rateLimitResponse(rateLimitResult);
    }

    // Check pitch limit (server-side paywall)
    const limitCheck = checkPitchLimit(profile);
    if (!limitCheck.allowed) {
      return jsonResponse({ error: limitCheck.error }, limitCheck.statusCode || 402);
    }

    // Check format access (slides format)
    const formatCheck = checkFormatAccess(profile, 'slides');
    if (!formatCheck.allowed) {
      return jsonResponse({ error: formatCheck.error }, formatCheck.statusCode || 402);
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = validateGeneratePitchInput(body);
    if (!validation.valid) {
      return jsonResponse({ error: validation.error }, 400);
    }

    const { scenario, targetAudience, documentContext, imageDescriptions, visualStyle } = body;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return errorResponse("Service configuration error", 500, "LOVABLE_API_KEY is not configured");
    }

    console.log("Generating pitch for user:", user.id);

    // Sanitize inputs for AI prompt
    const sanitizedScenario = sanitizeForPrompt(scenario);
    const sanitizedAudience = targetAudience ? sanitizeForPrompt(targetAudience) : "";
    const sanitizedContext = documentContext ? sanitizeForPrompt(documentContext) : "";
    const sanitizedStyle = visualStyle ? sanitizeForPrompt(visualStyle) : "";

    // Build image context for the prompt
    const imageContext = imageDescriptions && imageDescriptions.length > 0
      ? `\n\n**Uploaded Visual Assets (${imageDescriptions.length} images):**\n${imageDescriptions.map((desc: string, i: number) => `- Image ${i + 1}: ${sanitizeForPrompt(desc)}`).join('\n')}\n\nIMPORTANT: Create visual-heavy slides that prominently feature these product images. Each slide should be designed to showcase these visuals as the primary focus.`
      : '';

    const systemPrompt = `You are an expert pitch strategist and presentation designer specializing in luxury brand presentations. Create visual-heavy, elegant slides that prioritize imagery over text.

DESIGN PRINCIPLES:
- Typography: Use elegant, editorial typography (Times New Roman Italic for headings, Be Vietnam Pro for body)
- Layout: Favor asymmetric, magazine-style layouts that let visuals breathe
- Content: Keep text minimal - let the images speak
- Tone: ${sanitizedAudience?.includes('sales') ? 'Professional and persuasive' : 'Sophisticated and aspirational'}

Output ONLY a valid JSON array where each object has:
- component_type: Choose from: 'MovingBorder', 'HoverCard', 'FloatingElement', 'GlowCard', 'ParallaxSection'
- content: An object with:
  - title: A compelling, concise slide title (elegant and minimal)
  - description: A brief, evocative description (1 sentence max, poetic for luxury brands)
  - bullets: An array of 2-3 key points (optional, use sparingly)
- animation: An object with:
  - speed: 'slow' (preferred for luxury), 'medium', or 'fast'
  - type: 'fade', 'slide', 'scale', 'float' (prefer 'fade' and 'float' for elegance)
- layout_type: 'centered', 'side-by-side', or 'bento-grid' (favor 'side-by-side' for product showcases)
- visual_style: A brief style description for AI image generation (e.g., "Minimalist gold and cream", "Soft natural lighting on jewelry")

SLIDE STRUCTURE (5 slides, NO Case Study section):
1. Hero/Opening - Bold visual statement, minimal text, showcase hero product
2. Product Showcase - Feature the collection/products with elegant descriptions
3. Craftsmanship/Value - Highlight quality, materials, or unique selling points
4. Lifestyle/Aspiration - Emotional connection, how the product enhances life
5. Call to Action - Clear next steps, contact, or offer

Make content elegant, minimal, and focused on visual storytelling.`;

    const userPrompt = `Create a 5-slide visual-heavy pitch presentation:

**Scenario:** ${sanitizedScenario}

**Target Audience:** ${sanitizedAudience || "Jewelry customers"}

**Goal:** Sales-focused presentation with professional tone
${sanitizedContext ? `\n**Document Context:** ${sanitizedContext}` : ''}${imageContext}
${sanitizedStyle ? `\n**Preferred Visual Style:** ${sanitizedStyle}` : ''}

Generate the JSON array now. Remember: output ONLY the JSON array, no other text. Focus on visual storytelling - minimal text, maximum impact.`;

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
      return errorResponse("Failed to generate pitch", 500, `AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;
    
    if (!aiContent) {
      return errorResponse("Failed to generate pitch", 500, "No content received from AI");
    }

    console.log("AI response received for user:", user.id);

    // Parse the JSON from the response
    let slides: SlideContent[];
    try {
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        slides = JSON.parse(jsonMatch[0]);
      } else {
        slides = JSON.parse(aiContent);
      }
    } catch (parseError) {
      return errorResponse("Failed to generate pitch", 500, parseError);
    }

    // Validate and ensure proper structure
    if (!Array.isArray(slides) || slides.length === 0) {
      return errorResponse("Failed to generate pitch", 500, "Invalid slides structure received");
    }

    // Ensure each slide has required fields with defaults
    slides = slides.map((slide, index) => ({
      ...slide,
      layout_type: slide.layout_type || (index === 0 ? 'centered' : 'side-by-side'),
      visual_style: slide.visual_style || 'Elegant minimalist with soft lighting',
    }));

    // Increment pitch count after successful generation
    await incrementPitchCount(user.id);

    console.log("Generated slides for user:", user.id);

    return jsonResponse({ slides });

  } catch (error) {
    return errorResponse("An error occurred while generating your pitch", 500, error);
  }
});
