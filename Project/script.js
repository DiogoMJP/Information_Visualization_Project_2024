var globalData;
var selectedData = [];

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
  const svgWidth = document.getElementById('ScatterPlot').offsetWidth;
  const svgHeight = document.getElementById('ScatterPlot').offsetHeight;
  const margin = 50;

  const colorScale = d3.scaleOrdinal()
    .domain(["Spring", "Summer", "Fall", "Winter"])
    .range(["LimeGreen", "Gold", "DarkOrange", "DeepSkyBlue"]);
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
    .attr("fill", function(d) { return colorScale(d.season); })
    .style("stroke", "grey")
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
    .attr("y", svgHeight - 25)
    .attr("font-size", 10)
    .attr("text-anchor", "middle")
    .text("log-Popularity");
  svg
    .append("text")
    .attr("x", margin)
    .attr("y", margin - 10)
    .attr("font-size", 10)
    .attr("text-anchor", "middle")
    .text("Rating");
}

function createHistogram(data) {
  scoreData = data.map((obj) => obj["score"]);

  const svgWidth = d3.select("#Histogram").node().clientWidth;
  const svgHeight = d3.select("#Histogram").node().clientHeight;
  const margin = 50;

  const xScale = d3
    .scaleLinear()
    .domain([3, 9.5])
    .range([margin, svgWidth - margin]);
  
  const histogram = d3.histogram().domain(xScale.domain());

  const bins = histogram(scoreData);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(bins, function (d) {return d.length;})])
    .range([svgHeight - margin, margin]);

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
      return svgHeight - yScale(d.length) - margin;
    })
    .style("fill", "steelblue")
    .style("stroke", "black")
    .on("mouseover", function (event, d) {
      d3.select(this).style("cursor", "pointer").style("stroke-width", "3px");
    })
    .on("mouseleave", function (event, d) {
      d3.select(this).style("stroke-width", "1px");
    })
    .on("click", function (event, d) {
      selectedData = data.filter(function (elem) { //TODO: make this append new selections
        return d.x0 <= elem.score && d.x0 + 0.5 > elem.score;
      });
      updateHistogram(globalData);
      updateScatterPlot(globalData, d.x0, d.x0 + 0.5);
    })
    .append("title")
    .text(function (d) {
      return d.length;
    });

  // Axis

  svg
    .append("g")
    .attr("class", "xAxis")
    .attr("transform", `translate(0,${svgHeight - margin})`)
    .call(d3.axisBottom(xScale)
            .ticks(14)
            .tickValues(d3.range(3, 9.5, 0.5))
    );

  svg
    .append("g")
    .attr("class", "yAxis")
    .attr("transform", `translate(${margin},0)`)
    .call(d3.axisLeft(yScale)
      .ticks(14)
      .tickValues(d3.range(0, d3.max(bins, function (d) {return d.length;}), 50))
  );

  svg
    .append("text")
    .attr("x", svgWidth - margin)
    .attr("y", svgHeight - 25)
    .attr("font-size", 10)
    .attr("text-anchor", "middle")
    .text("Score");
  svg
    .append("text")
    .attr("x", margin)
    .attr("y", margin - 10)
    .attr("font-size", 10)
    .attr("text-anchor", "middle")
    .text("Count");
}

