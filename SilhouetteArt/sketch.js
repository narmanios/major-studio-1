gsap.registerPlugin(MorphSVGPlugin);

// TODO: update these to your actual paths (URL-encode spaces or just rename files).
const URL1 = "assets/svgs/00097.svg"; // was “silhouette_traced_hat 1.svg”
const URL2 = "assets/svgs/00098.svg"; // was “silhouette_traced_full_detail 1.svg”
// when click on array of images from these images morph them into each other

const stage = document.getElementById("stage");
const fitGroup = document.getElementById("fitGroup");
const p1 = document.getElementById("shape1");
const p2 = document.getElementById("shape2");

// Helper: fetch an external SVG and return its first <path> "d"
async function getPathD(url) {
  const res = await fetch(url);
  const txt = await res.text();
  const doc = new DOMParser().parseFromString(txt, "image/svg+xml");
  const path = doc.querySelector("path");
  if (!path) throw new Error(`No <path> found in ${url}`);
  return path.getAttribute("d");
}

// Fit both shapes into the stage viewBox by transforming the <g>
function fitToViewBox() {
  // Make sure both paths are in the DOM with their "d" set
  const bb1 = p1.getBBox();
  const bb2 = p2.getBBox();

  const minX = Math.min(bb1.x, bb2.x);
  const minY = Math.min(bb1.y, bb2.y);
  const maxX = Math.max(bb1.x + bb1.width, bb2.x + bb2.width);
  const maxY = Math.max(bb1.y + bb1.height, bb2.y + bb2.height);

  const bw = maxX - minX;
  const bh = maxY - minY;

  // Stage viewBox dimensions
  const vb = stage.viewBox.baseVal;
  const scale = Math.min(vb.width / bw, vb.height / bh) * 0.92; // slight padding

  // Center after scaling
  const tx = (vb.width - bw * scale) * 0.5 - minX * scale;
  const ty = (vb.height - bh * scale) * 0.5 - minY * scale;

  fitGroup.setAttribute(
    "transform",
    `matrix(${scale} 0 0 ${scale} ${tx} ${ty})`
  );
}

(async () => {
  // Load paths
  const [d1, d2] = await Promise.all([getPathD(URL1), getPathD(URL2)]);
  p1.setAttribute("d", d1);
  p2.setAttribute("d", d2);

  // Important: ensure both are measurable before fitting
  requestAnimationFrame(() => {
    fitToViewBox();

    // Morph loop
    const tl = gsap.timeline({
      repeat: -1,
      yoyo: true,
      defaults: { ease: "power1.inOut", duration: 1.4 },
    });
    tl.to(p1, { morphSVG: p2 }).to(p1, { morphSVG: p1 }, ">"); // morph back (yoyo also works, but this keeps control explicit)
  });
})().catch((err) => {
  console.error(err);
  document.querySelector(".hint").textContent = "Error: " + err.message;
});
