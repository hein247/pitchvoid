

# PitchVoid Enhancement Plan: Unpublish, Fullscreen & Debugging

## Overview
This plan covers adding new features to the existing Public Presentation System and ensuring everything works correctly. We'll implement an **Unpublish** option, **Fullscreen Mode**, and verify the current implementation is functioning properly.

---

## Part 1: New Features

### 1.1 Unpublish Option

**Location**: `src/components/dashboard/LiveSlideEditor.tsx`

**Implementation**:
- Add an "Unpublish" button that appears when a presentation is currently published
- The button will set `is_published = false` in the database while keeping the `public_id` for potential re-publishing
- Show a confirmation toast when unpublished

**UI Changes**:
- Replace the "Published ✓" button state with a dropdown menu containing:
  - "Copy Link" - copies the public URL
  - "View Published" - opens the public page in a new tab
  - "Unpublish" - makes the presentation private again

**Code Changes**:
```text
┌─────────────────────────────────────────────────────────────┐
│ Header Actions (After Publishing)                          │
├─────────────────────────────────────────────────────────────┤
│ [Copy Link]  [Published ▼] → Dropdown Menu                 │
│                               ├─ View Published (new tab)  │
│                               ├─ Copy Link                 │
│                               └─ Unpublish                 │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Fullscreen Mode for Public Presentations

**Location**: `src/pages/PublicPresentation.tsx`

**Implementation**:
- Add a fullscreen toggle button in the footer navigation
- Use the browser's native Fullscreen API (`document.documentElement.requestFullscreen()`)
- Show an "Exit Fullscreen" button when in fullscreen mode
- Hide header/footer in fullscreen for immersive experience
- Add ESC key support to exit fullscreen (native browser behavior)

**UI Layout in Fullscreen**:
```text
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    [Slide Content]                          │
│                                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Floating Controls (bottom):                                 │
│ ● ● ● ●  [←] 2/5 [→]  [Exit Fullscreen]                    │
└─────────────────────────────────────────────────────────────┘
```

**Code Approach**:
```typescript
const [isFullscreen, setIsFullscreen] = useState(false);

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    setIsFullscreen(true);
  } else {
    document.exitFullscreen();
    setIsFullscreen(false);
  }
};

// Listen for fullscreen change events
useEffect(() => {
  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
}, []);
```

---

## Part 2: Debugging & Verification

### 2.1 Current System Check

Based on my review, the implementation looks solid. Here's what I verified:

| Component | Status | Notes |
|-----------|--------|-------|
| Public Route `/p/:id` | ✅ Ready | Route configured in App.tsx |
| Database Schema | ✅ Ready | `is_published`, `public_id` columns exist |
| RLS Policies | ✅ Ready | Public SELECT policy for published projects |
| Publish Flow | ✅ Ready | Generates unique ID, updates DB, copies link |
| Slide Fetching | ✅ Ready | Fetches slides via project.id after resolving public_id |

### 2.2 Potential Edge Cases to Handle

1. **Project Not Found**: Already handled with error message
2. **No Slides**: Already handled with empty state
3. **Re-publish Same Project**: Currently regenerates public_id - will keep existing ID instead
4. **Concurrent Editing**: No real-time sync yet (future enhancement)

---

## Part 3: Implementation Tasks

### Task 1: Add Unpublish Functionality
**File**: `src/components/dashboard/LiveSlideEditor.tsx`

- Import `DropdownMenu` components from shadcn/ui
- Create `handleUnpublish()` function that sets `is_published = false`
- Replace the static "Published" button with a dropdown menu
- Add "View Published" option that opens `/p/{publicId}` in new tab
- Show success/error toasts for unpublish action

### Task 2: Add Fullscreen Mode
**File**: `src/pages/PublicPresentation.tsx`

- Add fullscreen state and toggle function
- Add fullscreen change event listener
- Import `Maximize2` and `Minimize2` icons from lucide-react
- Add fullscreen toggle button to footer
- Conditionally hide header when in fullscreen
- Style floating controls for fullscreen mode with glassmorphism

### Task 3: Fix Re-Publish Behavior
**File**: `src/components/dashboard/LiveSlideEditor.tsx`

- When re-publishing, keep the existing `public_id` instead of generating a new one
- Only generate new `public_id` on first publish

---

## Part 4: Technical Details

### Dependencies
- No new dependencies required
- Uses existing: `@radix-ui/react-dropdown-menu`, `lucide-react`, `sonner`

### Database Changes
- No schema changes needed
- Unpublish just sets `is_published = false`

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/LiveSlideEditor.tsx` | Add dropdown menu, unpublish handler |
| `src/pages/PublicPresentation.tsx` | Add fullscreen mode, floating controls |

### New Imports Needed

**LiveSlideEditor.tsx**:
```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ExternalLink, EyeOff } from 'lucide-react';
```

**PublicPresentation.tsx**:
```typescript
import { Maximize2, Minimize2 } from 'lucide-react';
```

---

## Expected Results

After implementation:

1. **Unpublish Flow**: Users can make a published presentation private again while preserving the public link for later re-use

2. **Fullscreen Mode**: Viewers can enter an immersive fullscreen presentation mode with minimal UI distraction and floating navigation controls

3. **Consistent Behavior**: Re-publishing a previously published project keeps the same shareable URL

