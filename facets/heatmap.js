////////////////////////////////////////////////////////////////////////////////
// Hybrid heatmap widget
//
// Data is expeted to be 2-dimensional array where each row identifies a series
//
// Projects
// [ 
//    [ .... ]  -> Genes
//    [ .... ] 
//    [ .... ] 
// ]
//
//
// TODO:
// - Ramp function [c1 -> c2] 
// - Map function d => { ... }
// - bar transform????
// - axis labels
////////////////////////////////////////////////////////////////////////////////
var Heatmap = function(data, config) {
  config = config || {};

  var defaultConfig = {
    width: 200,
    height: 200,
    margin: 5,
    padding: 20,
    title: '< Title goes here >',

    map: function(row, i) {
      return row.map(function(d, j) {
        return {
          value: d,
          label: 'label ' + j + ' ' + i 
        };
      });
    }
  };
  
  Object.keys(defaultConfig).forEach(function (key) {
    if (! config[key]) {
      config[key] = defaultConfig[key];
    }
  });

  // Derived
  config.visWidth  = config.width - 2.0 * config.margin;
  config.visHeight = config.height - 2.0 * config.margin;
  config.chartWidth  = config.visWidth - 2.0 * config.padding;
  config.chartHeight = config.visHeight - 2.0 * config.padding;
  config.cellWidth  = (config.chartWidth  - data[0].length) / (data[0].length);
  config.cellHeight = (config.chartHeight - data.length) / (data.length);

  // Helper functions
  this.translate = function(x, y) {
    return 'translate(' + x + ',' + y + ')';
  };

  this.data = data.map(config.map);

  // Get min and max
  this.maxValue = d3.max(
    this.data.map(function(d) { return d3.max(d, function(d2) { return d2.value; }); })
  );
  this.minValue = d3.min(
    this.data.map(function(d) { return d3.min(d, function(d2) { return d2.value; }); })
  );
  this.colourScale = d3.scale.linear().domain([this.minValue, this.maxValue]).range(['#FFFFFF', '#FF0000']);


  this.config = config;
};


Heatmap.prototype.render = function( element ) {
  var _this = this;
  var config = _this.config;
  var svg, vis, chart, rows;

  // Clean
  d3.select(element).selectAll('*').remove();

  // Establish containers
  svg = d3.select(element).append('svg').attr('width' , config.width).attr('height', config.height);
  vis = svg.append('g').attr('transform', _this.translate(config.margin, config.margin));
  chart = vis.append('g').attr('transform', _this.translate(config.padding, config.padding))

  // Position each series
  rows = chart.selectAll('g')
    .data(_this.data)
    .enter()
    .append('g') 
    .attr('transform', function(d, i) {
       return _this.translate(0, i*config.cellHeight);
    });

  // Render
  rows.each(function(d, rowIdx) {
    d3.select(this)
      .selectAll('rect')
      .data(d)
      .enter()
      .append('rect')
      .attr('x', function(d, i) { return i * config.cellWidth; })
      .attr('width', config.cellWidth - 1)
      .attr('height', config.cellHeight - 1)
      .style('fill', function(d, i) {
        // TODO: use map
        // return d3.rgb( d.value*25, 50, 50);
        return _this.colourScale(d.value);
      })
      .style('stroke', 'none')
      .style('stroke-width', 2)
      .on('mouseover', function(d, i) {
        d3.select(this).style('stroke', '#00FF00');
        chart.append('text').attr('y', config.chartHeight + 10).attr('class', 'debug').text(d.label);
      })
      .on('mouseout', function(d, i) {
        d3.select(this).style('stroke', 'none');
        chart.selectAll('.debug').remove();
      });


    // Title
    vis.append('text')
      .attr('x', 5)
      .attr('y', 10)
      .text(config.title);
  });
};

