

# Add Orbital Pattern to OnePager Output and Empty States

## What Changes

The uploaded orbital pattern (overlapping ellipses in peach/amber/purple) gets used in two places:

1. **OnePager output watermark** — A faint version of the pattern sits behind the generated one-pager content, positioned top-right, large and subtle (opacity ~0.06-0.08), giving the premium document a branded feel without interfering with readability.

2. **Empty states** — When the user has no projects yet ("No pitches yet" in ProjectsList) and when no output is loaded, the orbital pattern replaces the generic icon as a decorative illustration, displayed at moderate opacity (~0.15-0.2) as a centered background element.

## Implementation

### Step 1: Copy the asset into the project
Copy `PitchVoid_Logo_Colored-2.png` to `src/assets/pitchvoid-orbital.png`.

### Step 2: OnePager watermark (`src/components/dashboard/OnePager.tsx`)
Inside the main container (the one with the purple gradient background), add an `<img>` of the orbital pattern:
- Position: `absolute`, top-right corner, offset slightly (`top: -40px, right: -60px`)
- Size: ~320px on desktop, ~200px on mobile
- Opacity: `0.06`
- `pointer-events: none`, `select: none`
- Slight rotation (`rotate: 15deg`) for visual interest

### Step 3: Empty state in ProjectsList (`src/components/dashboard/ProjectsList.tsx`)
Replace the current empty state icon (the `FileText` icon inside a bordered box) with the orbital pattern image:
- Centered, ~120px wide
- Opacity: `0.2`
- Keep the existing "No pitches yet" and "Describe your pitch above" text below it

### What stays the same
- All OnePager functionality (copy, animations, sections, refinement)
- ProjectsList grid rendering and loading state
- No new dependencies

