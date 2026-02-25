

## Typewriter Stagger Animation

Replace the current slide transition with a character-by-character typewriter effect where each letter staggers in sequentially, then staggers out before the next word appears.

### How it works

1. Each word in the rotation cycle gets broken into individual characters
2. Characters animate in one-by-one with a slight delay between each (stagger)
3. After a brief hold, characters animate out in reverse (or all at once)
4. Next word begins its stagger-in sequence

### Technical approach

**File: `src/pages/Landing.tsx`**

- Keep `framer-motion`'s `AnimatePresence` and `motion` for orchestration
- Instead of animating the whole word as one `motion.span`, map each character to its own `motion.span` with a staggered `delay` based on index
- Use `staggerChildren` via `motion` variants for clean orchestration:
  - **Container variant**: `staggerChildren: 0.04` (40ms per letter)
  - **Letter variant**: animate `opacity` from 0→1 and slight `y` offset, with exit reversing
- Keep the 1-second interval but adjust to account for animation duration — increase to ~1.8s so the full stagger-in completes, holds briefly, then exits before the next word
- Add a blinking cursor `|` after the last visible character using CSS `animate-blink` (already exists in `TypewriterText.tsx` patterns)

### Visual result

```text
Word: "process"
Frame 1: p|
Frame 2: pr|
Frame 3: pro|
...
Frame 7: process|
(hold ~400ms)
(fade out all at once)
Next word begins
```

### Timing breakdown
- ~40ms per character stagger = ~280ms for a 7-letter word
- ~500ms hold
- ~200ms exit
- Total cycle: ~1.5–1.8s per word (interval adjusted accordingly)

