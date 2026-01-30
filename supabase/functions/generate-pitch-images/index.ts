import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateRequest } from "../_shared/auth.ts";
import { validateGeneratePitchImagesInput, sanitizeForPrompt } from "../_shared/validation.ts";
import { corsHeaders, jsonResponse, errorResponse, handleCors } from "../_shared/cors.ts";

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

    const { user } = authResult!;

    // Parse and validate request body
    const body = await req.json();
    const validation = validateGeneratePitchImagesInput(body);
    if (!validation.valid) {
      return jsonResponse({ error: validation.error }, 400);
    }

    const { slideTitle, slideDescription, visualStyle, slideIndex } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return errorResponse("Service configuration error", 500, "LOVABLE_API_KEY is not configured");
    }

    console.log("Generating image for user:", user.id, "slide:", slideTitle);

    // Sanitize inputs
    const sanitizedTitle = sanitizeForPrompt(slideTitle);
    const sanitizedDescription = sanitizeForPrompt(slideDescription);
    const sanitizedStyle = visualStyle ? sanitizeForPrompt(visualStyle) : "";

    // Build a dynamic prompt based on slide content and user's visual style
    const styleGuide = sanitizedStyle?.trim() 
      ? `Visual Style Instructions: ${sanitizedStyle}. `
      : "Visual Style: Professional, modern, and clean with sophisticated color palette. ";

    const imagePrompt = `Create a high-quality, presentation-ready visual for a pitch deck slide.

${styleGuide}

Slide Context:
- Title: "${sanitizedTitle}"
- Description: "${sanitizedDescription}"
- This is slide ${slideIndex + 1} of the presentation.

Requirements:
- The image should be abstract or conceptual, NOT containing any text or logos.
- Use visual metaphors and symbolic imagery that relates to the slide's message.
- Create a visually striking composition suitable for a professional presentation.
- The image should work well as a background or accent visual for the slide content.
- Ensure the design is modern, sophisticated, and appropriate for business presentations.
- Ultra high resolution, 16:9 aspect ratio hero image style.`;

    console.log("Image prompt created for user:", user.id);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: imagePrompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return jsonResponse({ error: "Rate limit exceeded. Please try again in a moment." }, 429);
      }
      if (response.status === 402) {
        return jsonResponse({ error: "AI credits exhausted. Please add credits to continue." }, 402);
      }
      return errorResponse("Failed to generate image", 500, `AI gateway error: ${response.status}`);
    }

    const data = await response.json();

    // Extract the image from the response
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      return errorResponse("Failed to generate image", 500, "No image in AI response");
    }

    console.log("Image generated successfully for user:", user.id);

    return jsonResponse({ 
      imageUrl: imageData,
      prompt: imagePrompt 
    });

  } catch (error) {
    return errorResponse("An error occurred while generating the image", 500, error);
  }
});
