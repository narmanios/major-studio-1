// Landing / Read More overlay setup (runs independently of d3.json)
(function setupLandingOverlay() {
  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(() => {
    const landing = document.getElementById("landing");
    let overlay = document.getElementById("project-overlay");

    // create overlay if it's not in the HTML
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "project-overlay";
      overlay.className = "project-overlay hidden";
      overlay.innerHTML = `
        <div class="project-panel" role="dialog" aria-modal="true" aria-labelledby="project-overlay-title">
          <h2 id="project-overlay-title">Project: Revolutionary Silhouettes</h2>
          <p>This prototype maps silhouette metadata to portrait dataset entries. Use the legend buttons to filter by sitter type.</p>
          <div class="project-actions"><button id="project-overlay-close" class="enter-btn">Close</button></div>
        </div>`;
      document.body.appendChild(overlay);
    }

    const enterBtn = document.getElementById("enter-btn");
    const readMoreBtn = document.getElementById("readmore-btn");
    const overlayClose = document.getElementById("project-overlay-close");

    if (readMoreBtn) {
      readMoreBtn.addEventListener("click", (e) => {
        e.preventDefault();
        // show the overlay and move focus into the dialog for accessibility
        overlay.classList.remove("hidden");
        var panel = overlay.querySelector(".project-panel");
        if (panel) {
          panel.setAttribute("tabindex", "-1");
          panel.focus();
        }
        console.log("Read More clicked - overlay opened");
      });
    } else {
      console.warn("readmore-btn not found");
    }

    if (overlayClose) {
      overlayClose.addEventListener("click", (e) => {
        e.preventDefault();
        overlay.classList.add("hidden");
      });
    }

    if (overlay) {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.classList.add("hidden");
      });
    }

    if (enterBtn && landing) {
      // keep existing enter behavior but safe if this runs earlier
      enterBtn.addEventListener("click", (e) => {
        e.preventDefault();
        landing.classList.add("hidden");
        setTimeout(() => {
          landing.style.display = "none";
          document.body.classList.remove("no-scroll");
          // scroll to gallery after landing hides
          var galleryEl = document.getElementById("gallery");
          if (galleryEl)
            galleryEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 650);
        overlay.classList.add("hidden");
      });
    }
  });
})();

