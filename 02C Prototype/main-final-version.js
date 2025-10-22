function getSilhouette(rowData) {
  const mykeys = Object.keys(rowData);
  const xs = [];
  const ys = [];

  for (let k of mykeys) {
    if (k.startsWith("x")) {
      xs.push(rowData[k]);
    }
    if (k.startsWith("y")) {
      ys.push(rowData[k]);
    }
  }

  const points = [];
  for (let idx = 0; idx < xs.length; idx++) {
    points.push({
      x: xs[idx],
      y: ys[idx],
    });
  }
  return points;
}

// async function setup() {
//   createCanvas(windowWidth, windowHeight);
//   noLoop();

//   img.resize(img.width / 4, 0);

//   image(img, 0, 0);

//   fill(255, 0, 0);
//   noStroke();

//   for (let i = 0; i < points.length; i++) {
//     const p = points[i];
//     ellipse(p.x / 4, p.y / 4, 5, 5);
//   }
// }

d3.json("data/revolutionary_silhouettes-original.json")
  .then((data) => {
    console.log(data[0].thumbnail);
    // simple: collect silhouette items

    // render gallery (minimal DOM; uses .gallery-item so Bootstrap .col won't interfere)
    var gallery = document.getElementById("gallery");
    gallery.innerHTML = "";
    var frag = document.createDocumentFragment();

    for (var j = 0; j < data.length; j++) {
      var it = data[j];

      var cell = document.createElement("div");
      cell.className = "gallery-item";

      var img = document.createElement("img");
      img.src = data[j].thumbnail;
      img.alt = (it.title || "silhouette").replace(/"/g, "");
      img.loading = "lazy";
      img.className = "gallery-img";

      cell.appendChild(img);
      frag.appendChild(cell);
    }

    gallery.appendChild(frag);

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
        }, 650); // should be slightly longer than CSS transition
      });
    }

    // Selection mode and carousel logic
    var selectBtn =
      document.querySelector("#legend-top #select-btn") ||
      document.getElementById("select-btn");
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
          img.style.maxWidth = "900px";
          img.style.maxHeight = "90vh";
          img.style.margin = "0 16px";
          img.style.borderRadius = "16px";
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
  })
  .catch(function (err) {
    console.error("Failed to load JSON:", err);
  });
