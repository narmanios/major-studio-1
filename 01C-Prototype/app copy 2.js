// import d3 library
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// === tiny knobs ===
const SIZE = 40; // tile width (px)
const GAP = 12; // spacing (px)
const PER_ROW = 15; // tiles per row

// tooltip offset
const TOOLTIP_OFFSET = 10;
const TILEPREVIEW_OFFSET = 10;

// Load local JSON and render a simple grid grouped by year.
d3.json("data/dates_binned_start_year_upto_1810.json").then((raw) => {
  // shape and sort data by year
  const years = (raw || [])
    .filter((d) => Number.isFinite(d.year))
    .map((d) => ({
      year: +d.year,
      records: Array.isArray(d.records) ? d.records : [],
    }))
    .sort((a, b) => a.year - b.year);

  const app = d3.select("#app").html("");

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
    .style("width", "100px")
    .style("padding", "6px 8px");

  row
    .append("div")
    .attr("class", "row-band")
    .style("position", "absolute")
    .style("left", "0px")
    .style("top", "0%")
    .style("transform", "translateY(-50%)")
    .style("height", "2px")
    .style("width", "100px")
    .style("pointer-events", "none");

  row
    .append("div")
    .style("position", "relative")
    .style("z-index", 1)
    .style("width", "125px")
    .style("text-align", "right")
    .style("font", "14px system-ui, sans-serif")
    .text((d) => d.year);

  const grid = row
    .append("div")
    .style("position", "relative")
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
    // .style("padding", "10px")
    .style("height", `60px`)
    .style("overflow", "hidden")
    .style("box-sizing", "border-box")
    .style("background", "#919191ff");
  // .on("mouseover", function (event, d) {
  //   tooltip.style("visibility", "visible").html(`
  //       ${d.title ? `<strong>${d.title}</strong><br>` : ""}
  //       ${d.date ? `<strong>Date:</strong> ${d.date}<br>` : ""}
  //       ${
  //         d.objectType
  //           ? `<strong>Type:</strong> ${d.objectType.replace(
  //               "Type: ",
  //               ""
  //             )}<br>`
  //           : ""
  //       }
  //       ${
  //         d.name?.Artist
  //           ? `<strong>Artist:</strong> ${d.name.Artist}<br>`
  //           : ""
  //       }
  //       ${
  //         d.physicalDescription
  //           ? `<strong>Medium:</strong> ${
  //               d.physicalDescription.replace("Medium: ", "").split(",")[0]
  //             }<br>`
  //           : ""
  //       }
  //       ${
  //         d.creditLine
  //           ? `<strong>Credit:</strong> ${d.creditLine.replace(
  //               "Credit Line: ",
  //               ""
  //             )}<br>`
  //           : ""
  //       }
  //       ${
  //         d.sitter_list
  //           ? `<strong>Sitter(s):</strong> ${d.sitter_list.join(", ")}<br>`
  //           : ""
  //       }
  //     `);
  // })
  // .on("mousemove", function (event) {
  //   tooltip
  //     .style("top", event.pageY + TOOLTIP_OFFSET + "px")
  //     .style("left", event.pageX + TOOLTIP_OFFSET + "px");
  // })
  // .on("mouseout", function () {
  //   tooltip.style("visibility", "hidden");
  // });

  // Tooltip behavior for thumbnails
  tile
    .on("mouseenter", (event, d) => {
      const title = d.title || "";
      const date = d.date || "";
      const type = d.objectType || "";
      const artist = d.name && d.name.Artist ? d.name.Artist : "";
      let medium = d.physicalDescription || "";
      if (medium.indexOf("Medium: ") === 0) medium = medium.slice(8);
      medium = medium.split(",")[0]; // just take the first part

      const credit = d.creditLine || "";
      const sitters = Array.isArray(d.sitter_list)
        ? d.sitter_list.join(", ")
        : "";

      let html = "";
      if (title) html += "<strong>" + title + "</strong><br>";
      if (date) html += "<strong>Date:</strong> " + date + "<br>";
      if (type) html += "<strong>Type:</strong> " + type + "<br>";
      if (artist) html += "<strong>Artist:</strong> " + artist + "<br>";
      if (medium) html += "<strong>Medium:</strong> " + medium + "<br>";
      if (credit) html += "<strong>Credit:</strong> " + credit + "<br>";
      if (sitters) html += "<strong>Sitter(s):</strong> " + sitters + "<br>";

      tooltip.style("visibility", "visible").html(html);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("top", event.pageY + TOOLTIP_OFFSET + "px")
        .style("left", event.pageX + TOOLTIP_OFFSET + "px");
    })
    .on("mouseleave", () => {
      tooltip.style("visibility", "hidden");
    });

  //Tooltip behavior for preview image
  tilePreview
    .on("mouseenter", (event, d) => {
      const title = d.title || "";
      const date = d.date || "";
      const type = d.objectType || "";
      const artist = d.name && d.name.Artist ? d.name.Artist : "";
      let mediumTwo = d.physicalDescription || "";
      if (mediumTwo.indexOf("Medium: ") === 0) mediumTwo = mediumTwo.slice(8);
      mediumTwo = mediumTwo.split(",")[0]; // just take the first part

      const credit = d.creditLine || "";
      const sitters = Array.isArray(d.sitter_list)
        ? d.sitter_list.join(", ")
        : "";

      let html = "";
      if (title) html += "<strong>" + title + "</strong><br>";
      if (date) html += "<strong>Date:</strong> " + date + "<br>";
      if (type) html += "<strong>Type:</strong> " + type + "<br>";
      if (artist) html += "<strong>Artist:</strong> " + artist + "<br>";
      if (mediumTwo) html += "<strong>Medium:</strong> " + mediumTwo + "<br>";
      if (credit) html += "<strong>Credit:</strong> " + credit + "<br>";
      if (sitters) html += "<strong>Sitter(s):</strong> " + sitters + "<br>";

      tilePreview.style("visibility", "visible").html(html);
    })
    .on("mousemove", (event) => {
      tilePreview
        .style("top", event.pageY + TILEPREVIEW_OFFSET + "px")
        .style("left", event.pageX + TILEPREVIEW_OFFSET + "px");
    })
    .on("mouseleave", () => {
      tilePreview.style("visibility", "hidden");
    });

  // Build dropdown (same labels as before)
  const sel = d3.select("#input").html('<option value="">All</option>');
  [
    "Paintings Watercolor",
    "Paintings Oil",
    "Pencil Drawings",
    "Prints",
  ].forEach((v) => sel.append("option").attr("value", v).text(v));

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

  function apply() {
    const v = sel.node().value;
    d3.selectAll(".tile").style("display", (d) =>
      !v || bucket(d.physicalDescription) === v ? "" : "none"
    );
  }
  sel.on("change", apply);
  apply();

  function applyPreview() {
    const v = sel.node().value;
    d3.selectAll(".tilePreview").style("display", (d) =>
      !v || bucket(d.physicalDescription) === v ? "" : "none"
    );
  }
  sel.on("change", applyPreview);
  applyPreview();

  // Add images directly from the dataset (no external API calls)
  tile.style("background", "transparent").each(function (rec) {
    const url =
      (rec?.thumbnail && rec.thumbnail.trim()) ||
      rec?.thumbnailUrl ||
      rec?.thumb ||
      rec?.image ||
      null;
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

const tile = d3
  .select("body")
  .append("img")
  .style("position", "fixed")
  .style("inset", "0")
  .style("margin-left", "auto")
  .style("margin-top", "auto")
  .style("margin-right", "80px")
  .style("margin-bottom", "40px")
  .style("width", "30vw")
  .style("height", "auto")
  .style("display", "none")
  .style("background-color", "rgba(0,0,0,0.8)")
  .style("z-index", 9999)
  .on("click", function () {
    d3.select(this).style("display", "none");
  });

// tooltip div
const preview = d3
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

const tilePreview = d3
  .select("body")
  .append("img")
  .style("position", "fixed")
  .style("inset", "0")
  .style("margin-left", "auto")
  .style("margin-top", "auto")
  .style("margin-right", "80px")
  .style("margin-bottom", "40px")
  .style("width", "30vw")
  .style("height", "auto")
  .style("display", "none")
  .style("background-color", "rgba(0,0,0,0.8)")
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
