# PitchVoid — Lovable Master Prompt

## Product Overview

**PitchVoid** is a universal AI-powered pitch generator that helps anyone create compelling presentations, one-pagers, or scripts for ANY scenario — from job interviews to wedding toasts, investor meetings to asking for a raise.

**Core Philosophy**: Users don't think in "scenarios" or "templates." They think: *"I need to look good in front of [someone] about [something]."* PitchVoid removes friction by accepting natural language input and producing polished, persuasive output.

**Tagline**: "Pitch anything to anyone. Just tell us what you need."

---

## Tech Stack

- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks (useState, useEffect, useContext)
- **Backend**: Supabase (Auth, Database, Storage)
- **AI**: Claude API or OpenAI API for generation
- **Speech**: Web Speech API for voice input
- **Deployment**: Vercel or Netlify
- **PWA**: Service worker for offline support

---

## Design System

### Colors

```css
--background: #0F0518;        /* Deep purple-black */
--surface: #1A0A2E;           /* Elevated surface */
--surface-light: #2D1B4E;     /* Cards, modals */
--magenta: #D946EF;           /* Primary accent */
--violet: #8B5CF6;            /* Secondary accent */
--gradient-primary: linear-gradient(135deg, #D946EF 0%, #8B5CF6 100%);
--text-primary: #FFFFFF;
--text-secondary: #9CA3AF;
--text-muted: #6B7280;
--border: rgba(139, 92, 246, 0.2);
--border-active: rgba(217, 70, 239, 0.5);
```

### Typography

```css
--font-display: 'Playfair Display', serif;  /* Headings */
--font-body: 'Be Vietnam Pro', sans-serif;   /* Body text */
```

### Effects

- **Glassmorphism**: `backdrop-filter: blur(20px)` with gradient backgrounds
- **Grain texture**: Subtle SVG noise overlay at 3% opacity
- **Shadows**: Purple-tinted shadows for depth
- **Animations**: Smooth 300ms transitions, spring-based animations

### Responsive Breakpoints

```css
--mobile: 0px - 767px;
--tablet: 768px - 1023px;
--desktop: 1024px+;
```

---

## Core User Flow

### Overview

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  STEP 1        STEP 2         STEP 3         STEP 4         │
│  ──────        ──────         ──────         ──────         │
│  Describe  →   Add Context →  Quick Tune →   Generate       │
│  (Required)    (Optional)     (Optional)     & Refine       │
│                                                              │
│  "What do      Files, links,  Length, tone,  AI creates     │
│   you need     URLs, notes    format         output         │
│   to pitch?"                                                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Step 1: Describe Your Pitch (Required)

### UI Components

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  🎯 What do you need to pitch?                              │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  [Voice button]  Type or speak naturally...           │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Examples (clickable, fill input):                          │
│  • "Job interview at Google tomorrow"                       │
│  • "Asking my boss for a raise"                            │
│  • "Startup pitch at demo day"                             │
│  • "Wedding toast for my sister"                           │
│  • "Convincing my team to adopt a new tool"                │
│  • "Grant application for my research"                     │
│                                                              │
│                                    [ Next → ]               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Functionality

1. **Text Input**
   - Large textarea, auto-expanding
   - Placeholder: "Describe your pitch in your own words..."
   - Character limit: 1000 (soft limit with warning)

2. **Voice Input**
   - Tap microphone icon to start recording
   - Visual feedback: pulsing red ring, timer (max 60s)
   - Real-time transcription display
   - Tap again to stop and populate text field

3. **Example Chips**
   - Clickable examples populate the input
   - Diverse examples showing range of possibilities
   - Rotate/randomize on refresh

4. **AI Parsing** (on "Next")
   - Extract the 5 Universal Elements:
     - **WHO**: Audience (investor, boss, team, stranger, panel)
     - **WHAT**: Subject (me, my idea, my project, my request)
     - **WHY**: Goal (get hired, funded, approval, inform)
     - **HOW**: Implied tone (formal for board, casual for friend)
     - **WHEN**: Urgency (tomorrow, next week, someday)
   - Display parsed understanding for user confirmation

### AI Parsing Prompt

