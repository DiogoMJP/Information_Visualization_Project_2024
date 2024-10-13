var globalData;
var selectedData = [];
var individualSelectedData = [];

var bin = null;
var prev_bin = null;
var changed_bin = false;
var season = null;
var prev_season = null;
var changed_season = false;
var clicked_anime_id = null;
var brushed_anime_id = null;
var selectionActive = false;
var individualSelectionActive = false;
var updateDueToIndividualSelection = false;

var zoom_x_scale = null;
var zoom_y_scale = null;

var xScale;
var yScale;
var zoomBehavior;

mouse_down = false

const histogramTooltip = d3
    .select("#Histogram")
    .append("div")
    .style("position", "absolute")
    .style("background", "#fff")
    .style("padding", "5px 10px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "5px")
    .style("visibility", "hidden")
    .style("text-align", "left")
    .style("color", "steelblue");

const scatterPlotTooltip = d3
  .select("#ScatterPlot")
  .append("div")
  .style("position", "absolute")
  .style("background", "#fff")
  .style("padding", "5px 10px")
  .style("border", "1px solid #ccc")
  .style("border-radius", "5px")
  .style("visibility", "hidden")
  .style("text-align", "left")
  .style("color", "steelblue");


// Initialization of the dashboard
function init() {
  d3.json("data.json").then(function (data) {
    globalData = data;
    selectedData = data;
    createAnimeList();
    createScatterPlot(globalData);
    createHistogram(globalData);
  });
}

function createAnimeList() {
  input = document.getElementById('search_box');
  filter = input.value.toUpperCase();
  anime_list = document.getElementById("anime_list")
  anime_list.innerHTML = "";

  var animeListSelectedData, individualAnimeListSelectedData;
  if (filter != "") {
    animeListSelectedData = selectedData
      .filter(function (elem) {
        return elem.title.toUpperCase().indexOf(filter) > -1;
      });
    individualAnimeListSelectedData = individualSelectedData
      .filter(function (elem) {
        return elem.title.toUpperCase().indexOf(filter) > -1;
      });
  } else {
    animeListSelectedData = selectedData;
    individualAnimeListSelectedData = individualSelectedData;
  }

  for (anime of animeListSelectedData) {
    let anime_list_element = document.createElement("div")
    anime_list_element.setAttribute("class", "anime_list_element unclicked");
    anime_list_element.setAttribute("id", anime.anime_id);
    anime_list_element.setAttribute("onclick", "clickAnime("+anime.anime_id+");")
    anime_list_element.innerText += anime.title;
    anime_list.append(anime_list_element);
  }

  for (anime of individualAnimeListSelectedData) {
    let anime_list_element = document.getElementById(anime.anime_id)
    anime_list_element.setAttribute("class", "anime_list_element clicked");
  }
}


// Create visual idioms

// Create the line showing a jump in values on the graph
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

// Create the scatter plot
function createScatterPlot(data) {
  // Set constants for this graph
  const svgWidth = document.getElementById('ScatterPlot').offsetWidth;
  const svgHeight = document.getElementById('ScatterPlot').offsetHeight;
  const margin = 50;

  // Create the behavior for the zoom
  zoomBehavior = d3
    .zoom()
    .scaleExtent([1, 20])
    .extent([[0, 0], [svgWidth, svgHeight]]) 
    .translateExtent([[0, 0], [svgWidth, svgHeight]])
    .filter(function(event) {
      return event.type === 'wheel';
    })
    .on("zoom", zoomed)

  // Set the scales used (colors and axis)
  const colorScale = d3.scaleOrdinal()
    .domain(["Spring", "Summer", "Fall", "Winter"])
    .range(["LimeGreen", "Gold", "DarkOrange", "Purple"]);
  xScale = d3
    .scaleLinear()
    .domain([2.5, d3.max(data, (d) => Math.log(d.members_count) / Math.log(10))])
    .range([margin + 50, svgWidth - margin]);
  zoom_x_scale = xScale;
  yScale = d3
    .scaleLinear()
    .domain([9.5, 3])
    .range([margin, svgHeight - margin - 50]);
  zoom_y_scale = yScale;

  // Create the svg for the graph
  const svg = d3
    .select("#ScatterPlot")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .call(zoomBehavior)
    
  // Create zone where the circles are rendered 
  svg.append("defs")
    .append("clipPath")
    .attr("id", "scatterPlotClip")
    .append("rect")
    .attr("x", margin)
    .attr("y", margin)
    .attr("width", svgWidth - margin * 2 + 10)
    .attr("height", svgHeight - margin * 2 - 40);
  const chartArea = svg.append("g")
    .attr("clip-path", "url(#scatterPlotClip)");

  // Create the circles
  chartArea
    .selectAll("circle")
    .data(selectedData, (d) => d.title)
    .enter()
    .append("circle")
    .attr("r", 3)
    .attr("cx", (d) => xScale(Math.log(d.members_count) / Math.log(10)))
    .attr("cy", (d) => yScale(d.score))
    .attr("fill", function(d) { return colorScale(d.season); })
    .style("stroke", "grey")
    .style("stroke-width", 1)
    .on("mouseover", mouseOverScatterPlot)
    .on("mouseleave", mouseLeaveScatterPlot)
    .on("click", clickCircle);

  // Draw the axis and associated things
  svg
    .append("g")
    .attr("class", "xAxis")
    .attr("transform", `translate(0,${svgHeight - margin})`)
    .call(d3.axisBottom(xScale).tickSizeOuter(0).tickFormat(d3.format(".2")));
  svg
    .append("g")
    .attr("class", "yAxis")
    .attr("transform", `translate(${margin},0)`)
    .call(d3.axisLeft(yScale).tickSizeOuter(0));
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
    .text("Score");

  // Add regression line
  const { slope, intercept } = calculateRegressionLine(data);

  chartArea.append("line")
    .attr("class", "regression-line")
    .attr("x1", xScale(d3.min(data, d => Math.log(d.members_count) / Math.log(10))))
    .attr("y1", yScale(slope * d3.min(data, d => Math.log(d.members_count) / Math.log(10)) + intercept))
    .attr("x2", xScale(d3.max(data, d => Math.log(d.members_count) / Math.log(10))))
    .attr("y2", yScale(slope * d3.max(data, d => Math.log(d.members_count) / Math.log(10)) + intercept))
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2);

  // Add slope label
  document.getElementById("slope_value").textContent = "Slope: " + slope.toFixed(4);
}

