

## Make the Live Demo Section Stand Out

### What Changes
Add visual separation to the "Try it now" section so it pops against the rest of the landing page. The section will get:

1. **Subtle background tint** — A faint radial gradient glow (magenta/violet) behind the section to create depth
2. **Top/bottom divider lines** — Thin gradient horizontal rules to frame the section
3. **Larger vertical padding** — More breathing room above and below

### Implementation

**File: `src/components/landing/LiveDemo.tsx`**

Update the outer `<section>` wrapper from a plain container to one with:
- A soft radial gradient background using brand colors (`--primary` / `--secondary`) at very low opacity (~4-6%)
- Top and bottom 1px gradient dividers (fade from transparent → brand color → transparent)
- Increased vertical padding (`py-20 sm:py-32`)

```text
┌─────────────────────────────────┐
│  gradient divider line (1px)    │
│                                 │
│   radial glow background        │
│   ┌─────────────────────────┐   │
│   │  Try it now             │   │
│   │  textarea + button      │   │
│   └─────────────────────────┘   │
│                                 │
│  gradient divider line (1px)    │
└─────────────────────────────────┘
```

Single file change — `src/components/landing/LiveDemo.tsx` only.

