# Terminal 1: Data Service Layer

## Your Role
You are building the **data service layer** for a web app called "Research Gap Finder." This app helps researchers find gaps in medical literature by searching databases and analyzing papers. You are one of 4 parallel Claude Code terminals building this app simultaneously. Each terminal owns specific files — do NOT create or modify any file not listed below.

## Files You Create
1. `js/dataService.js` — The data fetching, parsing, and normalization module
2. `data/sampleData.js` — **ALREADY EXISTS. Do NOT overwrite it.** Read it to understand the Paper schema.

**You only create `js/dataService.js`.** The sample data file is pre-built.

## Project Path
`C:/Users/dbous/code/Projects/research-gap-finder/`

## Tech Stack
- Vanilla JavaScript (NO frameworks, NO ES modules, NO import/export)
- This runs in a browser via `<script>` tags loaded from `file://` protocol
- You register your module on `window.DataService`

## CDN Libraries Available (loaded by Terminal 2 in index.html)
```
Tailwind CSS (CDN)
Chart.js 4.4.7
D3.js 7.9.0
```
You probably won't need any of these — your module is pure data logic.

---

## Shared Data Contract

### Paper Object (THE schema all terminals use)
```javascript
{
  id: "pmid_12345678",       // string: unique ID (prefix + source ID)
  title: "",                  // string
  authors: [],                // string[] — e.g. ["Smith J", "Doe A"]
  journal: "",                // string
  year: 2024,                 // number
  abstract: "",               // string
  url: "",                    // string: link to paper
  pmid: "",                   // string | null
  source: "pubmed",           // "pubmed" | "scholar"
  keywords: [],               // string[] — extracted or provided
  citationCount: null,        // number | null
  fullTextAvailable: false    // boolean
}
```

### ResearchData (shared state on window)
```javascript
// Created by Terminal 2 (app.js). You READ and WRITE specific fields.
window.ResearchData = {
  query: "",                    // string: user's input
  status: "idle",               // "idle" | "searching" | "analyzing" | "complete" | "error"
  statusMessage: "",            // string: human-readable status
  papers: [],                   // Array<Paper> — YOU populate this
  gaps: [],                     // Array<Gap> — Terminal 4 populates
  ideas: [],                    // Array<ProjectIdea> — Terminal 4 populates
  landscape: null,              // LandscapeData | null — Terminal 4 populates
  metadata: {
    searchTimestamp: null,       // ISO string
    totalPapersFound: 0,
    databasesSearched: [],      // e.g. ["PubMed", "Google Scholar"]
    analysisVersion: "1.0"
  }
};
```

---

## Event Contract (CustomEvents on window)

### Events you DISPATCH:
```javascript
// When search starts:
window.dispatchEvent(new CustomEvent("rgf:status-update", {
  detail: { status: "searching", message: "Searching databases..." }
}));

// When papers are ready:
window.dispatchEvent(new CustomEvent("rgf:papers-ready", {
  detail: { papers: paperArray }
}));

// On error:
window.dispatchEvent(new CustomEvent("rgf:error", {
  detail: { source: "dataService", message: "Description of error" }
}));
```

### Events you LISTEN to:
```javascript
// When user submits a search query:
window.addEventListener("rgf:search-start", function(e) {
  var query = e.detail.query;
  // Trigger your search logic
});
```

---

## Interface You Expose

```javascript
window.DataService = {
  /**
   * Search for papers matching a query.
   * Uses sample data as the primary source (for demo reliability).
   * Updates window.ResearchData.papers and dispatches "rgf:papers-ready".
   */
  search: function(query) {},

  /**
   * Load pre-fetched sample data for a specialty.
   * This is the PRIMARY path for the demo.
   */
  loadSampleData: function(query) {},

  /**
   * Parse raw text (e.g., pasted MCP output) into Paper[] format.
   * Used by the presenter to inject live data via a hidden admin textarea.
   */
  parseMcpResults: function(rawText) {},

  /**
   * Return list of available sample data specialties.
   */
  getAvailableSpecialties: function() {},

  /**
   * Return quick stats about the current paper set.
   */
  getStats: function() {}
};
```

---

## Implementation Details

