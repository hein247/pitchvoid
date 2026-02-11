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
    // Check for edge case "needs_more" response
    if (parsed && typeof parsed === "object" && (parsed as Record<string, unknown>).needs_more) {
      return { data: parsed };
    }
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
- DO NOT use phrases: "in today's fast-paced world", "leverage", "synergy", "passionate about", "excited to".

AUDIENCE AWARENESS:
- Adapt tone based on audience type inferred from input:
  - Manager → direct, brief, action-oriented
  - Executive/Board → strategic, numbers-first, bottom-line impact
  - Client → benefit-focused, what's in it for them
  - Interviewer → capability + concrete examples
  - Peer/colleague → casual, practical, skip the formality

CONCISENESS:
- Each point: 15-25 words, scannable in 3 seconds.
- Front-load the key detail in the first 5 words.
- If a point exceeds 30 words, split it or cut the fluff.

NO REPETITION:
- Never restate the same fact across points, even rephrased.
- Every point must add NEW information. If you've said it, move on.

"SO WHAT" RULE:
- Every fact needs its implication. Format: [WHAT happened] — [WHY it matters].
- Never state a metric alone. "$2.1M revenue" → "$2.1M revenue — 40% above target."

OPENER QUALITY:
- Never open with greetings, thank yous, or generic industry statements.
- Open with a surprising fact, bold claim, or specific detail that shows you understand the audience.

SMART INFERENCE:
- When input is sparse, infer context from roles, companies, meeting types, and goals mentioned.
- Never ask for more info — always generate something useful.
- Mark inferred details subtly (e.g., use softer language like "likely" or "typically").

STRUCTURAL VARIETY — pick the pattern that fits the scenario:
- Persuasion: Problem → Solution → Evidence → Ask
- Updates: Results → Insights → Next Steps
- Introductions: Capability → Proof → Fit
- Proposals: Opportunity → Approach → Cost → Ask
Do not default to the same structure every time.

EDGE CASES:
- If input is fewer than 5 words, return: { "needs_more": true, "suggestion": "Try describing who you're talking to and what you need to communicate." }
- If input is non-English, respond in the same language as the input.
- If input has contradictions, use the most specific detail and ignore the vague one.`;

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
    scriptV2: {
      title: "Product Manager Interview Script",
      total_duration: "2-3 minutes",
      opener: {
        line: "I've spent **5 years shipping products** — most recently leading a team of 8 through 3 major launches last year.",
        delivery_note: "Eye contact, confident"
      },
      sections: [
        { name: "Track Record", duration: "~45 sec", points: [
          "Last year my team shipped **3 major features**. Each started with real user conversations, then validated with data before we committed resources.",
          "I led a **team of 8** — product designers, engineers, analysts. My job was clearing blockers and keeping us focused on what users actually needed."
        ]},
        { name: "How I Work", duration: "~30 sec", points: [
          "Every roadmap decision starts with **usage metrics and user interviews** — not gut feelings.",
          "I run **lightweight discovery sprints** — talk to 5 users, find the pattern, build the spec."
        ]},
        { name: "The Ask", duration: "~20 sec", points: [
          "I'd love to hear what your team is tackling right now — and where **data-driven product thinking** could help."
        ], transition: "That's the short version — happy to dig into any of these." }
      ],
      closer: {
        line: "The best products come from teams that **listen before they build** — that's how I work.",
        delivery_note: "Lean in, genuine"
      }
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
    scriptV2: {
      title: "Q4 Board Update Script",
      total_duration: "2-3 minutes",
      opener: {
        line: "We hit **$2.1M this quarter** — that's 40% above last quarter's $1.5M.",
        delivery_note: "Lead with the number"
      },
      sections: [
        { name: "Metrics", duration: "~30 sec", points: [
          "Churn dropped to **3%** — customers are staying and expanding.",
          "This gives us a **solid foundation** for the growth play we're about to make."
        ], transition: "Which brings me to what's next." },
        { name: "Mobile Launch", duration: "~30 sec", points: [
          "Next month we're launching **the mobile app** — our biggest growth lever.",
          "It meets users where they already are — **60% of our traffic is mobile** but we've had no native experience."
        ], transition: "To make this work, here's what I need." },
        { name: "The Ask", duration: "~20 sec", points: [
          "I'm requesting a **$500K marketing budget** — paid acquisition, content, and launch events.",
          "Based on our current CAC, that funds **roughly 2,000 new customers** in the first quarter."
        ]}
      ],
      closer: {
        line: "We've got the momentum, the product, and the plan. **The $500K unlocks the next phase.**",
        delivery_note: "Direct eye contact"
      }
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
    scriptV2: {
      title: "Restaurant Web Design Pitch",
      total_duration: "30-60 seconds",
      opener: {
        line: "I checked your website on my phone — it **doesn't load properly on mobile**, and that's where most of your customers are looking.",
        delivery_note: "Direct, not critical"
      },
      sections: [
        { name: "Solution", duration: "~20 sec", points: [
          "I'd rebuild it **mobile-first** — clean layout, easy to find your menu and hours.",
          "**SEO setup included** so you show up when people search 'restaurants near me.'"
        ], transition: "Here's what it looks like in practice." },
        { name: "The Offer", duration: "~15 sec", points: [
          "It's **$3,000, 4-week turnaround**. I'll show you a mockup first so you know exactly what you're getting."
        ]}
      ],
      closer: {
        line: "Your food's already great — your website should be too. **Let's make it easy for people to find you.**",
        delivery_note: "Warm, confident"
      }
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
  if (d.sections.length > 4) return { valid: false, error: "Too many sections (max 4)" };
  for (const s of d.sections as Array<Record<string, unknown>>) {
    if (!s.name) return { valid: false, error: "Invalid section structure: missing name" };
    // Accept both old (content string) and new (points array) schema
    if (!s.content && !Array.isArray(s.points)) return { valid: false, error: "Invalid section structure: missing content or points" };
  }
  // opener/closer are optional for validation (old schema won't have them)
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
