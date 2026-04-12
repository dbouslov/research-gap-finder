# Terminal 3: Data Visualizations

## Your Role
You are building the **data visualization module** for a web app called "Research Gap Finder." This app helps researchers find gaps in medical literature. You are one of 4 parallel Claude Code terminals building this app simultaneously. Each terminal owns specific files — do NOT create or modify any file not listed below.

Your visualizations are what makes this app look impressive. They need to be polished, animated, and visually striking on a dark background.

## Files You Create
1. `js/visualizations.js` — All chart and visualization rendering

**That is the ONLY file you create.**

## Project Path
`C:/Users/dbous/code/Projects/research-gap-finder/`

## Tech Stack
- Vanilla JavaScript (NO frameworks, NO ES modules, NO import/export)
- Register your module on `window.Visualizations`
- CDN libraries loaded by Terminal 2 before your script:
  - **Chart.js 4.4.7** — for bar charts, radar charts, donut charts, line charts
  - **D3.js 7.9.0** — for the interactive research landscape map (force-directed graph)
  - **Tailwind CSS** — available for any dynamic class additions

## Color Palette (dark theme — match these exactly)
```
Background:    #0a192f (navy dark)
Card BG:       #112240 (navy medium)
Primary text:  #ccd6f6 (light slate)
Secondary:     #8892b0 (medium slate)
Accent:        #64ffda (teal)
Warning:       #ffd700 (gold)
Danger:        #ff6b6b (coral red)
Success:       #64ffda (teal)

Cluster colors (for landscape map):
  #64ffda, #7c3aed, #f59e0b, #ec4899, #3b82f6, #10b981, #f43f5e, #8b5cf6
```

---

## DOM Containers You Render Into

Terminal 2 creates these containers. You render into them by ID:

```
#landscape-canvas              — Research landscape map (D3 force graph)          ~400px tall
#gap-chart-container           — Gap severity horizontal bar chart (Chart.js)     ~250px tall
#feasibility-chart-container   — Feasibility radar charts (Chart.js)              ~300px tall
#timeline-container            — Publication year timeline/sparkline (Chart.js)   ~80px tall
#coverage-container            — Database coverage donut chart (Chart.js)         ~150px tall
```

**IMPORTANT**: These containers may not exist when your script first loads (the page starts with results hidden). Always check that the container exists before rendering. If it doesn't exist, listen for `rgf:analysis-ready` and try again.

**CRITICAL**: When calling `document.getElementById()`, pass the ID **without** the `#` prefix. The `#` is CSS notation only. Use `document.getElementById("landscape-canvas")`, NOT `document.getElementById("#landscape-canvas")`.

When `renderAll` calls sub-render methods internally, use these exact string IDs:
- `"landscape-canvas"`
- `"gap-chart-container"`
- `"feasibility-chart-container"`
- `"timeline-container"`
- `"coverage-container"`

---

## Shared Data Contract

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
  id: "gap_1", title: "", description: "",
  category: "",  // "methodology" | "population" | "outcome" | "comparison" | "setting"
  severity: 0,   // 1-10 scale (10 = most severe)
  supportingPaperIds: [], keywords: [], evidenceQuotes: []
}
```

### ProjectIdea Object
```javascript
{
  id: "idea_1", title: "", description: "", gapId: "gap_1",
  studyDesign: "",
  feasibility: {
    overall: 0, dataAvailability: 0, costEstimate: "",
    timelineMonths: 0, technicalComplexity: 0, novelty: 0, clinicalImpact: 0
  },
  suggestedDatabases: [], estimatedSampleSize: "", potentialJournals: []
}
```

### LandscapeData Object
```javascript
{
  clusters: [
    {
      id: "cluster_1",
      label: "",           // theme name
      keywords: [],
      paperIds: [],
      x: 0, y: 0,         // 0-100 position
      size: 0              // relative size (paper count)
    }
  ],
  connections: [
    { from: "cluster_1", to: "cluster_2", strength: 0 }  // 0-1
  ],
  gapZones: [
    { id: "gapzone_1", gapId: "gap_1", x: 0, y: 0, radius: 0 }
  ]
}
```

### ResearchData (shared state)
```javascript
window.ResearchData = {
  query: "", status: "", statusMessage: "",
  papers: [],       // Array<Paper>
  gaps: [],         // Array<Gap>
  ideas: [],        // Array<ProjectIdea>
  landscape: null,  // LandscapeData | null
  metadata: { searchTimestamp: null, totalPapersFound: 0, databasesSearched: [], analysisVersion: "1.0" }
};
```

---

## Event Contract

### Events you LISTEN to:
```javascript
// Analysis complete — this is your main trigger
window.addEventListener("rgf:analysis-ready", function(e) {
  // e.detail has: gaps, ideas, landscape
  // Render all visualizations using window.ResearchData
});

