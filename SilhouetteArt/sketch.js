const jsonUrl =
  "https://huggingface.co/datasets/visualizedata/revolutionary_silhouettes/resolve/main/json/revolutionary_silhouettes-original.json";

const imgUrl =
  "https://pgdv-5200-2025f-a.github.io/silhouettes/imgs/00_original";

let silData = [];

let img = null;
let points = [];

async function loadData() {
  const dataText = await loadStrings(jsonUrl);

  for (let i = 0; i < dataText.length - 1; i++) {
    const rowData = JSON.parse(dataText[i]);
    silData.push(rowData);
  }
}

async function loadByFilename(filename) {
  const found = silData.filter((x) => x.id == filename);
  if (found.length > 0) {
    const rowData = found[0];
    img = await loadImage(`${imgUrl}/${rowData.id}.jpg`);
    points = getSilhouette(rowData);
  }
}

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

let pidx = 0;
let sFactor = 1;

function setupImages() {
  const allImageEls = document.getElementsByClassName("original-image");

  // Add image source using its dataset.filename attribute
  Array.from(allImageEls).forEach((el) => {
    el.src = `${imgUrl}/${el.dataset.filename}.jpg`;
  });

  // Add click event to images
  Array.from(allImageEls).forEach((el) => {
    el.addEventListener("click", async (evt) => {
      const imgBB = evt.target.getBoundingClientRect();
      clear();
      resizeCanvas(imgBB.width, imgBB.height);

      await loadByFilename(evt.target.dataset.filename);

      const canvasContainerEl = document.getElementById("canvas-container");
      canvasContainerEl.style.top = `${imgBB.top}px`;
      canvasContainerEl.style.left = `${imgBB.left}px`;

      sFactor = imgBB.height / img.height;
      pidx = 0;
      clear();
    });
  });
}

async function setup() {
  let mCanvas = createCanvas(0, 0);
  mCanvas.parent("canvas-container");

  loadData();
  setupImages();
}

function draw() {
  fill(220, 0, 0);
  noStroke();

  for (let i = 0; i < pidx; i++) {
    const p = points[i];
    ellipse(p.x * sFactor, p.y * sFactor, 5, 5);
  }

  pidx = min(pidx + 4, points.length);
}