function calculateRegressionLine(data) {
  const xValues = data.map(d => Math.log(d.members_count) / Math.log(10));
  const yValues = data.map(d => d.score);

  const xMean = d3.mean(xValues);
  const yMean = d3.mean(yValues);

  const ssxy = d3.sum(data.map((d, i) => (xValues[i] - xMean) * (yValues[i] - yMean)));
  const ssxx = d3.sum(data.map((d, i) => Math.pow(xValues[i] - xMean, 2)));

  const slope = ssxy / ssxx;
  const intercept = yMean - (slope * xMean);

  return { slope, intercept };
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
    .range([svgHeight - margin, margin - 25]);

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
    .on("mouseover", mouseOverHistogram)
    .on("mouseleave", mouseLeaveHistogram)
    .on("click", clickBin);

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
    .call(d3.axisLeft(yScale).tickSizeOuter(0));

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
    .attr("y", 20)
    .attr("font-size", 10)
    .attr("text-anchor", "middle")
    .text("Count");
}


// Interaction managers
function clickAnime(id) {
  //if all points are selected, it means its the first selection so make that the only selected point
  clicked_anime_id = id;
  updateDueToIndividualSelection = true;

  updateData();
  createAnimeList();
  updateHistogram(globalData);
  updateScatterPlot(globalData);
}

function clickSeason(name) {
  //the point being gray means clicking it always results in adding it to the selection
  prev_season = season;
  if (season == name) season = null;
  else season = name;

  // Update active button styles
  document.querySelectorAll('.season_button').forEach(function (btn) {
    btn.classList.remove('active');
  });

  if (season != null) {
    document.getElementById(season.toLowerCase() + '_button').classList.add('active');
  }

  // Update data and visuals
  updateData();
  createAnimeList();
  updateHistogram(globalData);
  updateScatterPlot(globalData);
  }

function resetIndividualSelection() {
  individualSelectedData = [];
  updateData();
  
  // Use setTimeout to ensure the DOM updates after data reset
  setTimeout(() => {
    createAnimeList();
    updateHistogram(globalData);
    updateScatterPlot(globalData);
  }, 0);
}

function clickCircle(event, d) {
  clicked_anime_id = d.anime_id;
  updateDueToIndividualSelection = true;

  updateData();
  createAnimeList();
  updateHistogram(globalData);
  updateScatterPlot(globalData);
}

function brushCircle(d) {
  //if all points are selected, it means its the first selection so make that the only selected point
  if (!individualSelectedData.some((anime) => anime.anime_id == d.anime_id)) {
    brushed_anime_id = d.anime_id;
  }
  updateDueToIndividualSelection = true;

  updateData();
  createAnimeList();
  updateHistogram(globalData);
  updateScatterPlot(globalData);
}

