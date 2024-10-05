var globalData;
var selectedData = [];
var individualSelectedData = [];
var max = 9.5;
var min = 3;

// Initialization of the dashboard
function init() {
  d3.json("data.json").then(function (data) {
    globalData = data;
    selectedData = data;
    individualSelectedData = data;
    createAnimeList(globalData);
    createScatterPlot(globalData);
    createHistogram(globalData);
  });
}

function createAnimeList(data) {
  anime_list = document.getElementById("anime_list")
  for (anime of data) {
    let anime_list_element = document.createElement("div")
    anime_list_element.setAttribute("class", "anime_list_element");
    anime_list_element.innerText += anime.title;
    anime_list.append(anime_list_element);
  }
}

// Create visual idioms
function drawSkip(is_horiz, start_x, start_y) {
  const data = (sx, sy) => {return [{x: sx + 0, y: sy + 0}, {x: sx + 13, y: sy + 0}, {x: sx + 15, y: sy + 5}, {x: sx + 19, y: sy - 5}, {x: sx + 23, y: sy + 5},
    {x: sx + 27, y: sy - 5}, {x: sx + 31, y: sy + 5}, {x: sx + 35, y: sy - 5}, {x: sx + 37, y: sy + 0}, {x: sx + 50, y: sy + 0}]};
  var horizLineFunc = d3.line()
    .x(function(d) { return d.x })
    .y(function(d) { return d.y });
  var vertLineFunc = d3.line()
    .x(function(d) { return d.y })
    .y(function(d) { return d.x });
  
  if (is_horiz) {return horizLineFunc(data(start_x, start_y));}
  else {return vertLineFunc(data(start_y, start_x));}
}

