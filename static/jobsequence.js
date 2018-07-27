// Dimensions of sunburst.
var width = 750;
var height = 600;
var radius = Math.min(width, height) / 2;

// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
var b = {
  w: 75, h: 30, s: 3, t: 10
};

// Mapping of step names to colors.
var colors = {
  "home": "#5687d1",
  "product": "#7b615c",
  "search": "#de783b",
  "account": "#6ab975",
  "other": "#a173d1",
  "end": "#bbbbbb"
};

function majorColors(maincat, data) {
	categories = {'Management Occupations':1,
	 'Business and Financial Operations Occupations':2,
	 'Computer and Mathematical Occupations':3,
	 'Architecture and Engineering Occupations':4,
	 'Life, Physical, and Social Science Occupations':5,
	 'Community and Social Service Occupations':6,
	 'Legal Occupations':7,
	 'Educationr, Training, and Library Occupations':8,
	 'Arts, Design, Entertainment, Sports, and Media Occupations':9,
	 'Healthcare Practitioners and Technical Occupations':10,
	 'Healthcare Support Occupations':11,
	 'Protective Service Occupations':12,
	 'Food Preparation and Serving Related Occupations':13,
	 'Building and Grounds Cleaning and Maintenance Occupations':14,
	 'Personal Care and Service Occupations':15,
	 'Sales and Related Occupations':16,
	 'Office and Administrative Support Occupations':17,
	 'Farming, Fishing, and Forestry Occupations':18,
	 'Construction and Extraction Occupations':19,
	 'Installation, Maintenance, and Repair Occupations':20,
	 'Production Occupations':21,
	 'Transportation and Material Moving Occupations': 22};
	return categories[maincat]
}

var colorScale = d3.scaleOrdinal(d3["schemeCategory20c"])
    .domain([1,22])

// Total size of all segments; we set this later, after loading the data.
var totalSize = 0; 