function clickBin(event, d) {
  // select a bin if none was selected; else, select none
  prev_bin = bin;
  if (bin == d.x0) 
    bin = bin != null ? null : d.x0;
  else
    bin = d.x0

  updateData();
  createAnimeList();
  updateScatterPlot(globalData);
  updateHistogram(globalData);
}

function updateData() {
  if (clicked_anime_id) {
    if (individualSelectedData.some((anime) => anime.anime_id == clicked_anime_id)) {
      individualSelectedData = individualSelectedData.filter(function (elem) {
        return clicked_anime_id != elem.anime_id;
      });
    } else {
      individualSelectedData.push(  
        selectedData.filter(function (elem) {
          return clicked_anime_id == elem.anime_id;
        })[0]
      );
    }
    clicked_anime_id = null;
  }

  if (brushed_anime_id) {
    if (!individualSelectedData.some((anime) => anime.anime_id == brushed_anime_id)) {
      individualSelectedData.push(  
        selectedData.filter(function (elem) {
          return brushed_anime_id == elem.anime_id;
        })[0]
      );
    }
    brushed_anime_id = null;
  }

  if (bin != null) {
    selectedData = globalData.filter(function (elem) {
      return bin <= elem.score && bin + 0.5 > elem.score;
    });
    individualSelectedData = individualSelectedData.filter(function (elem) {
      return bin <= elem.score && bin + 0.5 > elem.score;
    });
    selectionActive = true;
    binSelectionActive = true;
  } else {
    selectedData = globalData;
    selectionActive = false;
  }
  
  if (season != null) {
    selectedData = selectedData.filter(function (elem) {
      return elem.season == season;
    });
    individualSelectedData = individualSelectedData.filter(function (elem) {
      return elem.season == season;
    });
    selectionActive = true;
  }

  if (individualSelectedData.length == 0) {
    individualSelectionActive = false;
  }
  else {
    individualSelectionActive = true;
  }

  if (prev_season != season) 
    changed_season = true;
  else
    changed_season = false;
  prev_season = season;

  if (prev_bin != bin) 
    changed_bin = true;
  else
    changed_bin = false;
  prev_bin = bin;
}

function mouseOverScatterPlot(event, d) {
  d3.select(this)
    .style("cursor", "pointer")
    .style("stroke-width", "3px")
    .attr("r", 6);

  scatterPlotTooltip
    .style("visibility", "visible")
    .html(
      `<strong>Title:</strong> ${d.title}<br>
        <strong>Score:</strong> ${d.score}<br>
        <strong>Members:</strong> ${d.members_count}`
    )

  const tooltipWidth = parseInt(scatterPlotTooltip.style("width"), 10);
  const tooltipHeight = parseInt(scatterPlotTooltip.style("height"), 10);
  let top = event.pageY - tooltipHeight - 10;
  let left = event.pageX + 10;

  if (left + tooltipWidth > window.innerWidth) {
    left = event.pageX - tooltipWidth - 30; //position to the left of the mouse if there's not enough space to the right
  }

  scatterPlotTooltip
    .style("top", `${top}px`)
    .style("left", `${left}px`);

  if (mouse_down)
    brushCircle(d);
}

function mouseLeaveScatterPlot(event, d) {
  scatterPlotTooltip.style("visibility", "hidden");
  d3.select(this)
    .style("stroke-width", "1px")
    .attr("r", 3);
}

function mouseOverHistogram(event, d) {
  d3.select(this).style("cursor", "pointer").style("stroke-width", "3px");

  d3.select(this)
    .style("cursor", "pointer")
    .style("stroke-width", "3px")
    .attr("r", 6);

    histogramTooltip
      .style("visibility", "visible")
      .html(
        `<strong>Count:</strong> ${d.length}<br>
         <strong>Range:</strong> [${d.x0} - ${d.x0 + 0.5}[`
      )
      .style("top", `${event.pageY - 30}px`)
      .style("left", `${event.pageX + 10}px`);
}

function mouseLeaveHistogram(event, d) {
  d3.select(this).style("stroke-width", "1px");

  histogramTooltip.style("visibility", "hidden");
  d3.select(this)
    .style("stroke-width", "1px")
    .attr("r", 3);
}

