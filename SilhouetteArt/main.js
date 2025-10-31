/**
 * Landing + Gallery Module (Vanilla, Accessible, Performant)
 * - Keyboard accessible overlay & carousel (Esc/Arrows/Focus trap)
 * - CSS-only filtering via <html class="filter-*> (persisted to URL/localStorage)
 */

(() => {
  // =========================
  // Utilities
  // =========================
  const whenDocumentReady = (fn) =>
    document.readyState === "loading"
      ? document.addEventListener("DOMContentLoaded", fn, { once: true })
      : fn();

  const select = (sel, scope = document) => scope.querySelector(sel);
  const selectAll = (sel, scope = document) =>
    Array.from(scope.querySelectorAll(sel));

  const escapeRegExp = (str) =>
    String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const clampIndex = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const localStore = {
    get(key, fallback = null) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {}
    },
  };

  const createAbortController = () => new AbortController();

  const prefetchImg = (src) => {
    if (!src) return;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "image";
    link.href = src;
    document.head.appendChild(link);
  };

  // =========================
  // Config
  // =========================
  const DATA_JSON_URL = "data/dataset_silhouettes_only_with_filename.json";
  const FILTER_BUTTON_IDS = [
    "politics",
    "identified",
    "men",
    "women",
    "children",
  ];
  const STORAGE_KEYS = { activeTopic: "silhouette.activeTopic" };

  const TOPIC_KEYWORDS = {
    politics: ["president", "presidents", "politics", "political"],
    identified: ["unidentified"],
    men: [" man", " men"],
    women: [" woman", " women"],
    children: ["child", "children"],
  };

  const getTopicRegexes = (topic) =>
    (TOPIC_KEYWORDS[topic] || (topic ? [topic] : [])).map(
      (k) => new RegExp(`\\b${escapeRegExp(k)}\\b`, "i")
    );

  // =========================
  // Overlay (focus trap + a11y)
  // =========================
  class Overlay {
    /**
     * @param {HTMLElement} overlayEl
     * @param {HTMLElement} openButton
     */
    constructor(overlayEl, openButton) {
      this.overlayEl = overlayEl;
      this.openButton = openButton;
      this.contentPanel = select(".project-panel", overlayEl);
      this.closeButton = select("#project-overlay-close", overlayEl);
      this.previousFocus = null;
      this.abortController = createAbortController();

      if (this.openButton) {
        this.openButton.addEventListener("click", (e) => this.open(e), {
          signal: this.abortController.signal,
        });
      }
      if (this.closeButton) {
        this.closeButton.addEventListener("click", (e) => this.close(e), {
          signal: this.abortController.signal,
        });
      }

      // backdrop
      this.overlayEl.addEventListener(
        "click",
        (e) => {
          if (e.target === this.overlayEl) this.close(e);
        },
        { signal: this.abortController.signal }
      );

      // keys
      this.overlayEl.addEventListener(
        "keydown",
        (e) => {
          if (e.key === "Escape") this.close(e);
          if (
            e.key === "Tab" &&
            this.overlayEl.getAttribute("aria-hidden") !== "true"
          ) {
            this.trapFocus(e);
          }
        },
        { signal: this.abortController.signal }
      );
    }

    destroy() {
      this.abortController.abort();
    }

    open(e) {
      if (e) e.preventDefault();
      this.previousFocus = document.activeElement;
      this.overlayEl.classList.remove("hidden");
      this.overlayEl.setAttribute("aria-hidden", "false");
      if (this.contentPanel) {
        this.contentPanel.setAttribute("tabindex", "-1");
        this.contentPanel.focus();
      } else {
        this.overlayEl.focus();
      }
    }

    close(e) {
      if (e) e.preventDefault();
      this.overlayEl.classList.add("hidden");
      this.overlayEl.setAttribute("aria-hidden", "true");
      if (
        this.previousFocus &&
        typeof this.previousFocus.focus === "function"
      ) {
        this.previousFocus.focus();
      }
    }

    trapFocus(e) {
      const focusables = selectAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        this.overlayEl
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // =========================
  // Gallery + Carousel
  // =========================
  class Gallery {
    /**
     * @param {Array<Object>} records
     */
    constructor(records) {
      this.records = records;
      this.recordByFilename = new Map();
      records.forEach(
        (r) => r?.filename && this.recordByFilename.set(r.filename, r)
      );

      this.gridEl = select("#gallery");
      this.lightboxEl = select("#large-gallery");
      this.viewCollectionButton = select("#view-btn");
      this.morphButton = select("#morph-btn");

      this.activeTopic = this.loadActiveTopic();
      this.abortController = createAbortController();

      this.silhouetteRecords = records.filter((r) => {
        const text = [
          r.objectType,
          r.indexed_object_types,
          r.physicalDescription,
          r.title,
          r.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return text.includes("silhouette");
      });

      this.renderGrid(this.silhouetteRecords);
      this.setupFilterButtons();
      this.positionViewButton();
      this.enableSelection();
      this.enableViewCollection();
      this.enableMorph();
      this.applyTopicClassToRoot();
    }

    loadActiveTopic() {
      const hashTopic = new URLSearchParams(location.hash.slice(1)).get(
        "topic"
      );
      const savedTopic = localStore.get(STORAGE_KEYS.activeTopic, null);
      return hashTopic || savedTopic || null;
    }

    persistActiveTopic(topic) {
      const params = new URLSearchParams(location.hash.slice(1));
      if (topic) params.set("topic", topic);
      else params.delete("topic");
      const hash = params.toString();
      history.replaceState(null, "", hash ? `#${hash}` : location.pathname);
      localStore.set(STORAGE_KEYS.activeTopic, topic);
    }

    applyTopicClassToRoot() {
      document.documentElement.classList.remove(
        ...FILTER_BUTTON_IDS.map((t) => `filter-${t}`)
      );
      if (this.activeTopic) {
        document.documentElement.classList.add(`filter-${this.activeTopic}`);
      }
      this.persistActiveTopic(this.activeTopic);
      FILTER_BUTTON_IDS.forEach((id) =>
        select(`#${id}`)?.classList.toggle("active", this.activeTopic === id)
      );
    }

    setupFilterButtons() {
      FILTER_BUTTON_IDS.forEach((id) => {
        const button = select(`#${id}`);
        if (!button) return;

        button.addEventListener(
          "click",
          () => {
            this.activeTopic = this.activeTopic === id ? null : id;
            this.applyTopicClassToRoot();
          },
          { signal: this.abortController.signal }
        );

        // prefetch a few images for this topic on hover/focus
        ["mouseenter", "focus"].forEach((evt) =>
          button.addEventListener(
            evt,
            () => {
              const topicRegexes = getTopicRegexes(id);
              const matches = this.silhouetteRecords.filter((r) =>
                this.recordMatchesTopic(r, topicRegexes)
              );
              matches.slice(0, 6).forEach((m) => prefetchImg(m.thumbnail));
            },
            { signal: this.abortController.signal }
          )
        );
      });
    }

    recordMatchesTopic(record, regexes) {
      if (!regexes || regexes.length === 0) return true;
      const text = [
        record.indexed_topics,
        record.topic,
        record.name,
        record.title,
        record.indexed_names,
        record.indexed_object_types,
        record.physicalDescription,
        record.objectType,
      ]
        .filter(Boolean)
        .join(" ");
      return regexes.some((rx) => rx.test(text));
    }

    getTopicClassesForText(text) {
      const lower = text.toLowerCase();
      const classes = [];
      if (TOPIC_KEYWORDS.politics.some((k) => lower.includes(k)))
        classes.push("politics");
      if (TOPIC_KEYWORDS.identified.some((k) => lower.includes(k)))
        classes.push("identified");
      if (TOPIC_KEYWORDS.men.some((k) => lower.includes(k)))
        classes.push("men");
      if (TOPIC_KEYWORDS.women.some((k) => lower.includes(k)))
        classes.push("women");
      if (TOPIC_KEYWORDS.children.some((k) => lower.includes(k)))
        classes.push("children");
      return classes;
    }

    buildCardHTML(record) {
      const text = [
        record.indexed_topics,
        record.topic,
        record.name,
        record.title,
        record.indexed_names,
        record.indexed_object_types,
        record.physicalDescription,
        record.objectType,
      ]
        .filter(Boolean)
        .join(" ");

      const topicClasses = this.getTopicClassesForText(text).join(" ");
      const altText = (record.title || record.name || "silhouette").replace(
        /"/g,
        ""
      );
      const filenameAttr = record.filename
        ? ` data-filename="${record.filename}"`
        : "";

      return `
        <div class="gallery-item ${topicClasses}">
          <img class="gallery-img" src="${record.thumbnail}" alt="${altText}" loading="lazy"${filenameAttr}>
        </div>
      `;
    }

    renderGrid(items) {
      if (!this.gridEl) return;
      this.gridEl.innerHTML = items.map((r) => this.buildCardHTML(r)).join("");
    }

    positionViewButton() {
      if (!this.viewCollectionButton) return;
      for (const id of FILTER_BUTTON_IDS) {
        const filterButton = select(`#${id}`);
        if (filterButton?.parentNode) {
          // insert morph to the left of the view button (in the sticky header)
          if (this.morphButton)
            filterButton.parentNode.insertBefore(
              this.morphButton,
              filterButton
            );
          filterButton.parentNode.insertBefore(
            this.viewCollectionButton,
            filterButton
          );
          break;
        }
      }
      this.viewCollectionButton.style.display = "none";
      this.viewCollectionButton.textContent = "View Collection";
      if (this.morphButton) {
        this.morphButton.style.display = "none";
        this.morphButton.textContent = "Morph";
      }
    }

    enableSelection() {
      if (!this.gridEl) return;
      this.gridEl.addEventListener(
        "click",
        (e) => {
          const cardEl = e.target.closest(".gallery-item, .col");
          if (!cardEl) return;
          cardEl.classList.toggle("selected");

          const selectedCount = selectAll(
            ".gallery-item.selected, .col.selected"
          ).length;
          if (this.viewCollectionButton)
            this.viewCollectionButton.style.display =
              selectedCount > 0 ? "" : "none";
          if (this.morphButton)
            this.morphButton.style.display = selectedCount > 0 ? "" : "none";
        },
        { signal: this.abortController.signal }
      );
    }

    // enableMorph() {
    //   if (!this.morphButton) return;
    //   this.morphButton.addEventListener(
    //     "click",
    //     () => {
    //       const selectedImgs = selectAll(
    //         ".gallery-item.selected img, .col.selected img"
    //       );
    //       const filenames = selectedImgs.map(
    //         (img) => img.dataset.filename || img.src
    //       );
    //       // save selection for sketch.html to read
    //       localStorage.setItem("morphSelection", JSON.stringify(filenames));
    //       // navigate to sketch page
    //       window.location.href = "sketch.html";
    //     },
    //     { signal: this.abortController.signal }
    //   );
    // }

    enableMorph() {
      if (!this.morphButton) return;
      this.morphButton.addEventListener(
        "click",
        () => {
          const selectedImgs = selectAll(
            ".gallery-item.selected img, .col.selected img"
          );
          if (selectedImgs.length === 0) return;
          const filenames = selectedImgs.map(
            (img) => img.dataset.filename || img.src
          );
          // save selection for sketch.html to read
          localStorage.setItem("morphSelection", JSON.stringify(filenames));
          // open sketch.html inside the large-gallery overlay via iframe
          this.openSketchOverlay("sketch.html");
        },
        { signal: this.abortController.signal }
      );
    }

    // ...existing code...
    openSketchOverlay(url) {
      if (!this.lightboxEl) return;
      // remember previous focus so we can restore it on close
      const previousFocus = document.activeElement;

      this.lightboxEl.innerHTML = `
        <button class="close-btn" aria-label="Close overlay">Close</button>
        <div class="carousel-outer" role="dialog" aria-modal="true">
          <iframe id="sketch-frame" src="${url}" title="Sketch" style="width:100%;height:80vh;border:0;" loading="lazy"></iframe>
        </div>
      `;
      this.lightboxEl.classList.remove("hidden");
      this.lightboxEl.setAttribute("aria-hidden", "false");

      const close = () => {
        // remove listeners, hide overlay, restore focus and remove iframe to stop activity
        this.lightboxEl.classList.add("hidden");
        this.lightboxEl.setAttribute("aria-hidden", "true");
        // clear content to stop iframe execution
        this.lightboxEl.innerHTML = "";
        if (previousFocus && typeof previousFocus.focus === "function")
          previousFocus.focus();
        document.removeEventListener("keydown", onKey);
        this.lightboxEl.removeEventListener("click", onBackdrop);
      };

      const onKey = (e) => {
        if (e.key === "Escape") close();
      };

      const onBackdrop = (e) => {
        if (e.target === this.lightboxEl) close();
      };

      const closeBtn = select(".close-btn", this.lightboxEl);
      if (closeBtn) closeBtn.addEventListener("click", close, { once: true });

      document.addEventListener("keydown", onKey);
      this.lightboxEl.addEventListener("click", onBackdrop);
      // focus the dialog region for accessibility
      const dialog = select(".carousel-outer", this.lightboxEl);
      if (dialog) {
        dialog.setAttribute("tabindex", "-1");
        dialog.focus();
      }
    }
    // ...existing code...

    enableViewCollection() {
      if (!this.viewCollectionButton || !this.lightboxEl) return;

      this.viewCollectionButton.addEventListener(
        "click",
        () => {
          const selectedImgs = selectAll(
            ".gallery-item.selected img, .col.selected img"
          );
          if (selectedImgs.length === 0) return;

          const slides = selectedImgs.map((img) => {
            const filename = img.dataset.filename || null;
            const record = filename
              ? this.recordByFilename.get(filename)
              : null;
            const silhouetteUrl = filename
              ? `https://github.com/PGDV-5200-2025F-A/silhouettes/raw/refs/heads/main/imgs/04_silhouetted/${filename}.png`
              : null;
            return { src: img.src, alt: img.alt || "", record, silhouetteUrl };
          });

          Carousel.open(this.lightboxEl, slides);

          // cleanup
          // selectAll(".gallery-item.selected, .col.selected").forEach((el) =>
          //   el.classList.remove("selected")
          // );
          // this.viewCollectionButton.style.display = "none";
        },
        { signal: this.abortController.signal }
      );
    }

    destroy() {
      this.abortController.abort();
    }
  }

  // =========================
  // Carousel (modal/lightbox)
  // =========================
  class Carousel {
    static open(lightboxEl, slides) {
      if (!lightboxEl || !Array.isArray(slides) || slides.length === 0) return;
      const instance = new Carousel(lightboxEl, slides);
      instance.show(0);
    }

    /**
     * @param {HTMLElement} lightboxEl
     * @param {Array<{src:string, alt:string, silhouetteUrl?:string, record?:any}>} slides
     */
    constructor(lightboxEl, slides) {
      this.lightboxEl = lightboxEl;
      this.slides = slides;
      this.currentIndex = 0;
      this.abortController = createAbortController();

      this.lightboxEl.innerHTML = `
        <button class="close-btn" aria-label="Close carousel">Close</button>
        <div class="carousel-outer" role="dialog" aria-modal="true">
          <button class="carousel-prev" aria-label="Previous">&#8592;</button>
          <div class="carousel-image-area"></div>
          <button class="carousel-next" aria-label="Next">&#8594;</button>
        </div>
      `;
      this.lightboxEl.classList.remove("hidden");
      this.lightboxEl.setAttribute("aria-hidden", "false");

      // NOTE: morph button lives in the sticky header, not inside the carousel
      this.slideAreaEl = select(".carousel-image-area", this.lightboxEl);
      this.prevButton = select(".carousel-prev", this.lightboxEl);
      this.nextButton = select(".carousel-next", this.lightboxEl);
      this.closeButton = select(".close-btn", this.lightboxEl);
      // ...existing code...

      this.slideAreaEl = select(".carousel-image-area", this.lightboxEl);
      this.prevButton = select(".carousel-prev", this.lightboxEl);
      this.nextButton = select(".carousel-next", this.lightboxEl);
      this.closeButton = select(".close-btn", this.lightboxEl);

      this.prevButton.addEventListener("click", () => this.shift(-1), {
        signal: this.abortController.signal,
      });
      this.nextButton.addEventListener("click", () => this.shift(+1), {
        signal: this.abortController.signal,
      });
      this.closeButton.addEventListener("click", () => this.close(), {
        signal: this.abortController.signal,
      });

      this.lightboxEl.addEventListener(
        "keydown",
        (e) => {
          if (e.key === "ArrowLeft") this.shift(-1);
          if (e.key === "ArrowRight") this.shift(+1);
          if (e.key === "Escape") this.close();
        },
        { signal: this.abortController.signal }
      );
    }

    shift(delta) {
      const visibleCount = Math.min(3, this.slides.length);
      const maxIndex = Math.max(0, this.slides.length - visibleCount);
      this.currentIndex = clampIndex(this.currentIndex + delta, 0, maxIndex);
      this.show(this.currentIndex);
    }

    show(startIndex) {
      if (!this.slideAreaEl) return;

      const visibleCount = Math.min(3, this.slides.length);
      const first = clampIndex(
        startIndex,
        0,
        Math.max(0, this.slides.length - visibleCount)
      );

      const frag = document.createDocumentFragment();
      const container = document.createElement("div");
      container.className = "carousel-image-collection";

      for (let i = 0; i < visibleCount; i++) {
        const slide = this.slides[first + i];
        if (!slide) continue;

        // prefetch the next image for snappier nav
        const nextSlide = this.slides[first + i + 1];
        if (nextSlide) prefetchImg(nextSlide.src);

        const figureEl = document.createElement("figure");
        figureEl.className = "carousel-image-container";

        const imgEl = document.createElement("img");
        imgEl.className = "carousel-img";
        imgEl.src = slide.src;
        imgEl.alt = slide.alt;
        figureEl.appendChild(imgEl);

        if (slide.silhouetteUrl) {
          const overlayImgEl = document.createElement("img");
          overlayImgEl.className = "silo-img";
          overlayImgEl.src = slide.silhouetteUrl;
          overlayImgEl.alt = slide.alt;
          figureEl.appendChild(overlayImgEl);
        }

        if (slide.record) {
          const captionEl = document.createElement("figcaption");
          captionEl.className = "carousel-caption";
          const title = slide.record.title || slide.record.name || "";
          const date = slide.record.date || slide.record.indexed_dates || "";
          const places =
            slide.record.places || slide.record.indexed_places || "";
          captionEl.innerHTML =
            (title ? `<strong>${title}</strong><br/>` : "") +
            (date ? `${String(date)}<br/>` : "") +
            (places ? String(places) : "");
          figureEl.appendChild(captionEl);
        }

        container.appendChild(figureEl);
      }

      this.slideAreaEl.innerHTML = "";
      frag.appendChild(container);
      this.slideAreaEl.appendChild(frag);
    }

    close() {
      // this.lightboxEl.classList.add("hidden");
      // this.lightboxEl.setAttribute("aria-hidden", "true");
      // this.abortController.abort();
      // const lbMorph = this.lightboxEl.querySelector("#lightbox-morph-btn");
      // if (lbMorph && lbMorph.parentNode)
      //   lbMorph.parentNode.removeChild(lbMorph);

      const lbMorph = this.lightboxEl?.querySelector("#lightbox-morph-btn");
      if (lbMorph && lbMorph.parentNode)
        lbMorph.parentNode.removeChild(lbMorph);

      this.lightboxEl.classList.add("hidden");
      this.lightboxEl.setAttribute("aria-hidden", "true");
      this.abortController.abort();
    }
  }

  // =========================
  // Boot
  // =========================
  whenDocumentReady(async () => {
    // Overlay
    const overlayElement = select("#project-overlay");
    const openOverlayButton = select("#readmore-btn");
    if (overlayElement && openOverlayButton)
      new Overlay(overlayElement, openOverlayButton);

    // Data (swap to d3.json if you prefer)
    let records = [];
    try {
      const res = await fetch(DATA_JSON_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      records = await res.json();
    } catch (err) {
      console.error("Failed to load JSON:", err);
      return;
    }

    // Gallery
    new Gallery(records);
  });
})();
