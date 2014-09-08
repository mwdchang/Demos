var Heatmap = function(data, config) {
  config = config || {};

  var defaultConfig = {
    width: 200,
    height: 200,
    margin: 5,
    padding: 20,
    title: '< Title goes here >'
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
  config.cellWidth  = (config.chartWidth  - data.length) / (data.length);
  config.cellHeight = (config.chartHeight - data[0].length) / (data[0].length);

  // Helper functions
  this.translate = function(x, y) {
    return 'translate(' + x + ',' + y + ')';
  };

  this.data = data;
  this.config = config;
};


Heatmap.prototype.render = function( element ) {
  var _this = this;
  var config = _this.config;
  var svg, vis, chart, rows;

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
  rows.each(function(d, i) {
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
        return d3.rgb( d*25, 50, 50);
      });

    // Title
    vis.append('text')
      .attr('x', 5)
      .attr('y', 10)
      .text(config.title);
  });
};
