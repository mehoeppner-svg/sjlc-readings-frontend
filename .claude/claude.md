# SJLC Daily Bible Readings - Frontend

## Project Overview

Public-facing website for St. John Lutheran Church's daily Bible reading program. Hosted on GitHub Pages, this site provides congregation members with beautifully designed pages for daily Scripture readings, including verse cards, audio, and devotional content.

**Purpose:** Help St. John Lutheran Church congregation engage with daily Bible readings through visual and audio content.

**Live URL:** https://mehoeppner-svg.github.io/sjlc-readings-frontend/

**Repository:** Public GitHub Pages site (sjlc-readings-frontend)

---

## CRITICAL: Reading Page Architecture

### Shell + Fragment Pattern (DO NOT CHANGE)

The daily reading page uses a **shell + fragment injection** architecture:

```
reading.html (SHELL)              Fragment (CONTENT ONLY)
├── <!DOCTYPE html>               ├── <div class="daily-reading-container">
├── <html><head>                  │   ├── .reading-header
│   └── <link href="reading.css"> │   ├── .image-section OR .verse-card-container
├── <body>                        │   ├── .audio-section
│   ├── .site-header (banner)     │   ├── .bible-content-container
│   ├── .main-nav                 │   │   ├── .settings-wrapper
│   ├── #main-content             │   │   ├── .share-section
│   │   ├── #loadingState         │   │   └── .bible-content
│   │   ├── #errorState           │   └── .additional-content
│   │   ├── #dayNav               └── </div>
│   │   └── #readingContent ◄──── FRAGMENT INJECTED HERE
│   └── .site-footer
└── <script src="reading.js">
```

### How It Works

1. User visits `reading.html?date=2025-11-29` (or just `reading.html` for today)
2. `reading.js` extracts date from URL query parameter
3. `reading.js` fetches `years/2025/daily_readings/2025-11-29_reading.html`
4. Fragment HTML is injected into `#readingContent` div
5. `reading.js` initializes interactive features (settings, verse selection, share, etc.)

### Key Rules for Generated Fragments

**The backend generates FRAGMENTS, not complete HTML pages:**

1. **NO DOCTYPE, html, head, body tags** - fragment starts with `<div class="daily-reading-container">`
2. **Image paths must be ABSOLUTE from site root**: `years/{year}/images/{filename}`
   - NOT relative like `../images/` (breaks when injected into root-level shell)
3. **Audio section must be OUTSIDE bible-content-container** (between image and text)
4. **NO nested `.bible-content` divs** - ESV HTML goes directly inside the one `.bible-content` div
5. **No inline `<script>` or `<style>` tags** - all JS/CSS handled by shell

### File Locations

| What | Path |
|------|------|
| Shell page | `reading.html` |
| Shell CSS | `css/reading.css` |
| Shell JS | `js/reading.js` |
| Generated fragments | `years/{year}/daily_readings/{date}_reading.html` |
| Generated images | `years/{year}/images/{date}_verse_card.webp` |

### Reference Implementation

Working standalone example (old format): `years/2025/daily_readings/2025-09-08_reading.html` (Genesis)
- Shows correct structure for the CONTENT portion
- New fragments should match this structure but WITHOUT shell elements

---

## Code Modification Rules

**Can modify directly (no approval needed):**
- All HTML, CSS, and JavaScript files
- Page templates and components
- Design system and styling
- Assets (images, fonts, icons)

**Coordinate with backend repo (sjlc-private) for:**
- API data structures and contracts
- Content generation workflows
- Database schema changes affecting frontend

---

## Repository Structure

```
sjlc-readings-frontend/
├── index.html                    # Home page
├── reading.html                  # Daily reading SHELL (loads fragments via JS)
├── daily.html                    # Old standalone daily reading page
├── browse.html                   # Browse readings (calendar view)
├── collections.html              # Gospel Project / collection pages
├── css/
│   ├── styles.css                # Main stylesheet (home, collections)
│   ├── reading.css               # Reading page styles (shell + content)
│   ├── browse.css                # Browse page styles (calendar, search)
│   └── daily-reading.css         # Old standalone page styles
├── js/
│   ├── app.js                    # Shared JavaScript (nav toggle, etc.)
│   ├── reading.js                # Reading page JS (fetch, inject, features)
│   ├── browse.js                 # Browse page JS (calendar, search)
│   └── daily-reading.js          # Old standalone page JS
├── assets/
│   └── banner.png                # Site banner image
├── years/                        # Generated content (from backend)
│   └── {year}/
│       ├── readings.json         # Metadata for browse page (passages, dates, collections)
│       ├── daily_readings/       # HTML FRAGMENTS (not complete pages)
│       │   └── {date}_reading.html
│       └── images/               # Verse card images
│           └── {date}_verse_card.webp
└── .claude/
    └── CLAUDE.md                 # This file
```

