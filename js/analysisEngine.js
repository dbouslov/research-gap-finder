/**
 * Research Gap Finder — Analysis Engine
 *
 * Pure algorithmic text processing of paper abstracts to identify research gaps,
 * generate project ideas, score feasibility, and build a topic landscape.
 *
 * Registered on window.AnalysisEngine.
 * Reads from window.ResearchData.papers, writes to .gaps, .ideas, .landscape.
 */
(function () {
  "use strict";

  // -----------------------------------------------------------------------
  // CONSTANTS
  // -----------------------------------------------------------------------

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

  var GAP_PHRASES = [
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

  // Category keyword maps — used to categorize a gap based on context words
  var CATEGORY_KEYWORDS = {
    methodology: [
      "retrospective","prospective","rct","randomized","blinded","cohort","cross-sectional",
      "case-control","validation","algorithm","model","sample size","bias","confound",
      "systematic review","meta-analysis","standardized","reporting","methodology",
      "design","statistical","heterogeneity","risk of bias","external validation",
      "prospective validation","single center","single institution","multi-center"
    ],
    population: [
      "pediatric","elderly","geriatric","women","men","female","male","race","ethnicity",
      "diverse","minority","underrepresented","age","sex","gender","adolescent","children",
      "neonatal","african american","hispanic","asian","socioeconomic","rural","urban",
      "low-income","disparities","equity","inclusion","subgroup","demographic"
    ],
    outcome: [
      "long-term","follow-up","survival","mortality","morbidity","complication",
      "readmission","quality of life","patient-reported","functional","cost",
      "cost-effectiveness","economic","patient satisfaction","proms","qaly",
      "disability","return to work","length of stay","reoperation","revision",
      "short-term","outcome measure","endpoint","surrogate","composite"
    ],
    comparison: [
      "versus","compared","comparison","head-to-head","superiority","non-inferiority",
      "equivalence","alternative","technique","approach","intervention","treatment",
      "placebo","sham","control","benchmark","standard of care","algorithm comparison"
    ],
    setting: [
      "implementation","deployment","real-world","clinical practice","community",
      "academic","teaching hospital","ambulatory","outpatient","inpatient","emergency",
      "primary care","resource-limited","developing","low-resource","telemedicine",
      "remote","setting","transferability","generalizability","scalability"
    ]
  };

  // Base importance scores by gap type for severity calculation
  var GAP_IMPORTANCE = {
    "external validation": 8,
    "prospective validation": 8,
    "prospective study": 7,
    "multi-center": 7,
    "larger cohort": 6,
    "diverse populations": 6,
    "long-term outcomes": 7,
    "cost-effectiveness": 6,
    "patient-reported outcomes": 5,
    "clinical impact": 7,
    "algorithm comparison": 5,
    "standardized reporting": 5,
    "real-world data": 6,
    "default": 5
  };

  // Methodology pattern definitions for gap detection
  var METHODOLOGY_PATTERNS = [
    { pattern: /\bretrospective\b/i, gapTitle: "Need for prospective studies", category: "methodology", importanceKey: "prospective study" },
    { pattern: /\bsingle[- ](?:institution|center|centre)\b/i, gapTitle: "Need for multi-center validation", category: "methodology", importanceKey: "multi-center" },
    { pattern: /\bsmall\s+(?:sample|cohort|number|group)\b/i, gapTitle: "Need for larger study cohorts", category: "methodology", importanceKey: "larger cohort" },
    { pattern: /\b(?:n\s*=\s*\d{1,2})\b/i, gapTitle: "Need for larger study cohorts", category: "methodology", importanceKey: "larger cohort" },
    { pattern: /\bexternal\s+validation\b/i, gapTitle: "Need for external validation studies", category: "methodology", importanceKey: "external validation", invertMatch: true }
  ];

  // Population demographic patterns
  var POPULATION_MARKERS = {
    pediatric: /\b(?:pediatric|paediatric|children|child|adolescent|neonatal|infant)\b/i,
    elderly: /\b(?:elderly|geriatric|older\s+adults?|aged\s+(?:65|70|75|80))\b/i,
    female: /\b(?:women|female|maternal|pregnancy|pregnant)\b/i,
    male: /\b(?:men|male)\b/i,
    racialEthnic: /\b(?:african\s+american|hispanic|latino|asian|race|ethnicity|racial|ethnic|minority|minorities)\b/i
  };

  // Outcome patterns
  var OUTCOME_MARKERS = {
    longTerm: /\b(?:long[- ]term|5[- ]year|10[- ]year|follow[- ]up\s+(?:of|period))\b/i,
    costEffectiveness: /\b(?:cost[- ]effectiveness|cost[- ]benefit|economic\s+evaluation|cost\s+analysis|qaly)\b/i,
    patientReported: /\b(?:patient[- ]reported|proms?|quality\s+of\s+life|satisfaction|functional\s+outcome)\b/i,
    clinicalImpact: /\b(?:clinical\s+(?:impact|outcome|utility|decision)|implementation|deployment|workflow)\b/i
  };

  // Study design mapping for idea generation
  var STUDY_DESIGNS = {
    retrospective: "Retrospective cohort",
    prospective: "Prospective cohort",
    rct: "RCT",
    systematicReview: "Systematic review",
    metaAnalysis: "Meta-analysis",
    crossSectional: "Cross-sectional",
    caseControl: "Case-control",
    qualitative: "Qualitative study",
    mixedMethods: "Mixed methods"
  };

  // Database suggestions keyed by topic keywords
  var DATABASE_SUGGESTIONS = {
    surgery: ["NSQIP", "NIS", "institutional surgical registry"],
    orthopedic: ["NSQIP", "American Joint Replacement Registry", "institutional registry"],
    cancer: ["SEER", "NCDB", "institutional tumor registry"],
    radiology: ["institutional PACS data", "public imaging datasets", "TCIA"],
    imaging: ["institutional PACS data", "public imaging datasets", "TCIA"],
    cardiac: ["STS database", "ACC/NCDR registries", "institutional EHR data"],
    llm: ["synthetic clinical scenarios", "medical exam databases", "clinical notes (de-identified)"],
    "artificial intelligence": ["institutional EHR data", "public ML datasets", "MIMIC"],
    "machine learning": ["institutional EHR data", "public ML datasets", "MIMIC"],
    pediatric: ["PHIS", "Kids' Inpatient Database (KID)", "institutional EHR data"],
    trauma: ["NTDB", "institutional trauma registry", "TQIP"],
    general: ["PubMed/literature databases", "institutional EHR data"]
  };

  // Journal suggestions by topic
  var JOURNAL_SUGGESTIONS = {
    surgery: ["Annals of Surgery", "JAMA Surgery", "British Journal of Surgery", "Surgery"],
    orthopedic: ["JBJS", "Clinical Orthopaedics and Related Research", "Journal of Arthroplasty"],
    cancer: ["Journal of Clinical Oncology", "Annals of Surgical Oncology", "Cancer"],
    radiology: ["Radiology", "AJR", "European Radiology"],
    cardiac: ["Journal of Thoracic and Cardiovascular Surgery", "Annals of Thoracic Surgery", "Circulation"],
    "artificial intelligence": ["npj Digital Medicine", "Journal of Medical Internet Research", "The Lancet Digital Health"],
    "machine learning": ["npj Digital Medicine", "Journal of Medical Internet Research", "The Lancet Digital Health"],
    pediatric: ["Journal of Pediatric Surgery", "Pediatrics", "JAMA Pediatrics"],
    trauma: ["Journal of Trauma and Acute Care Surgery", "Injury", "World Journal of Emergency Surgery"],
    general: ["JAMA", "BMJ", "The Lancet", "PLOS ONE"]
  };

  // -----------------------------------------------------------------------
  // UTILITY HELPERS
  // -----------------------------------------------------------------------

  /** Clamp a value to [0, 100]. */
  function clamp(val) {
    return Math.max(0, Math.min(100, val));
  }

  /** Split text into sentences. */
  function splitSentences(text) {
    if (!text) return [];
    // Split on period/question/exclamation followed by space and capital, or end of string
    var raw = text.replace(/([.?!])\s+/g, "$1|SPLIT|").split("|SPLIT|");
    var sentences = [];
    for (var i = 0; i < raw.length; i++) {
      var s = raw[i].trim();
      if (s.length > 5) sentences.push(s);
    }
    return sentences;
  }

  /** Extract meaningful keywords from text. Returns array of lowercase terms. */
  function extractKeywords(text) {
    if (!text) return [];
    var words = text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/);
    var keywords = [];
    for (var i = 0; i < words.length; i++) {
      var w = words[i].trim();
      if (w.length > 2 && !STOPWORDS.has(w)) {
        keywords.push(w);
      }
    }
    return keywords;
  }

  /** Build a frequency map from an array of strings. */
  function freqMap(arr) {
    var map = {};
    for (var i = 0; i < arr.length; i++) {
      var key = arr[i];
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }

  /** Get top N entries from a frequency map as [{term, count}]. */
  function topN(freqObj, n) {
    var entries = [];
    for (var key in freqObj) {
      if (freqObj.hasOwnProperty(key)) {
        entries.push({ term: key, count: freqObj[key] });
      }
    }
    entries.sort(function (a, b) { return b.count - a.count; });
    return entries.slice(0, n);
  }

  /** Simple cosine-like similarity between two keyword arrays. */
  function keywordOverlap(a, b) {
    if (!a.length || !b.length) return 0;
    var setA = new Set(a);
    var setB = new Set(b);
    var intersection = 0;
    setA.forEach(function (word) {
      if (setB.has(word)) intersection++;
    });
    var union = new Set(a.concat(b)).size;
    return union > 0 ? intersection / union : 0;
  }

  /** Determine the best category for a gap given its context text. */
  function categorizeGap(contextText) {
    var lower = contextText.toLowerCase();
    var scores = {};
    for (var cat in CATEGORY_KEYWORDS) {
      if (!CATEGORY_KEYWORDS.hasOwnProperty(cat)) continue;
      var terms = CATEGORY_KEYWORDS[cat];
      var score = 0;
      for (var i = 0; i < terms.length; i++) {
        if (lower.indexOf(terms[i]) !== -1) score++;
      }
      scores[cat] = score;
    }
    var best = "methodology";
    var bestScore = 0;
    for (var c in scores) {
      if (scores[c] > bestScore) {
        bestScore = scores[c];
        best = c;
      }
    }
    return best;
  }

  /** Get the query topic from ResearchData or infer from papers. */
  function getQueryTopic(papers) {
    if (window.ResearchData && window.ResearchData.query) {
      return window.ResearchData.query;
    }
    // Infer from most common title keywords
    var allKw = [];
    for (var i = 0; i < papers.length; i++) {
      allKw = allKw.concat(extractKeywords(papers[i].title || ""));
    }
    var freq = freqMap(allKw);
    var top = topN(freq, 3);
    return top.map(function (t) { return t.term; }).join(" ");
  }

  /** Match topic text against database/journal suggestion keys. Returns the best key. */
  function matchTopicKey(topic) {
    var lower = topic.toLowerCase();
    var keys = Object.keys(DATABASE_SUGGESTIONS);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] !== "general" && lower.indexOf(keys[i]) !== -1) {
        return keys[i];
      }
    }
    return "general";
  }

  /** Dispatch a custom event. */
  function dispatch(eventName, detail) {
    window.dispatchEvent(new CustomEvent(eventName, { detail: detail }));
  }

  /** Dispatch a status update. */
  function statusUpdate(message) {
    dispatch("rgf:status-update", { status: "analyzing", message: message });
  }

  // -----------------------------------------------------------------------
  // GAP DETECTION  (Step 2 of the pipeline)
  // -----------------------------------------------------------------------

  function detectGaps(papers) {
    if (!papers || !papers.length) return [];

    console.log("AnalysisEngine: analyzing " + papers.length + " papers");

    var rawGaps = []; // collect raw gap signals before merging

    // ---- A. Explicit Gap Language Detection ----
    for (var p = 0; p < papers.length; p++) {
      var paper = papers[p];
      var abstract = (paper.abstract || "").toLowerCase();
      if (!abstract) continue;

      var sentences = splitSentences(paper.abstract || "");
      var abstractLower = abstract;

      for (var g = 0; g < GAP_PHRASES.length; g++) {
        var phrase = GAP_PHRASES[g];
        if (abstractLower.indexOf(phrase) === -1) continue;

        // Find the sentence(s) containing this phrase
        var matchedSentences = [];
        var contextSentences = [];
        for (var s = 0; s < sentences.length; s++) {
          if (sentences[s].toLowerCase().indexOf(phrase) !== -1) {
            matchedSentences.push(sentences[s]);
            // Grab surrounding context (one sentence before and after)
            if (s > 0) contextSentences.push(sentences[s - 1]);
            contextSentences.push(sentences[s]);
            if (s < sentences.length - 1) contextSentences.push(sentences[s + 1]);
          }
        }

        var contextText = contextSentences.join(" ");
        var category = categorizeGap(contextText);
        var gapKeywords = extractKeywords(contextText).slice(0, 10);

        // Build a descriptive title from the phrase and context
        var gapTitle = buildGapTitleFromPhrase(phrase, contextText);

        rawGaps.push({
          title: gapTitle,
          description: "",
          category: category,
          phrase: phrase,
          supportingPaperIds: [paper.id],
          keywords: gapKeywords,
          evidenceQuotes: matchedSentences.slice(0, 2),
          year: paper.year || 2020,
          contextText: contextText
        });
      }
    }

    // ---- B. Methodology Gap Detection ----
    var methodGapCounts = {}; // gapTitle -> {papers: Set, years: [], contexts: []}
    for (var mp = 0; mp < papers.length; mp++) {
      var mPaper = papers[mp];
      var mAbstract = (mPaper.abstract || "").toLowerCase();
      if (!mAbstract) continue;

      for (var mi = 0; mi < METHODOLOGY_PATTERNS.length; mi++) {
        var mDef = METHODOLOGY_PATTERNS[mi];
        var matches = mDef.pattern.test(mAbstract);

        // For invertMatch, the gap exists when the term is NOT found
        if (mDef.invertMatch) {
          if (matches) continue; // term IS present, no gap here
        } else {
          if (!matches) continue;
        }

        if (!methodGapCounts[mDef.gapTitle]) {
          methodGapCounts[mDef.gapTitle] = {
            category: mDef.category,
            importanceKey: mDef.importanceKey,
            papers: new Set(),
            years: [],
            contexts: []
          };
        }
        methodGapCounts[mDef.gapTitle].papers.add(mPaper.id);
        methodGapCounts[mDef.gapTitle].years.push(mPaper.year || 2020);

        // Grab a representative sentence
        var mSentences = splitSentences(mPaper.abstract || "");
        for (var ms = 0; ms < mSentences.length; ms++) {
          if (mDef.pattern.test(mSentences[ms].toLowerCase()) || (mDef.invertMatch && mSentences[ms].toLowerCase().indexOf("method") !== -1)) {
            methodGapCounts[mDef.gapTitle].contexts.push(mSentences[ms]);
            break;
          }
        }
      }
    }

    // Convert methodology gap counts into rawGaps (only if >= 2 papers or >25% of papers)
    var threshold = Math.max(2, Math.floor(papers.length * 0.15));
    for (var mgTitle in methodGapCounts) {
      if (!methodGapCounts.hasOwnProperty(mgTitle)) continue;
      var mg = methodGapCounts[mgTitle];
      if (mg.papers.size >= threshold) {
        var mgPaperIds = [];
        mg.papers.forEach(function (id) { mgPaperIds.push(id); });
        rawGaps.push({
          title: mgTitle,
          description: "",
          category: mg.category,
          phrase: "",
          supportingPaperIds: mgPaperIds,
          keywords: extractKeywords(mgTitle),
          evidenceQuotes: mg.contexts.slice(0, 3),
          year: Math.max.apply(null, mg.years),
          contextText: mg.contexts.join(" "),
          importanceKey: mg.importanceKey
        });
      }
    }

    // ---- C. Population Gap Detection ----
    var popCounts = {};
    for (var key in POPULATION_MARKERS) {
      popCounts[key] = 0;
    }
    for (var pp = 0; pp < papers.length; pp++) {
      var pAbstract = (papers[pp].abstract || "");
      if (!pAbstract) continue;
      for (var pk in POPULATION_MARKERS) {
        if (POPULATION_MARKERS[pk].test(pAbstract)) {
          popCounts[pk]++;
        }
      }
    }

    var totalPapers = papers.length;
    // If fewer than 10% of papers mention a population, it's a gap
    var popGapLabels = {
      pediatric: "Pediatric populations understudied",
      elderly: "Geriatric populations understudied",
      female: "Female-specific outcomes understudied",
      male: "Male-specific outcomes understudied",
      racialEthnic: "Need for diverse population studies"
    };

    for (var popKey in popCounts) {
      if (!popCounts.hasOwnProperty(popKey)) continue;
      // Skip male/female unless very heavily skewed
      if ((popKey === "male" || popKey === "female") && popCounts[popKey] > totalPapers * 0.05) continue;
      if (popKey !== "male" && popKey !== "female" && popCounts[popKey] > totalPapers * 0.1) continue;

      // Need for diverse populations is always relevant if racialEthnic is low
      if (popGapLabels[popKey]) {
        rawGaps.push({
          title: popGapLabels[popKey],
          description: "",
          category: "population",
          phrase: "",
          supportingPaperIds: papers.map(function (p) { return p.id; }).slice(0, 5),
          keywords: extractKeywords(popGapLabels[popKey]),
          evidenceQuotes: ["Only " + popCounts[popKey] + " of " + totalPapers + " papers specifically addressed " + popKey + " populations."],
          year: 2024,
          contextText: popGapLabels[popKey],
          importanceKey: popKey === "racialEthnic" ? "diverse populations" : "default"
        });
      }
    }

    // ---- D. Outcome Gap Detection ----
    var outcomeCounts = {};
    for (var ok in OUTCOME_MARKERS) {
      outcomeCounts[ok] = 0;
    }
    for (var op = 0; op < papers.length; op++) {
      var oAbstract = (papers[op].abstract || "");
      if (!oAbstract) continue;
      for (var om in OUTCOME_MARKERS) {
        if (OUTCOME_MARKERS[om].test(oAbstract)) {
          outcomeCounts[om]++;
        }
      }
    }

    var outcomeGapDefs = [
      { key: "longTerm", title: "Long-term outcome data needed", importanceKey: "long-term outcomes" },
      { key: "costEffectiveness", title: "Cost-effectiveness analysis needed", importanceKey: "cost-effectiveness" },
      { key: "patientReported", title: "Patient-reported outcome measures needed", importanceKey: "patient-reported outcomes" },
      { key: "clinicalImpact", title: "Clinical impact and implementation studies needed", importanceKey: "clinical impact" }
    ];

    for (var od = 0; od < outcomeGapDefs.length; od++) {
      var oDef = outcomeGapDefs[od];
      if (outcomeCounts[oDef.key] < totalPapers * 0.15) {
        rawGaps.push({
          title: oDef.title,
          description: "",
          category: "outcome",
          phrase: "",
          supportingPaperIds: papers.map(function (p) { return p.id; }).slice(0, 5),
          keywords: extractKeywords(oDef.title),
          evidenceQuotes: ["Only " + outcomeCounts[oDef.key] + " of " + totalPapers + " papers addressed " + oDef.key.replace(/([A-Z])/g, " $1").toLowerCase().trim() + "."],
          year: 2024,
          contextText: oDef.title,
          importanceKey: oDef.importanceKey
        });
      }
    }

    // ---- E. Gap Scoring ----
    for (var rg = 0; rg < rawGaps.length; rg++) {
      rawGaps[rg].severity = scoreGap(rawGaps[rg], papers);
    }

    // ---- F. Deduplication and Merging ----
    var mergedGaps = deduplicateGaps(rawGaps);

    // Sort by severity descending and take top 5-8
    mergedGaps.sort(function (a, b) { return b.severity - a.severity; });
    var finalGaps = mergedGaps.slice(0, 8);

    // Ensure we have at least 5 gaps if possible (relax merging if needed)
    if (finalGaps.length < 5 && mergedGaps.length > finalGaps.length) {
      finalGaps = mergedGaps.slice(0, Math.min(8, mergedGaps.length));
    }

    // Assign IDs and build descriptions
    var topic = getQueryTopic(papers);
    for (var fg = 0; fg < finalGaps.length; fg++) {
      finalGaps[fg].id = "gap_" + (fg + 1);
      if (!finalGaps[fg].description) {
        finalGaps[fg].description = buildGapDescription(finalGaps[fg], topic);
      }
      // Clean up internal-only fields
      delete finalGaps[fg].phrase;
      delete finalGaps[fg].year;
      delete finalGaps[fg].contextText;
      delete finalGaps[fg].importanceKey;
    }

    console.log("AnalysisEngine: found " + finalGaps.length + " gaps");
    return finalGaps;
  }

  /** Score a raw gap signal (1-10). */
  function scoreGap(gap, papers) {
    var totalPapers = papers.length || 1;

    // frequency_score: how many papers support this gap (normalized 1-10)
    var freq = (gap.supportingPaperIds || []).length;
    var frequencyScore = Math.min(10, Math.max(1, Math.round((freq / totalPapers) * 10)));

    // recency_score: are recent papers still mentioning it?
    var currentYear = new Date().getFullYear();
    var gapYear = gap.year || 2020;
    var yearsAgo = currentYear - gapYear;
    var recencyScore = Math.min(10, Math.max(1, 10 - yearsAgo));

    // importance_score: based on gap type
    var impKey = gap.importanceKey || "default";
    var importanceScore = GAP_IMPORTANCE[impKey] || GAP_IMPORTANCE["default"];

    // breadth_score: does the gap span multiple subtopics?
    var breadthScore = Math.min(10, Math.max(1, (gap.keywords || []).length));

    var severity = (frequencyScore * 0.3) + (recencyScore * 0.2) + (importanceScore * 0.3) + (breadthScore * 0.2);
    return Math.min(10, Math.max(1, Math.round(severity)));
  }

  /** Deduplicate and merge similar gaps. */
  function deduplicateGaps(gaps) {
    if (!gaps.length) return [];

    var merged = [];
    var consumed = new Set();

    for (var i = 0; i < gaps.length; i++) {
      if (consumed.has(i)) continue;

      var current = shallowCopy(gaps[i]);
      var currentPaperSet = new Set(current.supportingPaperIds);
      var currentKeywordSet = new Set(current.keywords);

      for (var j = i + 1; j < gaps.length; j++) {
        if (consumed.has(j)) continue;

        var other = gaps[j];

        // Calculate overlap: keywords + supporting papers
        var kOverlap = keywordOverlap(current.keywords, other.keywords);
        var pOverlap = paperOverlap(current.supportingPaperIds, other.supportingPaperIds);

        // Also check if titles are very similar
        var titleSim = keywordOverlap(
          extractKeywords(current.title),
          extractKeywords(other.title)
        );

        if (kOverlap > 0.5 || pOverlap > 0.5 || titleSim > 0.6) {
          // Merge: keep the more specific title (shorter is usually more specific)
          if (other.title.length < current.title.length && other.title.length > 10) {
            current.title = other.title;
          }
          // Combine evidence quotes (deduplicated)
          var quoteSet = new Set(current.evidenceQuotes);
          for (var q = 0; q < (other.evidenceQuotes || []).length; q++) {
            quoteSet.add(other.evidenceQuotes[q]);
          }
          current.evidenceQuotes = Array.from(quoteSet).slice(0, 5);

          // Combine supporting papers
          for (var sp = 0; sp < other.supportingPaperIds.length; sp++) {
            currentPaperSet.add(other.supportingPaperIds[sp]);
          }
          current.supportingPaperIds = Array.from(currentPaperSet);

          // Combine keywords
          for (var kk = 0; kk < (other.keywords || []).length; kk++) {
            currentKeywordSet.add(other.keywords[kk]);
          }
          current.keywords = Array.from(currentKeywordSet).slice(0, 15);

          // Take higher severity
          if ((other.severity || 0) > (current.severity || 0)) {
            current.severity = other.severity;
          }

          consumed.add(j);
        }
      }

      merged.push(current);
    }

    return merged;
  }

  /** Calculate paper ID overlap between two arrays. */
  function paperOverlap(a, b) {
    if (!a || !b || !a.length || !b.length) return 0;
    var setA = new Set(a);
    var intersection = 0;
    for (var i = 0; i < b.length; i++) {
      if (setA.has(b[i])) intersection++;
    }
    var union = new Set(a.concat(b)).size;
    return union > 0 ? intersection / union : 0;
  }

  /** Shallow copy an object. */
  function shallowCopy(obj) {
    var copy = {};
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (Array.isArray(obj[key])) {
          copy[key] = obj[key].slice();
        } else {
          copy[key] = obj[key];
        }
      }
    }
    return copy;
  }

  /** Build a descriptive title from a gap phrase and its context. */
  function buildGapTitleFromPhrase(phrase, contextText) {
    // Map common phrases to cleaner titles
    var phraseMap = {
      "further research is needed": "Further research needed",
      "further studies are needed": "Further studies needed",
      "future research should": "Future research directions identified",
      "future studies should": "Future studies recommended",
      "remains unclear": "Unclear mechanisms or outcomes",
      "remains unknown": "Unknown factors requiring investigation",
      "not well understood": "Poorly understood mechanisms",
      "poorly understood": "Poorly understood mechanisms",
      "limited evidence": "Limited evidence base",
      "limited data": "Limited available data",
      "lack of": "Lack of sufficient evidence",
      "no studies have": "Absence of relevant studies",
      "few studies": "Few existing studies",
      "insufficient evidence": "Insufficient evidence",
      "gap in the literature": "Identified literature gap",
      "understudied": "Understudied area",
      "underexplored": "Underexplored research area",
      "warrants further investigation": "Area warranting investigation",
      "more research is needed": "More research needed",
      "has not been established": "Unestablished evidence",
      "has yet to be determined": "Undetermined factors",
      "requires further validation": "Validation studies needed",
      "external validation": "External validation needed",
      "prospective validation": "Prospective validation needed",
      "long-term outcomes": "Long-term outcome data lacking",
      "long-term follow-up": "Long-term follow-up data needed",
      "real-world data": "Real-world evidence needed",
      "clinical implementation": "Clinical implementation studies needed",
      "clinical deployment": "Clinical deployment data needed",
      "generalizability": "Generalizability concerns",
      "diverse populations": "Need for diverse population studies",
      "underrepresented": "Underrepresented groups in research",
      "standardized reporting": "Standardized reporting needed",
      "heterogeneity": "Heterogeneity across studies",
      "risk of bias": "Risk of bias concerns"
    };

    var title = phraseMap[phrase] || "Research gap identified";

    // Try to make it more specific using context keywords
    var contextKw = extractKeywords(contextText);
    var specificTerms = [];
    for (var i = 0; i < contextKw.length && specificTerms.length < 2; i++) {
      var w = contextKw[i];
      // Only include domain-specific terms (longer than 4 chars and not too generic)
      if (w.length > 4 && !STOPWORDS.has(w) && title.toLowerCase().indexOf(w) === -1) {
        specificTerms.push(w);
      }
    }

    if (specificTerms.length > 0) {
      title = title + " (" + specificTerms.join(", ") + ")";
    }

    return title;
  }

  /** Build a 2-3 sentence gap description. */
  function buildGapDescription(gap, topic) {
    var parts = [];

    // Opening sentence
    switch (gap.category) {
      case "methodology":
        parts.push("Current research on " + topic + " exhibits methodological limitations related to " + gap.title.toLowerCase() + ".");
        break;
      case "population":
        parts.push("The existing literature on " + topic + " has insufficient representation of certain patient populations.");
        break;
      case "outcome":
        parts.push("Studies on " + topic + " have not adequately assessed certain important outcomes.");
        break;
      case "comparison":
        parts.push("Head-to-head comparisons between interventions in " + topic + " research remain limited.");
        break;
      case "setting":
        parts.push("The applicability of " + topic + " findings across clinical settings has not been established.");
        break;
      default:
        parts.push("A research gap has been identified in the " + topic + " literature.");
    }

    // Supporting evidence sentence
    var nPapers = (gap.supportingPaperIds || []).length;
    if (nPapers > 1) {
      parts.push("This gap is supported by evidence from " + nPapers + " papers in the analyzed corpus.");
    } else if (nPapers === 1) {
      parts.push("This gap was identified from analysis of the reviewed literature.");
    }

    // Severity context
    if (gap.severity >= 8) {
      parts.push("This represents a critical gap that significantly limits the field's ability to draw reliable conclusions.");
    } else if (gap.severity >= 5) {
      parts.push("Addressing this gap would meaningfully advance the evidence base for clinical decision-making.");
    } else {
      parts.push("While not the most pressing gap, filling it would contribute to a more complete understanding of the topic.");
    }

    return parts.join(" ");
  }

  // -----------------------------------------------------------------------
  // IDEA GENERATION  (Step 3)
  // -----------------------------------------------------------------------

  function generateIdeas(gaps, papers) {
    if (!gaps || !gaps.length) return [];

    var topic = getQueryTopic(papers || []);
    var topicKey = matchTopicKey(topic);
    var ideas = [];
    var ideaCounter = 0;

    for (var g = 0; g < gaps.length; g++) {
      var gap = gaps[g];
      var gapIdeas = generateIdeasForGap(gap, topic, topicKey, papers || []);

      for (var i = 0; i < gapIdeas.length; i++) {
        ideaCounter++;
        var idea = gapIdeas[i];
        idea.id = "idea_" + ideaCounter;
        idea.gapId = gap.id;

        // Score feasibility
        idea.feasibility = scoreFeasibility(idea, gap, papers);

        ideas.push(idea);
      }
    }

    // Deduplicate ideas with identical or very similar titles
    var seenTitles = {};
    var uniqueIdeas = [];
    for (var d = 0; d < ideas.length; d++) {
      var normalizedTitle = ideas[d].title.toLowerCase().trim();
      if (!seenTitles[normalizedTitle]) {
        seenTitles[normalizedTitle] = true;
        uniqueIdeas.push(ideas[d]);
      }
    }
    ideas = uniqueIdeas;

    // Cap at 12, prioritizing diversity across gaps
    if (ideas.length > 12) {
      ideas = diversifyIdeas(ideas, 12);
    }

    console.log("AnalysisEngine: generated " + ideas.length + " ideas");
    return ideas;
  }

  /** Generate 1-2 ideas for a specific gap. */
  function generateIdeasForGap(gap, topic, topicKey, papers) {
    var ideas = [];

    switch (gap.category) {
      case "methodology":
        ideas = ideas.concat(methodologyIdeas(gap, topic, topicKey));
        break;
      case "population":
        ideas = ideas.concat(populationIdeas(gap, topic, topicKey));
        break;
      case "outcome":
        ideas = ideas.concat(outcomeIdeas(gap, topic, topicKey));
        break;
      case "comparison":
        ideas = ideas.concat(comparisonIdeas(gap, topic, topicKey));
        break;
      case "setting":
        ideas = ideas.concat(settingIdeas(gap, topic, topicKey));
        break;
      default:
        ideas = ideas.concat(genericIdeas(gap, topic, topicKey));
    }

    // Always generate at least 1 idea
    if (ideas.length === 0) {
      ideas.push(genericIdeas(gap, topic, topicKey)[0]);
    }

    return ideas.slice(0, 2);
  }

  function methodologyIdeas(gap, topic, topicKey) {
    var ideas = [];
    var titleLower = gap.title.toLowerCase();
    var dbs = DATABASE_SUGGESTIONS[topicKey] || DATABASE_SUGGESTIONS["general"];
    var journals = JOURNAL_SUGGESTIONS[topicKey] || JOURNAL_SUGGESTIONS["general"];

    if (titleLower.indexOf("prospective") !== -1) {
      ideas.push({
        id: "", gapId: "",
        title: "Prospective " + topic + " cohort study",
        description: "Design and execute a prospective cohort study to address the current reliance on retrospective data in " + topic + " research. " +
          "This study would follow patients from the point of intervention, collecting standardized outcome measures at predefined intervals. " +
          "By establishing a prospective design, the study would minimize selection bias and improve the quality of evidence. " +
          "Primary endpoints should be determined based on clinical relevance and existing gaps in outcome reporting.",
        studyDesign: STUDY_DESIGNS.prospective,
        suggestedDatabases: ["Prospective institutional registry", dbs[0] || "institutional EHR data"],
        estimatedSampleSize: "200-500 patients",
        potentialJournals: journals
      });
    }

    if (titleLower.indexOf("multi-center") !== -1 || titleLower.indexOf("external validation") !== -1) {
      ideas.push({
        id: "", gapId: "",
        title: "Multi-center external validation study of " + topic + " findings",
        description: "Conduct a multi-center validation study to test the generalizability of existing single-center findings in " + topic + ". " +
          "Partner with 3-5 institutions across different geographic regions to obtain diverse patient populations. " +
          "Apply the same methodology and outcome measures used in published single-center studies to assess reproducibility. " +
          "This study would address the critical gap of external validation that limits clinical translation of current evidence.",
        studyDesign: STUDY_DESIGNS.retrospective,
        suggestedDatabases: dbs.concat(["multi-institutional collaboration"]),
        estimatedSampleSize: "1,000-5,000 patients",
        potentialJournals: journals
      });
    }

    if (titleLower.indexOf("larger") !== -1 || titleLower.indexOf("cohort") !== -1) {
      ideas.push({
        id: "", gapId: "",
        title: "Large-scale " + topic + " database analysis",
        description: "Leverage a large national database to address the limited sample sizes in existing " + topic + " studies. " +
          "A retrospective analysis of a nationally representative dataset would provide the statistical power needed for subgroup analyses and robust multivariable modeling. " +
          "This approach enables detection of smaller effect sizes and rare outcomes that single-center studies cannot capture. " +
          "Results would complement existing smaller studies and help establish more definitive evidence.",
        studyDesign: STUDY_DESIGNS.retrospective,
        suggestedDatabases: dbs,
        estimatedSampleSize: "5,000-50,000 patients",
        potentialJournals: journals
      });
    }

    if (titleLower.indexOf("standardized") !== -1 || titleLower.indexOf("heterogeneity") !== -1) {
      ideas.push({
        id: "", gapId: "",
        title: "Systematic review and meta-analysis of " + topic,
        description: "Perform a systematic review with meta-analysis to synthesize the heterogeneous evidence base in " + topic + ". " +
          "Apply PRISMA guidelines to systematically search, screen, and extract data from all relevant studies. " +
          "Quantify heterogeneity using I-squared statistics and explore sources through subgroup and sensitivity analyses. " +
          "This work would provide the most comprehensive evidence summary available and identify specific areas where standardization is most needed.",
        studyDesign: STUDY_DESIGNS.systematicReview,
        suggestedDatabases: ["PubMed", "Embase", "Cochrane Library", "Web of Science"],
        estimatedSampleSize: "30-100 studies",
        potentialJournals: journals
      });
    }

    // Ensure at least 1 idea
    if (ideas.length === 0) {
      ideas.push({
        id: "", gapId: "",
        title: "Methodological improvement study for " + topic,
        description: "Address the identified methodological limitations in current " + topic + " research through a rigorously designed study. " +
          "This project would implement best-practice study design elements that are currently lacking in the literature. " +
          "The goal is to produce higher-quality evidence that can more reliably inform clinical practice.",
        studyDesign: STUDY_DESIGNS.prospective,
        suggestedDatabases: dbs,
        estimatedSampleSize: "200-500 patients",
        potentialJournals: journals
      });
    }

    return ideas;
  }

  function populationIdeas(gap, topic, topicKey) {
    var ideas = [];
    var titleLower = gap.title.toLowerCase();
    var dbs = DATABASE_SUGGESTIONS[topicKey] || DATABASE_SUGGESTIONS["general"];
    var journals = JOURNAL_SUGGESTIONS[topicKey] || JOURNAL_SUGGESTIONS["general"];

    if (titleLower.indexOf("pediatric") !== -1) {
      ideas.push({
        id: "", gapId: "",
        title: "Pediatric " + topic + " outcomes analysis",
        description: "Investigate " + topic + " outcomes specifically in the pediatric population, which remains critically understudied. " +
          "Pediatric patients have unique physiological characteristics that may lead to different treatment responses and complication profiles. " +
          "This study would establish pediatric-specific benchmarks and identify any age-dependent factors that influence outcomes. " +
          "Results could inform the development of pediatric-specific clinical guidelines.",
        studyDesign: STUDY_DESIGNS.retrospective,
        suggestedDatabases: ["PHIS", "Kids' Inpatient Database (KID)"].concat(dbs.slice(0, 1)),
        estimatedSampleSize: "500-2,000 patients",
        potentialJournals: (topicKey === "general") ? ["Journal of Pediatric Surgery", "Pediatrics"] : journals
      });
    }

    if (titleLower.indexOf("geriatric") !== -1 || titleLower.indexOf("elderly") !== -1) {
      ideas.push({
        id: "", gapId: "",
        title: "Geriatric-specific " + topic + " outcomes study",
        description: "Evaluate " + topic + " outcomes in elderly patients (age >= 65), accounting for frailty, comorbidity burden, and polypharmacy. " +
          "Older adults are often underrepresented in clinical studies despite being the fastest-growing demographic requiring these interventions. " +
          "This study would assess the interaction between geriatric-specific risk factors and treatment outcomes. " +
          "Findings would support age-appropriate treatment algorithms and shared decision-making tools.",
        studyDesign: STUDY_DESIGNS.retrospective,
        suggestedDatabases: dbs.concat(["Medicare Claims data"]),
        estimatedSampleSize: "1,000-5,000 patients",
        potentialJournals: journals
      });
    }

    if (titleLower.indexOf("diverse") !== -1 || titleLower.indexOf("underrepresented") !== -1) {
      ideas.push({
        id: "", gapId: "",
        title: "Racial and ethnic disparities in " + topic + " outcomes",
        description: "Examine how race, ethnicity, and socioeconomic status influence " + topic + " outcomes across diverse patient populations. " +
          "Current literature lacks adequate representation of minority groups, limiting the generalizability of findings. " +
          "Using a large, nationally representative database, this study would stratify outcomes by demographic factors and identify disparities. " +
          "Results would inform equity-focused interventions and policy recommendations.",
        studyDesign: STUDY_DESIGNS.retrospective,
        suggestedDatabases: dbs.concat(["NIS", "state-level all-payer claims"]),
        estimatedSampleSize: "10,000-50,000 patients",
        potentialJournals: journals.concat(["Health Affairs", "Medical Care"])
      });
    }

    if (ideas.length === 0) {
      ideas.push({
        id: "", gapId: "",
        title: "Population-specific " + topic + " outcomes analysis",
        description: "Address the underrepresentation of specific patient populations in the current " + topic + " literature. " +
          "By studying outcomes in an under-investigated demographic group, this project would expand the evidence base and improve equity. " +
          "A large database study would enable subgroup analyses that single-center studies cannot support.",
        studyDesign: STUDY_DESIGNS.retrospective,
        suggestedDatabases: dbs,
        estimatedSampleSize: "1,000-5,000 patients",
        potentialJournals: journals
      });
    }

    return ideas;
  }

  function outcomeIdeas(gap, topic, topicKey) {
    var ideas = [];
    var titleLower = gap.title.toLowerCase();
    var dbs = DATABASE_SUGGESTIONS[topicKey] || DATABASE_SUGGESTIONS["general"];
    var journals = JOURNAL_SUGGESTIONS[topicKey] || JOURNAL_SUGGESTIONS["general"];

    if (titleLower.indexOf("long-term") !== -1) {
      ideas.push({
        id: "", gapId: "",
        title: "5-year outcomes study of " + topic,
        description: "Establish long-term outcome data for " + topic + " by following patients for a minimum of 5 years post-intervention. " +
          "Current evidence is limited to short-term outcomes, which may not capture delayed complications, functional recovery trajectories, or durability of treatment effects. " +
          "This study would track survival, functional status, reintervention rates, and patient-reported outcomes at standardized intervals. " +
          "Long-term data are essential for informed patient counseling and accurate cost projections.",
        studyDesign: STUDY_DESIGNS.prospective,
        suggestedDatabases: ["Prospective institutional registry"].concat(dbs.slice(0, 2)),
        estimatedSampleSize: "300-1,000 patients",
        potentialJournals: journals
      });
    }

    if (titleLower.indexOf("cost") !== -1) {
      ideas.push({
        id: "", gapId: "",
        title: "Cost-effectiveness analysis of " + topic,
        description: "Conduct a comprehensive cost-effectiveness analysis comparing interventions in " + topic + " using decision-analytic modeling. " +
          "Build a Markov model incorporating clinical outcomes, resource utilization, quality-adjusted life years (QALYs), and direct medical costs. " +
          "Populate model parameters from the best available literature and validate with sensitivity analyses. " +
          "This economic evaluation would inform value-based care decisions and resource allocation for healthcare systems.",
        studyDesign: STUDY_DESIGNS.retrospective,
        suggestedDatabases: ["Medicare Claims data", "MarketScan", "institutional cost data"],
        estimatedSampleSize: "Modeled cohort (10,000 simulations)",
        potentialJournals: journals.concat(["Value in Health", "Medical Decision Making"])
      });
    }

    if (titleLower.indexOf("patient-reported") !== -1) {
      ideas.push({
        id: "", gapId: "",
        title: "Patient-reported outcome measures for " + topic,
        description: "Integrate validated patient-reported outcome measures (PROMs) into the assessment of " + topic + " interventions. " +
          "Current studies rely primarily on clinician-assessed endpoints that may not capture the patient's lived experience. " +
          "This prospective study would administer validated instruments (e.g., PROMIS, EQ-5D, or disease-specific PROMs) at baseline and scheduled follow-up intervals. " +
          "Understanding the patient perspective is essential for shared decision-making and truly patient-centered care.",
        studyDesign: STUDY_DESIGNS.prospective,
        suggestedDatabases: ["Prospective institutional registry", "REDCap survey platform"],
        estimatedSampleSize: "150-400 patients",
        potentialJournals: journals.concat(["Quality of Life Research"])
      });
    }

    if (titleLower.indexOf("clinical impact") !== -1 || titleLower.indexOf("implementation") !== -1) {
      ideas.push({
        id: "", gapId: "",
        title: "Clinical implementation and impact assessment of " + topic,
        description: "Evaluate the real-world clinical impact of integrating " + topic + " findings into routine practice through an implementation science framework. " +
          "This study would measure adoption rates, workflow integration, clinician decision changes, and downstream patient outcomes. " +
          "Using a pre-post or stepped-wedge design, the project would quantify whether translating research into practice yields measurable benefits. " +
          "Results would bridge the gap between evidence generation and evidence implementation.",
        studyDesign: STUDY_DESIGNS.mixedMethods,
        suggestedDatabases: ["Institutional EHR data", "clinician survey data"],
        estimatedSampleSize: "100-300 cases (pre/post)",
        potentialJournals: journals.concat(["Implementation Science"])
      });
    }

    if (ideas.length === 0) {
      ideas.push({
        id: "", gapId: "",
        title: "Comprehensive outcome assessment for " + topic,
        description: "Expand the scope of outcome measurement in " + topic + " research to address the identified gaps. " +
          "This study would incorporate outcomes that are currently underreported, providing a more holistic view of treatment effectiveness. " +
          "A multi-dimensional outcome framework would better inform clinical decision-making.",
        studyDesign: STUDY_DESIGNS.prospective,
        suggestedDatabases: dbs,
        estimatedSampleSize: "200-500 patients",
        potentialJournals: journals
      });
    }

    return ideas;
  }

  function comparisonIdeas(gap, topic, topicKey) {
    var dbs = DATABASE_SUGGESTIONS[topicKey] || DATABASE_SUGGESTIONS["general"];
    var journals = JOURNAL_SUGGESTIONS[topicKey] || JOURNAL_SUGGESTIONS["general"];

    return [{
      id: "", gapId: "",
      title: "Comparative effectiveness study of " + topic + " interventions",
      description: "Conduct a head-to-head comparison of competing approaches in " + topic + " to address the lack of comparative evidence. " +
        "Using either a matched cohort or propensity-score design, this study would directly compare outcomes between different treatment strategies. " +
        "The analysis would include standardized outcome measures, subgroup analyses, and adjustment for known confounders. " +
        "Comparative effectiveness data are essential for developing evidence-based treatment algorithms.",
      studyDesign: STUDY_DESIGNS.retrospective,
      suggestedDatabases: dbs,
      estimatedSampleSize: "500-2,000 patients per arm",
      potentialJournals: journals
    }];
  }

  function settingIdeas(gap, topic, topicKey) {
    var dbs = DATABASE_SUGGESTIONS[topicKey] || DATABASE_SUGGESTIONS["general"];
    var journals = JOURNAL_SUGGESTIONS[topicKey] || JOURNAL_SUGGESTIONS["general"];

    return [{
      id: "", gapId: "",
      title: "Multi-setting transferability study of " + topic,
      description: "Assess the transferability and generalizability of " + topic + " findings across different clinical settings. " +
        "Compare outcomes between academic medical centers, community hospitals, and ambulatory settings to determine where evidence is most applicable. " +
        "This study would identify setting-specific factors that influence outcomes and help tailor implementation strategies accordingly. " +
        "Understanding setting-dependent variation is critical for broad clinical adoption.",
      studyDesign: STUDY_DESIGNS.retrospective,
      suggestedDatabases: dbs.concat(["NIS", "multi-site collaboration"]),
      estimatedSampleSize: "2,000-10,000 patients",
      potentialJournals: journals
    }];
  }

  function genericIdeas(gap, topic, topicKey) {
    var dbs = DATABASE_SUGGESTIONS[topicKey] || DATABASE_SUGGESTIONS["general"];
    var journals = JOURNAL_SUGGESTIONS[topicKey] || JOURNAL_SUGGESTIONS["general"];

    return [{
      id: "", gapId: "",
      title: "Targeted investigation of " + gap.title.split("(")[0].trim().toLowerCase() + " in " + topic,
      description: "Address the identified gap of '" + gap.title + "' through a focused research study. " +
        "This project would be designed to specifically target the limitation identified in the current literature. " +
        "The study design and methodology would be tailored to produce actionable evidence that fills this specific gap.",
      studyDesign: STUDY_DESIGNS.retrospective,
      suggestedDatabases: dbs,
      estimatedSampleSize: "500-2,000 patients",
      potentialJournals: journals
    }];
  }

  /** Select ideas that maximize coverage across different gaps. */
  function diversifyIdeas(ideas, maxCount) {
    var byGap = {};
    for (var i = 0; i < ideas.length; i++) {
      var gid = ideas[i].gapId;
      if (!byGap[gid]) byGap[gid] = [];
      byGap[gid].push(ideas[i]);
    }

    var result = [];
    var gapIds = Object.keys(byGap);

    // First pass: 1 idea per gap
    for (var g = 0; g < gapIds.length && result.length < maxCount; g++) {
      if (byGap[gapIds[g]].length > 0) {
        result.push(byGap[gapIds[g]].shift());
      }
    }

    // Second pass: remaining ideas by feasibility score
    var remaining = [];
    for (var gk in byGap) {
      if (byGap.hasOwnProperty(gk)) {
        remaining = remaining.concat(byGap[gk]);
      }
    }
    remaining.sort(function (a, b) {
      return (b.feasibility ? b.feasibility.overall : 0) - (a.feasibility ? a.feasibility.overall : 0);
    });
    for (var r = 0; r < remaining.length && result.length < maxCount; r++) {
      result.push(remaining[r]);
    }

    return result;
  }

  // -----------------------------------------------------------------------
  // FEASIBILITY SCORING  (Step 4)
  // -----------------------------------------------------------------------

  function scoreFeasibility(idea, gap, papers) {
    var design = (idea.studyDesign || "").toLowerCase();
    var titleLower = (idea.title || "").toLowerCase();
    var descLower = (idea.description || "").toLowerCase();
    var combinedText = titleLower + " " + descLower;

    // ---- dataAvailability ----
    var dataAvailability;
    if (design.indexOf("systematic review") !== -1 || design.indexOf("meta-analysis") !== -1) {
      dataAvailability = randomInRange(85, 95);
    } else if (design.indexOf("retrospective") !== -1) {
      // Check if public databases are suggested
      var hasPublicDb = false;
      var publicDbs = ["nsqip", "nis", "seer", "ncdb", "ntdb", "medicare", "mimic", "tcia", "marketscan"];
      var sugDbs = (idea.suggestedDatabases || []).join(" ").toLowerCase();
      for (var d = 0; d < publicDbs.length; d++) {
        if (sugDbs.indexOf(publicDbs[d]) !== -1) { hasPublicDb = true; break; }
      }
      dataAvailability = hasPublicDb ? randomInRange(80, 95) : randomInRange(60, 80);
    } else if (design.indexOf("cross-sectional") !== -1) {
      dataAvailability = randomInRange(60, 80);
    } else if (design.indexOf("prospective") !== -1) {
      dataAvailability = randomInRange(30, 50);
    } else if (design.indexOf("rct") !== -1) {
      dataAvailability = randomInRange(20, 40);
    } else if (design.indexOf("mixed") !== -1) {
      dataAvailability = randomInRange(40, 60);
    } else {
      dataAvailability = randomInRange(50, 70);
    }
    dataAvailability = clamp(dataAvailability);

    // ---- costEstimate ----
    var costEstimate;
    if (design.indexOf("systematic review") !== -1 || design.indexOf("meta-analysis") !== -1) {
      costEstimate = "low";
    } else if (design.indexOf("retrospective") !== -1 || design.indexOf("cross-sectional") !== -1) {
      costEstimate = "low";
    } else if (design.indexOf("prospective") !== -1 || design.indexOf("mixed") !== -1) {
      costEstimate = "medium";
    } else if (design.indexOf("rct") !== -1) {
      costEstimate = "high";
    } else {
      costEstimate = "medium";
    }

    // ---- timelineMonths ----
    var timelineMonths;
    if (design.indexOf("systematic review") !== -1 || design.indexOf("meta-analysis") !== -1) {
      timelineMonths = randomInRange(4, 8);
    } else if (design.indexOf("retrospective") !== -1) {
      timelineMonths = randomInRange(6, 12);
    } else if (design.indexOf("cross-sectional") !== -1) {
      timelineMonths = randomInRange(4, 10);
    } else if (design.indexOf("prospective") !== -1) {
      timelineMonths = randomInRange(18, 36);
    } else if (design.indexOf("rct") !== -1) {
      timelineMonths = randomInRange(24, 48);
    } else if (design.indexOf("mixed") !== -1) {
      timelineMonths = randomInRange(12, 24);
    } else {
      timelineMonths = randomInRange(6, 18);
    }

    // ---- technicalComplexity ----
    var technicalComplexity;
    if (combinedText.indexOf("deep learning") !== -1 || combinedText.indexOf("neural network") !== -1) {
      technicalComplexity = randomInRange(60, 80);
    } else if (combinedText.indexOf("machine learning") !== -1 || combinedText.indexOf("algorithm") !== -1 || combinedText.indexOf("model") !== -1) {
      technicalComplexity = randomInRange(50, 70);
    } else if (combinedText.indexOf("multi-modal") !== -1 || combinedText.indexOf("multimodal") !== -1) {
      technicalComplexity = randomInRange(70, 90);
    } else if (combinedText.indexOf("markov") !== -1 || combinedText.indexOf("cost-effectiveness") !== -1) {
      technicalComplexity = randomInRange(45, 65);
    } else if (design.indexOf("systematic review") !== -1 || design.indexOf("meta-analysis") !== -1) {
      technicalComplexity = randomInRange(30, 50);
    } else if (combinedText.indexOf("propensity") !== -1 || combinedText.indexOf("multivariable") !== -1) {
      technicalComplexity = randomInRange(35, 55);
    } else {
      technicalComplexity = randomInRange(20, 40);
    }
    technicalComplexity = clamp(technicalComplexity);

    // ---- novelty ----
    // Inverse of how many papers address similar topics
    var paperCount = (papers || []).length || 1;
    var gapPaperCount = gap ? (gap.supportingPaperIds || []).length : 0;
    // Fewer papers addressing this specific gap = higher novelty
    var coverageRatio = gapPaperCount / paperCount;
    var novelty = clamp(Math.round(80 - (coverageRatio * 60) + randomInRange(-5, 5)));

    // ---- clinicalImpact ----
    // Based on gap severity
    var gapSeverity = gap ? (gap.severity || 5) : 5;
    var clinicalImpact = clamp(Math.round((gapSeverity / 10) * 80 + randomInRange(5, 15)));

    // ---- overall ----
    var timelineScore = clamp(Math.round(100 - (timelineMonths / 48) * 100));
    var complexityScore = clamp(100 - technicalComplexity);

    var overall = Math.round(
      (dataAvailability * 0.25) +
      (complexityScore * 0.15) +
      (novelty * 0.25) +
      (clinicalImpact * 0.25) +
      (timelineScore * 0.10)
    );
    overall = clamp(overall);

    return {
      overall: overall,
      dataAvailability: dataAvailability,
      costEstimate: costEstimate,
      timelineMonths: timelineMonths,
      technicalComplexity: technicalComplexity,
      novelty: novelty,
      clinicalImpact: clinicalImpact
    };
  }

  /** Return a random integer in [min, max]. */
  function randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // -----------------------------------------------------------------------
  // LANDSCAPE BUILDING  (Step 5)
  // -----------------------------------------------------------------------

  function buildLandscape(papers, gaps) {
    if (!papers || !papers.length) {
      return { clusters: [], connections: [], gapZones: [] };
    }

    // 1. Extract keywords from all papers
    var paperKeywordMap = {}; // paperId -> keyword[]
    var allKeywords = [];

    for (var p = 0; p < papers.length; p++) {
      var paper = papers[p];
      var kws = (paper.keywords || []).map(function (k) { return k.toLowerCase(); });
      // Also extract from title
      var titleKws = extractKeywords(paper.title || "");
      kws = kws.concat(titleKws);
      // Deduplicate
      kws = Array.from(new Set(kws));
      paperKeywordMap[paper.id] = kws;
      allKeywords = allKeywords.concat(kws);
    }

    var kwFreq = freqMap(allKeywords);
    var topKeywords = topN(kwFreq, 20);

    // 2. Group keywords that co-occur into clusters
    var clusters = buildClusters(topKeywords, paperKeywordMap, papers);

    // 3. Assign papers to clusters
    for (var c = 0; c < clusters.length; c++) {
      clusters[c].paperIds = [];
    }

    for (var pp = 0; pp < papers.length; pp++) {
      var pid = papers[pp].id;
      var pKws = paperKeywordMap[pid] || [];
      var bestCluster = -1;
      var bestOverlap = 0;

      for (var ci = 0; ci < clusters.length; ci++) {
        var overlap = keywordOverlap(pKws, clusters[ci].keywords);
        if (overlap > bestOverlap) {
          bestOverlap = overlap;
          bestCluster = ci;
        }
      }

      if (bestCluster >= 0) {
        clusters[bestCluster].paperIds.push(pid);
      }

      // Also assign to secondary clusters with significant overlap
      for (var ci2 = 0; ci2 < clusters.length; ci2++) {
        if (ci2 === bestCluster) continue;
        var ov = keywordOverlap(pKws, clusters[ci2].keywords);
        if (ov > 0.2) {
          clusters[ci2].paperIds.push(pid);
        }
      }
    }

    // Set cluster sizes
    for (var cs = 0; cs < clusters.length; cs++) {
      clusters[cs].size = clusters[cs].paperIds.length;
    }

    // Remove clusters with 0 papers
    clusters = clusters.filter(function (cl) { return cl.size > 0; });

    // Re-id clusters
    for (var ri = 0; ri < clusters.length; ri++) {
      clusters[ri].id = "cluster_" + (ri + 1);
    }

    // 4. Position clusters in 2D space using a simple spring layout
    positionClusters(clusters);

    // 5. Calculate connections
    var connections = [];
    for (var ca = 0; ca < clusters.length; ca++) {
      for (var cb = ca + 1; cb < clusters.length; cb++) {
        var strength = keywordOverlap(clusters[ca].keywords, clusters[cb].keywords);
        if (strength > 0.1) {
          connections.push({
            from: clusters[ca].id,
            to: clusters[cb].id,
            strength: Math.round(strength * 100) / 100
          });
        }
      }
    }

    // 6. Position gap zones
    var gapZones = [];
    for (var gz = 0; gz < (gaps || []).length; gz++) {
      var gap = gaps[gz];
      var gapKws = gap.keywords || [];
      var zone = positionGapZone(gap, gapKws, clusters);
      gapZones.push(zone);
    }

    var landscapeData = {
      clusters: clusters,
      connections: connections,
      gapZones: gapZones
    };

    console.log("AnalysisEngine: built landscape with " + clusters.length + " clusters");
    return landscapeData;
  }

  /** Build keyword clusters using co-occurrence grouping. */
  function buildClusters(topKeywords, paperKeywordMap, papers) {
    if (!topKeywords.length) return [];

    // Build co-occurrence matrix
    var kwList = topKeywords.map(function (k) { return k.term; });
    var cooccurrence = {};
    for (var i = 0; i < kwList.length; i++) {
      cooccurrence[kwList[i]] = {};
      for (var j = 0; j < kwList.length; j++) {
        cooccurrence[kwList[i]][kwList[j]] = 0;
      }
    }

    // Count co-occurrences across papers
    var paperIds = Object.keys(paperKeywordMap);
    for (var p = 0; p < paperIds.length; p++) {
      var pKws = paperKeywordMap[paperIds[p]];
      var kwSet = new Set(pKws);
      for (var a = 0; a < kwList.length; a++) {
        if (!kwSet.has(kwList[a])) continue;
        for (var b = a + 1; b < kwList.length; b++) {
          if (kwSet.has(kwList[b])) {
            cooccurrence[kwList[a]][kwList[b]]++;
            cooccurrence[kwList[b]][kwList[a]]++;
          }
        }
      }
    }

    // Greedy clustering: assign each keyword to the cluster of its highest co-occurring keyword
    var assigned = {};
    var clusterList = [];
    var targetClusters = Math.min(7, Math.max(4, Math.floor(kwList.length / 3)));

    // Seed clusters with the most frequent keywords that don't co-occur heavily
    var seeds = [];
    for (var si = 0; si < kwList.length && seeds.length < targetClusters; si++) {
      var kw = kwList[si];
      var tooClose = false;
      for (var sj = 0; sj < seeds.length; sj++) {
        if (cooccurrence[kw][seeds[sj]] > papers.length * 0.3) {
          tooClose = true;
          break;
        }
      }
      if (!tooClose) {
        seeds.push(kw);
      }
    }

    // Fallback: just take top N if we couldn't find diverse enough seeds
    if (seeds.length < 3) {
      seeds = kwList.slice(0, targetClusters);
    }

    // Initialize clusters from seeds
    for (var ci = 0; ci < seeds.length; ci++) {
      clusterList.push({
        id: "cluster_" + (ci + 1),
        label: seeds[ci].charAt(0).toUpperCase() + seeds[ci].slice(1),
        keywords: [seeds[ci]],
        paperIds: [],
        x: 0,
        y: 0,
        size: 0
      });
      assigned[seeds[ci]] = ci;
    }

    // Assign remaining keywords to closest cluster
    for (var ki = 0; ki < kwList.length; ki++) {
      var kw2 = kwList[ki];
      if (assigned.hasOwnProperty(kw2)) continue;

      var bestCluster = 0;
      var bestCooc = -1;
      for (var cl = 0; cl < clusterList.length; cl++) {
        var clKws = clusterList[cl].keywords;
        var totalCooc = 0;
        for (var ck = 0; ck < clKws.length; ck++) {
          totalCooc += cooccurrence[kw2][clKws[ck]] || 0;
        }
        if (totalCooc > bestCooc) {
          bestCooc = totalCooc;
          bestCluster = cl;
        }
      }

      clusterList[bestCluster].keywords.push(kw2);
      assigned[kw2] = bestCluster;
    }

    // Refine cluster labels — use the most frequent keyword as the label
    for (var rl = 0; rl < clusterList.length; rl++) {
      var clKws2 = clusterList[rl].keywords;
      if (clKws2.length > 1) {
        // Find the most frequent keyword in this cluster
        var bestTerm = clKws2[0];
        var bestCount = 0;
        for (var rt = 0; rt < clKws2.length; rt++) {
          var cnt = topKeywords.filter(function (tk) { return tk.term === clKws2[rt]; });
          var freq2 = cnt.length > 0 ? cnt[0].count : 0;
          if (freq2 > bestCount) {
            bestCount = freq2;
            bestTerm = clKws2[rt];
          }
        }
        clusterList[rl].label = formatClusterLabel(clKws2.slice(0, 3));
      }
    }

    return clusterList;
  }

  /** Format a cluster label from its top keywords. */
  function formatClusterLabel(keywords) {
    return keywords.map(function (k) {
      return k.charAt(0).toUpperCase() + k.slice(1);
    }).join(" / ");
  }

  /** Position clusters in 2D space using a simple force-directed approach. */
  function positionClusters(clusters) {
    if (!clusters.length) return;

    var n = clusters.length;

    // Initialize positions evenly spaced in a circle
    for (var i = 0; i < n; i++) {
      var angle = (2 * Math.PI * i) / n;
      clusters[i].x = 50 + 30 * Math.cos(angle);
      clusters[i].y = 50 + 30 * Math.sin(angle);
    }

    // Run a few iterations of force-directed layout
    var iterations = 50;
    for (var iter = 0; iter < iterations; iter++) {
      var forces = [];
      for (var fi = 0; fi < n; fi++) {
        forces.push({ fx: 0, fy: 0 });
      }

      for (var a = 0; a < n; a++) {
        for (var b = a + 1; b < n; b++) {
          var dx = clusters[b].x - clusters[a].x;
          var dy = clusters[b].y - clusters[a].y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 0.1;

          // Repulsion (all clusters repel each other)
          var repulsion = 200 / (dist * dist);

          // Attraction (clusters with keyword overlap attract)
          var overlap = keywordOverlap(clusters[a].keywords, clusters[b].keywords);
          var attraction = overlap * 0.5 * dist;

          var netForce = attraction - repulsion;
          var fx = (dx / dist) * netForce;
          var fy = (dy / dist) * netForce;

          forces[a].fx += fx;
          forces[a].fy += fy;
          forces[b].fx -= fx;
          forces[b].fy -= fy;
        }

        // Centering force (pull toward center)
        forces[a].fx += (50 - clusters[a].x) * 0.01;
        forces[a].fy += (50 - clusters[a].y) * 0.01;
      }

      // Apply forces with damping
      var damping = 0.3 * (1 - iter / iterations);
      for (var u = 0; u < n; u++) {
        clusters[u].x += forces[u].fx * damping;
        clusters[u].y += forces[u].fy * damping;
        // Clamp to 5-95
        clusters[u].x = Math.max(5, Math.min(95, clusters[u].x));
        clusters[u].y = Math.max(5, Math.min(95, clusters[u].y));
      }
    }

    // Round positions
    for (var r = 0; r < n; r++) {
      clusters[r].x = Math.round(clusters[r].x * 10) / 10;
      clusters[r].y = Math.round(clusters[r].y * 10) / 10;
    }
  }

  /** Position a gap zone near related clusters in sparse areas. */
  function positionGapZone(gap, gapKws, clusters) {
    var bestX = 50;
    var bestY = 50;

    if (clusters.length > 0 && gapKws.length > 0) {
      // Find the cluster(s) most related to this gap
      var weights = [];
      var totalWeight = 0;
      for (var c = 0; c < clusters.length; c++) {
        var w = keywordOverlap(gapKws, clusters[c].keywords);
        weights.push(w);
        totalWeight += w;
      }

      if (totalWeight > 0) {
        // Weighted average position, offset slightly to sparse areas
        var wx = 0, wy = 0;
        for (var cw = 0; cw < clusters.length; cw++) {
          wx += clusters[cw].x * (weights[cw] / totalWeight);
          wy += clusters[cw].y * (weights[cw] / totalWeight);
        }

        // Offset gap zones slightly away from cluster centers (toward sparse areas)
        var offsetAngle = Math.random() * 2 * Math.PI;
        var offsetDist = 8 + Math.random() * 7;
        bestX = wx + Math.cos(offsetAngle) * offsetDist;
        bestY = wy + Math.sin(offsetAngle) * offsetDist;
      } else {
        // No keyword overlap — place in a random sparse area
        bestX = 20 + Math.random() * 60;
        bestY = 20 + Math.random() * 60;
      }
    }

    // Clamp
    bestX = Math.max(5, Math.min(95, bestX));
    bestY = Math.max(5, Math.min(95, bestY));

    return {
      id: "gapzone_" + gap.id.replace("gap_", ""),
      gapId: gap.id,
      x: Math.round(bestX * 10) / 10,
      y: Math.round(bestY * 10) / 10,
      radius: Math.max(3, Math.min(15, (gap.severity || 5) * 1.5))
    };
  }

  // -----------------------------------------------------------------------
  // MAIN PIPELINE  (Step 1)
  // -----------------------------------------------------------------------

  // -----------------------------------------------------------------------
  // AI-POWERED ANALYSIS (calls server.js → Claude API)
  // -----------------------------------------------------------------------

  function analyzeWithAI(papers, query) {
    statusUpdate("Sending " + papers.length + " papers to Claude for deep analysis...");
    console.log("AnalysisEngine: attempting AI analysis via /api/analyze");

    return fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ papers: papers, query: query })
    })
    .then(function(res) {
      if (!res.ok) throw new Error("Server returned " + res.status);
      return res.json();
    })
    .then(function(result) {
      if (result.error) throw new Error(result.error);
      if (!result.gaps || !result.gaps.length) throw new Error("AI returned no gaps");
      return result;
    });
  }

  function checkAIAvailable() {
    return fetch("/api/status")
      .then(function(res) { return res.json(); })
      .then(function(data) { return data && data.aiEnabled; })
      .catch(function() { return false; });
  }

  // -----------------------------------------------------------------------
  // ALGORITHMIC ANALYSIS (fallback when AI is unavailable)
  // -----------------------------------------------------------------------

  function analyzeAlgorithmic(papers) {
    return new Promise(function(resolve) {
      statusUpdate("Running local analysis on " + papers.length + " papers...");

      setTimeout(function() {
        var gaps = detectGaps(papers);
        statusUpdate("Found " + gaps.length + " gaps. Generating project ideas...");

        setTimeout(function() {
          var ideas = generateIdeas(gaps, papers);
          statusUpdate("Generated " + ideas.length + " ideas. Building landscape...");

          setTimeout(function() {
            var landscape = buildLandscape(papers, gaps);
            resolve({ gaps: gaps, ideas: ideas, landscape: landscape });
          }, 800);
        }, 600);
      }, 400);
    });
  }

  // -----------------------------------------------------------------------
  // MAIN PIPELINE — tries AI first, falls back to algorithmic
  // -----------------------------------------------------------------------

  function analyze(papers) {
    if (!papers || !papers.length) {
      console.warn("AnalysisEngine: no papers to analyze");
      dispatch("rgf:status-update", { status: "error", message: "No papers to analyze." });
      return;
    }

    var query = (window.ResearchData && window.ResearchData.query) || "";
    console.log("AnalysisEngine: analyzing " + papers.length + " papers");
    statusUpdate("Analyzing " + papers.length + " papers...");

    // Try AI first, fall back to algorithmic
    checkAIAvailable()
      .then(function(aiReady) {
        if (aiReady) {
          console.log("AnalysisEngine: AI server available — using Claude for analysis");
          statusUpdate("AI analysis server detected. Sending papers to Claude...");
          return analyzeWithAI(papers, query);
        } else {
          console.log("AnalysisEngine: no AI server — using algorithmic analysis");
          statusUpdate("Running local gap analysis...");
          return analyzeAlgorithmic(papers);
        }
      })
      .catch(function(err) {
        // AI failed, fall back to algorithmic
        console.warn("AnalysisEngine: AI analysis failed (" + err.message + "), falling back to algorithmic");
        statusUpdate("AI unavailable — running local analysis...");
        return analyzeAlgorithmic(papers);
      })
      .then(function(result) {
        if (!result) return;

        // Store results in shared state
        if (window.ResearchData) {
          window.ResearchData.gaps = result.gaps || [];
          window.ResearchData.ideas = result.ideas || [];
          window.ResearchData.landscape = result.landscape || null;
          window.ResearchData.status = "complete";
          window.ResearchData.statusMessage = "Analysis complete";
        }

        // Dispatch completion event
        dispatch("rgf:analysis-ready", {
          gaps: result.gaps || [],
          ideas: result.ideas || [],
          landscape: result.landscape || null
        });

        console.log("AnalysisEngine: analysis complete — " +
          (result.gaps || []).length + " gaps, " +
          (result.ideas || []).length + " ideas, " +
          ((result.landscape && result.landscape.clusters) || []).length + " clusters");
      })
      .catch(function(err) {
        console.error("AnalysisEngine: all analysis paths failed", err);
        dispatch("rgf:status-update", { status: "error", message: "Analysis failed: " + err.message });
      });
  }

  // -----------------------------------------------------------------------
  // EVENT LISTENER
  // -----------------------------------------------------------------------

  window.addEventListener("rgf:papers-ready", function (e) {
    var papers = e.detail && e.detail.papers;
    if (papers && papers.length) {
      window.AnalysisEngine.analyze(papers);
    }
  });

  // -----------------------------------------------------------------------
  // PUBLIC API
  // -----------------------------------------------------------------------

  window.AnalysisEngine = {
    /** Main entry point — runs the full pipeline with status updates */
    analyze: analyze,

    /** Individual pipeline steps (callable independently) */
    detectGaps: detectGaps,

    generateIdeas: function (gaps, papers) {
      return generateIdeas(gaps, papers);
    },

    scoreFeasibility: function (idea, gap, papers) {
      return scoreFeasibility(idea, gap, papers);
    },

    buildLandscape: function (papers, gaps) {
      return buildLandscape(papers, gaps);
    }
  };

  console.log("AnalysisEngine: module loaded");
})();
