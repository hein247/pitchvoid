
# Step 7: Build `refine-output` Edge Function + Frontend Wiring

## Overview
Create a backend function that refines existing pitch outputs based on quick chips or free-text instructions. Wire it into the Dashboard with undo support, static dimming during refinement, and an inline Undo button in the RefinementBar.

---

## 1. Add Rate Limit Config

**File:** `supabase/functions/_shared/rateLimit.ts`

Add `refinement` entry to `RATE_LIMITS` object:
- Free: 5 requests per hour
- Paid: 20 requests per hour

---

## 2. Add Validation Helper

**File:** `supabase/functions/_shared/validation.ts`

Add `validateRefineOutputInput()` function that validates:
- `project_id` (required string)
- `original_input` (required string, max 5000)
- `current_output` (required, must be object)
- `refine_instruction` (required string, max 500)
- `format` (required, must be `"one-pager"` or `"script"`)
- `user_edits` (optional object with optional `title` string max 200, optional `context_line` string max 500)

---

## 3. Create the Edge Function

**File:** `supabase/functions/refine-output/index.ts` (new file)

### Flow:
1. Handle CORS preflight
2. Authenticate user via `authenticateRequest()`
3. Parse and validate request body with `validateRefineOutputInput()`
4. Verify project ownership: query `projects` where `id = project_id AND user_id = user.id`
5. Rate limit with `refinement` config (key: `refine:free:{userId}` or `refine:paid:{userId}`)
   - On limit hit, calculate minutes remaining, return: `"You've reached the refinement limit. Try again in X minutes."`
6. Map chip names to instructions:
   - `"shorter"` -- cut 30%, remove filler, keep bold metrics
   - `"bolder"` -- replace hedging with definitive statements
   - `"simpler"` -- plain language, keep numbers
   - `"more casual"` or `"casual"` -- conversational tone, contractions
   - Anything else: used as-is (free text)
7. Fetch `writing_preferences` from `profiles`
8. Build format-specific system prompt including current output JSON, original input, mapped instruction, and user_edits preservation directive if provided
9. Call AI via `callAIWithRetry()` with temperature 0.3, max_tokens 2000
10. Validate response using `validateOnePagerOutput()` or `validateScriptOutput()`
11. **Quality check**: count points/lines in new vs current output. If new has fewer than half, return `{ success: false, message: "Refinement produced too little content. Try a different instruction." }` without saving
12. Apply post-processing (enforce section/point/line limits matching original generators)
13. If `user_edits` provided, override title and context_line on the output
14. Save to `output_versions` with next `version_number`, `trigger` = chip name or first 50 chars of free text
15. Update `writing_preferences.refine_counts` in `profiles` for chip refinements (merge into existing JSONB)
16. Return `{ success: true, new_output: {...}, previous_output: {...} }` where `previous_output` is the `current_output` from the request body

---

## 4. Register in Config

**File:** `supabase/config.toml`

Add:
```text
[functions.refine-output]
verify_jwt = true
```

---

## 5. Wire Frontend: Dashboard

**File:** `src/pages/Dashboard.tsx`

### New State (added near line ~113):
- `isRefining` (boolean, default false)
- `previousOutput` (OnePagerData | ScriptData | null)
- `showUndo` (boolean)
- `undoTimerRef` (useRef for the 10-second timeout)
- `refineAnimationKey` (number, incremented on each successful refine)

### New `handleRefine(instruction: string)` function:
1. Determine current format and current output data (`onePagerData` or `scriptData`)
2. If `showUndo` is already true (user refining again before undo window closes), update `previousOutput` to current state and clear existing timer
3. Set `isRefining = true`
4. Call `supabase.functions.invoke('refine-output', { body: { project_id: activeProject.id, original_input: transcribedText, current_output: currentData, refine_instruction: instruction.toLowerCase(), format: outputFormat } })`
5. On success:
   - Store current data in `previousOutput`
   - Set new data from `new_output` into `onePagerData` or `scriptData`
   - Set `showUndo = true`, start 10-second timer to hide undo
   - Increment `refineAnimationKey`
   - Update project `output_data` column ONLY via a targeted update (not `saveProjectOutput` which overwrites other fields)
6. On error: show toast with error message
7. Set `isRefining = false`

### New `handleUndo()` function:
- Swap `previousOutput` back into `onePagerData`/`scriptData` state
- Clear `previousOutput`, set `showUndo = false`, clear timer
- No API call

### Project output save (refinement only):
Instead of calling `saveProjectOutput()` (which updates `output_format`, `status`, `draft_state`, etc.), do a targeted update:
```typescript
await supabase.from('projects').update({
  output_data: { [outputFormat === 'script' ? 'script' : 'onePager']: newOutput }
}).eq('id', activeProject.id);
```
This ensures only the output JSON column is updated -- title, format, status, etc. remain untouched.

### Output area dimming (around line 1119):
Wrap the output content div with conditional class:
```text
className={`overflow-y-auto p-4 sm:p-6 lg:p-8 relative z-10 transition-opacity duration-500 ${isRefining ? 'opacity-50' : ''}`}
```
No `animate-pulse`. Static dim only.

### Add RefinementBar (after the output area, around line 1146):
Render `RefinementBar` when output exists (`onePagerData || scriptData`) and not regenerating. Pass `onRefine={handleRefine}`, `isRefining`, `showUndo`, `onUndo={handleUndo}`.

---

## 6. Update RefinementBar

**File:** `src/components/dashboard/output/RefinementBar.tsx`

### Changes:
- Change default chips to `['Shorter', 'Bolder', 'Simpler', 'More casual']`
- Accept new props: `showUndo?: boolean`, `onUndo?: () => void`
- **Undo button**: Render to the left of chips when `showUndo` is true. Styled as soft red pill: `bg-[rgba(239,68,68,0.15)]` border with `text-[rgba(239,68,68,0.6)]`. Fade in/out using CSS transition.
- **Disable state**: When `isRefining` is true, all chips and the send button get `opacity-40 pointer-events-none`. The text input gets `disabled={isRefining}`.
- Free-text input already calls `onRefine` via form submit and clears input -- verify this works correctly (it does based on current code).

---

## 7. Add Highlight Animation on Refine

**Files:** `src/components/dashboard/OnePager.tsx`, `src/components/dashboard/ScriptViewer.tsx`

- Accept optional `refineAnimationKey?: number` prop
- Use framer-motion's `AnimatePresence` with `key={refineAnimationKey}` on the content wrapper to trigger a smooth fade-in + slight translateY entrance animation when the key changes after a refine
- Wrap existing content in a `motion.div` with `initial={{ opacity: 0, y: 8 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ duration: 0.4 }}`

---

## Files Changed Summary

| File | Change |
|------|--------|
| `supabase/functions/refine-output/index.ts` | New -- main edge function |
| `supabase/config.toml` | Add `refine-output` with `verify_jwt = true` |
| `supabase/functions/_shared/validation.ts` | Add `validateRefineOutputInput()` |
| `supabase/functions/_shared/rateLimit.ts` | Add `refinement` rate limit config |
| `src/pages/Dashboard.tsx` | Add `handleRefine`, `handleUndo`, undo state, render RefinementBar, dim output during refine, targeted output-only save |
| `src/components/dashboard/output/RefinementBar.tsx` | Update chips, add Undo button, disable state during refine |
| `src/components/dashboard/OnePager.tsx` | Accept `refineAnimationKey`, animate on change |
| `src/components/dashboard/ScriptViewer.tsx` | Accept `refineAnimationKey`, animate on change |