function createScatterPlot(data) {
  const svgWidth = document.getElementById('ScatterPlot').offsetWidth;
  const svgHeight = document.getElementById('ScatterPlot').offsetHeight;
  const margin = 50;

  const colorScale = d3.scaleOrdinal()
    .domain(["Spring", "Summer", "Fall", "Winter"])
    .range(["LimeGreen", "Gold", "DarkOrange", "Purple"]);
  const xScale = d3
    .scaleLinear()
    .domain([2.5, d3.max(data, (d) => Math.log(d.members_count) / Math.log(10))])
    .range([margin + 50, svgWidth - margin]);
  const yScale = d3
    .scaleLinear()
    .domain([9.5, 3])
    .range([margin, svgHeight - margin - 50]);
  const svg = d3
    .select("#ScatterPlot")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  svg.append("g").attr("class", "grayGroup");
  let selectedGroup = svg.append("g").attr("class", "selectedGroup");
    
  selectedGroup
    .selectAll("circle")
    .data(data, (d) => d.title)
    .enter()
    .append("circle")
    .attr("r", 3)
    .attr("cx", (d) => xScale(Math.log(d.members_count) / Math.log(10)))
    .attr("cy", (d) => yScale(d.score))
    .attr("fill", function(d) { return colorScale(d.season); })
    .style("stroke", "grey")
    .style("stroke-width", 1)
    .on("mouseover", mouseOverFunction)
    .on("mouseleave", mouseLeaveFunction)
    .on("click", clickSelectedCircle)
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
  svg.append('path')
    .attr('d', drawSkip(true, margin, svgHeight - margin))
    .attr('stroke', 'black')
    .attr('width', 1)
    .attr('fill', 'none');
  svg.append('path')
    .attr('d', drawSkip(false, margin, svgHeight - margin - 50))
    .attr('stroke', 'black')
    .attr('width', 1)
    .attr('fill', 'none');
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
    .range([margin + 50, svgWidth - margin]);
  
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
    .on("click", clickBin)
    .append("title")
    .text(function (d) {
      return d.length;
    });

  svg
    .append("g")
    .attr("class", "xAxis")
    .attr("transform", `translate(0,${svgHeight - margin})`)
    .call(d3.axisBottom(xScale)
            .ticks(14)
            .tickValues(d3.range(3, 9.5, 0.5))
    );
    svg.append('path')
    .attr('d', drawSkip(true, margin, svgHeight - margin))
    .attr('stroke', 'black')
    .attr('width', 1)
    .attr('fill', 'none');

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

// Interaction managers
function clickSelectedCircle(event, d) {
  if (individualSelectedData.length != selectedData.length) { //deselect if not all points are selected
    individualSelectedData = individualSelectedData.filter(function (elem) {
      return d.members_count != elem.members_count || d.score != elem.score;
    });
    if (individualSelectedData.length == 0) //if this deselects the last point then all points are selected
      individualSelectedData = selectedData;
  }
  else { //if all points are selected, it means its the first selection so add that point
    individualSelectedData = selectedData.filter(function (elem) {
      return d.members_count == elem.members_count && d.score == elem.score;
    });
  }
  updateHistogram(globalData);
  updateScatterPlot(globalData);
}

function clickGrayCircle(event, d) {
  individualSelectedData.push(
    selectedData.filter(function (elem) {
      return d.members_count == elem.members_count && d.score == elem.score;
    })[0]
  );
  updateHistogram(globalData);
  updateScatterPlot(globalData);
}

function clickBin(event, d) {
  //bin was selected so deselecting it makes everything selected again
  if (selectedData.length != globalData.length && d.fill == "gray") {
        selectedData = globalData;
        individualSelectedData = selectedData;
        max = 9.5;
        min = 3;
      }
      else { //all bins were selected which selects only this bin or bin was gray so select it
        selectedData = globalData.filter(function (elem) {
          return d.x0 <= elem.score && d.x0 + 0.5 > elem.score;
        });
        individualSelectedData = selectedData; //overwrites the scatterplot selection
        max = d.x0 + 0.5;
        min = d.x0;
      }
      updateScatterPlotScale(globalData);
      updateHistogram(globalData);
}

function mouseOverFunction(event, d) {
  d3.select(this).style("cursor", "pointer").style("stroke-width", "3px");
  d3.select(this).attr("r", 6);
}

function mouseLeaveFunction(event, d) {
  d3.select(this).style("stroke-width", "1px");
  d3.select(this).attr("r", 3);
}

// Update functions
function updateScatterPlot(data) {
  const svgWidth = document.getElementById('ScatterPlot').offsetWidth;
  const svgHeight = document.getElementById('ScatterPlot').offsetHeight;
  const margin = 50;

  const colorScale = d3.scaleOrdinal()
    .domain(["Spring", "Summer", "Fall", "Winter"])
    .range(["LimeGreen", "Gold", "DarkOrange", "Purple"]);
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
    .select("g.yAxis")
    .transition()
    .duration(1000)
    .attr("transform", `translate(${margin},0)`)
    .call(d3.axisLeft(yScale));

  let grayGroup = svg.select("g.grayGroup");
  let selectedGroup = svg.select("g.selectedGroup");
  
  svg.selectAll("g.selectedGroup circle, g.grayGroup circle").remove();
  
  grayGroup
    .selectAll("circle")
    .data(selectedData, (d) => d.title)
    .enter()
    .append("circle")
    .attr("r", 3)
    .attr("cx", (d) => xScale(Math.log(d.members_count) / Math.log(10)))
    .attr("cy", (d) => yScale(d.score))
    .attr("fill", "gray")
    .style("stroke", "gray")
    .style("stroke-width", 1)
    .on("mouseover", mouseOverFunction)
    .on("mouseleave", mouseLeaveFunction)
    .on("click", clickGrayCircle)
    .append("title")
    .text((d) => d.title);
  
  selectedGroup
    .selectAll("circle")
    .data(individualSelectedData, (d) => d.title)
    .enter()
    .append("circle")
    .attr("r", 3)
    .attr("cx", (d) => xScale(Math.log(d.members_count) / Math.log(10)))
    .attr("cy", (d) => yScale(d.score))
    .attr("fill", function (d) {
      return colorScale(d.season);
    })
    .style("stroke", "gray")
    .style("stroke-width", 1)
    .on("mouseover", mouseOverFunction)
    .on("mouseleave", mouseLeaveFunction)
    .on("click", clickSelectedCircle)
    .append("title")
    .text((d) => d.title);
}

function updateScatterPlotScale(data) {
  const svgWidth = document.getElementById('ScatterPlot').offsetWidth;
  const svgHeight = document.getElementById('ScatterPlot').offsetHeight;
  const margin = 50;

  const colorScale = d3.scaleOrdinal()
    .domain(["Spring", "Summer", "Fall", "Winter"])
    .range(["LimeGreen", "Gold", "DarkOrange", "Purple"]);
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
    .select("g.yAxis")
    .transition()
    .duration(1000)
    .attr("transform", `translate(${margin},0)`)
    .call(d3.axisLeft(yScale));

  let selectedGroup = svg.select("g.selectedGroup");
  svg
    .selectAll("g.grayGroup circle")
    .data(data, (d) => d.title)
    .transition()
    .attr("r", 3)
    .attr("cx", (d) => xScale(Math.log(d.members_count) / Math.log(10)))
    .attr("cy", (d) => yScale(d.score))
    .duration(1000)
    .remove()
    .end()
  svg
    .selectAll("g.selectedGroup circle")
    .data(data, (d) => d.title)
    .transition()
    .attr("r", 3)
    .attr("cx", (d) => xScale(Math.log(d.members_count) / Math.log(10)))
    .attr("cy", (d) => yScale(d.score))
    .duration(1000)
    .remove()
    .end()
    .then(() => {
      selectedGroup
        .selectAll("circle")
        .data(selectedData, (d) => d.title)
        .enter()
        .append("circle")
        .attr("r", 3)
        .attr("cx", (d) => xScale(Math.log(d.members_count) / Math.log(10)))
        .attr("cy", (d) => yScale(d.score))
        .attr("fill", function(d) { return colorScale(d.season); })
        .style("stroke", "gray")
        .style("stroke-width", 1)
        .on("mouseover", mouseOverFunction)
        .on("mouseleave", mouseLeaveFunction)
        .on("click", clickSelectedCircle)
        .append("title")
        .text((d) => d.title);
    })
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
    .on("click", clickBin)
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
    .style("position", "relative")
    .style("fill", "steelblue")
    .style("stroke", function (d) {
      res = "black";
      if (individualSelectedData.length != selectedData.length) {
        individualSelectedData.forEach((elem) => {
          if (elem.score >= d.x0 && elem.score < d.x0 + 0.5) {
            d3.select(this).raise();
            res = "red";
          }
        });
      }
      return res;
    })
    .on("mouseover", function (event, d) {
      d3.select(this).style("cursor", "pointer").style("stroke-width", "3px");
    })
    .on("mouseleave", function (event, d) {
      d3.select(this).style("stroke-width", "1px");
    })
    .on("click", clickBin)
    .append("title")
    .text(function (d) {
      return d.length;
    });
}
