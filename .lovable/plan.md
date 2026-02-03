

# Plan: Mobile Bottom Footer Edit Button with Area Selector

## Overview

Move the inline edit interface to a mobile-friendly bottom footer with a floating edit button. When users scroll down, they can tap the edit button to reveal a bottom sheet that lets them choose which area to edit (Header, Sections, Contact Info). This approach reduces cognitive load at the top and follows mobile UX best practices.

## Visual Design

### Current State (Mobile)
```text
┌────────────────────────────┐
│  Chat Panel Header         │
├────────────────────────────┤
│  Messages                  │
│  ...                       │
├────────────────────────────┤
│  ┌──────────────────────┐  │  ← OnePagerEditor here
│  │ Header Section       │  │    (takes up too much space)
│  │ Sections (expanded)  │  │
│  │ Contact Info         │  │
│  └──────────────────────┘  │
├────────────────────────────┤
│  Input Area                │
└────────────────────────────┘
```

### Proposed State (Mobile)
```text
┌────────────────────────────┐
│  Chat Panel Header         │
├────────────────────────────┤
│  Messages                  │
│  ...                       │
├────────────────────────────┤
│  Input Area                │
├────────────────────────────┤
│                    [✏️ Edit]│  ← Floating button
└────────────────────────────┘

When tapped, bottom sheet appears:
┌────────────────────────────┐
│  ─── (drag handle) ───     │
│                            │
│  What would you like to    │
│  edit?                     │
│                            │
│  ┌──────────────────────┐  │
│  │  📝 Header           │  │
│  │  Headline & subtitle │  │
│  └──────────────────────┘  │
│                            │
│  ┌──────────────────────┐  │
│  │  📋 Sections         │  │
│  │  Content blocks      │  │
│  └──────────────────────┘  │
│                            │
│  ┌──────────────────────┐  │
│  │  📞 Contact Info     │  │
│  │  Email, phone, web   │  │
│  └──────────────────────┘  │
└────────────────────────────┘
```

## Implementation

### 1. Create MobileEditorSheet Component

**File:** `src/components/dashboard/MobileEditorSheet.tsx` (new file)

A bottom sheet component that:
- Shows a floating "Edit" button above the input area
- Opens a drawer/bottom sheet when tapped
- Displays edit area options (Header, Sections, Contact Info)
- Selecting an area opens a focused edit panel for that section
- Uses the existing `OnePagerEditor` logic but split into focused views

### 2. Create EditorAreaPanel Component

**File:** `src/components/dashboard/EditorAreaPanel.tsx` (new file)

A focused panel for editing a single area:
- Header Panel: headline + subheadline fields
- Sections Panel: collapsible section list
- Contact Panel: email, phone, website fields
- Back button to return to area selector

### 3. Update Dashboard for Mobile

**File:** `src/pages/Dashboard.tsx`

Changes:
- Import `useIsMobile` hook
- Hide inline `OnePagerEditor` on mobile
- Show `MobileEditorSheet` on mobile when `onePagerData` exists
- Keep desktop behavior unchanged

### 4. Styling Updates

**File:** `src/index.css`

Add bottom sheet animations:
- Slide-up animation for sheet appearance
- Smooth transitions for area selection

## Technical Details

### MobileEditorSheet Component Structure

```typescript
interface MobileEditorSheetProps {
  data: OnePagerData;
  onUpdate: (data: OnePagerData) => void;
  isOpen: boolean;
  onClose: () => void;
}

// Internal state
const [selectedArea, setSelectedArea] = useState<'selector' | 'header' | 'sections' | 'contact'>('selector');
```

### Area Options

| Area | Icon | Label | Description |
|------|------|-------|-------------|
| Header | 📝 | Header | Headline & subtitle |
| Sections | 📋 | Sections | Content blocks |
| Contact | 📞 | Contact Info | Email, phone, website |

### Dashboard Integration

```typescript
// In Dashboard.tsx
const isMobile = useIsMobile();
const [showMobileEditor, setShowMobileEditor] = useState(false);

// In JSX
{onePagerData && (
  <>
    {/* Desktop: inline editor */}
    {!isMobile && (
      <div className="p-3 sm:p-4 border-t border-accent/10 max-h-[50vh] overflow-y-auto">
        <OnePagerEditor data={onePagerData} onUpdate={setOnePagerData} />
      </div>
    )}
    
    {/* Mobile: floating button + sheet */}
    {isMobile && (
      <MobileEditorSheet
        data={onePagerData}
        onUpdate={setOnePagerData}
        isOpen={showMobileEditor}
        onClose={() => setShowMobileEditor(false)}
      />
    )}
  </>
)}
```

## Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| Create | `src/components/dashboard/MobileEditorSheet.tsx` | Bottom sheet with edit button and area selector |
| Create | `src/components/dashboard/EditorAreaPanel.tsx` | Focused editing panels for each area |
| Edit | `src/pages/Dashboard.tsx` | Add mobile detection and conditional rendering |
| Edit | `src/index.css` | Add bottom sheet animations |

## UX Benefits

- **Reduced Cognitive Load**: Clean view on mobile without crowded edit fields
- **Thumb-Friendly**: Edit button positioned in comfortable bottom zone
- **Progressive Disclosure**: Only shows edit options when user wants to edit
- **Focused Editing**: One area at a time reduces overwhelm
- **Consistent with Mobile Patterns**: Uses familiar bottom sheet interaction

## Accessibility

- Bottom sheet has proper focus trap when open
- Escape key closes the sheet
- Tap outside to close
- Large touch targets (60px minimum)
- Clear visual hierarchy for area selection

