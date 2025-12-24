# Jekyll Migration Plan for SJLC Readings Frontend

## Overview

Migrate from the current shell + JavaScript injection architecture to Jekyll static site generator.

### Current Architecture (Problems)
```
reading.html (shell) → reading.js fetches fragment → injects into DOM
                     → updates OG tags via JavaScript (crawlers miss this)
```
- Header/footer duplicated in 5+ HTML files
- OG tags empty until JavaScript runs (bad for Facebook/Twitter sharing)
- Complex shell + fragment architecture

### New Architecture (Jekyll)
```
_layouts/default.html (header/footer/nav) → inherits to
_layouts/reading.html (reading structure) → applies to
years/2025/daily_readings/2025-09-08.html (content + metadata)
    ↓ builds to
_site/years/2025/daily_readings/2025-09-08.html (complete page with OG tags)
```

### Benefits
| Before | After |
|--------|-------|
| Edit 5+ files for header change | Edit 1 include |
| OG tags via JavaScript | Pre-built in HTML |
| Shell + fetch + inject | Direct static pages |
| Facebook sees generic banner | Facebook sees verse card |

---

## Phase 1: Jekyll Setup

### 1.1 Create `_config.yml` (root of frontend repo)
```yaml
title: Daily Bible Readings
description: St. John Lutheran Church Daily Bible Reading Program
url: https://mehoeppner-svg.github.io
baseurl: /sjlc-readings-frontend
permalink: pretty

exclude:
  - README.md
  - Gemfile
  - Gemfile.lock
  - node_modules
  - vendor
  - JEKYLL_MIGRATION_PLAN.md

defaults:
  - scope:
      path: ""
    values:
      layout: default
```

### 1.2 Create `Gemfile` (root of frontend repo)
```ruby
source "https://rubygems.org"
gem "jekyll", "~> 4.3"
gem "webrick"  # Required for Ruby 3.0+
```

---

## Phase 2: Create Layouts

### 2.1 Create `_layouts/default.html`
Extract common structure from existing pages:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    {% include og-tags.html %}
    <title>{{ page.title | default: site.title }} | St. John Lutheran Church</title>
    <link rel="stylesheet" href="{{ '/css/styles.css' | relative_url }}">
    {% if page.layout == 'reading' %}
    <link rel="stylesheet" href="{{ '/css/reading.css' | relative_url }}">
    {% endif %}
</head>
<body>
    <a href="#main-content" class="skip-link">Skip to main content</a>

    {% include header.html %}

    <main id="main-content">
        {{ content }}
    </main>

    <footer class="site-footer">
        {% include footer.html %}
    </footer>

    <script src="{{ '/js/app.js' | relative_url }}"></script>
    {% if page.extra_js %}
    <script src="{{ page.extra_js | relative_url }}"></script>
    {% endif %}
</body>
</html>
```

### 2.2 Create `_layouts/reading.html`
```html
---
layout: default
extra_js: /js/reading.js
---

<nav class="day-nav" id="dayNav" aria-label="Day navigation">
    <a href="{{ '/reading.html?date=' | append: page.prev_date | relative_url }}" class="nav-btn prev-btn" id="prevDayBtn" aria-label="Previous day">
        <span class="nav-arrow">‹</span>
    </a>
    <span class="current-date" id="currentDateDisplay">{{ page.date | date: "%B %d, %Y" }}</span>
    <a href="{{ '/reading.html?date=' | append: page.next_date | relative_url }}" class="nav-btn next-btn" id="nextDayBtn" aria-label="Next day">
        <span class="nav-arrow">›</span>
    </a>
</nav>

<div id="readingContent" class="loaded">
    {{ content }}
</div>

<div class="copy-fab" id="copyFab">
    <button class="copy-verse-btn" id="copyVerseBtn" aria-label="Copy selected verses">
        📋<span class="verse-count-badge" id="verseCountBadge">0</span>
    </button>
    <button class="clear-selection-btn" id="clearSelectionBtn" aria-label="Clear selection" style="display: none;">✕</button>
</div>
```

### 2.3 Create `_layouts/page.html`
```html
---
layout: default
---

