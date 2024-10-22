var globalData;
var selectedData = [];
var individualSelectedData = [];
var sunburstData = [];

var score_min = null;
var prev_score_min = null;
var score_max = null;
var prev_score_max = null;
var changed_score = false;
var pop_min = null;
var prev_pop_min = null;
var pop_max = null;
var prev_pop_max = null;
var changed_pop = false;
var season = null;
var prev_season = null;
var changed_season = false;
var genre = null;
var prev_genre = null;
var changed_genre = false;
var source = null;
var prev_source = null;
var changed_source = false;
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

var updateScoreSlider;
var updatePopularitySlider;

mouse_down = false

const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip");

// Initialization of the dashboard
function init() {
  d3.json("data.json").then(function (data) {
    globalData = data;
    selectedData = data;
    sunburstData = data;
    createAnimeList();
    createGenreFilter();
    createSourceFilter();
    createScatterPlot(globalData);
    createHistogram(globalData);
    createSunburst();
    createLinechart();
    createScoreSlider("score_slider_container", 3, 9.5, changeScore);
    createPopularitySlider("pop_slider_container", 2.5, 7, changePopularity);
  });
}

function createAnimeList() {
  input = document.getElementById('search_box');
  filter = input.value.toUpperCase();
  anime_list = d3.select("#anime_list");

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

  const colorScale = d3
    .scaleLog()
    .domain([d3.min(selectedData, d => d.num_episodes), d3.max(selectedData, d => d.num_episodes)])
    .range(["white", "steelblue"]);

  anime_list
    .selectAll("div")
    .remove();

  anime_list
    .selectAll("div")
    .data(animeListSelectedData, (d) => d.title)
    .enter()
    .append("div")
    .text((d) => d.title)
    .attr("class", "anime_list_element unclicked")
    .style("background-color", function(d) { return colorScale(d.num_episodes); })
    .on("click", clickAnime)
    .on("mouseover", mouseOverAnime)
    .on("mouseleave", mouseLeaveAnime);
  
  anime_list
    .selectAll("div")
    .filter((d) => individualAnimeListSelectedData.includes(d))
    .attr("class", "anime_list_element clicked");
  
  document.getElementById("anime_list_scale_left")
    .textContent = "\u00A0\u00A0" + d3.min(selectedData, d => d.num_episodes);
  document.getElementById("anime_list_scale_right")
    .textContent = d3.max(selectedData, d => d.num_episodes) + "\u00A0\u00A0";
}

function createScoreSlider(id, v_min, v_max, updateFunc) {
  var width = document.getElementById(id).offsetWidth;

  var sliderVals=[v_min, v_max],
      svg = d3.select("#" + id).append("svg")
        .attr('width', width)
        .attr('height', 30);
  
  var x = d3.scaleLinear()
      .domain([v_min, v_max])
      .range([16, width - 16])
      .clamp(true);
  
  var xMin=x(v_min),
      xMax=x(v_max)
  
  var slider = svg.append("g")
      .attr("class", "slider")
      .attr("transform", "translate(5,10)");
  
  slider.append("line")
      .attr("class", "track")
      .attr("x1", x.range()[0])
      .attr("x2", x.range()[1])
  
  var selRange = slider.append("line")
      .attr("class", "sel-range")
      .attr("x1", x(sliderVals[0]))
      .attr("x2", x(sliderVals[1]))
  
  slider.insert("g", ".track-overlay")
      .attr("class", "ticks")
      .attr("transform", "translate(0,20)")
      .selectAll("text")
      .data(x.ticks(14))
      .enter().append("text")
      .attr("x", x)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "black")
      .text(d => d);
  
  var handle = slider.selectAll("circle")
    .data([0, 1])
    .enter().append("circle", ".track-overlay")
      .attr("class", "handle")
      .attr("cy", 0)
      .attr("cx", d => x(sliderVals[d]))
      .attr("r", 8)
      .call(
          d3.drag()
            .on("start", startDrag)
            .on("drag", drag)
            .on("end", endDrag)
      );
  
  function startDrag(){
    d3.select(this).raise().classed("active", true);
  }
  
  function drag(event, d){
    var x1=event.x;
    if(x1>xMax){
      x1=xMax
    }else if(x1<xMin){
      x1=xMin
    }
    d3.select(this).attr("cx", x1);
    var x2=x(sliderVals[d==0?1:0])
    selRange
        .attr("x1", x1)
        .attr("x2", x2)
  }
  
  function endDrag(event, d){
    var v=Math.round(2*x.invert(event.x))/2;
    var elem=d3.select(this)
    sliderVals[d] = v
    var v1=Math.min(sliderVals[0], sliderVals[1]),
        v2=Math.max(sliderVals[0], sliderVals[1]);
    elem.classed("active", false)
      .attr("cx", x(v));
    selRange
        .attr("x1", x(v1))
        .attr("x2", x(v2))

    updateFunc(v1, v2);
  }

  updateScoreSlider = (v1, v2) => {
    sliderVals[0] = v1;
    sliderVals[1] = v2;

    slider.selectAll("circle").remove();

    slider.selectAll("circle")
    .data([0, 1])
    .enter().append("circle", ".track-overlay")
      .attr("class", "handle")
      .attr("cy", 0)
      .attr("cx", d => x(sliderVals[d]))
      .attr("r", 8)
      .call(
          d3.drag()
            .on("start", startDrag)
            .on("drag", drag)
            .on("end", endDrag)
      );

    selRange
      .attr("x1", x(v1))
      .attr("x2", x(v2))
  };

}

