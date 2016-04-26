
function classes(root) {
    var classes = [];

    function recurse(name, node) {
        if (node.children) node.children.forEach(function(child) { recurse(node.name, child); });
        else classes.push({
            packageName: name,
            className: node.name,
            value: node.size,
            ppi: node.ppi,
            font_size: node.ppi / 3.7
        });
    }

    recurse(null, root);
    return {children: classes};
}

// Function that holds logic to create familiarity circles using d3.js
function d_circles(json_data, radius_factor, svg, bubble, length){
    var root = json_data;
    var node = svg.selectAll(".node")
        .data(bubble.nodes(classes(root))
            .filter(function(d) {
                return !d.children;
            }))
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    node.append("title")
        .text(function(d) {
            return d.className + " PQ : " + d.value });

    var outerCircle = node.append("circle")     // outerCircle is calculated using current score of the user
        .attr("r", '0')
        .attr("stroke", function(d) {
            var colorVal = "#ffffff";
            switch (d.className) {
                case "Organizer" : return "#4B91DD";
                case "Connector" : return "#FF6B35";
                case "Advisor" : return "#754299";
                case "Original" : return "#ECA900";
                case "Doer" : return "#D84154";
                case "Dreamer" : return "#118C89";
                default : return colorVal;
            }
            return colorVal;

        })
        .style("stroke-width", 2)
        .style("fill", "#FFFFFF");

    outerCircle.transition()
        .ease("quad-out")
        .attr("r",function(d) {
            return d.value/radius_factor; })
        .duration(1000);

    var innerCircle = node.append("circle")     // innerCircle is calculated using initial score taken
        .attr("r", '0')
        .attr("stroke", function(d) {
            var colorVal = "#ffffff";
            switch (d.className) {
                case "Organizer" : return "#4B91DD";
                case "Connector" : return "#FF6B35";
                case "Advisor" : return "#754299";
                case "Original" : return "#ECA900";
                case "Doer" : return "#D84154";
                case "Dreamer" : return "#118C89";
                default : return colorVal;
            }
            return colorVal;

        })
        .style("stroke-width", 2)
        .style("stroke-dasharray", [10,10])
        .style("opacity", 0.5)
        .style("fill", "#FFFFFF");

    innerCircle.transition()
        .ease("quad-out")

        .attr("r",function(d) {
            return d.ppi/radius_factor; })
        .duration(1000);


    node.append("text")             // this enters text inside the inner circle
        .attr("dy", ".3em")
        .style("text-anchor", "middle")
        .text(function(d) { return d.className; })
        .style("font-size", function(d) {
            return Math.round(d.font_size)+'px';
        });

    d3.select(self.frameElement).style("height", length + "px");
}


function FamiliarityCirclesModule(){
    this.init = function(json_data, radius_factor){
        var length = 400,
            format = d3.format(",d"),
            color = d3.scale.category20c();

        var bubble = d3.layout.pack()
            .sort(function(a, b) {
                return -(a.seq - b.seq);
            })
            .size([length, length])
            .padding(5.5);

        var svg = d3.select(".circle-chart-wrap").append("svg")
            .attr("width", length)
            .attr("height", length)
            .attr("class", "bubble");

        d_circles(json_data, radius_factor, svg, bubble, length);
    }
}
