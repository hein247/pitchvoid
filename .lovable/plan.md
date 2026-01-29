

# Plan: Add File Attachment Functionality to Quick Pitch Modal

## Problem
The Quick Pitch modal (Step 2 - "Attach files") currently shows **hardcoded mock files** instead of providing real file upload functionality. Users cannot attach their own documents (PDFs, images, etc.) to provide context for AI generation.

## Solution
Add a proper file upload interface with:
- Drag-and-drop zone for files
- File picker button to browse files
- Support for PDFs, DOCX, and image files (PNG, JPG, WEBP)
- Display list of attached files with ability to remove them
- Pass file content/descriptions to the AI generation functions

## Implementation Details

### 1. Add File State Management (Dashboard.tsx)
- Add state for uploaded files: `attachedFiles` array
- Store file objects with name, size, type, and content (base64 or text)

### 2. Create File Upload UI in Step 2
Replace the hardcoded mock files with:
- A **drag-and-drop zone** styled consistently with the modal
- A **"Browse files"** button using hidden file input
- List of **attached files** with:
  - File icon based on type (PDF, image, document)
  - File name and size
  - Remove button (X) to delete

### 3. File Processing
- For PDFs/DOCX: Extract text or use descriptions
- For images: Display thumbnails, optionally describe for AI context
- Limit file size (e.g., 10MB max per file)
- Limit number of files (e.g., 5 max)

### 4. Integrate with AI Generation
- Pass `attachedFiles` data to `handleQuickGenerate`
- Include file descriptions/content in the edge function request body
- The `generate-one-pager` and `generate-pitch` functions already support `documentContext` and `imageDescriptions` parameters

### 5. UI/UX Enhancements
- Show upload progress indicator
- File type validation with helpful error messages
- Clear files when modal closes

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Dashboard.tsx` | Add file state, upload handlers, drag-drop UI in Step 2, integrate with generation |

## Visual Design

```text
┌─────────────────────────────────────────┐
│  Quick Pitch                        ✕   │
│  Step 2: Attach files                   │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │   📎 Drag files here or click  │    │
│  │      to browse                  │    │
│  │                                 │    │
│  │   PDF, DOCX, PNG, JPG up to 10MB│    │
│  └─────────────────────────────────┘    │
│                                         │
│  Attached Files (2)                     │
│  ┌─────────────────────────────────┐    │
│  │ 📄 Resume_2024.pdf    142 KB  ✕│    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ 🖼️ Portfolio.png      2.1 MB  ✕│    │
│  └─────────────────────────────────┘    │
│                                         │
│   [Back]           [Generate ⚡]        │
└─────────────────────────────────────────┘
```

## Technical Notes

- File reading uses `FileReader` API with `readAsDataURL` or `readAsText`
- File inputs accept: `.pdf,.docx,.doc,.png,.jpg,.jpeg,.webp`
- Drag-and-drop uses `onDragOver`, `onDragLeave`, `onDrop` events
- Files are processed client-side before sending to edge functions
- For large files, consider sending only file metadata/descriptions rather than full content

