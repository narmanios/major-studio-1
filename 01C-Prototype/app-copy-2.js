// import d3 library
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// === tiny knobs ===
const SIZE = 50; // circle diameter (px)
const GAP = 12; // spacing (px)
const PER_ROW = 15; // wrap after 30 per line
const RED = "#a00202ff"; // border for 1770–1775

// tooltip offset
const TOOLTIP_OFFSET = 10; // pixels to offset tooltip from cursor

// put your API key here
// const apiKey = "noLuZta2hTf0G2PU11Jyn3u5oHE8gleW5yAstXPW";

// // SI content endpoint
// const objectBaseURL = "https://api.si.edu/openaccess/api/v1.0/content/";

// // tiny cache so we don't refetch the same id
// const contentCache = new Map();

// // get an <img> URL for a record (prefers your existing thumbnail, else SI API)
// async function getImageURL(rec) {
//   // if your dataset already has a usable thumbnail, use it
//   if (rec?.thumbnail && rec.thumbnail.trim()) return rec.thumbnail.trim();

//   // otherwise try to build from an IDS id if present
//   if (rec?.idsId) {
//     return `https://ids.si.edu/ids/deliveryService?id=${encodeURIComponent(
//       rec.idsId
//     )}`;
//   }

//   // else, fetch via SI API content/{id}
//   const id =
//     rec?.contentId || rec?.id || (rec?.guid ? rec.guid.split("/").pop() : null);
//   if (!id) return null;

//   if (contentCache.has(id)) return contentCache.get(id);

//   const url = `${objectBaseURL}${id}?api_key=${apiKey}`;
//   const res = await fetch(url);
//   if (!res.ok) return null;
//   const json = await res.json();

//   // try common locations for the media URL
//   const media =
//     json?.response?.content?.descriptiveNonRepeating?.online_media?.media;
//   const img =
//     (Array.isArray(media) && media.find((m) => m?.content)?.content) || null;

//   contentCache.set(id, img || null);
//   return img || null;
// }

// Smithsonian API example code
const apiKey = "noLuZta2hTf0G2PU11Jyn3u5oHE8gleW5yAstXPW";

const objectBaseURL = "https://api.si.edu/openaccess/api/v1.0/content/";

// fetches content JSON by ID (returns a Promise)
function fetchContentDataById(id) {
  const url = objectBaseURL + id + "?api_key=" + apiKey;
  return fetch(url).then((res) => res.json());
}

// demo: log the response AND show the first image on the page
fetchContentDataById("ld1-1643399887910-1643399927269-1")
  .then(({ response }) => {
    console.log("Here's the content data of the specified object:", response);

    const media =
      response?.content?.descriptiveNonRepeating?.online_media?.media;
    const imgURL =
      Array.isArray(media) && media[0]?.content ? media[0].content : null;
    if (!imgURL) return;

    const img = document.createElement("img");
    img.src = imgURL;
    img.alt = response?.title || "Smithsonian object";
    img.style.maxWidth = "400px";
    document.body.appendChild(img);
  })
  .catch(console.error);

