

# Reimagine the LiveDemo Input: "The Void" Prompt Experience

## Concept

Instead of a standard textarea-in-a-box (which every AI app uses), the input becomes **The Void itself** - a breathing, ambient space that responds to the user's presence. No visible box at first. Just a glowing cursor pulsing in empty space, inviting you to start typing. The container materializes around your words as you type.

This is the opposite of "here's a text box, fill it in." This says: "speak into the void."

## Design

### Phase 1: Empty State (no text yet)
- No visible border or box. Just a centered, pulsing placeholder: `"speak into the void..."` in `text-white/20`, with a slow breathing opacity animation (0.15 to 0.3)
- A faint radial glow behind the text area that subtly pulses purple, like the void is listening
- Tool icons (upload, mic) float below the placeholder as ghostly icons (`text-white/12`) that brighten on hover
- No Generate button visible yet

### Phase 2: Active State (user starts typing)
- On first keystroke, the container fades in: a soft border (`border-white/8`) materializes with a 400ms transition
- Background shifts from fully transparent to `rgba(240,237,246,0.03)`
- The placeholder smoothly fades out as real text appears
- Tool icons become more visible (`text-white/40`)
- A subtle purple glow line appears at the bottom of the textarea, growing wider as more text is typed (like a "fullness" indicator - thin at 10 chars, full width at ~200 chars)
- The Generate button fades in at the right side of the toolbar once there are 10+ characters

### Phase 3: Ready State (enough content to generate)
- At ~50 characters, the border brightens to `border-white/15`
- Generate button becomes fully opaque with the brand gradient
- The bottom glow line is now full width and gently pulses
- `Cmd+Enter` hint appears briefly then fades

### The Generate Moment
- On click, the entire input area contracts slightly (scale 0.98) then the content dissolves upward with a particle-like fade
- Skeleton appears below with the existing animation

### Post-Generation
- Input collapses to a single-line read-only summary showing a truncated version of what the user typed, with muted styling
- "Edit" icon to expand back if needed (before sign-up CTA)

## Technical Implementation

### `src/components/landing/LiveDemo.tsx`
- Add `isFocused` and `hasContent` state booleans to drive the phase transitions
- Replace the outer `p-[1px]` animated-gradient-border wrapper with a simpler container that transitions opacity/border
- Add a `contentLength` derived value to control the glow line width
- Textarea: start at `min-h-[56px]` (compact), expand on input, max `min-h-[200px]`
- Generate button: wrapped in `AnimatePresence`, only renders when `input.length >= 10`
- Post-generation: collapse textarea to single line with `overflow-hidden max-h-[40px]`
- Add a bottom glow `<div>` absolutely positioned, width transitions via `style={{ width: \`${Math.min(100, input.length / 2)}%\` }}`

### CSS additions in component (inline styles or tailwind)
- Breathing placeholder animation: CSS keyframes `@keyframes breathe` cycling opacity
- Container materialize: `transition-all duration-500` on border-color, background-color, and box-shadow
- Glow line: `bg-gradient-to-r from-transparent via-primary/40 to-transparent`, width animated

### What stays the same
- All generation logic, file handling, voice recording, error handling
- Output rendering (OnePager + CTA)
- Loading skeleton
- Keyboard shortcut
- File chips styling (appear inside the materialized container)

