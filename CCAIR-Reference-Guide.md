# Claude Code Reference Guide
### CCAIR AI Research Group — Demo Session Handout

---

## 1. What is Claude Code?

Claude Code is a **command-line AI tool** that operates directly in your terminal. Unlike browser-based AI chatbots, it has full access to your local file system — it reads, writes, and executes code on your machine.

| | ChatGPT / Claude.ai | Claude Code |
|---|---|---|
| Interface | Web browser | Terminal (CLI) |
| File access | Upload/download only | Reads and writes your actual files |
| Code execution | Sandboxed | Runs directly on your system |
| Tool integration | Limited plugins | MCP protocol (any external tool) |
| Context | Conversation only | Your entire project directory |
| Parallel work | One conversation | Multiple terminals, same project |

**Install:**
```bash
npm install -g @anthropic-ai/claude-code
```

---

## 2. Key Concepts

**MCP (Model Context Protocol)**
An open standard for connecting Claude Code to external tools — databases, APIs, search engines. Think of it as USB for AI: one protocol, many devices. Example: connect to PubMed, Google Scholar, or a hospital database through a single interface.

**Skills (Slash Commands)**
Reusable workflows invoked with `/command-name`. Create your own for repetitive tasks: `/literature-review`, `/format-table`, `/run-analysis`.

**Parallel Terminals**
Run multiple Claude Code instances simultaneously on the same project. Example: Terminal 1 builds the backend, Terminal 2 builds the frontend, Terminal 3 writes tests, Terminal 4 handles data processing.

**Agents (Sub-tasks)**
Claude Code can spawn autonomous sub-agents to handle independent pieces of work, then integrate the results.

**CLAUDE.md Files**
Project-level instruction files that persist across sessions. Claude Code reads these automatically to understand your project, preferences, and conventions.

---

## 3. For Researchers: What Claude Code Can Do

**Literature & Data**
- Search PubMed and Google Scholar via MCP servers
- Parse and extract data from PDFs
- Clean and transform CSV/Excel datasets
- Merge datasets across different formats

**Analysis**
- Write and execute R or Python statistical scripts
- Run regressions, survival analyses, cost-effectiveness models
- Generate publication-ready figures (ggplot2, matplotlib, seaborn)
- Format tables to journal specifications (APA, AMA, etc.)

**Writing & Review**
- Draft manuscript sections with proper structure
- Respond to reviewer comments point-by-point
- Check references and format citations
- Convert between citation styles

**Tools & Dashboards**
- Build interactive web apps for data exploration
- Create Shiny or Streamlit dashboards
- Automate repetitive research workflows
- Generate CONSORT diagrams, forest plots, PRISMA flowcharts

---

## 4. Getting Started

### Prerequisites
1. **Node.js** (v18+) — [nodejs.org](https://nodejs.org)
2. **Anthropic API key** — [console.anthropic.com](https://console.anthropic.com)

### Installation
```bash
# Install Claude Code
npm install -g @anthropic-ai/claude-code

# Navigate to your project
cd ~/my-research-project

# Start Claude Code
claude
```

### First Run
On first launch, Claude Code will ask for your API key. Then:
```
> Help me analyze patient_data.csv and generate summary statistics
```
It will read the file, write a script, run it, and show you results — all in one step.

### Setting Up MCP Servers
Add to your project's `.mcp.json`:
```json
{
  "mcpServers": {
    "pubmed": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/pubmed-mcp"]
    }
  }
}
```

Browse available MCP servers: [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)

---

## 5. Best Practices

### Context Management
- Create a `CLAUDE.md` file in your project root with instructions, conventions, and project context
- Include file paths, variable naming conventions, preferred statistical methods
- Claude Code reads this automatically every session

### Prompt Tips for Research
- **Be specific about methods:** "Run a Cox proportional hazards model" not "analyze survival"
- **Specify output format:** "Generate a Table 1 in AMA style with p-values"
- **Reference files by name:** "Read `data/cohort_2024.csv` and merge with `data/outcomes.csv` on patient_id"
- **State assumptions:** "Assume alpha = 0.05, use intention-to-treat analysis"

### When to Use Parallel Terminals
- Literature review in one terminal while data cleaning runs in another
- Building figures while editing manuscript text
- Running sensitivity analyses simultaneously

### Limitations — Know These
- **Always verify statistical output.** Claude Code can make calculation errors or choose inappropriate tests.
- **Do not trust literature search results blindly.** Cross-check citations exist and say what Claude claims.
- **Patient data caution.** Do not feed PHI/PII into Claude Code unless you have appropriate data use agreements. The API sends data to Anthropic's servers.
- **Not a replacement for domain expertise.** It accelerates your work — it does not replace your judgment.
- **Token limits.** Very large datasets may need to be chunked or summarized before processing.

---

## 6. The App We Built Today

### Research Gap Finder
An interactive web tool that identifies under-explored research questions by analyzing publication patterns, citation networks, and systematic review recommendations.

**What it does:**
- Visualizes research landscape for a given topic
- Highlights gaps between what is studied and what reviews recommend
- Suggests concrete research questions with feasibility estimates

**GitHub:** https://github.com/dbouslov/research-gap-finder

**Run locally:**
```bash
git clone [repo-url]
cd research-gap-finder
# Open index.html in your browser
```

**How to contribute:**
- Fork the repo, make changes, submit a pull request
- Ideas for new features? Open an issue on GitHub

---

## 7. Resources

| Resource | Link |
|----------|------|
| Claude Code docs | [docs.anthropic.com/en/docs/claude-code/overview](https://docs.anthropic.com/en/docs/claude-code/overview) |
| Model Context Protocol | [modelcontextprotocol.io](https://modelcontextprotocol.io) |
| MCP server directory | [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) |
| Anthropic API console | [console.anthropic.com](https://console.anthropic.com) |
| Node.js download | [nodejs.org](https://nodejs.org) |
| CCAIR GitHub | https://github.com/dbouslov/research-gap-finder |

---

*CCAIR Demo Session — Built live with 4 parallel Claude Code terminals*
