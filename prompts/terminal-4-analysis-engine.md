# Terminal 4: Analysis Engine

## Your Role
You are building the **analysis engine** for a web app called "Research Gap Finder." This app helps researchers find gaps in medical literature by analyzing papers and generating project ideas. You are one of 4 parallel Claude Code terminals building this app simultaneously. Each terminal owns specific files — do NOT create or modify any file not listed below.

**You are the intelligence of the app.** Your module takes a list of papers and produces: identified research gaps, scored project ideas, and a landscape clustering for visualization.

## Files You Create
1. `js/analysisEngine.js` — All analysis logic: gap detection, idea generation, feasibility scoring, landscape clustering

**That is the ONLY file you create.**

## Project Path
`C:/Users/dbous/code/Projects/research-gap-finder/`

## Tech Stack
- Vanilla JavaScript (NO frameworks, NO ES modules, NO import/export)
- Register your module on `window.AnalysisEngine`
- NO external libraries needed — this is pure algorithmic logic
- D3.js is available on window if you want it for math utilities, but you probably don't need it

---

## Shared Data Contract

### INPUT: Paper Object (what you receive)
```javascript
{
  id: "pmid_12345678",
  title: "",              // string
  authors: [],            // string[]
  journal: "",            // string
  year: 2024,             // number
  abstract: "",           // string (THIS IS YOUR PRIMARY DATA SOURCE)
  url: "",                // string
  pmid: "",               // string | null
  source: "pubmed",       // "pubmed" | "scholar"
  keywords: [],           // string[]
  citationCount: null,    // number | null
  fullTextAvailable: false
}
```

### OUTPUT: Gap Object (what you produce)
```javascript
{
  id: "gap_1",                  // string: sequential "gap_1", "gap_2", etc.
  title: "",                    // string: short name, e.g. "Long-term cost-effectiveness data"
  description: "",              // string: 2-3 sentence explanation of the gap
  category: "",                 // "methodology" | "population" | "outcome" | "comparison" | "setting"
  severity: 0,                  // number: 1-10 scale (10 = most critical gap)
  supportingPaperIds: [],       // string[]: IDs of papers that mention this gap
  keywords: [],                 // string[]: terms related to this gap
  evidenceQuotes: []            // string[]: sentences from abstracts that reference this gap
}
```

### OUTPUT: ProjectIdea Object (what you produce)
```javascript
{
  id: "idea_1",                 // string: sequential
  title: "",                    // string: specific project title
  description: "",              // string: 3-5 sentence project description
  gapId: "gap_1",              // string: which gap this addresses
  studyDesign: "",              // string: "Retrospective cohort" | "Prospective cohort" | "RCT" | "Systematic review" | "Meta-analysis" | "Cross-sectional" | "Case-control" | "Qualitative study" | "Mixed methods"
  feasibility: {
    overall: 0,                 // number: 1-100 composite score
    dataAvailability: 0,        // number: 1-100 (100 = easily available data)
    costEstimate: "",           // "low" | "medium" | "high"
    timelineMonths: 0,          // number: estimated months to complete
    technicalComplexity: 0,     // number: 1-100 (100 = most complex)
    novelty: 0,                 // number: 1-100 (100 = most novel)
    clinicalImpact: 0           // number: 1-100 (100 = highest impact)
  },
  suggestedDatabases: [],       // string[]: e.g. ["NSQIP", "Medicare Claims", "SEER"]
  estimatedSampleSize: "",      // string: e.g. "500-1000 patients"
  potentialJournals: []         // string[]: target journals
}
```

### OUTPUT: LandscapeData Object (what you produce)
```javascript
{
  clusters: [
    {
      id: "cluster_1",
      label: "",           // string: theme name, e.g. "Outcome Prediction Models"
      keywords: [],        // string[]: top keywords in this cluster
      paperIds: [],        // string[]: paper IDs in this cluster
      x: 0,               // number: 0-100 (position for visualization)
      y: 0,               // number: 0-100
      size: 0              // number: paper count
    }
  ],
  connections: [
    {
      from: "cluster_1",
      to: "cluster_2",
      strength: 0          // number: 0-1 (keyword overlap proportion)
    }
  ],
  gapZones: [
    {
      id: "gapzone_1",
      gapId: "gap_1",     // links to Gap object
      x: 0,               // number: 0-100
      y: 0,               // number: 0-100
      radius: 0            // number: visual size (proportional to severity)
    }
  ]
}
```

