# Mind Measure Design System — Source of Truth

> **Last updated:** 14 February 2026
> **Design source:** `src/components/mobile/DashboardPreview.tsx`
> **Primary variant:** Variant E — Poster Hero

---

## 1. Brand Palette

### Core Tokens

| Token | Hex | Swatch | Role |
|-------|-----|--------|------|
| **Spectra** | `#2D4C4C` | Dark teal | Primary text, hero backgrounds, buttons, grounding colour |
| **Spectra Mid** | `#1E3A3A` | Deeper teal | Dark variant page backgrounds |
| **Spectra Deep** | `#142828` | Deepest teal | Dark variant bottom nav |
| **Sinbad** | `#99CCCE` | Light teal | Progress indicators, data viz, check-in emphasis accent, "NEW" badge |
| **Buttercup** | `#F59E0B` | Warm amber | CTAs, highlights, mood accents, active nav icon, finish button |
| **Bittersweet** | `#FF6B6B` | Coral red | Alerts, urgent states, Help button, low-score hero, streak |
| **Pampas** | `#FAF9F7` | Warm off-white | Light backgrounds, detail panel body |
| **Apricot** | `#FF9966` | Warm orange | CTA buttons (dark variants) |
| **Lilac** | `#DDD6FE` | Lavender | Nudge card accent, high-score hero state, buddy spot colour |
| **White** | `#FFFFFF` | Pure white | Text on dark, dashboard grid background |

### Additional Utility Colours

| Hex | Usage |
|-----|-------|
| `#F5F5F0` | Warm light grey — Content, Buddies, Profile body background |
| `#1A2E2E` | Very dark teal — text on light-coloured cards |
| `#4ADE80` | Green — buddy active-status dot |
| `#E5E7EB` | Light grey — card borders, nav border |
| `#92600A` | Dark amber — profile completion warning text |
| `#DC2626` | Deep red — 999 emergency pill |
| `#EF4444` | Red — Samaritans emergency pill |
| `#F87171` | Light red — NHS 111 emergency pill |
| `#FBBF24` | Amber — University Security emergency pill |

### Score-State Colour Mapping

The poster hero background colour changes based on the user's wellbeing score:

| State | Score Range | Background | Text Colour | Affirmation |
|-------|-----------|------------|-------------|-------------|
| Low | < 40 | `#FF6B6B` (Bittersweet) | `#ffffff` | "Something needs attention." |
| Mid | 40–59 | `#F59E0B` (Buttercup) | `#2D4C4C` | "Let's build momentum." |
| Stable | 60–79 | `#99CCCE` (Sinbad) | `#2D4C4C` | "You're doing great." |
| High | 80+ | `#DDD6FE` (Lilac) | `#2D4C4C` | "Strong momentum." |

### Per-Product Colour Strategy

| Product | Primary | Accent | Secondary |
|---------|---------|--------|-----------|
| **University** (current) | Spectra | Buttercup | Sinbad |
| **Student** (future) | Coral/Bittersweet | Buttercup | Sinbad |
| **Corporate** (future) | Blues (TBD) | Buttercup | — |

### Design Philosophy — Gulf Racing Livery

The palette was inspired by the Ford GT in Gulf Racing livery — precision, pride, performance, but inviting. Sinbad + Apricot are deliberately confident, gender-neutral, and performance-oriented. These are not "wellness pastels" — they are iconic colours that signal quality.

> *"Just a reminder — these colours are iconic car colours although not, on the surface, 'aggressive' at all."*

---

## 2. Typography

### Font Families

| Font | Usage | Weights |
|------|-------|---------|
| **Lato** | Headings, score numbers, conversational text, welcome titles | 300 (Light), 400 (Regular), 700 (Bold), 900 (Black) |
| **Inter** | Body text, UI chrome, labels, buttons, navigation | 400 (Regular), 500 (Medium), 600 (SemiBold) |

### Type Scale

