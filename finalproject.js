var w = 1850;
var h = 1700;
var scaleX = w / (2 * Math.PI); // Adjust the scale based on the desired width

var aggregatedData = {}; // Object to store aggregated values per country

d3.csv("edu1.csv").then(function(csv) {
    csv.forEach(function(d) {
        var country = d.Country;
        var value = parseInt(d.Value);
        
        // If the country already exists in the aggregated data, add the value to it, otherwise create a new entry
        if (aggregatedData[country]) {
            aggregatedData[country] += value;
        } else {
            aggregatedData[country] = value;
        }
    });

    var svg = d3.select("#geo")
        .append("svg")
        .attr("width", w)
        .attr("height", h)
        .style("background-color", "lightblue");
    
    // Define color scale
    var color = d3.scaleQuantize()
        .domain([
            d3.min(Object.values(aggregatedData)),
            d3.max(Object.values(aggregatedData))
        ])
        .range(['#32863C','#226144','#1A4F42']);
        
    var projection = d3.geoMercator()
        .center([0, 0]) // Center the map at the Pacific Ocean
        .translate([w / 2, h / 2]) // Translate to the center of the SVG
        .scale(scaleX); // Set the scale to stretch the map horizontally

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
        json.features.forEach(function(feature) {
            var country = feature.properties.sovereignt;
            if (aggregatedData[country]) {
                feature.properties.value = aggregatedData[country];
            }
        });

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
         
    });
});







/*
var projection = d3.geoMercator()
                .center([0, 0]) // Center the map at the Pacific Ocean
                .translate([w / 2, h / 2]) // Translate to the center of the SVG
                .scale(scaleX); // Set the scale to stretch the map horizontally

     
    

var path = d3.geoPath()
    .projection(projection);



// Draw the map
var svg = d3.select("body")
    .append("svg")
    .attr("width", w)
    .attr("height", h)
    .attr("fill", "grey")



// Load the JSON data and draw the map
d3.json("custom.json").then(function(json){
    
    svg.selectAll("path")
        .data(json.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", "grey")
        .attr("stroke", "black")    
});

*/
