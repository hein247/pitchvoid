

# Plan: Remove Slides, Keep Only One-Pager and Script

## Overview

The current system has "slides" deeply embedded as the primary output format. To create a cleaner, more focused experience, we will remove all slide-related functionality and make **One-Pager** and **Script** the only available output formats.

## Scope of Changes

### Phase 1: Update Core Types and Pricing

**Files:** `src/lib/pricing.ts`
- Change `OutputFormat` type from `'slides' | 'one-pager' | 'script'` to `'one-pager' | 'script'`
- Remove `'slides'` from all `formats` arrays in `PRICING` tiers
- Update format validation logic

### Phase 2: Update Backend Edge Functions

**File:** `supabase/functions/parse-pitch-input/index.ts`
- Update `ParsedContext.suggested_format` type to only allow `'one-pager' | 'script'`
- Modify AI prompt to only suggest One-Pager or Script (remove slides references)
- Update format validation fallback from `'slides'` to `'one-pager'`

**File:** `supabase/functions/generate-pitch/index.ts`
- This function can be removed entirely OR repurposed
- Recommended: Delete this function as it's slides-specific

### Phase 3: Refactor Dashboard (Major Changes)

**File:** `src/pages/Dashboard.tsx`

Key changes:
1. **Type Definition**
   - Change `OutputFormat` type: `type OutputFormat = 'one-pager' | 'script'`

2. **State Cleanup**
   - Remove: `showSlides`, `activeSlide`, `generatedSlides` (mock data)
   - Remove: `slidesHistory`, slide navigation logic
   - Change default `outputFormat` from `'slides'` to `'one-pager'`

3. **Quick Pitch Flow Updates**
   - Step 2 (AI Confirmation): Remove "Slides" option from format selector
   - Step 4 (Quick Tune): Update length descriptions from "2-3 slides" to "Brief summary" / "Standard" / "Comprehensive"

4. **Generation Logic**
   - Remove the `generate-pitch` function call branch for slides
   - Remove all `setShowSlides()` calls
   - Update fallback content to not include slides

5. **Project View Rendering**
   - Remove `SlideGrid` rendering
   - Remove slide navigation dots
   - Remove slide-specific mobile controls
   - Remove swipe gesture for slides
   - Update empty state messaging

6. **Regeneration Logic**
   - Remove slides branch from `handleRegenerateInFormat()`
   - Remove slides from phase messages

7. **Practice Mode**
   - Keep practice mode but adapt for Script only (it shows speaker content)

8. **Header/Preview Panel**
   - Remove slide-specific navigation arrows
   - Update hints text

### Phase 4: Update/Remove Components

**Delete These Files:**
- `src/components/dashboard/SlideGrid.tsx`
- `src/components/dashboard/SlidePreview.tsx` (if exists)
- `src/components/dashboard/SlideEditor.tsx`
- `src/components/dashboard/LiveSlideEditor.tsx`
- `src/components/dashboard/LayoutSwitcher.tsx`
- `supabase/functions/generate-pitch/` (entire folder)
- `supabase/functions/generate-pitch-images/` (if slides-only)

**Update These Files:**

**`src/components/dashboard/FormatToggle.tsx`**
- Remove slides from format options
- Only show One-Pager and Script buttons
- Remove `Layers` icon import

**`src/components/dashboard/RefinementPanel.tsx`**
- Update if it has slide-specific refinement options

### Phase 5: Update Shared Auth/Validation

**File:** `supabase/functions/_shared/auth.ts`
- Update `checkFormatAccess()` to remove slides format check

**File:** `supabase/functions/_shared/validation.ts`
- Update any format validation that includes slides

### Phase 6: Integration with New PitchOutputView

After cleanup, integrate the new unified `PitchOutputView` component from `src/components/dashboard/output/` into the Dashboard:
- Replace current preview panel rendering with `PitchOutputView`
- Pass `onePagerData` and `scriptData` to the component
- Wire up refinement callbacks

## Visual Flow (After Changes)

```text
Quick Pitch Modal:
  Step 1: Describe pitch (voice/text)
  Step 2: AI confirms understanding 
          [Format: One-Pager | Script]
  Step 3: Add context (files, notes)
  Step 4: Quick tune (length, tone)
  Step 5: Generate

Dashboard View:
  +------------------------+
  | One-Pager | Script     |  <- Only 2 tabs
  +------------------------+
  |                        |
  |   [Content Preview]    |
  |                        |
  +------------------------+
  | [Refinement Bar]       |
  +------------------------+
```

## Files Summary

| Action | File |
|--------|------|
| Edit | `src/lib/pricing.ts` |
| Edit | `src/pages/Dashboard.tsx` |
| Edit | `src/components/dashboard/FormatToggle.tsx` |
| Edit | `supabase/functions/parse-pitch-input/index.ts` |
| Edit | `supabase/functions/_shared/auth.ts` |
| Delete | `src/components/dashboard/SlideGrid.tsx` |
| Delete | `src/components/dashboard/SlidePreview.tsx` |
| Delete | `src/components/dashboard/SlideEditor.tsx` |
| Delete | `src/components/dashboard/LiveSlideEditor.tsx` |
| Delete | `src/components/dashboard/LayoutSwitcher.tsx` |
| Delete | `supabase/functions/generate-pitch/` |

## Technical Notes

- Free tier will default to One-Pager only (Script remains Pro)
- Practice mode will work with Script format only
- The new `PitchOutputView` already supports this two-format model
- Database changes are NOT required (pitch output is stored as JSON)

## Estimated Impact

- Removes ~800 lines of slide-related code from Dashboard
- Deletes 5+ component files
- Simplifies the generation flow significantly
- Creates a cleaner, document-focused user experience

