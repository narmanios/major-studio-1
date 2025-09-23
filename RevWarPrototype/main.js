let people;
let allDates = [];

// load the data
d3.json("data/dates_binned_start_year_upto_1810.json").then((data) => {
  people = data;
  analyzeData();

  console.log("bars:", allDates.length);
  console.log(
    "sum:",
    d3.sum(allDates, (d) => d.count)
  );
  console.log(
    "max:",
    d3.max(allDates, (d) => d.count)
  );
  console.table(
    allDates
      .slice()
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  );
  displayData();
});

// analyze the data
// function analyzeData() {
//   let date;

//   // go through the list of people
//   people.forEach((n) => {
//     date = n.date;
//     let match = false;

//     // see if their location already exists the allDates array
//     allDates.forEach((p) => {
//       if (p.date == date) {
//         p.count++;
//         match = true;
//       }
//     });
//     // if not create a new entry for that date name
//     if (!match) {
//       allDates.push({
//         name: date,
//         count: 1,
//       });
//     }
//   });

function analyzeData() {
  // If your file includes a non-year bucket like "Unparsed", filter it out
  const numericOnly = people.filter((d) => typeof d.year === "number");

  // Build [{ name: "1770", count: <number of records in that bin> }, ...]
  allDates = numericOnly.map((d) => ({
    name: String(d.year),
    count: Array.isArray(d.records) ? d.records.length : 0,
  }));

  // Chronological order (ascending)
  allDates.sort((a, b) => +a.name - +b.name);
}

//   // sort by amount of items in the list
//   allDates.sort((a, b) => (a.count < b.count ? 1 : -1));
//   // console.log(allDates)
// }

// display the data
function displayData() {
  // define dimensions and margins for the graphic
  const margin = { top: 100, right: 50, bottom: 60, left: 80 };
  const width = 1400;
  const height = 700;

  // let's define our scales.
  // yScale corresponds with amount of people per country
  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(allDates, (d) => d.count) + 1])
    .range([height - margin.bottom, margin.top]);

  // xScale corresponds with country names
  const xScale = d3
    .scaleBand()
    .domain(allDates.map((d) => d.name))
    .range([margin.left, width - margin.right]);

  // interpolate colors
  // const sequentialScale = d3
  //   .scaleSequential()
  //   .domain([0, d3.max(allDates, (d) => d.count)]);
  // .interpolator(d3.interpolateRgb("orange", "purple"));

  const blue = "#1f77b4",
    red = "#d62728",
    grey = "#bbb";

  function barColor(d) {
    const y = +d.name;
    if (!Number.isFinite(y)) return grey;

    if (y >= 1770 && y <= 1775) return red; // pre-war
    if (y >= 1776 && y <= 1783) return blue; // war years
    if (y >= 1784 && y <= 1810) return blue; // post-war
    return grey;
  }

  // create an svg container from scratch
  const svg = d3
    .select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // attach a graphic element, and append rectangles to it
  svg
    .append("g")
    .selectAll("rect")
    .data(allDates)
    .join("rect")
    .attr("x", (d) => {
      return xScale(d.name);
    })
    .attr("y", (d) => {
      return yScale(d.count);
    })
    .attr("height", (d) => {
      return yScale(0) - yScale(d.count);
    })
    .attr("width", (d) => {
      return xScale.bandwidth() - 2;
    })
    // .style("fill", (d) => {
    //   return sequentialScale(d.count);
    // });
    .style("fill", (d) => barColor(d));

  // Axes
  // Y Axis
  const yAxis = d3.axisLeft(yScale).ticks(5);

  svg.append("g").attr("transform", `translate(${margin.left},0)`).call(yAxis);

  // X Axis
  const xAxis = d3.axisBottom(xScale).tickSize(0);

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.6em")
    .attr("dy", "-0.1em")
    .attr("transform", (d) => {
      return "rotate(-45)";
    });

  // Labelling the graph
  svg
    .append("text")
    .attr("font-family", "sans-serif")
    .attr("font-weight", "bold")
    .attr("font-size", 20)
    .attr("y", margin.top - 20)
    .attr("x", margin.left)
    .attr("fill", "black")
    .attr("text-anchor", "start")
    .text("Number of Sitters per year 1770-1810 (Revolutionary War)");
}
