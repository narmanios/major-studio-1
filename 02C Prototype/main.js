// Debug: verify script loads and DOM elements exist
console.log("main.js: loaded");
document.addEventListener("DOMContentLoaded", function () {
  console.log("main.js: DOMContentLoaded");
  console.log(
    "project-overlay element:",
    !!document.getElementById("project-overlay")
  );
  console.log(
    "readmore-btn element:",
    !!document.getElementById("readmore-btn")
  );
  console.log("enter-btn element:", !!document.getElementById("enter-btn"));
});
// --- overlay wiring: expect <div id="project-overlay"> to be present in index.html ---
document.addEventListener("DOMContentLoaded", function () {
  const landing = document.getElementById("landing");
  const overlay = document.getElementById("project-overlay"); // MUST be in HTML
  const readMoreBtn = document.getElementById("readmore-btn");
  const overlayClose = document.getElementById("project-overlay-close");
  const exploreBtn = document.getElementById("enter-btn"); // changed: match index.html

  if (!overlay) {
    console.warn(
      "project-overlay element not found in HTML. Add it to index.html to enable Read More."
    );
    return;
  }

  // Open overlay (Read More)
  if (readMoreBtn) {
    readMoreBtn.addEventListener("click", function (e) {
      e.preventDefault();
      overlay.classList.remove("hidden");
      document.body.classList.add("no-scroll");
    });
  }

  // Close overlay (Close button)
  if (overlayClose) {
    overlayClose.addEventListener("click", function (e) {
      e.preventDefault();
      overlay.classList.add("hidden");
      document.body.classList.remove("no-scroll");
    });
  }

  // Close when clicking outside panel
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) {
      overlay.classList.add("hidden");
      document.body.classList.remove("no-scroll");
    }
  });

  // Enter / Explore button behavior (still hides landing)
  if (exploreBtn && landing) {
    document.body.classList.add("no-scroll");
    exploreBtn.addEventListener("click", function (e) {
      e.preventDefault();
      landing.classList.add("hidden");
      setTimeout(function () {
        landing.style.display = "none";
        document.body.classList.remove("no-scroll");
      }, 650);
      overlay.classList.add("hidden");
    });
  }
});
// ...existing code...
document.addEventListener("DOMContentLoaded", function () {
  const readMore = document.getElementById("readmore-btn");
  const overlay = document.getElementById("project-overlay");

  if (!readMore || !overlay) {
    console.warn("readmore-btn or project-overlay not found in DOM");
    return;
  }

  readMore.addEventListener("click", function (e) {
    e && e.preventDefault();
    overlay.classList.remove("hidden");
    document.body.classList.add("no-scroll");
  });
});
// ...existing code...

// async function loadData() {
//   const dataText = await d3.json(
//     "data/revolutionary_silhouettes-original.json"
//   );
//   console.log(dataText);
// }
// loadData();

