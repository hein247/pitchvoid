

# HowItWorks Animation Refinement Plan

A comprehensive overhaul across all four axes: visual effects, timing/pacing, content/copy, and mobile experience.

---

## 1. Visual Effects

**Blur transitions between phases** — Add a subtle `filter: blur()` that clears as each phase resolves, creating a "focus pull" cinematic feel.

**Glow pulse on opening line** — Add a soft text-shadow glow that pulses once on "Your brain is a group chat you can't mute" to give it more presence.

**Chaos phase: drift + jitter** — After fragments land, add a subtle continuous float/drift animation (small random x/y oscillation) so they feel alive rather than static.

**Phase transitions: crossfade with scale** — Instead of hard opacity cuts, use slight scale (0.97→1) combined with blur-to-clear for smoother phase handoffs.

**Demo output: accent glow on labels** — Add a faint purple glow on the output section labels (THE PROBLEM, etc.) as they appear, reinforcing brand color.

**Scanline/sweep on parse phase** — Add a translucent horizontal gradient sweep across the "messy input" side during the typewriter, simulating an AI "reading" effect.

---

## 2. Timing & Pacing

Current total loop is ~26s. The chaos phase holds too long and the truth phase drags.

| Phase | Current | Proposed |
|-------|---------|----------|
| Opening line hold | 1.5s | 2s (let it breathe) |
| Chaos flood-in | ~1.4s | ~1.2s (slightly faster, more overwhelming) |
| Chaos sit | 1.5s | 1s (less dead air) |
| Freeze hold | 0.5s | 0.3s |
| Truth lines total | ~6s | ~4.5s (shorter pauses between lines) |
| Pivot hold | 3s | 2s |
| Demo hold | 3s | 2.5s |
| CTA hold | 3s | 2.5s |
| Loop delay | 1.5s | 2s (cleaner reset) |

Target total: ~20s loop (down from ~26s).

---

## 3. Content & Copy

**Chaos fragments** — Replace some generic ones with more relatable, punchy noise:
- Replace "synergy" → "can we align on this?"  
- Replace "pivot" → "deck due tomorrow"  
- Replace "circle back" → "did you see my DM?"  
- Add: "investor meeting in 2 hours"  
- Make "URGENT:" fragment shake slightly for emphasis

**Truth lines** — Tighten:
- Line 1: "You don't need another AI tool." (keep)
- Line 2: "You need one clear minute" (shorter)  
- Line 3: "before you open your mouth." (keep, punchline)

**Demo input** — Make messier and more authentic:
- "ceo wants update tmrw, revenue down 15%, no app yet, competitors crushing it, need to ask for 180k without sounding desperate..."

**Demo tagline** — Sharpen: "Overstimulated → Articulate. In seconds."

---

## 4. Mobile Experience

**Font size floor** — Ensure chaos fragments don't go below 10px on mobile; clamp all text.

**Demo layout** — Switch from side-by-side to stacked (column) layout below 640px with the arrow rotating to ↓.

**Container height** — Increase mobile min-height from 400px to 440px to prevent content clipping in the demo phase.

**Touch indicator** — Add a subtle "scroll to watch" hint text at the bottom on mobile that fades out once animation starts.

**Chaos fragment count on mobile** — Render only the first 12 fragments (skip last 6) on screens < 640px to reduce visual clutter and improve performance.

---

## Technical Approach

All changes are in a single file: `src/components/landing/HowItWorks.tsx`.

- GSAP timeline adjustments for timing
- Add `gsap.to` calls for drift/jitter on chaos fragments after landing
- Use CSS `text-shadow` for glow effects (no new dependencies)
- Add `useMediaQuery` or a ref-based width check for mobile layout adaptations
- Use `sm:` breakpoint classes for responsive demo layout switch

No new dependencies required. All within existing GSAP + Tailwind stack.

