# CCAIR Workshop: Claude Code for Medical Research
## Tuesday, April 15 — 90 Minutes

---

## Context

David Bouslov co-leads CCAIR, an AI research group at Hackensack Meridian School of Medicine. This is a biweekly meeting with faculty and med students. David was recently elected co-leader.

**Goal:** Every person leaves thinking "why am I using anything other than Claude Code?"

**Audience:** Mixed — faculty (care about publications, grants, productivity) and med students (care about research for residency apps, learning AI, building things). Technical levels vary.

**Room setup:** David has 3 monitors, Windows 11, Claude Code installed and working. MCP tools configured (PubMed, Google Scholar, medical databases).

---

## Core Design Principle

**The session is a single continuous research project done live.**

Not a series of disconnected demos. Not a lecture with examples. One research question chosen by the audience at the start, carried through from literature search to finished output by the end. Each phase naturally showcases a Claude Code capability. The audience watches a complete research workflow happen in real-time and learns each feature through seeing it solve a real problem.

This works because:
- There is a narrative. People stay engaged when there is a story with a beginning, middle, and end.
- Each new capability is introduced because the project needs it, not because it is next on a feature list.
- The audience is invested because they chose the topic.
- If one segment runs long or short, the project structure flexes naturally.
- At the end, there is a tangible output — not just "things Claude Code can do" but an actual result the audience saw created.

---

## The Plan

### OPENING (5 min)

David opens his terminal. One sentence: "Claude Code is an AI that lives in your terminal. It reads your files, writes code, runs it, connects to databases, and builds things. Let me show you what that means."

He types something simple to establish what this is — a quick exchange that shows the CLI interface. Maybe: "What are the inclusion criteria for a systematic review on [topic]?" — Claude Code responds. The audience sees the terminal interface for the first time. Then:

"Today we're going to do an entire research project live using this tool. But I need a topic. Someone give me a research question."

**This is the critical moment.** The audience gives a topic. David types it in. The session is now live, unscripted, and theirs.

Backup: If nobody volunteers immediately, David has 2-3 topics ready that work well:
- "AI-assisted surgical decision-making"
- "Machine learning for predicting hospital readmissions"
- "Large language models in medical education"

These are broad enough to generate rich results but specific enough to produce meaningful analysis.

---

### PHASE 1: "Where does the research stand?" (15 min)
**What happens:** Claude Code searches PubMed via MCP, pulls 20 real papers, and synthesizes findings.

**CC capability shown:** MCP (connecting to external databases)

**Step by step:**
1. David says to Claude Code: "Search PubMed for papers on [audience topic]. Get me the top 20 most relevant papers with abstracts."
2. Claude Code calls the PubMed MCP tool. Real search happens. Papers stream back with titles, authors, journals, years.
3. David says: "Summarize what these papers collectively tell us. What are the main themes? Where are the gaps?"
4. Claude Code reads all 20 abstracts and produces a synthesis.
5. David says: "Save this as a markdown file called literature-review.md"
6. Claude Code writes the file. David opens it — the audience sees a real file on disk.

**What David says to the audience during this:**
- "I didn't go to PubMed. I didn't copy and paste. Claude Code connected directly to the database. That's MCP — Model Context Protocol. It lets Claude Code talk to external tools."
- "Notice it saved the file to my computer. This isn't a chatbox — it's working in my actual file system."

**What makes this different from ChatGPT:** ChatGPT cannot search PubMed. Claude.ai cannot search PubMed. Claude Code with MCP does it natively. The file-saving demonstrates it is not a browser tool.

**If MCP fails:** David has sample data pre-loaded. He says "MCP is sometimes slow on conference Wi-Fi — let me load cached data" and moves on. The sample data is real papers, just pre-fetched. Nobody will know the difference.

---

### PHASE 2: "Show me the data" (15 min)
**What happens:** Claude Code takes a messy dataset, cleans it, runs analysis, and generates publication-ready figures that appear on screen.

**CC capability shown:** Code execution (writes AND runs code, iterates on output)

