

# Plan: Add Refinement Input to Mobile Editor Sheet

## Overview

Add a "Refine your pitch" text input box above the area selector options in the mobile bottom sheet. This gives users quick access to AI-driven refinements before or instead of manual editing, all from the same thumb-friendly location.

## Visual Design

```text
┌────────────────────────────────────┐
│  ─── (drag handle) ───             │
├────────────────────────────────────┤
│  Edit Content                   X  │
├────────────────────────────────────┤
│                                    │
│  ┌──────────────────────────────┐  │
│  │  Refine your pitch...     ➤  │  │  ← NEW: Refinement input
│  └──────────────────────────────┘  │
│                                    │
│  Quick edits:                      │
│  [Shorter] [Bolder] [More data]    │  ← NEW: Quick chips
│                                    │
│  ─── or edit manually ───          │  ← Divider
│                                    │
│  ┌──────────────────────────────┐  │
│  │  📝 Header                   │  │
│  │  Headline & subtitle         │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  📋 Sections                 │  │
│  │  Content blocks              │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  📞 Contact Info             │  │
│  │  Email, phone, website       │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

## Implementation

### 1. Update MobileEditorSheet Component

**File:** `src/components/dashboard/MobileEditorSheet.tsx`

Add new props for refinement:
- `onRefine: (prompt: string) => void` — callback when user submits a refinement
- `isRefining?: boolean` — loading state during refinement

Add to the component:
- Refinement input box with submit button above the area options
- Quick edit chips row (Shorter, Bolder, More data, etc.)
- Visual divider between refinement and manual edit sections

### 2. Update Dashboard to Pass Refinement Handler

**File:** `src/pages/Dashboard.tsx`

Pass the existing `handleSubmit` logic to `MobileEditorSheet`:
- Add `onRefine` prop that sets input value and triggers generation
- Pass `isGenerating` as `isRefining` prop

## Technical Details

### Updated MobileEditorSheet Interface

```typescript
interface MobileEditorSheetProps {
  data: OnePagerData;
  onUpdate: (data: OnePagerData) => void;
  onRefine: (prompt: string) => void;  // NEW
  isRefining?: boolean;                 // NEW
}
```

### Quick Chips

```typescript
const QUICK_CHIPS = ['Shorter', 'Bolder', 'More data', 'Softer tone'];
```

### Refinement Input (inside selector view)

```typescript
{selectedArea === 'selector' && (
  <div className="space-y-4">
    {/* Refinement Input */}
    <div className="space-y-3">
      <form onSubmit={handleRefineSubmit} className="relative">
        <input
          type="text"
          value={refineValue}
          onChange={(e) => setRefineValue(e.target.value)}
          placeholder="Refine your pitch..."
          className="input-field w-full pr-12"
        />
        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2">
          <Send className="w-4 h-4" />
        </button>
      </form>
      
      {/* Quick Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {QUICK_CHIPS.map(chip => (
          <button key={chip} onClick={() => onRefine(chip)}>
            {chip}
          </button>
        ))}
      </div>
    </div>
    
    {/* Divider */}
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground">or edit manually</span>
      <div className="flex-1 h-px bg-border" />
    </div>
    
    {/* Area Options */}
    {areaOptions.map(...)}
  </div>
)}
```

## Files to Modify

| Action | File | Description |
|--------|------|-------------|
| Edit | `src/components/dashboard/MobileEditorSheet.tsx` | Add refinement input, chips, and divider above area options |
| Edit | `src/pages/Dashboard.tsx` | Pass `onRefine` and `isRefining` props to MobileEditorSheet |

## UX Flow

1. User taps "Edit" button at bottom
2. Bottom sheet opens showing:
   - Refinement input at top
   - Quick edit chips below input
   - "or edit manually" divider
   - Area selection options (Header, Sections, Contact)
3. User can either:
   - Type a refinement prompt and submit
   - Tap a quick chip for instant refinement
   - Tap an area to manually edit fields
4. Sheet closes after refinement is submitted

## Benefits

- Single entry point for all mobile editing actions
- AI refinement is prominently placed (most common action)
- Quick chips reduce typing on mobile
- Clear visual hierarchy between AI refinement and manual editing
- Maintains existing area-based editing for detailed changes

