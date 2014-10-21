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

(function() {
  'use strict';

  window.dcc = window.dcc || {};

  var BarChart = function( originalData, currentData, config ) {
    var defaultConfig = {
      title: 'Bar Chart',
      colourOutline: '#505050',
      colourFill: '#7799EE',
      barSpacing: 1.5,
      width: 370,
      height: 120,
      margin: 5,
      padding: 30,
      paddingLeft: 40,
      paddingRight: 40,
      paddingTop: 20,
      paddingBottom: 20,
      updateTransitionTime: 600,
      selectTransitionTime: 150,
      selectedAlpha: 1.0,
      unSelectedAlpha: 0.1,
      axis: 'dynamic',
      axisLabel: '',
      mapFunc: function( data, idx ) {
        return {
          key: idx,
          value: data
        };
      },
      totalFunc: function( data ) {
        return d3.sum(data, function(d) { return d.value; });
      },
      clickFunc: function() {
        d3.event.stopPropagation();
      },
      labelFunc: function(d) {
        return d.key;
      }
    };
  
    config = config || {};
  
    Object.keys(defaultConfig).forEach(function (key) {
      if (! config.hasOwnProperty(key)) {
        config[key] = defaultConfig[key];
      }
    });
  
  
  
    // -------------------------------------------------------------------------
    // | <----------------------------- margin ------------------------------> |
    // | <- margin -> | <--------------- vis -----------------> | <- margin -> |
    // | <- margin -> |                                         | <- margin -> |
    // | <- margin -> | <- padding L-> | chart | <- padding R-> | <- margin -> |
    // | <- margin -> |                                         | <- margin -> |
    // | <----------------------------- margin ------------------------------> |
    // -------------------------------------------------------------------------
    config.visWidth  = config.width - 2.0 * config.margin;
    config.visHeight = config.height - 2.0 * config.margin;
    config.chartWidth  = config.visWidth - (config.paddingLeft + config.paddingRight);
    config.chartHeight = config.visHeight - (config.paddingTop + config.paddingBottom);
  
  
    //            __________           __________                 __________
    // | <- s -> | <- B1 -> | <- s -> | <- B2 -> | ... | <- s -> | <- BN -> |
    // ----------------------------------------------------------------------
    config.barWidth = (config.chartWidth - originalData.length * config.barSpacing) / (originalData.length);
    config.barWidth = Math.max( config.barWidth, 1.0 );
  
    // Helper functions
    this.translate = function(x, y) {
      return 'translate(' + x + ',' + y + ')';
    };
  
  
    this.originalData = originalData.map(config.mapFunc); // Normalize
    this.currentData = currentData.map(config.mapFunc);   // Normalize
  
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
    this.yScale = d3.scale.linear().domain([max, 0]).range([0, config.chartHeight]);
    this.yAxis = d3.svg.axis().scale(this.yScale).orient('left').ticks(2).tickSize(3).tickFormat(d3.format('s'));
  
  
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
    var _this = this;
    var config = _this.config;
    var svg, vis, chart, controlGroup, title;
    this.element = element;
  
  
    svg = d3.select(element).append('svg').attr('width', config.width).attr('height', config.height);
  
    vis = svg.append('g').attr('transform', _this.translate(config.margin, config.margin));
    vis.append('rect')
      .attr('width', config.visWidth)
      .attr('height', config.visHeight)
      .style('fill', '#FFFFFF');
  
    chart = vis.append('g').attr('transform', _this.translate(config.paddingLeft, config.paddingTop));
    chart.append('rect')
      .attr('width', config.chartWidth)
      .attr('height', config.chartHeight)
      .style('fill', '#FFFFFF');
  
  
    title = vis.append('g')
      .attr('transform', _this.translate(config.paddingLeft + 0.5*config.chartWidth, 11))
      .append('text')
      .attr('text-anchor', 'middle')
      .classed('graph_title', true)
      .text(config.title);
  
  
    vis.append('g')
      .classed('axis', true)
      .classed('bar_axis', true)
      .attr('transform', _this.translate(config.paddingLeft, config.paddingTop))
      .call(_this.yAxis);
  
    // This will do for x-axis for now
    vis.append('g')
      .classed('axis', true)
      .attr('transform', _this.translate(config.paddingLeft, config.paddingTop + config.chartHeight))
      .append('path')
      .attr('stroke-width', 1)
      .attr('d', 'M0,0L' + (config.chartWidth + 10) + ',0');
  
    vis.append('g')
      .attr('transform', _this.translate(5, config.paddingTop + config.chartHeight) + ' rotate(-90)')
      .append('text')
      .classed('axis-label', true)
      .text(config.axisLabel);
  
  
    controlGroup = chart.selectAll('g')
      .data(_this.originalData)
      .enter()
      .append('g')
      .attr('class', 'control_group')
      .classed('graph_interactive', true)
      .attr('transform', function(d, idx) {
        return _this.translate(1 + idx * (config.barWidth + config.barSpacing), 0);
      });
  
    var cMap = {};
    _this.currentData.forEach(function(d) {
      cMap[d.key] = d;
    });
  
    // Build blank bar to capture events, this is useful for selecting near-zero items
    controlGroup.append('rect')
      .attr('class', 'control_group_rect')
      .attr('x', 0)
      .attr('y', config.chartHeight*0.5)
      .attr('width', config.barWidth)
      //.attr('height', config.chartHeight)
      .attr('height', 0.5*config.chartHeight)
      .attr('stroke', 'None')
      .style('fill', '#FFFFFF')
      .style('opacity', 0.0);
  
  
    // User interaction
    controlGroup.on('mouseover', function(d) {
      var cval = d3.select(this).select('.bar_current').datum();
      // var percent = Math.round( 1000*cval.value / _this.total ) / 10;
  
      controlGroup.selectAll('.bar_current')
        .transition()
        .duration(config.selectTransitionTime)
        .style('opacity', function(n) {
          if ( _this.highlightedItems[n.key] || n.key === d.key) {
            return config.selectedAlpha;
          } else {
            return config.unSelectedAlpha;
          }
        });
  
      chart.append('rect')
        .classed('debug', true)
        .attr('x', 0)
        .attr('y', _this.yScale(cval.value))
        .attr('height', 0.5)
        .attr('width', config.chartWidth)
        .style('fill', '#888');

      chart.append('circle')
        .classed('debug', true)
        .attr('cx', 0)
        .attr('cy', _this.yScale(cval.value))
        .attr('r', 2.5)
        .style('fill', '#888');
  
      vis.append('g').attr('class', 'debug')
        .attr('transform', _this.translate(config.paddingLeft,
          config.paddingTop + config.chartHeight + config.paddingBottom - 1))
        .append('text')
        .text(config.labelFunc(d));
  
      /*
      vis.append('rect')
        .classed('debug', true)
        .attr('x', config.paddingLeft)
        .attr('y', config.visHeight - 10)
        .attr('width', config.chartWidth*0.5)
        .attr('height', 4).style('fill', '#DCD');
  
      vis.append('rect')
        .classed('debug', true)
        .attr('x', config.paddingLeft)
        .attr('y', config.visHeight - 10)
        .attr('width', config.chartWidth*0.5 * (cval.value/_this.total))
        .attr('height', 4).style('fill', config.colourFill);
  
      vis.append('text')
        .classed('debug', true)
        .attr('x', config.paddingLeft + config.chartWidth*0.5 + 2)
        .attr('y', config.visHeight-5).text( cval.value + ' ('+percent +'%)');
      */
    });
    controlGroup.on('mouseout', function(d) {
      if (! _this.highlightedItems[d.key]) {
        d3.select(this).select('.bar_current').style('fill', d.colourFill);
      }
  
      controlGroup.selectAll('.bar_current')
        .transition()
        .duration(config.selectTransitionTime)
        .style('opacity', function(n) {
        if ( _.isEmpty(_this.highlightedItems) || _this.highlightedItems[n.key]) {
          return config.selectedAlpha;
        } else {
          return config.unSelectedAlpha;
        }
      });
  
      svg.selectAll('.debug').remove();
    });
    controlGroup.on('click', config.clickFunc);
  
  
    // Build original values
    if (config.axis === 'static') {
      controlGroup.each(function(d) {
        d3.select(this)
          .append('rect')
          .attr('class', 'bar_original')
          .attr('x', 0)
          .attr('y', _this.yScale(d.value))
          .attr('ry', 1)
          .attr('width', config.barWidth)
          .attr('height', (config.chartHeight - _this.yScale(d.value)))
          .attr('stroke', config.colourOutline)
          .attr('stroke-width', 0.5)
          .style('fill', 'None')
          .style('opacity', 0.3);
      });
    } else {
      var max = 0;
      this.currentData.forEach(function(d) {
        if (max < d.value) {
          max = d.value;
        }
      });
      _this.yScale = d3.scale.linear().domain([max, 0]).range([0, config.chartHeight]);
      _this.yAxis = d3.svg.axis().scale(_this.yScale).orient('left').ticks(2).tickSize(3).tickFormat(d3.format('s'));
      d3.select(_this.element).select('.bar_axis').transition().duration(config.updateTransitionTime).call(_this.yAxis);
  
    }
  
    // Build current values
    controlGroup.each(function(d) {
      if ( ! cMap[d.key]) {
        d.value = 0;
      } else {
        d.value = cMap[d.key].value;
      }
  
      d3.select(this)
        .append('rect')
        .attr('class', 'bar_current')
        .attr('x', 0)
        .attr('y', _this.yScale(d.value))
        .attr('ry', 1)
        .attr('width', config.barWidth)
        .attr('height', (config.chartHeight - _this.yScale(d.value)))
        .style('fill', d.colourFill)
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
  
  
    if (config.axis === 'dynamic') {
      var max = 0;
      this.currentData.forEach(function(d) {
        if (max < d.value) {
          max = d.value;
        }
      });
      _this.yScale = d3.scale.linear().domain([max, 0]).range([0, config.chartHeight]);
      _this.yAxis = d3.svg.axis().scale(_this.yScale).orient('left').ticks(2).tickSize(3).tickFormat(d3.format('s'));
      d3.select(_this.element).select('.bar_axis').transition().duration(config.updateTransitionTime).call(_this.yAxis);
    }
  
    d3.select(this.element)
      .selectAll('.control_group')
      .each(function(d) {
  
        // update
        if (cMap[d.key]) {
          d.value = cMap[d.key].value;
        } else {
          d.value = 0;
        }
  
        // display
        d3.select(this)
          .select('.bar_current')
          .transition()
          .duration(config.updateTransitionTime)
          .attr('y', _this.yScale(d.value))
          .attr('height', function(d) { return config.chartHeight - _this.yScale(d.value); });
      });
  };
  
  BarChart.prototype.setHightlight = function( keys ) {
    var _this = this, config = _this.config;
  
    d3.select(this.element)
      .selectAll('.control_group')
      .each(function(d) {
        if ( keys.length === 0 || _.contains(keys, d.key)) {
          d3.select(this).select('.bar_current').style('opacity', config.selectedAlpha);
          if (keys.length > 0) {
            _this.highlightedItems[d.key] = 1;
          } else {
            delete _this.highlightedItems[d.key];
          }
        } else {
          d3.select(this).select('.bar_current').style('opacity', config.unSelectedAlpha);
          delete _this.highlightedItems[d.key];
        }
      });
  };
  
  BarChart.prototype.reset = function() {
    var _this = this;
    var config = _this.config;
  
    _this.highlightedItems = {};
    d3.selectAll('.control_group')
      .each(function(d) {
        d3.select('.control_group_rect').style('fill', 'none').style('opacity', 0);
        d3.select('.bar_current').style('fill', d.colourFill).style('opacity', config.selectedAlpha);
      });
  };
  
  BarChart.prototype.destroy = function() {
    // Attempt to free up resources
    this.currentData = null;
    this.originalData = null;
    d3.select(this.element).remove();
  };


  dcc.BarChart = BarChart;
})();
