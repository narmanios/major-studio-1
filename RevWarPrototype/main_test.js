let people;
let allDates = [];

// load the data
d3.json("data/dates_binneed_start_year.json").then((data) => {
  people = data;
  analyzeData();
  displayData();
});

// analyze the data
function analyzeData() {
  allDates = people.map((group) => {
    // sum sitters across all records for this date
    let sitterCount = 0;
    group.records.forEach((r) => {
      const arr = Array.isArray(r.sitter_list) ? r.sitter_list : [];
      // If you want to de-dupe per record, use: new Set(arr).size
      sitterCount += arr.length;
    });
    return { name: group.date, count: sitterCount };
  });
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

  // // xScale corresponds with country names
  // const xScale = d3
  //   .scaleBand()
  //   .domain(allDates.map((d) => d.name))
  //   .range([margin.left, width - margin.right]);

  const xScale = d3
    .scaleBand()
    .domain(allDates.map((d) => d.name))
    .range([margin.left, width - margin.right])
    .padding(0.1);

  // interpolate colors
  const sequentialScale = d3
    .scaleSequential()
    .domain([0, d3.max(allDates, (d) => d.count)])
    .interpolator(d3.interpolateRgb("orange", "purple"));

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
    .style("fill", (d) => {
      return sequentialScale(d.count);
    });

  // Axes
  // Y Axis
  const yAxis = d3.axisLeft(yScale).ticks(5);

  svg.append("g").attr("transform", `translate(${margin.left},0)`).call(yAxis);

  // X Axis
  const xAxis = d3.axisBottom(xScale).tickSize(0);

  // svg
  //   .append("g")
  //   .attr("transform", `translate(0, ${height - margin.bottom})`)
  //   .call(xAxis)
  //   .selectAll("text")
  //   .style("text-anchor", "end")
  //   .attr("dx", "-.6em")
  //   .attr("dy", "-0.1em")
  //   .attr("transform", (d) => {
  //     return "rotate(-45)";
  //   });

  svg.append("g").attr("transform", `translate(${margin.left},0)`).call(yAxis);

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.6em")
    .attr("dy", "-0.1em")
    .attr("transform", "rotate(-45)");

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
    .text("Flowers in Embroidery by Country");
}
