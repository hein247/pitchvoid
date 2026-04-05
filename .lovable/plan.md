

# Redesign ScriptViewer to Match OnePager Editorial Style (Peach Identity)

## What Changes

The ScriptViewer gets wrapped in the same editorial container card as the OnePager, but with a warm peach gradient instead of purple. The internal line rendering shifts from left-border + line-numbers to peach-dot bullets matching the OnePager's bullet pattern. Pause markers get elegant centered divider lines.

## Technical Plan

### Single file: `src/components/dashboard/ScriptViewer.tsx`

**Container**: Wrap all content in a `rounded-[20px]` card with:
- `background: linear-gradient(180deg, rgba(200,150,100,0.12) 0%, rgba(20,18,26,0.95) 40%, rgba(14,12,20,0.98) 100%)`
- `border: 1px solid rgba(200,150,100,0.15)`
- Padding: `p-7 sm:p-12`, `overflow-hidden`
- Remove the floating radial glow div

**Title row** (new — currently missing title display):
- Add title + Copy All in a flex row (same pattern as OnePager)
- Title: `font-display` (Cormorant Garamond), weight 400, `text-[28px] sm:text-[42px]`, color `rgba(240,237,246,0.95)`, letter-spacing `-0.01em`
- Copy All button: top-right, desktop-only, muted style (identical to OnePager)

**Context line + format tag**:
- Context: Be Vietnam Pro, 13px, `rgba(240,237,246,0.4)`
- Add "Script" tag pill: `background rgba(200,150,100,0.15)`, `border 1px solid rgba(200,150,100,0.3)`, text `rgba(200,150,100,0.8)`, 12px, rounded-full

**Divider**: 1px line `rgba(200,150,100,0.2)`, margin `16px 0 28px 0` mobile, `24px 0 40px 0` desktop

**Duration**: Right-aligned below divider, 12px, `rgba(200,150,100,0.5)`, format `~{total_duration}`

**Line rendering changes**:

- **Opener/Closer**: Remove left-border style and "Open with"/"Close with" section labels. Replace with:
  - 6px peach dot at `rgba(200,150,100,0.7)`, flex-start
  - Text: 17px desktop / 15px mobile, weight 500, `rgba(240,237,246,0.92)`, line-height 1.7
  - Coaching note below: `font-display italic`, 14px, `rgba(200,150,100,0.4)`, ◆ marker
  - Duration tag: 11px, `rgba(200,150,100,0.35)`

- **Regular lines**: Remove line numbers and left-border. Replace with:
  - 6px peach dot at `rgba(200,150,100,0.5)`
  - Text: 16px desktop / 14px mobile, weight 400, `rgba(240,237,246,0.85)`, line-height 1.7
  - Emphasis text: white, weight 600
  - Gap between lines: `gap-5` (20px)

- **Pause markers**: Remove dot/border. Show centered coaching note:
  - Flanked by horizontal lines: `rgba(200,150,100,0.1)`
  - Text: `font-display italic`, 14px, `rgba(200,150,100,0.35)`
  - Layout: flex row with two `flex-1` divider lines and centered text
  - Vertical margin: 12px above/below

- **Transition lines**:
  - 6px peach dot at `rgba(200,150,100,0.3)`
  - Text: Be Vietnam Pro italic, 14px, `rgba(240,237,246,0.5)`

**Copy behavior**: Keep tap-to-copy with brief "Copied" indicator, no visible button per line.

### What stays the same
- All TypeScript interfaces (`ScriptData`, `ScriptLine`, `ScriptViewerProps`)
- `migrateToLines()` function
- `parseMarkdownBold()` and `renderLineText()` helpers
- `SwipeableLineWrapper` component
- `refineAnimationKey` prop and stagger animation
- `onDeleteLine` support
- `copyLine` / `copyAll` logic
- All line type handling (opener, line, pause, transition, closer)

