var globalData;
var selectedData = [];
var individualSelectedData = [];

var bin = null;
var prev_bin = null;
var season = null;
var changedLayout = false;

mouse_down = false


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

  svg
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
    .on("mouseover", mouseOverFunction)
    .on("mouseleave", mouseLeaveFunction)
    .on("click", clickCircle)
    .append("title")
    .text((d) => "Title: " + d.title + "\nScore: " + d.score + "\nNumber of Members: " + d.members_count);
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
    .text("Score");
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
    .attr("y", margin - 30)
    .attr("font-size", 10)
    .attr("text-anchor", "middle")
    .text("Count");
}


// Interaction managers
function clickAnime(id) {
  //if all points are selected, it means its the first selection so make that the only selected point
  if (individualSelectedData.some((anime) => anime.anime_id == id)) {
    individualSelectedData = individualSelectedData.filter(function (elem) {
      return id != elem.anime_id;
    });
  } else {
    individualSelectedData.push(  
      selectedData.filter(function (elem) {
        return id == elem.anime_id;
      })[0]
    );
  }

  updateData();
  createAnimeList();
  updateHistogram(globalData);
  updateScatterPlot(globalData);
}

function clickSeason(name) {
  //the point being gray means clicking it always results in adding it to the selection
  if (season == name) season = null;
  else season = name;

  // Update active button styles
  updateSeasonButtons();
  individualSelectedData = [];

  // Update data and visuals
  updateData();
  createAnimeList();
  updateHistogram(globalData);
  updateScatterPlot(globalData);
  }

function updateSeasonButtons() {
  document.querySelectorAll('.season_button').forEach(function (btn) {
    btn.classList.remove('active');
  });

  if (season != null) {
    document.getElementById(season.toLowerCase() + '_button').classList.add('active');
  }
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
  if (!d || !d.anime_id) return;  // Exit if data is invalid

  if (individualSelectedData.some((anime) => anime.anime_id == d.anime_id)) {
    individualSelectedData = individualSelectedData.filter(function (elem) {
      return d.anime_id != elem.anime_id;
    });
  } else {
    individualSelectedData.push(d);
  }

  updateData();
  createAnimeList();
  updateHistogram(globalData);
  updateScatterPlot(globalData);
}

function brushCircle(d) {
  //if all points are selected, it means its the first selection so make that the only selected point
  if (!individualSelectedData.some((anime) => anime.anime_id == d.anime_id)) {
    individualSelectedData.push(  
      selectedData.filter(function (elem) {
        return d.anime_id == elem.anime_id;
      })[0]
    );
  }

  updateData();
  createAnimeList();
  updateHistogram(globalData);
  updateScatterPlot(globalData);
}

function clickBin(event, d) {
  // select a bin if none was selected; else, select none
  prev_bin = bin;
  if (bin == d.x0)
    bin = bin != null ? bin = null : bin = d.x0;
  else
    bin = d.x0

  updateData();
  createAnimeList();
  updateScatterPlot(globalData);
  updateHistogram(globalData);
}

function updateData() {
  if (bin != null) {
    selectedData = globalData.filter(function (elem) {
      return bin <= elem.score && bin + 0.5 > elem.score;
    });
    individualSelectedData = individualSelectedData.filter(function (elem) {
      return bin <= elem.score && bin + 0.5 > elem.score;
    });
  } else {
    selectedData = globalData;
  }
  
  if (season != null) {
    selectedData = selectedData.filter(function (elem) {
      return elem.season == season;
    });
    individualSelectedData = individualSelectedData.filter(function (elem) {
      return elem.season == season;
    });
  }

  if (prev_bin != bin)
    changedLayout = true;
  else
    changedLayout = false;

  prev_bin = bin;
}

function mouseOverFunction(event, d) {
  d3.select(this)
    .style("cursor", "pointer")
    .style("stroke-width", "3px")
    .attr("r", 6);
  
  if (mouse_down)
    brushCircle(d);
}

function mouseLeaveFunction(event, d) {
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

  // Define scales
  const xScale = d3
    .scaleLinear()
    .domain([2.5, d3.max(data, (d) => Math.log(d.members_count) / Math.log(10))])
    .range([margin + 50, svgWidth - margin]);

  const yScale = d3
    .scaleLinear()
    .domain((bin != null) ? [bin + 0.5, bin] : [9.5, 3])
    .range([margin, svgHeight - margin - 50]);

  const colorScale = d3.scaleOrdinal()
    .domain(["Spring", "Summer", "Fall", "Winter"])
    .range(["LimeGreen", "Gold", "DarkOrange", "Purple"]);

  // Remove circles that are no longer in the data
  svg.selectAll("circle")
    .filter(d => !selectedData.some(sd => sd.anime_id === d.anime_id))
    .remove();
  
  // Update existing circles and add new ones
  const circles = svg.selectAll("circle")
    .data(selectedData, d => d.anime_id);
  
  circles.enter()
    .append("circle")
    .attr("r", 3)
    .merge(circles)
    .attr("cx", (d) => xScale(Math.log(d.members_count) / Math.log(10)))
    .attr("cy", (d) => yScale(d.score))
    .style("opacity", 1)
    .style("stroke", "grey")  // Add stroke
    .style("stroke-width", 1)  // Add stroke width
    .on("mouseover", mouseOverFunction)
    .on("mouseleave", mouseLeaveFunction)
    .on("click", clickCircle);

  circles.exit().remove();

  // Update axes
  svg.select("g.xAxis")
    .transition()
    .duration(1000)
    .attr("transform", `translate(0,${svgHeight - margin})`)
    .call(d3.axisBottom(xScale).tickSizeOuter(0).tickFormat(d3.format(".2")));

  svg.select("g.yAxis")
    .transition()
    .duration(1000)
    .attr("transform", `translate(${margin},0)`)
    .call(d3.axisLeft(yScale));

  // Update colors based on selection
  if (individualSelectedData.length != 0) {
    svg.selectAll("circle")
      .attr("fill", "gray");
    svg.selectAll("circle")
      .filter((data) => individualSelectedData.includes(data))
      .attr("fill", (d) => colorScale(d.season));
  } else {
    svg.selectAll("circle")
      .attr("fill", (d) => colorScale(d.season));
  }
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
    .range([margin + 50, svgWidth - margin]);
  
  const histogram = d3.histogram().domain(xScale.domain()).thresholds(xScale.ticks(14));
  const bins = histogram(scoreData);
  const selectedBins = histogram(selectedScoreData);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(bins, function (d) {return d.length;})])
    .range([svgHeight - margin, margin - 25]);

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
    .style("stroke", "black")
    .style("fill", function (d) {
      res = "steelblue";
      if (individualSelectedData.length != selectedData.length) {
        individualSelectedData.forEach((elem) => {
          if (elem.score >= d.x0 && elem.score < d.x0 + 0.5) {
            d3.select(this).raise();
            res = "darkblue";
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


document.body.onmousedown = function(evt) {
  if (evt.buttons & 1)
    mouse_down = true;
}
document.body.onmouseup = function(evt) {
  if (!(evt.buttons & 1))
    mouse_down = false;
}