### ResearchData (shared state)
```javascript
window.ResearchData = {
  query: "", status: "", statusMessage: "",
  papers: [],       // YOU READ this
  gaps: [],         // YOU WRITE this
  ideas: [],        // YOU WRITE this
  landscape: null,  // YOU WRITE this
  metadata: { ... }
};
```

---

## Event Contract

### Events you LISTEN to:
```javascript
window.addEventListener("rgf:papers-ready", function(e) {
  var papers = e.detail.papers;
  window.AnalysisEngine.analyze(papers);
});
```

### Events you DISPATCH:
```javascript
// Status updates during analysis:
window.dispatchEvent(new CustomEvent("rgf:status-update", {
  detail: { status: "analyzing", message: "Identifying research gaps..." }
}));

// When analysis is complete:
window.dispatchEvent(new CustomEvent("rgf:analysis-ready", {
  detail: { gaps: gapArray, ideas: ideaArray, landscape: landscapeData }
}));
```

---

## Interface You Expose

```javascript
window.AnalysisEngine = {
  /** Main entry point — runs the full pipeline */
  analyze: function(papers) {},

  /** Individual pipeline steps (also callable independently) */
  detectGaps: function(papers) {},         // returns Gap[]
  generateIdeas: function(gaps, papers) {},  // returns ProjectIdea[]
  scoreFeasibility: function(idea) {},      // returns feasibility object
  buildLandscape: function(papers, gaps) {} // returns LandscapeData
};
```

---

## Analysis Pipeline Implementation

### Step 1: `analyze(papers)`
```
1. Dispatch status: "Analyzing X papers..."
2. Run detectGaps(papers) → gaps
3. Dispatch status: "Generating project ideas..."
4. Run generateIdeas(gaps, papers) → ideas
5. Dispatch status: "Building research landscape..."
6. Run buildLandscape(papers, gaps) → landscape
7. Store results in window.ResearchData
8. Dispatch "rgf:analysis-ready" with results
```

Add a small artificial delay between steps (200-400ms each) using setTimeout chains — this makes the status bar visually progress through stages during the demo rather than everything happening instantly.

### Step 2: `detectGaps(papers)` — THE CORE ALGORITHM

This is where the magic happens. Analyze abstracts to find research gaps.

**Gap Detection Strategy:**

#### A. Explicit Gap Language Detection
Search all abstracts for phrases that explicitly mention gaps:
```javascript
var gapPhrases = [
  "further research is needed",
  "further studies are needed",
  "future research should",
  "future studies should",
  "remains unclear",
  "remains unknown",
  "not well understood",
  "poorly understood",
  "limited evidence",
  "limited data",
  "lack of",
  "no studies have",
  "few studies",
  "insufficient evidence",
  "gap in the literature",
  "understudied",
  "underexplored",
  "warrants further investigation",
  "more research is needed",
  "has not been established",
  "has yet to be determined",
  "requires further validation",
  "external validation",
  "prospective validation",
  "long-term outcomes",
  "long-term follow-up",
  "real-world data",
  "clinical implementation",
  "clinical deployment",
  "generalizability",
  "diverse populations",
  "underrepresented",
  "standardized reporting",
  "heterogeneity",
  "risk of bias"
];
```

For each match:
- Extract the sentence containing the phrase
- Extract surrounding context (2 sentences)
- Categorize the gap type based on keywords in context
- Track which papers mention it

#### B. Methodology Gap Detection
Look for patterns suggesting methodology limitations:
- Papers mentioning "retrospective" → gap: "Need for prospective studies"
- Papers mentioning "single institution" or "single center" → gap: "Need for multi-center validation"
- Papers mentioning "small sample" or low N → gap: "Need for larger cohorts"
- Papers missing "external validation" → gap: "Need for external validation"
- Papers mentioning only one algorithm → gap: "Need for algorithm comparison studies"