| Element | Font | Size | Weight | Letter-spacing | Line Height |
|---------|------|------|--------|---------------|-------------|
| Poster Hero score | System | 285px | 900 | -0.05em | 1 |
| Dashboard score (cards) | Lato | 100–108px | 900 | -0.04em | 0.85 |
| Mood number | Lato | 48–52px | 900 | -0.03em | 0.85 |
| Check-in welcome title | Lato | 48px | 300 | -0.03em | 1.1 |
| "All done" finish text | Lato | 36px | 300 | -0.02em | — |
| Conversation AI text | Lato | 34px | 300 | -0.015em | 1.45 |
| Screen titles (Content, Buddies, Profile) | Inter | 32px | 700 | -0.025em | 1.15 |
| Conversation user text | Lato | 30px | 300 | — | 1.45 |
| Profile name | Inter | 26px | 700 | -0.025em | — |
| Stats value | Inter | 26px | 700 | -0.03em | — |
| Info modal heading | Inter | 22px | 700 | — | 1.2 |
| Baseline options | Lato | 20px | 300 (italic) | -0.01em | 1.6 |
| Dashboard mood/streak | — | 28px | 900 | — | — |
| Affirmation | — | 26px | 300 (italic) | -0.025em | — |
| Dashboard buttons | Inter | 18px | 500 | — | — |
| Article title | Inter | 17px | 600 | — | 1.35 |
| Profile report heading | Inter | 17px | 700 | — | — |
| Buddy name | Inter | 16px | 600 | — | — |
| Emergency pill name | Inter | 15px | 600 | — | — |
| Body text | Inter | 14–15px | 400 | — | 1.5–1.625 |
| Hero subtitle | — | 15px | 400 | — | 1.5 |
| University name (hero) | — | 13px | 500 | 0.05em | — |
| Category pill / meta | Inter | 12px | 500 | — | — |
| Card labels (uppercase) | — | 11–12px | 300–500 | 0.025–0.1em | — |
| Speaker label (Jodie/You) | Inter | 11px | 500 | 0.1em | — |
| Stats label | Inter | 11px | 500 | 0.06em | — |
| Nav labels (Variant E) | Inter | 9px | 300/600 | 0.05em | — |

### Core Typographic Principle

The **contrast between light uppercase labels** (11px, 300 weight, wide tracking, muted opacity) and **heavy data numbers** (28–285px, 900 weight, tight tracking) is the personality of the app:

> *"That's the personality of the app — the contrast between the Light labels and Black data."*

---

## 3. Design Tokens

### Border Radius Scale

| Value | Usage |
|-------|-------|
| 3–4px | Editorial cards (Variants A–C), chart bars, dot indicators |
| 6px | "NEW" badge |
| 8px | Buttons within cards (Call, Text, Online) |
| 10–12px | CTA buttons, period selectors, modal pills |
| 14px | Standard buttons, stats cards, accordion headers |
| 16px | Content cards, buddy cards, dashboard cards, modals body |
| 20px | Info modal container, filter pills |
| 24px | Detail panel modal |
| 9999px | Full pill shapes (score delta, new-articles badge, help button) |

### Shadow Scale

| Name | Value | Usage |
|------|-------|-------|
| Standard | `0 2px 8px rgba(0,0,0,0.06)` | Cards, stats, article cards |
| Adaptive | `0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)` | Dashboard grid cards (Variant E) |
| Accordion | `0 1px 6px rgba(0,0,0,0.03)` | Help page accordions |
| Floating | `0 4px 20px rgba(0,0,0,0.25), 0 1px 4px rgba(0,0,0,0.15)` | Variant D cards |
| Modal | `0 25px 50px -12px rgba(0,0,0,0.25)` | Detail panel overlay |
| Dragging | `0 8px 24px rgba(0,0,0,0.12)` | Buddy card while being dragged |
| CTA glow | `0 4px 16px rgba(255,153,102,0.3)` | Apricot CTA hover |
| Finish glow | `0 4px 20px rgba(245,158,11,0.3)` | Buttercup finish button on last message |

### Spacing Patterns

| Context | Value |
|---------|-------|
| Hero top padding | 56px |
| Hero side padding | 24px |
| Hero bottom padding | 32px |
| Page side padding | 16–24px |
| Card internal padding | 14–24px |
| Grid gap (Variant E + secondary screens) | 12–14px |
| Stats grid gap | 8px |
| Emergency pill gap | 6px |
| Filter pill gap | 8px |
| Bottom nav clearance | 100px (paddingBottom on pages) |
| Safe area inset | `max(8px, env(safe-area-inset-bottom))` |

### Animation Patterns (Framer Motion)

