

## Update "How credits work" section

**What changes:**
- Remove the emoji icons (🎯, 🔄, 🎧) from the three explainer lines
- Remove the em dash (—) from lines that use it
- Center-align all text in the section

**File:** `src/pages/Pricing.tsx`

**Technical details:**

In the "How credits work" section (around lines 186-210), make these changes:

1. Remove the `flex items-start gap-3` layout from each line since we no longer need icon + text side by side
2. Remove the emoji `<span>` elements
3. Remove em dashes from the text content
4. Center-align the text by adding `text-center` to the list items

Updated text content:
- "1 credit = 1 generated output (one-pager or talking script)"
- "Refining, editing, and switching versions are free and unlimited"
- "Practice mode, breathing, teleprompter, and PDF export are always free"

