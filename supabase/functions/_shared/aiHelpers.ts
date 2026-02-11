/**
 * Shared AI generation helpers: JSON validation, retry, hallucination detection
 */

import { jsonResponse, errorResponse, corsHeaders } from "./cors.ts";

/**
 * Extract numbers from a string (integers and decimals)
 */
function extractNumbers(text: string): Set<string> {
  const matches = text.match(/\d+\.?\d*/g) || [];
  return new Set(matches.filter(n => n.length <= 15)); // ignore absurdly long
}

/**
 * Compare generated output numbers against original input.
 * Returns numbers found in output but NOT in input (potential hallucinations).
 */
export function detectHallucinatedNumbers(
  inputText: string,
  outputJson: unknown
): string[] {
  const inputNumbers = extractNumbers(inputText);
  const outputStr = JSON.stringify(outputJson);
  const outputNumbers = extractNumbers(outputStr);

  // Common non-suspicious numbers to ignore
  const ignoreSet = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);

  const flagged: string[] = [];
  for (const num of outputNumbers) {
    if (!inputNumbers.has(num) && !ignoreSet.has(num)) {
      flagged.push(num);
    }
  }
  return flagged;
}

/**
 * Try to parse JSON from AI response content, extracting from markdown fences if needed
 */
export function parseJsonFromAI(content: string): unknown {
  // Try direct parse
  try {
    return JSON.parse(content);
  } catch { /* continue */ }

  // Try extracting JSON object
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  throw new Error("No valid JSON found in AI response");
}

/**
 * Call the AI gateway and return parsed JSON, with one retry on parse failure.
 */
export async function callAIWithRetry(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  model = "google/gemini-3-flash-preview"
): Promise<{ data: unknown; error?: Response }> {
  const callAI = async () => {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return { data: null, error: jsonResponse({ error: "Rate limit exceeded. Please try again in a moment." }, 429) };
      }
      if (response.status === 402) {
        return { data: null, error: jsonResponse({ error: "AI credits exhausted. Please add credits to continue." }, 402) };
      }
      return { data: null, error: errorResponse("AI generation failed", 500, `AI gateway error: ${response.status}`) };
    }

    const responseData = await response.json();
    const aiContent = responseData.choices?.[0]?.message?.content;
    if (!aiContent) {
      return { data: null, error: errorResponse("AI generation failed", 500, "No content received from AI") };
    }
    return { data: aiContent, error: undefined };
  };

  // First attempt
  const first = await callAI();
  if (first.error) return { data: null, error: first.error };

  try {
    const parsed = parseJsonFromAI(first.data as string);
    return { data: parsed };
  } catch {
    console.warn("First AI response was invalid JSON, retrying...");
  }

  // Retry once
  const second = await callAI();
  if (second.error) return { data: null, error: second.error };

  try {
    const parsed = parseJsonFromAI(second.data as string);
    return { data: parsed };
  } catch {
    return { data: null, error: errorResponse("AI returned invalid JSON after retry. Please try again.", 500, "JSON parse failed on retry") };
  }
}

/**
 * Shared prompt rules appended to every system prompt
 */
export const SHARED_PROMPT_RULES = `
STRICT RULES:
- You MUST return valid JSON matching the provided schema.
- Every point must contain at least one specific detail from the user input.
- Do not invent statistics, names, or details the user did not provide.
- If you lack information, use fewer points rather than fabricating.
- Do not use placeholder brackets like [Company Name].

DO NOT:
- DO NOT invent numbers or metrics not in the input.
- DO NOT add company names or titles not mentioned.
- DO NOT generate more than 4 sections or 4 points per section.
- DO NOT use phrases: "in today's fast-paced world", "leverage", "synergy", "passionate about", "excited to".`;

/**
 * Shared few-shot examples for generation functions.
 * Returns 3 examples: job interview, board presentation, client pitch.
 */
