

# Plan: Typewriter Progress Loading Animation

## Overview

Replace the current loading animation (pulsing ring + spinner) with an elegant typewriter effect that types out the generation phase messages letter-by-letter with a blinking cursor, creating an "AI thinking" aesthetic.

## Visual Design

```text
┌─────────────────────────────────────┐
│                                     │
│            ✨ (Sparkles icon)       │
│                                     │
│   Crafting narrative...|            │
│        (typewriter text + cursor)   │
│                                     │
│   This usually takes 10-15 seconds  │
│                                     │
└─────────────────────────────────────┘
```

## Implementation

### 1. Create TypewriterText Component

**File:** `src/components/ui/TypewriterText.tsx` (new file)

A reusable component that:
- Accepts `text` prop and types it character-by-character
- Shows a blinking cursor (`|`) at the end
- Resets and retypes when `text` changes
- Configurable typing speed (default ~50ms per character)

### 2. Update Dashboard Loading State

**File:** `src/pages/Dashboard.tsx`

Replace the current Step 5 loading UI (lines 1466-1479):

**Current:**
- Pulsing magenta ring with `animate-ping`
- Spinning `Loader2` icon
- Static phase text

**New:**
- Central `Sparkles` icon with subtle glow animation
- TypewriterText component displaying phase messages
- Same helper text below

### 3. Add CSS Animation for Cursor Blink

**File:** `src/index.css`

Add keyframe animation for the blinking cursor effect:
```css
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
```

## Technical Details

### TypewriterText Component Logic

```typescript
// Pseudocode
const TypewriterText = ({ text, speed = 50 }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    setDisplayedText(''); // Reset on text change
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  
  return (
    <span>
      {displayedText}
      <span className="animate-blink">|</span>
    </span>
  );
};
```

### Dashboard Changes

Replace lines 1466-1479 with:
- Sparkles icon with gradient glow effect
- TypewriterText component with `generationPhase` as input
- Maintain existing helper text

## Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| Create | `src/components/ui/TypewriterText.tsx` | New typewriter component |
| Edit | `src/pages/Dashboard.tsx` | Update Step 5 loading UI |
| Edit | `src/index.css` | Add blink animation keyframe |

## Benefits

- Creates an "AI thinking" aesthetic that feels more intelligent
- Letter-by-letter reveal builds anticipation
- Blinking cursor is universally recognized as "processing"
- Matches the premium, minimal design language of PitchVoid

