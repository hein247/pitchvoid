

## Live Demo Section on Landing Page

### Overview
Add a "Try it now" section between the hero and HowItWorks animation on the landing page. Visitors can type a brain dump, hit Generate, and see a real one-pager output without signing up. Rate limited to 1 generation per IP per 24 hours.

### Architecture

```text
Landing Page Layout:
  Hero Section
  ↓
  NEW: LiveDemo Section  ← component: src/components/landing/LiveDemo.tsx
  ↓
  HowItWorks animation
  ↓
  CTA / Footer
```

### 1. New Edge Function: `generate-demo`

A stripped-down version of `generate-one-pager` that:
- Skips authentication (no `authenticateRequest` call)
- Uses IP-based rate limiting: 1 request per 24 hours per IP via the existing `rate_limits` table and `checkRateLimit`/`getClientIP` utilities
- Uses the same AI prompt/system as `generate-one-pager` but with hardcoded default writing preferences
- Skips credit checks, profile lookups, version saving, and `incrementPitchCount`
- Returns the same JSON output schema (`title`, `context_line`, `sections[]` with `points[]`)
- Input validation via existing `validateGenerateOnePagerInput` (scenario only, no files)

Rate limit config: `{ windowMs: 24 * 60 * 60 * 1000, maxRequests: 1 }`

### 2. New Component: `src/components/landing/LiveDemo.tsx`

**UI Structure:**
- Section heading: "Try it now"
- Textarea matching dashboard brain-dump style (rounded-[20px], purple glow shadow, same placeholder text)
- "Generate" pill button (magenta gradient, same as hero CTA style)
- No microphone, no file upload icons
- Loading state: reuse `GenerationSkeleton` or a simplified shimmer
- Output: render using the existing `OnePager` component from `src/components/dashboard/OnePager.tsx` with the same styling (purple section labels, bold numbers, swipeable cards)
- Post-output CTA: "Sign up to save this, practice it, and get 2 more free." with a `[Create account →]` button linking to `/auth`
- Rate limit error: show a toast or inline message when the visitor has already used their free demo

**State management:** Local state only — `input`, `isGenerating`, `output`, `error`.

**API call:** Uses `supabase.functions.invoke('generate-demo', { body: { scenario } })` with the anon key (no auth header needed).

### 3. Landing Page Integration

In `src/pages/Landing.tsx`, import and place `<LiveDemo />` between the hero `<section>` and `<HowItWorks />`.

### 4. Deploy Config

Add `[functions.generate-demo]` with `verify_jwt = false` to `supabase/config.toml`.

### Technical Details

- **Rate limit key format:** `demo:{client-ip}` — reuses existing `rate_limits` table and `checkRateLimit` function
- **Security:** No auth bypass of the main endpoint. Completely separate function with no credit system access. IP rate limiting prevents abuse.
- **AI call:** Reuses `callAIWithRetry`, `validateOnePagerOutput`, `detectHallucinatedNumbers` from `_shared/aiHelpers.ts`
- **Output rendering:** Reuses the `OnePager` component directly so styling matches the dashboard exactly (purple labels at `hsl(25 75% 65% / 0.9)`, bold white numbers, card layout)

### Files Changed
| File | Action |
|------|--------|
| `supabase/functions/generate-demo/index.ts` | Create — anonymous one-pager generation with IP rate limit |
| `src/components/landing/LiveDemo.tsx` | Create — demo input + output section |
| `src/pages/Landing.tsx` | Edit — add `<LiveDemo />` between hero and HowItWorks |
| `supabase/config.toml` | Edit — add `generate-demo` function config |