| Pattern | Config | Usage |
|---------|--------|-------|
| Container stagger | `duration: 0.3, staggerChildren: 0.05` | Dashboard grid entry |
| Block entry | `scale: 0.96→1, opacity: 0→1, duration: 0.3` | Card reveal |
| whileTap | `scale: 0.95–0.98` | All tappable cards |
| Page transition | `x: 40→0 enter, x: 0→-40 exit, duration: 0.2–0.25` | Screen switching |
| Lyrics scroll | `y: 16→0 enter, y: 0→-12 exit, duration: 0.6, ease: [0.25, 0.1, 0.25, 1]` | Check-in messages |
| Modal spring | `damping: 25, stiffness: 300–350, y: 20–30, scale: 0.95` | Detail panels, info modal |
| Expand/collapse | `height: 0→auto, duration: 0.25` | Accordion, profile fields |
| Hero entrance | `opacity: 0→1, y: 30→0, duration: 1s, delay: 0.2s` | Poster hero score |
| Article stagger | `delay: index * 0.08, duration: 0.4` | Content page cards |
| Buddy stagger | `delay: 0.05 + index * 0.08, duration: 0.3` | Buddy list cards |
| Finish button | `duration: 0.5` (animates bg, color, border, shadow) | Check-in finish CTA |

---

## 4. Screen-by-Screen Specification

### 4.1 Dashboard — Variant E (Poster Hero)

**Status: MATCH — Fully ported to production**

The poster hero is the centrepiece of the redesign. The score IS the screen — not a card within a card. The background colour changes with the user's wellbeing state.

#### Hero Section (624px height)
- Solid background colour from score-state mapping
- Score number: 285px, weight 900, `-0.05em` tracking, `tabular-nums`
- Greeting: "Good morning/afternoon/evening, {firstName}" — 32px, weight 500
- Affirmation: italic, 26px, weight 300 — different text per score state
- Entrance animation: opacity + y slide, 1s duration

#### Dashboard Grid (white background, 24px padding, 12px gap)
- **Check-in + Help buttons** — 5-column grid:
  - "Check in" spans 3/5: Spectra bg, white text, 16px radius, 64px height, 18px/500
  - "Need Help?" spans 2/5: light coral bg `rgba(246,107,107,0.15)`, coral text, **solid pink hover** (`#F66B6B` bg, white text)
- **Mood + Streak** — 2-column grid, 80px height:
  - Adaptive background at 0.18 opacity from hero colour
  - Score: 28px/900, Label: 12px uppercase, 300 weight, 0.025em tracking
  - Subtle shadow: `0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)`
- **Insight** — full-width card:
  - Adaptive bg at 0.18, border 1.5px at 0.35 opacity
  - Summary text preview, truncated to 2 lines
- **Enjoying + Worry** — 2-column grid:
  - Enjoying: 0.20 opacity adaptive bg
  - Worry: 0.45 opacity adaptive bg (heavier tint)
  - Items: 15px font, text-overflow ellipsis, minHeight 120px
- **Previous Check-in** — full-width card:
  - Score-coloured from *that check-in's* score (not current)
  - Clock icon in 40px circle, date, score number + label
- **NudgeCarousel** — "What's Happening" section:
  - Section header: 12px/300/0.1em/uppercase
  - Cards: 16px radius, 22px padding, bg from nudge data
  - Title: 18px/700, Body: 14px/1.5
  - Where/When with map-pin/clock SVG icons
  - CTA button: full-width, 12px radius, 15px/600
  - Dot indicators: active 20px wide, inactive 6px, both 6px tall, 3px radius

#### Adaptive Colour System
All cards derive their background from the current hero state colour using:
```
getAdaptiveColor(opacity) = heroBackgroundColor + hex(opacity * 255)
```

#### Detail Panel Modals (6 panels)

Shared container: fixed overlay, blur backdrop, 24px radius card, 32px accent bar, Pampas body, 40px close button.

| Panel | Accent | Content |
|-------|--------|---------|
| **Score** | Sinbad | 56px score, label, delta pill with TrendingUp icon |
| **Mood** | Buttercup | 48px score "/10", 7-day bar chart in accent container |
| **Streak** | Bittersweet | Flame icon, 48px count, 7-day circle calendar, reward progress bar |
| **Enjoying** | Sinbad | Stacked items with 8px dots, first bold (20% bg), rest lighter |
| **On Your Mind** | Bittersweet | Same as Enjoying with different accent |
| **Insight** | Buttercup | Date label, "Conversation Summary" heading, narrative text |

---

