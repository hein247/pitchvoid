import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scenario, targetAudience, documentContext, imageDescriptions, tone, length } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating script for scenario:", scenario);
    console.log("Target audience:", targetAudience);
    console.log("Tone:", tone);
    console.log("Length:", length);

    const docContext = documentContext
      ? `\n\n**Document Context:**\n${documentContext}`
      : '';

    const imageContext = imageDescriptions && imageDescriptions.length > 0
      ? `\n\n**Visual Assets (${imageDescriptions.length} images):**\n${imageDescriptions.map((desc: string, i: number) => `- Image ${i + 1}: ${desc}`).join('\n')}`
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

TONE: ${tone || 'confident and professional'}
Keep it human, not robotic. Write like people actually speak.`;

    const userPrompt = `Create a speaking script:

**Scenario:** ${scenario}

**Audience:** ${targetAudience || "Decision makers"}

**Length:** ${length || 'standard'} (${totalDuration})

**Tone:** ${tone || 'confident'}
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
    let script: ScriptData;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        script = JSON.parse(jsonMatch[0]);
      } else {
        script = JSON.parse(aiContent);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Failed to parse script content from AI response");
    }

    // Validate structure
    if (!script.title || !script.sections || !Array.isArray(script.sections)) {
      throw new Error("Invalid script structure received");
    }

    console.log("Generated script:", JSON.stringify(script, null, 2));

    return new Response(
      JSON.stringify({ script }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating script:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