export const FEW_SHOT_EXAMPLES = {
  jobInterview: {
    input: "interview for product manager role, 5 years experience, led a team of 8, shipped 3 major features last year, strong in data analysis and user research",
    onePager: {
      title: "Product Manager Interview Prep",
      context_line: "Experience overview for hiring manager",
      sections: [
        { title: "Track Record", points: [
          "**5 years in product management** — moved from individual contributor to leading a team of 8.",
          "Shipped **3 major features last year**, each driven by user research and data analysis."
        ]},
        { title: "Core Strengths", points: [
          "**Data-driven decision making** — prioritizes roadmap items based on usage metrics and user interviews.",
          "Strong **user research skills** — conducts discovery interviews and translates findings into specs."
        ]},
        { title: "Next Step", points: [
          "Discuss how these skills apply to **your team's current product challenges**."
        ]}
      ]
    },
    script: {
      title: "Product Manager Interview Script",
      total_duration: "2-3 minutes",
      sections: [
        { name: "Opening", duration: "15 seconds", content: "Thanks for meeting with me. I've spent 5 years in product management, most recently leading a team of 8.", cue: "Make eye contact, confident posture" },
        { name: "Track Record", duration: "45 seconds", content: "Last year my team shipped 3 major features. Each one started with user research — real conversations with customers — then validated with data before we committed engineering resources.", cue: "Slow down on the number '3 major features'" },
        { name: "The Ask", duration: "20 seconds", content: "I'd love to hear about what your team is working on and where my experience with data-driven product decisions could contribute.", cue: "Lean forward, genuine curiosity" }
      ],
      key_phrases: ["team of 8", "3 major features", "data-driven"]
    },
    parsed: {
      audience: "Hiring manager",
      audience_detail: "Product team lead evaluating candidate fit for PM role",
      audience_confidence: 0.8,
      subject: "Product manager job interview",
      subject_detail: "5 years experience, led team of 8, shipped 3 major features, strengths in data analysis and user research.",
      subject_confidence: 0.95,
      goal: "Demonstrate product management expertise and land the role",
      goal_confidence: 0.9,
      tone: "confident",
      tone_confidence: 0.8,
      urgency: "this week",
      suggested_format: "one-pager",
      suggested_length: "standard",
      summary: "PM Interview Prep"
    }
  },

  boardPresentation: {
    input: "quarterly update for the board, revenue hit $2.1M this quarter, up from $1.5M, churn dropped to 3%, launching mobile app next month, need approval for $500K marketing budget",
    onePager: {
      title: "Q4 Board Update",
      context_line: "Quarterly performance and budget request for the board",
      sections: [
        { title: "Revenue Growth", points: [
          "Revenue reached **$2.1M this quarter**, up from $1.5M — a 40% increase.",
          "Churn dropped to **3%**, indicating strong product-market fit."
        ]},
        { title: "What's Next", points: [
          "**Mobile app launching next month** — extends reach to users who primarily access via phone."
        ]},
        { title: "The Ask", points: [
          "Approve **$500K marketing budget** to support the mobile launch and sustain growth momentum."
        ]}
      ]
    },
    script: {
      title: "Q4 Board Update Script",
      total_duration: "2-3 minutes",
      sections: [
        { name: "Opening", duration: "15 seconds", content: "Good morning. This quarter we hit $2.1M in revenue, up 40% from $1.5M last quarter.", cue: "Start with the strongest number" },
        { name: "Metrics", duration: "30 seconds", content: "Churn dropped to 3%. Customers are staying and expanding. This gives us a solid foundation for what's next.", cue: "Pause after the churn number" },
        { name: "Mobile Launch", duration: "30 seconds", content: "Next month we're launching our mobile app. This is our biggest growth lever — it meets users where they already are.", cue: "Show confidence about the timeline" },
        { name: "The Ask", duration: "20 seconds", content: "To maximize this launch, I'm requesting a $500K marketing budget. This funds paid acquisition, content, and launch events.", cue: "Direct eye contact with the board" }
      ],
      key_phrases: ["$2.1M", "3% churn", "$500K marketing budget"]
    },
    parsed: {
      audience: "Board of directors",
      audience_detail: "Board members evaluating quarterly performance and approving budget requests",
      audience_confidence: 0.95,
      subject: "Q4 performance update and marketing budget request",
      subject_detail: "Revenue hit $2.1M (up from $1.5M), churn at 3%, mobile app launching next month. Requesting $500K marketing budget.",
      subject_confidence: 0.95,
      goal: "Get board approval for $500K marketing budget",
      goal_confidence: 0.95,
      tone: "confident",
      tone_confidence: 0.85,
      urgency: "this week",
      suggested_format: "one-pager",
      suggested_length: "standard",
      summary: "Q4 Board Budget Request"
    }
  },

  clientPitch: {
    input: "pitching web design services to a restaurant owner, they have an outdated website with no mobile version, i charge $3000 for a full redesign, 4 week turnaround, includes SEO setup",
    onePager: {
      title: "Restaurant Website Redesign",
      context_line: "Web design proposal for restaurant owner",
      sections: [
        { title: "The Problem", points: [
          "Current website is **outdated with no mobile version** — customers searching on their phones can't find or navigate the site.",
          "Competitors with modern sites are **capturing local search traffic** that should be going to you."
        ]},
        { title: "The Solution", points: [
          "Full website redesign — **modern, mobile-friendly, built for how people actually search** for restaurants.",
          "**SEO setup included** so the site ranks for local searches from day one."
        ]},
        { title: "Next Step", points: [
          "**$3,000 flat fee, 4-week turnaround**. I'll start with a mockup so you can see the direction before committing."
        ]}
      ]
    },
    script: {
      title: "Restaurant Web Design Pitch",
      total_duration: "30-60 seconds",
      sections: [
        { name: "Opening", duration: "10 seconds", content: "I took a look at your current website. It's not showing up well on phones, and that's where most of your customers are searching.", cue: "Be direct but not critical" },
        { name: "Solution", duration: "20 seconds", content: "I'd rebuild it from scratch — mobile-first design, proper SEO so you show up in local searches, and a layout that makes it easy to find your menu and hours.", cue: "Focus on their benefit, not your skills" },
        { name: "The Ask", duration: "15 seconds", content: "It's $3,000, takes 4 weeks. I'll show you a mockup first so you know exactly what you're getting before we start.", cue: "Confident, no hedging on the price" }
      ],
      key_phrases: ["mobile-first", "$3,000", "4 weeks"]
    },
    parsed: {
      audience: "Restaurant owner",
      audience_detail: "Small business owner with outdated website, likely not tech-savvy, cares about getting more customers",
      audience_confidence: 0.9,
      subject: "Website redesign proposal",
      subject_detail: "Full redesign for outdated restaurant website with no mobile version. Includes SEO setup. $3,000, 4-week turnaround.",
      subject_confidence: 0.95,
      goal: "Win the web design contract",
      goal_confidence: 0.9,
      tone: "balanced",
      tone_confidence: 0.8,
      urgency: "not specified",
      suggested_format: "one-pager",
      suggested_length: "quick",
      summary: "Restaurant Redesign Pitch"
    }
  }
};

