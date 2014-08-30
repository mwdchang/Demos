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
  config.barWidth = 18;
  config.barSpacing = 1.5;
  config.transitionTime = 600;

  config.width = 400;
  config.height = 200;


  // map(data, idx) => {key, value, label}
  config.map = function( data, idx ) {
    return {
      key: idx,
      value: data,
      label: idx
    };
  };

  // Constants ?
  config.margin = 5;
  config.padding = 20;


  config.marginLeft = 25;
  config.marginBottom = 15;


  //
  // ---------------------------------------------------------------------
  // | <- margin -> | <--------------- vis -------------> | <- margin -> | 
  // | <- margin -> |                                     | <- margin -> | 
  // | <- margin -> | <- padding -> | chart | <-padding-> | <- margin -> |
  // ---------------------------------------------------------------------
  // 
  config.visWidth  = config.width - 2.0 * config.margin;
  config.visHeight = config.height - 2.0 * config.margin;
  config.chartWidth  = config.visWidth - 2.0 * config.padding;
  config.chartHeight = config.visHeight - 2.0 * config.padding;


  config.barWidth = (config.chartWidth - originalData.length * config.barSpacing) / (originalData.length);




  // This looks like it is reversed but it is not, SVG coord has origin (0, 0) at top-left
  // but the chart has origin at bottom-left
  this.yScale = d3.scale.linear().domain([d3.max(originalData), 0]).range([0, config.chartHeight]);
  this.yAxis = d3.svg.axis().scale(this.yScale).orient('left').ticks(2).tickSize(3);


  // Helpers
  this.translate = function(x, y) {
    return 'translate(' + x + ',' + y + ')';
  };


  this.config = config;
  this.originalData = originalData;
  this.currentData = currentData;


};


BarChart.prototype.render = function( element ) {
  console.log(this.config, this.originalData, this.currentData);

  var _this = this;
  var config = _this.config;
  var svg, vis, chart, oBars, cBars;
  this.element = element;

  
  svg = d3.select(element).append('svg').attr('width' , _this.config.width).attr('height', _this.config.height);

  vis = svg.append('g').attr('transform', _this.translate(_this.config.margin, _this.config.margin));
  vis.append('rect')
    .attr('width', _this.config.visWidth)
    .attr('height', _this.config.visHeight)
    .attr('fill', '#FFFFFF');
   
  chart = vis.append('g').attr('transform', _this.translate(_this.config.padding, _this.config.padding))
  chart.append('rect')
    .attr('width', _this.config.chartWidth)
    .attr('height', _this.config.chartHeight)
    .attr('fill', '#EEEEEE');


  vis.append('g')
    .classed('axis', true)
    // .attr('transform', 'translate(' + _this.config.padding + ',' + _this.config.padding + ')')
    .attr('transform', _this.translate(_this.config.padding, _this.config.padding))
    .call(_this.yAxis); 


  // Each control group takes care of a single data point by key
  _this.originalData.forEach(function(data, idx) {
    var controlGroup = chart.append('g');

    // TODO: covertFunction goes in here
    var origVal = _this.originalData[idx];
    var currVal = _this.currentData[idx];

    controlGroup.on('mouseover', function() {
      var cval = d3.select(this).select('.bar_current').datum();

      d3.select(this).select('.bar_current').attr('fill', '#FF8800');
      d3.select(this).attr('fill', '#FF8800');
      chart.append('rect').classed('debug', true).attr('x', 0).attr('y', _this.yScale(cval)).attr('height', 1).attr('width', _this.config.chartWidth).attr('fill', '#339933');
      chart.append('text').classed('debug', true).attr('x', _this.config.chartWidth).attr('y', _this.yScale(cval)+5).text(cval);
    });
    controlGroup.on('mouseout', function() {
      d3.select(this).select('.bar_current').attr('fill', _this.config.colourFill);
      svg.selectAll('.debug').remove();
    });

    controlGroup.append('rect')
      .attr('x', function() { return idx * (_this.config.barWidth + _this.config.barSpacing); })
      .attr('y', 0)
      .attr('width', function() { return config.barWidth; })
      .attr('height', function() { return config.chartHeight; })
      .attr('stroke', 'None')
      .attr('fill', '#FFFFFF')
      .style('opacity', 0.0);

    controlGroup.append('rect')
      .classed('bar_original', true)
      .attr('x', function() { return idx * (_this.config.barWidth + _this.config.barSpacing); })
      .attr('y', function() { return _this.yScale(origVal); })
      .attr('width', function() { return config.barWidth; })
      .attr('height', function() { return config.chartHeight - _this.yScale(origVal); })
      .attr('stroke', function() { return config.colourOutline; })
      .attr('fill', 'None')
      .style('opacity', 0.4);

    controlGroup.append('rect')
      .datum( currVal )
      .classed('bar_current', true)
      .attr('x', function() { return idx * (_this.config.barWidth + _this.config.barSpacing); })
      .attr('y', function() { return _this.yScale(currVal); })
      .attr('width', function() { return config.barWidth; })
      .attr('height', function() { return config.chartHeight - _this.yScale(currVal); })
      .attr('stroke', function() { return config.colourOutline; })
      .attr('fill', _this.config.colourFill)
      .style('opacity', 0.8);
  });
};


BarChart.prototype.update = function( currentData ) {
  this.currentData = currentData;
  var _this = this;

  d3.select(this.element)
    .selectAll('.bar_current')
    .data(currentData)
    .each(function(d, i) {
      d3.select(this).transition().duration(_this.config.transitionTime)
        .attr('y', function(d) { return (_this.yScale(d)); })
        .attr('height', function(d) { return _this.config.chartHeight - _this.yScale(d)}); 
    });
};


BarChart.prototype.destroy = function() {
   d3.select(this.element).remove();
};