d3.json("data/dates_binned_start_year_upto_1810.json").then((raw) => {
  // shape data: keep all records; sort by year
  const years = (raw || [])
    .filter((d) => Number.isFinite(d.year))
    .map((d) => ({
      year: +d.year,
      records: Array.isArray(d.records) ? d.records : [],
    }))
    .sort((a, b) => a.year - b.year);

  // container
  const app = d3.select("#app").html("");

  // one row per year
  const row = app
    .selectAll(".year")
    .data(years)
    .join("div")
    .attr("class", "year")
    .style("position", "relative")
    .style("display", "flex")
    .style("align-items", "flex-start")
    .style("gap", "8px")
    .style("margin", "6px 0")
    .style("padding", "6px 8px")

    .style("margin", "6px 0");

  row
    .append("div")
    .attr("class", "row-band")
    .style("position", "absolute")
    .style("left", "0px")
    // .style("right", "100px")
    .style("top", "0%") // center it vertically in the row
    .style("transform", "translateY(-50%)")
    .style("height", "2px") // <-- control the line thickness here
    .style("width", "1300px")

    .style("pointer-events", "none");

  row
    .append("div")
    .style("position", "relative") // (optional) ensure on top
    .style("z-index", 1)
    .style("width", "125px")
    // .style("height", "5px")
    .style("text-align", "right")
    .style("font", "14px system-ui, sans-serif")
    .text((d) => d.year);

  // right: fixed 20-per-row grid
  const grid = row
    .append("div")
    .style("position", "relative") // (optional) ensure on top
    .style("z-index", 1)
    .style("display", "grid")
    .style("grid-template-columns", `repeat(${PER_ROW}, ${SIZE}px)`)
    .style("gap", `${GAP}px`);

  const tile = grid
    .selectAll(".tile")
    .data((d) => d.records)
    .join("div")
    .attr("class", "tile")
    .style("width", `${SIZE}px`)
    .style("height", `60px`)
    // .style("border-radius", "50%")
    .style("overflow", "hidden")
    .style("box-sizing", "border-box")
    .style("background", "#919191ff")

    .on("mouseover", function (event, d) {
      tooltip.style("visibility", "visible").html(`
          ${d.title ? `<strong>${d.title}</strong><br>` : ""}
          ${d.date ? `<strong>Date:</strong> ${d.date}<br>` : ""}
          ${
            d.objectType
              ? `<strong>Type:</strong> ${d.objectType.replace(
                  "Type: ",
                  ""
                )}<br>`
              : ""
          }
          ${
            d.name?.Artist
              ? `<strong>Artist:</strong> ${d.name.Artist}<br>`
              : ""
          }
          ${
            d.physicalDescription
              ? `<strong>Medium:</strong> ${
                  d.physicalDescription.replace("Medium: ", "").split(",")[0]
                }<br>`
              : ""
          }
          ${
            d.creditLine
              ? `<strong>Credit:</strong> ${d.creditLine.replace(
                  "Credit Line: ",
                  ""
                )}<br>`
              : ""
          }
          ${
            d.sitter_list
              ? `<strong>Sitter(s):</strong> ${d.sitter_list.join(", ")}<br>`
              : ""
          }
        `);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("top", event.pageY + TOOLTIP_OFFSET + "px")
        .style("left", event.pageX + TOOLTIP_OFFSET + "px");
    })
    .on("mouseout", function () {
      tooltip.style("visibility", "hidden");
    });

  // 1) Build the dropdown with your four labels
  const sel = d3.select("#input").html('<option value="">All</option>');
  [
    "Paintings Watercolor",
    "Paintings Oil",
    "Pencil Drawings",
    "Prints",
  ].forEach((v) => sel.append("option").attr("value", v).text(v));

  // 2) Map physicalDescription -> one of the four labels
  const bucket = (s = "") => {
    const m = s.toLowerCase();
    if (
      m.includes("watercolor") ||
      m.includes("watercolour") ||
      m.includes("gouache")
    )
      return "Paintings Watercolor";
    if (m.includes("oil")) return "Paintings Oil";
    if (m.includes("pencil") || m.includes("graphite"))
      return "Pencil Drawings";
    if (
      m.includes("print") ||
      m.includes("engraving") ||
      m.includes("etch") ||
      m.includes("lithograph") ||
      m.includes("woodcut") ||
      m.includes("mezzotint")
    )
      return "Prints";
    return "";
  };

  // 3) Filter tiles on change (empty = show all)
  function apply() {
    const v = sel.node().value;
    d3.selectAll(".tile").style("display", (d) =>
      !v || bucket(d.physicalDescription) === v ? "" : "none"
    );
  }
  sel.on("change", apply);
  apply(); // initial

  // uses getImageURL(rec) which fetches via your API key when needed
  // tile.style("background", "transparent").each(async function (rec) {
  // const url = await getImageURL(rec); // <-- no proxify
  // if (!url) return;
  // d3.select(this)
  //   .append("img")
  //   .attr("src", url)
  //   .attr("alt", rec.title || "")
  //   .attr("loading", "lazy")
  //   .style("width", "100%")
  //   .style("height", "100%")
  //   .style("object-fit", "cover")
  //   .on("error", function () {
  //     d3.select(this).remove();
  //   });
  // });

  // inside your d3.json(...).then(...), AFTER tiles are created:
  tile.style("background", "transparent").each(async function (rec) {
    // 1) use dataset thumbnail if present
    let url =
      rec?.thumbnail && rec.thumbnail.trim() ? rec.thumbnail.trim() : null;

    // 2) else fetch via Smithsonian content/{id} using your API key
    if (!url && (rec?.contentId || rec?.id)) {
      const id = rec.contentId || rec.id;
      try {
        const { response } = await fetchContentDataById(id);
        const media =
          response?.content?.descriptiveNonRepeating?.online_media?.media;
        url =
          Array.isArray(media) && media[0]?.content ? media[0].content : null;
      } catch (e) {
        // ignore; no image
      }
    }

    // 3) (optional) else use IDS if you have idsId on the record
    if (!url && rec?.idsId) {
      url =
        "https://ids.si.edu/ids/deliveryService?id=" +
        encodeURIComponent(rec.idsId);
    }

    if (!url) return;

    d3.select(this)
      .append("img")
      .attr("src", url)
      .attr("alt", rec.title || "")
      .attr("loading", "lazy")
      .style("width", "100%")
      .style("height", "100%")
      .style("object-fit", "cover")
      .on("error", function () {
        d3.select(this).remove();
      });
  });

  function analyzeData() {
    const numericOnly = people.filter((d) => typeof d.year === "number");

    allDates = numericOnly.map((d) => {
      const recs = Array.isArray(d.records) ? d.records : [];

      return {
        name: String(d.year),
        records: recs, // keep the actual records
        count: recs.length, // convenience
      };
    });

    allDates.sort((a, b) => +a.name - +b.name);
  }
});

// tooltip div
const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("visibility", "hidden")
  .style("background-color", "white")
  .style("padding", "10px")
  .style("border-radius", "4px")
  .style("box-shadow", "0 2px 4px rgba(0,0,0,0.2)")
  .style("font-size", "12px")
  .style("max-width", "300px")
  .style("z-index", 1000);

const preview = d3
  .select("body")
  .append("img")
  .style("position", "fixed")
  .style("inset", "0")
  .style("margin", "auto")
  .style("max-width", "90vw")
  .style("max-height", "90vh")
  .style("display", "none")
  .style("z-index", 9999)
  .on("click", function () {
    d3.select(this).style("display", "none");
  });

// drop-in replacement for your click handler
d3.select("#app").on("click", (e) => {
  const img = e.target.closest(".tile")?.querySelector("img");
  if (!img) return;

  tooltip.style("visibility", "hidden");
  preview
    .attr("src", img.src)
    .attr("alt", img.alt || "")
    .style("display", "block");
});