function createPopularitySlider(id, v_min, v_max, updateFunc) {
  var width = document.getElementById(id).offsetWidth;

  var sliderVals=[v_min, v_max],
      svg = d3.select("#" + id).append("svg")
        .attr('width', width)
        .attr('height', 30);
  
  var x = d3.scaleLinear()
      .domain([v_min, v_max])
      .range([16, width - 16])
      .clamp(true);
  
  var xMin=x(v_min),
      xMax=x(v_max)
  
  var slider = svg.append("g")
      .attr("class", "slider")
      .attr("transform", "translate(5,10)");
  
  slider.append("line")
      .attr("class", "track")
      .attr("x1", x.range()[0])
      .attr("x2", x.range()[1])
  
  var selRange = slider.append("line")
      .attr("class", "sel-range")
      .attr("x1", x(sliderVals[0]))
      .attr("x2", x(sliderVals[1]))
  
  slider.insert("g", ".track-overlay")
      .attr("class", "ticks")
      .attr("transform", "translate(0,20)")
      .selectAll("text")
      .data(x.ticks(14))
      .enter().append("text")
      .attr("x", x)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "black")
      .text(d => d);
  
  var handle = slider.selectAll("circle")
    .data([0, 1])
    .enter().append("circle", ".track-overlay")
      .attr("class", "handle")
      .attr("cy", 0)
      .attr("cx", d => x(sliderVals[d]))
      .attr("r", 8)
      .call(
          d3.drag()
            .on("start", startDrag)
            .on("drag", drag)
            .on("end", endDrag)
      );
  
  function startDrag(){
    d3.select(this).raise().classed("active", true);
  }
  
  function drag(event, d){
    var x1=event.x;
    if(x1>xMax){
      x1=xMax
    }else if(x1<xMin){
      x1=xMin
    }
    d3.select(this).attr("cx", x1);
    var x2=x(sliderVals[d==0?1:0])
    selRange
        .attr("x1", x1)
        .attr("x2", x2)
  }
  
  function endDrag(event, d){
    var v=Math.round(2*x.invert(event.x))/2;
    var elem=d3.select(this)
    sliderVals[d] = v
    var v1=Math.min(sliderVals[0], sliderVals[1]),
        v2=Math.max(sliderVals[0], sliderVals[1]);
    elem.classed("active", false)
      .attr("cx", x(v));
    selRange
        .attr("x1", x(v1))
        .attr("x2", x(v2))

    updateFunc(v1, v2);
  }

  updatePopularitySlider = (v1, v2) => {
    sliderVals[0] = v1;
    sliderVals[1] = v2;

    slider.selectAll("circle").remove();

    slider.selectAll("circle")
    .data([0, 1])
    .enter().append("circle", ".track-overlay")
      .attr("class", "handle")
      .attr("cy", 0)
      .attr("cx", d => x(sliderVals[d]))
      .attr("r", 8)
      .call(
          d3.drag()
            .on("start", startDrag)
            .on("drag", drag)
            .on("end", endDrag)
      );

    selRange
      .attr("x1", x(v1))
      .attr("x2", x(v2))
  };

}

function createGenreFilter() {
  genres = Array.from(new Set(globalData.map((elem) => elem.genres).flat(1)));
  genre_filter = document.getElementById("genre_select")
  genre_filter.innerHTML = "";

  let genre_filter_element = document.createElement("option");
  genre_filter_element.setAttribute("id", "none_genre");
  genre_filter_element.setAttribute("value", "none");
  genre_filter_element.setAttribute("selected", "selected");
  genre_filter_element.innerText += "Choose an Option";
  genre_filter.append(genre_filter_element);
  
  for (let genre of genres) {
    let genre_filter_element = document.createElement("option");
    genre_filter_element.setAttribute("id", genre);
    genre_filter_element.setAttribute("value", genre);
    genre_filter_element.innerText += genre;
    genre_filter.append(genre_filter_element);
  }
}