// Papers ready — for the timeline and coverage charts (don't need full analysis)
window.addEventListener("rgf:papers-ready", function(e) {
  // e.detail.papers
  // Can render timeline and coverage immediately
});
```

### Events you DISPATCH:
```javascript
// Status update when rendering
window.dispatchEvent(new CustomEvent("rgf:status-update", {
  detail: { status: "analyzing", message: "Rendering visualizations..." }
}));
```

---

## Interface You Expose

```javascript
window.Visualizations = {
  /** Render all visualizations from current ResearchData */
  renderAll: function(researchData) {},

  /** Individual render methods */
  renderLandscape: function(landscape, containerId) {},
  renderGapChart: function(gaps, containerId) {},
  renderFeasibilityRadar: function(ideas, containerId) {},
  renderTimeline: function(papers, containerId) {},
  renderDatabaseCoverage: function(papers, containerId) {},

  /** Clean up all charts before re-rendering */
  destroy: function() {}
};
```

---

## Visualization Specifications

### 1. Research Landscape Map (`#landscape-canvas`) — THE HERO VIZ

**Type:** D3 force-directed graph

**What it shows:**
- Circles represent paper clusters (topics/themes)
- Circle size = number of papers in that cluster
- Circle color = unique color per cluster from the palette
- Lines between circles = shared keywords (connection strength = line thickness)
- Red/orange pulsing zones = gap areas (where research is sparse)
- Labels on each cluster circle

**Behavior:**
- Animate on load (nodes fly in from edges and settle)
- Hover on a cluster: show tooltip with cluster label, paper count, top keywords
- Hover on a gap zone: show tooltip with gap title and severity
- Gentle continuous floating motion (very subtle, not distracting)
- Force simulation: charge repulsion, link attraction, center gravity

**Implementation hints:**
```javascript
// Use D3 force simulation
var simulation = d3.forceSimulation(nodes)
  .force("charge", d3.forceManyBody().strength(-200))
  .force("center", d3.forceCenter(width/2, height/2))
  .force("link", d3.forceLink(links).distance(100))
  .force("collision", d3.forceCollide().radius(d => d.radius + 10));
```

- Create an SVG element inside the container
- Use `<circle>` for clusters, `<line>` for connections
- Gap zones are semi-transparent `<circle>` elements with pulsing animation
- Add `<text>` labels near each cluster

**IMPORTANT — Coordinate Systems:**
- Cluster `x` and `y` values from the data are in 0-100 normalized space. Use them as **initial positions** for the D3 simulation by scaling: `x_initial = (cluster.x / 100) * svgWidth`, `y_initial = (cluster.y / 100) * svgHeight`. The force simulation will then move them to final positions.
- Gap zone `x` and `y` are also in 0-100 space. Scale them the same way: `x_px = (gapZone.x / 100) * svgWidth`. Gap zones should NOT be part of the force simulation — they are static overlays positioned in the SVG after clusters settle.
- After the simulation stabilizes (~300 ticks or `simulation.on("end")`), position gap zones relative to the final cluster layout.

### 2. Gap Severity Chart (`#gap-chart-container`)

**Type:** Chart.js horizontal bar chart

**What it shows:**
- Each bar = one research gap
- Bar length = severity score (1-10)
- Bar color = gradient from teal (low severity) to coral red (high severity)
- Category label at the start of each bar

**Config:**
```javascript
{
  type: 'bar',
  options: {
    indexAxis: 'y',  // horizontal
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { max: 10, grid: { color: '#1d3557' }, ticks: { color: '#8892b0' } },
      y: { grid: { display: false }, ticks: { color: '#ccd6f6', font: { size: 11 } } }
    },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#112240', titleColor: '#64ffda', bodyColor: '#ccd6f6' }
    }
  }
}
```

### 3. Feasibility Radar Charts (`#feasibility-chart-container`)

**Type:** Chart.js radar charts (one per top idea, show top 3)