// Appends an svg element inside #chart div
// and appends a new group with the id #container
// and moves it width/2 to the right, and height/2 to the bottom, 
// Otherwise the center of the circle is the upper left corner
var vis = d3.select("#chart").append("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .append("svg:g")
    .attr("id", "container")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");


// Create a parition with a size that denotes angle, radius
var partition = d3.partition()
    .size([2.0 * Math.PI , radius*radius])

var arc = d3.arc()
    .startAngle(function(d) { return d.x0; })
    .endAngle(function(d) { return d.x1; })
    .innerRadius(function(d) { return Math.sqrt(d.y0); })
    .outerRadius(function(d) { return Math.sqrt(d.y1); });

var json3;
var json4;
var nodes2;
var stateName;

function sunburstPlot(event) {
	stateName = event.properties.name;
	var getSVGcontainer = document.getElementById("container")
	
	while (getSVGcontainer.hasChildNodes()) {
		getSVGcontainer.removeChild(getSVGcontainer.firstElementChild)
	}


	d3.json("/usa-jobs", function(response) {
		for (var i = 0 ; i < response.length ; i++ ) {
        		if(response[i].name==stateName){
				json4 = {"name":"root", "children":response[i]['children']};
        		}
		}
		json3 = response
		createVisualization(json4)
	});
}

// Main function to draw and set up the visualization, once we have the data.
function createVisualization(json) {

  // Basic setup of page elements.
  //initializeBreadcrumbTrail();
  //drawLegend();
  //d3.select("#togglelegend").on("click", toggleLegend);

  // Bounding circle underneath the sunburst, to make it easier to detect
  // when the mouse leaves the parent g.
  vis.append("svg:circle")
      .attr("r", radius)	
      .style("opacity", 0.0);

  // Turn the data into a d3 hierarchy and calculate the sums.
  var root = d3.hierarchy(json)
      .sum(function(d) { return d.value; })
      .sort(function(a, b) { return b.value - a.value; });
  
  // For efficiency, filter nodes to keep only those large enough to see.
  var nodes = partition(root).descendants()
      .filter(function(d) {
          return (d.x1 - d.x0 > 0.010); // 0.005 radians = 0.29 degrees
      });

  nodes2 = nodes;

  var path = vis.data([json]).selectAll("g path")
      .data(nodes)
      .enter().append("path")
      .attr("display", function(d) { return d.depth ? null : "none"; })
      .attr("d", arc)
      .attr("fill-rule", "evenodd")
      .style("fill", function(d) { return colorScale(majorColors(d.data.name, d.data)); })
      .style("opacity", 1)
      .on("mouseover", mouseover)
      .on("click", gethistory);

  // Add the mouseleave handler to the bounding circle.
  d3.select("#container").on("mouseleave", mouseleave);

  // Get total size of the tree = value of root node from partition.
  totalSize = path.datum().value;
 };

var jobhistvis;
var xScale ; 

// Get the history
function gethistory(d) {
	var jobhistdiv = document.getElementById("jobhistory");	
	if (jobhistdiv.hasChildNodes()) {
		for (var i =0 ; i < jobhistdiv.children.length; i++ ){
			if(jobhistdiv.children[i].tagName=="svg") {
				jobhistdiv.removeChild(jobhistdiv.children[i]);
			};
		};
	};
	if (d.data.value) {
		var occTitle =  d.data.name.replace('/','---')
		d3.json("/jobshistory/"+stateName+"/"+occTitle, function(response) {
			console.log(response);
		var svgWidth = jobhistdiv.clientWidth; 
		var svgHeight = 400;
		var margin = {top: 10, bottom:60, left:60, right:5};
	
		var width = svgWidth - margin.left - margin.right;
		var height = svgHeight - margin.top - margin.bottom;	

		var xyears = response.map(response=>response.year)

		xScale = d3.scaleBand()
			.domain(xyears)
			.range([0,width-margin.right-margin.left])
			.paddingInner(0.1)
			.paddingOuter(0.2)
		var yLinearScale = d3.scaleLinear()
		var yMaxVal = d3.max(response.map(response=>response.value))
		var yMinVal = d3.min(response.map(response=>response.value))
		var yDiff = yMaxVal-yMinVal
		if (yDiff < 1) {
			yDiff = yMaxVal;
		};
		yLinearScale.domain([yMinVal-yDiff*0.1,yMaxVal+yDiff*0.1]).range([height-margin.bottom,margin.top]);

		jobhistvis = d3.select("#jobhistory").append("svg:svg")
		    .attr("width", width)
		    .attr("height", height)
		    .append("svg:g")
		    .attr("id", "containerhist")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		leftAxis = d3.axisLeft(yLinearScale);
        	bottomAxis = d3.axisBottom(xScale);

		jobhistvis.append("g")
                	.attr("transform", `translate(${0}, ${height-margin.bottom})`)
                	.attr("id","xAxisGroup")
                	.call(bottomAxis)
                	.attr("font-size","14px")

		jobhistvis.append("g")
                	.call(leftAxis)
                	.attr("id","leftAxis")
                	.attr("font-size","14px");
		
		jobhistvis.append("g")
			.selectAll("rect")
			.data(response)
			.enter()
			.append("rect")
			.attr("height",function(d) {
					return height-margin.bottom - yLinearScale(d.value); 
				})
			.attr("width",xScale.bandwidth())
			.attr("fill","#a7c9df")
			.attr("x", function(d) {
				return xScale(d.year);
				})	
			.attr("y",function(d) {
					return yLinearScale(d.value);
			})
		});
			
		
	};
};

// Fade all but the current sequence, and show it in the breadcrumb trail.
function mouseover(d) {

  var percentage = (100 * d.value / totalSize).toPrecision(3);
  var percentageString = percentage + "%";
  if (percentage < 0.1) {
    percentageString = "< 0.1%";
  }
  if(d.data.value) { 
  	var jobnameString = d.data.name + "<br>"+ d.value 
  } else {
  	var jobnameString = d.data.name  
  }

  d3.select("#percentage")
      .html(jobnameString);

  d3.select("#explanation")
      .style("visibility", "");

  var sequenceArray = d.ancestors().reverse();
  sequenceArray.shift(); // remove root node from the array

  // Fade all the segments.
  d3.selectAll("g#container path")
      .style("opacity", 0.3);

  // Then highlight only those that are an ancestor of the current segment.
  vis.selectAll("path")
      .filter(function(node) {
                return (sequenceArray.indexOf(node) >= 0);
              })
      .style("opacity", 1);
}

// Restore everything to full opacity when moving off the visualization.
function mouseleave(d) {

  // Hide the breadcrumb trail
  d3.select("#trail")
      .style("visibility", "hidden");

  // Deactivate all segments during transition.
  d3.selectAll("g#container path").on("mouseover", null);

  // Transition each segment to full opacity and then reactivate it.
  d3.selectAll("g#container path")
      .transition()
      .duration(1000)
      .style("opacity", 1)
      .on("end", function() {
              d3.select(this).on("mouseover", mouseover);
            });

  d3.select("#explanation")
      .style("visibility", "hidden");
}

function initializeBreadcrumbTrail() {
  // Add the svg area.
  var trail = d3.select("#sequence").append("svg:svg")
      .attr("width", width)
      .attr("height", 50)
      .attr("id", "trail");
  // Add the label at the end, for the percentage.
  trail.append("svg:text")
    .attr("id", "endlabel")
    .style("fill", "#000");
}

// Generate a string that describes the points of a breadcrumb polygon.
function breadcrumbPoints(d, i) {
  var points = [];
  points.push("0,0");
  points.push(b.w + ",0");
  points.push(b.w + b.t + "," + (b.h / 2));
  points.push(b.w + "," + b.h);
  points.push("0," + b.h);
  if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
    points.push(b.t + "," + (b.h / 2));
  }
  return points.join(" ");
}