#### C. Population Gap Detection
Analyze the populations studied:
- Extract demographic mentions (pediatric, elderly, male/female, race/ethnicity)
- Identify which populations are NOT represented
- If most papers study adults → gap: "Pediatric populations understudied"
- If no papers mention specific demographics → gap: "Need for diverse population studies"

#### D. Outcome Gap Detection
Analyze the outcomes measured:
- If mostly short-term outcomes → gap: "Long-term outcome data needed"
- If mostly accuracy/AUC metrics → gap: "Need for clinical impact studies"
- If no cost-effectiveness data → gap: "Cost-effectiveness analysis needed"
- If no patient-reported outcomes → gap: "Patient-reported outcome measures needed"

#### E. Gap Scoring
For each identified gap, calculate severity (1-10):
```
severity = (frequency_score * 0.3) + (recency_score * 0.2) + (importance_score * 0.3) + (breadth_score * 0.2)
```
- `frequency_score`: How many papers mention this gap (normalized to 1-10)
- `recency_score`: Are recent papers still mentioning it? (newer = higher score)
- `importance_score`: Based on gap type (external validation = 8, prospective study = 7, diverse populations = 6, etc.)
- `breadth_score`: Does the gap span multiple subtopics? (broader = higher)

#### F. Gap Deduplication and Merging
- If two gaps share >50% of keywords and supporting papers, merge them
- Keep the more specific title
- Combine evidence quotes
- Take the higher severity score

**Target output: 5-8 gaps, sorted by severity descending.**

### Step 3: `generateIdeas(gaps, papers)`

For each gap, generate 1-2 project ideas:

**Idea Generation Rules:**
- Methodology gap → suggest the missing study type
  - "Need for prospective studies" → "Prospective [topic] cohort study"
  - "Need for external validation" → "Multi-center external validation study"
  - "Need for standardized reporting" → "Systematic review with meta-analysis"
- Population gap → suggest studying the missing population
  - "Pediatric understudied" → "Pediatric [topic] outcomes analysis"
- Outcome gap → suggest measuring the missing outcome
  - "Long-term outcomes needed" → "5-year follow-up study of [topic]"
  - "Cost-effectiveness needed" → "Cost-effectiveness analysis of [topic]"

**For each idea, populate:**
- `title`: Specific, actionable project title incorporating the query topic
- `description`: 3-5 sentences explaining what the project would do, why it matters, and how it could be done
- `studyDesign`: Match to gap type
- `suggestedDatabases`: Contextual suggestions:
  - Surgical topics → ["NSQIP", "NIS", "institutional registry"]
  - Radiology → ["institutional PACS data", "public imaging datasets", "TCIA"]
  - LLMs → ["synthetic clinical scenarios", "medical exam databases", "clinical notes (de-identified)"]
  - General → ["PubMed/literature databases", "institutional EHR data"]
- `estimatedSampleSize`: Based on study design
- `potentialJournals`: Based on topic area

### Step 4: `scoreFeasibility(idea)`

Score each dimension 1-100:

```javascript
// dataAvailability: based on study design and suggested databases
//   Retrospective with public data = 80-95
//   Retrospective with institutional data = 60-80
//   Prospective = 30-50
//   RCT = 20-40

// costEstimate: based on study design
//   Systematic review = "low"
//   Retrospective = "low"
//   Prospective cohort = "medium"
//   RCT = "high"

// timelineMonths: based on study design
//   Systematic review = 4-8
//   Retrospective cohort = 6-12
//   Prospective cohort = 18-36
//   RCT = 24-48

// technicalComplexity: based on methods required
//   Simple statistics = 20-40
//   Machine learning = 50-70
//   Deep learning = 60-80
//   Multi-modal AI = 70-90

// novelty: inverse of how many papers address similar topics (fewer papers = higher novelty)

// clinicalImpact: based on gap severity (higher severity gap = higher potential impact)

// overall: weighted average (CLAMP all terms to 0-100 before combining)
//   var timelineScore = Math.max(0, Math.min(100, 100 - (timelineMonths / 48) * 100));
//   var complexityScore = Math.max(0, Math.min(100, 100 - technicalComplexity));
//   overall = Math.round(
//     (dataAvailability * 0.25) + (complexityScore * 0.15) +
//     (novelty * 0.25) + (clinicalImpact * 0.25) + (timelineScore * 0.10)
//   );
//   overall = Math.max(0, Math.min(100, overall));  // final clamp
```