**Step by step:**
1. David has a pre-made messy CSV (`demo-assets/messy_data.csv`) — 20 rows of surgical outcome data with realistic mess (inconsistent formatting, missing values, typos). He opens it briefly to show it is ugly.
2. David says: "Clean this dataset. Standardize the column names, fix the formatting issues, handle missing values, and save the cleaned version."
3. Claude Code reads the file, writes a Python script, executes it, and saves the cleaned CSV. David opens both files side-by-side to show the transformation.
4. David says: "Now generate a bar chart comparing outcomes by procedure type. Make it publication-ready — use journal-quality styling."
5. A matplotlib figure appears on screen.
6. David says: "Add error bars. Change the color scheme to match JAMA's style. Add a p-value annotation."
7. The figure regenerates with each request. The audience watches it evolve.
8. David says: "Now make me a Kaplan-Meier survival curve from the same data."
9. A second figure appears.
10. David says: "Save everything as PDFs."

**What David says to the audience during this:**
- "Watch what just happened. I said 'clean this data.' It read my CSV, wrote a Python script, ran the script, and saved the output. I didn't copy any code. I didn't open Python. I didn't debug anything."
- "Now watch — I'm going to ask it to change the figure. It will rewrite the script and re-run it."
- After the second figure: "That's two publication-ready figures from a messy spreadsheet in about 5 minutes. How long does that normally take you?"

**What makes this different from ChatGPT:** ChatGPT can generate matplotlib code but you have to copy it, open a Python environment, paste it, install dependencies, run it, fix errors, go back. Claude Code does the entire loop: write → execute → show → iterate. The figures appear as real files on David's machine.

**The messy CSV should be pre-made and realistic.** It should contain data that plausibly relates to the audience's chosen topic, or be generic enough (surgical outcomes) that it is believable. The existing `demo-assets/messy_data.csv` works — it is laparoscopic cholecystectomy data.

---

### PHASE 3: "Build me something" (15 min)
**What happens:** David asks the audience what tool they wish existed. Claude Code builds it live. It opens in the browser. It works.

**CC capability shown:** Full-stack code generation + execution + file system

**Step by step:**
1. David says to the room: "If you could have any small clinical tool or calculator built right now, what would it be?"
2. Someone suggests something. Could be a clinical scoring calculator, a dosing tool, a study sample size estimator, a risk stratification tool, a patient education page, whatever.
3. David types the request into Claude Code: "Build me a [whatever they said] as a single-page web app. Make it look clean and professional. Save it in a folder called tool/."
4. Claude Code writes HTML, CSS, and JavaScript. Multiple files appear.
5. David says: "Open it."
6. Claude Code runs `start tool/index.html` or similar. The tool opens in the browser.
7. David (or an audience member) tests it. It works.
8. David says: "Add [some feature the audience suggests]." Claude Code modifies the code. David refreshes the browser. The feature is there.

**What David says to the audience during this:**
- "I didn't write a single line of code. I described what I wanted and it built a working tool."
- "Notice — this isn't a code snippet in a chat window. These are real files on my computer. I could deploy this. I could share it."
- After the iteration: "I just asked for a change and it modified the existing code. It knows the whole project. Try doing that by pasting code into ChatGPT."

**What makes this different from ChatGPT:** ChatGPT generates code you have to assemble. Replit/v0/Lovable build apps but cannot access your files, cannot connect to your databases, and cannot be extended. Claude Code builds real software in your real environment.

**Backup:** If the audience cannot think of a tool, David suggests: "Let's build a post-operative complication risk calculator" or "Let's build a clinical trial eligibility screener."

---

### PHASE 4: "Now watch this" (10 min)
**What happens:** David opens a second terminal. Both terminals work on the same project simultaneously. The audience watches two AI instances collaborating.

**CC capability shown:** Parallel terminals (unique to Claude Code)

**Step by step:**
1. David says: "Everything I've shown you, any AI tool can attempt some version of. This next part — no other tool on earth can do."
2. He opens a second Claude Code terminal. Both are visible on his monitors.
3. Terminal 1: "Write a methods section for a study based on the literature review we did earlier and the data analysis we ran."
4. Terminal 2: "Generate a CONSORT-style flow diagram as an SVG image for our study."
5. Both terminals start working simultaneously. The audience can see text generating in one window and code being written in the other.
6. After both finish, David shows the outputs. Both are coherent with the same project.

