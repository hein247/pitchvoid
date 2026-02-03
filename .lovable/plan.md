

# Plan: Remove Investor Deck References

## Overview

Remove all references to "Investor Deck" and investor-related terminology from the application, as this format is no longer a focus of PitchVoid's two-format system (One-Pager and Script).

## Changes

### 1. Dashboard Mock Data & Templates

**File:** `src/pages/Dashboard.tsx`

- **Line 155**: Remove or replace the mock project "Series A Investor Deck"
  - Replace with a different example like "Team Onboarding Brief" or "Quarterly Update"
  
- **Line 161**: Replace "Investor Deck" quick template chip
  - Change to something like "Team Update" or "Product Launch"
  - Update the prefill text accordingly

### 2. Tour Page

**File:** `src/pages/Tour.tsx`

- **Line 8**: Update description from "job interview, client proposal, or investor meeting" to "job interview, client proposal, or team presentation"

### 3. AI Prompt (Edge Function)

**File:** `supabase/functions/parse-pitch-input/index.ts`

- **Line 72**: Keep "investors" in the audience list (this is valid - people still pitch to investors)
- **Line 78**: Remove "investor decks" from the one-pager examples
  - Change to: "one-pager" for written summaries, executive briefs, email follow-ups, leave-behinds, proposals

## Summary

| Action | File | Line(s) |
|--------|------|---------|
| Edit | `src/pages/Dashboard.tsx` | 155, 161 |
| Edit | `src/pages/Tour.tsx` | 8 |
| Edit | `supabase/functions/parse-pitch-input/index.ts` | 78 |

## Notes

- Keeping "investors" as a valid audience type in the AI prompt since users can still create one-pagers or scripts for investor meetings
- Only removing "Investor Deck" as a format/template option since it implies the slide-based deck format