function createSourceFilter() {
  sources = Array.from(new Set(globalData.map((elem) => elem.source_type)));
  source_filter = document.getElementById("source_select")
  source_filter.innerHTML = "";

  let source_filter_element = document.createElement("option");
  source_filter_element.setAttribute("id", "none_source");
  source_filter_element.setAttribute("value", "none");
  source_filter_element.setAttribute("selected", "selected");
  source_filter_element.innerText += "Choose an Option";
  source_filter.append(source_filter_element);
  
  for (let source of sources) {
    let source_filter_element = document.createElement("option");
    source_filter_element.setAttribute("id", source);
    source_filter_element.setAttribute("value", source);
    source_filter_element.innerText += source;
    source_filter.append(source_filter_element);
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
//    .domain([2.5, d3.max(data, (d) => Math.log(d.members_count) / Math.log(10))])
    .domain([2.5, 7])
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
    .attr("x", svgWidth - margin - 10)
    .attr("y", svgHeight - 25)
    .attr("font-size", 10)
    .attr("text-anchor", "middle")
    .text("Popularity");
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

function createSunburst() {
  treeData = buildTree(selectedData);

  // Core sunburst
  const svgWidth = d3.select("#Sunburst").node().clientWidth;
  const svgHeight = d3.select("#Sunburst").node().clientHeight;
  const margin = 10;

  const radius = Math.min(svgWidth - margin, svgHeight - margin) / 2;

  const partition = d3.partition().size([2 * Math.PI, radius]);

  const arc = d3
  .arc()
  .startAngle(d => d.x0)
  .endAngle(d => d.x1)
  .innerRadius(function (d) {
    switch (d.depth) {
      case 0:
        return d.y0 * 0.4;
      case 1:
        return d.y0 * 0.5;
      case 2:
        return d.y0;
      default:
        return d.y0;
    }
  })
  .outerRadius(d => d.y1);

  const svg = d3
    .select("#Sunburst")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const root = d3
    .hierarchy(treeData)
    .sum(function (d) {
      if ((!individualSelectionActive && sunburstData.length > 200) || (individualSelectionActive && individualSelectedData.length > 200))
        return Math.max(d.value, 5);
      else
        return d.value;
    })
    .sort(function (a, b) {
      if (a.depth == 1)
        return b.data.sum - a.data.sum;
      else
        return b.data.value - a.data.value;
    });

  const nodes = partition(root).descendants();

  const g = svg
    .append("g")
    .attr("transform", `translate(${svgWidth / 2}, ${svgHeight / 2})`);

  g
    .selectAll("path")
    .data(nodes)
    .enter()
    .append("path")
    .attr("d", arc)
    .style("fill", function (d) {
      switch (d.depth) {
        case 0:
          return "none";
        case 1:
          return "steelblue";
        case 2:
          return "lightblue";

        default:
          break;
      }
      return "steelblue";
    })
    .style("stroke-width", "0.5px")
    .style("stroke", "black")
    .on("mouseover", mouseOverSunburst)
    .on("mouseleave", mouseLeaveSunburst)
    .on("click", clickPath);

  // Create a new <g> for labels and rectangles
  const labelGroup = g.append("g").attr("transform", `translate(${-svgWidth / 2}, ${-svgHeight / 2})`);

  // Source Rectangle and Text
  labelGroup
    .append("rect")
    .attr("class", "source")
    .attr("x", svgWidth - 90)
    .attr("y", 50)
    .attr("width", 60)
    .attr("height", 20)
    .style("fill", "lightblue")
    .style("stroke", "black");

  labelGroup
    .append("text")
    .attr("class", "source")
    .attr("x", svgWidth - 60)
    .attr("y", 65)
    .attr("text-anchor", "middle")
    .text("Source")
    .style("font-size", "12px")
    .style("fill", "black");

  // Genre Rectangle and Text
  labelGroup
    .append("rect")
    .attr("class", "genre")
    .attr("x", svgWidth - 90)
    .attr("y", 25)
    .attr("width", 60)
    .attr("height", 20)
    .style("fill", "steelblue")
    .style("stroke", "black");

  labelGroup
    .append("text")
    .attr("class", "genre")
    .attr("x", svgWidth - 60)
    .attr("y", 40)
    .attr("text-anchor", "middle")
    .text("Genre")
    .style("font-size", "12px")
    .style("fill", "white");

  
  // Total Selected Anime Text
  labelGroup
    .append("text")
    .attr("class", "total")
    .attr("x", margin + 10)
    .attr("y", 40)
    .attr("text-anchor", "start")
    .text(`Total anime selected: ${selectedData.length}`)
    .style("font-size", "12px")
    .style("fill", "steelblue");
   
  const zoomSunburst = d3.zoom()
  .scaleExtent([1, 5]) // Zoom scale limits
  .extent([[0, 0], [svgWidth, svgHeight]]) 
  .translateExtent([[0, 0], [svgWidth, svgHeight]])
  .filter(function(event) {
    // Only allow drag (pan) actions, ignore double-click and wheel events for zooming
    return event.type !== 'dblclick';
  })
  .on("zoom", function (event) {
    const { transform } = event; // Get current zoom transformation
    const [mouseX, mouseY] = d3.pointer(event, svg.node());

    // Adjust the new translation values by combining the zoom transform with the initial centering
    const translateX = (svgWidth / 2) * transform.k + transform.x;
    const translateY = (svgHeight / 2) * transform.k + transform.y;

    // Apply both the zoom and the initial center transform
    g.attr("transform", `translate(${translateX}, ${translateY}) scale(${transform.k})`);
  });

  // Apply zoom only to the sunburst SVG, not other elements
  svg.call(zoomSunburst);
}

function createLinechart() {
  // Define the color scale for seasons
  const colorScale = d3.scaleOrdinal()
    .domain(["Spring", "Summer", "Fall", "Winter"])
    .range(["LimeGreen", "Gold", "DarkOrange", "Purple"]);

  // Define the order of seasons
  const seasonOrder = ["Winter", "Spring", "Summer", "Fall"];

  // Sort by year and season with custom order of seasons and ensure years are sorted numerically
  const sortedData = [];

  // Group by year and season
  const groupedData = d3.group(globalData, d => d.year, d => d.season);

  // Sort by year numerically
  const sortedYears = Array.from(groupedData.keys()).sort((a, b) => a - b);

  // Iterate over each year and order its seasons properly
  sortedYears.forEach(year => {
    const seasonData = groupedData.get(year);
    seasonOrder.forEach(season => {
      if (seasonData.has(season)) {
        const seasonValues = seasonData.get(season);
        const mean = d3.mean(seasonValues, d => d.score);
        sortedData.push({ year, season, meanScore: mean });
      }
    });
  });

  // Define SVG dimensions and margins
  const svgWidth = d3.select("#ScentedPlot").node().clientWidth;
  const svgHeight = d3.select("#ScentedPlot").node().clientHeight;

  const margin = { top: 20, bottom: 40, left: 60, right: 60 };

  const svg = d3
    .select("#ScentedPlot")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  // Create a band scale for X-axis (based on sortedData order)
  const xScale = d3
    .scaleBand()
    .domain(sortedData.map(d => `${d.year}-${d.season}`)) // Keep the sorted data order
    .range([margin.left, svgWidth - margin.right])
    .padding(0.2);

  // Y Scale for the mean points
  const yScale = d3
    .scaleLinear()
    .domain([d3.min(sortedData, d => d.meanScore), d3.max(sortedData, d => d.meanScore)])
    .nice()
    .range([svgHeight - margin.bottom, margin.top]);

  // Line generator function
  const line = d3
    .line()
    .x(d => xScale(`${d.year}-${d.season}`) + xScale.bandwidth() / 2)
    .y(d => yScale(d.meanScore));

  // Draw line path
  svg
    .append("path")
    .datum(sortedData)
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line);

  // Draw circles on data points
  svg
    .selectAll("circle")
    .data(sortedData)
    .enter()
    .append("circle")
    .attr("cx", d => xScale(`${d.year}-${d.season}`) + xScale.bandwidth() / 2)
    .attr("cy", d => yScale(d.meanScore))
    .attr("r", 4)
    .attr("fill", function(d) { return colorScale(d.season); })
    .style("stroke", "black")
    .on("mouseover", mouseOverLineChart)
    .on("mouseleave", mouseLeaveLineChart);

  // X Axis with year ticks for Winter, color ticks for seasons
  const xAxis = d3.axisBottom(xScale)
    .tickFormat(d => {
      const [year, season] = d.split("-");
      return season === "Winter" ? year : ""; // Only show year on Winter
    });

  const xAxisGroup = svg
    .append("g")
    .attr("transform", `translate(0, ${svgHeight - margin.bottom})`)
    .call(xAxis);

  // Style X-axis ticks: Year on Winter, colored ticks for seasons
  xAxisGroup
    .selectAll(".tick")
    .each(function (d) {
      const [year, season] = d.split("-");
      const tick = d3.select(this);

      if (season === "Winter") {
        // Longer, thicker ticks for Winter (year) with color from colorScale
        tick.select("line")
          .attr("y2", 10)
          .style("stroke", colorScale("Winter"))
          .style("stroke-width", "2px");

        tick.select("text")
          .attr("dy", "15px")
          .style("fill", "black")
          .style("font-weight", "bold");
      } else {
        // Shorter, thicker, colored ticks for seasons, no text
        const color = colorScale(season);
        tick.select("line")
          .attr("y2", 7) // Make the ticks shorter than Winter ticks
          .style("stroke", color)
          .style("stroke-width", "2px");

        tick.select("text").remove(); // Remove text for seasons
      }
    });

  // Y Axis for mean points
  svg
    .append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale));

  svg
    .append("text")
    .attr("x", margin.left - 10)
    .attr("y", margin.top - 10)
    .attr("font-size", 10)
    .attr("text-anchor", "middle")
    .text("Mean Score");
}