**IMPORTANT: All feasibility scores (overall and sub-scores) MUST be clamped to [0, 100].** Use `Math.max(0, Math.min(100, value))` on every score. The UI renders these as progress bars that expect 0-100.

**Target output: 6-12 ideas across all gaps.**

### Step 5: `buildLandscape(papers, gaps)`

Create a topic landscape for visualization.

**Clustering Algorithm:**

1. **Extract keywords from all papers:**
   - Combine `paper.keywords` arrays
   - Extract additional keywords from titles (split on spaces, remove stopwords, keep meaningful terms)
   - Build a keyword frequency map

2. **Identify top themes (clusters):**
   - Take the top 15-20 most frequent keywords
   - Group keywords that co-occur in the same papers
   - Each group becomes a cluster
   - Target: 4-7 clusters

3. **Assign papers to clusters:**
   - For each paper, count keyword overlap with each cluster
   - Assign to the cluster with highest overlap
   - A paper can belong to multiple clusters if overlap is significant

4. **Position clusters in 2D space:**
   - Use keyword similarity as distance metric
   - Clusters sharing many keywords → close together
   - Spread across 0-100 range on both axes
   - Simple approach: assign positions based on first two principal components of co-occurrence, OR use a simple spring-layout where connected clusters attract and unconnected repel

5. **Calculate connections:**
   - For each pair of clusters, calculate shared keyword proportion
   - Connection strength = |shared keywords| / |union of keywords|
   - Only keep connections with strength > 0.1

6. **Position gap zones:**
   - Each gap gets positioned near the clusters it relates to (based on gap keywords vs cluster keywords)
   - Gap radius proportional to severity
   - Gaps should appear in "sparse" areas of the map where possible

**Target output: 4-7 clusters, their connections, and gap zones.**

---

## Defensive Coding Requirements
- Always check papers array exists and is non-empty before processing
- Handle papers with missing abstracts (skip them for text analysis)
- Handle papers with empty keyword arrays
- Use try/catch around the main analyze() function
- If analysis fails, dispatch an error event but don't crash
- All text processing should be case-insensitive
- Console.log milestones: "AnalysisEngine: analyzing X papers", "AnalysisEngine: found X gaps", "AnalysisEngine: generated X ideas", "AnalysisEngine: built landscape with X clusters"

---

## Stopwords List (for keyword extraction)
```javascript
var STOPWORDS = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with","by",
  "from","is","are","was","were","be","been","being","have","has","had","do",
  "does","did","will","would","shall","should","may","might","must","can","could",
  "this","that","these","those","it","its","we","our","they","their","them",
  "which","who","whom","what","where","when","how","not","no","nor","than",
  "also","as","such","more","most","between","through","during","before","after",
  "above","below","both","each","other","some","any","all","into","over","under",
  "about","up","out","off","then","so","if","because","while","although","however",
  "study","studies","results","patients","data","methods","using","based","used",
  "included","including","found","showed","analysis","compared","associated",
  "significantly","among","total","group","groups","two","three","one","first"
]);
```

---

## What NOT To Do
- Do NOT create index.html, styles.css, app.js, dataService.js, visualizations.js, or sampleData.js
- Do NOT use ES module syntax (import/export)
- Do NOT make network calls
- Do NOT modify the DOM (that's Terminal 2 and 3's job)
- Do NOT use any AI/ML libraries — your analysis is algorithmic text processing

---

## Testing
After creating the file, test in the browser console:
```javascript
// Load some sample papers first
var papers = window.SampleData.getPapers("surgery");
var gaps = window.AnalysisEngine.detectGaps(papers);
console.log("Gaps:", gaps);
var ideas = window.AnalysisEngine.generateIdeas(gaps, papers);
console.log("Ideas:", ideas);
var landscape = window.AnalysisEngine.buildLandscape(papers, gaps);
console.log("Landscape:", landscape);
```

Start building `js/analysisEngine.js` now. The gap detection quality is what makes this app valuable — invest your effort there.
