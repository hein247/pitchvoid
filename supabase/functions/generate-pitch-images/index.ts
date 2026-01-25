import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateImageRequest {
  slideTitle: string;
  slideDescription: string;
  visualStyle?: string;
  slideIndex: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slideTitle, slideDescription, visualStyle, slideIndex } = await req.json() as GenerateImageRequest;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating image for slide:", slideTitle);
    console.log("Visual style:", visualStyle || "default professional");

    // Build a dynamic prompt based on slide content and user's visual style
    const styleGuide = visualStyle?.trim() 
      ? `Visual Style Instructions: ${visualStyle}. `
      : "Visual Style: Professional, modern, and clean with sophisticated color palette. ";

    const imagePrompt = `Create a high-quality, presentation-ready visual for a pitch deck slide.

${styleGuide}

Slide Context:
- Title: "${slideTitle}"
- Description: "${slideDescription}"
- This is slide ${slideIndex + 1} of the presentation.

Requirements:
- The image should be abstract or conceptual, NOT containing any text or logos.
- Use visual metaphors and symbolic imagery that relates to the slide's message.
- Create a visually striking composition suitable for a professional presentation.
- The image should work well as a background or accent visual for the slide content.
- Ensure the design is modern, sophisticated, and appropriate for business presentations.
- Ultra high resolution, 16:9 aspect ratio hero image style.`;

    console.log("Image prompt:", imagePrompt);

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
    console.log("AI response received");

    // Extract the image from the response
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("No image in response:", JSON.stringify(data, null, 2));
      throw new Error("No image generated from AI response");
    }

    console.log("Image generated successfully (base64 length):", imageData.length);

    return new Response(
      JSON.stringify({ 
        imageUrl: imageData,
        prompt: imagePrompt 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating image:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