**What David says to the audience during this:**
- "Two AI instances. Same project. Working at the same time. Terminal 1 is writing the methods section while Terminal 2 is generating the figures."
- "This is unique to Claude Code. You cannot do this in ChatGPT, Cursor, Copilot, or any other AI tool."

**Keep this segment SHORT.** The point is made in 2 minutes. Don't drag it out. 5 minutes of parallel work, 2 minutes of showing the output, 3 minutes of buffer.

---

### PHASE 5: "Make it repeatable" (8 min)
**What happens:** David shows how everything they just watched can be packaged into a single reusable command.

**CC capability shown:** Skills (slash commands), CLAUDE.md project memory

**Step by step:**
1. David says: "What if I told you everything we did in the last hour could be one command?"
2. He runs `/find-gaps [the audience's topic]`
3. Claude Code executes the full pipeline: searches PubMed, analyzes papers, identifies gaps, generates the Research Gap Finder visualization, and opens it in the browser.
4. The Research Gap Finder app loads with the audience's topic — papers, gaps, ideas, landscape map, charts.
5. David shows the skill file: "This is 50 lines of markdown. It tells Claude Code what to do. Anyone can write one."

**What David says to the audience during this:**
- "Skills are reusable workflows. You write them once, run them with a slash command."
- "This is how you turn a 2-hour research workflow into a 2-minute command."
- "And because this is in your files — on your computer, in your project — it stays with you. It is not locked in someone else's platform."

**This is also where the Research Gap Finder app gets its moment.** It is not the centerpiece of the session. It is the payoff of the skill system. The audience has now seen every step that went into building it (search, analyze, visualize) done individually, and now they see it all automated.

---

### PHASE 6: "Your turn" (12 min)
**What happens:** Getting started guide, best practices, Q&A. David distributes the reference doc.

**Step by step:**
1. David shows how to install Claude Code: `npm install -g @anthropic-ai/claude-code`
2. He shows the reference doc (prints it or displays it, shares the GitHub link)
3. He covers 3 practical tips:
   - **CLAUDE.md files:** "Put a file called CLAUDE.md in your project root. Write what the project is, what you're working on. Claude Code reads it every time you start."
   - **MCP setup:** "Install the PubMed MCP server and you get database access everywhere."
   - **What it is bad at:** "Don't trust it blindly. Always verify citations. Always check statistical output. It can hallucinate. It can make coding errors. It is a collaborator, not an oracle."
4. Q&A for remaining time.

**Materials to share:**
- Reference doc: `CCAIR-Reference-Guide.md` (printed or linked)
- GitHub repo: https://github.com/dbouslov/research-gap-finder
- The Research Gap Finder app (in the repo, anyone can run it)

---

## Timing Summary

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Opening + topic selection | 5 min | 5 min |
| Phase 1: Literature search via MCP | 15 min | 20 min |
| Phase 2: Data → figures | 15 min | 35 min |
| Phase 3: Build a tool live | 15 min | 50 min |
| Phase 4: Parallel terminals | 10 min | 60 min |
| Phase 5: Skills + Research Gap Finder | 8 min | 68 min |
| Phase 6: Getting started + Q&A | 22 min | 90 min |

Buffer is built into the Q&A time. If any phase runs long, Q&A absorbs it. If things go fast, more Q&A — which is usually the best part of these sessions anyway.

---

## Failure Modes and Recovery

**MCP / PubMed fails (Phase 1):**
"Conference Wi-Fi can be tricky — let me load a cached dataset." Load the sample data. The literature review still happens, just from pre-fetched papers. Mention that MCP works reliably on stable connections and move on.

**Code execution fails (Phase 2):**
Python not installed or matplotlib missing: `pip install matplotlib` live. If that fails, David says "Let me install the dependency" and does it. This is actually a GOOD demo moment — it shows Claude Code handling real-world friction.

**The audience cannot think of a tool to build (Phase 3):**
David has 3 backup suggestions ready:
1. "Post-operative complication risk calculator"
2. "Clinical trial eligibility screener"
3. "BMI calculator with metabolic syndrome flags"