### 4.2 Content Page

**Status: MATCH — Fully ported to production**

#### Hero (Spectra, 260px min-height)
- University name: 13px/500, white at 0.5 opacity, 0.05em tracking
- Title: "Wellbeing Content" — 32px/700, white, Inter
- Subtitle: 15px/400, white at 0.6 opacity, max-width 320px
- New-articles badge: pill with bell icon, `rgba(255,255,255,0.15)` bg, 13px/600

#### Filter Pills (sticky, z-index 10)
- Horizontally scrollable, hidden scrollbar
- Active: Spectra bg, white text, 600 weight, no border
- Inactive: white bg, Spectra text, 400 weight, 1.5px border at 0.15 opacity
- All: 8px 18px padding, 20px radius

#### Article Cards
- White bg, 16px radius, `0 2px 8px rgba(0,0,0,0.06)` shadow
- Image: 200px height, cover fit, category-colour fallback at 40%
- "NEW" badge: absolute top-right, Sinbad bg, 11px/700, uppercase, 6px radius
- Category pill: 12px/500, category colour at 30% bg, 12px radius
- Read time: 12px with Clock icon, 0.4 opacity
- Title: 17px/600, Inter, 1.35 line-height
- Excerpt: 14px, 3-line clamp, 0.6 opacity
- CTA: "Read full article" + ChevronRight, 14px/600
- Stagger: each card 0.08s delay

#### Content Filters
`All | Wellbeing | Anxiety | Sleep | Stress | Relationships | Exercise`

---

### 4.3 Buddies Page

**Status: MATCH — Fully ported to production**

#### Hero (Spectra, 220px min-height)
- Title: "Buddies" — 32px/700, white
- Subtitle: "A Buddy is someone you trust..." — 15px/400, white at 0.6, max-width 340px

#### Buddy Cards
- White bg, 16px radius, standard shadow
- **Drag handle**: 3 horizontal bars (12x2px each), 0.25 opacity
- **Numbered circle**: 44x44px, buddy's assigned colour bg, number at 18px/700
- **Name**: 16px/600, active dot (7x7px `#4ADE80` green circle)
- **Relationship + last contact**: 13px, 0.5 opacity
- **Nudge button**: pill 20px radius, `rgba(153,204,206,0.2)` bg, 13px/600, bell icon
- Dragging state: elevated shadow `0 8px 24px rgba(0,0,0,0.12)`, scale 1.02

#### Empty Slot
- Dashed border: `2px dashed rgba(45,76,76,0.12)`
- Faded numbered circle, "Empty spot" italic text

#### Add Buddy Button
- Full-width, Spectra bg, white text, 16px radius, Plus icon

#### Reorder Hint
- "Drag to reorder — Spot 1 is contacted first" — 12px, 0.35 opacity, centred

#### Info Modal ("How Buddies Work")
- Overlay: `rgba(0,0,0,0.4)` + `blur(8px)` backdrop
- Modal: white, 20px radius, max-width 382px
- **Sinbad accent bar**: 32px height
- Close: 36x36 circle, top-right
- Three sections with coloured bullet points:
  - "What happens" — Sinbad bullets
  - "What Buddies see" — Lilac bullets
  - "Your control" — Buttercup bullets
- "Got it" button: Spectra bg, 14px radius

---

### 4.4 Profile Page

**Status: PARTIAL — Hero matches, body needs porting**

#### Hero (Spectra, 240px min-height)
- **Avatar**: 56x56 circle, Sinbad bg, initials at 22px/700
- **Name**: 26px/700, white, -0.025em tracking
- **Email**: 14px, white at 0.5 opacity
- **Institution line**: "University of Worcester · Social Sciences · Year 2" — 14px/400, white at 0.5

#### Stats Row (3-column grid, 8px gap) — NOT YET PORTED
- White cards, 14px radius, standard shadow
- Value: 26px/700, Spectra, -0.03em tracking
- Label: 11px/500, uppercase, 0.06em tracking, 0.4 opacity
- Stats: Check-ins | Avg Score | Best Streak

#### Score Trend (12-week bar chart) — NOT YET PORTED
- White card, 16px radius
- 12 bars, flex-end alignment, gradient opacity (older = lighter)
- Latest bar: full Sinbad
- Labels: "12 wks ago" — "Now"

