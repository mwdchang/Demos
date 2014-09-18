'use strict';

/******************************************************************************
*
* Interactive bar chart
*
* Contracts
* - map: fn(data, [idx]) => { key, value, label }
*
* - focusFunc
* - selectFunc
* - deselectFunc
* - convertDataPointFunc
*
* Expected
*  config.valueWidth
*  config.valueHeight
*
*
* Usage:
*   var data = [3, 6, 8, 3];
*   var bar = new BarChart(data, data, null);
*   bar.render( d3.select('#canvas_id'))
*
*
******************************************************************************/
var BarChart = function( originalData, currentData, config ) {

  var defaultConfig = {
    colourOutline: '#AAAAAA',
    colourFill: '#7799EE',
    barSpacing: 1.5,
    transitionTime:  600,
    width: 300,
    height: 150,
    margin: 5,
    padding: 25,
    title: 'Bar Chart',
    mapFunc: function( data, idx ) {
      return {
        key: idx,
        value: data,
        label: 'label' + idx
      }
    },
    totalFunc: function( data ) {
      return d3.sum(data, function(d) { return d.value; });
    },
    clickFunc: function(d) {
      d3.event.stopPropagation();
    },
  };

  config = config || {};

  Object.keys(defaultConfig).forEach(function (key) {
    if (! config[key]) {
      config[key] = defaultConfig[key];
    }
  });



  // ---------------------------------------------------------------------
  // | <----------------------------- margin --------------------------> |
  // | <- margin -> | <--------------- vis -------------> | <- margin -> |
  // | <- margin -> |                                     | <- margin -> |
  // | <- margin -> | <- padding -> | chart | <-padding-> | <- margin -> |
  // | <- margin -> |                                     | <- margin -> |
  // | <----------------------------- margin --------------------------> |
  // ---------------------------------------------------------------------
  config.visWidth  = config.width - 2.0 * config.margin;
  config.visHeight = config.height - 2.0 * config.margin;
  config.chartWidth  = config.visWidth - 2.0 * config.padding;
  config.chartHeight = config.visHeight - 2.0 * config.padding;


  //            __________           __________                 __________
  // | <- s -> | <- B1 -> | <- s -> | <- B2 -> | ... | <- s -> | <- BN -> |
  // ----------------------------------------------------------------------
  config.barWidth = (config.chartWidth - originalData.length * config.barSpacing) / (originalData.length);
  config.barWidth = Math.max( config.barWidth, 2.0 );


  // Helper functions
  this.translate = function(x, y) {
    return 'translate(' + x + ',' + y + ')';
  };


  this.originalData = originalData.map(config.mapFunc); // Normalize
  this.currentData = currentData.map(config.mapFunc);   // Normalize

  // TODO: temp
  var max = 0;
  this.originalData.forEach(function(d) {
     if (max < d.value) max = d.value;
  });

  // Not always true !!
  this.total = config.totalFunc(this.originalData);

  console.log('total', this.total);


  // This looks like it is reversed but it is not, SVG coord has origin (0, 0) at top-left
  // but the chart has origin at bottom-left.
  //this.yScale = d3.scale.linear().domain([d3.max(originalData), 0]).range([0, config.chartHeight]);
  this.yScale = d3.scale.linear().domain([max, 0]).range([0, config.chartHeight]);
  this.yAxis = d3.svg.axis().scale(this.yScale).orient('left').ticks(2).tickSize(3);


  // Finish up initialization
  this.config = config;
};



