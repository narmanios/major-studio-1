// ================================
// Landing + Gallery Refactor
// ================================

(function () {
  // ---------- small utils ----------
  const onReady = (fn) =>
    document.readyState === "loading"
      ? document.addEventListener("DOMContentLoaded", fn, { once: true })
      : fn();

  const qs = (sel, el = document) => el.querySelector(sel);
  const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  const escapeRegExp = (str) =>
    String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Toggle a class on <html> to drive CSS-only filtering
  const setRootFilterClass = (topic) => {
    const root = document.documentElement;
    root.className = ""; // clear any previous filter-*
    if (topic) root.classList.add(`filter-${topic}`);
  };

  // ---------- overlay (landing) ----------
  function initOverlay() {
    const overlay = qs("#project-overlay");
    const readMoreBtn = qs("#readmore-btn");
    if (!overlay || !readMoreBtn) return;

    const panel = qs(".project-panel", overlay);
    const closeBtn = qs("#project-overlay-close", overlay);

    let restoreFocusTo = null;

    const open = (e) => {
      if (e) e.preventDefault();
      restoreFocusTo = document.activeElement;
      overlay.classList.remove("hidden");
      overlay.setAttribute("aria-hidden", "false");
      if (panel) {
        panel.setAttribute("tabindex", "-1");
        panel.focus();
      }
    };

    const close = (e) => {
      if (e) e.preventDefault();
      overlay.classList.add("hidden");
      overlay.setAttribute("aria-hidden", "true");
      if (restoreFocusTo && typeof restoreFocusTo.focus === "function") {
        restoreFocusTo.focus();
      }
    };

    readMoreBtn.addEventListener("click", open);

    if (closeBtn) closeBtn.addEventListener("click", close);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close(); // backdrop
    });

    // ESC to close
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  // ---------- topic filtering ----------
  const topicKeywords = {
    politics: ["president", "presidents", "politics", "political"],
    identified: ["unidentified"], // we'll do whole-word match, case-insensitive
    men: ["man", "men"],
    women: ["woman", "women"],
    children: ["child", "children"],
  };

  function buildTopicRegexes(topic) {
    const keys = topicKeywords[topic] || (topic ? [topic] : []);
    return keys.map((k) => new RegExp(`\\b${escapeRegExp(k)}\\b`, "i"));
  }

  function itemMatchesTopic(item, topic) {
    if (!topic) return true;
    const regs = buildTopicRegexes(topic);
    const hay = [
      item.indexed_topics,
      item.topic,
      item.name,
      item.title,
      item.indexed_names,
      item.indexed_object_types,
      item.physicalDescription,
      item.objectType,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return regs.some((rx) => rx.test(hay));
  }

  // ---------- gallery + carousel ----------
  function initGallery(data) {
    // pre-filter silhouettes once
    const silhouettes = data.filter((d) => {
      const text = [
        d.objectType,
        d.indexed_object_types,
        d.physicalDescription,
        d.title,
        d.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes("silhouette");
    });

    // index by filename for O(1) lookup
    const byFilename = new Map();
    for (const d of data) if (d.filename) byFilename.set(d.filename, d);

    const gallery = qs("#gallery");
    const largeGallery = qs("#large-gallery");
    const viewCollectionBtn = qs("#view-btn");

    let activeTopic = null;
    let carouselIndex = 0;
    let carouselImages = [];

    // ---- render grid ----
    function topicClassListForText(txt) {
      const t = txt.toLowerCase();
      const classes = [];
      if (topicKeywords.politics.some((k) => t.includes(k)))
        classes.push("politics");
      if (topicKeywords.identified.some((k) => t.includes(k)))
        classes.push("identified");
      if (topicKeywords.men.some((k) => t.includes(k))) classes.push("men");
      if (topicKeywords.women.some((k) => t.includes(k))) classes.push("women");
      if (topicKeywords.children.some((k) => t.includes(k)))
        classes.push("children");
      return classes;
    }

    function renderGallery(items) {
      if (!gallery) return;
      gallery.innerHTML = "";
      const frag = document.createDocumentFragment();

      items.forEach((it) => {
        const cell = document.createElement("div");
        cell.className = "gallery-item";

        const txt = [
          it.indexed_topics,
          it.topic,
          it.name,
          it.title,
          it.indexed_names,
          it.indexed_object_types,
          it.physicalDescription,
          it.objectType,
        ]
          .filter(Boolean)
          .join(" ");

        topicClassListForText(txt).forEach((c) => cell.classList.add(c));

        const img = document.createElement("img");
        img.src = it.thumbnail;
        img.alt = (it.title || it.name || "silhouette").replace(/"/g, "");
        img.loading = "lazy";
        img.className = "gallery-img";
        if (it.filename) img.dataset.filename = it.filename;

        cell.appendChild(img);
        frag.appendChild(cell);
      });

      gallery.appendChild(frag);
    }

    renderGallery(silhouettes);

    // ---- legend (single-active toggle via root class) ----
    const legendIds = ["politics", "identified", "men", "women", "children"];

    legendIds.forEach((id) => {
      const btn = qs(`#${id}`);
      if (!btn || btn.dataset.initialized) return;

      btn.dataset.initialized = "true";
      btn.addEventListener("click", () => {
        const isSame = activeTopic === id;
        activeTopic = isSame ? null : id;

        // button UI
        qsa(".legend-btn.active").forEach((b) => b.classList.remove("active"));
        if (!isSame) btn.classList.add("active");

        // CSS-driven filter (keeps your original approach)
        setRootFilterClass(activeTopic);
      });
    });

    // ---- move "view collection" before first legend button ----
    (function moveViewBtn() {
      if (!viewCollectionBtn) return;
      for (const id of legendIds) {
        const legendBtn = qs(`#${id}`);
        if (legendBtn && legendBtn.parentNode) {
          legendBtn.parentNode.insertBefore(viewCollectionBtn, legendBtn);
          break;
        }
      }
    })();

    // ---- selection toggling + view collection visibility ----
    if (viewCollectionBtn) {
      viewCollectionBtn.style.display = "none";
      viewCollectionBtn.textContent = "View Collection";
    }

    if (gallery) {
      gallery.addEventListener("click", (e) => {
        const item = e.target.closest(".gallery-item, .col");
        if (!item) return;
        item.classList.toggle("selected");

        const selectedCount = qsa(
          ".gallery-item.selected, .col.selected"
        ).length;
        if (viewCollectionBtn) {
          viewCollectionBtn.style.display = selectedCount > 0 ? "" : "none";
        }
      });
    }

    // ---- build carousel images then open modal ----
    function findDataFromFilename(filename) {
      if (!filename) return null;
      return byFilename.get(filename) || null;
    }

    function openCarouselFromSelection() {
      const selectedThumbs = qsa(
        ".gallery-item.selected img, .col.selected img"
      );
      if (selectedThumbs.length === 0) return;

      carouselImages = selectedThumbs.map((img) => {
        const filename = img.dataset.filename || null;
        const item = filename ? findDataFromFilename(filename) : null;
        const siloSrc = filename
          ? `https://github.com/PGDV-5200-2025F-A/silhouettes/raw/refs/heads/main/imgs/04_silhouetted/${filename}.png`
          : null;

        return {
          src: img.src,
          alt: img.alt || "",
          siloSrc,
          item,
        };
      });

      if (!largeGallery) return;

      largeGallery.innerHTML = `
        <button class="close-btn" aria-label="Close carousel">Close</button>
        <div class="carousel-outer" role="dialog" aria-modal="true">
          <button class="carousel-prev" aria-label="Previous">&#8592;</button>
          <div class="carousel-image-area"></div>
          <button class="carousel-next" aria-label="Next">&#8594;</button>
        </div>
      `;

      largeGallery.classList.remove("hidden");
      largeGallery.setAttribute("aria-hidden", "false");
      carouselIndex = 0;
      showCarouselImages();

      qs(".close-btn", largeGallery).onclick = () => {
        largeGallery.classList.add("hidden");
        largeGallery.setAttribute("aria-hidden", "true");
      };

      qs(".carousel-prev", largeGallery).onclick = () => {
        carouselIndex = Math.max(0, carouselIndex - 1);
        showCarouselImages();
      };

      qs(".carousel-next", largeGallery).onclick = () => {
        const visibleCount = Math.min(3, carouselImages.length);
        carouselIndex = Math.min(
          carouselImages.length - visibleCount,
          carouselIndex + 1
        );
        showCarouselImages();
      };

      // arrow keys navigate
      largeGallery.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") qs(".carousel-prev", largeGallery)?.click();
        if (e.key === "ArrowRight") qs(".carousel-next", largeGallery)?.click();
        if (e.key === "Escape") qs(".close-btn", largeGallery)?.click();
      });

      // clear selections and hide the button afterward
      qsa(".gallery-item.selected, .col.selected").forEach((el) =>
        el.classList.remove("selected")
      );
      if (viewCollectionBtn) viewCollectionBtn.style.display = "none";
    }

    if (viewCollectionBtn) {
      viewCollectionBtn.addEventListener("click", openCarouselFromSelection);
    }

    // ---- render the carousel view ----
    function showCarouselImages() {
      const area = qs(".carousel-image-area");
      if (!area || carouselImages.length === 0) return;

      // Clamp index
      const visibleCount = Math.min(3, carouselImages.length);
      carouselIndex = Math.max(
        0,
        Math.min(carouselIndex, carouselImages.length - visibleCount)
      );

      area.innerHTML = "";
      const container = document.createElement("div");
      container.classList.add("carousel-image-collection");

      for (let i = carouselIndex; i < carouselIndex + visibleCount; i++) {
        const imgData = carouselImages[i];
        if (!imgData) continue;

        const frame = document.createElement("div");
        frame.classList.add("carousel-image-container");

        const img = document.createElement("img");
        img.classList.add("carousel-img");
        img.src = imgData.src;
        img.alt = imgData.alt;

        frame.appendChild(img);

        if (imgData.siloSrc) {
          const silo = document.createElement("img");
          silo.classList.add("silo-img");
          silo.src = imgData.siloSrc;
          silo.alt = imgData.alt;
          frame.appendChild(silo);
        }

        if (imgData.item) {
          const caption = document.createElement("div");
          caption.classList.add("carousel-caption");
          const title = imgData.item.title || imgData.item.name || "";
          const date = imgData.item.date || imgData.item.indexed_dates || "";
          const places =
            imgData.item.places || imgData.item.indexed_places || "";
          caption.innerHTML =
            (title ? `<strong>${title}</strong><br/>` : "") +
            (date ? `${String(date)}<br/>` : "") +
            (places ? String(places) : "");
          frame.appendChild(caption);
        }

        container.appendChild(frame);
      }

      area.appendChild(container);
    }
  }

  // ---------- boot ----------
  onReady(() => {
    initOverlay();

    d3.json("data/dataset_silhouettes_only_with_filename.json")
      .then(initGallery)
      .catch((err) => {
        console.error("Failed to load JSON:", err);
      });
  });
})();