{{ content }}
```

---

## Phase 3: Create Includes

### 3.1 Create `_includes/header.html`
Extract from current index.html:
```html
<header class="site-header">
    <div class="banner-container">
        <img src="{{ '/assets/banner.png' | relative_url }}" alt="St. John Lutheran Church" class="banner-image" loading="lazy">
        <div class="banner-overlay">
            <h1 class="site-title">Daily Bible Readings</h1>
            <p class="site-subtitle">St. John Lutheran Church &#8226; Boerne, TX</p>
        </div>
    </div>
    <nav class="main-nav" aria-label="Main navigation">
        <button class="nav-toggle" aria-label="Toggle navigation menu" aria-expanded="false">
            <span class="hamburger"></span>
        </button>
        <ul class="nav-list">
            <li><a href="{{ '/' | relative_url }}">Home</a></li>
            <li><a href="{{ '/reading.html' | relative_url }}">Today</a></li>
            <li><a href="{{ '/browse.html' | relative_url }}">Browse</a></li>
            <li><a href="{{ '/collections.html' | relative_url }}">Collections</a></li>
        </ul>
    </nav>
</header>
```

### 3.2 Create `_includes/footer.html`
```html
<p>Scripture quotations are from the ESV Bible, copyright Crossway.</p>
<p class="disclaimer">This site is a personal project created as a resource for our church community and is not endorsed or supported by St. John Lutheran Church.</p>
```

### 3.3 Create `_includes/og-tags.html`
```html
<meta property="og:type" content="{{ page.og_type | default: 'website' }}">
<meta property="og:title" content="{{ page.og_title | default: page.title | default: site.title }}">
<meta property="og:description" content="{{ page.og_description | default: page.description | default: site.description }}">
{% if page.og_image %}
<meta property="og:image" content="{{ page.og_image | absolute_url }}">
{% else %}
<meta property="og:image" content="{{ '/assets/banner.png' | absolute_url }}">
{% endif %}
<meta property="og:url" content="{{ page.url | absolute_url }}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ page.og_title | default: page.title | default: site.title }}">
<meta name="twitter:description" content="{{ page.og_description | default: page.description | default: site.description }}">
{% if page.og_image %}
<meta name="twitter:image" content="{{ page.og_image | absolute_url }}">
{% endif %}
```

---

## Phase 4: Daily Readings Generator Plugin

### 4.1 Create `_plugins/daily_readings_generator.rb`
```ruby
require 'json'
require 'date'

module Jekyll
  class DailyReadingsGenerator < Generator
    safe true
    priority :normal

    def generate(site)
      # Find all readings.json files
      Dir.glob(File.join(site.source, 'years', '*', 'readings.json')).each do |json_file|
        year = File.basename(File.dirname(json_file))

        begin
          data = JSON.parse(File.read(json_file))
        rescue JSON::ParserError => e
          Jekyll.logger.warn "DailyReadings:", "Could not parse #{json_file}: #{e.message}"
          next
        end

        readings = data['readings'] || []

        readings.each_with_index do |reading, idx|
          date = reading['date']
          fragment_path = File.join(site.source, 'years', year, 'daily_readings', "#{date}_reading.html")

          next unless File.exist?(fragment_path)

          # Calculate prev/next dates
          date_obj = Date.parse(date)
          prev_date = (date_obj - 1).strftime('%Y-%m-%d')
          next_date = (date_obj + 1).strftime('%Y-%m-%d')

          # Create page with metadata
          page = ReadingPage.new(
            site,
            year,
            date,
            reading,
            File.read(fragment_path),
            prev_date,
            next_date
          )
          site.pages << page
        end
      end
    end
  end

  class ReadingPage < Page
    def initialize(site, year, date, reading, content, prev_date, next_date)
      @site = site
      @base = site.source
      @dir = "years/#{year}/daily_readings"
      @name = "#{date}_reading.html"

      self.process(@name)
      self.data = {
        'layout' => 'reading',
        'title' => reading['passage'],
        'date' => date,
        'passage' => reading['passage'],
        'collection' => reading['collection'],
        'theme' => reading['theme'],
        'prev_date' => prev_date,
        'next_date' => next_date,
        'og_title' => "#{reading['passage']} - Daily Reading",
        'og_description' => "Read #{reading['passage']} - Daily Bible Readings from St. John Lutheran Church",
        'og_image' => "/years/#{year}/images/#{date}_verse_card.webp",
        'og_type' => 'article'
      }
      self.content = content
    end
  end
