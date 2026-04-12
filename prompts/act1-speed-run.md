# Act 1: Credibility Speed-Run (15-20 min)

**Goal:** Show that Claude Code replaces multiple specialized research tools, building the case for "why Claude Code specifically?" before the main parallel build in Act 2.

**Setup before the demo:**
- Claude Code open in a single terminal, full screen
- Font size large enough for back of room (18-20pt)
- Files ready: `demo-assets/messy_data.csv`, `demo-assets/reviewer_comments.txt`
- Python environment with matplotlib/pandas available

**Opening line:** "Before I show you what makes Claude Code unique, let me speed-run through the everyday research tasks it handles. Each of these normally requires a separate tool."

---

## Demo 1: Literature Search in Seconds (3 min)

### What to type

```
Search PubMed for systematic reviews on AI-assisted screening in systematic reviews, published in the last 3 years. Show me the top 5 results with titles and abstracts.
```

### What to say while it runs

- "This is hitting the actual PubMed API through what's called an MCP server — a plugin that connects Claude Code to external databases."
- "These are real papers with real PMIDs. You can verify every one of them. This is not hallucination — it's retrieval."
- "The same plugin system connects to ICD-10 codes, NPI registries, drug databases. If it has an API, Claude Code can talk to it."

### If it fails

- If MCP connection is slow: "The connection is warming up — this is a live API call, not cached. Let me move on and come back to it." Proceed to Demo 2.
- If PubMed returns no results: Broaden the query live — "Let me widen the search" — and type `Search PubMed for large language models in systematic review methodology`.

### Transition

"So that replaces your PubMed browser tab. What about when you get data back and it's a mess?"

---

## Demo 2: Data Cleaning (2 min)

### What to type

```
Read demo-assets/messy_data.csv. Clean and standardize this dataset:
- Standardize sex to M/F
- Standardize procedure names
- Fix the cost column (remove $ and commas)
- Standardize yes/no columns
- Flag missing values
Save the cleaned version as demo-assets/cleaned_data.csv
```

### What to say while it runs

- "This CSV has every problem you've seen in real research data — inconsistent capitalization, mixed formats for sex, dollar signs in numeric fields, typos in the satisfaction column."
- "Watch how it reads the file, identifies each problem, and fixes them systematically."
- Point at specific fixes as they appear: "See — it caught that 'eight' should be 8, it standardized 'female' and 'f' and 'Female' all to F."

### If it fails

- If Python/pandas not available: "It's writing the cleaning script — on a machine with Python this runs automatically. The point is it identified every issue without being told what to look for."
- If it misses some issues: "Let me ask it to look harder" — type `Check the cleaned data for any remaining inconsistencies`.

### Transition

"Clean data in 30 seconds. Now, in most workflows, you'd open a separate tool to visualize this. Not here."

---

## Demo 3: Publication-Ready Figure (3 min)

### What to type

```
Using the cleaned data in demo-assets/cleaned_data.csv, create a publication-ready bar chart showing complication rates by type. Use a clean academic style — no gridlines, direct labels, and a muted color palette suitable for a medical journal. Save as demo-assets/complications_figure.png
```

### What to say while it runs

- "It writes Python, runs it, and shows me the output — all without leaving this terminal."
- "If I don't like the colors, I just say 'make it grayscale' and it regenerates. No re-uploading to a separate tool."
- After figure appears: "That's one prompt to a journal-quality figure. No switching between R, Excel, and Illustrator."

### If it fails

- If matplotlib not installed: Type `pip install matplotlib pandas && !!` (re-run). Say: "Live demo tax — it's installing the dependency."
- If the figure looks off: This is actually a feature. Say: "Watch this —" and type `Make the bars horizontal, increase font size to 14, and add sample sizes to each bar label`. Shows the iterative refinement loop.

### Transition

"Search, clean, visualize — three tools replaced. But here's the one that saves the most time in academic research."

---

## Demo 4: Respond to Reviewer Comments (3 min)

### What to type

```
Read demo-assets/reviewer_comments.txt. Draft a point-by-point response to each reviewer comment. For each:
- Quote the reviewer's concern
- Acknowledge what's valid
- Describe the specific revision we'll make (or explain why we respectfully disagree)
- Keep the tone professional and constructive

Format it as a response letter ready to submit.
```

### What to say while it runs

- "Reviewer responses are the most dreaded part of academic publishing. This doesn't write them for you — it gives you a structured draft to edit."
- "Notice it's distinguishing between major and minor comments, and it's actually engaging with the statistical points — the kappa paradox, the confidence interval overlap."
- "In practice, you'd point this at your actual manuscript files too. It can read your Methods section and draft a response that references your actual text."

