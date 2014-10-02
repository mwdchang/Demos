'use strict';

/******************************************************************************
*
* Interactive bar chart
*
* Usage:
*   var data = [3, 6, 8, 3];
*   var bar = new BarChart(data, data, null);
*   bar.render( d3.select('#canvas_id'))
*
******************************************************************************/
var BarChart = function( originalData, currentData, config ) {

  var defaultConfig = {
    title: 'Bar Chart',
    colourOutline: '#505050',
    colourFill: '#7799EE',
    barSpacing: 1.5,
    width: 370,
    height: 120,
    margin: 5,
    padding: 29,
    transitionTime:  600,
    rescaleAxis: true,
    mapFunc: function( data, idx ) {
      return {
        key: idx,
        value: data,
        label: 'label' + idx
      };
    },
    totalFunc: function( data ) {
      return d3.sum(data, function(d) { return d.value; });
    },
    clickFunc: function() {
      d3.event.stopPropagation();
    },
  };

  config = config || {};

  Object.keys(defaultConfig).forEach(function (key) {
    if (! config.hasOwnProperty(key)) {
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
  //config.barWidth = Math.max( config.barWidth, 2.0 );
  config.barWidth = Math.max( config.barWidth, 1.0 );

  // Helper functions
  this.translate = function(x, y) {
    return 'translate(' + x + ',' + y + ')';
  };


  this.originalData = originalData.map(config.mapFunc); // Normalize
  this.currentData = currentData.map(config.mapFunc);   // Normalize

  // TODO: temp
  var max = 0;
  this.originalData.forEach(function(d) {
    if (max < d.value) {
      max = d.value;
    }
  });

  this.total = config.totalFunc(this.originalData);
  this.highlightedItems = {};


  // This looks like it is reversed but it is not, SVG coord has origin (0, 0) at top-left
  // but the chart has origin at bottom-left.
  //this.yScale = d3.scale.linear().domain([d3.max(originalData), 0]).range([0, config.chartHeight]);
  this.yScale = d3.scale.linear().domain([max, 0]).range([0, config.chartHeight]);
  this.yAxis = d3.svg.axis().scale(this.yScale).orient('left').ticks(2).tickSize(3).tickFormat(d3.format('s'));


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
  //console.log(this.config, this.originalData, this.currentData);

  var _this = this;
  var config = _this.config;
  var svg, vis, chart, controlGroup, title, axis;
  this.element = element;


  svg = d3.select(element).append('svg').attr('width', config.width).attr('height', config.height);

  vis = svg.append('g').attr('transform', _this.translate(config.margin, config.margin));
  vis.append('rect')
    .attr('width', config.visWidth)
    .attr('height', config.visHeight)
    .style('fill', '#FFFFFF');

  chart = vis.append('g').attr('transform', _this.translate(config.padding, config.padding));
  chart.append('rect')
    .attr('width', config.chartWidth)
    .attr('height', config.chartHeight)
    .style('fill', '#FFFFFF');


  title = vis.append('g')
    .attr('transform', _this.translate(2, 11))
    .append('text')
    .classed('bar-title', true)
    .text(config.title);


  vis.append('g')
    .classed('axis', true)
    .classed('test-test', true)
    .attr('transform', _this.translate(config.padding, config.padding))
    .call(_this.yAxis);

  // This will do for x-axis for now
  vis.append('g')
    .classed('axis', true)
    .attr('transform', _this.translate(config.padding, config.padding + config.chartHeight))
    .append('path')
    .attr('stroke-width', 1)
    .attr('d', 'M0,0L' + (config.chartWidth + 10) + ',0');


  controlGroup = chart.selectAll('g')
    .data(_this.originalData)
    .enter()
    .append('g')
    .attr('class', 'control_group')
    .attr('transform', function(d, idx) {
      return _this.translate(1 + idx * (config.barWidth + config.barSpacing), 0);
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
    // var percent = Math.round( 1000*cval.cvalue / _this.total ) / 10;

    d3.select(this).select('.bar_current').style('fill', '#FF8800');
    // d3.select(this).style('fill', '#FF8800');

    chart.append('rect')
      .classed('debug', true)
      .attr('x', 0)
      .attr('y', _this .yScale(cval.cvalue))
      .attr('height', 0.5)
      .attr('width', config.chartWidth)
      .style('fill', '#555');

    vis.append('g').attr('class', 'debug')
      .attr('transform', _this.translate(config.padding, config.visHeight-5))
      .append('text')
      .text(cval.label);

    /*
    vis.append('rect')
      .classed('debug', true)
      .attr('x', config.padding)
      .attr('y', config.visHeight - 10)
      .attr('width', config.chartWidth*0.5)
      .attr('height', 4).style('fill', '#DCD');

    vis.append('rect')
      .classed('debug', true)
      .attr('x', config.padding)
      .attr('y', config.visHeight - 10)
      .attr('width', config.chartWidth*0.5 * (cval.cvalue/_this.total))
      .attr('height', 4).style('fill', config.colourFill);

    vis.append('text')
      .classed('debug', true)
      .attr('x', config.padding + config.chartWidth*0.5 + 2)
      .attr('y', config.visHeight-5).text( cval.cvalue + ' ('+percent +'%)');
    */
  });
  controlGroup.on('mouseout', function(d) {
    if (! _this.highlightedItems[d.key]) {
      d3.select(this).select('.bar_current').style('fill', config.colourFill);
    }
    svg.selectAll('.debug').remove();
  });
  controlGroup.on('click', config.clickFunc);


  // Build original values
  if (config.rescaleAxis === false) {
    console.log('hello');
    controlGroup.each(function(d) {
      d3.select(this)
        .append('rect')
        .attr('class', 'bar_original')
        .attr('x', 0)
        .attr('y', _this.yScale(d.value))
        .attr('width', config.barWidth)
        .attr('height', (config.chartHeight - _this.yScale(d.value)))
        .attr('stroke', config.colourOutline)
        .attr('stroke-width', 0.5)
        .style('fill', 'None')
        .style('opacity', 0.4);
    });
  }

  // Build current values
  controlGroup.each(function(d) {
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
      .attr('width', config.barWidth)
      .attr('height', (config.chartHeight - _this.yScale(d.cvalue)))
      //.attr('stroke', function() { return config.colourOutline; })
      .style('fill', config.colourFill)
      .style('opacity', 0.8);
  });

};


BarChart.prototype.update = function( currentData ) {
  this.currentData = currentData.map(this.config.mapFunc);
  var _this = this;
  var config = _this.config;

  var cMap = {};
  _this.currentData.forEach(function(d) {
    cMap[d.key] = d;
  });


  // === Test start ===
  if (config.rescaleAxis === true) {
    var max = 0;
    this.currentData.forEach(function(d) {
      if (max < d.value) {
        max = d.value;
      }
    });
    _this.yScale = d3.scale.linear().domain([max, 0]).range([0, config.chartHeight]);
    _this.yAxis = d3.svg.axis().scale(_this.yScale).orient('left').ticks(2).tickSize(3).tickFormat(d3.format('s'));
    d3.select(_this.element).select('.test-test').transition().duration(600).call(_this.yAxis);
  }
  // === Test end ===

  d3.select(this.element)
    .selectAll('.control_group')
    .each(function(d) {

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
        .duration(config.transitionTime)
        .attr('y', _this.yScale(d.cvalue))
        .attr('height', function(d) { return config.chartHeight - _this.yScale(d.cvalue); });
    });
};


BarChart.prototype.setHightlight = function( keys ) {
  var config = this.config;
  var _this = this;
  d3.select(this.element)
    .selectAll('.control_group')
    .each(function(d) {
      // var control = d3.select(this).select('.control_group_rect');

      if (_.contains(keys, d.key)) {
        d3.select(this).select('.control_group_rect').style('fill', '#EEEEEE').style('opacity', 0.3);
        d3.select(this).select('.bar_current').style('fill', '#FF8800');
        _this.highlightedItems[d.key] = 1;
      } else {
        d3.select(this).select('.control_group_rect').style('fill', '#FFFFFF').style('opacity', 0);
        d3.select(this).select('.bar_current').style('fill', config.colourFill);
        delete _this.highlightedItems[d.key];
      }
    });
};


BarChart.prototype.reset = function() {
  var _this = this;
  var config = _this.config;

  _this.highlightedItems = {};
  d3.selectAll('.control_group')
    .each(function() {
      d3.select('.control_group_rect').style('fill', 'none').style('opacity', 0);
      d3.select('.bar_current').style('fill', config.colourFill);
    });
};

BarChart.prototype.destroy = function() {
  // Attempt to free up resources
  this.currentData = null;
  this.originalData = null;
  d3.select(this.element).remove();
};

