var globalData;

// Initialization of the dashboard

function init() {
  d3.json("data.json").then(function (data) {
    globalData = data;
    createScatterPlot(globalData);
  });
}

// Create visual idioms

function createScatterPlot(data) {
  const svgWidth = document.getElementById('ScatterPlot').offsetWidth;
  const svgHeight = document.getElementById('ScatterPlot').offsetHeight;
  const margin = 100;
  const xScale = d3
    .scaleLinear()
    .domain([2.5, d3.max(data, (d) => Math.log(d.members_count) / Math.log(10))])
    .range([margin + 50, svgWidth - margin]);
  const yScale = d3
    .scaleLinear()
    .domain([10, 3])
    .range([margin, svgHeight - margin - 50]);
  const svg = d3
    .select("#ScatterPlot")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);
  svg
    .selectAll("circle")
    .data(data, (d) => d.title)
    .enter()
    .append("circle")
    .attr("class", "dataItem")
    .attr("r", 3)
    .attr("cx", (d) => xScale(Math.log(d.members_count) / Math.log(10)))
    .attr("cy", (d) => yScale(d.score))
    .style("fill", "steelblue")
    .style("stroke", "black")
    .style("stroke-width", 1)
    .on("mouseover", mouseOverFunction)
    .on("mouseleave", mouseLeaveFunction)
    .append("title")
    .text((d) => d.title);
  svg
    .append("g")
    .attr("class", "xAxis")
    .attr("transform", `translate(0,${svgHeight - margin})`)
    .call(d3.axisBottom(xScale).tickSizeOuter(0).tickFormat(d3.format(".2")));
  svg
    .append("g")
    .attr("class", "yAxis")
    .attr("transform", `translate(${margin},0)`)
    .call(d3.axisLeft(yScale));
  svg
    .append("text")
    .attr("x", svgWidth - margin)
    .attr("y", svgHeight - 2 * margin / 3)
    .attr("font-size", 10)
    .attr("text-anchor", "middle")
    .text("log-Popularity");
  svg
    .append("text")
    .attr("x", margin / 2)
    .attr("y", margin)
    .attr("font-size", 10)
    .attr("text-anchor", "middle")
    .text("Rating");
}

// Triggered events

function mouseOverFunction(event, d) {

}

function mouseLeaveFunction(event, d) {

}
