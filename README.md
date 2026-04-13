# Research Gap Finder

A web app that searches PubMed in real-time, identifies research gaps in any medical field, and generates scored project ideas with feasibility analysis.

**Built live at CCAIR** using 4 parallel Claude Code terminals.

## How It Works

1. Enter any medical research topic
2. The app searches PubMed's public API for relevant papers
3. An analysis engine scans abstracts to identify research gaps
4. Project ideas are generated and scored on feasibility
5. An interactive research landscape map visualizes the field

## Run Locally

### Basic mode (no server required)
```bash
# Just serve the files — PubMed search works, analysis is algorithmic
npx http-server -p 8080 --cors
# Open http://localhost:8080
```

### AI mode (recommended)
```bash
# Uses Claude to do real cross-paper research gap analysis
ANTHROPIC_API_KEY=sk-ant-... node server.js
# Open http://localhost:3000
```

The AI mode sends paper abstracts to Claude for genuine research analysis instead of keyword matching. This produces significantly better gap identification and project ideas.

## Tech Stack

- Vanilla HTML/CSS/JavaScript (no frameworks)
- Tailwind CSS (CDN)
- Chart.js for charts
- D3.js for the research landscape map
- PubMed E-utilities API (free, public)

## Architecture

The app was designed to be built by 4 independent Claude Code terminals simultaneously:

| Module | File | Responsibility |
|--------|------|----------------|
| Data Service | `js/dataService.js` | PubMed search, paper loading |
| Frontend | `index.html`, `css/styles.css`, `js/app.js` | UI, orchestration |
| Visualizations | `js/visualizations.js` | D3 landscape map, Chart.js charts |
| Analysis Engine | `js/analysisEngine.js` | Gap detection, idea generation |

Modules communicate via a CustomEvent bus on `window` with zero direct dependencies.

## CCAIR

This project was created for the CCAIR AI research group at Hackensack Meridian School of Medicine.

## License

MIT
