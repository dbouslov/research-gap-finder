// ============================================================
// app.js — Research Gap Finder: Main App Controller
// Orchestrates UI rendering, event handling, and module wiring
// ============================================================

(function () {
  "use strict";

  // ----------------------------------------------------------
  // 1. Initialize shared data store
  // ----------------------------------------------------------
  window.ResearchData = {
    query: "",
    status: "idle",
    statusMessage: "",
    papers: [],
    gaps: [],
    ideas: [],
    landscape: null,
    metadata: {
      searchTimestamp: null,
      totalPapersFound: 0,
      databasesSearched: [],
      analysisVersion: "1.0"
    }
  };

  // ----------------------------------------------------------
  // 2. DOM references
  // ----------------------------------------------------------
  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return document.querySelectorAll(sel); };

  var dom = {};

  function cacheDom() {
    dom.searchForm     = $("#search-form");
    dom.searchInput    = $("#search-input");
    dom.statusBar      = $("#status-bar");
    dom.statusMessage  = $("#status-message");
    dom.statusProgress = $("#status-progress");
    dom.statusSpinner  = $("#status-spinner");
    dom.statsOverview  = $("#stats-overview");
    dom.statPapers     = $("#stat-papers");
    dom.statYears      = $("#stat-years");
    dom.statDatabases  = $("#stat-databases");
    dom.statKeywords   = $("#stat-keywords");
    dom.resultsDash    = $("#results-dashboard");
    dom.paperList      = $("#paper-list");
    dom.gapList        = $("#gap-list");
    dom.ideaList       = $("#idea-list");
    dom.adminPanel     = $("#admin-panel");
    dom.adminTextarea  = $("#admin-textarea");
    dom.adminParseBtn  = $("#admin-parse-btn");
    dom.adminCloseBtn  = $("#admin-close-btn");
    dom.chips          = $$(".specialty-chip");
  }

  // ----------------------------------------------------------
  // 3. Status / progress helpers
  // ----------------------------------------------------------
  var STATUS_STAGES = {
    searching:  { message: "Searching databases...",  progress: 15,  stage: "search" },
    analyzing:  { message: "Analyzing papers...",     progress: 45,  stage: "analyze" },
    gaps:       { message: "Identifying gaps...",     progress: 65,  stage: "gaps" },
    ideas:      { message: "Generating ideas...",     progress: 85,  stage: "ideas" },
    complete:   { message: "Analysis complete",       progress: 100, stage: "complete" },
    error:      { message: "An error occurred",       progress: 0,   stage: null }
  };

  function updateStatus(status, message) {
    if (!dom.statusBar) return;

    var info = STATUS_STAGES[status] || { message: message || status, progress: 50, stage: null };
    var msg = message || info.message;

    window.ResearchData.status = status;
    window.ResearchData.statusMessage = msg;

    dom.statusBar.classList.remove("hidden");

    if (dom.statusMessage) dom.statusMessage.textContent = msg;
    if (dom.statusProgress) dom.statusProgress.style.width = info.progress + "%";

    // Highlight active stage
    $$(".status-stage").forEach(function (el) {
      el.classList.remove("active", "done");
    });
    var stages = ["search", "analyze", "gaps", "ideas", "complete"];
    var activeIdx = stages.indexOf(info.stage);
    $$(".status-stage").forEach(function (el) {
      var idx = stages.indexOf(el.getAttribute("data-stage"));
      if (idx < activeIdx) el.classList.add("done");
      if (idx === activeIdx) el.classList.add("active");
    });

    // Hide spinner when complete
    if (status === "complete" && dom.statusSpinner) {
      dom.statusSpinner.classList.add("hidden");
    } else if (dom.statusSpinner) {
      dom.statusSpinner.classList.remove("hidden");
    }

    console.log("App: status →", status, msg);
  }

  // ----------------------------------------------------------
  // 4. Show/hide helpers
  // ----------------------------------------------------------
  function showSection(sectionId) {
    var el = typeof sectionId === "string" ? $(sectionId) : sectionId;
    if (el) el.classList.remove("hidden");
  }

  function hideSection(sectionId) {
    var el = typeof sectionId === "string" ? $(sectionId) : sectionId;
    if (el) el.classList.add("hidden");
  }

  // ----------------------------------------------------------
  // 5. Error handling
  // ----------------------------------------------------------
  function showError(message) {
    console.error("App: error —", message);
    var toast = document.createElement("div");
    toast.className = "error-toast";
    toast.textContent = message;
    toast.addEventListener("click", function () { toast.remove(); });
    document.body.appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) toast.remove();
    }, 6000);
  }

  // ----------------------------------------------------------
  // 6. Stats rendering
  // ----------------------------------------------------------
  function renderStats(papers) {
    if (!dom.statsOverview) return;

    // Try DataService.getStats first
    var stats = null;
    if (window.DataService && typeof window.DataService.getStats === "function") {
      stats = window.DataService.getStats();
    }

    var totalPapers = (stats && stats.totalPapers) || papers.length;
    var years = (stats && stats.yearRange)
      ? (stats.yearRange.min + "\u2013" + stats.yearRange.max)
      : getYearRange(papers);
    var databases = (stats && stats.databasesSearched) || getUniqueSources(papers);
    var keywords = (stats && stats.topKeywords) || getTopKeywords(papers, 8);

    if (dom.statPapers) dom.statPapers.textContent = totalPapers;
    if (dom.statYears) dom.statYears.textContent = years;
    if (dom.statDatabases) dom.statDatabases.textContent = databases.length;

    if (dom.statKeywords) {
      // Clear and rebuild keyword tags safely
      while (dom.statKeywords.firstChild) {
        dom.statKeywords.removeChild(dom.statKeywords.firstChild);
      }
      keywords.forEach(function (kw) {
        var tag = document.createElement("span");
        tag.className = "keyword-tag";
        tag.textContent = kw;
        dom.statKeywords.appendChild(tag);
      });
    }

    showSection("#stats-overview");
    console.log("App: stats rendered —", totalPapers, "papers,", databases.length, "databases");
  }

  function getYearRange(papers) {
    if (!papers || papers.length === 0) return "--";
    var years = papers.map(function (p) { return p.year || 0; }).filter(function (y) { return y > 0; });
    if (years.length === 0) return "--";
    return Math.min.apply(null, years) + "\u2013" + Math.max.apply(null, years);
  }

  function getUniqueSources(papers) {
    var s = {};
    (papers || []).forEach(function (p) { if (p.source) s[p.source] = true; });
    return Object.keys(s);
  }

  function getTopKeywords(papers, n) {
    var counts = {};
    (papers || []).forEach(function (p) {
      (p.keywords || []).forEach(function (kw) {
        var k = kw.toLowerCase();
        counts[k] = (counts[k] || 0) + 1;
      });
    });
    return Object.keys(counts)
      .sort(function (a, b) { return counts[b] - counts[a]; })
      .slice(0, n || 8);
  }

  // ----------------------------------------------------------
  // 7. Safe HTML helper — escapes user content for XSS safety
  // ----------------------------------------------------------
  function escapeHtml(str) {
    if (!str) return "";
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.textContent ? div.textContent.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") : "";
  }

  // ----------------------------------------------------------
  // 8. DOM element builder helpers — avoid innerHTML
  // ----------------------------------------------------------
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === "className") node.className = attrs[key];
        else if (key === "textContent") node.textContent = attrs[key];
        else if (key.indexOf("on") === 0) node.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
        else node.setAttribute(key, attrs[key]);
      });
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(function (child) {
        if (!child) return;
        if (typeof child === "string") node.appendChild(document.createTextNode(child));
        else node.appendChild(child);
      });
    }
    return node;
  }

  // ----------------------------------------------------------
  // 9. Paper card rendering
  // ----------------------------------------------------------
  function renderPapers(papers) {
    if (!dom.paperList) return;
    while (dom.paperList.firstChild) dom.paperList.removeChild(dom.paperList.firstChild);

    if (!papers || papers.length === 0) {
      dom.paperList.appendChild(
        el("div", { className: "empty-state glass-card p-6 text-center text-slate-400/60 text-sm", textContent: "No papers found" })
      );
      return;
    }

    // Progressive reveal — papers appear one by one with staggered timing
    papers.forEach(function (paper, i) {
      setTimeout(function() {
        dom.paperList.appendChild(renderPaperCard(paper, i));
      }, i * 120); // 120ms between each paper appearing
    });

    console.log("App: rendering", papers.length, "paper cards progressively");
  }

  function renderPaperCard(paper, index) {
    var card = el("div", { className: "paper-card glass-card p-4 fade-in", style: "animation-delay:" + Math.min(index * 0.05, 0.5) + "s" });

    // Source badge
    var badgeClass = paper.source === "scholar" ? "badge badge-scholar"
      : paper.source === "consensus" ? "badge badge-consensus"
      : "badge badge-pubmed";
    var badgeText = paper.source === "scholar" ? "Scholar"
      : paper.source === "consensus" ? "Consensus"
      : "PubMed";

    // Title element
    var titleEl;
    if (paper.url) {
      titleEl = el("a", {
        href: paper.url,
        target: "_blank",
        rel: "noopener",
        className: "paper-title-link font-semibold text-sm leading-snug block",
        textContent: paper.title || "Untitled"
      });
    } else {
      titleEl = el("span", {
        className: "font-semibold text-sm leading-snug block text-slate-300",
        textContent: paper.title || "Untitled"
      });
    }

    // Authors
    var authorStr = "";
    if (paper.authors && paper.authors.length > 0) {
      authorStr = paper.authors.length > 3
        ? paper.authors.slice(0, 3).join(", ") + " et al."
        : paper.authors.join(", ");
    }

    // Journal line
    var journalStr = (paper.journal || "") + (paper.year ? " (" + paper.year + ")" : "");

    // Header row
    var headerRow = el("div", { className: "flex items-start justify-between gap-2 mb-1" }, [
      el("div", { className: "flex-1" }, [titleEl]),
      el("span", { className: badgeClass, textContent: badgeText })
    ]);

    // Author line
    var authorLine = el("div", { className: "text-xs text-slate-400 mb-1", textContent: authorStr });

    // Journal line
    var journalLine = el("div", { className: "text-xs text-slate-400/70", textContent: journalStr });

    // Keywords
    var kwContainer = el("div", { className: "flex flex-wrap gap-1 mt-2" });
    if (paper.keywords && paper.keywords.length > 0) {
      paper.keywords.slice(0, 4).forEach(function (kw) {
        kwContainer.appendChild(el("span", { className: "keyword-tag", textContent: kw }));
      });
    }

    // Abstract (collapsed by default)
    var abstractDiv = el("div", { className: "abstract text-xs text-slate-400 leading-relaxed border-t border-slate-400/10 mt-2", textContent: paper.abstract || "No abstract available." });

    card.appendChild(headerRow);
    card.appendChild(authorLine);
    card.appendChild(journalLine);
    if (paper.keywords && paper.keywords.length > 0) card.appendChild(kwContainer);
    card.appendChild(abstractDiv);

    // Toggle abstract on click (but not on link click)
    card.addEventListener("click", function (e) {
      if (e.target.tagName === "A") return;
      card.classList.toggle("expanded");
    });

    return card;
  }

  // ----------------------------------------------------------
  // 10. Gap card rendering
  // ----------------------------------------------------------
  function renderGaps(gaps) {
    if (!dom.gapList) return;
    while (dom.gapList.firstChild) dom.gapList.removeChild(dom.gapList.firstChild);

    if (!gaps || gaps.length === 0) {
      dom.gapList.appendChild(
        el("div", { className: "empty-state glass-card p-6 text-center text-slate-400/60 text-sm", textContent: "No gaps identified yet" })
      );
      return;
    }

    gaps.forEach(function (gap, i) {
      setTimeout(function() {
        dom.gapList.appendChild(renderGapCard(gap, i));
      }, i * 200);
    });

    console.log("App: rendering", gaps.length, "gap cards progressively");
  }

  function renderGapCard(gap, index) {
    var card = el("div", { className: "gap-card glass-card p-4 fade-in", style: "animation-delay:" + Math.min(index * 0.08, 0.5) + "s" });

    var severity = gap.severity || 0;
    var sevLevel = severity <= 3 ? "low" : severity <= 6 ? "medium" : "high";
    var sevLabel = severity <= 3 ? "Low" : severity <= 6 ? "Medium" : "High";
    var paperCount = (gap.supportingPaperIds || []).length;

    // Category badge
    var catBadge = gap.category
      ? el("span", { className: "badge badge-" + gap.category, textContent: gap.category })
      : null;

    // Title row
    var titleRow = el("div", { className: "flex items-start justify-between gap-2 mb-2" }, [
      el("h3", { className: "font-semibold text-sm text-slate-300 leading-snug flex-1", textContent: gap.title || "Untitled Gap" }),
      catBadge
    ]);

    // Severity row
    var sevFill = el("div", { className: "severity-bar-fill " + sevLevel, style: "width:" + (severity * 10) + "%" });
    var sevBar = el("div", { className: "severity-bar flex-1" }, [sevFill]);
    var sevRow = el("div", { className: "flex items-center gap-2 mb-2" }, [
      el("span", { className: "text-xs severity-" + sevLevel + " font-semibold", textContent: sevLabel + " (" + severity + "/10)" }),
      sevBar
    ]);

    // Description
    var descP = el("p", { className: "text-xs text-slate-400 leading-relaxed mb-2", textContent: gap.description || "" });

    card.appendChild(titleRow);
    card.appendChild(sevRow);
    card.appendChild(descP);

    if (paperCount > 0) {
      card.appendChild(el("div", {
        className: "text-xs text-slate-400/60",
        textContent: paperCount + " paper" + (paperCount !== 1 ? "s" : "") + " reference this gap"
      }));
    }

    return card;
  }

  // ----------------------------------------------------------
  // 11. Idea card rendering
  // ----------------------------------------------------------
  function renderIdeas(ideas) {
    if (!dom.ideaList) return;
    while (dom.ideaList.firstChild) dom.ideaList.removeChild(dom.ideaList.firstChild);

    if (!ideas || ideas.length === 0) {
      dom.ideaList.appendChild(
        el("div", { className: "empty-state glass-card p-6 text-center text-slate-400/60 text-sm", textContent: "No ideas generated yet" })
      );
      return;
    }

    ideas.forEach(function (idea, i) {
      dom.ideaList.appendChild(renderIdeaCard(idea, i));
    });

    dom.ideaList.classList.add("stagger-children");
    console.log("App: rendered", ideas.length, "idea cards");
  }

  function renderIdeaCard(idea, index) {
    var card = el("div", { className: "idea-card glass-card p-4 fade-in", style: "animation-delay:" + Math.min(index * 0.08, 0.5) + "s" });

    var feasibility = (idea.feasibility && idea.feasibility.overall) || 0;
    var scoreClass = feasibility < 40 ? "score-low" : feasibility < 70 ? "score-mid" : "score-high";
    var timelineMonths = (idea.feasibility && idea.feasibility.timelineMonths) || 0;
    var costEstimate = (idea.feasibility && idea.feasibility.costEstimate) || "unknown";
    var costBadgeClass = costEstimate === "low" ? "badge-cost-low"
      : costEstimate === "high" ? "badge-cost-high"
      : "badge-cost-medium";

    // Title row
    var titleRow = el("div", { className: "flex items-start justify-between gap-2 mb-2" }, [
      el("h3", { className: "font-semibold text-sm text-slate-300 leading-snug flex-1", textContent: idea.title || "Untitled Idea" }),
      idea.studyDesign ? el("span", { className: "badge-design", textContent: idea.studyDesign }) : null
    ]);

    // Feasibility bar row
    var feasFill = el("div", { className: "feasibility-bar-fill " + scoreClass, style: "width:" + feasibility + "%" });
    var feasBar = el("div", { className: "feasibility-bar flex-1" }, [feasFill]);
    var feasRow = el("div", { className: "flex items-center gap-3 mb-2 text-xs" }, [
      el("span", { className: "text-slate-400", textContent: "Feasibility" }),
      feasBar,
      el("span", { className: "text-slate-300 font-semibold", textContent: String(feasibility) })
    ]);

    // Meta row (timeline + cost)
    var metaChildren = [];
    if (timelineMonths > 0) {
      metaChildren.push(el("span", { className: "text-slate-400", textContent: "~" + timelineMonths + " months" }));
    }
    metaChildren.push(el("span", { className: "badge " + costBadgeClass, textContent: costEstimate + " cost" }));
    var metaRow = el("div", { className: "flex items-center gap-3 text-xs" }, metaChildren);

    // Expandable details section
    var detailsDiv = el("div", { className: "idea-details text-xs text-slate-400 leading-relaxed border-t border-slate-400/10 mt-2 space-y-2" });

    if (idea.description) {
      detailsDiv.appendChild(el("p", { textContent: idea.description }));
    }

    var databases = (idea.suggestedDatabases || []).join(", ");
    if (databases) {
      var dbP = el("p");
      dbP.appendChild(el("span", { className: "text-slate-300 font-medium", textContent: "Databases: " }));
      dbP.appendChild(document.createTextNode(databases));
      detailsDiv.appendChild(dbP);
    }

    if (idea.estimatedSampleSize) {
      var ssP = el("p");
      ssP.appendChild(el("span", { className: "text-slate-300 font-medium", textContent: "Sample size: " }));
      ssP.appendChild(document.createTextNode(idea.estimatedSampleSize));
      detailsDiv.appendChild(ssP);
    }

    var journals = (idea.potentialJournals || []).join(", ");
    if (journals) {
      var jP = el("p");
      jP.appendChild(el("span", { className: "text-slate-300 font-medium", textContent: "Target journals: " }));
      jP.appendChild(document.createTextNode(journals));
      detailsDiv.appendChild(jP);
    }

    card.appendChild(titleRow);
    card.appendChild(feasRow);
    card.appendChild(metaRow);
    card.appendChild(detailsDiv);

    card.addEventListener("click", function () {
      card.classList.toggle("expanded");
    });

    return card;
  }

  // ----------------------------------------------------------
  // 12. Search flow
  // ----------------------------------------------------------
  function startSearch(query) {
    if (!query || !query.trim()) return;
    query = query.trim();

    console.log("App: search started for", query);

    // Reset state
    window.ResearchData.query = query;
    window.ResearchData.papers = [];
    window.ResearchData.gaps = [];
    window.ResearchData.ideas = [];
    window.ResearchData.landscape = null;
    window.ResearchData.status = "searching";
    window.ResearchData.metadata.searchTimestamp = new Date().toISOString();

    // Update UI
    hideSection("#results-dashboard");
    hideSection("#stats-overview");
    updateStatus("searching");

    // Fill search input
    if (dom.searchInput) dom.searchInput.value = query;

    // Highlight active chip
    dom.chips.forEach(function (chip) {
      chip.classList.toggle("active", chip.getAttribute("data-query") === query);
    });

    // Dispatch search event for DataService
    window.dispatchEvent(new CustomEvent("rgf:search-start", {
      detail: { query: query }
    }));
  }

  // ----------------------------------------------------------
  // 13. Event listeners
  // ----------------------------------------------------------
  function bindEvents() {
    // Search form
    if (dom.searchForm) {
      dom.searchForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var q = dom.searchInput ? dom.searchInput.value : "";
        startSearch(q);
      });
    }

    // Specialty chips
    dom.chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var q = chip.getAttribute("data-query");
        if (dom.searchInput) dom.searchInput.value = q;
        startSearch(q);
      });
    });

    // Admin panel toggle: Ctrl+Shift+A
    document.addEventListener("keydown", function (e) {
      if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        toggleAdminPanel();
      }
    });

    // Admin close button
    if (dom.adminCloseBtn) {
      dom.adminCloseBtn.addEventListener("click", function () {
        hideSection("#admin-panel");
      });
    }

    // Admin parse button
    if (dom.adminParseBtn) {
      dom.adminParseBtn.addEventListener("click", function () {
        var text = dom.adminTextarea ? dom.adminTextarea.value : "";
        if (!text.trim()) return;
        if (window.DataService && typeof window.DataService.parseMcpResults === "function") {
          window.DataService.parseMcpResults(text);
          console.log("App: admin parse triggered");
        } else {
          showError("DataService not available for parsing");
        }
      });
    }

    // ------- Listen for events from other terminals -------

    // Papers ready (from Terminal 1 / DataService)
    window.addEventListener("rgf:papers-ready", function (e) {
      var papers = (e.detail && e.detail.papers) || [];
      console.log("App: received rgf:papers-ready —", papers.length, "papers");

      window.ResearchData.papers = papers;
      window.ResearchData.metadata.totalPapersFound = papers.length;

      renderPapers(papers);
      renderStats(papers);
      updateStatus("analyzing");

      // AnalysisEngine self-triggers on rgf:papers-ready — do NOT call analyze() here
      // (calling it here would cause a double analysis run)
      if (!window.AnalysisEngine || typeof window.AnalysisEngine.analyze !== "function") {
        console.log("App: AnalysisEngine not loaded — showing papers only (graceful degradation)");
        showSection("#results-dashboard");
        updateStatus("complete", "Papers loaded (analysis engine unavailable)");
      }
    });

    // Analysis ready (from Terminal 4 / AnalysisEngine)
    window.addEventListener("rgf:analysis-ready", function () {
      console.log("App: received rgf:analysis-ready");

      // Terminal 4 is the authority — read from ResearchData, do NOT re-write
      var gaps = window.ResearchData.gaps || [];
      var ideas = window.ResearchData.ideas || [];

      renderGaps(gaps);
      renderIdeas(ideas);
      showSection("#results-dashboard");
      updateStatus("complete");
    });

    // Status updates (from any terminal)
    window.addEventListener("rgf:status-update", function (e) {
      var detail = e.detail || {};
      updateStatus(detail.status || "searching", detail.message || "");
    });

    // Errors (from any terminal)
    window.addEventListener("rgf:error", function (e) {
      var detail = e.detail || {};
      showError((detail.source ? detail.source + ": " : "") + (detail.message || "Unknown error"));
    });
  }

  // ----------------------------------------------------------
  // 14. Admin panel
  // ----------------------------------------------------------
  function toggleAdminPanel() {
    if (!dom.adminPanel) return;
    if (dom.adminPanel.classList.contains("hidden")) {
      showSection("#admin-panel");
      if (dom.adminTextarea) dom.adminTextarea.focus();
    } else {
      hideSection("#admin-panel");
    }
  }

  // ----------------------------------------------------------
  // 15. Loading state
  // ----------------------------------------------------------
  function showLoading(isLoading) {
    if (isLoading) {
      updateStatus("searching");
    } else {
      updateStatus("complete");
    }
  }

  // ----------------------------------------------------------
  // 16. Public API
  // ----------------------------------------------------------
  window.App = {
    init: init,
    showSection: showSection,
    hideSection: hideSection,
    showError: showError,
    showLoading: showLoading,
    renderPapers: renderPapers,
    renderGaps: renderGaps,
    renderIdeas: renderIdeas,
    updateStatus: updateStatus
  };

  // ----------------------------------------------------------
  // 17. Init
  // ----------------------------------------------------------
  function init() {
    cacheDom();
    bindEvents();

    // Ensure results are hidden on load
    hideSection("#results-dashboard");
    hideSection("#stats-overview");
    hideSection("#status-bar");
    hideSection("#admin-panel");

    console.log("App: initialized, waiting for user input");
    console.log("App: modules detected —",
      "DataService:", !!window.DataService,
      "AnalysisEngine:", !!window.AnalysisEngine,
      "Visualizations:", !!window.Visualizations,
      "SampleData:", !!window.SampleData,
      "LiveResults:", !!window.LiveResults
    );

    // Auto-load if LiveResults exists (generated by /find-gaps skill)
    if (window.LiveResults && window.LiveResults.papers && window.LiveResults.papers.length > 0) {
      console.log("App: LiveResults detected — auto-loading " + window.LiveResults.papers.length + " papers");
      var lr = window.LiveResults;

      // Set query in search bar
      if (dom.searchInput && lr.query) dom.searchInput.value = lr.query;

      // Populate ResearchData
      window.ResearchData.query = lr.query || "";
      window.ResearchData.papers = lr.papers;
      window.ResearchData.metadata.searchTimestamp = lr.timestamp || new Date().toISOString();
      window.ResearchData.metadata.totalPapersFound = lr.papers.length;
      window.ResearchData.metadata.databasesSearched = ["PubMed (via Claude Code)"];

      // Render papers and stats
      showSection("#status-bar");
      updateStatus("searching", "Loading pre-analyzed results...");
      renderPapers(lr.papers);
      showSection("#stats-overview");
      renderStats(lr.papers);

      // If analysis results exist, load those too
      if (lr.gaps && lr.gaps.length > 0) {
        window.ResearchData.gaps = lr.gaps;
        window.ResearchData.ideas = lr.ideas || [];
        window.ResearchData.landscape = lr.landscape || null;

        setTimeout(function() {
          updateStatus("complete", "Analysis complete");
          renderGaps(lr.gaps);
          renderIdeas(lr.ideas || []);
          showSection("#results-dashboard");

          // Trigger visualizations
          dispatch("rgf:analysis-ready", { gaps: lr.gaps, ideas: lr.ideas || [], landscape: lr.landscape });
        }, 500);
      } else {
        // Only papers, no analysis — trigger analysis engine
        dispatch("rgf:papers-ready", { papers: lr.papers });
      }
    }
  }

  // Auto-init on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