#### Your Profile (expandable section) — NOT YET PORTED
- White card, 16px radius
- **SVG completion ring**: 40x40, stroke proportional to completion %
  - Complete: Sinbad stroke + checkmark
  - Incomplete: Buttercup stroke + percentage
- ChevronRight with 90-degree rotation on expand
- Field rows: label (14px, 0.5 opacity) left, value (14px/500) right + chevron
- Completion warning: Buttercup-tinted bg, amber text

#### Wellbeing Report — NOT YET PORTED
- White card, 16px radius
- **Gradient accent bar**: 4px, `linear-gradient(90deg, #99CCCE, #DDD6FE, #F59E0B)`
- Document icon: 20x20
- 3-page preview thumbnails (3:4 aspect ratio, numbered 1–3)
  - Dashboard | AI Summary | Check-in Log
- Period selector: 3 buttons (14 days / 30 days / 90 days), middle active (Spectra bg)
- "Generate & Email Report" button: Spectra bg, 14px radius, envelope icon
- Fine print: "Report sent to your email with a secure 7-day link"

#### Data Ownership — NOT YET PORTED
- `rgba(153,204,206,0.1)` bg, 16px radius
- Shield icon + "This is your data" heading
- "Every conversation, score and insight belongs to you..."

#### Legal & Settings — NOT YET PORTED
- White card, 16px radius, 3 rows:
  - Privacy (chevron) | Privacy Policy (external link icon) | Terms of Service (external link icon)

#### Sign Out — NOT YET PORTED
- Transparent bg, Bittersweet text, 1.5px border `rgba(255,107,107,0.2)`, 14px radius

---

### 4.5 Check-in Screen (Lyrics Scroll)

**Status: NOT PORTED — Production uses ElevenLabs voice widget**

The designed check-in is a fully immersive, text-based conversation experience inspired by Spotify's lyrics view and Typeform's one-question-at-a-time approach.

> *"Love this idea — let's build it because the execution is everything."*

**Note:** Production uses the ElevenLabs voice widget for actual conversation. The designed UI would wrap/overlay this — showing Jodie's transcribed text in the lyrics-scroll format while the voice widget handles audio.