function buildTree(data) {
  tree = { name: "Total", children: [] };

  data.forEach((item) => {
    const { genres, source_type } = item;

     genres.forEach((genre) => {
      let genreNode = tree.children.find((node) => node.name === genre);
      if (!genreNode) {
        genreNode = { name: genre, children: [], sum: 0 };
        tree.children.push(genreNode);
      }

      let sourceNode = genreNode.children.find((node) => node.name === source_type);
      if (!sourceNode) {
        sourceNode = { name: source_type, value: 1 };
        genreNode.children.push(sourceNode);
      } else {
        sourceNode.value += 1;
      }
      genreNode.sum += 1;
    });
  });

  if (tree.children.length == 0 || selectedData == 0) {
    tree = { name: "Total", children: [] };
    emptyNode = { name: "empty", children: [{ name: "empty", value: 1 }] };
    tree.children.push(emptyNode);
  }

  return tree;
}

// Interaction managers
function clickAnime(event, d) {
  //if all points are selected, it means its the first selection so make that the only selected point
  clicked_anime_id = d.anime_id;
  updateDueToIndividualSelection = true;

  updateData();
}

function mouseOverAnime(event, d) {
  d3
    .select("#ScatterPlot")
    .selectAll("circle")
    .filter((data) => data.anime_id == d.anime_id)
    .style("cursor", "pointer")
    .style("stroke-width", "3px")
    .attr("r", 6);

    tooltip
    .style("visibility", "visible")
    .html(
      `<strong>Title:</strong> ${d.title}<br>
        <strong>Score:</strong> ${d.score}<br>
        <strong>Members:</strong> ${d.members_count}<br>
        <strong>Season:</strong> ${d.season}<br>
        <strong>Number of Episodes:</strong> ${d.num_episodes}<br>
        <strong>Source Type:</strong> ${d.source_type}<br>
        <strong>Genres:</strong> ${d.genres}`
    )

  const tooltipWidth = parseInt(tooltip.style("width"), 10);
  const tooltipHeight = parseInt(tooltip.style("height"), 10);
  let top = event.pageY;

  tooltip
    .style("top", `${top}px`)
    .style("left", `16%`);

  if (mouse_down)
    brushCircle(d);
}

