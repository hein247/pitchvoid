
# Plan: Add WebGL Shader Background Component

## Overview
Create a new `ShaderBackground` component using WebGL for animated, procedural background effects. This will provide a more dynamic, immersive visual experience compared to the current CSS-based `GridBackground` component.

## Current State
- **GridBackground.tsx** exists with Framer Motion-based starfield and floating particles animations
- Pages currently use CSS classes (`grain-bg hero-gradient`) with inline background colors (`#0F0518`)
- `GridBackground` is not actively imported anywhere in the codebase

## Implementation Steps

### Step 1: Create the ShaderBackground Component
Create `src/components/ui/ShaderBackground.tsx` with the WebGL plasma line shader provided.

Key features of the shader:
- Animated plasma-like flowing lines
- Purple/violet color scheme matching brand colors
- Edge fade for clean blending with content
- Performance-optimized with 16 lines per group

### Step 2: Update Shader Colors to Match Brand
Modify the shader's color constants to align with PitchVoid brand:
- `lineColor` → Deep Violet (`hsl(258 90% 66%)` → `vec4(0.55, 0.36, 0.96, 1.0)`)
- `bgColor1` → Midnight Purple (`#0F0518` → `vec3(0.06, 0.02, 0.09)`)
- `bgColor2` → Surface color (`#1A0A2E` → `vec3(0.1, 0.04, 0.18)`)

### Step 3: Integrate into Landing Page
Replace the current background approach in `Landing.tsx`:

```text
Before:
┌────────────────────────────────────┐
│ <div className="grain-bg hero-     │
│   gradient" style={{backgroundColor│
│   : '#0F0518'}}>                   │
│   [content]                        │
│ </div>                             │
└────────────────────────────────────┘

After:
┌────────────────────────────────────┐
│ <div className="relative min-h-    │
│   screen">                         │
│   <ShaderBackground />             │
│   <div className="relative z-10">  │
│     [content]                      │
│   </div>                           │
│ </div>                             │
└────────────────────────────────────┘
```

### Step 4: Optional Integration for Other Pages
- **Auth.tsx**: Add shader for visual consistency
- **Tour.tsx**: Add shader for onboarding flow
- Keep **Dashboard.tsx** and **Pricing.tsx** with current styling (cleaner for functional pages)

---

## Technical Considerations

### Performance
- WebGL runs on GPU, minimal CPU impact
- Uses `requestAnimationFrame` for smooth 60fps
- Canvas resizes responsively with window
- Cleanup on component unmount prevents memory leaks

### Accessibility
- `pointer-events: none` ensures content remains interactive
- `inset-0` positioning places it behind all content
- No impact on screen readers (decorative element)

### Browser Support
- WebGL is supported in 97%+ of browsers
- Falls back gracefully if WebGL unavailable (just shows no background animation)

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/ui/ShaderBackground.tsx` | Create new |
| `src/pages/Landing.tsx` | Modify - integrate shader |
| `src/pages/Auth.tsx` | Optional - integrate shader |
| `src/pages/Tour.tsx` | Optional - integrate shader |

---

## Testing Checklist
After implementation:
- [ ] Verify animation runs smoothly on desktop
- [ ] Check mobile performance (consider reduced lines for mobile)
- [ ] Confirm content remains readable over shader
- [ ] Test WebGL fallback behavior
- [ ] Verify no layout shifts or z-index conflicts
