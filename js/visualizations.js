/**
 * Research Gap Finder — Visualization Module
 * Renders all charts and the D3 force-directed research landscape map.
 * Depends on: Chart.js 4.4.7, D3.js 7.9.0 (loaded via CDN before this script)
 */
(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Chart.js global defaults (dark theme)
  // ---------------------------------------------------------------------------
  if (typeof Chart !== "undefined") {
    Chart.defaults.color = "#8892b0";
    Chart.defaults.borderColor = "#1d3557";
    Chart.defaults.font.family =
      "ui-monospace, 'Cascadia Code', 'Consolas', monospace";
  }

  // ---------------------------------------------------------------------------
  // Color palette
  // ---------------------------------------------------------------------------
  var COLORS = {
    bg: "#0a192f",
    cardBg: "#112240",
    textPrimary: "#ccd6f6",
    textSecondary: "#8892b0",
    accent: "#64ffda",
    warning: "#ffd700",
    danger: "#ff6b6b",
    success: "#64ffda",
    grid: "#1d3557",
    clusters: [
      "#64ffda",
      "#7c3aed",
      "#f59e0b",
      "#ec4899",
      "#3b82f6",
      "#10b981",
      "#f43f5e",
      "#8b5cf6"
    ]
  };

  // ---------------------------------------------------------------------------
  // Internal state
  // ---------------------------------------------------------------------------
  var chartInstances = {};
  var currentSimulation = null;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Safely get a DOM element by id (no # prefix). */
  function getContainer(id) {
    var el = document.getElementById(id);
    return el || null;
  }

  /** Show a centered placeholder message inside a container. */
  function showPlaceholder(containerId, message) {
    var el = getContainer(containerId);
    if (!el) return;
    el.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100%;width:100%;color:' +
      COLORS.textSecondary +
      ";font-family:ui-monospace,'Cascadia Code','Consolas',monospace;font-size:13px;opacity:0.7;" +
      '">' +
      message +
      "</div>";
  }

  /** Create a canvas inside a container, return the canvas element. */
  function ensureCanvas(containerId) {
    var container = getContainer(containerId);
    if (!container) return null;
    container.innerHTML = "";
    var canvas = document.createElement("canvas");
    container.appendChild(canvas);
    return canvas;
  }

  /** Interpolate between accent (teal) and danger (coral red) based on t (0-1). */
  function severityColor(t) {
    var r1 = 100, g1 = 255, b1 = 218;
    var r2 = 255, g2 = 107, b2 = 107;
    var r = Math.round(r1 + (r2 - r1) * t);
    var g = Math.round(g1 + (g2 - g1) * t);
    var b = Math.round(b1 + (b2 - b1) * t);
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  /** Hex to rgba helper */
  function hexToRgba(hex, alpha) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;
    return (
      "rgba(" +
      parseInt(result[1], 16) + "," +
      parseInt(result[2], 16) + "," +
      parseInt(result[3], 16) + "," +
      alpha + ")"
    );
  }

  // ---------------------------------------------------------------------------
  // Destroy / cleanup
  // ---------------------------------------------------------------------------
  function destroyAll() {
    Object.keys(chartInstances).forEach(function (key) {
      if (chartInstances[key]) {
        try { chartInstances[key].destroy(); } catch (e) { /* ignore */ }
      }
    });
    chartInstances = {};
    if (currentSimulation) {
      currentSimulation.stop();
      currentSimulation = null;
    }
    var svg = document.querySelector("#landscape-canvas svg");
    if (svg) svg.remove();
    // Cancel any floating animation
    var lc = getContainer("landscape-canvas");
    if (lc && lc._rgfFloatCancel) {
      lc._rgfFloatCancel();
      lc._rgfFloatCancel = null;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Research Landscape Map (D3 force graph) — THE HERO VIZ
  // ---------------------------------------------------------------------------
  function renderLandscape(landscape, containerId) {
    var container = getContainer(containerId);
    if (!container) return;

    if (!landscape || !landscape.clusters || landscape.clusters.length === 0) {
      showPlaceholder(containerId, "Waiting for analysis...");
      return;
    }

    console.log(
      "Visualizations: rendering landscape with " +
        landscape.clusters.length + " clusters"
    );

    // Clean up previous
    if (currentSimulation) { currentSimulation.stop(); currentSimulation = null; }
    if (container._rgfFloatCancel) { container._rgfFloatCancel(); container._rgfFloatCancel = null; }
    container.innerHTML = "";

    var rect = container.getBoundingClientRect();
    var width = rect.width || 800;
    var height = rect.height || 400;
    if (height < 300) height = 400;

    // Create SVG
    var svg = d3.select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("background", "transparent")
      .style("overflow", "visible");

    // ---- Defs: glow filters ----
    var defs = svg.append("defs");

    // Gap zone glow
    var glowFilter = defs.append("filter")
      .attr("id", "rgf-glow-gap")
      .attr("x", "-50%").attr("y", "-50%")
      .attr("width", "200%").attr("height", "200%");
    glowFilter.append("feGaussianBlur")
      .attr("stdDeviation", "8").attr("result", "coloredBlur");
    var feMerge = glowFilter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Cluster glow
    var clusterGlow = defs.append("filter")
      .attr("id", "rgf-glow-cluster")
      .attr("x", "-50%").attr("y", "-50%")
      .attr("width", "200%").attr("height", "200%");
    clusterGlow.append("feGaussianBlur")
      .attr("stdDeviation", "4").attr("result", "coloredBlur");
    var feMerge2 = clusterGlow.append("feMerge");
    feMerge2.append("feMergeNode").attr("in", "coloredBlur");
    feMerge2.append("feMergeNode").attr("in", "SourceGraphic");

    // ---- Build data structures ----
    var clusters = landscape.clusters;
    var connections = landscape.connections || [];
    var gapZones = landscape.gapZones || [];

    var nodes = clusters.map(function (c, i) {
      var paperCount = (c.paperIds && c.paperIds.length) || c.size || 1;
      var radius = Math.max(18, Math.min(55, 12 + paperCount * 4));
      return {
        id: c.id,
        label: c.label,
        keywords: c.keywords || [],
        paperIds: c.paperIds || [],
        paperCount: paperCount,
        radius: radius,
        color: COLORS.clusters[i % COLORS.clusters.length],
        x: (c.x / 100) * width,
        y: (c.y / 100) * height,
        ix: (c.x / 100) * width,
        iy: (c.y / 100) * height
      };
    });

    var nodeIndexById = {};
    nodes.forEach(function (n, i) { nodeIndexById[n.id] = i; });

    var links = [];
    connections.forEach(function (conn) {
      var si = nodeIndexById[conn.from];
      var ti = nodeIndexById[conn.to];
      if (si !== undefined && ti !== undefined) {
        links.push({ source: si, target: ti, strength: conn.strength || 0.5 });
      }
    });

    // ---- SVG layers (back to front) ----
    var gapGroup = svg.append("g").attr("class", "rgf-gap-zones");
    var linkGroup = svg.append("g").attr("class", "rgf-links");
    var nodeGroup = svg.append("g").attr("class", "rgf-nodes");
    var labelGroup = svg.append("g").attr("class", "rgf-labels");

    // ---- Tooltip ----
    var tooltip = d3.select(container)
      .append("div")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", COLORS.cardBg)
      .style("border", "1px solid " + COLORS.accent)
      .style("border-radius", "8px")
      .style("padding", "10px 14px")
      .style("font-family", "ui-monospace, 'Cascadia Code', 'Consolas', monospace")
      .style("font-size", "12px")
      .style("color", COLORS.textPrimary)
      .style("box-shadow", "0 4px 20px rgba(0,0,0,0.5)")
      .style("opacity", "0")
      .style("transition", "opacity 0.2s ease")
      .style("z-index", "100")
      .style("max-width", "240px");

    // ---- Links ----
    var linkElements = linkGroup.selectAll("line")
      .data(links).enter().append("line")
      .attr("stroke", COLORS.grid)
      .attr("stroke-opacity", function (d) { return 0.2 + d.strength * 0.5; })
      .attr("stroke-width", function (d) { return 1 + d.strength * 3; })
      .attr("stroke-linecap", "round");

    // ---- Node groups ----
    var circles = nodeGroup.selectAll("g")
      .data(nodes).enter().append("g")
      .style("cursor", "pointer");

    // Outer glow
    circles.append("circle")
      .attr("r", function (d) { return d.radius + 4; })
      .attr("fill", function (d) { return hexToRgba(d.color, 0.15); })
      .attr("filter", "url(#rgf-glow-cluster)");

    // Main circle
    circles.append("circle")
      .attr("class", "rgf-cluster-main")
      .attr("r", function (d) { return d.radius; })
      .attr("fill", function (d) { return hexToRgba(d.color, 0.25); })
      .attr("stroke", function (d) { return d.color; })
      .attr("stroke-width", 2)
      .style("transition", "stroke-width 0.2s ease, fill 0.2s ease");

    // Inner highlight
    circles.append("circle")
      .attr("r", function (d) { return d.radius * 0.35; })
      .attr("fill", function (d) { return hexToRgba(d.color, 0.4); });

    // Paper count badge
    circles.append("text")
      .text(function (d) { return d.paperCount; })
      .attr("fill", function (d) { return d.color; })
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .attr("font-family", "ui-monospace, 'Cascadia Code', 'Consolas', monospace")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .style("pointer-events", "none");

    // ---- Labels ----
    var labels = labelGroup.selectAll("text")
      .data(nodes).enter().append("text")
      .text(function (d) {
        return d.label.length > 22 ? d.label.substring(0, 20) + "..." : d.label;
      })
      .attr("fill", COLORS.textPrimary)
      .attr("font-size", "11px")
      .attr("font-family", "ui-monospace, 'Cascadia Code', 'Consolas', monospace")
      .attr("text-anchor", "middle")
      .attr("dy", function (d) { return d.radius + 16; })
      .style("pointer-events", "none")
      .style("text-shadow",
        "0 0 6px " + COLORS.bg + ", 0 0 12px " + COLORS.bg);

    // ---- Hover interactions ----
    circles
      .on("mouseenter", function (event, d) {
        d3.select(this).select(".rgf-cluster-main")
          .attr("stroke-width", 4)
          .attr("fill", hexToRgba(d.color, 0.4));

        var kw = d.keywords.length > 0
          ? d.keywords.slice(0, 5).join(", ") : "none";

        tooltip.html(
          '<div style="color:' + d.color +
          ';font-weight:bold;margin-bottom:4px;font-size:13px;">' +
          d.label + '</div>' +
          '<div style="color:' + COLORS.textSecondary +
          ';font-size:11px;margin-bottom:3px;">' +
          d.paperCount + ' papers</div>' +
          '<div style="color:' + COLORS.textSecondary +
          ';font-size:10px;">' + kw + '</div>'
        ).style("opacity", "1");
      })
      .on("mousemove", function (event) {
        var cr = container.getBoundingClientRect();
        var x = event.clientX - cr.left + 14;
        var y = event.clientY - cr.top - 10;
        if (x + 240 > width) x = x - 260;
        tooltip.style("left", x + "px").style("top", y + "px");
      })
      .on("mouseleave", function (event, d) {
        d3.select(this).select(".rgf-cluster-main")
          .attr("stroke-width", 2)
          .attr("fill", hexToRgba(d.color, 0.25));
        tooltip.style("opacity", "0");
      });

    // ---- Force simulation ----
    var sim = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("link", d3.forceLink(links).distance(120).strength(function (d) {
        return 0.3 + d.strength * 0.5;
      }))
      .force("collision", d3.forceCollide().radius(function (d) {
        return d.radius + 15;
      }))
      .force("x", d3.forceX().x(function (d) { return d.ix; }).strength(0.08))
      .force("y", d3.forceY().y(function (d) { return d.iy; }).strength(0.08))
      .alpha(1)
      .alphaDecay(0.015)
      .velocityDecay(0.35);

    currentSimulation = sim;

    function clampNode(d) {
      var pad = d.radius + 5;
      d.x = Math.max(pad, Math.min(width - pad, d.x));
      d.y = Math.max(pad, Math.min(height - pad, d.y));
    }

    var settled = false;

    sim.on("tick", function () {
      nodes.forEach(clampNode);

      linkElements
        .attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });

      circles.attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      });

      labels
        .attr("x", function (d) { return d.x; })
        .attr("y", function (d) { return d.y; });
    });

    sim.on("end", function () {
      if (settled) return;
      settled = true;
      addGapZonesOverlay();
      startSubtleFloat();
    });

    // Fallback if simulation takes too long
    setTimeout(function () {
      if (!settled) {
        settled = true;
        if (sim) sim.stop();
        addGapZonesOverlay();
        startSubtleFloat();
      }
    }, 5000);

    // ---- Gap zones overlay (placed after clusters settle) ----
    function addGapZonesOverlay() {
      if (!gapZones || gapZones.length === 0) return;

      // Lookup gap data for tooltips
      var gapDataMap = {};
      var rd = window.ResearchData;
      if (rd && rd.gaps) {
        rd.gaps.forEach(function (g) { gapDataMap[g.id] = g; });
      }

      // Inject pulse keyframes once
      if (!document.querySelector("style[data-rgf-pulse]")) {
        var style = document.createElement("style");
        style.setAttribute("data-rgf-pulse", "1");
        style.textContent =
          "@keyframes rgf-pulse{0%{opacity:0.35;transform:scale(1)}" +
          "50%{opacity:0.55;transform:scale(1.08)}" +
          "100%{opacity:0.35;transform:scale(1)}}";
        document.head.appendChild(style);
      }

      var gapCircles = gapGroup.selectAll("circle")
        .data(gapZones).enter().append("circle")
        .attr("cx", function (d) { return (d.x / 100) * width; })
        .attr("cy", function (d) { return (d.y / 100) * height; })
        .attr("r", function (d) {
          return Math.max(25, (d.radius / 100) * Math.min(width, height));
        })
        .attr("fill", hexToRgba(COLORS.danger, 0.12))
        .attr("stroke", hexToRgba(COLORS.warning, 0.4))
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "6 4")
        .attr("filter", "url(#rgf-glow-gap)")
        .style("animation", "rgf-pulse 3s ease-in-out infinite")
        .style("transform-origin", function (d) {
          return (d.x / 100) * width + "px " + (d.y / 100) * height + "px";
        })
        .style("cursor", "pointer");

      // Gap zone text labels
      gapGroup.selectAll("text")
        .data(gapZones).enter().append("text")
        .text(function (d) {
          var gap = gapDataMap[d.gapId];
          if (gap) {
            var t = gap.title || gap.category || "Gap";
            return t.length > 18 ? t.substring(0, 16) + "..." : t;
          }
          return "Gap";
        })
        .attr("x", function (d) { return (d.x / 100) * width; })
        .attr("y", function (d) { return (d.y / 100) * height; })
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("fill", COLORS.warning)
        .attr("font-size", "10px")
        .attr("font-family", "ui-monospace, 'Cascadia Code', 'Consolas', monospace")
        .attr("opacity", 0.8)
        .style("pointer-events", "none")
        .style("text-shadow", "0 0 8px " + COLORS.bg);

      // Gap zone hover
      gapCircles
        .on("mouseenter", function (event, d) {
          var gap = gapDataMap[d.gapId];
          var title = gap ? (gap.title || "Research Gap") : "Research Gap";
          var sev = gap ? (gap.severity || "?") : "?";
          var desc = gap && gap.description ? gap.description : "";
          if (desc.length > 100) desc = desc.substring(0, 97) + "...";

          d3.select(this)
            .attr("fill", hexToRgba(COLORS.danger, 0.25))
            .attr("stroke", hexToRgba(COLORS.warning, 0.8));

          tooltip.html(
            '<div style="color:' + COLORS.warning +
            ';font-weight:bold;margin-bottom:4px;font-size:13px;">' +
            title + '</div>' +
            '<div style="color:' + COLORS.danger +
            ';font-size:11px;margin-bottom:3px;">Severity: ' +
            sev + '/10</div>' +
            (desc ? '<div style="color:' + COLORS.textSecondary +
            ';font-size:10px;">' + desc + '</div>' : '')
          ).style("opacity", "1");
        })
        .on("mousemove", function (event) {
          var cr = container.getBoundingClientRect();
          var x = event.clientX - cr.left + 14;
          var y = event.clientY - cr.top - 10;
          if (x + 240 > width) x = x - 260;
          tooltip.style("left", x + "px").style("top", y + "px");
        })
        .on("mouseleave", function () {
          d3.select(this)
            .attr("fill", hexToRgba(COLORS.danger, 0.12))
            .attr("stroke", hexToRgba(COLORS.warning, 0.4));
          tooltip.style("opacity", "0");
        });
    }

    // ---- Subtle continuous floating motion ----
    function startSubtleFloat() {
      var floatAmplitude = 1.8;
      var floatSpeed = 0.0008;
      var startTime = Date.now();
      var animId = null;

      function animate() {
        // Stop if SVG was removed from DOM
        if (!document.contains(svg.node())) return;

        var t = (Date.now() - startTime) * floatSpeed;
        nodes.forEach(function (d, i) {
          var phase = i * 1.3;
          d.x += Math.sin(t + phase) * floatAmplitude * 0.05;
          d.y += Math.cos(t + phase * 0.7) * floatAmplitude * 0.05;
          clampNode(d);
        });

        linkElements
          .attr("x1", function (d) { return d.source.x; })
          .attr("y1", function (d) { return d.source.y; })
          .attr("x2", function (d) { return d.target.x; })
          .attr("y2", function (d) { return d.target.y; });

        circles.attr("transform", function (d) {
          return "translate(" + d.x + "," + d.y + ")";
        });

        labels
          .attr("x", function (d) { return d.x; })
          .attr("y", function (d) { return d.y; });

        animId = requestAnimationFrame(animate);
      }

      animate();

      container._rgfFloatCancel = function () {
        if (animId) cancelAnimationFrame(animId);
        animId = null;
      };
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Gap Severity Chart (Chart.js horizontal bar)
  // ---------------------------------------------------------------------------
  function renderGapChart(gaps, containerId) {
    var canvas = ensureCanvas(containerId);
    if (!canvas) return;

    gaps = gaps || [];
    if (gaps.length === 0) {
      showPlaceholder(containerId, "No gaps identified yet");
      return;
    }

    console.log("Visualizations: rendering gap chart with " + gaps.length + " gaps");

    // Sort by severity descending
    var sorted = gaps.slice().sort(function (a, b) {
      return (b.severity || 0) - (a.severity || 0);
    });

    var chartLabels = sorted.map(function (g) {
      var t = g.title || g.category || "Gap";
      return t.length > 35 ? t.substring(0, 33) + "..." : t;
    });
    var data = sorted.map(function (g) { return g.severity || 0; });
    var bgColors = sorted.map(function (g) {
      var t = ((g.severity || 0) - 1) / 9;
      t = Math.max(0, Math.min(1, t));
      return severityColor(t);
    });

    if (chartInstances.gap) {
      try { chartInstances.gap.destroy(); } catch (e) { /* ignore */ }
    }

    chartInstances.gap = new Chart(canvas, {
      type: "bar",
      data: {
        labels: chartLabels,
        datasets: [{
          data: data,
          backgroundColor: bgColors,
          borderColor: bgColors,
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.7
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800, easing: "easeOutQuart" },
        scales: {
          x: {
            max: 10, min: 0,
            grid: { color: COLORS.grid },
            ticks: { color: COLORS.textSecondary, stepSize: 2 },
            title: {
              display: true, text: "Severity",
              color: COLORS.textSecondary, font: { size: 10 }
            }
          },
          y: {
            grid: { display: false },
            ticks: { color: COLORS.textPrimary, font: { size: 11 } }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: COLORS.cardBg,
            titleColor: COLORS.accent,
            bodyColor: COLORS.textPrimary,
            borderColor: COLORS.accent,
            borderWidth: 1,
            cornerRadius: 6,
            callbacks: {
              title: function (items) {
                var idx = items[0].dataIndex;
                return sorted[idx].title || sorted[idx].category || "Gap";
              },
              label: function (item) {
                return "Severity: " + item.raw + "/10";
              },
              afterLabel: function (item) {
                var idx = item.dataIndex;
                var gap = sorted[idx];
                return gap.category ? "Category: " + gap.category : "";
              }
            }
          }
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 3. Feasibility Radar Charts (Chart.js radar, top 3 ideas)
  // ---------------------------------------------------------------------------
  function renderFeasibilityRadar(ideas, containerId) {
    var container = getContainer(containerId);
    if (!container) return;

    ideas = ideas || [];
    if (ideas.length === 0) {
      showPlaceholder(containerId, "No project ideas available");
      return;
    }

    console.log(
      "Visualizations: rendering feasibility radars for " +
      Math.min(3, ideas.length) + " ideas"
    );

    container.innerHTML = "";

    // Destroy old radar instances
    for (var k = 0; k < 3; k++) {
      var rKey = "radar_" + k;
      if (chartInstances[rKey]) {
        try { chartInstances[rKey].destroy(); } catch (e) { /* ignore */ }
        delete chartInstances[rKey];
      }
    }

    // Take top 3 by overall feasibility
    var topIdeas = ideas.slice().sort(function (a, b) {
      var sa = a.feasibility ? (a.feasibility.overall || 0) : 0;
      var sb = b.feasibility ? (b.feasibility.overall || 0) : 0;
      return sb - sa;
    }).slice(0, 3);

    // Flex wrapper
    var wrapper = document.createElement("div");
    wrapper.style.cssText =
      "display:flex;gap:16px;flex-wrap:wrap;justify-content:center;" +
      "align-items:flex-start;width:100%;";
    container.appendChild(wrapper);

    var radarLabels = [
      "Data Availability", "Cost (inv.)", "Timeline (inv.)",
      "Complexity (inv.)", "Novelty", "Clinical Impact"
    ];
    var radarColors = [COLORS.accent, "#7c3aed", "#f59e0b"];

    topIdeas.forEach(function (idea, idx) {
      var card = document.createElement("div");
      card.style.cssText =
        "flex:1 1 200px;max-width:280px;min-width:180px;text-align:center;";
      wrapper.appendChild(card);

      // Title
      var title = document.createElement("div");
      title.textContent = idea.title && idea.title.length > 30
        ? idea.title.substring(0, 28) + "..." : (idea.title || "Idea " + (idx + 1));
      title.style.cssText =
        "color:" + radarColors[idx] + ";font-size:12px;font-weight:bold;" +
        "margin-bottom:8px;font-family:ui-monospace,'Cascadia Code','Consolas',monospace;";
      card.appendChild(title);

      var canvas = document.createElement("canvas");
      canvas.style.maxHeight = "220px";
      card.appendChild(canvas);

      var f = idea.feasibility || {};

      // Normalize to 0-100 scale
      function norm(val) {
        if (val === undefined || val === null) return 50;
        if (val <= 10) return val * 10;
        return Math.min(100, Math.max(0, val));
      }
      function invert(val) { return 100 - norm(val); }

      // costEstimate may be a string — handle gracefully
      var costVal = typeof f.costEstimate === "number" ? f.costEstimate : 50;

      var dataPoints = [
        norm(f.dataAvailability),
        invert(costVal),
        invert(f.timelineMonths),
        invert(f.technicalComplexity),
        norm(f.novelty),
        norm(f.clinicalImpact)
      ];

      var color = radarColors[idx];

      chartInstances["radar_" + idx] = new Chart(canvas, {
        type: "radar",
        data: {
          labels: radarLabels,
          datasets: [{
            data: dataPoints,
            backgroundColor: hexToRgba(color, 0.15),
            borderColor: color,
            borderWidth: 2,
            pointBackgroundColor: color,
            pointBorderColor: color,
            pointRadius: 3,
            pointHoverRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          animation: { duration: 1000, easing: "easeOutQuart" },
          scales: {
            r: {
              min: 0, max: 100,
              grid: { color: COLORS.grid },
              pointLabels: { color: COLORS.textSecondary, font: { size: 10 } },
              ticks: { display: false },
              angleLines: { color: COLORS.grid }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: COLORS.cardBg,
              titleColor: COLORS.accent,
              bodyColor: COLORS.textPrimary,
              borderColor: color,
              borderWidth: 1,
              cornerRadius: 6
            }
          }
        }
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 4. Publication Timeline (Chart.js sparkline)
  // ---------------------------------------------------------------------------
  function renderTimeline(papers, containerId) {
    var canvas = ensureCanvas(containerId);
    if (!canvas) return;

    papers = papers || [];
    if (papers.length === 0) {
      showPlaceholder(containerId, "No publication data");
      return;
    }

    console.log("Visualizations: rendering timeline with " + papers.length + " papers");

    // Count papers by year
    var yearCounts = {};
    papers.forEach(function (p) {
      if (p.year) yearCounts[p.year] = (yearCounts[p.year] || 0) + 1;
    });

    var years = Object.keys(yearCounts).map(Number).sort(function (a, b) { return a - b; });

    if (years.length === 0) {
      showPlaceholder(containerId, "No year data available");
      return;
    }

    // Fill in missing years
    var minYear = years[0];
    var maxYear = years[years.length - 1];
    var filledYears = [];
    var filledCounts = [];
    for (var yr = minYear; yr <= maxYear; yr++) {
      filledYears.push(yr);
      filledCounts.push(yearCounts[yr] || 0);
    }

    if (chartInstances.timeline) {
      try { chartInstances.timeline.destroy(); } catch (e) { /* ignore */ }
    }

    // Gradient fill
    var ctx = canvas.getContext("2d");
    var parentH = (canvas.parentElement && canvas.parentElement.clientHeight) || 80;
    var gradient = ctx.createLinearGradient(0, 0, 0, parentH);
    gradient.addColorStop(0, hexToRgba(COLORS.accent, 0.4));
    gradient.addColorStop(1, hexToRgba(COLORS.accent, 0.02));

    chartInstances.timeline = new Chart(canvas, {
      type: "line",
      data: {
        labels: filledYears,
        datasets: [{
          data: filledCounts,
          borderColor: COLORS.accent,
          borderWidth: 2,
          backgroundColor: gradient,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: COLORS.accent,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1200, easing: "easeOutQuart" },
        scales: { x: { display: false }, y: { display: false } },
        elements: { point: { radius: 0 }, line: { tension: 0.4 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: COLORS.cardBg,
            titleColor: COLORS.accent,
            bodyColor: COLORS.textPrimary,
            borderColor: COLORS.accent,
            borderWidth: 1,
            cornerRadius: 6,
            callbacks: {
              title: function (items) { return "Year: " + items[0].label; },
              label: function (item) {
                return item.raw + " paper" + (item.raw !== 1 ? "s" : "");
              }
            }
          }
        },
        interaction: { mode: "index", intersect: false }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 5. Database Coverage Donut (Chart.js doughnut)
  // ---------------------------------------------------------------------------
  function renderDatabaseCoverage(papers, containerId) {
    // Show the coverage wrapper when we have data
    var wrapper = document.getElementById("coverage-wrapper");
    if (wrapper) wrapper.style.display = "";

    var canvas = ensureCanvas(containerId);
    if (!canvas) return;

    papers = papers || [];
    if (papers.length === 0) {
      showPlaceholder(containerId, "No coverage data");
      return;
    }

    console.log(
      "Visualizations: rendering coverage donut with " + papers.length + " papers"
    );

    // Count by source
    var sourceCounts = {};
    papers.forEach(function (p) {
      var src = p.source || "unknown";
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });

    var sourceLabels = Object.keys(sourceCounts).map(function (s) {
      return s.charAt(0).toUpperCase() + s.slice(1);
    });
    var sourceData = Object.keys(sourceCounts).map(function (s) {
      return sourceCounts[s];
    });
    var total = papers.length;

    var donutColors = [
      COLORS.accent, "#7c3aed", "#3b82f6", "#f59e0b",
      "#ec4899", "#10b981", "#f43f5e", "#8b5cf6"
    ];

    if (chartInstances.coverage) {
      try { chartInstances.coverage.destroy(); } catch (e) { /* ignore */ }
    }

    // Center text plugin (inline, per chart instance)
    var centerTextPlugin = {
      id: "rgfCenterText",
      afterDraw: function (chart) {
        var c = chart.ctx;
        var area = chart.chartArea;
        var cx = (area.left + area.right) / 2;
        var cy = (area.top + area.bottom) / 2;

        c.save();
        c.textAlign = "center";
        c.textBaseline = "middle";

        c.font = "bold 22px ui-monospace, 'Cascadia Code', 'Consolas', monospace";
        c.fillStyle = COLORS.textPrimary;
        c.fillText(total, cx, cy - 8);

        c.font = "10px ui-monospace, 'Cascadia Code', 'Consolas', monospace";
        c.fillStyle = COLORS.textSecondary;
        c.fillText("papers", cx, cy + 12);

        c.restore();
      }
    };

    chartInstances.coverage = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: sourceLabels,
        datasets: [{
          data: sourceData,
          backgroundColor: donutColors.slice(0, sourceLabels.length),
          borderColor: COLORS.cardBg,
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: "65%",
        animation: { duration: 1000, easing: "easeOutQuart" },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: COLORS.textSecondary,
              padding: 10,
              font: { size: 11 },
              usePointStyle: true,
              pointStyle: "circle"
            }
          },
          tooltip: {
            backgroundColor: COLORS.cardBg,
            titleColor: COLORS.accent,
            bodyColor: COLORS.textPrimary,
            borderColor: COLORS.accent,
            borderWidth: 1,
            cornerRadius: 6,
            callbacks: {
              label: function (item) {
                var pct = ((item.raw / total) * 100).toFixed(1);
                return item.label + ": " + item.raw + " (" + pct + "%)";
              }
            }
          }
        }
      },
      plugins: [centerTextPlugin]
    });
  }

  // ---------------------------------------------------------------------------
  // renderAll — master render
  // ---------------------------------------------------------------------------
  function renderAll(researchData) {
    researchData = researchData || window.ResearchData || {};

    window.dispatchEvent(new CustomEvent("rgf:status-update", {
      detail: { status: "analyzing", message: "Rendering visualizations..." }
    }));

    var gaps = (researchData && researchData.gaps) || [];
    var ideas = (researchData && researchData.ideas) || [];
    var landscape = (researchData && researchData.landscape) || null;
    var papers = (researchData && researchData.papers) || [];

    destroyAll();

    try { renderLandscape(landscape, "landscape-canvas"); }
    catch (e) { console.error("Visualizations: landscape error", e); }

    try { renderGapChart(gaps, "gap-chart-container"); }
    catch (e) { console.error("Visualizations: gap chart error", e); }

    try { renderFeasibilityRadar(ideas, "feasibility-chart-container"); }
    catch (e) { console.error("Visualizations: feasibility radar error", e); }

    try { renderTimeline(papers, "timeline-container"); }
    catch (e) { console.error("Visualizations: timeline error", e); }

    try { renderDatabaseCoverage(papers, "coverage-container"); }
    catch (e) { console.error("Visualizations: coverage donut error", e); }

    console.log("Visualizations: all charts rendered");
  }

  // ---------------------------------------------------------------------------
  // Event listeners
  // ---------------------------------------------------------------------------
  window.addEventListener("rgf:analysis-ready", function () {
    console.log("Visualizations: received rgf:analysis-ready event");
    renderAll(window.ResearchData);
  });

  window.addEventListener("rgf:papers-ready", function (e) {
    console.log("Visualizations: received rgf:papers-ready event");
    var papers =
      (e.detail && e.detail.papers) ||
      (window.ResearchData && window.ResearchData.papers) || [];

    try {
      if (chartInstances.timeline) {
        try { chartInstances.timeline.destroy(); } catch (ex) { /* ignore */ }
        delete chartInstances.timeline;
      }
      renderTimeline(papers, "timeline-container");
    } catch (err) {
      console.error("Visualizations: timeline error on papers-ready", err);
    }

    try {
      if (chartInstances.coverage) {
        try { chartInstances.coverage.destroy(); } catch (ex) { /* ignore */ }
        delete chartInstances.coverage;
      }
      renderDatabaseCoverage(papers, "coverage-container");
    } catch (err) {
      console.error("Visualizations: coverage error on papers-ready", err);
    }
  });

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  window.Visualizations = {
    renderAll: renderAll,
    renderLandscape: renderLandscape,
    renderGapChart: renderGapChart,
    renderFeasibilityRadar: renderFeasibilityRadar,
    renderTimeline: renderTimeline,
    renderDatabaseCoverage: renderDatabaseCoverage,
    destroy: destroyAll
  };

  console.log("Visualizations: module loaded");
})();
