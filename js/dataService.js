// ============================================================
// dataService.js — Data fetching, parsing, and normalization
// Research Gap Finder — Data Service Layer
// ============================================================
// Provides search, sample data loading, MCP result parsing,
// and statistics for the paper collection.
// Registers on window.DataService. No ES modules, no fetch calls.
// ============================================================

(function() {
  "use strict";

  // ----------------------------------------------------------
  // Helper: safely get ResearchData, initializing if absent
  // ----------------------------------------------------------
  function getResearchData() {
    if (!window.ResearchData) {
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
    }
    return window.ResearchData;
  }

  // ----------------------------------------------------------
  // Helper: dispatch a CustomEvent on window
  // ----------------------------------------------------------
  function dispatch(eventName, detail) {
    window.dispatchEvent(new CustomEvent(eventName, { detail: detail }));
  }

  // ----------------------------------------------------------
  // Helper: update status on ResearchData and dispatch event
  // ----------------------------------------------------------
  function setStatus(status, message) {
    var rd = getResearchData();
    rd.status = status;
    rd.statusMessage = message || "";
    dispatch("rgf:status-update", { status: status, message: message || "" });
  }

  // ----------------------------------------------------------
  // Helper: generate a random delay between min and max ms
  // ----------------------------------------------------------
  function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ----------------------------------------------------------
  // PubMed E-utilities API (free, public, CORS-enabled)
  // ----------------------------------------------------------
  var PUBMED_SEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
  var PUBMED_FETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";
  var PUBMED_SUMMARY_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";

  function searchPubMedLive(query, maxResults) {
    maxResults = maxResults || 20;
    var searchUrl = PUBMED_SEARCH_URL + "?db=pubmed&retmode=json&retmax=" + maxResults +
      "&sort=relevance&term=" + encodeURIComponent(query);

    return fetch(searchUrl)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        var idList = data && data.esearchresult && data.esearchresult.idlist;
        if (!idList || idList.length === 0) return [];
        console.log("DataService: PubMed found " + idList.length + " IDs");

        // Fetch summaries for all IDs
        var summaryUrl = PUBMED_SUMMARY_URL + "?db=pubmed&retmode=json&id=" + idList.join(",");
        return fetch(summaryUrl)
          .then(function(res) { return res.json(); })
          .then(function(sumData) {
            var result = sumData && sumData.result;
            if (!result) return [];
            var papers = [];
            for (var i = 0; i < idList.length; i++) {
              var pmid = idList[i];
              var article = result[pmid];
              if (!article) continue;

              // Extract author names
              var authors = [];
              if (article.authors && article.authors.length) {
                for (var a = 0; a < article.authors.length; a++) {
                  authors.push(article.authors[a].name || "");
                }
              }

              papers.push({
                id: "pmid_" + pmid,
                title: article.title || "",
                authors: authors,
                journal: article.fulljournalname || article.source || "",
                year: article.pubdate ? parseInt(article.pubdate.substring(0, 4), 10) || 0 : 0,
                abstract: "", // esummary doesn't return abstracts — we'll fetch separately
                url: "https://pubmed.ncbi.nlm.nih.gov/" + pmid + "/",
                pmid: pmid,
                source: "pubmed",
                keywords: [],
                citationCount: null,
                fullTextAvailable: false
              });
            }
            return papers;
          });
      });
  }

  function fetchAbstracts(papers) {
    if (!papers || papers.length === 0) return Promise.resolve(papers);
    var pmids = papers.map(function(p) { return p.pmid; }).filter(Boolean);
    if (pmids.length === 0) return Promise.resolve(papers);

    var fetchUrl = PUBMED_FETCH_URL + "?db=pubmed&retmode=xml&id=" + pmids.join(",");
    return fetch(fetchUrl)
      .then(function(res) { return res.text(); })
      .then(function(xml) {
        // Parse abstracts from XML
        var parser = new DOMParser();
        var doc = parser.parseFromString(xml, "text/xml");
        var articles = doc.querySelectorAll("PubmedArticle");

        var abstractMap = {};
        var keywordMap = {};
        for (var i = 0; i < articles.length; i++) {
          var art = articles[i];
          var pmidEl = art.querySelector("PMID");
          if (!pmidEl) continue;
          var pmid = pmidEl.textContent;

          // Abstract
          var abstractTexts = art.querySelectorAll("AbstractText");
          var fullAbstract = "";
          for (var t = 0; t < abstractTexts.length; t++) {
            var label = abstractTexts[t].getAttribute("Label");
            if (label) fullAbstract += label + ": ";
            fullAbstract += abstractTexts[t].textContent + " ";
          }
          abstractMap[pmid] = fullAbstract.trim();

          // MeSH keywords
          var meshTerms = art.querySelectorAll("MeshHeading DescriptorName");
          var kws = [];
          for (var m = 0; m < meshTerms.length && m < 8; m++) {
            kws.push(meshTerms[m].textContent);
          }
          keywordMap[pmid] = kws;
        }

        // Merge back into papers
        for (var p = 0; p < papers.length; p++) {
          if (papers[p].pmid && abstractMap[papers[p].pmid]) {
            papers[p].abstract = abstractMap[papers[p].pmid];
          }
          if (papers[p].pmid && keywordMap[papers[p].pmid]) {
            papers[p].keywords = keywordMap[papers[p].pmid];
          }
        }
        return papers;
      })
      .catch(function(err) {
        console.warn("DataService: abstract fetch failed, continuing without abstracts", err);
        return papers;
      });
  }

  // ----------------------------------------------------------
  // Core module
  // ----------------------------------------------------------
  window.DataService = {

    /**
     * Search for papers matching a query.
     * PRIMARY: Searches PubMed live via E-utilities API.
     * FALLBACK: Uses sample data if network fails.
     */
    search: function(query) {
      var self = this;
      var rd = getResearchData();
      rd.query = query || "";

      setStatus("searching", "Connecting to PubMed...");
      console.log("DataService: searching PubMed live for \"" + query + "\"");

      searchPubMedLive(query, 20)
        .then(function(papers) {
          if (!papers || papers.length === 0) {
            throw new Error("No results from PubMed");
          }
          setStatus("searching", "Found " + papers.length + " papers on PubMed. Fetching abstracts...");
          return fetchAbstracts(papers);
        })
        .then(function(papers) {
          // Store in shared state
          rd.papers = papers;
          rd.metadata = rd.metadata || {};
          rd.metadata.searchTimestamp = new Date().toISOString();
          rd.metadata.totalPapersFound = papers.length;
          rd.metadata.databasesSearched = ["PubMed (live)"];

          setStatus("searching", "Loaded " + papers.length + " papers with abstracts. Analyzing...");
          console.log("DataService: live search complete — " + papers.length + " papers with abstracts");

          dispatch("rgf:papers-ready", { papers: papers });
        })
        .catch(function(err) {
          console.warn("DataService: live PubMed search failed, falling back to sample data.", err.message);
          setStatus("searching", "PubMed unavailable — loading cached dataset...");

          // Fallback to sample data
          setTimeout(function() {
            var papers = self.loadSampleData(query);
            setStatus("searching", "Loaded " + papers.length + " papers from cache. Analyzing...");
            dispatch("rgf:papers-ready", { papers: papers });
            console.log("DataService: fallback to sample data — " + papers.length + " papers");
          }, 500);
        });
    },

    /**
     * Load pre-fetched sample data for a specialty.
     * This is the PRIMARY path for the demo.
     */
    loadSampleData: function(query) {
      if (!window.SampleData) {
        console.warn("DataService: window.SampleData not found. Returning empty array.");
        return [];
      }

      var papers = window.SampleData.getPapers(query) || [];
      var rd = getResearchData();

      // Store in shared state
      rd.papers = papers;
      rd.query = query || "";

      // Update metadata
      rd.metadata = rd.metadata || {};
      rd.metadata.searchTimestamp = new Date().toISOString();
      rd.metadata.totalPapersFound = papers.length;
      rd.metadata.databasesSearched = ["PubMed", "Consensus/Semantic Scholar"];

      console.log("DataService: found " + papers.length + " papers for query \"" + query + "\"");
      return papers;
    },

    /**
     * Parse raw text (e.g., pasted MCP output) into Paper[] format.
     * Used by the presenter to inject live data via a hidden admin textarea.
     */
    parseMcpResults: function(rawText) {
      var newPapers = [];
      var parsed = null;

      // 1. Try to parse as JSON
      try {
        parsed = JSON.parse(rawText);
      } catch (e) {
        console.warn("DataService: parseMcpResults — raw text is not valid JSON. Attempting text extraction.");
        parsed = null;
      }

      if (parsed) {
        // 2. If it has an "articles" array (PubMed format)
        if (parsed.articles && Array.isArray(parsed.articles)) {
          for (var i = 0; i < parsed.articles.length; i++) {
            var article = parsed.articles[i];
            var paper = normalizePubMedArticle(article);
            if (paper) {
              newPapers.push(paper);
            }
          }
        }
        // Handle array at top level
        else if (Array.isArray(parsed)) {
          for (var j = 0; j < parsed.length; j++) {
            var item = parsed[j];
            var normalizedPaper = normalizeGenericObject(item);
            if (normalizedPaper) {
              newPapers.push(normalizedPaper);
            }
          }
        }
        // Handle single object with relevant fields
        else if (parsed.title || parsed.pmid) {
          var singlePaper = normalizeGenericObject(parsed);
          if (singlePaper) {
            newPapers.push(singlePaper);
          }
        }
      } else {
        // 3. Try text-based extraction for non-JSON input
        newPapers = extractPapersFromText(rawText);
      }

      // 4. Deduplicate against existing papers
      var rd = getResearchData();
      var existingIds = {};
      var currentPapers = rd.papers || [];
      for (var k = 0; k < currentPapers.length; k++) {
        existingIds[currentPapers[k].id] = true;
      }

      var addedPapers = [];
      for (var m = 0; m < newPapers.length; m++) {
        if (!existingIds[newPapers[m].id]) {
          addedPapers.push(newPapers[m]);
          existingIds[newPapers[m].id] = true; // prevent duplicates within the new batch
        }
      }

      // 5. Append only NEW parsed papers
      rd.papers = currentPapers.concat(addedPapers);

      // 6. Dispatch papers-ready with full updated array
      dispatch("rgf:papers-ready", { papers: rd.papers });
      console.log("DataService: parseMcpResults added " + addedPapers.length + " new papers (" + newPapers.length + " parsed, " + (newPapers.length - addedPapers.length) + " duplicates skipped)");

      // 7. Return newly added papers (not duplicates)
      return addedPapers;
    },

    /**
     * Return list of available sample data specialties.
     */
    getAvailableSpecialties: function() {
      if (!window.SampleData) {
        console.warn("DataService: window.SampleData not found. Returning empty array.");
        return [];
      }
      return window.SampleData.specialties || [];
    },

    /**
     * Return quick stats about the current paper set.
     */
    getStats: function() {
      var rd = getResearchData();
      var papers = rd.papers || [];

      // Total papers
      var totalPapers = papers.length;

      // Year range
      var years = [];
      for (var i = 0; i < papers.length; i++) {
        if (papers[i].year) {
          years.push(papers[i].year);
        }
      }
      var yearRange = { min: null, max: null };
      if (years.length > 0) {
        yearRange.min = Math.min.apply(null, years);
        yearRange.max = Math.max.apply(null, years);
      }

      // Top journals (top 5 by count)
      var journalCounts = {};
      for (var j = 0; j < papers.length; j++) {
        var journalName = papers[j].journal || "Unknown";
        journalCounts[journalName] = (journalCounts[journalName] || 0) + 1;
      }
      var topJournals = Object.keys(journalCounts).map(function(name) {
        return { name: name, count: journalCounts[name] };
      });
      topJournals.sort(function(a, b) { return b.count - a.count; });
      topJournals = topJournals.slice(0, 5);

      // Source breakdown
      var sourceBreakdown = { pubmed: 0, scholar: 0 };
      for (var s = 0; s < papers.length; s++) {
        var src = papers[s].source || "";
        if (src === "pubmed") {
          sourceBreakdown.pubmed++;
        } else if (src === "scholar") {
          sourceBreakdown.scholar++;
        }
      }

      // Keyword frequency (top 15)
      var keywordCounts = {};
      for (var kw = 0; kw < papers.length; kw++) {
        var keywords = papers[kw].keywords || [];
        for (var ki = 0; ki < keywords.length; ki++) {
          var keyword = keywords[ki].toLowerCase();
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        }
      }
      var keywordFrequency = Object.keys(keywordCounts).map(function(keyword) {
        return { keyword: keyword, count: keywordCounts[keyword] };
      });
      keywordFrequency.sort(function(a, b) { return b.count - a.count; });
      keywordFrequency = keywordFrequency.slice(0, 15);

      // topKeywords as plain string array (for app.js stat tags)
      var topKeywords = keywordFrequency.map(function(kf) { return kf.keyword; });

      return {
        totalPapers: totalPapers,
        yearRange: yearRange,
        topJournals: topJournals,
        sourceBreakdown: sourceBreakdown,
        keywordFrequency: keywordFrequency,
        topKeywords: topKeywords,
        databasesSearched: (rd.metadata && rd.metadata.databasesSearched) || []
      };
    }
  };

  // ----------------------------------------------------------
  // Internal: Normalize a PubMed-format article object to Paper
  // ----------------------------------------------------------
  function normalizePubMedArticle(article) {
    if (!article) return null;

    var pmid = String(article.pmid || article.PMID || article.uid || "");
    var id = pmid ? "pmid_" + pmid : "pmid_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);

    return {
      id: id,
      title: article.title || "",
      authors: normalizeAuthors(article.authors),
      journal: article.journal || article.fulljournalname || article.source || "",
      year: extractYear(article.year || article.pubdate || article.sortpubdate || ""),
      abstract: article.abstract || "",
      url: article.doi ? "https://doi.org/" + article.doi : (article.url || ""),
      pmid: pmid || null,
      source: "pubmed",
      keywords: normalizeKeywords(article.keywords || article.mesh || []),
      citationCount: typeof article.citationCount === "number" ? article.citationCount : null,
      fullTextAvailable: !!article.fullTextAvailable
    };
  }

  // ----------------------------------------------------------
  // Internal: Normalize a generic object to Paper
  // ----------------------------------------------------------
  function normalizeGenericObject(obj) {
    if (!obj || !obj.title) return null;

    var pmid = String(obj.pmid || obj.PMID || "");
    var id = obj.id || (pmid ? "pmid_" + pmid : "paper_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6));

    return {
      id: id,
      title: obj.title || "",
      authors: normalizeAuthors(obj.authors),
      journal: obj.journal || obj.source || "",
      year: extractYear(obj.year || obj.pubdate || ""),
      abstract: obj.abstract || "",
      url: obj.url || obj.doi ? (obj.url || "https://doi.org/" + obj.doi) : "",
      pmid: pmid || null,
      source: obj.source === "scholar" ? "scholar" : "pubmed",
      keywords: normalizeKeywords(obj.keywords || []),
      citationCount: typeof obj.citationCount === "number" ? obj.citationCount : null,
      fullTextAvailable: !!obj.fullTextAvailable
    };
  }

  // ----------------------------------------------------------
  // Internal: Normalize authors to string[]
  // ----------------------------------------------------------
  function normalizeAuthors(authors) {
    if (!authors) return [];
    if (typeof authors === "string") return [authors];
    if (Array.isArray(authors)) {
      return authors.map(function(a) {
        if (typeof a === "string") return a;
        // Handle { name: "..." } or { lastname: "...", firstname: "..." } formats
        if (a && typeof a === "object") {
          if (a.name) return a.name;
          if (a.lastname || a.firstname) {
            return ((a.lastname || "") + " " + (a.firstname || "").charAt(0)).trim();
          }
          if (a.last || a.first) {
            return ((a.last || "") + " " + (a.first || "").charAt(0)).trim();
          }
        }
        return String(a);
      });
    }
    return [];
  }

  // ----------------------------------------------------------
  // Internal: Normalize keywords to string[]
  // ----------------------------------------------------------
  function normalizeKeywords(keywords) {
    if (!keywords) return [];
    if (typeof keywords === "string") {
      return keywords.split(/[,;]/).map(function(k) { return k.trim(); }).filter(Boolean);
    }
    if (Array.isArray(keywords)) {
      return keywords.map(function(k) {
        return typeof k === "string" ? k : (k && k.term ? k.term : String(k));
      });
    }
    return [];
  }

  // ----------------------------------------------------------
  // Internal: Extract a 4-digit year from various formats
  // ----------------------------------------------------------
  function extractYear(val) {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      var match = val.match(/(\d{4})/);
      if (match) return parseInt(match[1], 10);
    }
    return null;
  }

  // ----------------------------------------------------------
  // Internal: Attempt to extract papers from unstructured text
  // ----------------------------------------------------------
  function extractPapersFromText(text) {
    var papers = [];
    if (!text || typeof text !== "string") return papers;

    // Try to find title/year patterns in blocks separated by double newlines
    var blocks = text.split(/\n\s*\n/);
    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i].trim();
      if (!block) continue;

      // Look for a line that could be a title (first substantial line)
      var lines = block.split("\n").map(function(l) { return l.trim(); }).filter(Boolean);
      if (lines.length === 0) continue;

      var title = "";
      var year = null;
      var abstractText = "";
      var authors = [];

      // First line is likely the title
      title = lines[0].replace(/^\d+\.\s*/, ""); // strip leading numbering

      // Try to find year anywhere in the block
      var yearMatch = block.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        year = parseInt(yearMatch[0], 10);
      }

      // Lines after title could be authors/abstract
      if (lines.length > 1) {
        // If second line looks like authors (short, contains commas)
        if (lines[1].length < 200 && lines[1].indexOf(",") !== -1) {
          authors = lines[1].split(",").map(function(a) { return a.trim(); }).filter(Boolean);
          abstractText = lines.slice(2).join(" ");
        } else {
          abstractText = lines.slice(1).join(" ");
        }
      }

      // Only add if we have at least a title
      if (title.length > 10) {
        papers.push({
          id: "text_" + Date.now() + "_" + i,
          title: title,
          authors: authors,
          journal: "",
          year: year,
          abstract: abstractText,
          url: "",
          pmid: null,
          source: "pubmed",
          keywords: [],
          citationCount: null,
          fullTextAvailable: false
        });
      }
    }

    return papers;
  }

  // ----------------------------------------------------------
  // Event listener: respond to search-start events
  // ----------------------------------------------------------
  window.addEventListener("rgf:search-start", function(e) {
    var detail = e.detail || {};
    var query = detail.query || "";
    if (query) {
      window.DataService.search(query);
    }
  });

  // ----------------------------------------------------------
  // Initialization log
  // ----------------------------------------------------------
  console.log("DataService: initialized");

})();