**What it shows:**
- Axes: Data Availability, Cost (inverted), Timeline (inverted), Complexity (inverted), Novelty, Clinical Impact
- Each radar is a colored polygon on a dark background
- Show idea title above each radar

**Layout:** 3 radar charts side-by-side (or stacked on narrow screens)

**Config:**
```javascript
{
  type: 'radar',
  options: {
    responsive: true,
    scales: {
      r: {
        min: 0, max: 100,
        grid: { color: '#1d3557' },
        pointLabels: { color: '#8892b0', font: { size: 10 } },
        ticks: { display: false },
        angleLines: { color: '#1d3557' }
      }
    },
    plugins: {
      legend: { display: false }
    }
  }
}
```

### 4. Publication Timeline (`#timeline-container`)

**Type:** Chart.js line chart (sparkline style)

**What it shows:**
- X-axis: publication years
- Y-axis: number of papers per year
- Teal line with gradient fill below
- Minimal — no axis labels, just the trend shape

**Config:**
```javascript
{
  type: 'line',
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: { display: false }, y: { display: false } },
    elements: { point: { radius: 0 }, line: { tension: 0.4 } },
    plugins: { legend: { display: false }, tooltip: { enabled: true } }
  }
}
```

### 5. Database Coverage Donut (`#coverage-container`)

**Type:** Chart.js doughnut chart

**Input:** `renderDatabaseCoverage` receives `papers` (the full Paper array), NOT metadata. Compute source counts yourself by iterating papers and counting `paper.source` values (e.g., `"pubmed"`, `"scholar"`).

**What it shows:**
- Segments for each database source (PubMed, Scholar, etc.) sized by paper count
- Center text: total paper count
- Teal/purple/blue colors

**Config:**
```javascript
{
  type: 'doughnut',
  options: {
    responsive: true,
    cutout: '65%',
    plugins: {
      legend: { position: 'bottom', labels: { color: '#8892b0', padding: 10, font: { size: 11 } } }
    }
  }
}
```

---

## Chart.js Global Defaults

Set these once at the top of your file:
```javascript
Chart.defaults.color = '#8892b0';
Chart.defaults.borderColor = '#1d3557';
Chart.defaults.font.family = "ui-monospace, 'Cascadia Code', 'Consolas', monospace";
```

---

## Destroy/Cleanup Pattern

Store all Chart.js instances and the D3 simulation so you can destroy them before re-rendering:
```javascript
// Use these exact keys for chart instances:
var chartInstances = {
  // "gap": Chart.js instance for gap severity chart
  // "radar_0", "radar_1", "radar_2": Chart.js instances for feasibility radars
  // "timeline": Chart.js instance for publication timeline
  // "coverage": Chart.js instance for database coverage donut
};
var simulation = null;

function destroyAll() {
  Object.keys(chartInstances).forEach(function(key) {
    if (chartInstances[key]) chartInstances[key].destroy();
  });
  chartInstances = {};
  if (simulation) simulation.stop();
  // Clear SVG contents
  var svg = document.querySelector('#landscape-canvas svg');
  if (svg) svg.remove();
}
```

---

## Defensive Coding Requirements
- ALWAYS check container exists: `var el = document.getElementById(id); if (!el) return;`
- ALWAYS check data exists: `var gaps = (researchData && researchData.gaps) || [];`
- ALWAYS destroy existing charts before creating new ones
- If landscape data is null, show a centered message "Waiting for analysis..." in the container
- If no gaps/ideas, show "No data available" placeholders
- Use try/catch around each render function — one broken chart shouldn't kill the others
- Console.log: "Visualizations: rendering landscape with X clusters", "Visualizations: rendering gap chart with X gaps", etc.

---

## What NOT To Do
- Do NOT create index.html, styles.css, app.js, dataService.js, analysisEngine.js, or sampleData.js
- Do NOT use ES module syntax (import/export)
- Do NOT modify the DOM outside your designated containers
- Do NOT add any `<script>` or `<link>` tags — those are in index.html

---

## Testing
After creating the file, you can test individual functions by running in the browser console:
```javascript
// Mock data
window.Visualizations.renderTimeline([
  {year: 2020}, {year: 2021}, {year: 2021}, {year: 2022}, {year: 2023}, {year: 2023}, {year: 2024}
], "timeline-container");
```

Start building `js/visualizations.js` now. Focus on making the landscape map look incredible — that's the centerpiece of the demo.