d3.json("data/dataset_portrait_only.json")
  .then((data) => {
    ///////////// Filtering ///////////////////////

    var selectedTopics = []; // men / women
    var selectedMedia = []; // watercolor, oil, pencil, etching, print, silhouette

    // helpers
    function matchesTopic(item) {
      var s = String(item.indexed_topics || "").toLowerCase();
      for (var i = 0; i < selectedTopics.length; i++) {
        if (s.indexOf(selectedTopics[i]) !== -1) return true;
      }
      return false;
    }

    function matchesMedia(item) {
      var desc = String(item.physicalDescription || "").toLowerCase();
      var idx = String(item.indexed_object_types || "").toLowerCase();
      var obj = String(item.objectType || "").toLowerCase();

      for (var i = 0; i < selectedMedia.length; i++) {
        var m = selectedMedia[i];
        if (m === "print") {
          if (idx.indexOf("print") !== -1) return true;
        } else if (m === "silhouette") {
          if (obj.indexOf("silhouette") !== -1) return true;
        } else {
          // watercolor, oil, pencil, etching
          if (desc.indexOf(m) !== -1) return true;
        }
      }
      return false;
    }

    function computeCombined() {
      var combined = [];
      for (var i = 0; i < data.length; i++) {
        var item = data[i];
        var ok = false;
        if (selectedTopics.length > 0 && selectedMedia.length > 0) {
          // must match both a topic and a media
          ok = matchesTopic(item) && matchesMedia(item);
        } else if (selectedTopics.length > 0) {
          ok = matchesTopic(item);
        } else if (selectedMedia.length > 0) {
          ok = matchesMedia(item);
        } else {
          ok = false; // nothing selected -> no results
        }
        if (ok && combined.indexOf(item) === -1) combined.push(item);
      }
      return combined;
    }

    ///////////// Wiring the buttons ///////////////////////
    var ids = [
      "men",
      "women",
      "watercolor",
      "oil",
      "pencil",
      "etching",
      "print",
      "silhouette",
    ];
    ids.forEach(function (id) {
      var btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener("click", function () {
        // toggle into correct group
        if (id === "men" || id === "women") {
          var p = selectedTopics.indexOf(id);
          if (p === -1) {
            selectedTopics.push(id);
            btn.classList.add("active");
          } else {
            selectedTopics.splice(p, 1);
            btn.classList.remove("active");
          }
        } else {
          var q = selectedMedia.indexOf(id);
          if (q === -1) {
            selectedMedia.push(id);
            btn.classList.add("active");
          } else {
            selectedMedia.splice(q, 1);
            btn.classList.remove("active");
          }
        }

        var combined = computeCombined();
        console.log("selectedTopics:", selectedTopics);
        console.log("selectedMedia:", selectedMedia);
        console.log("combined count:", combined.length);
        console.log("combined matches:", combined);
      });
    });

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

    // render gallery (minimal DOM; uses .gallery-item so Bootstrap .col won't interfere)
    var gallery = document.getElementById("gallery");
    gallery.innerHTML = "";
    var frag = document.createDocumentFragment();

    for (var j = 0; j < silhouettes.length; j++) {
      var it = silhouettes[j];
      var url = getImageUrl(it);

      var cell = document.createElement("div");
      cell.className = "gallery-item";

      var img = document.createElement("img");
      img.src = url;
      img.alt = (it.title || "silhouette").replace(/"/g, "");
      img.loading = "lazy";
      img.className = "gallery-img";

      cell.appendChild(img);
      frag.appendChild(cell);
    }

    gallery.appendChild(frag);

    // Selection mode logic
    // ...existing code...

    // Selection mode and carousel logic
    var selectBtn = document.getElementById("select-btn");
    var selecting = false;
    var selectedItems = [];
    var largeGallery = document.getElementById("large-gallery");
    var carouselIndex = 0;
    var carouselImages = [];

    // Only ONE event listener for selectBtn!
    if (selectBtn) {
      selectBtn.addEventListener("click", function () {
        if (!selecting) {
          // Enter selection mode
          selecting = true;
          selectBtn.textContent = "View Collection";
          selectedItems = [];
          document
            .querySelectorAll(".gallery-item, .col")
            .forEach(function (item) {
              item.classList.remove("selected");
            });
        } else {
          // Show carousel modal
          selecting = false;
          // Collect selected images
          var selectedThumbs = document.querySelectorAll(
            ".gallery-item.selected img, .col.selected img"
          );
          carouselImages = Array.from(selectedThumbs).map(function (img) {
            return { src: img.src, alt: img.alt };
          });
          if (carouselImages.length === 0) return; // nothing selected

          // In your selectBtn event listener, replace showCarouselImage() with showCarouselImages()
          // ...inside your selectBtn event listener, replace the modal build with:
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

            // Close button handler
            largeGallery.querySelector(".close-btn").onclick = function () {
              largeGallery.classList.add("hidden");
            };
            // Prev/Next handlers
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
          // Clear selection highlights
          document
            .querySelectorAll(".gallery-item, .col")
            .forEach(function (item) {
              item.classList.remove("selected");
            });
          selectBtn.textContent = "Select";
        }
      });
    }

    // Delegate click events for thumbnails
    document.getElementById("gallery").addEventListener("click", function (e) {
      if (!selecting) return;
      var item = e.target.closest(".gallery-item, .col");
      if (item) {
        item.classList.toggle("selected");
      }
    });

    // Helper to show all selected images in a horizontal carousel
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

      for (var i = carouselIndex; i < carouselIndex + visibleCount; i++) {
        if (carouselImages[i]) {
          var imgData = carouselImages[i];
          var img = document.createElement("img");
          img.src = imgData.src;
          img.alt = imgData.alt;
          // img.style.maxWidth = "900px";
          // img.style.maxHeight = "90vh";
          img.style.margin = "0 16px";
          // img.style.borderRadius = "16px";
          img.style.boxShadow = "0 4px 32px rgba(0,0,0,0.45)";
          area.appendChild(img);
        }
      }
      area.style.display = "flex";
      area.style.alignItems = "center";
      area.style.justifyContent = "center";
      area.style.width = "100vw";
      area.style.overflow = "hidden";
    }

    // simple landing "Enter" handler — fade then hide, enable scrolling and jump to gallery
    var landing = document.getElementById("landing");
    var exploreBtn = document.getElementById("enter-btn"); // changed: match index.html
    if (landing && exploreBtn) {
      // block scrolling while landing is visible
      document.body.classList.add("no-scroll");

      exploreBtn.addEventListener("click", function (e) {
        e.preventDefault();
        // fade out
        landing.classList.add("hidden");
        // after transition hide entirely and allow scrolling
        setTimeout(function () {
          landing.style.display = "none";
          document.body.classList.remove("no-scroll");
        }, 650); // should be slightly longer than CSS transition
      });
    }
  })
  .catch(function (err) {
    console.error("Failed to load JSON:", err);
  });