---

## Design System

### Color Palette
| Name | Hex | Usage |
|------|-----|-------|
| Accent | `#72abbf` | Links, buttons, highlights, current state |
| Text Primary | `#424547` | Main body text, headings |
| Text Secondary | `#5e6266` | Subtitles, descriptions |
| Text Tertiary | `#9a9fa3` | Muted text, placeholders |
| Background | `#f8f9fa` | Page backgrounds, cards |
| Border | `#dce0e3` | Dividers, input borders |
| Completed | `#4caf50` | Success states, checkmarks |
| Footnote | `#c07830` | Footnote markers (brown/orange) |
| Crossref | `#3a8fb7` | Cross-reference markers (blue) |

### Typography
| Element | Font Stack | Size | Weight |
|---------|------------|------|--------|
| Headings | "Sentinel", "Gentium Plus", Georgia, serif | 1.5-3rem | 500-600 |
| Body | "Gotham", Helvetica, Arial, sans-serif | 1rem | 400 |
| Bible Text | Serif stack | 1.1rem | 300 |
| Verse Numbers | Sans stack | 0.7rem | 400 |

### CSS Variables
```css
:root {
    --bible-serif-font: "Sentinel", "Gentium Plus", Georgia, Times, serif;
    --bible-sans-font: "Gotham", Helvetica, Arial, sans-serif;
    --bible-text-color: #424547;
    --bible-secondary-color: #5e6266;
    --bible-tertiary-color: #9a9fa3;
    --bible-link-color: #72abbf;
    --bible-bg-color: #fff;
    --bible-border-color: #dce0e3;
    --bible-serif-size: 1.1rem;
    --bible-line-height: 1.7rem;
    --accent-color: #72abbf;
    --footnote-color: #c07830;
    --crossref-color: #3a8fb7;
    --light-bg: #f8f9fa;
}
```

### Responsive Breakpoints
- **Mobile:** < 768px (single column, stacked layouts)
- **Tablet/Desktop:** >= 768px (multi-column grids)

### Interaction Patterns
- Transitions: 0.2s-0.3s ease
- Hover effects: translateY(-2px to -4px), subtle shadows
- Active states: translateY(-1px)
- Focus: 3px rgba accent outline

---

## Page Templates

### 1. Home Page (index.html)
- Hero section with tagline and description
- 2x2 feature grid (Scripture, Audio, Visual, Devotional)
- Church worship times and location
- CTA buttons to today's reading and browse

### 2. Daily Reading Page (daily.html)
- Verse card image (400x225px, 16:9 aspect ratio)
- ESV audio player (toggleable)
- Settings menu (gear icon) with display preferences
- Share button (Web Share API + clipboard fallback)
- ESV Bible text with preserved formatting
- Footnotes & cross-references (modal popups)
- Commentary & devotional (slide-out panels)
- Verse selection and copy feature

### 3. Browse Page (browse.html) - IMPLEMENTED
- Interactive monthly calendar with color-coded days
- Month/year navigation (arrows + dropdowns)
- Passage search (searches all years on Enter/button click)
- Search results with date, passage, collection badges
- Dynamic legend from collections data
- Days with readings have accent-colored left border
- Today highlighted with accent border ring
- Clicking a day navigates to reading.html?date=YYYY-MM-DD
- Data source: `years/{year}/readings.json` (one per year)

### 4. Collections Page (collections.html)
- Collection description and timeline
- Visual progress indicator
- Collapsible accordion for themes
- Status indicators (completed, current, upcoming)
- Daily reading links within each theme

---

## Cross-Browser Compatibility

### Target Browsers
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile Safari (iOS 14+)
- Chrome for Android

### Key Considerations
1. **CSS Grid/Flexbox:** Use with appropriate fallbacks
2. **CSS Variables:** Supported in all target browsers
3. **Web Share API:** Use with clipboard fallback
4. **LocalStorage:** For user preferences
5. **Audio element:** Native HTML5, works everywhere
6. **Touch events:** Support long-press for mobile

### Testing Checklist
- [ ] Desktop: Chrome, Firefox, Safari, Edge
- [ ] Mobile: iOS Safari, Android Chrome
- [ ] Tablet: iPad Safari, Android tablet
- [ ] Screen sizes: 320px, 768px, 1024px, 1440px
- [ ] Dark mode: Respect system preferences (future)

---

## Accessibility (WCAG 2.1)

