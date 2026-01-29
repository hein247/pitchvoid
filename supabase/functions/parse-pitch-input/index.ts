import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParsedContext {
  audience: string;
  audience_detail: string;
  subject: string;
  subject_detail: string;
  goal: string;
  tone: string;
  urgency: string;
  suggested_format: 'slides' | 'one-pager' | 'script';
  suggested_length: 'quick' | 'standard' | 'detailed';
  clarifying_questions: string[];
  summary: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userInput } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Parsing pitch input:", userInput);

    const systemPrompt = `You are an expert pitch strategist. Analyze the user's pitch request and extract key elements.

Analyze this pitch request and extract:

1. AUDIENCE: Who will receive this pitch? (e.g., investors, boss, team, interviewer, friend, panel, committee)
2. SUBJECT: What is being pitched? (e.g., myself for a job, my startup, an idea, a request, a proposal)
3. GOAL: What outcome does the user want? (e.g., get hired, get funded, get approval, persuade, inform, inspire)
4. TONE: What tone is appropriate? Infer from context. (e.g., formal, confident, humble, casual, urgent, inspirational)
5. URGENCY: When is this needed? (e.g., immediate, tomorrow, this week, not specified)
6. FORMAT SUGGESTION: Based on context, suggest output format:
   - "slides" for formal presentations, investor pitches, conference talks
   - "one-pager" for quick summaries, email follow-ups, leave-behinds
   - "script" for interviews, phone calls, in-person meetings, speeches
7. LENGTH SUGGESTION: Based on context:
   - "quick" for 2-3 slides, 30-second pitch, brief summary
   - "standard" for 5-6 slides, 2-3 minute pitch, full page
   - "detailed" for 8-10 slides, 5-7 minute pitch, comprehensive

Respond in JSON format:
{
  "audience": "",
  "audience_detail": "",
  "subject": "",
  "subject_detail": "",
  "goal": "",
  "tone": "",
  "urgency": "",
  "suggested_format": "slides" | "one-pager" | "script",
  "suggested_length": "quick" | "standard" | "detailed",
  "clarifying_questions": [],
  "summary": ""
}

Keep "clarifying_questions" empty unless truly ambiguous.`;

    const userPrompt = `User input: "${userInput}"

Respond with ONLY the JSON object, no other text.`;

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
        temperature: 0.3, // Lower temperature for more consistent parsing
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
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
    let parsedContext: ParsedContext;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContext = JSON.parse(jsonMatch[0]);
      } else {
        parsedContext = JSON.parse(aiContent);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Failed to parse context from AI response");
    }

    // Validate and normalize
    if (!parsedContext.audience || !parsedContext.goal) {
      throw new Error("Invalid context structure received");
    }

    // Ensure valid format and length values
    if (!['slides', 'one-pager', 'script'].includes(parsedContext.suggested_format)) {
      parsedContext.suggested_format = 'slides';
    }
    if (!['quick', 'standard', 'detailed'].includes(parsedContext.suggested_length)) {
      parsedContext.suggested_length = 'standard';
    }

    console.log("Parsed context:", JSON.stringify(parsedContext, null, 2));

    return new Response(
      JSON.stringify({ parsedContext }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error parsing pitch input:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
