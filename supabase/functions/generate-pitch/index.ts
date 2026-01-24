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
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scenario, targetAudience, documentContext } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating pitch for scenario:", scenario);
    console.log("Target audience:", targetAudience);

    const systemPrompt = `You are an expert pitch strategist and presentation designer. Based on the user's scenario and context, generate a 5-slide presentation optimized for impact and engagement.

Output ONLY a valid JSON array where each object has:
- component_type: An Anti-Gravity animation component name. Choose from: 'MovingBorder', 'HoverCard', 'FloatingElement', 'GlowCard', 'ParallaxSection'
- content: An object with:
  - title: A compelling, concise slide title
  - description: A brief but impactful description (1-2 sentences)
  - bullets: An array of 3-4 key points (optional, omit for intro/outro slides)
- animation: An object with:
  - speed: 'slow', 'medium', or 'fast'
  - type: 'fade', 'slide', 'scale', 'bounce', or 'float'

Slide structure should follow:
1. Hook/Opening - Grab attention with a bold statement or question
2. Problem - Define the pain point clearly
3. Solution - Present the value proposition
4. Proof - Evidence, metrics, or testimonials
5. Call to Action - Clear next steps

Make the content compelling, specific, and tailored to the target audience. Use power words and create emotional resonance.`;

    const userPrompt = `Create a 5-slide pitch presentation for the following scenario:

**Scenario:** ${scenario}

**Target Audience:** ${targetAudience || "General business audience"}

${documentContext ? `**Additional Context from Documents:** ${documentContext}` : ""}

Generate the JSON array now. Remember: output ONLY the JSON array, no other text.`;

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
