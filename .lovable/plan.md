

# Case Study Page: PitchVoid UX Redesign Exploration

## Overview
A standalone, self-contained page at `/case-study` that presents your UX redesign thinking for PitchVoid. It uses a completely different design system (Teal/Deep Blue/Gold on white) to visually separate it from the live product, making it clear this is a design exploration, not part of the app itself.

## Route
- Path: `/case-study`
- Not linked from the main navigation or landing page -- accessible only by direct URL
- Added to `App.tsx` routes above the catch-all

## Design System (isolated to this page only)
- **Background**: White (#FFFFFF) with light gray sections (#F8FAFC)
- **Primary**: Teal (#2DD4BF)
- **Secondary**: Deep Blue (#1E3A8A)
- **Accent**: Gold (#F59E0B)
- **Typography**: Inter for headings, system-ui for body
- All colors applied via inline Tailwind classes -- no changes to the global theme

## Page Structure (single scrollable page, 7 sections)

### 1. Hero / Introduction
- "DESIGN CASE STUDY" label in small uppercase teal
- Title: "Redesigning PitchVoid" in large Deep Blue text
- Subtitle explaining context: this is a design exploration of an existing live product
- A "View Live Product" link to pitchvoid.lovable.app
- Clean white background, max-width ~900px centered

### 2. The Problem
- Brief analysis of current UX pain points (dark theme accessibility, unclear flow, format confusion)
- 3 problem cards with icons highlighting specific issues
- Light gray background section

### 3. Proposed Flow (5 steps)
Each step is a numbered card showing:
- Step number + title
- Description of the improvement
- A simple wireframe-style mockup built with styled divs (not images)

Steps:
1. **Enhanced Landing** -- cleaner headline hierarchy, prominent CTA
2. **Redesigned Input** -- larger textarea, character counter, progress indicator
3. **Format Selection** -- side-by-side comparison cards with previews
4. **Processing Experience** -- transparent 3-phase progress with time estimate
5. **Output View** -- before/after split-screen concept

### 4. Design Decisions
- Cards explaining key decisions: why teal over purple, why white backgrounds for a productivity tool, typography choices, accessibility considerations (WCAG AA contrast ratios)

### 5. Interactive Mockups
- Static but styled UI mockups built directly in React:
  - A mock input screen with character counter and "AI Ready" indicator
  - A mock format selection with two side-by-side cards (One-Pager vs Script)
  - A mock processing screen with phased progress bar
- These are visual-only components, no real functionality

### 6. Before vs After
- Side-by-side comparison showing current dark UI description vs proposed clean UI description
- Framer Motion scroll-triggered animations

### 7. Footer
- "This is a design exploration by [Your Name]"
- Link back to the live product
- Date

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/CaseStudy.tsx` | Main page component, imports all sections |
| `src/components/case-study/CaseStudyHero.tsx` | Hero/intro section |
| `src/components/case-study/ProblemSection.tsx` | Current UX pain points |
| `src/components/case-study/ProposedFlowSection.tsx` | 5-step redesigned flow |
| `src/components/case-study/DesignDecisions.tsx` | Rationale cards |
| `src/components/case-study/InteractiveMockups.tsx` | Static UI mockups |
| `src/components/case-study/BeforeAfterSection.tsx` | Comparison section |
| `src/components/case-study/CaseStudyFooter.tsx` | Footer with attribution |

## Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add `Route path="/case-study"` with lazy import |

## Technical Notes
- Uses `framer-motion` (already installed) for scroll-triggered animations via `useInView`
- Follows the same component pattern as the existing Portfolio page (section-based composition)
- All styling is self-contained via Tailwind utility classes with hardcoded hex values -- zero impact on the existing PitchVoid dark theme
- Inter font loaded via Google Fonts import within the component (scoped)
- Responsive: stacks to single column on mobile, side-by-side on desktop
- No backend or database involvement