// Update functions
function updateScatterPlot(data) {
  const svgWidth = document.getElementById('ScatterPlot').offsetWidth;
  const svgHeight = document.getElementById('ScatterPlot').offsetHeight;
  const margin = 50;

  const svg = d3.select("#ScatterPlot").select("svg");

  var x_scale, y_scale;

  const colorScale = d3.scaleOrdinal()
    .domain(["Spring", "Summer", "Fall", "Winter"])
    .range(["LimeGreen", "Gold", "DarkOrange", "Purple"]);

  if (changed_bin || changed_season) {
    xScale = d3
      .scaleLinear()
      .domain([2.5, d3.max(data, (d) => Math.log(d.members_count) / Math.log(10))])
      .range([margin + 50, svgWidth - margin]);
    x_scale = xScale;
    yScale = d3
      .scaleLinear()
      .domain((bin != null) ? [bin + 0.5, bin] : [9.5, 3])
      .range([margin, svgHeight - margin - 50]);
    y_scale = yScale;
      
    // Update axes
    svg.select("g.yAxis")
      .transition()
      .duration(500)
      .attr("transform", `translate(${margin},0)`)
      .call(d3.axisLeft(y_scale).tickSizeOuter(0));

    svg.select("g.xAxis")
      .transition()
      .duration(500)
      .attr("transform", `translate(0,${svgHeight - margin})`)
      .call(d3.axisBottom(x_scale).tickSizeOuter(0).tickFormat(d3.format(".2")));

    svg.transition().duration(500).call(zoomBehavior.transform, d3.zoomIdentity);

    svg
    .selectAll("circle")
    .style("opacity", 0);

    svg
      .selectAll("circle")
      .filter((d) => season == null || season == d.season)
      .style("opacity", 1);
  
    // Update regression line
    const { slope, intercept } = calculateRegressionLine(selectedData);

    svg.select(".regression-line")
      .transition()
      .duration(500)
      .attr("x1", x_scale(d3.min(selectedData, d => Math.log(d.members_count) / Math.log(10))))
      .attr("y1", y_scale(slope * d3.min(selectedData, d => Math.log(d.members_count) / Math.log(10)) + intercept))
      .attr("x2", x_scale(d3.max(selectedData, d => Math.log(d.members_count) / Math.log(10))))
      .attr("y2", y_scale(slope * d3.max(selectedData, d => Math.log(d.members_count) / Math.log(10)) + intercept))
      .attr("stroke", "steelblue");

    // Update slope label
    document.getElementById("slope_value").textContent = "Slope: " + slope.toFixed(4);
  } else {
    x_scale = zoom_x_scale;
    y_scale = zoom_y_scale;
  }

  svg
    .selectAll("circle")
    .transition()
    .attr("cx", (d) => x_scale(Math.log(d.members_count) / Math.log(10)))
    .attr("cy", (d) => y_scale(d.score))
    .duration(500)
    .end()
    .catch(() => {
      svg
        .selectAll("circle")
        .filter((data, index) => !selectedData.includes(data))
        .style("pointer-events", "none")
        .style("opacity", 0);
    })
    .then(() => {
      svg
        .selectAll("circle")
        .filter((data, index) => !selectedData.includes(data))
        .style("pointer-events", "none")
        .style("opacity", 0);
    });

  if (individualSelectedData.length != 0) {
    svg
      .selectAll("circle")
      .filter((data, _) => selectedData.includes(data))
      .style("pointer-events", "auto")
      .attr("fill", "gray");
    svg
      .selectAll("circle")
      .filter((data) => individualSelectedData.includes(data))
      .style("pointer-events", "auto")
      .attr("fill", function (d) {
        return colorScale(d.season);
      });
  } else {
    svg
      .selectAll("circle")
      .filter((data, _) => selectedData.includes(data))
      .style("pointer-events", "auto")
      .attr("fill", function (d) {
        return colorScale(d.season);
      });
  }
}