```
Analyze this pitch request and extract:

1. AUDIENCE: Who will receive this pitch? (e.g., investors, boss, team, interviewer, friend, panel, committee)

2. SUBJECT: What is being pitched? (e.g., myself for a job, my startup, an idea, a request, a proposal)

3. GOAL: What outcome does the user want? (e.g., get hired, get funded, get approval, persuade, inform, inspire)

4. TONE: What tone is appropriate? Infer from context. (e.g., formal, confident, humble, casual, urgent, inspirational)

5. URGENCY: When is this needed? (e.g., immediate, tomorrow, this week, not specified)

6. FORMAT SUGGESTION: Based on context, suggest output format (e.g., slides, one-pager, script, talking points)

7. LENGTH SUGGESTION: Based on context, suggest length (e.g., quick 2-3 slides, standard 5-6 slides, comprehensive 8-10 slides)

User input: "{user_input}"

Respond in JSON format:
{
  "audience": "",
  "audience_detail": "",
  "subject": "",
  "subject_detail": "",
  "goal": "",
  "tone": "",
  "urgency": "",
  "suggested_format": "",
  "suggested_length": "",
  "clarifying_questions": [], // Only if truly ambiguous
  "summary": "" // One sentence summary of what you'll create
}
```

### Confirmation UI

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ✓ Here's what I understood:                                │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  📍 A job interview pitch for Google                  │ │
│  │  👤 Audience: Hiring panel                            │ │
│  │  🎯 Goal: Get hired as Senior PM                      │ │
│  │  🎨 Tone: Confident, professional                     │ │
│  │  📊 Format: 6 slides with speaker notes               │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [ ← Edit ]                    [ Looks good → ]             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Step 2: Add Context (Optional)

### UI Components

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  📎 Anything to help me help you?                           │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │     📄                                                 │ │
│  │   Drop files here or click to browse                  │ │
│  │                                                        │ │
│  │   PDF, DOCX, TXT, PNG, JPG (max 10MB each)           │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Or paste a link:                                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  https://...                                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Suggested for your pitch:                                  │
│  [ ] Resume / CV                                            │
│  [ ] Job posting link                                       │
│  [ ] Portfolio / work samples                               │
│  [ ] LinkedIn profile                                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  💡 Add specific points to highlight (optional)       │ │
│  │                                                        │ │
│  │  e.g., "Emphasize my leadership experience"           │ │
│  │  e.g., "I increased revenue 40% last quarter"         │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [ Skip ]                      [ Next → ]                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Functionality

1. **File Upload**
   - Drag-and-drop zone
   - Click to browse
   - Supported formats: PDF, DOCX, DOC, TXT, PNG, JPG, JPEG
   - Max file size: 10MB per file
   - Max files: 5
   - Show upload progress
   - Display file chips with name, size, remove button

2. **URL Input**
   - Detect and fetch content from:
     - Job posting URLs (LinkedIn, Indeed, company sites)
     - LinkedIn profiles
     - Google Docs (public)
     - Notion pages (public)
     - Any webpage (extract text content)
   - Show loading state while fetching
   - Display extracted preview

3. **Context-Aware Suggestions**
   - Based on Step 1 parsing, suggest relevant materials:
     - Job interview → Resume, job posting, portfolio
     - Investor pitch → Deck draft, metrics, financials
     - Client proposal → Past work, scope doc, pricing
     - Standup → Task list, blockers, wins

4. **Highlight Notes**
   - Free-form textarea for specific points
   - Examples shown as placeholder
   - Optional but powerful for personalization

### File Processing Prompt

```
Extract key information from this document for a pitch context.

Document type: {file_type}
Pitch context: {pitch_summary_from_step_1}

Extract and structure:
1. KEY FACTS: Important dates, numbers, achievements
2. SKILLS/STRENGTHS: Relevant capabilities
3. EXPERIENCE: Relevant background
4. ACHIEVEMENTS: Quantified accomplishments (look for %, $, numbers)
5. UNIQUE POINTS: Differentiators, interesting angles

Document content:
{document_content}

Respond in JSON:
{
  "key_facts": [],
  "skills": [],
  "experience": [],
  "achievements": [],
  "unique_points": [],
  "suggested_highlights": [] // Top 3 most relevant for this pitch
}
```

---

## Step 3: Quick Tune (Optional)