### Requirements
- Color contrast ratio: 4.5:1 minimum (AA)
- Focus indicators: Visible on all interactive elements
- Alt text: All images must have descriptive alt text
- Keyboard navigation: Full site navigable via keyboard
- Screen readers: Semantic HTML, ARIA labels where needed
- Touch targets: Minimum 44x44px on mobile

### Implementation
```css
/* Focus styles */
:focus {
    outline: 3px solid rgba(114, 171, 191, 0.5);
    outline-offset: 2px;
}

/* Skip link */
.skip-link {
    position: absolute;
    left: -9999px;
}
.skip-link:focus {
    left: 0;
    top: 0;
    z-index: 9999;
}
```

---

## Performance Guidelines

### Image Optimization
- Format: WebP for verse cards (with JPEG fallback)
- Size: 896x512px max, compressed
- Lazy loading: Use `loading="lazy"` attribute

### CSS/JS
- Inline critical CSS for above-the-fold content
- Defer non-critical JavaScript
- Minimize external dependencies

### Caching
- Use GitHub Pages caching (max-age headers)
- Version assets with query strings for cache busting

---

## Content Generation (from Backend)

The backend (sjlc-private) generates content and pushes to this repo:

### Readings Metadata (per year)
```
years/{year}/readings.json
```
Contains: List of all readings for that year with metadata for browse page.

**Schema:**
```json
{
  "year": 2025,
  "lastUpdated": "2025-11-30T00:00:00Z",
  "collections": [
    { "id": "gospel-project", "name": "The Gospel Project", "color": "#20b2aa" }
  ],
  "readings": [
    { "date": "2025-09-08", "passage": "Genesis 1:1-13", "title": null, "collection": "gospel-project" }
  ]
}
```

**Note:** Backend should regenerate this file whenever readings are added/modified. Consider adding a "reverify" admin command.

### Daily Reading Files
```
years/{year}/daily_readings/{YYYY-MM-DD}_reading.html
```
Contains: Bible text, verse card path, audio URL, metadata

### Verse Card Images
```
years/{year}/images/{YYYY-MM-DD}_verse_card.webp
```
Generated by Pillow with text baked in

### Static Files
- `css/styles.css` - Shared styles
- `js/app.js` - Shared JavaScript

---

## Development Workflow

### Local Development
1. Clone the repo
2. Open `index.html` in browser (or use live server)
3. Edit HTML/CSS/JS files
4. Test across browsers
5. Commit and push to deploy

### Deployment
- Push to `main` branch
- GitHub Pages automatically deploys
- Changes live within minutes

### Testing New Features
1. Create feature branch
2. Develop and test locally
3. Cross-browser testing
4. Merge to main
5. Verify on production

---

## Reference: Testing Templates

The original testing templates in `sjlc-private/testing/` serve as the reference implementation:

| Template | Description |
|----------|-------------|
| `test-home-page.html` | Home page design |
| `test-browse-page.html` | Calendar/browse design |
| `test-daily-reading.html` | Daily reading with all features |
| `test-gospel-page.html` | Collection/timeline design |
| `GOOGLE_SITE_PLAN.md` | Original planning document |

---

## Key Features to Implement

### Verse Selection System
- Click to select/deselect verses
- Visual indicator: dotted underline + subtle background
- Copy button (FAB) with verse count
- Smart reference formatting (consecutive vs non-consecutive)
- Keyboard shortcuts: Ctrl+C to copy, ESC to clear
- Mobile: long-press to select with vibration

### Display Settings
- Toggle verse card visibility
- Toggle audio player
- Toggle footnotes
- Toggle cross-references
- Persist preferences in LocalStorage

### Share Functionality
- Web Share API for native sharing
- Clipboard fallback for desktop
- Copy link with toast notification

### Modal System
- Footnote popups (positioned above click)
- Cross-reference popups with ESV.org links
- Commentary/devotional slide-out panels

---

## Church Information

**St. John Lutheran Church**
- Address: 315 Rosewood Avenue, Boerne, TX 78006
- Phone: (830) 249-3651
- Email: info@stjohnlutheran.com
- Website: https://www.stjohnlutheran.com/
- Livestream: https://www.stjohnlutheran.com/livestream/

**Worship Times:**
- 8:00 AM - Traditional Worship
- 9:30 AM - Praise Worship
- 11:00 AM - Traditional Worship

---

## Notes

- No external CSS/JS frameworks (vanilla only)
- All styles inline-compatible for potential Google Sites embedding
- Banner image at `assets/banner.png`
- Images hosted on GitHub Pages (not Google Drive) for CORS-free copy-to-clipboard
- ESV.org typography preserved for Bible text authenticity

---

**Last Updated:** 2025-11-30
**Status:** Browse page implemented with calendar and search. Collections page still needs implementation.
