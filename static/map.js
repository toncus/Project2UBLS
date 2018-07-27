/*  This visualization was made possible by modifying code provided by:

Scott Murray, Choropleth example from "Interactive Data Visualization for the Web" 
https://github.com/alignedleft/d3-book/blob/master/chapter_12/05_choropleth.html   
		
Malcolm Maclean, tooltips example tutorial
http://www.d3noob.org/2013/01/adding-tooltips-to-d3js-graph.html

Mike Bostock, Pie Chart Legend
http://bl.ocks.org/mbostock/3888852  */

		
//Width and height of map
var width = 960;
var height = 500;

// D3 Projection
var projection = d3.geoAlbersUsa()
				   .translate([width/2, height/2])    // translate to center of screen
				   .scale([1000]);          // scale things down so see entire US
        
// Define path generator
var path = d3.geoPath()               // path generator that will convert GeoJSON to SVG paths
		  	 .projection(projection);  // tell path generator to use albersUsa projection


//Create SVG element and append map to the SVG
var svg = d3.select("#chloropleth")
			.append("svg")
			.attr("width", width)
			.attr("height", height);

var tooltip = d3.select('body').append('div')
			.style('position','absolute')
			.style('padding','0 5px')
			.style('background','grey')
			.style('color','white');
				   
// Append Div for tooltip to SVG
var div = d3.select("body")
		    .append("div")   
    		.attr("class", "tooltip")               
    		.style("opacity", 0);

// Load GeoJSON data and merge with states data
d3.json("/us-states", function(json) {
		
// Bind the data to the SVG and create one path per GeoJSON feature
svg.selectAll("path")
	.data(json.features)
	.enter()
	.append("path")
    .attr("d", path)
	.attr("id",function(d){return d.properties.name;})
	.attr("onclick", "$('#chart').animatescroll();")
	.style("stroke", "#fff")
	.style("stroke-width", "1")
	.style("fill", function(d) {

	// Get data value
	var value = d.properties.visited;

	if (value) {
	//If value exists…
	return color(value);
	} else {
	//If value is undefined…
	return "rgb(213,222,217)";
	}
}).on("click", sunburstPlot)
.on('mousemove',function(d){
	tooltip.transition()
			.style('opacity',0.8)
			.duration(10)
	tooltip.html(d.properties.name)
			.style('left',(d3.mouse(this)[0]) + 'px')
			.style('top',(d3.mouse(this)[1] +145) + 'px')
})
.on('mouseout', function(d) {
	tooltip.transition()
			.style('opacity',0.0)
			.style('pointer-events','none')
});;


});



// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function() {scrollFunction()};

function scrollFunction() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        document.getElementById("myBtn").style.display = "block";
    } else {
        document.getElementById("myBtn").style.display = "none";
    }
};