### UI Components

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ⚙️ Any preferences? (or skip for smart defaults)           │
│                                                              │
│  LENGTH                                                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                       │
│  │  Quick  │ │Standard │ │Detailed │                       │
│  │  2-3    │ │  5-6    │ │  8-10   │                       │
│  └─────────┘ └─────────┘ └─────────┘                       │
│                                                              │
│  FORMAT                                                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                       │
│  │ Slides  │ │One-pager│ │ Script  │                       │
│  │   📊    │ │   📄    │ │   📝    │                       │
│  └─────────┘ └─────────┘ └─────────┘                       │
│                                                              │
│  TONE                                                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │Confident│ │ Humble  │ │Balanced │ │  Bold   │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                              │
│  STYLE (for slides)                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                       │
│  │ Minimal │ │ Visual  │ │  Data   │                       │
│  │  Clean  │ │  Rich   │ │  Heavy  │                       │
│  └─────────┘ └─────────┘ └─────────┘                       │
│                                                              │
│  [ ← Back ]    [ Skip & Generate ]    [ Generate → ]        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Functionality

1. **Length Options**
   - Quick: 2-3 slides / 1 short paragraph / 30-second script
   - Standard: 5-6 slides / 1 full page / 2-minute script
   - Detailed: 8-10 slides / 2 pages / 5-minute script
   - Default: AI-suggested based on context

2. **Format Options**
   - Slides: Visual presentation with speaker notes
   - One-pager: Formatted document, copy-paste ready
   - Script: Timed talking points with cues
   - Default: AI-suggested based on context

3. **Tone Options**
   - Confident: Strong statements, assertive language
   - Humble: Understated, lets work speak for itself
   - Balanced: Professional middle ground
   - Bold: Attention-grabbing, memorable
   - Default: AI-inferred from audience

4. **Style Options** (for slides only)
   - Minimal: Clean, text-focused, lots of whitespace
   - Visual: Image placeholders, icons, graphics
   - Data: Charts, metrics, numbers-forward
   - Default: Based on pitch type

---

## Step 4: Generate & Output

### Generation UI

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                         ✨                                   │
│                                                              │
│              Generating your pitch...                        │
│                                                              │
│         ┌────────────────────────────────┐                  │
│         │████████████░░░░░░░░░░░░░░░░░░░│ 45%              │
│         └────────────────────────────────┘                  │
│                                                              │
│              "Structuring your narrative..."                │
│                                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Generation Phases (display sequentially)

1. "Understanding your pitch..." (0-15%)
2. "Analyzing your materials..." (15-30%)
3. "Identifying key highlights..." (30-45%)
4. "Structuring the narrative..." (45-60%)
5. "Crafting compelling content..." (60-80%)
6. "Adding finishing touches..." (80-100%)

### Master Generation Prompt

```
You are PitchVoid, an expert pitch creator. Generate a compelling pitch based on:

## CONTEXT
- Pitch description: {user_description}
- Audience: {audience}
- Subject: {subject}
- Goal: {goal}
- Tone: {tone}
- Format: {format}
- Length: {length}
- Style: {style}

## MATERIALS PROVIDED
{parsed_materials}

## USER HIGHLIGHTS
{user_highlight_notes}

## UNIVERSAL PERSUASION FRAMEWORK
Every pitch must follow this structure:

1. HOOK (Slide 1 / Opening)
   - Grab attention immediately
   - State the opportunity, problem, or intriguing fact
   - Make them want to hear more

2. CONTEXT (Slides 2-3 / Setup)
   - Why this matters
   - Background, stakes, situation
   - Establish credibility

3. SUBSTANCE (Slides 4-6 / Meat)
   - Evidence, data, examples
   - Key achievements, proof points
   - "Why me" or "Why this works"

4. ASK/PROPOSAL (Slide 7 / The Point)
   - Clear statement of what you want
   - Specific, actionable request
   - Make it easy to say yes

5. CLOSE (Slide 8 / Landing)
   - Memorable final impression
   - Call to action
   - Leave them thinking about you

## OUTPUT FORMAT

For SLIDES, respond in this JSON structure:
{
  "title": "Pitch title",
  "slides": [
    {
      "number": 1,
      "title": "Slide title",
      "content": "Main content (2-4 bullet points or short paragraph)",
      "speaker_notes": "What to say when presenting this slide",
      "visual_suggestion": "Optional: what visual/image would work here"
    }
  ],
  "summary": "One-sentence summary of the pitch",
  "key_message": "The one thing you want them to remember"
}

For ONE-PAGER, respond in this JSON structure:
{
  "title": "Document title",
  "headline": "Attention-grabbing headline",
  "subheadline": "Supporting context line",
  "sections": [
    {
      "heading": "Section heading",
      "content": "Section content"
    }
  ],
  "call_to_action": "Clear CTA",
  "contact": "How to follow up"
}

For SCRIPT, respond in this JSON structure:
{
  "title": "Script title",
  "total_duration": "Estimated time",
  "sections": [
    {
      "name": "Section name",
      "duration": "Time for this section",
      "content": "What to say",
      "cue": "Stage direction or note"
    }
  ],
  "key_phrases": ["Memorable phrases to emphasize"]
}

## QUALITY GUIDELINES

1. BE SPECIFIC: Use actual details from materials, not generic statements
2. QUANTIFY: Include numbers, metrics, percentages when available
3. HUMAN: Write like a person, not a corporate robot
4. TIGHT: Every word earns its place, no filler
5. MEMORABLE: Include at least one surprising or quotable moment
6. ACTIONABLE: End with clear next step

Generate the pitch now.
```