function updateScatterPlot(data, min, max) {
  const svgWidth = document.getElementById('ScatterPlot').offsetWidth;
  const svgHeight = document.getElementById('ScatterPlot').offsetHeight;
  const margin = 50;

  const colorScale = d3.scaleOrdinal()
    .domain(["Spring", "Summer", "Fall", "Winter"])
    .range(["LimeGreen", "Gold", "DarkOrange", "DeepSkyBlue"]);
  const xScale = d3
    .scaleLinear()
    .domain([2.5, d3.max(data, (d) => Math.log(d.members_count) / Math.log(10))])
    .range([margin + 50, svgWidth - margin]);
  const yScale = d3
    .scaleLinear()
    .domain([max, min])
    .range([margin, svgHeight - margin - 50]);
  const svg = d3
    .select("#ScatterPlot")
    .select("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);
  svg
    .selectAll(".yAxis")
    .remove();
  svg
    .append("g")
    .attr("class", "yAxis")
    .attr("transform", `translate(${margin},0)`)
    .call(d3.axisLeft(yScale));
  svg
    .selectAll("circle")
    .data(data, (d) => d.title)
    .remove();
  svg
    .selectAll("circle.selected")
    .data(selectedData, (d) => d.title)
    .enter()
    .append("circle")
    .attr("class", "selected")
    .attr("r", 3)
    .attr("cx", (d) => xScale(Math.log(d.members_count) / Math.log(10)))
    .attr("cy", (d) => yScale(d.score))
    .attr("fill", function(d) { return colorScale(d.season); })
    .style("stroke", "gray")
    .style("stroke-width", 1)
    .on("mouseover", mouseOverFunction)
    .on("mouseleave", mouseLeaveFunction)
    .append("title")
    .text((d) => d.title);
}

function updateHistogram(data) {
  scoreData = data.map((obj) => obj["score"]);
  selectedScoreData = selectedData.map((obj) => obj["score"]);

  const svgWidth = d3.select("#Histogram").node().clientWidth;
  const svgHeight = d3.select("#Histogram").node().clientHeight;
  const margin = 50;

  const xScale = d3
    .scaleLinear()
    .domain([3, 9.5])
    .range([margin, svgWidth - margin]);
  
  const histogram = d3.histogram().domain(xScale.domain()).thresholds(xScale.ticks(14));
  const bins = histogram(scoreData);
  const selectedBins = histogram(selectedScoreData);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(bins, function (d) {return d.length;})])
    .range([svgHeight - margin, margin]);

  const svg = d3
    .select("#Histogram")
    .select("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  svg
    .selectAll("rect")
    .data(data, (d) => d.title)
    .exit()
    .remove();
  svg
    .selectAll("rect.gray")
    .attr("class", "gray")
    .data(bins)
    .enter()
    .append("rect")
    .attr("class", "gray")
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
      return svgHeight - yScale(d.length) - margin;
    })
    .style("fill", "gray")
    .style("stroke", "black")
    .on("mouseover", function (event, d) {
      d3.select(this).style("cursor", "pointer").style("stroke-width", "3px");
    })
    .on("mouseleave", function (event, d) {
      d3.select(this).style("stroke-width", "1px");
    })
    .on("click", function (event, d) {
      selectedData = data.filter(function (elem) {
        return d.x0 <= elem.score && d.x0 + 0.5 > elem.score;
      });
      updateHistogram(globalData);
      updateScatterPlot(globalData, d.x0, d.x0 + 0.5);
    })
    .append("title")
    .text(function (d) {
      return d.length;
    });
  svg
    .selectAll("rect.selected")
    .data(selectedBins)
    .enter()
    .append("rect")
    .attr("class", "selected")
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
      return svgHeight - yScale(d.length) - margin;
    })
    .style("fill", "steelblue")
    .style("stroke", "black")
    .on("mouseover", function (event, d) {
      d3.select(this).style("cursor", "pointer").style("stroke-width", "3px");
    })
    .on("mouseleave", function (event, d) {
      d3.select(this).style("stroke-width", "1px");
    })
    .on("click", function (event, d) {
      selectedData = data.filter(function (elem) {
        return d.x0 <= elem.score && d.x0 + 0.5 > elem.score;
      });
      updateHistogram(globalData);
      updateScatterPlot(globalData, d.x0, d.x0 + 0.5);
    })
    .append("title")
    .text(function (d) {
      return d.length;
    });
}

// Triggered events

function mouseOverFunction(event, d) {

}

function mouseLeaveFunction(event, d) {

}
