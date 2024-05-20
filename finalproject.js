var w = 1300;
var h = 800;
var scaleX = w / (2 * Math.PI);

var csvData = [];
var selectedYear;
var selectedLevel = "Short-cycle tertiary education";
var playInterval;
var playing = false;
var formatValue = d3.format(","); // Format numbers with commas


d3.csv("sorted.csv").then(function(csv) {
    
    var svg = d3.select("#geo")
        .append("svg")
        .attr("width", w)
        .attr("height", h)
        .style("background-color", "transparent");
    
    var g = svg.append("g");

    var years = d3.range(2013, 2022);

    var svg1 = d3.select("#slide")
        .append("svg")
        .attr("width", 800)
        .attr("height", 100);

    var xScale = d3.scaleLinear()
        .domain([2013, 2021])
        .range([50, 750])
        .clamp(true);

    svg1.selectAll("text")
        .data(years)
        .enter()
        .append("text")
        .attr("x", function(d) { return xScale(d); })
        .attr("y", 50)
        .attr("dy", "1em")
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .text(function(d) { return d; });

    svg1.append("line")
        .attr("x1", xScale.range()[0])
        .attr("y1", 40)
        .attr("x2", xScale.range()[1])
        .attr("y2", 40)
        .attr("stroke", "black")
        .attr("stroke-width", 4);

    csv.forEach(function(d) {
        csvData.push({
            country: d.Country,
            value: parseInt(d.sum),
            year: parseInt(d.year),
            level: d.edu_level
        });
    });

    var color = d3.scaleQuantile()
                .domain([0, 100, 1000, 10000, 50000])
                .range(["#ff9800", "#ff8800", "#ff7800", "#ff3800"]);

    var projection = d3.geoMercator()
        .center([0, 0])
        .translate([w / 2, h / 2]);

    var path = d3.geoPath()
        .projection(projection);
    
    var tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid black")
        .style("padding", "10px")
        .style("pointer-events", "none")
        .style("display", "none");

    svg.on("mousemove", function(event) {
        var mouseX = event.pageX;
        var mouseY = event.pageY;
        tooltip.style("left", (mouseX + 10) + "px")
               .style("top", (mouseY + 20) + "px");
    });

    d3.json("custom.json").then(function(json) {
        function updateMap() {
            for (var i = 0; i < csvData.length; i++) {
                var dataCountry = csvData[i].country;
                var dataValue = csvData[i].value;
                var dataYear = csvData[i].year;
                var dataLevel = csvData[i].level;

                for (var j = 0; j < json.features.length; j++) {
                    var jsonCountry = json.features[j].properties.admin;

                    if (dataCountry === jsonCountry && dataYear === selectedYear && dataLevel === selectedLevel) {
                        json.features[j].properties.value = dataValue;
                    }
                }
            }

            //g.selectAll("path").remove();

            g.selectAll("path")
                .data(json.features)
                .enter()
                .append("path")
                .attr("d", path)
                .style("fill", function(d) {
                    return color("#E7EDD9");
                })
                .attr("stroke", "black")
                .attr("stroke-width", 0.3) // Adjust the width of the stroke
                .on("mouseover", function(event, d) {
                    var value = d.properties.value ? d.properties.value : "N/A";
                    
                    if(value != "N/A") {
                        tooltip.transition()
                            .duration(500)
                            .tween("text", function() {
                                var i = d3.interpolateNumber(0, value);
                                return function(t) {
                                    tooltip.html("Country: " + d.properties.admin + "<br/>Value: " + formatValue(Math.round(i(t))))
                                        .style("display", "block");
                                };
                            });

                    }else{
                        tooltip.html("Country: " + d.properties.admin + "<br/>Value: " + value)
                        tooltip.style("display", "block");
                    }              
                })
                .on("mouseout", function() {
                    tooltip.transition()
                        .duration(0)
                        .style("display", "none");
                });

            g.selectAll("path")
                .transition()
                .duration(500)
                .style("fill", function(d) {
                    var value = d.properties.value;
                    return value ? color(value) : "#E7EDD9";
                });
        }

        selectedYear = years[0];
        updateMap();

        var slider = svg1.append("circle")
            .attr("cx", xScale(selectedYear))
            .attr("cy", 40)
            .attr("r", 8)
            .attr("fill", "darkgreen")
            .call(d3.drag()
                .on("drag", function(event) {
                    var xPos = event.x;
                    xPos = xPos < xScale.range()[0] ? xScale.range()[0] : xPos;
                    xPos = xPos > xScale.range()[1] ? xScale.range()[1] : xPos;
                    d3.select(this).attr("cx", xPos);
                })
                .on("end", function(event) {
                    var xPos = event.x;
                    var closestYear = Math.round(xScale.invert(xPos));
                    closestYear = closestYear < 2013 ? 2013 : closestYear;
                    closestYear = closestYear > 2021 ? 2021 : closestYear;
                    selectedYear = closestYear;
                    d3.select(this).attr("cx", xScale(selectedYear));
                    updateMap();
                })
            );

        d3.select("#education-level").on("change", function() {
            selectedLevel = this.value;
            updateMap();
        });

        d3.select("#play-button").on("click", function() {
            if (!playing) {
                playing = true;
                d3.select(this).text("Pause");
                function playNextYear() {
                    var currentIndex = years.indexOf(selectedYear);
                    if (currentIndex < years.length - 1) {
                        selectedYear = years[currentIndex + 1];
                    } else {
                        playing = false;
                        d3.select("#play-button").text("Play");
                        return; // Stop playing when the last year is reached
                    }
                    slider.transition()
                        .duration(500)
                        .attr("cx", xScale(selectedYear));
                    updateMap();
                    d3.timeout(playNextYear, 2000); // 2 seconds interval for each year
                }
                playNextYear(); // Start the animation
            } else {
                playing = false;
                d3.select(this).text("Play");
            }
        });

    });
});