---

## Output Display

### Slides View

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Your pitch is ready! 🎉                                    │
│                                                              │
│  "Senior PM Interview - Google"                             │
│  6 slides • ~4 min presentation                             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │              [ Active Slide Preview ]                │   │
│  │                                                      │   │
│  │   01 | About Me                                      │   │
│  │                                                      │   │
│  │   "Product leader who turns complex                  │   │
│  │    problems into delightful user                     │   │
│  │    experiences — with the data to prove it."         │   │
│  │                                                      │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Speaker notes:                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Start confident. Make eye contact with each panel  │   │
│  │  member. Pause after "prove it" for effect. 15 sec. │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐              │
│  │ 01 │ │ 02 │ │ 03 │ │ 04 │ │ 05 │ │ 06 │              │
│  │ ●  │ │    │ │    │ │    │ │    │ │    │              │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘              │
│                                                              │
│  Quick refinements:                                          │
│  [ Shorter ] [ Bolder ] [ More data ] [ Softer ]           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  💬 Or tell me what to change...                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [ 🎯 Practice ]  [ 📤 Share ]  [ 📥 Download ]            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### One-Pager View

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Your one-pager is ready! 🎉                                │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  ═══════════════════════════════════════════════    │   │
│  │  THE PRODUCT LEADER GOOGLE NEEDS                    │   │
│  │  ═══════════════════════════════════════════════    │   │
│  │                                                      │   │
│  │  8 years turning 0→1 products into 1M+ user         │   │
│  │  experiences, backed by data-driven decisions.      │   │
│  │                                                      │   │
│  │  ─────────────────────────────────────────────      │   │
│  │                                                      │   │
│  │  WHY I'M YOUR CANDIDATE                             │   │
│  │                                                      │   │
│  │  • Led mobile redesign: +47% DAU, -23% churn        │   │
│  │  • Managed $4.2M budget across 3 teams              │   │
│  │  • Shipped 12 features in 18 months                 │   │
│  │                                                      │   │
│  │  ...                                                 │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [ 📋 Copy text ]  [ 📤 Share ]  [ 📥 Download PDF ]       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Refinement System

### Quick Refinement Chips

Pre-built refinement commands (one-tap):

| Chip | Action |
|------|--------|
| Shorter | Reduce content by ~30%, tighten language |
| Longer | Add more detail, examples, context |
| Bolder | Stronger language, more confident assertions |
| Softer | Humble tone, undersell slightly |
| More data | Add metrics, numbers, proof points |
| Less data | Remove numbers, more narrative |
| Simpler | Reduce jargon, clearer language |
| More formal | Professional, corporate-appropriate |
| More casual | Conversational, friendly |

### Chat Refinement

Free-form input for specific changes:

