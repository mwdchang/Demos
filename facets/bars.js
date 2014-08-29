'use strict';

/******************************************************************************
*
* Interactive bar chart
*
* TODO: 
*   domain and range mappings
*
* 
* Interactive function hooks
* - focusFunc
* - selectFunc
* - deselectFunc
* - convertDataPointFunc
*
* Expected
*  config.valueWidth
*  config.valueHeight
*
******************************************************************************/
var BarChart = function( originalData, currentData, config ) {
  var defaultConfig = {
  };

  config = config || {};


  // Sub this
  config.height = 80;
  config.colourOutline = '#AAAAAA';
  config.colourFill = '#7799EE';
  config.barWidth = 17;
  config.barSpacing = 1.5;
  config.transitionTime = 600;


  // Constants ?
  config.paddingLeft = 25;
  config.paddingBottom = 15;


  // This looks like it is reversed but it is not, SVG coord has origin (0, 0) at top-left
  // but the chart has origin at bottom-left
  this.yScale = d3.scale.linear().domain([d3.max(originalData), 0]).range([0, config.height]);
  this.yAxis = d3.svg.axis().scale(this.yScale).orient('left').ticks(2).tickSize(2);




  this.config = config;
  this.originalData = originalData;
  this.currentData = currentData;


};


BarChart.prototype.render = function( element ) {
  console.log(this.config, this.originalData, this.currentData);

  var _this = this;
  var svg, chart, oBars, cBars;
  this.element = element;

  

  svg = d3.select(element).append('svg');
  chart = svg.append('g').attr('transform', 'translate(' + _this.config.paddingLeft + ',0)');

  oBars = chart.selectAll('.bar_original')
    .data(this.originalData)
    .enter()
    .append('rect');

  cBars = chart.selectAll('.bar_current')
    .data(this.currentData)
    .enter()
    .append('rect');

  oBars.classed('bar_original', true)
    .attr('x', function(d, i) { return i* (_this.config.barWidth + _this.config.barSpacing); })
    // .attr('y', function(d) { return (_this.config.height - d);})
    .attr('y', function(d) { return _this.yScale(d); })
    .attr('width', function(d) { return _this.config.barWidth; })
    .attr('height', function(d) { return _this.config.height - _this.yScale(d); })
    .attr('stroke', function(d) { return _this.config.colourOutline; })
    .attr('fill', 'None')
    .style('opacity', 0.5);

  cBars.classed('bar_current', true)
    .attr('x', function(d, i) { return i * (_this.config.barWidth + _this.config.barSpacing); })
    //.attr('y', function(d) { return (_this.config.height - d);})
    .attr('y', function(d) { return _this.yScale(d);})
    .attr('width', function(d) { return _this.config.barWidth; })
    .attr('height', function(d) { return _this.config.height - _this.yScale(d); })
    .attr('stroke', 'None')
    .attr('fill', function(d) { return _this.config.colourFill; })
    .style('opacity', 0.8)
    .on('mouseover', function(d) {
      d3.select(this).attr('fill', '#FF8800');
      svg.append('rect').classed('debug', true).attr('x', 0).attr('y', _this.yScale(d)).attr('height', 1).attr('width', 155).attr('fill', '#999999');
      svg.append('text').classed('debug', true).attr('x', 160).attr('y', _this.yScale(d)+5).text(d);
    })
    .on('mouseout', function(d) {
      d3.select(this).attr('fill', _this.config.colourFill);
      svg.selectAll('.debug').remove();
    });

  // Doodle the axis
  svg.append('g')
    .classed('axis', true)
    .attr('transform', 'translate(' + (_this.config.paddingLeft - _this.config.barSpacing) + ', 0)')
    .call(_this.yAxis);

};


BarChart.prototype.update = function( currentData ) {
   this.currentData = currentData;
   var _this = this;

   d3.select(this.element)
     .selectAll('.bar_current')
     .data(currentData)
     .each(function(d, i) {
       d3.select(this).transition().duration(_this.config.transitionTime)
         //.attr('y', function(d) { return (_this.config.height - d); })
         //.attr('height', d); 
         .attr('y', function(d) { return (_this.yScale(d)); })
         .attr('height', function(d) { return _this.config.height - _this.yScale(d)}); 
     });
   
};


BarChart.prototype.destroy = function() {
   d3.select(this.element).remove();
};