////////////////////////////////////////////////////////////////////////////////
//
// Initialize SVG canvas and render the chart.
// The DOM is structure as follows:
//
// vis
//   -> axis
//   -> chart
//      -> control_group (1 .. N)
//        -> control_group_rect
//        -> bar_original
//        -> bar_current
//
// Data is bound to control_group, which uses control_group_rect as a hidden elem
// to handle extremely variances, which make interactions difficult.
//
////////////////////////////////////////////////////////////////////////////////
BarChart.prototype.render = function( element ) {
  console.log(this.config, this.originalData, this.currentData);

  var _this = this;
  var config = _this.config;
  var svg, vis, chart, title, controlGroup;
  this.element = element;


  svg = d3.select(element).append('svg').attr('width' , _this.config.width).attr('height', _this.config.height);

  vis = svg.append('g').attr('transform', _this.translate(_this.config.margin, _this.config.margin));
  vis.append('rect')
    .attr('width', _this.config.visWidth)
    .attr('height', _this.config.visHeight)
    .style('fill', '#FFFFFF');

  chart = vis.append('g').attr('transform', _this.translate(_this.config.padding, _this.config.padding))
  chart.append('rect')
    .attr('width', _this.config.chartWidth)
    .attr('height', _this.config.chartHeight)
    .style('fill', '#FFFFFF');


  vis.append('g')
    .attr('transform', _this.translate(2, 11))
    .append('text')
    .text(_this.config.title);


  vis.append('g')
    .classed('axis', true)
    .attr('transform', _this.translate(_this.config.padding, _this.config.padding))
    .call(_this.yAxis);

  // This will do for x-axis for now
  vis.append('g')
    .classed('axis', true)
    .attr('transform', _this.translate(_this.config.padding, _this.config.padding + _this.config.chartHeight))
    .append('path')
    .attr('d', 'M0,0L' + (_this.config.chartWidth + 10) + ',0');


  controlGroup = chart.selectAll('g')
    .data(_this.originalData)
    .enter()
    .append('g')
    .attr('class', 'control_group')
    .attr('transform', function(d, idx) {
      return _this.translate(idx * (_this.config.barWidth + _this.config.barSpacing), 0);
    });

  var cMap = {};
  _this.currentData.forEach(function(d) {
    cMap[d.key] = d;
  });

  // Build blank bar to capture events
  controlGroup.append('rect')
    .attr('class', 'control_group_rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', config.barWidth)
    .attr('height', config.chartHeight)
    .attr('stroke', 'None')
    .style('fill', '#FFFFFF')
    .style('opacity', 0.0);


  // User interaction
  controlGroup.on('mouseover', function() {
    var cval = d3.select(this).select('.bar_current').datum();

    d3.select(this).select('.bar_current').style('fill', '#FF8800');
    d3.select(this).style('fill', '#FF8800');
    chart.append('rect').classed('debug', true).attr('x', 0).attr('y', _this.yScale(cval.cvalue)).attr('height', 1).attr('width', _this.config.chartWidth).style('fill', '#339933');
    chart.append('text').classed('debug', true).attr('x', _this.config.chartWidth+2).attr('y', _this.yScale(cval.cvalue)+5).text(cval.cvalue);
    chart.append('text').classed('debug', true).attr('x', 80).attr('y', _this.config.chartHeight + 15).text(cval.label + ': ' + cval.cvalue);

    var percent = Math.round( 1000*cval.cvalue / _this.total ) / 10;
    vis.append('rect').classed('debug', true).attr('x', _this.config.padding).attr('y', _this.config.visHeight - 3)
      .attr('width', _this.config.chartWidth*0.8).attr('height', 4).style('fill', '#DCD');
    vis.append('rect').classed('debug', true).attr('x', _this.config.padding).attr('y', _this.config.visHeight - 3)
      .attr('width', _this.config.chartWidth*0.8 * (cval.cvalue/_this.total)).attr('height', 4).style('fill', _this.config.colourFill);
    vis.append('text').classed('debug', true).attr('x', _this.config.padding + _this.config.chartWidth*0.8 + 2).attr('y', _this.config.visHeight+2).text( cval.cvalue + ' ('+percent +'%)');
  });
  controlGroup.on('mouseout', function() {
    d3.select(this).select('.bar_current').style('fill', _this.config.colourFill);
    svg.selectAll('.debug').remove();
  });
  controlGroup.on('click', _this.config.clickFunc);


  // Build original values
  controlGroup.each(function(d,i) {
    d3.select(this)
      .append('rect')
      .attr('class', 'bar_original')
      .attr('x', 0)
      .attr('y', _this.yScale(d.value))
      .attr('width', _this.config.barWidth)
      .attr('height', (config.chartHeight - _this.yScale(d.value)))
      .attr('stroke', config.colourOutline)
      .style('fill', 'None')
      .style('opacity', 0.4);
  });

  // Build current values
  controlGroup.each(function(d,i) {
    if ( ! cMap[d.key]) {
      d.cvalue = 0;
    } else {
      d.cvalue = cMap[d.key].value;
    }

    d3.select(this)
      .append('rect')
      .attr('class', 'bar_current')
      .attr('x', 0)
      .attr('y', _this.yScale(d.cvalue))
      .attr('width', _this.config.barWidth)
      .attr('height', (config.chartHeight - _this.yScale(d.cvalue)))
      .attr('stroke', function() { return config.colourOutline; })
      .style('fill', _this.config.colourFill)
      .style('opacity', 0.8);
  });

};


BarChart.prototype.update = function( currentData ) {
  this.currentData = currentData.map(this.config.mapFunc);
  var _this = this;

  var cMap = {};
  _this.currentData.forEach(function(d) {
    cMap[d.key] = d;
  });

  d3.select(this.element)
    .selectAll('.control_group')
    .each(function(d, i) {

      // update
      if (cMap[d.key]) {
        d.cvalue = cMap[d.key].value;
      } else {
        d.cvalue = 0;
      }

      // display
      d3.select(this)
        .select('.bar_current')
        .transition()
        .duration(_this.config.transitionTime)
        .attr('y', _this.yScale(d.cvalue))
        .attr('height', function(d) { return _this.config.chartHeight - _this.yScale(d.cvalue)});
    });
};


BarChart.prototype.destroy = function() {
   // Attempt to free up resources
   this.currentData = null;
   this.originalData = null;
   d3.select(this.element).remove();
};

