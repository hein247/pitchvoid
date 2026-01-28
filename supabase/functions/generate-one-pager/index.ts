import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scenario, targetAudience, documentContext, imageDescriptions, visualStyle } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating one-pager for scenario:", scenario);
    console.log("Target audience:", targetAudience);

    const imageContext = imageDescriptions && imageDescriptions.length > 0
      ? `\n\n**Uploaded Visual Assets (${imageDescriptions.length} images):**\n${imageDescriptions.map((desc: string, i: number) => `- Image ${i + 1}: ${desc}`).join('\n')}`
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

**Scenario:** ${scenario}

**Target Audience:** ${targetAudience || "Decision makers"}

**Goal:** Concise, scannable single-page document
${documentContext ? `\n**Document Context:** ${documentContext}` : ''}${imageContext}
${visualStyle ? `\n**Tone/Style:** ${visualStyle}` : ''}

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
    let onePager: OnePagerData;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        onePager = JSON.parse(jsonMatch[0]);
      } else {
        onePager = JSON.parse(aiContent);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Failed to parse one-pager content from AI response");
    }

    // Validate structure
    if (!onePager.headline || !onePager.subheadline || !Array.isArray(onePager.sections)) {
      throw new Error("Invalid one-pager structure received");
    }

    console.log("Generated one-pager:", JSON.stringify(onePager, null, 2));

    return new Response(
      JSON.stringify({ onePager }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating one-pager:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
