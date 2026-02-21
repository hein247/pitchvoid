
# Focus Mode -- Full Implementation Plan

## Overview
Create a new `FocusMode.tsx` component that replaces the current basic practice mode. It is a single full-screen overlay (no route change) with three phases: Centering Sequence, Teleprompter, and Cool-Down.

## Changes

### 1. New file: `src/components/dashboard/FocusMode.tsx`

A single component receiving `scriptData: ScriptData` and `onExit: () => void`.

**Phase 1 -- Centering Sequence (~18-20s, skippable)**
- Fixed full-screen black overlay (`z-50`)
- 1.5s silence, then SVG breathing circle (stroke-only, purple at 15% opacity, 40px to 160px over 4s inhale, back over 4s exhale), then fades out
- `context_line` fades in (13px, muted), holds 3s, fades out
- Opener text fades in (20px, brighter), holds 3s, fades out
- 1s black, "ready" fades in (14px, purple at 40%), holds 1.5s, fades out
- "Skip" button always visible bottom-right (10px, nearly invisible)
- Timing driven by chained `setTimeout` calls stored in a ref for cleanup on skip/unmount
- All transitions use Apple easing: `cubic-bezier(0.25, 0.1, 0.25, 1.0)`

**Phase 2 -- Teleprompter**

Top bar (fixed, semi-transparent):
- Left: Exit button (X)
- Center: Timer (M:SS, mono font, using `requestAnimationFrame` with start timestamp)
- Right: Speed pills -- three small buttons `0.75x | 1x | 1.25x`, default `1x`, active pill gets purple border (`rgba(168,85,247,0.5)`), all muted styling

Line scrolling:
- All lines rendered in a vertical stack inside a container
- Current line centered via `transform: translateY(...)` on the container, animated with Apple easing (CSS transition ~400ms)
- Current line: 22px, `rgba(240,237,246,0.85)`, full opacity
- Previous lines: fade to 15% opacity, shift up
- Next lines: 20% opacity
- Transition-type lines render at 18px italic with a shorter hold time (1.5s base)

Per-line timing:
- Word count of line text divided by 130 WPM = base seconds per line (minimum 2s)
- Opener/closer: use their `duration` field if present (parse "10 sec" to 10s), else WPM calc
- Transition lines: fixed 1.5s base hold
- Pause lines: 3s hold
- Speed multiplier divides the calculated time (0.75x = slower = time/0.75, 1.25x = faster = time/1.25)
- Auto-advances via `setTimeout` per line, recalculated when speed changes

Interactions:
- Tap anywhere (except top bar) to pause/resume; when paused, show "paused" below current line (12px, `rgba(240,237,246,0.15)`) and stop timer
- Swipe up = advance to next line, swipe down = go to previous line (touch gesture handling with 50px threshold)
- Keyboard: Space = pause/resume, Arrow keys = prev/next, Escape = exit

Ambient pulse:
- CSS keyframe animation on the background container cycling between `#000000` and `#020103` over 4s, infinite loop

**Phase 3 -- Cool-Down**
- Triggered when the last line (closer) finishes
- 2s black, then "You're ready." centered (16px white) fades in, holds 3s
- Total elapsed time fades in below (small, muted)
- 2s later, two buttons fade in: "Practice again" (outline) and "Done" (primary gradient)
- "Done" calls `onExit()`; "Practice again" resets all state and restarts from Phase 1

**Cross-cutting:**
- Screen Wake Lock: `navigator.wakeLock.request('screen')` on mount, release on unmount (wrapped in try/catch)
- Internal state machine: `phase` = `'centering' | 'teleprompter' | 'cooldown'`
- All text uses `font-sans` (Be Vietnam Pro)

### 2. Modified file: `src/pages/Dashboard.tsx`

- Import `FocusMode` component
- Replace the existing practice mode block (lines ~938-1004) with:
  ```
  if (isPracticeMode && scriptData) {
    return <FocusMode scriptData={scriptData} onExit={() => {
      setIsPracticeMode(false);
      setIsPlaying(false);
      setPracticeTimer(0);
    }} />;
  }
  ```
- Remove `practiceSection` state (no longer needed; FocusMode manages its own state)
- Keep `isPracticeMode` toggle and `practiceTimer` state for the exit callback
- Remove the old practice-mode keyboard handler from the `useEffect` (lines 245-250) since FocusMode handles its own keys
- Remove the old practice timer `useEffect` (lines 221-227) since FocusMode has its own RAF-based timer

## Technical Notes

- The `migrateToLines()` function in `ScriptViewer.tsx` already normalizes old section-based data to flat `ScriptLine[]`. FocusMode will import and reuse it (or receive already-migrated data).
- The swipe gesture uses inline touch handlers (similar pattern to `useSwipeGesture` hook but vertical), with a 50px threshold.
- `translateY` positioning: calculate the Y offset needed to center line N, then set `transform: translateY(Npx)` on the lines container with a CSS transition.
- WPM calculation: `Math.max(2, (wordCount / 130) * 60)` seconds per line, then divided by the speed multiplier.
