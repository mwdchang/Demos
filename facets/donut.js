'use strict';

/******************************************************************************
*
* Renders a hierarchical struture in a donut chart + sunburst style. 
*
*
* ... mmmm, donuts!
*******************************************************************************
*/


var DonutChart = function( data, config ) {

  config = config || {};



  // Defaults
  config.width = config.width || 500;
  config.height = config.height || 500; 
  config.segmentSize = config.segmentSize || 50;

  // Calculated
  config.radius = (config.width  * 0.4);


  // Helpers
  this.pie = d3.layout.pie()
    .sort(null)
    .startAngle(0)
    .value(function(d) { 
       return d.children.length; 
    });

  this.color = d3.scale.ordinal()
    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
 
  this.translate = function(x, y) {
    return 'translate(' + x + ',' + y + ')';
  };


  // All done
  this.config = config;
  this.data = data;

};


DonutChart.prototype.render = function( element ) {
  var _this = this;
  var svg, chart, arcs;

  var arc = d3.svg.arc()
    .outerRadius(_this.config.radius - _this.config.radius*0.5)
    .innerRadius(_this.config.radius - _this.config.radius*0.4);


  svg = d3.select(element).append('svg').attr('width' , _this.config.width).attr('height', _this.config.height);
  chart = svg.append('g').attr('transform', _this.translate(_this.config.width/2, _this.config.height/2));


  // Setting up, and injecting our own data
  arcs = chart.selectAll('.arc')
    .data(_this.pie( _this.data ))
    .enter()
    .append('g')
    .classed('arc', true)
    .each(function(d, idx) {
      d.children = _this.data[idx].children;
    });

  // Render arcs
  arcs.append('path')
    .classed('arc', true)
    .attr('d', arc)
    .style("fill", function(d, i) { return _this.color(i); })
    .on('mouseover', function(d) {
      d3.select(this.parentNode).selectAll('.arc').style('fill', '#FF8800');
    })
    .on('mouseout', function(d, i) {
      d3.select(this.parentNode).selectAll('.arc').style('fill', _this.color(i));
    });



  // Render bursts
  arcs.each(function(d, idx) {
    var children = data[idx].children;
    var step = Math.abs( d.endAngle - d.startAngle)/children.length;
    var step_2 = step * 0.5;

    var parentArc = d3.select(this);

    

    children.forEach(function(child, cidx) {
      var segments = Math.ceil( child.size / _this.config.segmentSize );

      /*
      var arc = d3.svg.arc()
        .innerRadius(125)
        .outerRadius(17*segments + _this.config.radius)
        .startAngle(d.startAngle + (cidx*step)) 
        .endAngle(d.startAngle + (cidx+1)*step);

      parentArc.append("svg:path")
        .style("fill", "#EEEEEE")
        .style("stroke", "#888888")
        .style("opacity", 0.25)
        .attr("d", arc); */


      for (var j=0; j < segments; j ++) {

        var base = 10*j*1.75;
        var start = d.startAngle + (cidx*step); 
        var end = d.startAngle + (cidx+1)*step;

        start += 0.05;
        end -= 0.05;


        var arc = d3.svg.arc()
          .innerRadius(125 + base)
          .outerRadius(125 + base+10)
          .startAngle(start)
          .endAngle(end);

        parentArc.append("svg:path")
          .classed('arc', true)
          .style("fill", _this.color(idx))
          .style("stroke", "#EEEEEE")
          .style("opacity", 0.85)
          .attr("d", arc);

        /*
        parentArc.append('circle')
          .attr('cx',  (17*j + _this.config.radius*0.7) * Math.sin( step_2 + d.startAngle + cidx*step) )
          .attr('cy',  (17*j + _this.config.radius*0.7) * -Math.cos( step_2 + d.startAngle + cidx*step) )
          .attr('r', 6)
          .attr('fill', function(d) {
             return _this.color(idx);
          });
          */
      } 

    });

  });

};
