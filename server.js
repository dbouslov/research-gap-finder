/**
 * server.js — Local server for Research Gap Finder
 *
 * Serves static files AND provides an /api/analyze endpoint that calls
 * Claude's API for real AI-powered gap analysis.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... node server.js
 *   Then open http://localhost:3000
 *
 * The API key can also be set via .env file or system environment.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const https = require("https");

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY || "";

// MIME types for static file serving
const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".md": "text/markdown"
};

/**
 * Call Claude API to analyze papers and identify research gaps.
 * Returns structured JSON matching the app's Gap/ProjectIdea schema.
 */
function analyzeWithClaude(papers, query) {
  return new Promise(function(resolve, reject) {
    // Build the prompt with paper data
    const paperSummaries = papers.map(function(p, i) {
      return (i + 1) + ". " + p.title + " (" + (p.journal || "Unknown") + ", " + (p.year || "N/A") + ")\n" +
        "   Authors: " + (p.authors || []).slice(0, 3).join(", ") + (p.authors && p.authors.length > 3 ? " et al." : "") + "\n" +
        "   Keywords: " + (p.keywords || []).join(", ") + "\n" +
        "   Abstract: " + (p.abstract || "No abstract available.").substring(0, 800);
    }).join("\n\n");

    const prompt = `You are a medical research analyst. Analyze the following ${papers.length} papers on "${query}" and identify research gaps and project ideas.

PAPERS:
${paperSummaries}

Analyze these papers and return a JSON object with exactly this structure. Be specific, evidence-based, and thorough. Reference specific papers by their number when identifying gaps.

{
  "gaps": [
    {
      "id": "gap_1",
      "title": "Short descriptive title of the gap",
      "description": "2-3 sentence explanation of why this is a gap, referencing specific papers that highlight it",
      "category": "methodology|population|outcome|comparison|setting",
      "severity": 1-10,
      "supportingPaperIds": [],
      "keywords": ["relevant", "keywords"],
      "evidenceQuotes": ["Direct quote or paraphrase from abstracts that supports this gap"]
    }
  ],
  "ideas": [
    {
      "id": "idea_1",
      "title": "Specific actionable project title",
      "description": "3-5 sentence description of the project: what it would do, why it matters, methodology overview",
      "gapId": "gap_1",
      "studyDesign": "Retrospective cohort|Prospective cohort|RCT|Systematic review|Meta-analysis|Cross-sectional|Case-control|Mixed methods",
      "feasibility": {
        "overall": 0-100,
        "dataAvailability": 0-100,
        "costEstimate": "low|medium|high",
        "timelineMonths": 6-48,
        "technicalComplexity": 0-100,
        "novelty": 0-100,
        "clinicalImpact": 0-100
      },
      "suggestedDatabases": ["NSQIP", "institutional data", etc],
      "estimatedSampleSize": "e.g. 500-1000 patients",
      "potentialJournals": ["Target journals for publication"]
    }
  ],
  "landscape": {
    "clusters": [
      {
        "id": "cluster_1",
        "label": "Theme name",
        "keywords": ["top", "keywords"],
        "paperIds": [],
        "x": 0-100,
        "y": 0-100,
        "size": number_of_papers
      }
    ],
    "connections": [
      {"from": "cluster_1", "to": "cluster_2", "strength": 0.0-1.0}
    ],
    "gapZones": [
      {"id": "gapzone_1", "gapId": "gap_1", "x": 0-100, "y": 0-100, "radius": 5-20}
    ]
  }
}

IMPORTANT RULES:
- Generate 5-8 gaps, sorted by severity (most severe first)
- Generate 1-2 ideas per gap (8-12 total)
- Generate 4-7 clusters for the landscape
- All feasibility scores must be between 0-100
- Map paper IDs as "pmid_" + their PMID, or use the index: "paper_1", "paper_2", etc.
- Make gaps and ideas SPECIFIC to "${query}", not generic
- Base your analysis on what IS and ISN'T covered across these papers
- Identify genuine gaps: missing populations, unstudied outcomes, methodological weaknesses, lacking comparisons
- For each gap, explain WHY it matters clinically

Return ONLY the JSON object, no other text.`;

    const requestBody = JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }]
    });

    const options = {
      hostname: "api.anthropic.com",
      port: 443,
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(requestBody)
      }
    };

    const req = https.request(options, function(res) {
      let data = "";
      res.on("data", function(chunk) { data += chunk; });
      res.on("end", function() {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            reject(new Error("Claude API error: " + response.error.message));
            return;
          }
          const text = response.content && response.content[0] && response.content[0].text;
          if (!text) {
            reject(new Error("Empty response from Claude API"));
            return;
          }
          // Extract JSON from response (handle markdown code blocks)
          let jsonStr = text.trim();
          if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
          }
          const result = JSON.parse(jsonStr);
          resolve(result);
        } catch (e) {
          reject(new Error("Failed to parse Claude response: " + e.message));
        }
      });
    });

    req.on("error", function(e) {
      reject(new Error("Network error calling Claude API: " + e.message));
    });

    req.write(requestBody);
    req.end();
  });
}

/**
 * Handle incoming HTTP requests.
 */
function handleRequest(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // API endpoint: POST /api/analyze
  if (req.method === "POST" && req.url === "/api/analyze") {
    if (!API_KEY) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "ANTHROPIC_API_KEY not set. Start server with: ANTHROPIC_API_KEY=sk-ant-... node server.js" }));
      return;
    }

    let body = "";
    req.on("data", function(chunk) { body += chunk; });
    req.on("end", function() {
      try {
        const data = JSON.parse(body);
        const papers = data.papers || [];
        const query = data.query || "";

        if (papers.length === 0) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "No papers provided" }));
          return;
        }

        console.log("[API] Analyzing " + papers.length + " papers for query: " + query);

        analyzeWithClaude(papers, query)
          .then(function(result) {
            console.log("[API] Analysis complete — " +
              (result.gaps || []).length + " gaps, " +
              (result.ideas || []).length + " ideas, " +
              ((result.landscape && result.landscape.clusters) || []).length + " clusters");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(result));
          })
          .catch(function(err) {
            console.error("[API] Analysis failed:", err.message);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: err.message }));
          });
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON body: " + e.message }));
      }
    });
    return;
  }

  // API endpoint: GET /api/status
  if (req.url === "/api/status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "ok",
      aiEnabled: !!API_KEY,
      model: "claude-sonnet-4-20250514"
    }));
    return;
  }

  // Static file serving
  let filePath = "." + req.url;
  if (filePath === "./") filePath = "./index.html";

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, function(err, content) {
    if (err) {
      if (err.code === "ENOENT") {
        res.writeHead(404);
        res.end("Not found: " + req.url);
      } else {
        res.writeHead(500);
        res.end("Server error: " + err.code);
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    }
  });
}

const server = http.createServer(handleRequest);

server.listen(PORT, function() {
  console.log("");
  console.log("  Research Gap Finder");
  console.log("  http://localhost:" + PORT);
  console.log("");
  if (API_KEY) {
    console.log("  AI Analysis: ENABLED (Claude claude-sonnet-4-20250514)");
  } else {
    console.log("  AI Analysis: DISABLED (set ANTHROPIC_API_KEY to enable)");
    console.log("  Run: ANTHROPIC_API_KEY=sk-ant-... node server.js");
  }
  console.log("");
});
