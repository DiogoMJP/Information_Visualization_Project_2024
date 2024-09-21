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
  const svgWidth = window.innerWidth / 2;
  const svgHeight = 400;
  const margin = 60;
  const xScale = d3
    .scaleLinear()
    .domain([2.5, d3.max(data, (d) => Math.log(d.members_count) / Math.log(10))])
    .range([margin + 50, svgWidth - margin]);
  const yScale = d3
    .scaleLinear()
    .domain([10, 3])
    .range([margin, svgHeight - margin - 50]);
  d3.select(".ScatterPlot")
    .append("h3")
    .style("margin-left", `${margin}px`)
    .text("Correlation between popularity and rating");
  const svg = d3
    .select(".ScatterPlot")
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
    .attr("x", svgWidth / 2)
    .attr("y", svgHeight - margin / 3)
    .attr("text-anchor", "middle")
    .text("log-Popularity");
  svg
    .append("text")
    .attr("x", -svgHeight / 2 + margin / 2)
    .attr("y", margin / 2)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Rating");
}

// Triggered events

function mouseOverFunction(event, d) {

}

function mouseLeaveFunction(event, d) {

}