### 1. `search(query)` method — LIVE PubMed Search
```
1. Dispatch "rgf:status-update" with status "searching"
2. Call PubMed E-utilities API (free, public, CORS-enabled):
   a. esearch.fcgi — search for PMIDs matching the query (max 20)
   b. esummary.fcgi — fetch article metadata (title, authors, journal, year)
   c. efetch.fcgi — fetch full abstracts and MeSH keywords (XML format, parse with DOMParser)
3. If PubMed succeeds: store papers, dispatch "rgf:papers-ready"
4. If PubMed fails: fall back to loadSampleData(query) and dispatch "rgf:papers-ready"
```

**PubMed E-utilities base URLs:**
- Search: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json`
- Summary: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json`
- Fetch: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml`

This is a real search — the app fetches actual papers from PubMed's public API. No fake data.

### 2. `loadSampleData(query)` method
```
1. Access window.SampleData (loaded from data/sampleData.js)
2. Call window.SampleData.getPapers(query)
3. Store result in window.ResearchData.papers
4. Update window.ResearchData.metadata with:
   - searchTimestamp: new Date().toISOString()
   - totalPapersFound: papers.length
   - databasesSearched: ["PubMed", "Consensus/Semantic Scholar"]
5. Return the papers array
```

### 3. `parseMcpResults(rawText)` method
This is for the LIVE demo scenario where the presenter pastes MCP tool output.
```
1. Try to parse rawText as JSON
2. If it has an "articles" array (PubMed format), normalize each article:
   - Map pmid, title, abstract, doi, journal, authors, keywords, year
   - Generate id as "pmid_" + pmid
   - Set source to "pubmed"
3. If it has a different format, try to extract title/abstract/year patterns
4. Deduplicate by paper.id before appending — if a paper with the same ID already exists in window.ResearchData.papers, skip it
5. Append only NEW parsed papers to window.ResearchData.papers
6. Dispatch "rgf:papers-ready" with the full updated papers array
7. Return the newly added papers (not duplicates)
```

### 4. `getAvailableSpecialties()` method
```
Return window.SampleData.specialties (an array of strings)
```

**Specialty-to-data mapping (for reference):**
- `"AI in Surgical Outcomes"` → matched by substring `"surg"` → returns `data["surgery"]`
- `"AI in Radiology & Diagnostic Imaging"` → matched by substring `"radiol"` → returns `data["radiology"]`
- `"LLMs in Clinical Decision Support"` → matched by substring `"llm"` → returns `data["llm"]`
- Any other query → returns all papers combined

These specialty labels are also used as chip text in the UI. The user clicks a chip, the full label becomes the query, and `getPapers()` matches via substring. Do NOT transform or truncate these labels.

### 5. `getStats()` method
```
Return an object with:
- totalPapers: number
- yearRange: { min, max }
- topJournals: array of { name, count } sorted by count desc, top 5
- sourceBreakdown: { pubmed: count, scholar: count }
- keywordFrequency: array of { keyword, count } sorted by count desc, top 15
```
This is used by the UI to display summary statistics.

### 6. Event listener setup
On script load, set up the listener:
```javascript
window.addEventListener("rgf:search-start", function(e) {
  var query = e.detail.query;
  window.DataService.search(query);
});
```

---

## Defensive Coding Requirements
- Always check `window.SampleData` exists before accessing it
- Always check `window.ResearchData` exists before writing to it
- Use `|| []` and `|| {}` defaults everywhere
- Wrap the entire module in an IIFE to avoid polluting global scope (except the window.DataService assignment)
- Console.log key milestones: "DataService: initialized", "DataService: found X papers for query Y", "DataService: papers-ready dispatched"

---

## What NOT To Do
- Do NOT create index.html, styles.css, app.js, visualizations.js, or analysisEngine.js
- Do NOT use ES module syntax (import/export) — use window.* globals
- Do NOT make any network/fetch calls — all data comes from SampleData or pasted text
- Do NOT overwrite data/sampleData.js — it already exists

---

## Testing
After creating the file, open the browser console and verify:
1. `window.DataService` exists and has all methods
2. `window.DataService.getAvailableSpecialties()` returns an array
3. `window.DataService.loadSampleData("surgery")` returns papers
4. `window.DataService.getStats()` returns valid statistics

Start building `js/dataService.js` now.