function updateHistogram(data) {
  scoreData = data.map((obj) => obj["score"]);
  selectedScoreData = selectedData.map((obj) => obj["score"]);
  individualSelectedScoreData = individualSelectedData.map((obj) => obj["score"]);

  const svgWidth = d3.select("#Histogram").node().clientWidth;
  const svgHeight = d3.select("#Histogram").node().clientHeight;
  const margin = 50;

  const xScale = d3
    .scaleLinear()
    .domain([3, 9.5])
    .range([margin + 50, svgWidth - margin]);
  
  histogram = d3.histogram().domain(xScale.domain()).thresholds(xScale.ticks(14));
  bins = histogram(scoreData);
  selectedBins = histogram(selectedScoreData);
  individualSelectedBins = histogram(individualSelectedScoreData);

  const yScale = d3
    .scaleLinear()
    .domain([0, individualSelectionActive ? 
        d3.max(individualSelectedBins, function (d) {return d.length;}) : d3.max(bins, function (d) {return d.length;})])
    .range([svgHeight - margin, margin - 25]);

  const svg = d3
    .select("#Histogram")
    .select("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  svg
    .select("g.yAxis")
    .transition()
    .duration(750)
    .attr("transform", `translate(${margin},0)`)
    .call(d3.axisLeft(yScale).tickSizeOuter(0));
  

  svg.selectAll("rect.selected")
    .transition()
    .duration(750)
    .attr("y", svgHeight - margin)
    .attr("height", 0)
    .remove();

  
  if (individualSelectionActive) {
    selectedBins = individualSelectedBins;
    svg.selectAll("rect.gray")
      .transition()
      .duration(750)
      .attr("y", svgHeight - margin)
      .attr("height", 0)
      .remove();

  }
  else if (selectionActive) {
    // Update gray background bars
    const grayBars = svg.selectAll("rect.gray").data(bins, d => d.x0);

    grayBars.enter()
      .append("rect")
      .attr("class", "gray")
      .attr("x", d => xScale(d.x0))
      .attr("width", d => xScale(d.x1) - xScale(d.x0))
      .attr("y", d => yScale(d.length))
      .attr("height", d => svgHeight - yScale(d.length) - margin)
      .on("mouseover", mouseOverHistogram)
      .on("mouseleave", mouseLeaveHistogram)
      .on("click", clickBin)
      .style("fill", "gray")
      .style("stroke", "black")
      .selection()
      .lower();
  }
  else {
    selectedBins = bins;
  }

  const colorScale = d3.scaleOrdinal()
    .domain(["Spring", "Summer", "Fall", "Winter"])
    .range(["LimeGreen", "Gold", "DarkOrange", "Purple"]);
  
  // Update colored (selected) bars
  const coloredBars = svg.selectAll("rect.selected").data(selectedBins, d => d.x0);

  coloredBars.enter()
    .append("rect")
    .attr("class", "selected")
    .attr("x", d => xScale(d.x0))
    .attr("width", d => xScale(d.x1) - xScale(d.x0))
    .attr("y", svgHeight - margin)
    .attr("height", 0)
    .merge(coloredBars)
    .on("mouseover", mouseOverHistogram)
    .on("mouseleave", mouseLeaveHistogram)
    .on("click", clickBin)
    .transition()
    .duration(500)
    .attr("y", d => yScale(d.length))
    .attr("height", d => svgHeight - yScale(d.length) - margin)
    .style("fill", season == null ? "steelblue" : colorScale(season))
    .style("stroke", "black");
}

function zoomed(event) {
  const xAxis = d3.axisBottom(xScale).tickSizeOuter(0).tickFormat(d3.format(".2"));
  const yAxis = d3.axisLeft(yScale);

  const new_xScale = event.transform.rescaleX(xScale);
  const new_yScale = event.transform.rescaleY(yScale);

  zoom_x_scale = event.transform.rescaleX(xScale);
  zoom_y_scale = event.transform.rescaleY(yScale);

  const svg = d3.select("#ScatterPlot").select("svg");

  //update axes
  svg.select(".xAxis").call(xAxis.scale(new_xScale));
  svg.select(".yAxis").call(yAxis.scale(new_yScale));

  //update circles
  svg.selectAll("circle").data(selectedData, d => d.anime_id)
    .attr("cx", d => new_xScale(Math.log(d.members_count) / Math.log(10)))
    .attr("cy", d => new_yScale(d.score));

  const { slope, intercept } = calculateRegressionLine(selectedData);

  //update regression line
  svg.select(".regression-line")
    .attr("x1", new_xScale(d3.min(selectedData, d => Math.log(d.members_count) / Math.log(10))))
    .attr("y1", new_yScale(slope * d3.min(selectedData, d => Math.log(d.members_count) / Math.log(10)) + intercept))
    .attr("x2", new_xScale(d3.max(selectedData, d => Math.log(d.members_count) / Math.log(10))))
    .attr("y2", new_yScale(slope * d3.max(selectedData, d => Math.log(d.members_count) / Math.log(10)) + intercept));
}

document.body.onmousedown = function(evt) {
  if (evt.buttons & 1)
    mouse_down = true;
}
document.body.onmouseup = function(evt) {
  if (!(evt.buttons & 1))
    mouse_down = false;
}