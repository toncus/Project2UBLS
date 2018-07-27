
var svgWidth = window.innerWidth;
var svgHeight = 500;

var totalSize = 0; 
var margin = {
  top: 60,
  right: 100,
  bottom: 60,
  left: 150
};


var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

var radius = Math.min(width, height) / 2;

var root;
var nodes;


var svg = d3
  .select("#sbchart")
  .append("svg:svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

function sumByValue(d) {
  return d.value;
}

var partition = d3.partition()
    .size([2 * Math.PI, radius * radius]);

var arc = d3.arc()
    .startAngle(function(d) { return d.x0; })
    .endAngle(function(d) { return d.x1; })
    .innerRadius(function(d) { return Math.sqrt(d.y0); })
    .outerRadius(function(d) { return Math.sqrt(d.y1); });

d3.json("../usaJobs.json", function(response) {
	root = d3.hierarchy(response)
		.eachBefore(function(d) { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name; })
		.sum(sumByValue);

	svg.append("svg:circle")
		.attr("r", radius)
		.style("opacity", 0);

	nodes = partition(root).descendants()
		.filter(function(d) {
			return (d.x1 - d.x0 > 0.005) ;
		});

	var path = svg.data([root]).selectAll("path")
		.data(nodes)
		.enter().append("svg:path")
		.attr("display", function(d) { return d.depth ? null : "none"; })
		.attr("d", arc)
		.attr("fill-rule", "evenodd")
		.style("fill", function(d) { return "#111111"; })
		.style("opacity", 1)
	totalSize = path.datum().value;
});