// Update the breadcrumb trail to show the current sequence and percentage.
function updateBreadcrumbs(nodeArray, percentageString) {

  // Data join; key function combines name and depth (= position in sequence).
  var trail = d3.select("#trail")
      .selectAll("g")
      .data(nodeArray, function(d) { return d.data.name + d.depth; });

  // Remove exiting nodes.
  trail.exit().remove();

  // Add breadcrumb and label for entering nodes.
  var entering = trail.enter().append("svg:g");

  entering.append("svg:polygon")
      .attr("points", breadcrumbPoints)
      .style("fill", function(d) { return colors[d.data.name]; });

  entering.append("svg:text")
      .attr("x", (b.w + b.t) / 2)
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.data.name; });

  // Merge enter and update selections; set position for all nodes.
  entering.merge(trail).attr("transform", function(d, i) {
    return "translate(" + i * (b.w + b.s) + ", 0)";
  });

  // Now move and update the percentage at the end.
  d3.select("#trail").select("#endlabel")
      .attr("x", (nodeArray.length + 0.5) * (b.w + b.s))
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(percentageString);

  // Make the breadcrumb trail visible, if it's hidden.
  d3.select("#trail")
      .style("visibility", "");

}

function drawLegend() {

  // Dimensions of legend item: width, height, spacing, radius of rounded rect.
  var li = {
    w: 75, h: 30, s: 3, r: 3
  };

  var legend = d3.select("#legend").append("svg:svg")
      .attr("width", li.w)
      .attr("height", d3.keys(colors).length * (li.h + li.s));

  var g = legend.selectAll("g")
      .data(d3.entries(colors))
      .enter().append("svg:g")
      .attr("transform", function(d, i) {
              return "translate(0," + i * (li.h + li.s) + ")";
           });

  g.append("svg:rect")
      .attr("rx", li.r)
      .attr("ry", li.r)
      .attr("width", li.w)
      .attr("height", li.h)
      .style("fill", function(d) { return d.value; });

  g.append("svg:text")
      .attr("x", li.w / 2)
      .attr("y", li.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.key; });
}

function toggleLegend() {
  var legend = d3.select("#legend");
  if (legend.style("visibility") == "hidden") {
    legend.style("visibility", "");
  } else {
    legend.style("visibility", "hidden");
  }
}

// Take a 2-column CSV and transform it into a hierarchical structure suitable
// for a partition layout. The first column is a sequence of step names, from
// root to leaf, separated by hyphens. The second column is a count of how 
// often that sequence occurred.
function buildHierarchy(csv) {
  var root = {"name": "root", "children": []};
  for (var i = 0; i < csv.length; i++) {
    var sequence = csv[i][0];
    var size = +csv[i][1];
    if (isNaN(size)) { // e.g. if this is a header row
      continue;
    }
    var parts = sequence.split("-");
    var currentNode = root;
    for (var j = 0; j < parts.length; j++) {
      var children = currentNode["children"];
      var nodeName = parts[j];
      var childNode;
      if (j + 1 < parts.length) {
   // Not yet at the end of the sequence; move down the tree.
 	var foundChild = false;
 	for (var k = 0; k < children.length; k++) {
 	  if (children[k]["name"] == nodeName) {
 	    childNode = children[k];
 	    foundChild = true;
 	    break;
 	  }
 	}
  // If we don't already have a child node for this branch, create it.
 	if (!foundChild) {
 	  childNode = {"name": nodeName, "children": []};
 	  children.push(childNode);
 	}
 	currentNode = childNode;
      } else {
 	// Reached the end of the sequence; create a leaf node.
 	childNode = {"name": nodeName, "size": size};
 	children.push(childNode);
      }
    }
  }
  return root;
};

