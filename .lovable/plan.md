

# Add "Early Concept" AI Parse Animation

## Overview
Add a short, looping animation showing the early concept of PitchVoid's core flow: **Upload PDF -> AI Parses -> AI Thinks -> Talking Points Created**. This is presented as an early concept sketch -- rough, wireframe-style -- so interviewers understand this was the initial vision. When they visit the live product, they'll see how it evolved.

## Placement
Right after the existing "Where it started" section, still under the **01 -- Early Concept** umbrella. It will be a sub-section within the same conceptual area, not a new numbered section. Think of it as "here's the problem" (existing) followed by "here's what I initially envisioned" (new).

## Visual Style
- **Sketch / lo-fi aesthetic** to reinforce "early concept" -- dashed borders, hand-drawn feel, muted colors
- Matches the lo-fi wireframe style already used in `WireframesSection` (dashed borders, skeleton shapes)
- A small label like *"Early concept sketch"* to make it clear this isn't the final product
- Dark theme consistent with the rest of the case study

## Animation Sequence (auto-plays on scroll, loops every ~8s)

| Phase | Duration | Visual |
|-------|----------|--------|
| **1. Upload** | 0-2s | A dashed file drop zone. A "pitch_deck.pdf" file icon slides in. A thin progress bar fills. |
| **2. Parse** | 2-4s | The file "opens" -- skeleton text lines shimmer in one by one, simulating content extraction. |
| **3. Think** | 4-5.5s | A sparkles icon pulses. Typewriter text cycles through: "Analyzing audience...", "Finding key points...", "Structuring narrative..." |
| **4. Output** | 5.5-7.5s | 3 talking-point cards fade/slide up: rough bullet items like "Market size: $2.4B", "3x faster", "Live demo ready" |
| **Reset** | 7.5-8s | Brief fade, then loop |

## Files to Change

### New file: `src/components/case-study/AIParseAnimationSection.tsx`
- Uses `framer-motion` for all animations and `useInView` to trigger
- `useState` + `useEffect` with a timer to cycle through 4 phases
- Icons from `lucide-react`: `FileUp`, `Sparkles`, `MessageSquare`
- Lo-fi dashed-border styling (matching `LoFiFrame` pattern from WireframesSection)
- Labeled "Early concept sketch" so it reads as a design artifact, not a finished feature

### Modified file: `src/pages/CaseStudy.tsx`
- Import `AIParseAnimationSection`
- Place it directly after `EarlyConceptSection`, before `UserFlowSection`

## Technical Details
- Phase state managed by a `useEffect` interval that cycles through `'upload' | 'parse' | 'think' | 'output'`
- Each phase uses `AnimatePresence` with fade/slide transitions
- The `TypewriterText` component (already exists at `src/components/ui/TypewriterText.tsx`) will be reused for the "thinking" phase text
- Loops automatically with `setInterval`, resets state cleanly
- All styling uses existing dark theme tokens (`bg-background`, `border-border`, `text-muted-foreground`)