end
```

---

## Phase 5: Convert Static Pages

### 5.1 Convert `index.html`
Add frontmatter at top, remove header/footer HTML:
```yaml
---
layout: default
title: Home
description: Daily Bible Readings from St. John Lutheran Church - Join us each day as we journey through Scripture together.
og_image: /assets/banner.png
---
```
Then keep only the content inside `<main>` (hero section, features, church info).

### 5.2 Convert `browse.html`
```yaml
---
layout: page
title: Browse Readings
description: Browse daily Bible readings by date or search for specific passages.
extra_js: /js/browse.js
---
```

### 5.3 Convert `collections.html`
```yaml
---
layout: page
title: Collections
description: Explore our Bible reading collections and programs.
extra_js: /js/collections.js
---
```

### 5.4 Convert `collections/gospel-project.html`
```yaml
---
layout: page
title: The Gospel Project
description: Journey through the grand narrative of Scripture with The Gospel Project.
extra_js: /js/gospel-project.js
---
```

---

## Phase 6: Update JavaScript

### 6.1 Modify `js/reading.js`
Since Jekyll now generates complete pages (not fragments), simplify:
- Remove the `loadReading()` function that fetches fragments
- Keep all feature initialization (settings, verse selector, footnotes, share, etc.)
- The reading content is already in the page, so just init features on DOMContentLoaded

Key change - replace the init section:
```javascript
// OLD: Fetched fragment and injected
// NEW: Content already present, just init features
function init() {
    // Features init only - no content loading
    initReadingFeatures();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
```

### 6.2 `js/browse.js` - No Changes Needed
Links already use `reading.html?date=YYYY-MM-DD` format which will work.

### 6.3 `js/app.js` - Remove Footer Injection
Since footer is now in layout, remove the `initFooter()` function that injects content.

---

## Phase 7: GitHub Actions Workflow

### 7.1 Create `.github/workflows/jekyll.yml`
```yaml
name: Build and Deploy Jekyll

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.2'
          bundler-cache: true

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Build with Jekyll
        run: bundle exec jekyll build
        env:
          JEKYLL_ENV: production

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: _site

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## Phase 8: Testing

### 8.1 Local Testing
```bash
cd c:\pyApps\sjlc-readings-frontend
bundle install
bundle exec jekyll serve
```
Visit http://localhost:4000/sjlc-readings-frontend/

### 8.2 Verify
1. Home page loads with header/footer from includes
2. Reading pages have correct OG tags (view source)
3. Browse calendar works and links to readings
4. All JavaScript features work (settings, verse selection, share, etc.)
5. Navigation between days works

---

## Files Summary

### Create These Files:
| Path | Description |
|------|-------------|
| `_config.yml` | Jekyll configuration |
| `Gemfile` | Ruby dependencies |
| `_layouts/default.html` | Base layout with header/footer |
| `_layouts/reading.html` | Reading page layout |
| `_layouts/page.html` | Static page layout |
| `_includes/header.html` | Site header + navigation |
| `_includes/footer.html` | Site footer |
| `_includes/og-tags.html` | Open Graph meta tags |
| `_plugins/daily_readings_generator.rb` | Generates reading pages from fragments |
| `.github/workflows/jekyll.yml` | CI/CD workflow |

### Modify These Files:
| Path | Change |
|------|--------|
| `index.html` | Add frontmatter, remove header/footer/html structure |
| `browse.html` | Add frontmatter, remove header/footer/html structure |
| `collections.html` | Add frontmatter, remove header/footer/html structure |
| `collections/gospel-project.html` | Add frontmatter, remove header/footer/html structure |
| `js/reading.js` | Remove fragment loading, keep feature init |
| `js/app.js` | Remove footer injection code |

### Keep Unchanged:
- All CSS files (`css/*.css`)
- Image files (`assets/`, `years/*/images/`)
- `readings.json` files
- Most JavaScript functionality

---

## Backend Notes

The backend (sjlc-private) continues to generate:
- `years/{year}/daily_readings/{date}_reading.html` - HTML fragments
- `years/{year}/images/{date}_verse_card.webp` - Verse card images
- `years/{year}/readings.json` - Metadata

No backend changes required. The Jekyll plugin reads these files and wraps them with layouts.

---

## Implementation Order

1. Create Jekyll config files (`_config.yml`, `Gemfile`)
2. Create `_layouts/` directory with layout files
3. Create `_includes/` directory with include files
4. Create `_plugins/` directory with generator
5. Convert static pages (add frontmatter, strip boilerplate)
6. Update JavaScript files
7. Create GitHub Actions workflow
8. Test locally
9. Push and verify deployment

---

**Created:** 2025-12-23
**Status:** Ready for implementation