### If it fails

- Reviewer responses are pure text generation — this demo is the most reliable. If output is low quality, say: "Let me give it more context" and type `Also consider that our sample size was 2,000 abstracts and we used GPT-4 with temperature 0. Revise the responses with this in mind.`

### Transition

"Four research tasks. Four tools replaced. PubMed, OpenRefine, matplotlib, and a lot of painful staring at reviewer comments."

*Pause. Let this land.*

"But here's the thing — any AI chatbot can attempt some version of what I just showed you. ChatGPT, Gemini, Copilot, they can all try. So why am I up here talking about Claude Code specifically?"

*Open three more terminal tabs while talking.*

"Because none of them can do this."

---

## Demo 5: Transition to Act 2 — The Parallel Build (5 min)

### What to say

"Claude Code runs in your terminal. That means it can read files, write files, run code, and manage an entire project — not just answer questions in a chat box. And because it's a terminal, I can open four of them."

"I'm about to build a complete research gap analysis tool — a working web application — using four Claude Code instances running simultaneously. Each one handles a different piece of the architecture. They'll coordinate through shared files."

"This is roughly 4 hours of developer work compressed into 15 minutes. And I'm a medical student, not a software engineer."

### What to type (in each terminal)

**Terminal 1 — Data Service:**
```
Read prompts/terminal-1-data-service.md and execute all instructions
```

**Terminal 2 — Frontend:**
```
Read prompts/terminal-2-frontend.md and execute all instructions
```

**Terminal 3 — Visualizations:**
```
Read prompts/terminal-3-visualizations.md and execute all instructions
```

**Terminal 4 — Analysis Engine:**
```
Read prompts/terminal-4-analysis-engine.md and execute all instructions
```

### What to say as they run

- "Each terminal got a detailed prompt that I wrote beforehand. This is the key workflow — you prepare the instructions, then let Claude Code execute."
- "Terminal 1 is building the data layer. Terminal 2 is the UI. Terminal 3 handles charts. Terminal 4 is the analysis logic."
- "They're all writing to the same project directory. When they finish, we'll have a working app."
- Walk between terminals, pointing out what each is doing.

### If something fails

- If a terminal errors: "This is real software development — things break. Watch how I debug it." Type the error back to Claude Code: `I got this error: [paste error]. Fix it.`
- If terminals conflict on files: "File conflicts happen in parallel development. This is actually realistic." Resolve by telling one terminal to re-read the shared file.

---

## Timing Guide

| Demo | Duration | Cumulative |
|------|----------|------------|
| Opening + Demo 1 (PubMed) | 3 min | 3 min |
| Demo 2 (Data Cleaning) | 2 min | 5 min |
| Demo 3 (Figure) | 3 min | 8 min |
| Demo 4 (Reviewer Comments) | 3 min | 11 min |
| Transition + Demo 5 launch | 5 min | 16 min |

**Buffer:** 4 minutes for technical hiccups, questions, or slow API responses.

---

## Pre-Demo Checklist

- [ ] Claude Code installed and authenticated
- [ ] PubMed MCP server connected (test with a quick search beforehand)
- [ ] Python with matplotlib and pandas installed (`pip install matplotlib pandas`)
- [ ] `demo-assets/messy_data.csv` exists and is messy
- [ ] `demo-assets/reviewer_comments.txt` exists with reviewer comments
- [ ] Terminal prompts ready in `prompts/terminal-{1,2,3,4}-*.md`
- [ ] Font size set to 18-20pt in terminal
- [ ] Second monitor or notes with this script open (audience should not see this)
- [ ] Run through Demo 1 once before the presentation to warm up the MCP connection

---

## Recovery Playbook

**If Claude Code hangs:** Kill with Ctrl+C, say "Live demo," restart, move on.

**If internet drops:** Demos 2-4 work offline. Skip Demo 1, start with "Let me show you what it does with local files" and go straight to data cleaning.

**If everything breaks:** Open the pre-built version of the research gap finder (`index.html`) and say: "I built this entirely with Claude Code over the weekend. Let me walk you through the architecture instead." Pivot to a code walkthrough.

**If you're running ahead of schedule:** After Demo 3, ask: "Does anyone want to see me change something about this figure?" Take a live request from the audience. High-risk, high-reward crowd engagement.

**If you're running behind:** Cut Demo 3 (figure generation). The PubMed search, data cleaning, and reviewer responses are the strongest demos. Go straight from Demo 2 to Demo 4.
