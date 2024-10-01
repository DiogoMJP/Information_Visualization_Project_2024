var globalData;

// Initialization of the dashboard

function init() {
  d3.json("data.json").then(function (data) {
    globalData = data;
    createScatterPlot(globalData);
    createHistogram(globalData);
  });
}

// Create visual idioms

function createScatterPlot(data) {
  const svgWidth = d3.select("#ScatterPlot").node().clientWidth;
  const svgHeight = d3.select("#ScatterPlot").node().clientHeight;
  const margin = 60;
  const xScale = d3
    .scaleLinear()
    .domain([2.5, d3.max(data, (d) => Math.log(d.members_count) / Math.log(10))])
    .range([margin + 50, svgWidth - margin]);
  const yScale = d3
    .scaleLinear()
    .domain([10, 3])
    .range([margin, svgHeight - margin - 50]);
  d3.select("#ScatterPlot")
    .append("h3")
    .style("margin-left", `${margin}px`)
    .text("Correlation between popularity and rating");
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

function createHistogram(data) {
  // Data pre-processing

  data = data.map((obj) => obj["score"]);

  // Core Histogram

  const svgWidth = d3.select("#Histogram").node().clientWidth;
  const svgHeight = d3.select("#Histogram").node().clientHeight;
  const margin = 60;
  const textMargin = 50;

  const xScale = d3
    .scaleLinear()
    .domain([0, 10])
    .range([margin + textMargin, svgWidth - margin]);
  
  const histogram = d3.histogram().domain(xScale.domain());

  const bins = histogram(data);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(bins, function (d) {return d.length;})])
    .range([svgHeight - margin - textMargin, 0]);
  d3.select("#Histogram")
    .append("h3")
    .style("margin-left", `${0}px`)
    .text("Average Score Count");

  const svg = d3
    .select("#Histogram")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  svg
    .selectAll("rect")
    .data(bins)
    .enter()
    .append("rect")
    .attr("x", function (d) {
      return xScale(d.x0);
    })
    .attr("y", function (d) {
      return yScale(d.length);
    })
    .attr("width", function (d) {
      return xScale(d.x1) - xScale(d.x0);
    })
    .attr("height", function (d) {
      return svgHeight - yScale(d.length) - margin - textMargin;
    })
    .style("fill", "steelblue")
    .style("stroke", "black")
    .on("mouseover", function (event, d) {
      d3.select(this).style("cursor", "pointer").style("stroke-width", "3px");
    })
    .on("mouseleave", function (event, d) {
      d3.select(this).style("stroke-width", "1px");
    })
    //.on("click", function (event, d) {
    //  swal.fire("Número de vinhos: " + d.length);
    //})
    .append("title")
    .text(function (d) {
      return d.length;
    });

  // Axis

  svg
    .append("g")
    .attr("class", "xAxis")
    .attr("transform", `translate(0,${svgHeight - margin - textMargin})`)
    .call(d3.axisBottom(xScale));

  svg
    .append("g")
    .attr("class", "yAxis")
    .attr("transform", `translate(${margin + textMargin},0)`)
    .call(d3.axisLeft(yScale));

  svg
    .append("text")
    .attr("x", (svgWidth + textMargin) / 2)
    .attr("y", svgHeight - margin)
    .attr("text-anchor", "middle")
    .text("Score");
  svg
    .append("text")
    .attr("x", (-svgHeight + margin + textMargin) / 2)
    .attr("y", margin)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Count");
}

// Triggered events

function mouseOverFunction(event, d) {

}

function mouseLeaveFunction(event, d) {

}