```
User: "Make slide 3 shorter and add a specific metric"
User: "The opening is too generic, make it more surprising"  
User: "Add something about my leadership experience"
User: "Rewrite the close to be more memorable"
```

### Refinement Prompt

```
You are refining an existing pitch. 

CURRENT PITCH:
{current_pitch_json}

USER REQUEST:
{refinement_request}

ORIGINAL CONTEXT:
{original_context}

Apply the requested change while:
1. Maintaining overall narrative flow
2. Keeping consistent tone
3. Preserving key messages
4. Not breaking what's already working

Return the updated pitch in the same JSON format.
If the request is for a specific slide/section, only modify that part.
```

---

## Practice Mode

### UI

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  [ ✕ Exit ]              PRACTICE MODE              0:00    │
│                                                              │
│                    Slide 1 of 6                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │                                                      │   │
│  │         "Product leader who turns complex            │   │
│  │          problems into delightful user               │   │
│  │          experiences — with the data                 │   │
│  │          to prove it."                               │   │
│  │                                                      │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  💡 Start confident. Eye contact. Pause after       │   │
│  │     "prove it" for effect. ~15 seconds.             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│           [ ← ]      [ ▶ PLAY ]      [ → ]                  │
│                                                              │
│           ●  ○  ○  ○  ○  ○                                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Functionality

1. **Teleprompter View**: Large text, easy to read while presenting
2. **Speaker Notes**: Always visible below slide content
3. **Timer**: Counts up from 0:00, can be reset
4. **Navigation**: Arrow keys (desktop) or swipe (mobile)
5. **Auto-advance**: Optional, based on suggested timing
6. **Play/Pause**: Spacebar (desktop) or tap (mobile)

---

## Share System

### Share Modal

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Share Your Pitch                                   [ ✕ ]   │
│                                                              │
│  ┌─────────────┐  Link                                      │
│  │             │  ┌──────────────────────────────────────┐  │
│  │   [QR]      │  │ pitchvoid.com/p/abc123              │  │
│  │             │  └──────────────────────────────────────┘  │
│  └─────────────┘  [ 📋 Copy ]                               │
│                                                              │
│  Quick share:                                                │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                       │
│  │  💬  │ │  💼  │ │  ✉️  │ │  🐦  │                       │
│  │Whats │ │Linked│ │Email │ │Twitt │                       │
│  └──────┘ └──────┘ └──────┘ └──────┘                       │
│                                                              │
│  Suggested message:                                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ "Check out my pitch for the Google PM role:         │   │
│  │  pitchvoid.com/p/abc123"                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Settings:                                                   │
│  [ ] Password protect                                       │
│  [ ] Set expiry date                                        │
│  [ ] Allow downloads                                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Share Features

1. **Unique URL**: `pitchvoid.com/p/{short_id}`
2. **QR Code**: Auto-generated, downloadable
3. **Social Sharing**: Pre-filled messages for each platform
4. **Privacy Controls**: Password, expiry, download permissions
5. **Analytics**: View count, unique viewers (Pro feature)

---

## Export Options

| Format | Description |
|--------|-------------|
| PDF | Formatted document, print-ready |
| PPTX | Editable PowerPoint |
| PNG | Individual slide images |
| TXT | Plain text, copy-paste ready |
| Markdown | For docs, Notion, etc. |

---

## Database Schema (Supabase)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free', -- 'free', 'pro', 'team'
  credits_used INTEGER DEFAULT 0,
  credits_limit INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Pitches
CREATE TABLE pitches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT, -- Original user input
  parsed_context JSONB, -- AI-extracted context
  materials JSONB, -- Uploaded file references
  preferences JSONB, -- Length, format, tone, style
  output JSONB, -- Generated slides/content
  format TEXT, -- 'slides', 'onepager', 'script'
  status TEXT DEFAULT 'draft', -- 'draft', 'generated', 'shared'
  share_id TEXT UNIQUE, -- Short ID for sharing
  share_settings JSONB, -- Password, expiry, permissions
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Files
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  pitch_id UUID REFERENCES pitches(id),
  name TEXT NOT NULL,
  type TEXT, -- 'pdf', 'docx', 'image', etc.
  size INTEGER,
  storage_path TEXT,
  extracted_content JSONB, -- AI-extracted data
  created_at TIMESTAMP DEFAULT NOW()
);

