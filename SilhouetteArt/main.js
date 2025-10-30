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
    politics: ["president", "Presidents", "politics", "political"],
    identified: [" Unidentified", " unidentified"],
    men: [" man", " men"],
    women: [" woman", " women"],
    children: [" child", " children"],
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

    // data.map((item) => {
    //   console.log(item);
    //   var txt =
    //     (it.indexed_topics || "") +
    //     " " +
    //     (it.topic || "") +
    //     " " +
    //     (it.name || "") +
    //     " " +
    //     (it.title || "") +
    //     " " +
    //     (it.indexed_names || "");
    //   if (
    //     txt.includes(topicKeywords.men[0]) ||
    //     txt.includes(topicKeywords.men[1])
    //   ) {
    //   } else if (
    //     txt.includes(topicKeywords.women[0]) ||
    //     txt.includes(topicKeywords.women[1])
    //   ) {
    //   } else if (
    //     txt.includes(topicKeywords.children[0]) ||
    //     txt.includes(topicKeywords.children[1])
    //   ) {
    //   }
    //   return item;
    // });

    // return items.filter(function (it) {
    //   var txt =
    //     (it.indexed_topics || "") +
    //     " " +
    //     (it.topic || "") +
    //     " " +
    //     (it.name || "") +
    //     " " +
    //     (it.title || "") +
    //     " " +
    //     (it.indexed_names || "");
    //   for (var r = 0; r < regs.length; r++) {
    //     if (regs[r].test(txt)) return true;
    //   }
    //   return false;
    // });
  }
  // filterByTopic();

  // helper: count occurrences using word-boundary regex (uses escapeRegExp above)
  // function countTopics(items) {
  //   var out = { men: 0, women: 0, children: 0 };
  //   var regs = {
  //     men: new RegExp(
  //       "\\b(" + ["man", "men"].map(escapeRegExp).join("|") + ")\\b",
  //       "i"
  //     ),
  //     women: new RegExp(
  //       "\\b(" + ["woman", "women"].map(escapeRegExp).join("|") + ")\\b",
  //       "i"
  //     ),
  //     children: new RegExp(
  //       "\\b(" + ["child", "children"].map(escapeRegExp).join("|") + ")\\b",
  //       "i"
  //     ),
  //   };
  //   items.forEach(function (it) {
  //     var txt =
  //       (it.indexed_topics || "") +
  //       " " +
  //       (it.topic || "") +
  //       " " +
  //       (it.name || "") +
  //       " " +
  //       (it.title || "");
  //     for (var k in regs) {
  //       if (regs[k].test(txt)) out[k]++;
  //     }
  //   });
  //   return out;
  // }

  // classify a single record into men/women/children/other (uses topicKeywords above)
  // function classifyRecord(item) {
  //   if (!item) return "other";
  //   var txt =
  //     (item.indexed_topics || "") +
  //     " " +
  //     (item.topic || "") +
  //     " " +
  //     (item.name || "") +
  //     " " +
  //     (item.title || "") +
  //     " " +
  //     (item.indexed_names || "");
  //   txt = txt.toLowerCase();
  //   // whole-word checks
  //   if (/\b(child|children)\b/i.test(txt)) return "children";
  //   if (/\b(woman|women)\b/i.test(txt)) return "women";
  //   if (/\b(man|men)\b/i.test(txt)) return "men";
  //   return "other";
  // }

  // wire up legend buttons
  var ids = ["politics", "identified", "men", "women", "children"];
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
  (function moveviewCollectionBtnBeforeLegend() {
    var viewCollectionBtnEl = document.getElementById("view-btn");
    if (!viewCollectionBtnEl) return;
    // find first existing legend button and insert viewCollectionBtn before it
    for (var i = 0; i < ids.length; i++) {
      var legend = document.getElementById(ids[i]);
      if (legend && legend.parentNode) {
        legend.parentNode.insertBefore(viewCollectionBtnEl, legend);
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
  // function getImageUrl(item) {
  //   var keys = ["primaryImage", "image_url", "thumbnail", "image"];
  //   for (var k = 0; k < keys.length; k++) {
  //     if (item[keys[k]]) return item[keys[k]];
  //   }
  //   if (item.images && item.images.length) {
  //     var first = item.images[0];
  //     if (typeof first === "string") return first;
  //     if (first && first.url) return first.url;
  //   }
  //   return "images/placeholder.jpg";
  // }

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
        txt.includes(topicKeywords.politics[0]) ||
        txt.includes(topicKeywords.politics[1]) ||
        txt.includes(topicKeywords.politics[2]) ||
        txt.includes(topicKeywords.politics[3])
      ) {
        cell.classList.add("politics");
      }
      if (
        txt.includes(topicKeywords.identified[0]) ||
        txt.includes(topicKeywords.identified[1])
      ) {
        cell.classList.add("identified");
      }

      if (
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

  renderGallery(silhouettes);

  // When at least one thumbnail is selected, show the "View Collection" button (viewCollectionBtn).
  var viewCollectionBtn = document.getElementById("view-btn");
  var largeGallery = document.getElementById("large-gallery");
  var carouselIndex = 0;
  var carouselImages = [];

  // hide view button initially (if present)
  if (viewCollectionBtn) {
    viewCollectionBtn.style.display = "none";
    viewCollectionBtn.textContent = "View Collection";

    viewCollectionBtn.addEventListener("click", function () {
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
      if (viewCollectionBtn) viewCollectionBtn.style.display = "none";
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
      if (viewCollectionBtn) {
        viewCollectionBtn.style.display = selectedCount > 0 ? "" : "none";
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
      img.classList.add("carousel-img");

      // create silo image separately:
      var silo = document.createElement("img");
      silo.src = imgData.siloSrc;
      silo.classList.add("silo-img");

      img.style.width = "100%";

      img.style.maxWidth = "900px";
      img.style.maxHeight = "90vh";
      img.style.borderRadius = "6px";
      img.style.boxShadow = "0 4px 32px rgba(0,0,0,0.45)";
      img.style.objectFit = "contain";

      var silo = document.createElement("img");
      silo.src = imgData.siloSrc;
      console.log(imgData);
      silo.alt = imgData.alt || "";
      silo.style.position = "absolute";
      silo.style.top = "0px";
      // silo.style.left = "0px";
      silo.style.width = "100%";
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