#### Phase 1: Welcome
- Full Spectra (#2D4C4C) background
- Back button: top-left (56px top, 24px left), Sinbad, 0.5 opacity
- Title: **48px, Lato, weight 300**, Pampas colour
  - "Check in" (regular mode) or "Baseline" (baseline mode)
- Subtitle: 18px/300, Sinbad at 0.6 opacity
  - "A few minutes with Jodie to see how you're doing today"
  - or "Five questions with Jodie to establish your starting point"
- **Begin button**: Buttercup bg, Spectra text, 14px radius, 17px/600
  - `padding: 16px 40px`
- Bottom-left: Camera + mic SVG icons (Sinbad stroke, 0.3 opacity)
- Animations: fade-in 0.8s, title slides up (0.2s delay), button (0.5s delay)

#### Phase 2: Conversation (Lyrics Scroll)
- Full Spectra background, no header, no chrome — completely immersive
- **Bottom nav hidden** during conversation
- Back button: top-left, Sinbad at 0.3 opacity (subtler than welcome)
- Message area: flex centred vertically, `padding: 80px 28px 140px`
- **One message at a time**, centred on screen (not accumulating)
- Speaker label: "JODIE" or "YOU" — 11px/500, Sinbad, uppercase, 0.1em tracking
- **AI message text**: 34px/300, Pampas colour, Lato, pre-line whitespace
  - Uses `renderEmphasis()` for kinetic typography (see Section 5)
- **User message text**: 30px/300, Sinbad colour, Lato
- **Baseline options**: staggered write-on, 20px/300 italic, Sinbad
  - Delay: `1.2s + index * 0.9s`, duration: 0.8s
- Message transitions: `y: 16→0` enter, `y: 0→-12` exit, 0.6s

#### Auto-advance Timing
| Context | Delay |
|---------|-------|
| First message | 600ms |
| AI messages | 2800ms |
| User messages | 1600ms |
| Messages with options | `1200 + optionCount * 900 + 2800` ms |

#### Finish Button
- Floating, `bottom: 40px`, `right: 28px`
- **Before last message**: transparent bg, Sinbad border/text, outline style
- **On last message**: animates to Buttercup bg, Spectra text, glow shadow
  - Transition: 0.5s animated colour change

#### Phase 3: Finished
- "All done" — 36px/300, Pampas, Lato, centred
- "Thanks, {name}. Take care of yourself." — 17px/300, Sinbad at 0.6
- Auto-returns to dashboard after 2000ms
- Entry: scale 0.9→1, opacity 0→1, 0.6s

---

### 4.6 Get Support (HelpPage)

**Status: MATCH — Needs back button + more top padding**

#### Layout
- Background: Pampas (#FAF9F7)
- Top padding: 56px
- Title: "Get support" — 24px/400, Spectra, Lato
- Font: Lato body, Inter for buttons

#### Emergency Pills (severity gradient)
| Service | Background | Text | Actions |
|---------|-----------|------|---------|
| 999 | `#DC2626` (deep red) | White | Call (white button, red text) |
| Samaritans | `#EF4444` (red) | White | Call (outline), Text (white button) |
| NHS 111 | `#F87171` (light red) | White | Call (outline), Online (white button) |
| University Security | `#FBBF24` (amber) | Spectra | Call (white button) |

All pills: 14px radius, 12px 16px padding, Inter 15px/600 name, 11px/0.85 description

#### Accordion Sections
- **University Wellbeing**: Expandable with ChevronDown animation
  - Service name: 14px/500 Inter, description: 13px at 0.45 opacity
  - Call button: Sinbad bg, Spectra text
  - Website button: white bg, 1px border
- **National Support**: Same pattern
  - Includes: Shout, Mind, Student Space, Papyrus

#### Footer
- "If you are outside the UK..." — 13px/300, 0.25 opacity

---

### 4.7 Bottom Navigation

**Status: MATCH — Fully ported**

| Property | Value |
|----------|-------|
| Background | White (#FFFFFF) |
| Border top | 1px solid #E5E7EB |
| Active colour | Buttercup (#F59E0B) |
| Inactive colour | `rgba(45,76,76,0.25)` |
| Icon size | 20px |
| Icon stroke width | 1.5 |
| Label font | Inter |
| Label size | 9px |
| Label weight | 600 (active) / 300 (inactive) |
| Label tracking | 0.05em |
| Safe area | `max(8px, env(safe-area-inset-bottom))` |
| **Hidden during** | Check-in conversation |

#### Tabs

| Tab | Label | Icon |
|-----|-------|------|
| home | Home | House outline with door |
| content | Content | Book/pages |
| buddies | Buddies | Two people silhouettes |
| profile | Profile | Single person silhouette |

---

### 4.8 Check-in Welcome (CheckInWelcome)

**Status: PARTIAL — Close but differs from design**

| Element | Design | Production |
|---------|--------|-----------|
| Background | Spectra (#2D4C4C) | Pampas (#FAF9F7) |
| Title size | 48px | 32px |
| Title font weight | 300 (Lato) | 300 (Lato) |
| Begin button | Buttercup bg, "Begin" | Buttercup bg, "Start check-in" |
| Camera/mic icons | Bottom-left, Sinbad | Not present |
| Student photo | Not in design | Present at top |

---

## 5. Kinetic Typography System

### How It Works

Jodie's AI responses include `*asterisks*` around emotionally resonant words. The `renderEmphasis()` function parses these and renders them with visual emphasis:

```typescript
// Input: "That's *really* good to hear."
// Output: "That's " + <em style="italic, sinbad, +6px">really</em> + " good to hear."
```

### Rendering Rules

| Property | Value |
|----------|-------|
| Font style | Italic |
| Font weight | 400 (slightly heavier than surrounding 300) |
| Colour | Sinbad (#99CCCE) accent |
| Size bump | Base font size + 6px (e.g., 34px base → 40px emphasis) |
| Spacing | If followed by punctuation: `marginRight: 2px` for optical balance |

### Production Integration

1. **Add to Jodie's system prompt:**
   > "Use *asterisks* around emotionally resonant or key words to indicate natural spoken emphasis. Use sparingly — typically 1–3 words per response. Choose words you would naturally stress if speaking aloud."

2. **Call `renderEmphasis()`** when rendering AI message text

3. **No post-processing needed** — the LLM handles emphasis placement natively

4. **Guardrail:** Cap at ~3 emphasized words per message to avoid noise

---

## 6. Files Still Using Old Colours

These files still contain pre-redesign purple/pink/blue gradient colours and need updating:

| File | Old Colours | What's Needed |
|------|------------|---------------|
| `ReturningSplashScreen.tsx` | `#667eea`, `#764ba2`, `#f093fb`, `#f5576c`, `#4facfe`, `#00f2fe` | Full rebrand to Spectra/Sinbad/Pampas |
| `baselineAssessment/ProcessingOverlay.tsx` | `#667eea`, `#764ba2`, `#f093fb`, `#f5576c`, `#4facfe`, `#00f2fe` | Full rebrand |
| `baselineAssessment/ErrorModal.tsx` | `#a855f7`, `#3b82f6` gradient button | Solid Spectra button |
| `CheckinAssessmentSDK.tsx` | `#667eea`, `#764ba2`, `#7c3aed`, `#6366f1` | Full rebrand (processing overlay + error button) |
| `SwipeableScoreCard.tsx` | `#7C3AED` pagination dots | Spectra/Sinbad dots |
| `NudgesDisplay.tsx` | `#9333EA`, `#E9D5FF`, `#FAF5FF` | Spectra/Sinbad service nudge styling |
| `MobileConversation.tsx` | `#8b5cf6` CSS variable override | Replace with Spectra |
| `HelpArticles.tsx` | `#8b5cf6` for "Student Life" category | Replace with Spectra or Sinbad |
| `ArticleViewer.tsx` | `#8b5cf6` for "student-life" category | Match HelpArticles |

---

## 7. Design Philosophy

### "Strava meets Headspace"
Confident, data-forward, not patronising. Users should feel like they're using a high-quality performance tool, not a therapeutic intervention.

> *"Should NOT be too touchy feely... hoping we are going to see young men engaging."*

### "Simple Surface, Depth on Demand"
Every dashboard element is a tappable card that opens to a detailed modal. The surface layer shows the minimum — score, mood number, streak count. Tap for the full picture.

### Score-State Colour as Differentiator
> *"An app that changes colour based on how you're feeling is instantly differentiating. No other wellbeing app does this."*

### The Five Hero Screens
These set the tone for everything else:
1. **Dashboard** (Poster Hero)
2. **Check-in** (Lyrics Scroll)
3. **Profile** (Wellbeing Report)
4. **Content** (Editorial)
5. **Loading/Splash**

> *"If we can set the tone with these then everything else will fall in behind — simple explanations, privacy, baseline loading etc. is largely informational and we can just work with typography and colour."*

### Safeguarding Priority
"Need Help?" is always visible on the dashboard — never hidden behind menus. Someone in crisis should not have to hunt for it.

### Phone-First Design
> *"This will be viewed 100% on a phone — contrast will be important — we should take as many learnings as we can around usability, fonts etc."*

---

## 8. Outstanding Work Summary

| Screen | Status | What's Needed |
|--------|--------|---------------|
| Dashboard (Poster Hero) | **MATCH** | Done. Worry text overflow fixed. |
| Content Page | **MATCH** | Done. |
| Buddies Page | **MATCH** | Done. |
| Profile Page | **PARTIAL** | Port: stats row, score trend, completion ring, wellbeing report, data ownership, legal, sign out |
| Check-in (Lyrics Scroll) | **NOT PORTED** | Port welcome + finish phases; adapt conversation phase for ElevenLabs voice widget |
| Get Support | **MATCH** | Add back button + increase top padding |
| Bottom Navigation | **MATCH** | Done. |
| Check-in Welcome | **PARTIAL** | Align background (Spectra), text scale (48px), remove student photo, add camera/mic icons |
| Splash Screens | **NOT PORTED** | Old gradients remain — full rebrand needed |
| Processing Overlays | **NOT PORTED** | Old gradients remain — full rebrand needed |
| 9 component files | **OLD COLOURS** | Cleanup old purple/pink hex codes |

---

## Appendix: File Inventory

### Fully Redesigned (48 files)
All registration flow, profile tabs, content, buddies, dashboard, modals, landing pages, emergency screens — using brand palette with new design patterns.

### Recolored Only (17 files)
Using neutral/semantic colours (Tailwind defaults) — no old purple/pink, but no brand colours either. These are functional but visually generic.

### Still Untouched (6 files)
ReturningSplashScreen, ProcessingOverlay, ErrorModal, CheckinAssessmentSDK — contain old gradient systems.

### Mixed (3 files)
Have brand colours AND residual old purple references (MobileConversation, HelpArticles, ArticleViewer).