-- Refinements (for history)
CREATE TABLE refinements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pitch_id UUID REFERENCES pitches(id),
  request TEXT, -- User's refinement request
  previous_output JSONB,
  new_output JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

```
Authentication:
POST   /auth/signup
POST   /auth/login
POST   /auth/logout
GET    /auth/me

Pitches:
GET    /pitches              -- List user's pitches
POST   /pitches              -- Create new pitch
GET    /pitches/:id          -- Get pitch details
PATCH  /pitches/:id          -- Update pitch
DELETE /pitches/:id          -- Delete pitch
POST   /pitches/:id/generate -- Generate/regenerate
POST   /pitches/:id/refine   -- Apply refinement

Files:
POST   /files/upload         -- Upload file
GET    /files/:id            -- Get file info
DELETE /files/:id            -- Delete file

Sharing:
GET    /p/:share_id          -- Public pitch view
POST   /pitches/:id/share    -- Create/update share settings

Export:
GET    /pitches/:id/export/pdf
GET    /pitches/:id/export/pptx
GET    /pitches/:id/export/png
```

---

## Mobile-Specific Considerations

### Gestures
- Swipe left/right: Navigate slides
- Swipe up: Show speaker notes
- Long press: Quick actions menu
- Pinch: Zoom slide preview

### Bottom Sheet Pattern
- Use bottom sheets for modals on mobile
- Drag handle for dismiss
- 90% max height

### Thumb Zone
- Primary actions in bottom 1/3 of screen
- FAB for main action (Quick Pitch)

### Offline Support
- Cache generated pitches locally
- Queue generations when offline
- Sync when back online

---

## Error Handling

### User-Friendly Messages

| Error | Message |
|-------|---------|
| Generation failed | "Hmm, something went wrong. Let's try that again." |
| File too large | "This file is too large (max 10MB). Try a smaller one?" |
| Invalid URL | "I couldn't read that URL. Try pasting the content directly." |
| Rate limited | "You're on fire! Take a breather and try again in a minute." |
| No credits | "You've used all your free generations. Upgrade to keep going!" |

### Retry Logic
- Auto-retry failed generations (max 2 attempts)
- Show manual retry button after failures
- Preserve user input on errors

---

## Analytics Events

Track for product improvement:

```
- pitch_started
- pitch_context_added (with: file_count, has_url, has_notes)
- pitch_preferences_set (with: length, format, tone)
- pitch_generated (with: duration_ms, slide_count)
- pitch_refined (with: refinement_type)
- pitch_shared (with: platform)
- pitch_exported (with: format)
- practice_started
- practice_completed (with: duration_s)
```

---

## Future Features (V2+)

1. **Team Workspaces**: Shared pitch library, brand templates
2. **AI Coaching**: Practice mode with AI feedback on delivery
3. **Integrations**: Jira, Linear, Notion, Google Calendar auto-pull
4. **Templates**: Save and reuse personal pitch formats
5. **Version History**: Track changes, restore previous versions
6. **Collaboration**: Real-time co-editing
7. **Custom Branding**: Logo, colors, fonts for Pro users
8. **Analytics Dashboard**: View trends, completion rates
9. **Chrome Extension**: Quick pitch from any webpage
10. **Slack Bot**: Generate standup updates from Slack

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Time to first pitch | < 2 minutes |
| Generation success rate | > 95% |
| User satisfaction (refinements needed) | < 2 per pitch |
| Share rate | > 30% of generated pitches |
| Return usage | > 40% weekly active |

---

## Launch Checklist

- [ ] Core flow working (describe → context → tune → generate)
- [ ] All 3 output formats (slides, one-pager, script)
- [ ] Voice input functional
- [ ] File upload + parsing working
- [ ] URL fetching working
- [ ] Refinement system working
- [ ] Practice mode working
- [ ] Share system working
- [ ] Export (PDF at minimum)
- [ ] Mobile responsive
- [ ] Auth flow complete
- [ ] Credits system working
- [ ] Error handling complete
- [ ] Analytics tracking
- [ ] PWA configured

---

*This document serves as the complete specification for building PitchVoid in Lovable. All AI prompts, database schemas, API structures, and UI patterns are production-ready.*