d3.json("data/dataset_silhouettes_only_with_filename.json")
  .then((data) => {
    ///////////// Filtering ///////////////////////

    // much simpler: single active topic filter (one at a time)
    var activeTopic = null;
    var topicKeywords = {
      men: ["man", "men"],
      women: ["woman", "women"],
      children: ["child", "children"],
    };

    // helper to escape user-provided keywords for regex
    function escapeRegExp(str) {
      return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    // replace filterByTopic with explicit whole-word regex matching
    function filterByTopic(items, topic) {
      if (!topic) return items;
      var keys = topicKeywords[topic] || [topic];
      // build word-boundary, case-insensitive regexes for each keyword
      var regs = keys.map(function (k) {
        return new RegExp("\\b" + escapeRegExp(k) + "\\b", "i");
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

    ///////////// Wiring the buttons + header bar chart ///////////////////////
    // helper: count occurrences using word-boundary regex (uses escapeRegExp above)
    function countTopics(items) {
      var out = { men: 0, women: 0, children: 0 };
      var regs = {
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

    // build a small bar chart using an existing #topic-bar-chart element in the DOM
    function buildBarChart(counts) {
      var wrap = document.getElementById("topic-bar-chart");
      if (!wrap) {
        console.warn(
          'topic-bar-chart element not found. Add <div id="topic-bar-chart"></div> into your index.html.'
        );
        return;
      }

      // clear existing content and apply compact fixed bottom-right styles
      wrap.innerHTML = "";
      wrap.style.position = "fixed";
      wrap.style.right = "12px";
      wrap.style.bottom = "12px";
      wrap.style.zIndex = "9999";
      wrap.style.display = "flex";
      wrap.style.justifyContent = "center";
      wrap.style.gap = "0px";
      wrap.style.alignItems = "flex-end";
      wrap.style.padding = "8px";
      wrap.style.background = "rgba(0,0,0,0.85)";
      // wrap.style.borderRadius = "10px";
      wrap.style.boxShadow = "0 6px 20px rgba(0,0,0,0.35)";
      wrap.style.maxWidth = "320px";
      wrap.style.pointerEvents = "auto";
      wrap.style.color = "#fff";

      var topics = ["men", "women", "children"];
      var max = Math.max(counts.men, counts.women, counts.children, 1);
      topics.forEach(function (t) {
        var col = document.createElement("div");
        col.className = "topic-bar";
        col.dataset.topic = t;
        col.style.cursor = "pointer";
        col.style.display = "flex";
        col.style.flexDirection = "column";
        col.style.alignItems = "center";
        col.style.width = "72px";

        var bar = document.createElement("div");
        // compact bars: max height ~48px
        bar.style.height = Math.round((counts[t] / max) * 48 + 6) + "px";
        bar.style.width = "18px";
        // bar.style.borderRadius = "6px";
        bar.style.transition = "opacity .12s, outline .12s";
        bar.style.background =
          t === "men" ? "#4c9aff" : t === "women" ? "#d4fe72" : "#ffd166";
        bar.style.opacity = "0.95";

        var label = document.createElement("div");
        label.textContent = t + " (" + counts[t] + ")";
        label.style.fontSize = "8px";
        label.style.fontWeight = "bold";

        label.style.marginTop = "8px";
        label.style.color = "#fff";
        label.style.textTransform = "capitalize";

        col.appendChild(bar);
        col.appendChild(label);
        wrap.appendChild(col);

        // click a bar toggles the corresponding button/filter
        col.addEventListener("click", function () {
          var btn = document.getElementById(t);
          if (btn) btn.click(); // reuse existing button handler behavior
        });
      });
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
          col.querySelector("div").style.opacity = activeTopic
            ? "0.45"
            : "0.95";
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
    var ids = ["men", "women", "children"];
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
        var filtered = filterByTopic(silhouettes || [], activeTopic);
        renderGallery(filtered);
        updateChartUI();
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

    // NEW: helper to match a thumbnail src back to the loaded JSON record.
    // It tries exact matches first, then compares normalized filename tails
    // (strip query string and take last path segment) against known image fields.
    function normalizeFilename(url) {
      if (!url) return "";
      try {
        // remove query/hash
        var u = url.split("?")[0].split("#")[0];
        // take last segment
        var parts = u.split("/");
        return parts[parts.length - 1].toLowerCase();
      } catch (e) {
        return String(url).toLowerCase();
      }
    }

    function findDataForImageSrc(src) {
      if (!src) return null;
      var normSrc = normalizeFilename(src);

      // First try exact match against common fields
      for (var i = 0; i < data.length; i++) {
        var it = data[i];
        var keys = ["primaryImage", "image_url", "thumbnail", "image"];
        for (var k = 0; k < keys.length; k++) {
          if (it[keys[k]] && it[keys[k]] === src) return it;
          if (it[keys[k]] && normalizeFilename(it[keys[k]]) === normSrc)
            return it;
        }
        // check images array
        if (it.images && it.images.length) {
          for (var m = 0; m < it.images.length; m++) {
            var img = it.images[m];
            var url = typeof img === "string" ? img : img && img.url;
            if (!url) continue;
            if (url === src || normalizeFilename(url) === normSrc) return it;
          }
        }
      }

      // As a last resort try matching on title or other loose heuristics (optional)
      return null;
    }

    // render gallery helper (keeps initial render and filtered updates simple)
    var gallery = document.getElementById("gallery");
    function renderGallery(items) {
      if (!gallery) return;
      gallery.innerHTML = "";
      var frag = document.createDocumentFragment();
      for (var j = 0; j < items.length; j++) {
        var it = items[j];
        var url = getImageUrl(it);
        var cell = document.createElement("div");
        cell.className = "gallery-item";
        var img = document.createElement("img");
        img.src = url;
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
    buildBarChart(counts);
    updateChartUI();

    // Selection behaviour: click thumbnails to toggle selection.
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
          var found = findDataForImageSrc(img.src);
          return {
            src: img.src,
            alt: img.alt,
            // reuse existing logic for siloSrc
            siloSrc:
              found && found.filename
                ? "https://github.com/PGDV-5200-2025F-A/silhouettes/raw/refs/heads/main/imgs/04_silhouetted/" +
                  found.filename +
                  ".png"
                : null,
            item: found || null,
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
      container.style.display = "flex";
      container.style.alignItems = "center";
      container.style.justifyContent = "center";
      container.style.width = "100%";
      container.style.overflow = "hidden";

      for (var i = carouselIndex; i < carouselIndex + visibleCount; i++) {
        if (!carouselImages[i]) continue;
        var imgData = carouselImages[i];

        var frame = document.createElement("div");
        frame.style.display = "flex";
        frame.style.flexDirection = "column";
        frame.style.alignItems = "center";
        frame.style.margin = "0 16px";

        //look a this to move to the other main.js//
        var img = document.createElement("img");
        img.src = imgData.src;
        console.log(imgData);
        img.alt = imgData.alt || "";
        img.style.maxWidth = "900px";
        img.style.maxHeight = "90vh";
        img.style.borderRadius = "16px";
        img.style.boxShadow = "0 4px 32px rgba(0,0,0,0.45)";
        img.style.objectFit = "contain";

        var silo = document.createElement("img");
        silo.src = imgData.siloSrc;
        console.log(imgData);
        silo.alt = imgData.alt || "";
        silo.style.maxWidth = "900px";
        silo.style.maxHeight = "90vh";
        silo.style.borderRadius = "16px";
        silo.style.boxShadow = "0 4px 32px rgba(0,0,0,0.45)";
        silo.style.objectFit = "contain";

        frame.appendChild(img);
        frame.appendChild(silo);

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
          var people = imgData.item.people || imgData.item.indexed_topics || "";
          caption.innerHTML =
            (title ? "<strong>" + title + "</strong><br/>" : "") +
            (people ? String(people) : "");
          frame.appendChild(caption);
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

    // simple landing "Enter" handler — fade then hide, enable scrolling and jump to gallery
    var landing = document.getElementById("landing");
    var enterBtn = document.getElementById("enter-btn");
    if (landing && enterBtn) {
      // block scrolling while landing is visible
      document.body.classList.add("no-scroll");

      enterBtn.addEventListener("click", function (e) {
        e.preventDefault();
        // fade out
        landing.classList.add("hidden");
        // after transition hide entirely and allow scrolling
        setTimeout(function () {
          landing.style.display = "none";
          document.body.classList.remove("no-scroll");
          // ensure we land at the gallery
          var galleryEl = document.getElementById("gallery");
          if (galleryEl)
            galleryEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 650); // should be slightly longer than CSS transition
      });
    }
  })
  .catch(function (err) {
    console.error("Failed to load JSON:", err);
  });
