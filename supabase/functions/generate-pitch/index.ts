import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scenario, targetAudience, documentContext, imageDescriptions, visualStyle } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating pitch for scenario:", scenario);
    console.log("Target audience:", targetAudience);
    console.log("Image descriptions count:", imageDescriptions?.length || 0);

    // Build image context for the prompt
    const imageContext = imageDescriptions && imageDescriptions.length > 0
      ? `\n\n**Uploaded Visual Assets (${imageDescriptions.length} images):**\n${imageDescriptions.map((desc: string, i: number) => `- Image ${i + 1}: ${desc}`).join('\n')}\n\nIMPORTANT: Create visual-heavy slides that prominently feature these product images. Each slide should be designed to showcase these visuals as the primary focus.`
      : '';

    const systemPrompt = `You are an expert pitch strategist and presentation designer specializing in luxury brand presentations. Create visual-heavy, elegant slides that prioritize imagery over text.

DESIGN PRINCIPLES:
- Typography: Use elegant, editorial typography (Times New Roman Italic for headings, Be Vietnam Pro for body)
- Layout: Favor asymmetric, magazine-style layouts that let visuals breathe
- Content: Keep text minimal - let the images speak
- Tone: ${targetAudience?.includes('sales') ? 'Professional and persuasive' : 'Sophisticated and aspirational'}

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

**Scenario:** ${scenario}

**Target Audience:** ${targetAudience || "Jewelry customers"}

**Goal:** Sales-focused presentation with professional tone
${documentContext ? `\n**Document Context:** ${documentContext}` : ''}${imageContext}
${visualStyle ? `\n**Preferred Visual Style:** ${visualStyle}` : ''}

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
        console.error("Rate limit exceeded");
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;
    
    if (!aiContent) {
      throw new Error("No content received from AI");
    }

    console.log("Raw AI response:", aiContent);

    // Parse the JSON from the response
    let slides: SlideContent[];
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        slides = JSON.parse(jsonMatch[0]);
      } else {
        slides = JSON.parse(aiContent);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Failed to parse slide content from AI response");
    }

    // Validate and ensure proper structure
    if (!Array.isArray(slides) || slides.length === 0) {
      throw new Error("Invalid slides structure received");
    }

    // Ensure each slide has required fields with defaults
    slides = slides.map((slide, index) => ({
      ...slide,
      layout_type: slide.layout_type || (index === 0 ? 'centered' : 'side-by-side'),
      visual_style: slide.visual_style || 'Elegant minimalist with soft lighting',
    }));

    console.log("Generated slides:", JSON.stringify(slides, null, 2));

    return new Response(
      JSON.stringify({ slides }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating pitch:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
