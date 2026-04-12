# Terminal 2: Frontend UI & Orchestration

## Your Role
You are building the **frontend UI and orchestration layer** for a web app called "Research Gap Finder." This app helps researchers find gaps in medical literature. You are one of 4 parallel Claude Code terminals building this app simultaneously. Each terminal owns specific files — do NOT create or modify any file not listed below.

**You are the most critical terminal.** You create the HTML entry point that loads all other modules, the main stylesheet, and the app orchestrator that wires everything together.

## Files You Create
1. `index.html` — The single HTML entry point
2. `css/styles.css` — Custom styles extending Tailwind
3. `js/app.js` — Main app controller, UI logic, DOM management, orchestration

## Project Path
`C:/Users/dbous/code/Projects/research-gap-finder/`

## Tech Stack
- Vanilla HTML/CSS/JavaScript (NO frameworks, NO build step, NO ES modules)
- Tailwind CSS via CDN for utility classes
- Chart.js and D3 loaded via CDN (used by Terminal 3, not by you)
- All JS files use `window.*` globals and communicate via CustomEvents
- Must work by opening `index.html` directly in Chrome (file:// protocol)

---

## index.html Structure

### CDN Dependencies and CSS (load in this order in `<head>`):
```html
<link rel="stylesheet" href="css/styles.css">
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7"></script>
<script src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js"></script>
```
**IMPORTANT**: The `<link>` to `styles.css` MUST be in `<head>`, not in `<body>`. Placing it in body causes a flash of unstyled content.

### Tailwind Config (in `<head>` after Tailwind CDN):
```html
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          navy: { 900: '#0a192f', 800: '#112240', 700: '#1d3557' },
          teal: { 400: '#64ffda', 500: '#4dd8b4' },
          slate: { 300: '#ccd6f6', 400: '#8892b0' }
        }
      }
    }
  }
</script>
```

### App Scripts (load at end of `<body>` in this exact order):
```html
<!-- Data layer first -->
<script src="data/sampleData.js"></script>
<script src="js/dataService.js"></script>
<!-- Analysis engine -->
<script src="js/analysisEngine.js"></script>
<!-- Visualizations -->
<script src="js/visualizations.js"></script>
<!-- App controller last (orchestrates everything) -->
<script src="js/app.js"></script>
```

---

## Page Layout

### Design Direction
- **Dark theme**: Navy background (#0a192f), teal accents (#64ffda), light text (#ccd6f6)
- **Dashboard aesthetic**: Clean, data-dense but readable. Think Bloomberg terminal meets medical journal.
- **Glass-morphism cards**: Semi-transparent backgrounds with backdrop-blur
- **Animations**: Fade-in for cards, pulse for loading states, smooth transitions

### Sections (top to bottom):

#### 1. Header / Hero
- App title: "Research Gap Finder"
- Tagline: "Discover untapped research opportunities in any medical field"
- Subtle animated background gradient or pattern (optional, keep simple)

#### 2. Search Section
- Large centered search input with placeholder "Enter a medical specialty or research topic..."
- Search button with teal accent
- Quick-select chips below the input for pre-loaded specialties:
  - "AI in Surgical Outcomes"
  - "AI in Radiology & Diagnostic Imaging"
  - "LLMs in Clinical Decision Support"
- Clicking a chip fills the search input and triggers search

#### 3. Status Bar (hidden until search starts)
- Horizontal bar showing pipeline progress
- Stages: "Searching databases..." → "Analyzing papers..." → "Identifying gaps..." → "Generating ideas..." → "Complete"
- Animated progress indicator (pulsing dots or progress bar)
- ID: `#status-bar`

#### 4. Stats Overview (hidden until papers loaded)
- Row of 4-5 stat cards showing:
  - Total papers found
  - Year range
  - Databases searched
  - Top keywords (as small tags)
- ID: `#stats-overview`

#### 5. Results Dashboard (hidden until analysis complete)
Wrap the entire results section in a single container with `id="results-dashboard"`. Hide this element on load (`display: none` or a `hidden` class). Show it as a unit when `rgf:analysis-ready` fires. This is the main content area. Use a responsive grid layout:

**Left Column (~30%): Paper List**
- Scrollable list of paper cards
- Each card shows: title, authors (truncated), journal, year, source badge
- Click to expand and show abstract
- ID: `#paper-list`

**Center Column (~40%): Visualizations**
- Research Landscape Map (the hero visualization)
  - Container ID: `#landscape-canvas` — Terminal 3 renders into this
  - Make this container prominent — at least 400px tall
- Gap Severity Chart below
  - Container ID: `#gap-chart-container` — Terminal 3 renders here
- Publication Timeline (small)
  - Container ID: `#timeline-container` — Terminal 3 renders here

**Right Column (~30%): Gaps & Ideas**
- Gap cards section
  - Each gap card: title, description, severity badge (color-coded), category tag
  - ID: `#gap-list`
- Project idea cards section
  - Each idea card: title, study design badge, feasibility score (as a colored bar/meter), timeline estimate
  - Click to expand for full details
  - ID: `#idea-list`
- Feasibility radar charts
  - Container ID: `#feasibility-chart-container` — Terminal 3 renders here

#### 6. Footer
- "Built live with Claude Code at CCAIR" text
- Small database coverage chart
  - Container ID: `#coverage-container` — Terminal 3 renders here

#### 7. Hidden Admin Panel
- A collapsible panel (toggled by pressing Ctrl+Shift+A or a tiny gear icon)
- Contains a `<textarea id="admin-textarea">` for pasting raw MCP output
- A `<button id="admin-parse-btn">Parse & Add</button>` that calls `DataService.parseMcpResults(document.getElementById('admin-textarea').value)`
- This is for the presenter to inject live data during the demo
- Panel wrapper ID: `#admin-panel`

---

## DOM Element IDs Contract

These IDs MUST exist exactly as specified — other terminals depend on them:

```
#status-bar                    — Status/progress display
#stats-overview                — Summary statistics row
#results-dashboard             — Wrapper for entire results section (hide/show as unit)
#paper-list                    — Paper cards container
#landscape-canvas              — D3 landscape visualization (Terminal 3)
#gap-chart-container           — Gap severity bar chart (Terminal 3)
#timeline-container            — Publication timeline sparkline (Terminal 3)
#gap-list                      — Gap cards container
#idea-list                     — Project idea cards container
#feasibility-chart-container   — Feasibility radar charts (Terminal 3)
#coverage-container            — Database coverage donut (Terminal 3)
#admin-panel                   — Hidden admin textarea for live data injection
```

---

## Shared Data Contract

### ResearchData (you CREATE this on window)
```javascript
window.ResearchData = {
  query: "",
  status: "idle",       // "idle" | "searching" | "analyzing" | "complete" | "error"
  statusMessage: "",
  papers: [],            // Array<Paper> — populated by Terminal 1
  gaps: [],              // Array<Gap> — populated by Terminal 4
  ideas: [],             // Array<ProjectIdea> — populated by Terminal 4
  landscape: null,       // LandscapeData | null — populated by Terminal 4
  metadata: {
    searchTimestamp: null,
    totalPapersFound: 0,
    databasesSearched: [],
    analysisVersion: "1.0"
  }
};
```

### Paper Object
```javascript
{
  id: "pmid_12345678", title: "", authors: [], journal: "", year: 2024,
  abstract: "", url: "", pmid: "", source: "pubmed",
  keywords: [], citationCount: null, fullTextAvailable: false
}
```

### Gap Object
```javascript
{
  id: "gap_1", title: "", description: "", category: "",  // "methodology" | "population" | "outcome" | "comparison" | "setting"
  severity: 0,  // 1-10
  supportingPaperIds: [], keywords: [], evidenceQuotes: []
}
```

### ProjectIdea Object
```javascript
{
  id: "idea_1", title: "", description: "", gapId: "gap_1",
  studyDesign: "",  // e.g. "Retrospective cohort", "RCT", "Systematic review"
  feasibility: {
    overall: 0,            // 1-100
    dataAvailability: 0,   // 1-100
    costEstimate: "",      // "low" | "medium" | "high"
    timelineMonths: 0,
    technicalComplexity: 0, // 1-100
    novelty: 0,            // 1-100
    clinicalImpact: 0      // 1-100
  },
  suggestedDatabases: [], estimatedSampleSize: "", potentialJournals: []
}
```

---

## Event Contract

### Events you DISPATCH:
```javascript
// When user submits a search:
window.dispatchEvent(new CustomEvent("rgf:search-start", {
  detail: { query: "user's search text" }
}));
```

### Events you LISTEN to:
```javascript
// Papers are ready (from Terminal 1):
window.addEventListener("rgf:papers-ready", function(e) {
  // e.detail.papers — array of Paper objects
  // Update paper list UI, show stats, trigger analysis
});

// Analysis complete (from Terminal 4):
window.addEventListener("rgf:analysis-ready", function(e) {
  // e.detail has: gaps, ideas, landscape
  // Update gap cards, idea cards, show visualization containers
});

// Status updates (from any terminal):
window.addEventListener("rgf:status-update", function(e) {
  // e.detail has: status, message
  // Update the status bar
});

// Errors (from any terminal):
window.addEventListener("rgf:error", function(e) {
  // e.detail has: source, message
  // Show error in UI
});
```

---

## js/app.js — Orchestration Logic

### On page load:
1. Initialize `window.ResearchData`
2. Set up all event listeners
3. Bind search form submit
4. Bind specialty chip clicks
5. Bind admin panel toggle (Ctrl+Shift+A)
6. Log "App: initialized, waiting for user input"

### Search flow:
```
User clicks search or chip
  → app.js dispatches "rgf:search-start" with query
  → Show status bar, hide results
  → DataService hears event, loads papers, dispatches "rgf:papers-ready"

app.js hears "rgf:papers-ready"
  → Render paper cards in #paper-list
  → Show #stats-overview with paper stats (call DataService.getStats() HERE, after papers are loaded)
  → Update status bar to "Analyzing..."
  → Call window.AnalysisEngine.analyze(papers) if it exists
  → If AnalysisEngine doesn't exist yet, show papers only (graceful degradation)

app.js hears "rgf:analysis-ready"
  → Read gaps/ideas/landscape from window.ResearchData (Terminal 4 is the authority for this data)
  → Render gap cards in #gap-list
  → Render idea cards in #idea-list
  → Show #results-dashboard wrapper
  → Visualizations module hears the same event and renders charts
  → Update status bar to "Complete"
```

**CRITICAL: `AnalysisEngine.analyze()` is ASYNCHRONOUS (fire-and-forget).** It uses internal setTimeout chains and delivers results via the `rgf:analysis-ready` event. Do NOT use its return value. Do NOT write code like `var result = AnalysisEngine.analyze(papers); renderGaps(result.gaps);` — this will break. Instead, call `analyze(papers)` and wait for the `rgf:analysis-ready` event.

**State authority:** Terminal 4 (AnalysisEngine) is the sole writer to `window.ResearchData.gaps`, `window.ResearchData.ideas`, and `window.ResearchData.landscape`. In your `rgf:analysis-ready` handler, read from `window.ResearchData` — do NOT re-write these fields from `e.detail`.

### Paper card rendering:
```javascript
function renderPaperCard(paper) {
  // Create a card div with:
  // - Title (clickable, links to paper.url)
  // - Authors (first 3 + "et al." if more)
  // - Journal name + year
  // - Source badge (PubMed = blue, Scholar = purple)
  // - Keywords as small tags
  // - Expandable abstract (collapsed by default, click to toggle)
}
```

### Gap card rendering:
```javascript
function renderGapCard(gap) {
  // Create a card div with:
  // - Title
  // - Severity indicator (1-10 as colored bar: green=low, yellow=medium, red=high)
  // - Category badge (methodology, population, outcome, comparison, setting)
  // - Description text
  // - "X papers reference this gap" count
}
```

### Idea card rendering:
```javascript
function renderIdeaCard(idea) {
  // Create a card div with:
  // - Title
  // - Study design badge
  // - Feasibility overall score as colored progress bar (0-100)
  // - Timeline estimate: "~X months"
  // - Cost badge: low/medium/high
  // - Expandable details: full description, suggested databases, sample size, target journals
}
```

---

## css/styles.css — Custom Styles

### Must include:
```css
/* Base */
body { background-color: #0a192f; color: #ccd6f6; }

/* Glass card effect */
.glass-card {
  background: rgba(17, 34, 64, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 255, 218, 0.1);
  border-radius: 8px;
}

/* Animations */
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.fade-in { animation: fadeInUp 0.5s ease-out forwards; }
.pulse { animation: pulse 1.5s ease-in-out infinite; }

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #112240; }
::-webkit-scrollbar-thumb { background: #64ffda; border-radius: 3px; }

/* Severity colors */
.severity-low { color: #64ffda; }
.severity-medium { color: #ffd700; }
.severity-high { color: #ff6b6b; }

/* Source badges */
.badge-pubmed { background: #1e40af; color: white; }
.badge-scholar { background: #7c3aed; color: white; }

/* Category badges */
.badge-methodology { background: #0891b2; }
.badge-population { background: #059669; }
.badge-outcome { background: #d97706; }
.badge-comparison { background: #dc2626; }
.badge-setting { background: #7c3aed; }

/* Chart containers */
#landscape-canvas { min-height: 400px; }
#gap-chart-container { min-height: 250px; }
#feasibility-chart-container { min-height: 300px; }
#timeline-container { min-height: 80px; }
#coverage-container { min-height: 150px; }
```

### Design notes:
- Use Tailwind utility classes for layout (grid, flex, spacing, responsive)
- Use custom CSS only for things Tailwind doesn't cover (animations, glass effect, scrollbar)
- All visualization containers should have a subtle border and "empty state" message when no data is loaded
- Cards should have hover effects (slight border glow, scale transform)
- The overall page should feel like a professional dashboard, not a homework project

---

## Interface You Expose

```javascript
window.App = {
  init: function() {},
  showSection: function(sectionId) {},
  hideSection: function(sectionId) {},
  showError: function(message) {},
  showLoading: function(isLoading) {},
  renderPapers: function(papers) {},
  renderGaps: function(gaps) {},
  renderIdeas: function(ideas) {},
  updateStatus: function(status, message) {}
};
```

---

## Defensive Coding Requirements
- Check that `window.DataService`, `window.AnalysisEngine`, `window.Visualizations` exist before calling them
- If a module doesn't exist (hasn't loaded yet), degrade gracefully — show what you can
- Use `?.` optional chaining and `|| []` defaults throughout
- All DOM queries should check for null before manipulating
- Console.log key milestones: "App: initialized", "App: search started for X", "App: rendering N papers", etc.

---

## What NOT To Do
- Do NOT create dataService.js, analysisEngine.js, visualizations.js, or sampleData.js
- Do NOT use ES module syntax (import/export)
- Do NOT use React, Vue, or any framework
- Do NOT make any network/fetch calls
- Do NOT use alerts or confirm dialogs

---

## Testing
After creating all 3 files, open `index.html` in Chrome and verify:
1. Page loads with dark theme and search bar visible
2. Clicking a specialty chip triggers a search
3. Paper cards appear (even if analysis/visualization modules aren't loaded yet)
4. All DOM container IDs exist in the page
5. No console errors

Start building now. Create `index.html` first, then `css/styles.css`, then `js/app.js`.
