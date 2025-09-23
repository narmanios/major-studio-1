// import d3 library
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// === tiny knobs ===
const SIZE = 50; // circle diameter (px)
const GAP = 12; // spacing (px)
const PER_ROW = 18; // wrap after 30 per line
const RED = "#a00202ff"; // border for 1770–1775
const BLUE = "#19218eff"; // border for other years
const ROW_RED_BG = "#a00202ff"; // row background (1770–1775)
const ROW_BLUE_BG = "#19218eff";

// tooltip offset
const TOOLTIP_OFFSET = 10; // pixels to offset tooltip from cursor

// ✅ proxy helper (your previously working version)
const proxify = (u) => {
  if (!u || typeof u !== "string") return null;
  const clean = u.trim();
  // images.weserv.nl expects the URL without the scheme
  return (
    "https://images.weserv.nl/?url=" +
    encodeURIComponent(clean.replace(/^https?:\/\//, ""))
  );
};

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

  const title = app
    .append("h1")
    .style("margin", "0")
    .style("padding-top", "50px")
    .style("padding-left", "50px")
    .style("padding-bottom", "20px")
    .style("font-size", "1.75rem")
    .style("font-weight", 700)
    .style("color", "#333")
    .html(
      'Revolutionary War (1770-1810): <br>"Sitters" with Known Portraits by Year'
    )
    .style("max-width", "600px");
  title.style("line-height", "1.5");

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
    // .style("background-color", "black")
    // was: .style("background-color", "black")
    // .style("background-color", (d) =>
    //   d.year >= 1770 && d.year <= 1775 ? ROW_RED_BG : ROW_BLUE_BG
    // )

    .style("margin", "6px 50px");

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
    // .style("border-radius", "999px") // pill shape
    // .style("background-color", (d) =>
    //   d.year >= 1770 && d.year <= 1775 ? ROW_RED_BG : ROW_BLUE_BG
    // )
    .style("background-color", "#ccc")
    .style("pointer-events", "none");

  const borderStyle = "stroke";
  row
    .append("div")
    .style("position", "relative") // (optional) ensure on top
    .style("z-index", 1)
    .style("width", "80px")
    .style("height", "60px")
    // .style("text-align", "right")
    .style("font", "16px, sans-serif")
    .style("font-weight", "400")
    .style("line-height", "1.5")
    // .style("padding-right", "12px")
    .style("padding-top", "18px")
    .style("text-align", "center")
    .style("color", "white")
    .style("border-radius", "4px")
    .style("box-shadow", "0 2px 4px rgba(0,0,0,0.2)")
    // .style("border", "2px", (d) =>
    //   d.year >= 1770 && d.year <= 1775 ? ROW_RED_BG : ROW_BLUE_BG
    // )
    .style("background-color", (d) =>
      d.year >= 1770 && d.year <= 1775 ? ROW_RED_BG : ROW_BLUE_BG
    )
    .text((d) => d.year);

  // right: fixed 20-per-row grid
  const grid = row
    .append("div")
    .style("position", "relative") // (optional) ensure on top
    .style("z-index", 1)
    .style("display", "grid")
    .style("grid-template-columns", `repeat(${PER_ROW}, ${SIZE}px)`)
    .style("gap", `${GAP}px`);

  // one circular tile per record
  const tile = grid
    .selectAll(".tile")
    .data((d) => d.records)
    .join("div")
    .attr("class", "tile")
    .style("width", `${SIZE}px`)
    .style("height", `60px`)
    .style("border-radius", "8%")
    .style("overflow", "hidden")
    .style("box-sizing", "border-box")
    .style("background", "#555555ff")
    .style("box-shadow", "0 2px 2px rgba(0,0,0,0.3)")
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

  // border color by year of the row
  tile.style("border", (rec, i, nodes) => {
    const year = d3.select(nodes[i].parentNode).datum().year; // grid's datum is the year object
    const color = year >= 1770 && year <= 1775 ? RED : BLUE;
    return `1px solid #fff`;
    // return `5px solid ${color}`;
    //
  });

  // add <img> if a thumbnail exists; use proxy to bypass CORS
  tile.each(function (rec) {
    const url =
      rec && typeof rec.thumbnail === "string" && rec.thumbnail.trim() !== ""
        ? proxify(rec.thumbnail)
        : null;
    if (!url) return; // leave as bordered circle if no URL

    d3.select(this)
      .append("img")
      .attr("src", url)
      .attr("alt", rec.title || "")
      .attr("loading", "lazy")
      .style("width", "100%")
      .style("height", "100%")
      .style("object-fit", "cover")
      // if proxy still can’t fetch it, fall back to the bordered circle
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