**Parallel terminals do not produce coherent output (Phase 4):**
This segment is short by design. If one terminal errors, the other still works. David shows what completed and says "in practice, you'd iterate on this." Do not spend time debugging live.

**The /find-gaps skill fails (Phase 5):**
David opens the Research Gap Finder app manually with the data already generated during Phase 1. The visualization still loads. The point about skills is still made by showing the skill file itself.

**Everything fails catastrophically:**
David has the reference doc. He switches to a whiteboard-style Q&A session about Claude Code capabilities, answers questions from his experience building real projects (NBME shelf app, CEA models, prediction markets, etc.). This is honestly what the audience would enjoy most anyway.

---

## Pre-Session Checklist

### The day before (Monday, April 14)

- [ ] Run the full sequence once at home on stable internet
- [ ] Verify MCP PubMed search works: open Claude Code, type "search PubMed for machine learning surgery" — confirm papers come back
- [ ] Verify Python + matplotlib work: `python -c "import matplotlib; print('ok')"`
- [ ] Verify the messy CSV exists and looks messy: `cat demo-assets/messy_data.csv`
- [ ] Verify the /find-gaps skill runs: `/find-gaps orthopedic trauma AI`
- [ ] Verify the Research Gap Finder app opens: `start Projects/research-gap-finder/index.html`
- [ ] Print or save the reference doc for distribution
- [ ] Have the GitHub repo URL ready to share: https://github.com/dbouslov/research-gap-finder
- [ ] Charge laptop, bring charger

### 30 minutes before the session

- [ ] Open Claude Code in a terminal, verify it responds
- [ ] Open a second terminal tab/window (do not start Claude Code yet — save it for Phase 4)
- [ ] Open the messy CSV in a text editor so it is ready to show
- [ ] Have the 3 backup topics written on a sticky note or memorized
- [ ] Have the 3 backup tool ideas written down
- [ ] Close unnecessary applications — keep the screen clean
- [ ] Set terminal font size large enough for the room to read on your monitors

### Things David does NOT need to prepare

- Pre-written prompts (the session is conversational)
- Slides (the terminal IS the presentation)
- A script (the plan above is the structure; the words are David's)
- The 4 terminal build prompts (these are in the repo but are NOT used during the session)

---

## What David Should Say at the Start

This is not a script. This is the shape of the opening. David should say it in his own words.

"Hey everyone. I've been using this tool called Claude Code for the last few months for my research, my coding projects, and honestly for a lot of school stuff too. It's changed how I work and I wanted to show you why.

Claude Code is an AI that runs in your terminal. Unlike ChatGPT or Claude.ai, it can actually read and write files on your computer, run code, and connect to real databases. So instead of telling you about it, I'm going to show you.

But I need a research topic. Give me a clinical question — anything — and we'll do a full research workflow live using nothing but this tool. Who's got a topic?"

---

## What David Should Say at the End

"Everything I showed you today — the literature search, the data analysis, the figures, the tool we built, the parallel work — all of that ran on my computer, in my files, through one tool.

The reference doc has install instructions and everything you need to get started. The GitHub repo has the Research Gap Finder app we built. And if you want to talk about how to use this for your own research, come find me.

One last thing: this tool is not perfect. It makes mistakes. It can hallucinate. Always verify what it gives you. But as a research collaborator — something that helps you move faster, not something that replaces your judgment — I haven't found anything else that comes close."

---

## What This Plan Does Not Include

- Slides. David does not need slides. The terminal is the presentation. If David wants a single title slide with "Claude Code for Medical Research" and the CCAIR logo visible when people walk in, that is fine, but it is not necessary.
- A detailed script for what to type. The session is conversational. David knows Claude Code. He will type naturally. The phases above give structure, not words.
- The 4-terminal parallel build of the Research Gap Finder. That approach was abandoned because it was too engineered and the audience would not connect with watching a web app get assembled. The app still exists and is shown in Phase 5 as the output of the skill system.
- Chrome automation demos. Too fragile for live sessions and the research value is not obvious enough to justify the risk.