function mouseLeaveAnime(event, d) {
  tooltip.style("visibility", "hidden");
  d3
    .select("#ScatterPlot")
    .selectAll("circle")
    .filter((data) => data.anime_id == d.anime_id)
    .style("stroke-width", "1px")
    .attr("r", 3);
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
}

function changeScore(v1, v2) {
  prev_score_min = score_min;
  score_min = v1;
  prev_score_max = score_max;
  score_max = v2;

  // Update data and visuals
  updateData();
}

function changePopularity(v1, v2) {
  prev_pop_min = pop_min;
  pop_min = v1;
  prev_pop_max = pop_max;
  pop_max = v2;

  // Update data and visuals
  updateData();
}

function clickGenre() {
  prev_genre = genre;
  genre_filter = document.getElementById("genre_select");
  genre = genre_filter.value;
  
  if (genre == "none")
    genre = null;
  
  // Update data and visuals
  updateData();
}

function clickSource() {
  prev_source = source;
  source_filter = document.getElementById("source_select");
  source = source_filter.value;
  
  if (source == "none")
    source = null;
  
  updateData();
}

function resetFilters() {
  prev_score_min = score_min;
  prev_score_max = score_max;
  prev_pop_min = pop_min;
  prev_pop_max = pop_max;
  prev_season = season;
  prev_genre = genre;
  prev_source = source;

  score_min = null;
  score_max = null;
  pop_min = null;
  pop_max = null;
  season = null;
  genre = null;
  source = null;

  individualSelectedData = [];

  document.querySelectorAll('.season_button').forEach(function (btn) {
    btn.classList.remove('active');
  });

  document.getElementById("genre_select").value = "none";
  document.getElementById("source_select").value = "none";

  updateScoreSlider(3, 9.5);
  updatePopularitySlider(2.5, 7);
  
  updateData();
}

