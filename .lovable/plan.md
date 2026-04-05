

# Fix: Project Cards Invisible on Mobile

## Problem
The project cards use a 50% opacity background (`bg-[hsl(260_20%_10%/0.5)]`) with `backdrop-blur-md`. Against the dark background that fades from the EtheralShadow, the cards become nearly invisible — text and borders blend into the background completely.

## Fix

### `src/components/dashboard/ProjectCard.tsx`
- Increase card background opacity from `0.5` to `0.85` so cards are clearly visible against any background
- Change `bg-[hsl(260_20%_10%/0.5)]` → `bg-[hsl(260_20%_10%/0.85)]`
- Increase hover state from `0.6` → `0.9`
- Increase border opacity from `border-white/15` → `border-white/20`
- These changes make cards solid enough to read regardless of what's behind them

### What stays the same
- All card content, layout, interactions, dropdown menu
- GlowingEffect wrapper
- Font choices, format pills, timestamps
- Motion animations