/**
 * Validate one-pager output structure and enforce limits
 */
export function validateOnePagerOutput(data: unknown): { valid: boolean; error?: string } {
  const d = data as Record<string, unknown>;
  if (!d.title || typeof d.title !== "string") return { valid: false, error: "Missing or invalid title" };
  if (!d.context_line || typeof d.context_line !== "string") return { valid: false, error: "Missing context_line" };
  if (!Array.isArray(d.sections)) return { valid: false, error: "Missing sections array" };
  if (d.sections.length > 4) return { valid: false, error: "Too many sections (max 4)" };
  for (const s of d.sections as Array<Record<string, unknown>>) {
    if (!s.title || !Array.isArray(s.points)) return { valid: false, error: "Invalid section structure" };
    if ((s.points as unknown[]).length > 4) return { valid: false, error: `Section "${s.title}" has too many points (max 4)` };
  }
  return { valid: true };
}

/**
 * Validate script output structure and enforce limits
 */
export function validateScriptOutput(data: unknown): { valid: boolean; error?: string } {
  const d = data as Record<string, unknown>;
  if (!d.title || typeof d.title !== "string") return { valid: false, error: "Missing or invalid title" };
  if (!Array.isArray(d.sections)) return { valid: false, error: "Missing sections array" };
  if (d.sections.length > 7) return { valid: false, error: "Too many sections (max 7)" };
  for (const s of d.sections as Array<Record<string, unknown>>) {
    if (!s.name || !s.content || !s.duration) return { valid: false, error: "Invalid section structure" };
  }
  return { valid: true };
}

/**
 * Validate parsed context output structure
 */
export function validateParsedContextOutput(data: unknown): { valid: boolean; error?: string } {
  const d = data as Record<string, unknown>;
  if (!d.audience || typeof d.audience !== "string") return { valid: false, error: "Missing audience" };
  if (!d.subject || typeof d.subject !== "string") return { valid: false, error: "Missing subject" };
  if (!d.goal || typeof d.goal !== "string") return { valid: false, error: "Missing goal" };
  return { valid: true };
}