function resetIndividualSelection() {
  individualSelectedData = [];
  updateData();
}

function resetScatterPlotZoom() {
  const svg = d3.select("#ScatterPlot").select("svg");
  svg.transition().duration(500).call(zoomBehavior.transform, d3.zoomIdentity);
}

function clickCircle(event, d) {
  clicked_anime_id = d.anime_id;
  updateDueToIndividualSelection = true;

  updateData();
}

function brushCircle(d) {
  //if all points are selected, it means its the first selection so make that the only selected point
  if (!individualSelectedData.some((anime) => anime.anime_id == d.anime_id)) {
    brushed_anime_id = d.anime_id;
  }
  updateDueToIndividualSelection = true;

  updateData();
}

function clickBin(event, d) {
  // select a bin if none was selected; else, select none
  prev_score_min = score_min;
  prev_score_max = score_max;
  if ((score_min == d.x0) && (score_max == d.x0 + 0.5)) {
    score_min = score_min != null ? null : d.x0;
    score_max = score_max != null ? null : d.x0 + 0.5;
  }
  else {
    score_min = d.x0;
    score_max = d.x0 + 0.5;
  }

  if (score_min == null) {
    updateScoreSlider(3, 9.5);
  } else {
    updateScoreSlider(score_min, score_max);
  }
  
  updateData();
}

