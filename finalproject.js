var w = 1300;
var h = 800;
var scaleX = w / (2 * Math.PI); // Adjust the scale based on the desired width

var csvData = [];

var selectedYear;

d3.csv("sorted.csv").then(function(csv) {
    
    var svg = d3.select("#geo")
        .append("svg")
        .attr("width", w)
        .attr("height", h)
        .style("background-color", "lightblue");
    
    var g = svg.append("g");

    // Define the range of years
    var years = d3.range(2013, 2022);

    // Create an SVG element for the slider
    var svg1 = d3.select("#slide")
        .append("svg")
        .attr("width", 800)
        .attr("height", 100);

    // Create a scale for the slider
    var xScale = d3.scaleLinear()
        .domain([2013, 2021])
        .range([50, 750])
        .clamp(true);

    // Add ticks and labels
    svg1.selectAll("text")
        .data(years)
        .enter()
        .append("text")
        .attr("x", function(d) { return xScale(d); })
        .attr("y", 50)
        .attr("dy", "1em")
        .attr("text-anchor", "middle")
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
            year: parseInt(d.year)
        })
        //console.log(csvData);
    });
    
    var color = d3.scaleQuantize()
            .domain([1000, 10000, 100000, 1000000, 10000000])
            .range(["#ff9800", "#ff8800", "#ff7800", "#ff6600", "#ff3800"]);

    var projection = d3.geoMercator()
        .center([0, 0]) // Center the map at the Pacific Ocean
        .translate([w / 2, h / 2]) // Translate to the center of the SVG
        //.scale(200); // Set the scale to stretch the map horizontally

    // Define path generator
    var path = d3.geoPath()
        .projection(projection);
    
    
    // Create the tooltip
    var tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid black")
        .style("padding", "10px")
        .style("pointer-events", "none")
        .style("display", "none"); // Hide initially

    // Attach mousemove event handler to update tooltip position
    svg.on("mousemove", function(d) {
        var mouseX = d.pageX;
        var mouseY = d.pageY;
        tooltip.style("left", (mouseX + 10) + "px")
               .style("top", (mouseY + 20) + "px");
    });


    // Load JSON data
    d3.json("custom.json").then(function(json) {
       
        for (var i = 0; i < csvData.length; i++) {
            //console.log(csvData[i]);
            var dataCountry = csvData[i].country;
            var dataValue = csvData[i].value;
            var dataYear = csvData[i].year;

            for (var j = 0; j < json.features.length; j++) {
                var jsonCountry = json.features[j].properties.sovereignt;
                //console.log(dataCountry);
                //console.log(jsonCountry);
                if(dataCountry === jsonCountry && dataYear === 2013) {
                    json.features[j].properties.value = dataValue;
                    //console.log(json.features[j].properties.value);
                }
            
            }
        }

    
        // Draw map
        svg.selectAll("path")
            .data(json.features)
            .enter()
            .append("path")
            .attr("d", path)      
            .attr("fill", function(d) {
                var value = d.properties.value;
                return value ? color(value) : "#E7EDD9";
            })
            .attr("stroke", "black") // Add black stroke to each country
            .attr("stroke-width", 0.5) // Adjust the width of the stroke
            .on("mouseover", function(i , d) { 
                var countryName = d.properties.name;
                var value = d.properties.value;
                if (countryName) {
                    tooltip.style("display", "block")
                           .html("<strong>" + countryName + "</strong><br>Number of International Students: " + value);
                }
            })
            .on("mouseout", function() {
                tooltip.style("display", "none");
            });

        // Add a draggable slider handle
        var slider = svg1.append("circle")
        .attr("cx", xScale(2013))
        .attr("cy", 40)
        .attr("r", 8)
        .attr("fill", "steelblue")
        .call(d3.drag()
            .on("start", function() {
                d3.select(this).attr("fill", "orange");
            })
            .on("drag", function(event) {
                var xPos = event.x;
                xPos = xPos < xScale.range()[0] ? xScale.range()[0] : xPos;
                xPos = xPos > xScale.range()[1] ? xScale.range()[1] : xPos;
                d3.select(this).attr("cx", xPos);
            })
            .on("end", function() {
                d3.select(this).attr("fill", "steelblue");
                selectedYear = Math.round(xScale.invert(d3.select(this).attr("cx")));
                console.log("Selected Year: " + selectedYear);
                
                // Redo the loop to update values based on the selected year
                for (var i = 0; i < csvData.length; i++) {
                    var dataCountry = csvData[i].country;
                    var dataValue = csvData[i].value;
                    var dataYear = csvData[i].year;

                    for (var j = 0; j < json.features.length; j++) {
                        var jsonCountry = json.features[j].properties.sovereignt;
                        
                        // Update values for the selected year
                        if(dataCountry === jsonCountry && dataYear === selectedYear) {
                            json.features[j].properties.value = dataValue;
                        }
                    }
                }

                // Redraw the map with updated values
                svg.selectAll("path")
                    .data(json.features)
                    .transition()
                    .duration(750)
                    .attr("fill", function(d) {
                        var value = d.properties.value;
                        return value ? color(value) : "#E7EDD9";
                    });

            })
        );

        

    });

});
