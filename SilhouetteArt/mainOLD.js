// Landing page
(function setupLandingOverlay() {
  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(() => {
    var overlay = document.getElementById("project-overlay");
    var readMoreBtn = document.getElementById("readmore-btn");

    // Wire Read More button -> open overlay (only if both exist)
    if (readMoreBtn && overlay) {
      var panel = overlay.querySelector(".project-panel");
      readMoreBtn.addEventListener("click", function (e) {
        e.preventDefault();
        overlay.classList.remove("hidden");
        if (panel) {
          panel.setAttribute("tabindex", "-1");
          panel.focus();
        }
      });

      // close button inside overlay (if present)
      var overlayClose = overlay.querySelector("#project-overlay-close");
      if (overlayClose) {
        overlayClose.addEventListener("click", function (e) {
          e.preventDefault();
          overlay.classList.add("hidden");
        });
      }

      // clicking the overlay backdrop closes it
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) overlay.classList.add("hidden");
      });
    }
  });
})();

d3.json("data/dataset_silhouettes_only_with_filename.json").then((data) => {
  ///////////// Filtering ///////////////////////
  var activeTopic = null;
  var topicKeywords = {
    men: [" man", " men"],
    women: [" woman", " women"],
    children: [" child", " children"],
    identified: [" unidentified"],
  };

  // helper to escape user-provided keywords for regex
  function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // replace filterByTopic with explicit whole-word regex matching
  function filterByTopic(items, topic) {
    // if (!topic) return items;
    var keys = topicKeywords[topic] || [topic];
    // build word-boundary, case-insensitive regexes for each keyword
    var regs = keys.map(function (k) {
      return new RegExp("\\b" + escapeRegExp(k) + "\\b", "i");
    });

    data.map((item) => {
      console.log(item);
      var txt =
        (it.indexed_topics || "") +
        " " +
        (it.topic || "") +
        " " +
        (it.name || "") +
        " " +
        (it.title || "") +
        " " +
        (it.indexed_names || "");

      if (txt.includes(topicKeywords.identified[0])) {
      } else if (
        txt.includes(topicKeywords.women[0]) ||
        txt.includes(topicKeywords.women[1])
      ) {
      } else if (
        txt.includes(topicKeywords.children[0]) ||
        txt.includes(topicKeywords.children[1])
      ) {
        txt.includes(topicKeywords.men[0]) ||
          txt.includes(topicKeywords.men[1]);
        {
        }
      }
      return item;
    });

    return items.filter(function (it) {
      var txt =
        (it.indexed_topics || "") +
        " " +
        (it.topic || "") +
        " " +
        (it.name || "") +
        " " +
        (it.title || "") +
        " " +
        (it.indexed_names || "");
      for (var r = 0; r < regs.length; r++) {
        if (regs[r].test(txt)) return true;
      }
      return false;
    });
  }
  // filterByTopic();

  // helper: count occurrences using word-boundary regex (uses escapeRegExp above)
  function countTopics(items) {
    var out = { identified: 0, men: 0, women: 0, children: 0 };
    var regs = {
      identified: new RegExp(
        "\\b(" + ["unidentified"].map(escapeRegExp).join("|") + ")\\b",
        "i"
      ),
      men: new RegExp(
        "\\b(" + ["man", "men"].map(escapeRegExp).join("|") + ")\\b",
        "i"
      ),
      women: new RegExp(
        "\\b(" + ["woman", "women"].map(escapeRegExp).join("|") + ")\\b",
        "i"
      ),
      children: new RegExp(
        "\\b(" + ["child", "children"].map(escapeRegExp).join("|") + ")\\b",
        "i"
      ),
    };
    items.forEach(function (it) {
      var txt =
        (it.indexed_topics || "") +
        " " +
        (it.topic || "") +
        " " +
        (it.name || "") +
        " " +
        (it.title || "");
      for (var k in regs) {
        if (regs[k].test(txt)) out[k]++;
      }
    });
    return out;
  }

  // classify a single record into men/women/children/other (uses topicKeywords above)
  function classifyRecord(item) {
    if (!item) return "other";
    var txt =
      (item.indexed_topics || "") +
      " " +
      (item.topic || "") +
      " " +
      (item.name || "") +
      " " +
      (item.title || "") +
      " " +
      (item.indexed_names || "");
    txt = txt.toLowerCase();
    // whole-word checks
    if (/\b(identified)\b/i.test(txt)) return "identified";
    // if (/\b(u|children)\b/i.test(txt)) return "children";
    if (/\b(child|children)\b/i.test(txt)) return "children";
    if (/\b(woman|women)\b/i.test(txt)) return "women";
    if (/\b(man|men)\b/i.test(txt)) return "men";
    return "other";
  }

  // open a fullscreen chart overlay that draws one bar per record and colors by classification
  function showFullscreenChart(items) {
    if (!items || !items.length) return;

    // avoid duplicate overlay
    var existing = document.getElementById("fullscreen-bar-chart");
    if (existing) existing.parentNode.removeChild(existing);

    var overlay = document.createElement("div");
    overlay.id = "fullscreen-bar-chart";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "100010";
    overlay.style.background = "rgba(0,0,0,0.92)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.padding = "18px";
    overlay.style.overflow = "auto";
    document.body.appendChild(overlay);

    var container = document.createElement("div");
    container.style.width =
      "min(98vw, " + Math.max(800, items.length * 10) + "px)";
    container.style.maxWidth = "98vw";
    container.style.background = "transparent";
    overlay.appendChild(container);

    var closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    closeBtn.style.position = "fixed";
    closeBtn.style.top = "18px";
    closeBtn.style.right = "18px";
    closeBtn.style.zIndex = "100020";
    closeBtn.style.padding = "8px 12px";
    closeBtn.style.background = "#fff";
    closeBtn.style.color = "#111";
    closeBtn.style.border = "none";
    closeBtn.style.borderRadius = "6px";
    closeBtn.style.cursor = "pointer";
    overlay.appendChild(closeBtn);

    // UPDATED: close overlay and navigate back to gallery.html with reset param
    closeBtn.onclick = function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      try {
        var path = (window.location.pathname || "").toLowerCase();
        // If already on gallery page, enforce default legend state in-place
        if (/gallery\.html$/.test(path) || path.indexOf("/gallery") !== -1) {
          setLegendDefault();
        } else {
          // navigate to gallery and request reset of legend defaults
          window.location.href = "gallery.html?reset=1";
        }
      } catch (err) {}
    };

    // chart dimensions
    var margin = { top: 24, right: 12, bottom: 140, left: 48 };
    // fixed 2px bar width as requested
    var barW = 2;
    // small spacing between bars (1px gap)
    var gap = 1;
    var innerW = Math.max(800, items.length * (barW + gap));
    var width = innerW + margin.left + margin.right;
    var height = 560;

    // create svg using d3 for convenience with scales/axes
    var svg = d3
      .select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("display", "block");

    // x scale uses index positions so each record has its own band
    var x = d3
      .scaleBand()
      .domain(d3.range(items.length).map(String))
      .range([margin.left, margin.left + innerW])
      .padding(0.0); // no extra padding — we'll center the 2px bars manually

    // since each record is one item, y domain can be [0,1] to show full-height bars
    var y = d3
      .scaleLinear()
      .domain([0, 1])
      .range([height - margin.bottom, margin.top]);

    // color mapping
    var colorMap = {
      men: "#4c9aff",
      women: "#d4fe72",
      children: "#f666fdff",
      other: "#777",
    };

    // compute a centered offset so the small 2px bar sits in the band
    function centeredX(i) {
      var band = x.bandwidth();
      var base = x(String(i));
      // if band < barW then align to base (no negative offset)
      var offset = Math.max(0, (band - barW) / 2);
      return base + offset;
    }

    // draw bars; use fixed barW for each rect
    var bars = svg
      .append("g")
      .selectAll("rect")
      .data(items)
      .join("rect")
      .attr("x", function (d, i) {
        return centeredX(i);
      })
      .attr("y", function () {
        return y(1);
      })
      .attr("width", barW)
      .attr("height", function () {
        return y(0) - y(1);
      })
      .attr("fill", function (d) {
        var k = classifyRecord(d);
        return colorMap[k] || colorMap.other;
      })
      .style("opacity", 0.95);

    // --- New: draw a single white line for total counts per year block ---
    // helper: extract year from record (first match)
    function extractYearFromRecord(it) {
      if (!it) return null;
      var raw = it.date ?? it.dates ?? it.indexed_dates ?? it.objectDate ?? "";
      if (Array.isArray(raw)) raw = raw.length ? raw[0] : "";
      raw = String(raw || "");
      var m = raw.match(/(17|18|19|20)\d{2}/);
      return m ? m[0] : null;
    }

    var yearsArr = items.map(extractYearFromRecord);
    // group contiguous blocks to find start/end indices for each year
    var yearBlocks = [];
    for (var i = 0; i < yearsArr.length; i++) {
      var yr = yearsArr[i] || "__NOYEAR__";
      if (!yearBlocks.length || yearBlocks[yearBlocks.length - 1].year !== yr) {
        yearBlocks.push({ year: yr, start: i, end: i, indices: [i] });
      } else {
        var b = yearBlocks[yearBlocks.length - 1];
        b.end = i;
        b.indices.push(i);
      }
    }

    // compute total counts per year block
    var totalPoints = [];
    var maxCount = 0;
    // include the midpoint index so we can reference tick positions later
    yearBlocks.forEach(function (b) {
      var total = b.indices.length; // simpler: block length
      maxCount = Math.max(maxCount, total);
      var mid = Math.floor((b.start + b.end) / 2);
      var xPos = centeredX(mid) + Math.round(barW / 2);
      totalPoints.push({ year: b.year, x: xPos, count: total, mid: mid });
    });

    if (maxCount > 0) {
      var yCounts = d3
        .scaleLinear()
        .domain([0, maxCount])
        .nice()
        .range([height - margin.bottom, margin.top + 6]);

      // left axis for counts
      svg
        .append("g")
        .attr("transform", "translate(" + (margin.left - 8) + ",0)")
        .call(
          d3
            .axisLeft(yCounts)
            .ticks(Math.min(6, maxCount))
            .tickFormat(d3.format("d"))
        )
        .selectAll("text")
        .attr("fill", "#fff");

      // line generator for total counts (white)
      var lineGenTotal = d3
        .line()
        .x(function (d) {
          return d.x;
        })
        .y(function (d) {
          return yCounts(d.count);
        })
        .curve(d3.curveMonotoneX);

      svg
        .append("path")
        .datum(totalPoints)
        .attr("d", lineGenTotal)
        .attr("fill", "none")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .attr("opacity", 0.95);

      // white markers
      svg
        .append("g")
        .selectAll("circle.total")
        .data(totalPoints)
        .join("circle")
        .attr("class", "total")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => yCounts(d.count))
        .attr("r", 3)
        .attr("fill", "#fff")
        .attr("stroke", "#000")
        .attr("stroke-width", 0.4);
    }

    // add thin count markers (optional)
    // Build ticks: only the first bar (index 0), the midpoint of the peak block, and the last block midpoint.
    var tickValues = [];
    var tickLabelMap = {};

    // find peak block (first occurrence of max count)
    var peakMid = null;
    if (totalPoints.length) {
      var peakIdx = 0;
      for (var i = 1; i < totalPoints.length; i++) {
        if (totalPoints[i].count > totalPoints[peakIdx].count) peakIdx = i;
      }
      peakMid = totalPoints[peakIdx].mid;
      if (peakMid != null && String(peakMid) !== "0") {
        tickValues.push(String(peakMid));
        // label preference: use extracted year for that block or fallback to item title
        tickLabelMap[String(peakMid)] =
          totalPoints[peakIdx].year &&
          totalPoints[peakIdx].year !== "__NOYEAR__"
            ? totalPoints[peakIdx].year
            : (items[peakMid] &&
                (items[peakMid].title || items[peakMid].name)) ||
              String(peakMid + 1);
      }
    }

    // last block midpoint
    var lastMid = null;
    if (yearBlocks.length) {
      var lastB = yearBlocks[yearBlocks.length - 1];
      lastMid = Math.floor((lastB.start + lastB.end) / 2);
      if (String(lastMid) !== "0" && (!peakMid || lastMid !== peakMid)) {
        tickValues.push(String(lastMid));
        tickLabelMap[String(lastMid)] =
          lastB.year && lastB.year !== "__NOYEAR__"
            ? lastB.year
            : (items[lastMid] &&
                (items[lastMid].title || items[lastMid].name)) ||
              String(lastMid + 1);
      }
    }

    // ensure numeric sort & unique
    tickValues = Array.from(new Set(tickValues.map(Number)))
      .sort(function (a, b) {
        return a - b;
      })
      .map(String);

    var xAxis = d3
      .axisBottom(x)
      .tickValues(tickValues)
      .tickFormat(function (v) {
        return tickLabelMap[String(v)] || "";
      })
      .tickSize(4);

    svg
      .append("g")
      .attr("transform", "translate(0," + (height - margin.bottom) + ")")
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.6em")
      .attr("dy", "-0.6em")
      .attr("transform", "rotate(-90)")
      .style("font-size", "4px")
      .each(function () {
        // make labels selectable small
      });

    // Top axis: show the same tick labels (one per contiguous-year block) above the chart.
    // Appending this after other elements ensures it renders on top visually.
    var topAxis = d3
      .axisTop(x)
      .tickValues(tickValues)
      .tickFormat(function (v) {
        return tickLabelMap[String(v)] || "";
      })
      .tickSize(0);

    var topG = svg
      .append("g")
      .attr("transform", "translate(0," + (margin.top - 8) + ")")
      .call(topAxis);

    // style top axis labels for readability and ensure they are centered
    topG
      .selectAll("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-.2em")
      .style("fill", "#fff")
      .style("font-size", "11px");

    // soften any tick lines for the top axis
    topG.selectAll("path, line").attr("stroke", "rgba(255,255,255,0.08)");

    // Y axis (simple with 0/1 ticks)
    var yAxis = d3.axisLeft(y).ticks(1).tickFormat("");
    svg
      .append("g")
      .attr("transform", "translate(" + margin.left + ",0)")
      .call(yAxis);

    // interactive fullscreen legend that DOES NOT call header buttons
    var legend = svg
      .append("g")
      .attr("transform", "translate(" + (margin.left + 8) + "," + 8 + ")");
    var entries = ["men", "women", "children"];

    // local active state for the overlay only — does not touch global activeTopic
    var overlayActive = null;

    entries.forEach(function (k, idx) {
      var g = legend
        .append("g")
        .attr("transform", "translate(" + idx * 110 + ",0)")
        .style("cursor", "pointer");

      var rect = g
        .append("rect")
        .attr("x", 0)
        .attr("y", -10)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", colorMap[k])
        .attr("data-key", k);

      g.append("text")
        .attr("x", 20)
        .attr("y", 0)
        .attr("fill", "#fff")
        .attr("font-size", 12)
        .text(k);

      // overlay-only click handler: toggle overlayActive and update only overlay visuals
      g.on("click", function (event) {
        // prevent any accidental bubbling
        if (event && event.stopPropagation) event.stopPropagation();

        // toggle overlayActive
        overlayActive = overlayActive === k ? null : k;

        // update legend rectangles opacity to indicate active state
        legend.selectAll("rect").each(function () {
          var key = this.getAttribute("data-key");
          if (!overlayActive) this.setAttribute("opacity", 1);
          else this.setAttribute("opacity", key === overlayActive ? 1 : 0.28);
        });

        // update bars: show only active class (if any) or all — only within overlay
        bars
          .transition()
          .duration(120)
          .style("opacity", function (d) {
            var cls = classifyRecord(d);
            if (!overlayActive) return 1;
            return cls === overlayActive ? 1 : 0.12;
          });
      });
    });

    // Make container scrollable horizontally if wide
    if (innerW > 900) {
      container.style.overflowX = "auto";
      container.style.maxWidth = "98vw";
    } else {
      container.style.overflowX = "hidden";
    }
  }

  // update bar active state and labels after filter change
  function updateChartUI() {
    var wrap = document.getElementById("topic-bar-chart");
    if (!wrap) return;
    Array.from(wrap.querySelectorAll(".topic-bar")).forEach(function (col) {
      var t = col.dataset.topic;
      if (activeTopic === t) {
        col.querySelector("div").style.outline =
          "3px solid rgba(255,255,255,0.12)";
        col.querySelector("div").style.opacity = "1";
      } else {
        col.querySelector("div").style.outline = "none";
        col.querySelector("div").style.opacity = activeTopic ? "0.45" : "0.95";
      }
    });
    // update labels counts as well (in case they changed)
    var counts = countTopics(silhouettes || []);
    Array.from(wrap.querySelectorAll(".topic-bar")).forEach(function (col) {
      var t = col.dataset.topic;
      col.querySelector("div + div").textContent = t + " (" + counts[t] + ")";
    });
  }

  // rewire the legend buttons so they also update chart UI (replace old wiring)
  var ids = ["identified", "men", "women", "children"];
  ids.forEach(function (id) {
    var btn = document.getElementById(id);
    if (!btn) return;
    // remove previous handlers if any by cloning node
    var newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener("click", function () {
      // toggle single active topic like before
      if (activeTopic === id) {
        activeTopic = null;
        newBtn.classList.remove("active");
      } else {
        if (activeTopic) {
          var prev = document.getElementById(activeTopic);
          if (prev) prev.classList.remove("active");
        }
        activeTopic = id;
        newBtn.classList.add("active");
      }
      // var filtered = filterByTopic(silhouettes || [], activeTopic);
      document.documentElement.className = ""; // reset all filters
      document.documentElement.classList.toggle(
        "filter-" + id,
        activeTopic === id
      );
      // renderGallery(filtered);
      // updateChartUI();
    });
  });

  // move select button to the left of the first legend button (if present)
  (function moveSelectBtnBeforeLegend() {
    var selectBtnEl = document.getElementById("select-btn");
    if (!selectBtnEl) return;
    // find first existing legend button and insert selectBtn before it
    for (var i = 0; i < ids.length; i++) {
      var legend = document.getElementById(ids[i]);
      if (legend && legend.parentNode) {
        legend.parentNode.insertBefore(selectBtnEl, legend);
        return;
      }
    }
  })();

  // precompute the silhouettes from the loaded dataset so `allSilhouette` exists
  // simple: collect silhouette items
  var silhouettes = [];
  for (var i = 0; i < data.length; i++) {
    var item = data[i];
    var text =
      (item.objectType || "") +
      " " +
      (item.indexed_object_types || "") +
      " " +
      (item.physicalDescription || "");
    if (text.toLowerCase().indexOf("silhouette") !== -1) {
      silhouettes.push(item);
    }
  }
  console.log("silhouettes:", silhouettes.length);

  // simple helper to get an image URL
  function getImageUrl(item) {
    var keys = ["primaryImage", "image_url", "thumbnail", "image"];
    for (var k = 0; k < keys.length; k++) {
      if (item[keys[k]]) return item[keys[k]];
    }
    if (item.images && item.images.length) {
      var first = item.images[0];
      if (typeof first === "string") return first;
      if (first && first.url) return first.url;
    }
    return "images/placeholder.jpg";
  }

  function findDataFromFilename(filename) {
    if (!filename) return null;
    const foundImages = data.filter((img) => img.filename === filename);
    return foundImages.length > 0 ? foundImages[0] : null;
  }

  // render gallery helper (keeps initial render and filtered updates simple)
  var gallery = document.getElementById("gallery");
  function renderGallery(items) {
    if (!gallery) return;
    gallery.innerHTML = "";
    var frag = document.createDocumentFragment();
    for (var j = 0; j < items.length; j++) {
      var it = items[j];
      var url = it.thumbnail;
      var cell = document.createElement("div");
      cell.className = "gallery-item";

      var txt =
        (it.indexed_topics || "") +
        " " +
        (it.topic || "") +
        " " +
        (it.name || "") +
        " " +
        (it.title || "") +
        " " +
        (it.indexed_names || "");
      txt = txt.toLowerCase();
      if (
        txt.includes(topicKeywords.identified[0]) ||
        txt.includes(topicKeywords.identified[1])
      ) {
        cell.classList.add("identified");
      } else if (
        txt.includes(topicKeywords.men[0]) ||
        txt.includes(topicKeywords.men[1])
      ) {
        cell.classList.add("men");
      } else if (
        txt.includes(topicKeywords.women[0]) ||
        txt.includes(topicKeywords.women[1])
      ) {
        cell.classList.add("women");
      } else if (
        txt.includes(topicKeywords.children[0]) ||
        txt.includes(topicKeywords.children[1])
      ) {
        cell.classList.add("children");
      }
      var img = document.createElement("img");
      img.src = url;
      img.dataset.filename = it.filename ?? null;

      img.alt = (it.title || it.name || "silhouette").replace(/"/g, "");
      img.loading = "lazy";
      img.className = "gallery-img";
      cell.appendChild(img);
      frag.appendChild(cell);
    }
    gallery.appendChild(frag);
  }

  // initial display: show all silhouettes
  renderGallery(silhouettes);
  // build chart and set initial UI
  var counts = countTopics(silhouettes);
  // buildBarChart(counts);
  updateChartUI();

  // When at least one thumbnail is selected, show the "View Collection" button (selectBtn).
  var selectBtn = document.getElementById("select-btn");
  var largeGallery = document.getElementById("large-gallery");
  var carouselIndex = 0;
  var carouselImages = [];

  // hide view button initially (if present)
  if (selectBtn) {
    selectBtn.style.display = "none";
    selectBtn.textContent = "View Collection";
    selectBtn.addEventListener("click", function () {
      var selectedThumbs = document.querySelectorAll(
        ".gallery-item.selected img, .col.selected img"
      );
      if (!selectedThumbs || selectedThumbs.length === 0) return;

      carouselImages = Array.from(selectedThumbs).map(function (img) {
        var found = findDataFromFilename(img.dataset.filename);
        return {
          src: img.src,
          alt: img.alt,
          // reuse existing logic for siloSrc
          siloSrc: img.dataset.filename
            ? "https://github.com/PGDV-5200-2025F-A/silhouettes/raw/refs/heads/main/imgs/04_silhouetted/" +
              img.dataset.filename +
              ".png"
            : null,
          item: found || null,
          // siloSrc: img.dataset.filename
          //   ? "https://pgdv-5200-2025f-a.github.io/silhouettes/imgs/00_original/" +
          //     img.dataset.filename +
          //     ".jpg"
          //   : null,
          // item: found || null,
        };
      });

      if (carouselImages.length === 0) return;

      if (largeGallery) {
        largeGallery.innerHTML = `
    <button class="close-btn">Close</button>
    <div class="carousel-outer">
      <button class="carousel-prev">&#8592;</button>
      <div class="carousel-image-area"></div>
      <button class="carousel-next">&#8594;</button>
    </div>
  `;
        largeGallery.classList.remove("hidden");
        carouselIndex = 0;
        showCarouselImages();

        largeGallery.querySelector(".close-btn").onclick = function () {
          largeGallery.classList.add("hidden");
        };
        largeGallery.querySelector(".carousel-prev").onclick = function () {
          carouselIndex = Math.max(0, carouselIndex - 1);
          showCarouselImages();
        };
        largeGallery.querySelector(".carousel-next").onclick = function () {
          var visibleCount = Math.min(3, carouselImages.length);
          carouselIndex = Math.min(
            carouselImages.length - visibleCount,
            carouselIndex + 1
          );
          showCarouselImages();
        };
      }

      // clear selections and hide the view button
      document
        .querySelectorAll(".gallery-item.selected, .col.selected")
        .forEach(function (item) {
          item.classList.remove("selected");
        });
      if (selectBtn) selectBtn.style.display = "none";
    });
  }

  // delegate clicks on thumbnails: always allow toggling selection
  var galleryEl = document.getElementById("gallery");
  if (galleryEl) {
    galleryEl.addEventListener("click", function (e) {
      var item = e.target.closest(".gallery-item, .col");
      if (!item) return;
      item.classList.toggle("selected");
      // show/hide View Collection button based on selection count
      var selectedCount = document.querySelectorAll(
        ".gallery-item.selected, .col.selected"
      ).length;
      if (selectBtn) {
        selectBtn.style.display = selectedCount > 0 ? "" : "none";
      }
    });
  }

  // replace showCarouselImages with a fixed version that appends images and optional captions
  function showCarouselImages() {
    var area = document.querySelector(".carousel-image-area");
    if (!area || carouselImages.length === 0) return;
    area.innerHTML = "";

    // Number of images to show at once (e.g. 3)
    var visibleCount = Math.min(3, carouselImages.length);
    // Clamp carouselIndex so it doesn't go out of bounds
    if (carouselIndex > carouselImages.length - visibleCount) {
      carouselIndex = carouselImages.length - visibleCount;
    }
    if (carouselIndex < 0) carouselIndex = 0;

    var container = document.createElement("div");
    container.classList.add("carousel-image-collection");

    for (var i = carouselIndex; i < carouselIndex + visibleCount; i++) {
      if (!carouselImages[i]) continue;
      var imgData = carouselImages[i];

      var frame = document.createElement("div");
      frame.classList.add("carousel-image-container");

      //look a this to move to the other main.js//
      var img = document.createElement("img");
      img.src = imgData.src;
      console.log(imgData);
      img.alt = imgData.alt || "";
      // img.style.width = "100%";

      // img.style.maxWidth = "900px";
      // img.style.maxHeight = "90vh";
      // img.style.borderRadius = "16px";
      // img.style.boxShadow = "0 4px 32px rgba(0,0,0,0.45)";
      // img.style.objectFit = "contain";

      // var silo = document.createElement("img");
      // silo.src = imgData.siloSrc;
      // console.log(imgData);
      // silo.alt = imgData.alt || "";
      // silo.style.position = "absolute";
      // silo.style.top = "0px";
      // // silo.style.left = "0px";
      // silo.style.width = "100%";
      // silo.style.maxWidth = "900px";
      // silo.style.maxHeight = "90vh";
      // silo.style.borderRadius = "16px";
      // silo.style.boxShadow = "0 4px 32px rgba(0,0,0,0.45)";
      // silo.style.objectFit = "contain";

      // ...existing code...
      var frame = document.createElement("div");
      frame.classList.add("carousel-image-container");

      var img = document.createElement("img");
      img.src = imgData.src;
      img.alt = imgData.alt || "";
      // use CSS classes instead of inline styles
      img.classList.add("carousel-img");

      var silo = document.createElement("img");
      silo.src = imgData.siloSrc;
      silo.alt = imgData.alt || "";
      silo.classList.add("silo-img");

      frame.appendChild(img);
      frame.appendChild(silo);
      // ...existing code...

      //////////////////////////////////////////

      // if we matched a JSON item, show a small caption/metadata
      if (imgData.item) {
        var caption = document.createElement("div");
        caption.style.maxWidth = "360px";
        caption.style.marginTop = "12px";
        caption.style.color = "#fff";
        caption.style.textAlign = "center";
        caption.style.fontSize = "14px";
        caption.style.lineHeight = "1.2";

        var title = imgData.item.title || imgData.item.name || "";
        var date = imgData.item.date || imgData.item.indexed_dates || "";
        // var credit = imgData.item.creditLine || "";

        var places = imgData.item.places || imgData.item.indexed_places || "";
        caption.innerHTML =
          (title ? "<strong>" + title + "</strong><br/>" : "") +
          (date ? String(date) + "<br/>" : "") +
          // (credit ? String(credit) + "<br/>" : "") +
          (places ? String(places) : "");
        +frame.appendChild(caption);
      }

      container.appendChild(frame);
    }

    area.appendChild(container);

    // basic area styling (keeps previous layout intentions)
    area.style.display = "flex";
    area.style.alignItems = "center";
    area.style.justifyContent = "center";
    area.style.width = "100vw";
    area.style.overflow = "hidden";
  }

  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }
});
// .catch(function (err) {
//   console.error("Failed to load JSON:", err);
// });