function clickPath(event, d) {
  genre_filter = document.getElementById("genre_select");
  if (d.depth == 1) {
    prev_genre = genre;
    if (d.data.name == genre && source == null) {
      genre = null;
      genre_filter.value = "none";
    }
    else if (d.data.name == genre && source != null) {
      source = null;
      source_filter.value = "none";
    }
    else {
      genre = d.data.name;
      genre_filter.value = genre;
    }
  }
  else if (d.depth == 2) {
    source_filter = document.getElementById("source_select");
    prev_source = source;
    prev_genre = genre;
    if (d.data.name == source && d.parent.data.name == genre) {
      genre = null;
      genre_filter.value = "none";
    }
    else if (d.data.name == source && genre == null) {
      source = null;
      source_filter.value = "none";
    }
    else {
      source = d.data.name;
      source_filter.value = source;
      genre = d.parent.data.name;
      genre_filter.value = genre;
    }
  }
  
  // Update data and visuals
  updateData();
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

  selectedData = globalData;
  selectionActive = false;

  if (score_min != null) {
    selectedData = globalData.filter(function (elem) {
      return score_min <= elem.score && score_max > elem.score;
    });
    individualSelectedData = individualSelectedData.filter(function (elem) {
      return score_min <= elem.score && score_max > elem.score;
    });
    selectionActive = true;
    binSelectionActive = true;
  }

  if (pop_min != null) {
    selectedData = globalData.filter(function (elem) {
      return pop_min <= Math.log(elem.members_count) / Math.log(10) && pop_max > Math.log(elem.members_count) / Math.log(10);
    });
    individualSelectedData = individualSelectedData.filter(function (elem) {
      return pop_min <= Math.log(elem.members_count) / Math.log(10) && pop_max > Math.log(elem.members_count) / Math.log(10);
    });
    selectionActive = true;
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

  sunburstData = selectedData;

  if (genre != null) {
    selectedData = selectedData.filter(function (elem) {
      return elem.genres.includes(genre);
    });
    individualSelectedData = individualSelectedData.filter(function (elem) {
      return elem.genres.includes(genre);
    });
    selectionActive = true;
  }

  if (source != null) {
    selectedData = selectedData.filter(function (elem) {
      return elem.source_type == source;
    });
    individualSelectedData = individualSelectedData.filter(function (elem) {
      return elem.source_type == source;
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

  if (prev_genre != genre) 
    changed_genre = true;
  else
    changed_genre = false;
  prev_genre = genre;

  if (prev_source != source) 
    changed_source = true;
  else
    changed_source = false;
  prev_source = source;

  if ((prev_score_min != score_min) || (prev_score_max != score_max)) 
    changed_bin = true;
  else
    changed_bin = false;
  prev_score_min = score_min;
  prev_score_max = score_max;

  if ((prev_pop_min != pop_min) || (prev_pop_max != pop_max)) 
    changed_pop = true;
  else
    changed_pop = false;
  prev_pop_min = pop_min;
  prev_pop_max = pop_max;

  // Use setTimeout to ensure the DOM updates after data reset
  setTimeout(() => {
    createAnimeList();
    updateHistogram(globalData);
    updateScatterPlot(globalData);
    updateSunburst();
  }, 0);
}

function mouseOverScatterPlot(event, d) {
  d3.select(this)
    .style("cursor", "pointer")
    .style("stroke-width", "3px")
    .attr("r", 6);

    tooltip
    .style("visibility", "visible")
    .html(
      `<strong>Title:</strong> ${d.title}<br>
        <strong>Score:</strong> ${d.score}<br>
        <strong>Members:</strong> ${d.members_count}<br>
        <strong>Season:</strong> ${d.season}`
    )

  const tooltipWidth = parseInt(tooltip.style("width"), 10);
  const tooltipHeight = parseInt(tooltip.style("height"), 10);
  let top = event.pageY - tooltipHeight - 10;
  let left = event.pageX + 10;

  if (left + tooltipWidth > window.innerWidth) {
    left = event.pageX - tooltipWidth - 30; //position to the left of the mouse if there's not enough space to the right
  }

  tooltip
    .style("top", `${top}px`)
    .style("left", `${left}px`);

  if (mouse_down)
    brushCircle(d);
}

function mouseLeaveScatterPlot(event, d) {
  tooltip.style("visibility", "hidden");
  d3.select(this)
    .style("stroke-width", "1px")
    .attr("r", 3);
}

function mouseOverScatterPlot(event, d) {
  d3.select(this)
    .style("cursor", "pointer")
    .style("stroke-width", "3px")
    .attr("r", 6);

    tooltip
    .style("visibility", "visible")
    .html(
      `<strong>Title:</strong> ${d.title}<br>
        <strong>Score:</strong> ${d.score}<br>
        <strong>Members:</strong> ${d.members_count}<br>
        <strong>Season:</strong> ${d.season}`
    )

  const tooltipWidth = parseInt(tooltip.style("width"), 10);
  const tooltipHeight = parseInt(tooltip.style("height"), 10);
  let top = event.pageY - tooltipHeight - 10;
  let left = event.pageX + 10;

  if (left + tooltipWidth > window.innerWidth) {
    left = event.pageX - tooltipWidth - 30; //position to the left of the mouse if there's not enough space to the right
  }

  tooltip
    .style("top", `${top}px`)
    .style("left", `${left}px`);

  if (mouse_down)
    brushCircle(d);
}

function mouseLeaveScatterPlot(event, d) {
  tooltip.style("visibility", "hidden");
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

    tooltip
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

  tooltip.style("visibility", "hidden");
  d3.select(this)
    .style("stroke-width", "1px")
    .attr("r", 3);
}

function mouseOverSunburst(event, d) {
  d3.select(this)
    .style("cursor", "pointer")
    .style("stroke-width", "1.6px")
    .attr("r", 6)
    .raise();

  if (d.data.name == "empty")
    tooltip.html(
      `No anime selected`
    );
  else if (d.depth == 1)
    tooltip.html(
      `<strong>Genre:</strong> ${d.data.name}<br>
        <strong>Count:</strong> ${d.data.sum}`
    );
  else
    tooltip.html(
     `<strong>Genre:</strong> ${d.parent.data.name}<br>
      <strong>Source:</strong> ${d.data.name}<br>
      <strong>Count:</strong> ${d.data.value}`
    );

  tooltip
    .style("visibility", "visible")
    .style("top", `${event.pageY - 30}px`)
    .style("left", `${event.pageX + 10}px`);
}

function mouseLeaveSunburst(event, d) {
  tooltip.style("visibility", "hidden");
  d3.select(this)
    .style("stroke-width", "0.5px")
    .attr("r", 3);
}

function mouseOverLineChart(event, d) {
  d3.select(this)
    .style("cursor", "pointer")
    .style("stroke-width", "3px")
    .attr("r", 8);

    tooltip
    .style("visibility", "visible")
    .html(
      `<strong>Year:</strong> ${d.year}<br>
        <strong>Season:</strong> ${d.season}<br>
        <strong>Mean Score:</strong> ${d.meanScore.toFixed(2)}`
    )

  const tooltipWidth = parseInt(tooltip.style("width"), 10);
  const tooltipHeight = parseInt(tooltip.style("height"), 10);
  let top = event.pageY - tooltipHeight - 10;
  let left = event.pageX + 10;

  if (left + tooltipWidth > window.innerWidth) {
    left = event.pageX - tooltipWidth - 30; //position to the left of the mouse if there's not enough space to the right
  }
  if (top < 0) {
    top = event.pageY;
  }

  tooltip
    .style("top", `${top}px`)
    .style("left", `${left}px`);

  if (mouse_down)
    brushCircle(d);
}

function mouseLeaveLineChart(event, d) {
  tooltip.style("visibility", "hidden");
  d3.select(this)
    .style("stroke-width", "1px")
    .attr("r", 4);
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

  if (changed_bin || changed_pop || changed_season || changed_genre || changed_source) {
    xScale = d3
      .scaleLinear()
      .domain((pop_min != null) ? [pop_min, pop_max] : [2.5, 7])
      .range([margin + 50, svgWidth - margin]);
    x_scale = xScale;
    yScale = d3
      .scaleLinear()
      .domain((score_min != null) ? [score_max, score_min] : [9.5, 3])
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
      .filter((d) => genre == null || d.genres.includes(genre))
      .filter((d) => source == null || d.source_type == source)
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

function updateSunburst() {
  if (individualSelectionActive)
    treeData = buildTree(individualSelectedData);
  else
    treeData = buildTree(sunburstData);

  // Core sunburst
  const svgWidth = d3.select("#Sunburst").node().clientWidth;
  const svgHeight = d3.select("#Sunburst").node().clientHeight;
  const margin = 10;

  const radius = Math.min(svgWidth - margin, svgHeight - margin) / 2;

  const partition = d3.partition().size([2 * Math.PI, radius]);

  const arc = d3
  .arc()
  .startAngle(d => d.x0)
  .endAngle(d => d.x1)
  .innerRadius(function (d) {
    switch (d.depth) {
      case 0:
        return d.y0 * 0.4;
      case 1:
        return d.y0 * 0.5;
      case 2:
        return d.y0;
      default:
        return d.y0;
    }
  })
  .outerRadius(d => d.y1);

  const svg = d3
    .select("#Sunburst")
    .select("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const root = d3
    .hierarchy(treeData)
    .sum(function (d) {
      if ((!individualSelectionActive && sunburstData.length > 200) || (individualSelectionActive && individualSelectedData.length > 200))
        return Math.max(d.value, 5);
      else
        return d.value;
    })
    .sort(function (a, b) {
      if (a.depth == 1)
        return b.data.sum - a.data.sum;
      else
        return b.data.value - a.data.value;
    });

  const nodes = partition(root).descendants();

  const paths = svg.select("g").selectAll("path").data(nodes);
  
  paths.exit().remove();
  
  const pathsEnter = paths.enter()
    .append("path")
    .attr("d", arc);

  colorPalette = ["steelblue", "lightblue", "White", "Black"];

  switch (season) {
    case "Spring":
      colorPalette = ["LimeGreen", "PaleGreen", "Black", "Black"];
      break;
    case "Summer":
      colorPalette = ["Gold", "LemonChiffon", "Black", "Black"];
      break;
    case "Fall":
      colorPalette = ["DarkOrange", "PeachPuff", "Black", "Black"];
      break;
    case "Winter":
      colorPalette = ["Purple", "Plum", "White", "Black"];
      break;
  }

  pathsEnter.merge(paths)
    .style("fill", function (d) {
      if (d.data.name === "empty")
        return "gray";
      else if (d.depth === 0)
        return "none";
      else if (d.depth === 1 && (genre == null || d.data.name === genre))
        return colorPalette[0];
      else if (d.depth === 2 && (source == null || (d.data.name === source)) && (d.parent.data.name === genre || genre == null))
        return colorPalette[1];
      else {
        return "gray";
      }
    })
    .style("stroke", "black")
    .style("stroke-width", "0.5px")
    .on("mouseover", mouseOverSunburst)
    .on("mouseleave", mouseLeaveSunburst)
    .on("click", clickPath)
    .attr("d", arc);

  totalSelected = individualSelectionActive ? individualSelectedData.length : selectedData.length;
  svg.select("rect.genre").style("fill", colorPalette[0]);
  svg.select("rect.source").style("fill", colorPalette[1]);
  svg.select("text.genre").style("fill", colorPalette[2]);
  svg.select("text.source").style("fill", colorPalette[3]);
  svg.select("text.total").text(`Total anime selected: ${totalSelected}`);
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