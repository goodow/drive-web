/**
* Main module
*/
angular.module('angularCharts', ['angularChartsTemplates']);
/**
* Main directive handling drawing of all charts
*/
angular.module('angularCharts').directive('acChart', [
  '$templateCache',
  '$compile',
  '$rootElement',
  '$window',
  '$timeout',
  function ($templateCache, $compile, $rootElement, $window, $timeout) {
    /**
   * Initialize some constants
   * @type Array
   */
    var tooltip = [
        'display:block;',
        'position:absolute;',
        'border:1px solid #333;',
        'background-color:#161616;',
        'border-radius:5px;',
        'padding:5px;',
        'color:#fff;'
      ].join('');
    /**
   * Utility function to call when we run out of colors!
   * @return {String} Hexadecimal color
   */
    function getRandomColor() {
      var letters = '0123456789ABCDEF'.split('');
      var color = '#';
      for (var i = 0; i < 6; i++) {
        color += letters[Math.round(Math.random() * 15)];
      }
      return color;
    }
    /**
   * Utility function that gets the child that matches the classname
   * because Angular.element.children() doesn't take selectors
   * it's still better than a whole jQuery implementation
   * @param  {Array}  childrens       An array of childrens - element.children() or element.find('div')
   * @param  {String} className       Class name
   * @return {Angular.element|null}    The founded child or null
   */
    function getChildrenByClassname(childrens, className) {
      var child = null;
      for (var i in childrens) {
        if (angular.isElement(childrens[i])) {
          child = angular.element(childrens[i]);
          if (child.hasClass(className))
            return child;
        }
      }
      return child;
    }
    /**
   * Main link function
   * @param  {[type]} scope   [description]
   * @param  {[type]} element [description]
   * @param  {[type]} attrs   [description]
   * @return {[type]}         [description]
   */
    function link(scope, element, attrs) {
      var config = {
          title: '',
          tooltips: true,
          labels: false,
          mouseover: function () {
          },
          mouseout: function () {
          },
          click: function () {
          },
          legend: {
            display: true,
            position: 'left'
          },
          colors: [
            'steelBlue',
            'rgb(255,153,0)',
            'rgb(220,57,18)',
            'rgb(70,132,238)',
            'rgb(73,66,204)',
            'rgb(0,128,0)'
          ],
          innerRadius: 0,
          lineLegend: 'lineEnd'
        };
      var totalWidth = element[0].clientWidth;
      var totalHeight = element[0].clientHeight;
      if (totalHeight === 0 || totalWidth === 0) {
        throw new Error('Please set height and width for the chart element');
      }
      var data, series, points, height, width, chartContainer, legendContainer, chartType, isAnimate = true, defaultColors = config.colors;
      if (totalHeight === 0 || totalWidth === 0) {
        throw new Error('Please set height and width for the chart element');
      }
      /**
     * All the magic happens here
     * handles extracting chart type
     * getting data
     * validating data
     * drawing the chart
     * @return {[type]} [description]
     */
      function init() {
        prepareData();
        setHeightWidth();
        setContainers();
        var chartFunc = getChartFunction(chartType);
        chartFunc();
        drawLegend();
      }
      /**
     * Sets height and width of chart area based on legend
     * used for setting radius, bar width of chart
     */
      function setHeightWidth() {
        if (!config.legend.display) {
          height = totalHeight;
          width = totalWidth;
          return;
        }
        switch (config.legend.position) {
        case 'top':
        case 'bottom':
          height = totalHeight * 0.75;
          width = totalWidth;
          break;
        case 'left':
        case 'right':
          height = totalHeight;
          width = totalWidth * 0.75;
          break;
        }
      }
      /**
     * Creates appropriate DOM structure for legend + chart
     */
      function setContainers() {
        var container = $templateCache.get(config.legend.position);
        element.html(container);
        //http://stackoverflow.com/a/17883151
        $compile(element.contents())(scope);
        //getting children divs
        var childrens = element.find('div');
        chartContainer = getChildrenByClassname(childrens, 'ac-chart');
        legendContainer = getChildrenByClassname(childrens, 'ac-legend');
        height -= getChildrenByClassname(childrens, 'ac-title')[0].clientHeight;
      }
      /**
     * Parses data from attributes 
     * @return {[type]} [description]
     */
      function prepareData() {
        data = scope.acData;
        chartType = scope.acChart;
        series = data ? data.series || [] : [];
        points = data ? data.data || [] : [];
        if (scope.acConfig) {
          angular.extend(config, scope.acConfig);
          config.colors = config.colors.concat(defaultColors);
        }
      }
      /**
     * Returns appropriate chart function to call
     * @param  {[type]} type [description]
     * @return {[type]}      [description]
     */
      function getChartFunction(type) {
        var charts = {
            'pie': pieChart,
            'bar': barChart,
            'line': lineChart,
            'area': areaChart,
            'point': pointChart
          };
        return charts[type];
      }
      /**
     * Filters down the x axis labels if a limit is specified
     */
      function filterXAxis(xAxis, x) {
        var allTicks = x.domain();
        if (config.xAxisMaxTicks && allTicks.length > config.xAxisMaxTicks) {
          var mod = Math.ceil(allTicks.length / config.xAxisMaxTicks);
          xAxis.tickValues(allTicks.filter(function (e, i) {
            return i % mod == 0;
          }));
        }
      }
      /**
     * Draws a bar chart, grouped with negative value handling
     * @return {[type]} [description]
     */
      function barChart() {
        /**
       * Setup date attributes
       * @type {Object}
       */
        var margin = {
            top: 0,
            right: 20,
            bottom: 30,
            left: 40
          };
        width -= margin.left + margin.right;
        height -= margin.top + margin.bottom;
        var x = d3.scale.ordinal().rangeRoundBands([
            0,
            width
          ], 0.1);
        var y = d3.scale.linear().range([
            height,
            10
          ]);
        var x0 = d3.scale.ordinal().rangeRoundBands([
            0,
            width
          ], 0.1);
        var yData = [0];
        points.forEach(function (d) {
          d.nicedata = d.y.map(function (e, i) {
            yData.push(e);
            return {
              x: d.x,
              y: e,
              s: i,
              tooltip: angular.isArray(d.tooltip) ? d.tooltip[i] : d.tooltip
            };
          });
        });
        var yMaxPoints = d3.max(points.map(function (d) {
            return d.y.length;
          }));
        scope.yMaxData = yMaxPoints;
        x.domain(points.map(function (d) {
          return d.x;
        }));
        var padding = d3.max(yData) * 0.2;
        y.domain([
          d3.min(yData),
          d3.max(yData) + padding
        ]);
        x0.domain(d3.range(yMaxPoints)).rangeRoundBands([
          0,
          x.rangeBand()
        ]);
        /**
       * Create scales using d3
       * @type {[type]}
       */
        var xAxis = d3.svg.axis().scale(x).orient('bottom');
        filterXAxis(xAxis, x);
        var yAxis = d3.svg.axis().scale(y).orient('left').ticks(10).tickFormat(d3.format('s'));
        /**
       * Start drawing the chart!
       * @type {[type]}
       */
        var svg = d3.select(chartContainer[0]).append('svg').attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom).append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
        svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + height + ')').call(xAxis);
        svg.append('g').attr('class', 'y axis').call(yAxis);
        /**
      * Add bars
      * @type {[type]}
      */
        var barGroups = svg.selectAll('.state').data(points).enter().append('g').attr('class', 'g').attr('transform', function (d) {
            return 'translate(' + x(d.x) + ',0)';
          });
        var bars = barGroups.selectAll('rect').data(function (d) {
            return d.nicedata;
          }).enter().append('rect');
        bars.attr('width', x0.rangeBand());
        bars.attr('x', function (d, i) {
          return x0(i);
        }).attr('y', height).style('fill', function (d) {
          return getColor(d.s);
        }).attr('height', 0).transition().ease('cubic-in-out').duration(1000).attr('y', function (d) {
          return y(Math.max(0, d.y));
        }).attr('height', function (d) {
          return Math.abs(y(d.y) - y(0));
        });
        /**
       * Add events for tooltip
       * @param  {[type]} d [description]
       * @return {[type]}   [description]
       */
        bars.on('mouseover', function (d) {
          makeToolTip({
            value: d.y,
            series: series[d.s],
            index: d.x
          }, d3.event);
          config.mouseover(d, d3.event);
          scope.$apply();
        }).on('mouseleave', function (d) {
          removeToolTip();
          config.mouseout(d, d3.event);
          scope.$apply();
        }).on('mousemove', function (d) {
          updateToolTip(d3.event);
        }).on('click', function (d) {
          config.click.call(d, d3.event);
          scope.$apply();
        });
        /**
       * Create labels
       */
        if (config.labels) {
          barGroups.selectAll('not-a-class').data(function (d) {
            return d.nicedata;
          }).enter().append('text').attr('x', function (d, i) {
            return x0(i);
          }).attr('y', function (d) {
            return height - Math.abs(y(d.y) - y(0));
          }).text(function (d) {
            return d.y;
          });
        }
        /**
       * Draw one zero line in case negative values exist
       */
        svg.append('line').attr('x1', width).attr('y1', y(0)).attr('y2', y(0)).style('stroke', 'silver');
      }
      /**
     * Draws a line chart
     * @return {[type]} [description]
     */
      function lineChart() {
        var margin = {
            top: 0,
            right: 40,
            bottom: 20,
            left: 40
          };
        width -= margin.left + margin.right;
        height -= margin.top + margin.bottom;
        var x = d3.scale.ordinal().domain(points.map(function (d) {
            return d.x;
          })).rangeRoundBands([
            0,
            width
          ]);
        var y = d3.scale.linear().range([
            height,
            10
          ]);
        var xAxis = d3.svg.axis().scale(x).orient('bottom');
        filterXAxis(xAxis, x);
        var yAxis = d3.svg.axis().scale(y).orient('left').ticks(5).tickFormat(d3.format('s'));
        var line = d3.svg.line().interpolate('cardinal').x(function (d) {
            return getX(d.x);
          }).y(function (d) {
            return y(d.y);
          });
        var yData = [0];
        var linedata = [];
        points.forEach(function (d) {
          d.y.map(function (e, i) {
            yData.push(e);
          });
        });
        var yMaxPoints = d3.max(points.map(function (d) {
            return d.y.length;
          }));
        scope.yMaxData = yMaxPoints;
        series.slice(0, yMaxPoints).forEach(function (value, index) {
          var d = {};
          d.series = value;
          d.values = points.map(function (point) {
            return point.y.map(function (e) {
              return {
                x: point.x,
                y: e
              };
            })[index] || {
              x: points[index].x,
              y: 0
            };
          });
          linedata.push(d);
        });
        var svg = d3.select(chartContainer[0]).append('svg').attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom).append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
        var padding = d3.max(yData) * 0.2;
        y.domain([
          d3.min(yData),
          d3.max(yData) + padding
        ]);
        svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + height + ')').call(xAxis);
        svg.append('g').attr('class', 'y axis').call(yAxis);
        var point = svg.selectAll('.points').data(linedata).enter().append('g');
        path = point.attr('points', 'points').append('path').attr('class', 'ac-line').style('stroke', function (d, i) {
          return getColor(i);
        }).attr('d', function (d) {
          return line(d.values);
        }).attr('stroke-width', '2').attr('fill', 'none');
        /** Animation function
       * [last description]
       * @type {[type]}
       */
        if (linedata.length > 0) {
          var last = linedata[linedata.length - 1].values;
          if (last.length > 0) {
            var totalLength = path.node().getTotalLength() + getX(last[last.length - 1].x);
            path.attr('stroke-dasharray', totalLength + ' ' + totalLength).attr('stroke-dashoffset', totalLength).transition().duration(1500).ease('linear').attr('stroke-dashoffset', 0).attr('d', function (d) {
              return line(d.values);
            });
          }
        }
        /**
       * Add points
       * @param  {[type]} value [description]
       * @param  {[type]} key   [description]
       * @return {[type]}       [description]
       */
        angular.forEach(linedata, function (value, key) {
          var points = svg.selectAll('.circle').data(value.values).enter();
          points.append('circle').attr('cx', function (d) {
            return getX(d.x);
          }).attr('cy', function (d) {
            return y(d.y);
          }).attr('r', 3).style('fill', getColor(linedata.indexOf(value))).style('stroke', getColor(linedata.indexOf(value))).on('mouseover', function (series) {
            return function (d) {
              makeToolTip({
                index: d.x,
                value: d.y,
                series: series
              }, d3.event);
              config.mouseover(d, d3.event);
              scope.$apply();
            };
          }(value.series)).on('mouseleave', function (d) {
            removeToolTip();
            config.mouseout(d, d3.event);
            scope.$apply();
          }).on('mousemove', function (d) {
            updateToolTip(d3.event);
          }).on('click', function (d) {
            config.click(d, d3.event);
            scope.$apply();
          });
          if (config.labels) {
            points.append('text').attr('x', function (d) {
              return getX(d.x);
            }).attr('y', function (d) {
              return y(d.y);
            }).text(function (d) {
              return d.y;
            });
          }
        });
        /**
      * Labels at the end of line
      */
        if (config.lineLegend === 'lineEnd') {
          point.append('text').datum(function (d) {
            return {
              name: d.series,
              value: d.values[d.values.length - 1]
            };
          }).attr('transform', function (d) {
            return 'translate(' + getX(d.value.x) + ',' + y(d.value.y) + ')';
          }).attr('x', 3).text(function (d) {
            return d.name;
          });
        }
        /**
       * Returns x point of line point
       * @param  {[type]} d [description]
       * @return {[type]}   [description]
       */
        function getX(d) {
          return Math.round(x(d)) + x.rangeBand() / 2;
        }
        ;
        return linedata;
      }
      /**
     * Creates a nice area chart
     * @return {[type]} [description]
     */
      function areaChart() {
        var margin = {
            top: 0,
            right: 40,
            bottom: 20,
            left: 40
          };
        width -= margin.left + margin.right;
        height -= margin.top + margin.bottom;
        var x = d3.scale.ordinal().domain(points.map(function (d) {
            return d.x;
          })).rangeRoundBands([
            0,
            width
          ]);
        var y = d3.scale.linear().range([
            height,
            10
          ]);
        var xAxis = d3.svg.axis().scale(x).orient('bottom');
        filterXAxis(xAxis, x);
        var yAxis = d3.svg.axis().scale(y).orient('left').ticks(5).tickFormat(d3.format('s'));
        var line = d3.svg.line().interpolate('cardinal').x(function (d) {
            return getX(d.x);
          }).y(function (d) {
            return y(d.y);
          });
        var yData = [0];
        var linedata = [];
        points.forEach(function (d) {
          d.y.map(function (e, i) {
            yData.push(e);
          });
        });
        var yMaxPoints = d3.max(points.map(function (d) {
            return d.y.length;
          }));
        /**
       * Important to set for legend
       * @type {[type]}
       */
        scope.yMaxData = yMaxPoints;
        series.slice(0, yMaxPoints).forEach(function (value, index) {
          var d = {};
          d.series = value;
          d.values = points.map(function (point) {
            return point.y.map(function (e) {
              return {
                x: point.x,
                y: e
              };
            })[index] || {
              x: points[index].x,
              y: 0
            };
          });
          linedata.push(d);
        });
        var svg = d3.select(chartContainer[0]).append('svg').attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom).append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
        var padding = d3.max(yData) * 0.2;
        y.domain([
          d3.min(yData),
          d3.max(yData) + padding
        ]);
        svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + height + ')').call(xAxis);
        svg.append('g').attr('class', 'y axis').call(yAxis);
        var point = svg.selectAll('.points').data(linedata).enter().append('g');
        var area = d3.svg.area().interpolate('basis').x(function (d) {
            return getX(d.x);
          }).y0(function (d) {
            return y(0);
          }).y1(function (d) {
            return y(0 + d.y);
          });
        point.append('path').attr('class', 'area').attr('d', function (d) {
          return area(d.values);
        }).style('fill', function (d, i) {
          return getColor(i);
        }).style('opacity', '0.7');
        function getX(d) {
          return Math.round(x(d)) + x.rangeBand() / 2;
        }
        ;
      }
      /**
     * Draws a beautiful pie chart
     * @return {[type]} [description]
     */
      function pieChart() {
        var radius = Math.min(width, height) / 2;
        var svg = d3.select(chartContainer[0]).append('svg').attr('width', width).attr('height', height).append('g').attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
        var innerRadius = 0;
        if (config.innerRadius) {
          var configRadius = config.innerRadius;
          if (typeof configRadius === 'string' && configRadius.indexOf('%') > 0) {
            configRadius = radius * (1 - parseFloat(configRadius) * 0.01);
          }
          if (configRadius) {
            innerRadius = radius - Number(configRadius);
          }
        }
        scope.yMaxData = points.length;
        var arc = d3.svg.arc().outerRadius(radius - 10).innerRadius(innerRadius);
        var arcOver = d3.svg.arc().outerRadius(radius + 5).innerRadius(0);
        var pie = d3.layout.pie().sort(null).value(function (d) {
            return d.y[0];
          });
        var path = svg.selectAll('.arc').data(pie(points)).enter().append('g');
        var complete = false;
        var arcs = path.append('path').style('fill', function (d, i) {
            return getColor(i);
          }).transition().ease('linear').duration(500).attrTween('d', tweenPie).attr('class', 'arc').each('end', function () {
            //avoid firing multiple times
            if (!complete) {
              complete = true;
              //Add listeners when transition is done
              path.on('mouseover', function (d) {
                makeToolTip({ value: d.data.y[0] }, d3.event);
                d3.select(this).select('path').transition().duration(200).style('stroke', 'white').style('stroke-width', '2px');
                config.mouseover(d, d3.event);
                scope.$apply();
              }).on('mouseleave', function (d) {
                d3.select(this).select('path').transition().duration(200).style('stroke', '').style('stroke-width', '');
                removeToolTip();
                config.mouseout(d, d3.event);
                scope.$apply();
              }).on('mousemove', function (d) {
                updateToolTip(d3.event);
              }).on('click', function (d) {
                config.click(d, d3.event);
                scope.$apply();
              });
            }
          });
        if (!!config.labels) {
          path.append('text').attr('transform', function (d) {
            return 'translate(' + arc.centroid(d) + ')';
          }).attr('dy', '.35em').style('text-anchor', 'middle').text(function (d) {
            return d.data.y[0];
          });
        }
        function tweenPie(b) {
          b.innerRadius = 0;
          var i = d3.interpolate({
              startAngle: 0,
              endAngle: 0
            }, b);
          return function (t) {
            return arc(i(t));
          };
        }
      }
      function pointChart() {
        var margin = {
            top: 0,
            right: 40,
            bottom: 20,
            left: 40
          };
        width -= margin.left - margin.right;
        height -= margin.top - margin.bottom;
        var x = d3.scale.ordinal().domain(points.map(function (d) {
            return d.x;
          })).rangeRoundBands([
            0,
            width
          ]);
        var y = d3.scale.linear().range([
            height,
            10
          ]);
        var xAxis = d3.svg.axis().scale(x).orient('bottom');
        filterXAxis(xAxis, x);
        var yAxis = d3.svg.axis().scale(y).orient('left').ticks(5).tickFormat(d3.format('s'));
        var yData = [0];
        var linedata = [];
        points.forEach(function (d) {
          d.y.map(function (e, i) {
            yData.push(e);
          });
        });
        var yMaxPoints = d3.max(points.map(function (d) {
            return d.y.length;
          }));
        scope.yMaxPoints = yMaxPoints;
        series.slice(0, yMaxPoints).forEach(function (value, index) {
          var d = {};
          d.series = value;
          d.values = points.map(function (point) {
            return point.y.map(function (e) {
              return {
                x: point.x,
                y: e
              };
            })[index] || {
              x: points[index].x,
              y: 0
            };
          });
          linedata.push(d);
        });
        var svg = d3.select(chartContainer[0]).append('svg').attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom).append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
        var padding = d3.max(yData) * 0.2;
        y.domain([
          d3.min(yData),
          d3.max(yData) + padding
        ]);
        svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + height + ')').call(xAxis);
        svg.append('g').attr('class', 'y axis').call(yAxis);
        var point = svg.selectAll('.points').data(linedata).enter().append('g');
        /**
       * Add points
       * @param  {[type]} value [description]
       * @param  {[type]} key   [description]
       * @return {[type]}       [description]
       */
        angular.forEach(linedata, function (value, key) {
          var points = svg.selectAll('.circle').data(value.values).enter();
          points.append('circle').attr('cx', function (d) {
            return getX(d.x);
          }).attr('cy', function (d) {
            return y(d.y);
          }).attr('r', 3).style('fill', getColor(linedata.indexOf(value))).style('stroke', getColor(linedata.indexOf(value))).on('mouseover', function (series) {
            return function (d) {
              makeToolTip({
                index: d.x,
                value: d.y,
                series: series
              }, d3.event);
              config.mouseover(d, d3.event);
              scope.$apply();
            };
          }(value.series)).on('mouseleave', function (d) {
            removeToolTip();
            config.mouseout(d, d3.event);
            scope.$apply();
          }).on('mousemove', function (d) {
            updateToolTip(d3.event);
          }).on('click', function (d) {
            config.click(d, d3.event);
            scope.$apply();
          });
          if (config.labels) {
            points.append('text').attr('x', function (d) {
              return getX(d.x);
            }).attr('y', function (d) {
              return y(d.y);
            }).text(function (d) {
              return d.y;
            });
          }
        });
        /**
       * Returns x point of line point
       * @param  {[type]} d [description]
       * @return {[type]}   [description]
       */
        function getX(d) {
          return Math.round(x(d)) + x.rangeBand() / 2;
        }
        ;
      }
      /**
     * Creates and displays tooltip
     * @return {[type]} [description]
     */
      function makeToolTip(data, event) {
        if (!config.tooltips) {
          return;
        }
        if (typeof config.tooltips == 'function') {
          data = config.tooltips(data);
        } else {
          data = data.value;
        }
        var el = angular.element('<p class="ac-tooltip" style="' + tooltip + '"></p>').html(data).css({
            left: event.pageX + 20,
            top: event.pageY - 30
          });
        $rootElement.find('body').append(el);
        scope.$tooltip = el;
      }
      /**
     * Clears the tooltip from body
     * @return {[type]} [description]
     */
      function removeToolTip() {
        scope.$tooltip.remove();
      }
      function updateToolTip(event) {
        scope.$tooltip.css({
          left: event.pageX + 10+'px',
          top: event.pageY - 15+'px'
        });
      }
      /**
     * Adds data to legend
     * @return {[type]} [description]
     */
      function drawLegend() {
        scope.legends = [];
        if (chartType == 'pie') {
          angular.forEach(points, function (value, key) {
            scope.legends.push({
              color: config.colors[key],
              title: value.x
            });
          });
        }
        if (chartType == 'bar' || chartType == 'area' || chartType == 'point' || chartType == 'line' && config.lineLegend === 'traditional') {
          angular.forEach(series, function (value, key) {
            scope.legends.push({
              color: config.colors[key],
              title: value
            });
          });
        }
      }
      /**
     * Checks if index is available in color 
     * else returns a random color
     * @param  {[type]} i [description]
     * @return {[type]}   [description]
     */
      function getColor(i) {
        if (i < config.colors.length) {
          return config.colors[i];
        } else {
          var color = getRandomColor();
          config.colors.push(color);
          return color;
        }
      }
      var w = angular.element($window);
      var resizePromise = null;
      w.bind('resize', function (ev) {
        resizePromise && $timeout.cancel(resizePromise);
        resizePromise = $timeout(function () {
          totalWidth = element[0].clientWidth;
          totalHeight = element[0].clientHeight;
          init();
        }, 100);
      });
      scope.getWindowDimensions = function () {
        return {
          'h': w[0].clientHeight,
          'w': w[0].clientWidth
        };
      };
      //let the party begin!
      //add some watchers
      scope.$watch('acChart', function () {
        init();
      }, true);
      scope.$watch('acData', function () {
        init();
      }, true);
      scope.$watch('acConfig', function () {
        init();
      }, true);
    }
    return {
      restrict: 'EA',
      link: link,
      transclude: 'true',
      scope: {
        acChart: '=',
        acData: '=',
        acConfig: '='
      }
    };
  }
]);
angular.module('angularChartsTemplates', ['left', 'right']);

angular.module("left", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("left",
    "\n" +
    "<style>\n" +
    " .axis path,\n" +
    " .axis line {\n" +
    "   fill: none;\n" +
    "   stroke: #333;\n" +
    " }\n" +
    " .ac-line {\n" +
    "   fill:none;\n" +
    "   stroke-width:2px;\n" +
    " }\n" +
    "</style>\n" +
    "\n" +
    "<div class='ac-title' style='font-weight: bold;font-size: 1.2em;'>{{acConfig.title}}</div>\n" +
    "<div class='ac-legend' style='float:left; max-width:25%;' ng-show='{{acConfig.legend.display}}'>\n" +
    " <table style='list-style:none;margin:0px;padding:0px;'>\n" +
    " <tr ng-repeat=\"l in legends\">\n" +
    "   <td><div ng-attr-style='background:{{l.color}}; height:15px;width:15px;'></div></td>\n" +
    "   <td style=' display: inline-block;' ng-bind='l.title'></td>\n" +
    " </tr>\n" +
    " </table>\n" +
    "</div>\n" +
    "<div class='ac-chart' style='float:left; width:75%;'>\n" +
    "</div>");
}]);

angular.module("right", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("right",
    "<style>\n" +
    " .axis path,\n" +
    " .axis line {\n" +
    "   fill: none;\n" +
    "   stroke: #333;\n" +
    " }\n" +
    " .ac-line {\n" +
    "   fill:none;\n" +
    "   stroke-width:2px;\n" +
    " }\n" +
    "</style>\n" +
    "\n" +
    "<div class='ac-title' style='font-weight: bold;font-size: 1.2em;'>{{acConfig.title}}</div>\n" +
    "<div class='ac-chart' style='float:left;width:75%;'>\n" +
    "</div>\n" +
    "<div class='ac-legend' style='float:left; max-width:25%;' ng-show='{{acConfig.legend.display}}'>\n" +
    " <table style='list-style:none;margin:0px;padding:0px;'>\n" +
    " <tr ng-repeat=\"l in legends | limitTo:yMaxData\">\n" +
    "   <td><div ng-attr-style='background:{{l.color}}; height:15px;width:15px;'></div></td>\n" +
    "   <td style=' display: inline-block;' ng-bind='l.title'></td>\n" +
    " </tr>\n" +
    " </table>\n" +
    "</div>");
}]);

'use strict';

// Declare app level module which depends on filters, and services

angular.module('drive', [
  'ngRoute',
  'good.ui.grid',
  'drive.controllers',
  'drive.services',
  'drive.directives',
  'drive.filters',
  'ngCookies',
  'angularCharts',
  'ui.bootstrap'])
    .config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
//  $locationProvider.html5Mode(true).hashPrefix('');
//      $locationProvider.html5Mode(true);
      $routeProvider
          .when('/datagrid/attachment', {templateUrl: 'partials/documentStatistic.html', controller: 'AttachmentCtrl'})
          .when('/datagrid/attachmentActivity', {templateUrl: 'partials/attachmentActivity.html', controller: 'AttachmentActivityCtrl'})
          .when('/datagrid/device', {templateUrl: 'partials/device.html', controller: 'DeviceCtrl'})
          .when('/datagrid/deviceActivity', {templateUrl: 'partials/deviceActivity.html', controller: 'DeviceActivityCtrl'})
          .when('/datagrid/devicestatus', {templateUrl: 'partials/data-map.html'})
          .when('/chart/attachmentChart', {templateUrl: 'partials/chart.html', controller: 'AttachmentChartCtrl'})
          .when('/chart/deviceChart', {templateUrl: 'partials/chart.html', controller: 'DeviceChartCtrl'})
          .when('/datagrid/userInfo', {templateUrl: 'partials/userInfo.html', controller: 'userAddCtrl'});
    }])
//
    .run(['$templateCache', '$location', '$cookieStore', '$cookies', 'Constant', function ($templateCache, $location, $cookieStore, $cookies, Constant) {
      var searchObject = $location.hash() || $location.$$path;
      if (searchObject && searchObject.indexOf('server') >= 0) {
        var serverUrl = searchObject.substring(searchObject.indexOf('=') + 1);
        $cookieStore.put('server', serverUrl);
      }
      var serverUrl = $cookieStore.get('server');
      if (serverUrl) {
        Constant.serverUrl = serverUrl;
      }
      console.log(serverUrl);
//    $templateCache.put('partials/helloworld1.html',"<h1 style='color:blue;'>{{helloworld1}}</h1>");
    }]);

'use strict';

/* Controllers */


angular.module('drive.controllers', [])
    .controller('HeadCtrl', ['$rootScope', '$scope', 'HeadData', function ($rootScope, $scope, HeadData) {
      $scope.headList = HeadData;
      $scope.setHead = function (index) {
        HeadData.forEach(function (item) {
          item.className_ = '';
        });
        HeadData[index].className_ = 'active';
        $scope.headList = HeadData;
      }
    }])
    .controller('MenuCtrl', ['$rootScope', '$scope', 'HeadData', function ($rootScope, $scope, HeadData) {
      $scope.headList = HeadData;
      //监听service的变化
      $scope.$watch('headList', function (newVal, oldVal) {
        HeadData.forEach(function (item) {
          if (item.className_ == 'active') {
            $scope.menuList = item.menu;
          }
        });
      }, true);
      $scope.setMenu = function (index) {
        $scope.menuList.forEach(function (item) {
          item.className_ = '';
        });
        $scope.menuList[index].className_ = 'active';
      }
    }])
    .controller('AttachmentActivityCtrl', ['$scope', 'bus', 'Constant', 'PaginationService', 'millionFormat', '$log', 'messageService', function ($scope, bus, Constant, PaginationService, millionFormat, $log, messageService) {

      var currentPage = 1;
      var size = 5;
      var index = 'drive_test';
      var type = 'attachmentActivity';
      var flag = true; //true向下翻，
      $scope.title = '文档操作管理';
      //两字段排序,如果open 与uid不能保持一至,则无法向上翻页
      var searchParam = {
        "action": 'search',
        '_index': index,
        '_type': type,
        source: {
          sort: [
            '_uid'
          ],
          'size': size
        }
      };

      var getQueryString = function (keyword) {
        var queryString = {match_all: {}};
        if (keyword != '' || keyword.length != 0) {
          queryString = {
            "multi_match": {
              "query": '"' + keyword + '"',
              "fields": ["title", "user", "userId"]
            }
          }
        }
        return queryString;
      };

      var callback = function (message) {
        var datas = message.body().hits.hits;
        if (!datas || datas.length == 0) {
          messageService.toast('查询不到新数据哦！');
          --currentPage;
          return;
        }
        for (var i = 0; i < datas.length; i++) {
          datas[i]._source.duration = millionFormat(datas[i]._source.duration)
        }
        $scope.$apply(function () {
          if (!flag && !$scope.search_tx) {
            datas.reverse();
          }
          $scope.datas = datas;

          if (datas.length !== 0) {
            var dataHeader = [];
            var dataBody = [];
            var dataTr = [];
            for (var p in datas[0]._source) {
              switch (p) {
                case "attachmentId":
                  p = "文件编码";
                  break;
                case "open":
                  p = "打开时间";
                  break;
                case "duration":
                  p = "持续时间";
                  break;
                case "userId":
                  p = "设备MAC";
                  break;
                case "title":
                  p = "文件标题";
                  break;
                case "user":
                  p = "所属校园";
                  break;
              }
              dataHeader.push(p);
            }
            for (var i = 0; i < datas.length; i++) {
              for (var p in datas[i]._source) {
                dataTr.push(datas[i]._source[p]);
              }
              dataBody.push(dataTr);
              dataTr = [];
            }
            $scope.tableHeader = dataHeader;
            $scope.tableBody = dataBody;
          }

        });
      };

      bus().send(Constant.search_channel, searchParam, callback);
      $scope.prePage = function () {
        if (currentPage <= 1) {
          currentPage = 1;
        }

        if (currentPage == 1) {
          messageService.toast('已经是第一页了哦！');
          return;
        }

        if (currentPage != 1) {
          currentPage--;
        }
        flag = false;

        var getFirstItem = function (items) {
          if (!items || !angular.isArray(items) || items.length == 0) {
            return null;
          }
          return items[0];
        }
        //$scope.datas array clone
        var datas = angular.extend([], $scope.datas);
//            if(datas.length < size)
//                return;
        var first = getFirstItem(datas);
        if (first) {
          var querydsl = PaginationService.buildQuery({'_uid': type + '#' + first._id}, null, 5, false);
          if ($scope.search_tx) {
            querydsl = {
              query: getQueryString($scope.search_tx),
              from: (currentPage - 1) * 5,
              size: 5
            };
          } else {
            querydsl.sort.pop();
            querydsl.sort.push({'_uid': 'desc'})
          }
          searchParam.source = querydsl;
          $log.log(JSON.stringify(searchParam));
          bus().send(Constant.search_channel, searchParam, callback);
        }
      }
      $scope.nextPage = function () {
        if (currentPage <= 1) {
          currentPage = 1;
        }

        flag = true;
        var getLastItem = function (items) {
          if (!items || !angular.isArray(items) || items.length == 0) {
            return null;
          }
          return items[size - 1];
        }
        //$scope.datas array clone
        var datas = angular.extend([], $scope.datas)
        if (datas.length < size) {
          messageService.toast('没有更多数据了哦！');
          return;
        }

        currentPage++;
        var last = getLastItem(datas);
        if (last) {
          var querydsl = PaginationService.buildQuery({'_uid': type + '#' + last._id}, null, 5, true);
          if ($scope.search_tx) {
            querydsl = {
              query: getQueryString($scope.search_tx),
              from: (currentPage - 1) * 5,
              size: 5
            };
          }
          searchParam.source = querydsl;
          $log.log(JSON.stringify(searchParam));
          bus().send(Constant.search_channel, searchParam, callback);

        }
      }
      $scope.searchClick = function () {
        flag = true;
        currentPage = 1;
        if ($scope.search_tx) {
          searchParam = {
            action: 'search',
            _index: index,
            _type: type,
            source: {
              query: getQueryString($scope.search_tx),
              from: 0,
              size: 5
            },
            search_type: 'query_then_fetch',
            scroll: '5m'
          };
        } else {
          searchParam = {
            "action": 'search',
            '_index': index,
            '_type': type,
            source: {
              sort: [
//                {'open':"desc"},
                '_uid'
              ],
              'size': size
            }
          };
        }
        $log.log(JSON.stringify(searchParam));
        bus().send(Constant.search_channel, searchParam, callback);
      }
    }])
    .controller('DeviceActivityCtrl', ['$scope', 'bus', 'Constant', 'PaginationService', 'millionFormat', '$log', 'messageService', function ($scope, bus, Constant, PaginationService, millionFormat, $log, messageService) {
      var currentPage = 1;
      var size = 5;
      var index = 'drive_test';
      var type = 'deviceActivity';
      var flag = true; //true向下翻，
      $scope.title = '设备操作管理';
      var searchParam = {
        "action": 'search',
        '_index': index,
        '_type': type,
        source: {
          sort: [
            '_uid'
          ],
          'size': size
        }
      };

      var getQueryString = function (keyword) {
        var queryString = {match_all: {}};
        if (keyword != '' || keyword.length != 0) {
          queryString = {
            "multi_match": {
              "query": '"' + keyword + '"',
              "fields": ["deviceId", "address", "user^2"]
            }
          }
        }
        return queryString;
      };

      var callback = function (message) {
        var datas = message.body().hits.hits;
        if (!datas || datas.length == 0) {
          messageService.toast('查询不到新数据哦！');
          --currentPage;
          return;
        }
        for (var i = 0; i < datas.length; i++) {
          datas[i]._source.duration = millionFormat(datas[i]._source.duration);
          datas[i]._source.radius = Math.round(datas[i]._source.radius);
        }
        $scope.$apply(function () {
          if (!flag && !$scope.search_tx) {
            datas.reverse();
          }
          $scope.datas = datas;

          if (datas.length !== 0) {
            var dataHeader = [];
            var dataBody = [];
            var dataTr = [];
            for (var p in datas[0]._source) {
              switch (p) {
                case "code":
                  p = "编码";
                  break;
                case "deviceId":
                  p = "MAC地址";
                  break;
                case "user":
                  p = "学校";
                  break;
                case "address":
                  p = "地址";
                  break;
                case "open":
                  p = "开机时间";
                  break;
                case "duration":
                  p = "持续时间";
                  break;
                case "coordinates":
                  p = "经纬度";
                  break;
                case "radius":
                  p = "精度";
                  break;

              }
              dataHeader.push(p);
            }
            for (var i = 0; i < datas.length; i++) {
              for (var p in datas[i]._source) {
                dataTr.push(datas[i]._source[p]);
              }
              dataBody.push(dataTr);
              dataTr = [];
            }
            $scope.tableHeader = dataHeader;
            $scope.tableBody = dataBody;
          }

        });
      };
      $log.log(JSON.stringify(searchParam));
      bus().send(Constant.search_channel, searchParam, callback);
      $scope.prePage = function () {
        if (currentPage <= 1) {
          currentPage = 1;
        }
        if (currentPage == 1) {
          messageService.toast('已经是第一页了哦！');
          return;
        }
        if (currentPage != 1) {
          currentPage--;
        }
        flag = false;

        var getFirstItem = function (items) {
          if (!items || !angular.isArray(items) || items.length == 0) {
            return null;
          }
          return items[0];
        }
        //$scope.datas array clone
        var datas = angular.extend([], $scope.datas);
//            if(datas.length < size)
//                return;
        var first = getFirstItem(datas);
        if (first) {
          var querydsl = PaginationService.buildQuery({'_uid': type + '#' + first._id}, null, 5, false);
          if ($scope.search_tx) {
            querydsl = {
              query: getQueryString($scope.search_tx),
              from: (currentPage - 1) * 5,
              size: 5
            };
          } else {
            querydsl.sort.pop();
            querydsl.sort.push({'_uid': 'desc'})
          }
          searchParam.source = querydsl;
          $log.log(JSON.stringify(searchParam));
          bus().send(Constant.search_channel, searchParam, callback);
        }
      }
      $scope.nextPage = function () {
        if (currentPage <= 1) {
          currentPage = 1;
        }
        flag = true;
        var getLastItem = function (items) {
          if (!items || !angular.isArray(items) || items.length == 0) {
            return null;
          }
          return items[size - 1];
        }
        //$scope.datas array clone
        var datas = angular.extend([], $scope.datas)
        if (datas.length < size) {
          messageService.toast('没有更多数据了哦！');
          return;
        }

        currentPage++;
        var last = getLastItem(datas);
        if (last) {
          var querydsl = PaginationService.buildQuery({'_uid': type + '#' + last._id}, null, 5, true);
          if ($scope.search_tx) {
            querydsl = {
              query: getQueryString($scope.search_tx),
              from: (currentPage - 1) * 5,
              size: 5
            };
          }
          searchParam.source = querydsl;
          $log.log(JSON.stringify(searchParam));
          bus().send(Constant.search_channel, searchParam, callback);

        }
      }
      $scope.searchClick = function () {
        flag = true;
        currentPage = 1;
        if ($scope.search_tx) {
          searchParam = {
            action: 'search',
            _index: index,
            _type: type,
            source: {
              query: getQueryString($scope.search_tx),
              from: 0,
              size: 5
            },
            search_type: 'query_then_fetch',
            scroll: '5m'
          };
        } else {
          searchParam = {
            "action": 'search',
            '_index': index,
            '_type': type,
            source: {
              sort: [
//                {"open":"desc"},
                "_uid"
              ],
              'size': size
            }
          };
        }
        $log.log(JSON.stringify(searchParam));
        bus().send(Constant.search_channel, searchParam, callback);
      }
    }])
    .controller('DeviceCtrl', ['$scope', 'bus', 'Constant', 'PaginationService', 'millionFormat', '$log', 'messageService', function ($scope, bus, Constant, PaginationService, millionFormat, $log, messageService) {
      var currentPage = 1;
      var size = 5;
      var index = 'drive_test';
      var type = 'device';
      var flag = true; //true向下翻，
      $scope.loadingStatus = new Array(new Array(), new Array());
      $scope.btnStatus = new Array(new Array(), new Array());
      $scope.btnText = []; //操作按钮文字
      $scope.statusText = []; //设备状态
      $scope.title = '设备管理';
      var searchParam = {
        "action": 'search',
        '_index': index,
        '_type': type,
        source: {
          sort: [
            '_uid'
          ],
          'size': size
        }
      };

      var getQueryString = function (keyword) {
        var queryString = {match_all: {}};
        if (keyword != '' || keyword.length != 0) {
          queryString = {
            "multi_match": {
              "query": '"' + keyword + '"',
              "fields": [ "owner^2", "registAddress"]
            }
          }
        }
        return queryString;
      };

      var callback = function (message) {

        var datas = message.body().hits.hits;
        if (!datas || datas.length == 0) {
          messageService.toast('查询不到新数据哦！');
          --currentPage;
          return;
        }

//        for(var i=0;i<datas.length;i++){
//          datas[i]._source._id = datas[i]._id;
//        }

        $scope.$apply(function () {
          $scope.datas = datas;
          if (!flag && !$scope.search_tx) {
            datas.reverse();
          }
          var tableInfo = show(datas);
          //表头
          $scope.tableHeader = tableInfo.tableHeader;
          //表体
          $scope.tableBody = tableInfo.tableBody;
        });
      };

      var show = function (datas) {
        if (datas.length !== 0) {
          var dataHeader = ["MAC地址"];
          var dataBody = [];
          var dataTr = [];
          for (var p in datas[0]._source) {
            switch (p) {
              case "code":
                dataHeader.push("设备编码");
                break;
              case "owner":
                dataHeader.push('使用学校');
                break;
              case "contact":
                dataHeader.push('联系方式');
                break;
              case "registAddress":
                dataHeader.push('注册地址');
                break;
            }
          }
          for (var i = 0; i < datas.length; i++) {
            dataTr.push(datas[i]._id);
            for (var p in datas[i]._source) {
              if (p == "reset" || p == "lock" || p == "registCoordinates" || p == "radius")break;
              dataTr.push(datas[i]._source[p]);
            }
            dataBody.push(dataTr);
            dataTr = [];
            if (datas[i]._source.reset == 1) {
              $scope.btnText[i] = '取消';
            } else {
              $scope.btnText[i] = '重置';
            }
            if (datas[i]._source.lock == 0) {
              $scope.statusText[i] = '锁定';
            } else {
              $scope.statusText[i] = '解锁';
            }
            $scope.loadingStatus[i] = new Array();
            $scope.btnStatus[i] = new Array();
            $scope.loadingStatus[i][0] = false;
            $scope.loadingStatus[i][1] = false;
            $scope.btnStatus[i][0] = true;
            $scope.btnStatus[i][1] = true;
          }
          return {
            tableHeader: dataHeader,
            tableBody: dataBody
          };
        }
      }

      bus().send(Constant.search_channel, searchParam, callback);
      $scope.prePage = function () {
        if (currentPage <= 1) {
          currentPage = 1;
        }
        if (currentPage == 1) {
          messageService.toast('已经是第一页了哦！');
          return;
        }
        if (currentPage != 1) {
          currentPage--;
        }
        flag = false;

        var getFirstItem = function (items) {
          if (!items || !angular.isArray(items) || items.length == 0) {
            return null;
          }
          return items[0];
        }
        //$scope.datas array clone
        var datas = angular.extend([], $scope.datas);
//            if(datas.length < size)
//                return;
        var first = getFirstItem(datas);
        if (first) {
          var querydsl = PaginationService.buildQuery({'_uid': type + '#' + first._id}, null, 5, false);
          if ($scope.search_tx) {
            querydsl = {
              query: getQueryString($scope.search_tx),
              from: (currentPage - 1) * 5,
              size: 5
            };
          } else {
            querydsl.sort.pop();
            querydsl.sort.push({'_uid': 'desc'})
          }
          searchParam.source = querydsl;
          $log.log(JSON.stringify(searchParam));
          bus().send(Constant.search_channel, searchParam, callback);
        }
      }
      $scope.nextPage = function () {
        if (currentPage <= 1) {
          currentPage = 1;
        }
        flag = true;
        var getLastItem = function (items) {
          if (!items || !angular.isArray(items) || items.length == 0) {
            return null;
          }
          return items[size - 1];
        }
        //$scope.datas array clone
        var datas = angular.extend([], $scope.datas)
        if (datas.length < size) {
          messageService.toast('没有更多数据了哦！');
          return;
        }

        currentPage++;
        var last = getLastItem(datas);
        if (last) {
          var querydsl = PaginationService.buildQuery({'_uid': type + '#' + last._id}, null, 5, true);
          if ($scope.search_tx) {
            querydsl = {
              query: getQueryString($scope.search_tx),
              from: (currentPage - 1) * 5,
              size: 5
            };
          }
          searchParam.source = querydsl;
          $log.log(JSON.stringify(searchParam));
          bus().send(Constant.search_channel, searchParam, callback);

        }
      }
      $scope.searchClick = function () {
        flag = true;
        currentPage = 1;
        if ($scope.search_tx) {
          searchParam = {
            action: 'search',
            _index: index,
            _type: type,
            source: {
              query: getQueryString($scope.search_tx),
              from: 0,
              size: 5
            },
            search_type: 'query_then_fetch',
            scroll: '5m'
          };
        } else {
          searchParam = {
            "action": 'search',
            '_index': index,
            '_type': type,
            source: {
              sort: [
                "_uid"
              ],
              'size': size
            }
          };
        }
        $log.log(JSON.stringify(searchParam));
        bus().send(Constant.search_channel, searchParam, callback);
      }

      $scope.resetClick = function (id, btnIndex, btnPara) {
        $scope.loadingStatus[btnIndex][btnPara] = !$scope.loadingStatus[btnIndex][btnPara];
        $scope.btnStatus[btnIndex][btnPara] = !$scope.btnStatus[btnIndex][btnPara];
        var getInfo = {
          action: 'get',
          _index: index,
          _type: type,
          _id: id
        }
        bus().send(Constant.search_channel, getInfo, function (message) {
          if (btnPara == 0) {
            message.body()._source.lock = $scope.statusText[btnIndex] == '锁定' ? 1 : 0;
          } else {
            message.body()._source.reset = $scope.btnText[btnIndex] == '重置' ? 1 : 0;
          }

          var updateDevice = {
            action: 'index',
            _index: index,
            _type: type,
            _id: message.body()._id,
            source: message.body()._source
          }
          console.log(updateDevice);
          bus().send(Constant.search_channel, updateDevice, function (message) {
            console.log(message.body());
            $scope.$apply(function () {
              $scope.loadingStatus[btnIndex][btnPara] = !$scope.loadingStatus[btnIndex][btnPara];
              $scope.btnStatus[btnIndex][btnPara] = !$scope.btnStatus[btnIndex][btnPara];
              if (btnPara == 0) {
                $scope.statusText[btnIndex] = $scope.statusText[btnIndex] == '锁定' ? '解锁' : '锁定';
              } else {
                $scope.btnText[btnIndex] = $scope.btnText[btnIndex] == '重置' ? '取消' : '重置';
              }
            });
          });
        });
      }
    }])
    .controller('AttachmentCtrl',['$scope','$modal','bus','Constant','PaginationService','millionFormat','$log','messageService',function($scope,$modal,bus,Constant,PaginationService,millionFormat,$log,messageService){
      var currentPage = 1;
      var size = 5;
      var index = 'drive_test';
      var type = 'attachment';
      var flag = true; //true向下翻，
      $scope.deviceOpen = []; // 设备总数
      $scope.deviceData = []; //播放设备详情
      $scope.openCount = []; //播放次数
      $scope.openTime = []; //播放时长
      $scope.attachmentType = []; //文件类型
      $scope.title = '文档播放统计哦';
      var searchParam = {
        "action": 'search',
        '_index': index,
        '_type': type,
        source: {
          sort: [
            '_uid'
          ],
          'size': size
        }
      };

      var getQueryString = function (keyword) {
        var queryString = {match_all: {}};
        if (keyword != '' || keyword.length != 0) {
          queryString = {
            "multi_match": {
              "query": '"' + keyword + '"',
              "fields": [ "title^2", "tags"]
            }
          }
        }
        return queryString;
      };

      var callback = function (message) {
        var datas = message.body().hits.hits;
        if (!datas || datas.length == 0) {
          messageService.toast('查询不到新数据哦！');
          --currentPage;
          return;
        }

        $scope.$apply(function () {
          $scope.datas = datas;
          if (!flag && !$scope.search_tx) {
            datas.reverse();
          }
          var tableInfo = show(datas);
          //表头
          $scope.tableHeader = tableInfo.tableHeader;
          //表体
          $scope.tableBody = tableInfo.tableBody;
        });
      };

      var show = function (datas) {
        if (datas.length !== 0) {
          var dataHeader = ["文档编号"];
          var dataBody = [];
          var dataTr = [];
          for (var p in datas[0]._source) {
            switch (p) {
              case "title":
                dataHeader.push("文档标题");
                break;
            }
          }

          for (var i = 0; i < datas.length; i++) {
            dataTr.push(datas[i]._id);
            for (var p in datas[i]._source) {
              if (p == "contentLength" || p == "url" || p == "thumbnail" || p == "tags")break;
              if (p == "contentType") {
                dataTr.push(datas[i]._source[p].split("/")[datas[i]._source[p].split("/").length - 1])
              } else {
                dataTr.push(datas[i]._source[p]);
              }
            }
            dataBody.push(dataTr);
            getOpenDeviceByFile(i, datas[i]._id);
            dataTr = [];
          }
          return {
            tableHeader: dataHeader,
            tableBody: dataBody
          };
        }
      }

      bus().send(Constant.search_channel, searchParam, callback);
      $scope.prePage = function () {
        if (currentPage <= 1) {
          currentPage = 1;
        }
        if (currentPage == 1) {
          messageService.toast('已经是第一页了哦！');
          return;
        }
        if (currentPage != 1) {
          currentPage--;
        }
        flag = false;

        var getFirstItem = function (items) {
          if (!items || !angular.isArray(items) || items.length == 0) {
            return null;
          }
          return items[0];
        }
        //$scope.datas array clone
        var datas = angular.extend([], $scope.datas);
        var first = getFirstItem(datas);
        if (first) {
          var querydsl = PaginationService.buildQuery({'_uid': type + '#' + first._id}, null, 5, false);
          if ($scope.search_tx) {
            querydsl = {
              query: getQueryString($scope.search_tx),
              from: (currentPage - 1) * 5,
              size: 5
            };
          } else {
            querydsl.sort.pop();
            querydsl.sort.push({'_uid': 'desc'})
          }
          searchParam.source = querydsl;
          $log.log(JSON.stringify(searchParam));
          bus().send(Constant.search_channel, searchParam, callback);
        }
      }
      $scope.nextPage = function () {
        if (currentPage <= 1) {
          currentPage = 1;
        }
        flag = true;
        var getLastItem = function (items) {
          if (!items || !angular.isArray(items) || items.length == 0) {
            return null;
          }
          return items[size - 1];
        }
        //$scope.datas array clone
        var datas = angular.extend([], $scope.datas)
        if (datas.length < size) {
          messageService.toast('没有更多数据了哦！');
          return;
        }

        currentPage++;
        var last = getLastItem(datas);
        if (last) {
          var querydsl = PaginationService.buildQuery({'_uid': type + '#' + last._id}, null, 5, true);
          if ($scope.search_tx) {
            querydsl = {
              query: getQueryString($scope.search_tx),
              from: (currentPage - 1) * 5,
              size: 5
            };
          }
          searchParam.source = querydsl;
          $log.log(JSON.stringify(searchParam));
          bus().send(Constant.search_channel, searchParam, callback);

        }
      }
      $scope.searchClick = function () {
        flag = true;
        currentPage = 1;
        if ($scope.search_tx) {
          searchParam = {
            action: 'search',
            _index: index,
            _type: type,
            source: {
              query: getQueryString($scope.search_tx),
              from: 0,
              size: 5
            },
            search_type: 'query_then_fetch',
            scroll: '5m'
          };
        } else {
          searchParam = {
            "action": 'search',
            '_index': index,
            '_type': type,
            source: {
              sort: [
                "_uid"
              ],
              'size': size
            }
          };
        }
        $log.log(JSON.stringify(searchParam));
        bus().send(Constant.search_channel, searchParam, callback);
      }

      //某个设备上，某个文件播放次数
      var getDeviceOpenCount = function (userId, attachmentId) {
        var source = {
          "query": {
            "bool": {
              "must": [
                {
                  "term": {
                    "userId": userId
                  }
                },
                {
                  "term": {
                    "attachmentId": attachmentId
                  }
                }
              ]
            }
          },
          "from": 0,
          "size": 0
        };
        var getDeviceOpen = {
          "action": 'search',
          '_index': index,
          '_type': "attachmentActivity",
          source: source
        };
        bus().send(Constant.search_channel, getDeviceOpen, function (message) {
          $scope.$apply(function () {
            $scope.deviceOpen.push(message.body().hits.total);
          });
        });
      }

      //根据文件获取播放过的设备
      var getOpenDeviceByFile = function (lineNo, attachmentId) {
        var source = {
          "size": 0,
          "query": {
            "term": { "attachmentId": attachmentId }
          },
          "facets": {
            "tag": {
              "terms": {
                "fields": ["userId"],
                "size": 100000000
              }
            }
          }
        }
        var getDevices = {
          "action": 'search',
          '_index': index,
          '_type': "attachmentActivity",
          source: source
        };
        bus().send(Constant.search_channel, getDevices, function (message) {
          var Data = message.body().facets.tag.terms;
          var openCount = 0;
          for (var i = 0; i < Data.length; i++) {
            openCount = openCount + Data[i].count;
          }
          $scope.$apply(function () {
            $scope.deviceData[lineNo] = Data;
            $scope.deviceOpen[lineNo] = Data.length;
            $scope.openCount[lineNo] = openCount;
          });
        });
      }

      $scope.detailClick = function (btnIndex) {
        var toastStr = "";
        var data = $scope.deviceData[btnIndex];
        for (var o in data) {
          toastStr = toastStr + "设备号:" + data[o].term + "  播放数:" + data[o].count + "</br>";
        }
        messageService.toast(toastStr);
      }

      //查看详情
      var ModalInstanceCtrl = function ($scope, $modalInstance, items) {
        $scope.items = items;
        $scope.cancel = function () {
          $modalInstance.dismiss('cancel');
        };
      };

      $scope.open = function (btnIndex) {
        var modalInstance = $modal.open({
          templateUrl: 'myModalContent.html',
          controller: ModalInstanceCtrl,
          size: "lg",
          resolve: {
            items: function () {
              return $scope.deviceData[btnIndex];
            }
          }
        });
      };
    }])
    .controller('AttachmentChartCtrl', ['$rootScope', '$scope', 'bus', 'Constant', 'DateService', function ($rootScope, $scope, bus, Constant, DateService) {
      var index = "drive_test";
      $scope.data = {
        series: ['所有文件播放次数'],
        data: []
      }

      var getData = function (dateIndex) {
        var date = DateService.getWeekDate(dateIndex);
        var source = {
          "size": 0,
          "query": {
            "range": {
              "open": {
                "gte": date,
                "lte": date
              }
            }
          },
          "facets": {
            "tag": {
              "terms": {
                "fields": [
                  "attachmentId"
                ],
                "size": 3
              }
            }
          }
        };
        var getAttachmentActivity = {
          "action": 'search',
          '_index': index,
          '_type': "attachmentActivity",
          source: source
        };
        bus().send(Constant.search_channel, getAttachmentActivity, function (message) {
          var totalCount = message.body().hits.total;
          var otherCount = message.body().facets.tag.terms;
          $scope.$apply(function () {
            $scope.data.data[dateIndex - 1] = {
              x: DateService.getFormatDate(new Date(date)),
              y: [totalCount]
            };
          });
        });
      }

      for (var n = 1; n < 8; n++) {
        getData(n);
      }

      $scope.chartType = 'line';

      $scope.config = {
        labels: false,
        title: "文件播放统计图 第 " + DateService.getWeekNo() + " 周",
        legend: {
          display: true,
          position: 'right'
        },
        lineLegend: 'traditional'
      };
    }])
    .controller('DeviceChartCtrl', ['$rootScope', '$scope','bus','Constant','DateService', function ($rootScope, $scope,bus,Constant,DateService) {
      var index = "drive_test";
      $scope.data = {
        series: ['所有设备开机次数'],
        data : []
      }

      var getData = function(dateIndex){
        var date = DateService.getWeekDate(dateIndex);
        var source = {
          "size": 0,
          "query": {
            "range" : {
              "open" : {
                "gte" : date,
                "lte" : date
              }
            }
          },
          "facets": {
            "tag": {
              "terms": {
                "fields": [
                  "deviceId"
                ],
                "size": 3
              }
            }
          }
        };
        var getDeviceActivity = {
          "action":'search',
          '_index':index,
          '_type':"deviceActivity",
          source:source
        };
        bus().send(Constant.search_channel, getDeviceActivity, function(message){
          var totalCount = message.body().hits.total;
          var otherCount = message.body().facets.tag.terms;
          $scope.$apply(function(){
            $scope.data.data[dateIndex-1] = {
              x : DateService.getFormatDate(new Date(date)),
              y: [totalCount]
            };
          });
        });
      }

      for(var n = 1; n < 8; n++){
        getData(n);
      }


      //线性表显示
      $scope.chartType = 'line';

      $scope.config = {
        labels: false,
        title : "设备开机统计图 第 " + DateService.getWeekNo() + " 周",
        legend : {
          display:true,
          position:'right'
        },
        lineLegend: 'traditional'
      };
    }])
    .controller('userAddCtrl', ['$scope', function ($scope) {
      $scope.title = "用户信息"
      $scope.resetUser = function () {
        $scope.user = "";
      }

      $scope.saveUser = function () {
        $scope.resetUser();
      }
    }]);

'use strict';

/* Directives */


angular.module('drive.directives', ['drive.controllers'])
    .directive('helloworld', function () {
      return {
        restrict: 'E',
        controller: 'Ctrl2',
        replace: 'true',
        templateUrl: 'partials/helloworldDirective.html'
      }
    })
    .directive('toast', ['$timeout', '$interval', '$window', function ($timeout, $interval, $window) {
      var canDismiss = true;
      var linkFn = function (scope, elment, attr) {
        elment.on('mouseover', function () {
          canDismiss = false;
        });
        elment.on('mouseout', function () {
          canDismiss = true;
        });
        var interval = $interval(function () {
          if (canDismiss) {
            elment.remove();
            $interval.cancel(interval)
          }
        }, 2000)
      }
      return {
        restrict: 'EA',
        transclude: true,
        templateUrl: 'partials/messageDirective.html',
        compile: function (tElement, tAttrs, transclude) {
          //屏幕可视区域宽高
          var height = $window.screen.height;
          var width = $window.screen.width;
          console.log(height + '---' + width);
          var eleWid = tElement[0].firstChild.offsetWidth;
          var eleHeight = tElement[0].firstChild.offsetHeight;
          tElement.find('div').css({
            top: (height - eleHeight) / 2 + 'px',
            left: (width - eleWid) / 2 + 'px'
          });
          return linkFn;
        }
      }
    }])
    .directive('goodMap', ['Constant', 'bus', '$window', function (Constant, bus, $window) {
      function link(scope, element, attrs) {
        /**
         * google地图
         */
        var map;
        /**
         * google地图标记数组
         * @type {Array}
         */
        var markersArray = [];
        /**
         * 当设备上线时显示的地图标记的自定义图标
         * @type {string}
         */
        var image = 'img/markerIcon.png';

        /**
         * 获取在线的所有设备
         */
        function getLogin() {
          var searchParam = {
            "action": "search",
            "_index": "drive_test",
            "_type": "deviceStatus",
            "source": {
              "size": 10000,
              "query": {
                "term": {"status": "login"}
              }
            }
          };


          bus().send(Constant.search_channel, searchParam, function (message) {
            var datas = message.body().hits.hits;
            if (!datas || datas.length == 0) {
              return;
            }
            scope.$apply(function () {
              scope.mapInfos = datas;
            });
          });
        }


        /**
         * 监听drive.devicestatus频道
         */
        bus().registerHandler("drive/devicestatus", function (registerMessage) {
          scope.$apply(function () {
            scope.mapInfo = registerMessage.body();
          });
        });


        /**
         * 初始化地图，中心为北京
         */
        function initialize() {
          var mapOptions = {
            center: new google.maps.LatLng(39.92, 116.46),
            zoom: 4,
            mapTypeId: google.maps.MapTypeId.ROADMAP
          };
          element.css({
            height: $window.screen.height + 'px'
          });
          map = new google.maps.Map(element[0], mapOptions);

          getLogin();
        }


        /**
         * 设备上先后再地图上显示出来
         * @param latitude    纬度
         * @param longitude   经度
         * @param information 显示的信息
         * @param status      状态
         */
        function addMarker(latitude, longitude, title, information) {
          if (markersArray) {
            for (var i in markersArray) {
              if (markersArray[i].getTitle() == title) {
                markersArray[i].setIcon(image);
                return;
              }
            }
          }
          var marker = new google.maps.Marker({
            position: new google.maps.LatLng(latitude, longitude),
            title: title,
            icon: image,
            map: map
          });
          var infowindow = new google.maps.InfoWindow({
            content: information
          });

          //当标签移到标记上时，显示标记里的信息
          google.maps.event.addListener(marker, 'mouseover', function () {
            infowindow.open(map, marker);
          });

          markersArray.push(marker);
        }

        /**
         * 设备下线后更改地图上标记的图标
         * @param latitude    经度
         * @param longitude   纬度
         * @param information 显示的信息
         * @param status      状态
         */
        function changeMarker(title) {
          if (markersArray) {
            for (var i in markersArray) {

              if (markersArray[i].getTitle() == title) {
                markersArray[i].setIcon();
              }
            }
          }
        };

        /**
         * 监听设备上线、下线
         */
        scope.$watch('mapInfo', function (newValue, oldValue) {
          if (newValue !== oldValue && newValue !== "[]") {
            if (newValue.status == "login") {
              addMarker(newValue.coordinates[1], newValue.coordinates[0], newValue.deviceId, newValue.owner);
            } else if (newValue.status == "logout") {
              changeMarker(newValue.deviceId);
            }
          }
        });


        /**
         * 获取所有的在线设备
         */
        scope.$watch('mapInfos', function (newValue, oldValue) {
          if (newValue !== oldValue && newValue.length != 0) {
            for (var i in newValue) {
              addMarker(newValue[i]._source.coordinates[1], newValue[i]._source.coordinates[0], newValue[i]._source.deviceId, newValue[i]._source.owner)
            }
          }
        });
        initialize();
      }

      return{
        restrict: 'A',
        link: link,
        replace: true
      }
    }]);

'use strict';

/* Filters */

angular.module('drive.filters', [])
//.filter('',  function(value) {
//
// });

'use strict';

/* Services */



angular.module('drive.services', [])
  .factory('bus', ['$window','Constant',function($window,Constant){
      var  options = {debug:true, forkLocal:true};
      var serverUrl = Constant.serverUrl;
      var bus = new $window.realtime.channel.ReconnectBus(serverUrl, options);
      return function(){
          return bus;
      }
  }])
  .factory('HeadData', function(){
      var DashBoard = [{"type": '/chart/attachmentChart', "name": '文档统计'},{"type": '/chart/deviceChart', "name": '设备统计'}];
      var SystemManage = [{"type": '/datagrid/attachment', "name": '文档播放统计'},{"type": '/datagrid/attachmentActivity', "name": '文档操作管理'},{"type": '/datagrid/device', "name": '设备管理'},{"type": '/datagrid/deviceActivity', "name": '设备操作管理'},{"type": '/datagrid/devicestatus', "name": '设备在线显示'}];
      var UserManage = [{"type": '/datagrid/userInfo', "name": '添加用户'},{"type": '/datagrid/userList', "name": '查看用户'}];
      var ProfileManage = [{"type": 'profile1', "name": '个人中心1'},{"type": 'profile2', "name": '个人中心2'}];
      var li1 = {"menu": DashBoard, "name": '统计报表', "className_":'active'};
      var li2 = {"menu": SystemManage, "name": '系统管理', "className_":''};
      var li3 = {"menu": UserManage, "name": '用户管理', "className_":''};
      var li4 = {"menu": ProfileManage, "name": '个人中心', "className_":''};

      var headList = [];
      headList.push(li1);
      headList.push(li2);
      headList.push(li3);
      headList.push(li4);
      return headList;
  })
  .factory('millionFormat',function(){
        return function(value){
            var theTime = parseInt(value);// 秒
            var theTime1 = 0;// 分
            var theTime2 = 0;// 小时
            var theDay = 0;//天
            if(theTime > 60) {
                theTime1 = parseInt(theTime/60);
                theTime = parseInt(theTime%60);
                if(theTime1 > 60) {
                    theTime2 = parseInt(theTime1/60);
                    theTime1 = parseInt(theTime1%60);
                    if(theTime2 > 24){
                        theDay = parseInt(theTime2/24);
                        theTime2 = parseInt(theTime1%24);
                    }
                }
            }
            var result = ""+parseInt(theTime)+"秒";
            if(theTime1 > 0) {
                result = ""+parseInt(theTime1)+"分"+result;
            }
            if(theTime2 > 0) {
                result = ""+parseInt(theTime2)+"小时"+result;
            }
            if(theDay > 0) {
                result = ""+parseInt(theDay)+"天"+result;
            }
            return result;
        };
    })
  .factory('Constant', function(){
      return {
          host:'test.goodow.com',
          search_channel:'realtime/search',
          serverUrl:"http://test.goodow.com:1986/channel"
      }
  })
    .factory('PaginationService',function(){
        //两个字段分页
       var paginationQuery2 = {
           'query':{
               "bool": {
                   "should": [
                       {
                           "bool": {
                               "must": [
                                   {
                                       "term": {
//                                           "open": "2014-11-15T14:12:12"
                                       }
                                   },
                                   {
                                       "range": {
//                                           "_uid": {
//                                               "gt": "attachmentActivity#D19cnQA2Q-OHkspewvHpEg"
//                                           }
                                       }
                                   }
                               ]
                           }
                       },
                       {
                           "range": {
//                               "open": {
//                                   "lt": "2014-11-15T14:12:12"
//                               }
                           }
                       }
                   ],
                   "minimum_should_match": 1
               }
           },
           "size": 5,
           "sort": [
//               {
//                   "open": "desc"
//               },
//               "_uid"
           ]
       };
        //1个字段分页
        var paginationQuery1 = {
            'query':{
                'bool':{
                    'must':[{
                        "range": {
//                     "_uid": {
//                     "gt": "attachmentActivity#D19cnQA2Q-OHkspewvHpEg"
                         }
                    }
//        ,{
//            'multi_match':{
//                query:queryString,
//                field:[]
//            }
//        }
        ]
    }

            },
            "size": 5,
            "sort": [
//               "_uid"
            ]
        };
        return {
//            sort:function(arr){
//                for(var i=0;i<arr.length;i++){
//                    pagnationQueryDSL.sort[i] = arr[i];
//                }
//                return this;
//            },
//            size:function(num){
//                pagnationQueryDSL.size = num;
//                return this;
//            },
//            setFieldAndValue:function(){
//                var arg1 = arguments[0];
//                for(var prop in arg1){
//                    this.must()
//                }
//            },
//            must:function(arr){
//                for(var i=0;i<arr.length;i++){
//                    pagnationQueryDSL['query']['bool']['should'][0]['bool']['must'][i] = arr[i];
//                }
//                return this;
//            },
//            should:function(obj){
//                pagnationQueryDSL['query']['bool']['should'][1] = obj;
//                return this;
//            },
//            value:function(){
//                return pagnationQueryDSL;
//            }

            //field2与size参数是可选参数
            //size如果不传就是默认值5代表每页返回的数量
            //如果没有值可以传,就传null,
            //true与false是排序,true是升序,false是降序
            //buildQuery({_uid:2532342324},null,null,true)
            buildQuery:function(field1,field2,size,bool){
                if(size){
                    paginationQuery1.size = size;
                    paginationQuery2.size = size;
                }
                if(field2){
                   if(bool){
                       //验证 正确
                       for(var prop  in field1){
                           paginationQuery2['query']['bool']['should'][0]['bool']['must'][0]['term'][prop] = field1[prop];
                           paginationQuery2['sort'][0] = prop;
                           var obj1 = {};
                           obj1['gt'] =  field1[prop];
                           paginationQuery2['query']['bool']['should'][1]['range'][prop] = obj1;
                           for(var prop1 in field2){
                               paginationQuery2['sort'][1] = prop1;
                               var obj = {};
                               obj['gt'] = field2[prop1];
                               paginationQuery2['query']['bool']['should'][0]['bool']['must'][1]['range'][prop1] = obj;
                           }
                       }
                   }else{
                       //已验证 正确
                      for(var prop  in field1) {
                          paginationQuery2['query']['bool']['should'][0]['bool']['must'][0]['term'][prop] = field1[prop];
                          var obj = {};
                          obj[prop] = 'desc';
                          paginationQuery2['sort'][0] = obj;
                          var obj2 = {};
                          obj2['lt'] = field1[prop];
                          paginationQuery2['query']['bool']['should'][1]['range'][prop] = obj2;
                          for (var prop1 in field2) {
                              paginationQuery2['sort'][1] = prop1;
                              var obj1 = {};
                              obj1['gt'] = field2[prop1];
                              paginationQuery2['query']['bool']['should'][0]['bool']['must'][1]['range'][prop1] = obj1;
                          }
                      }
                   }
                    return paginationQuery2;
                }else{
                    if(bool){
                        for(var prop  in field1){
                            var obj = {};
                            obj.gt = field1[prop];
                            paginationQuery1['query']['bool']['must'][0]['range'][prop] = obj;
                            paginationQuery1['sort'][0] = prop;
                        }
                    }else{
                        for(var prop  in field1){
                            var obj = {};
                            obj.lt = field1[prop];
                            paginationQuery1['query']['bool']['must'][0]['range'][prop] = obj;
                            var obj = {};
                            obj[prop] = 'desc';
                            paginationQuery1['sort'][0] = obj;
                        }
                    }
                    return paginationQuery1;
                }
            }
//            ,buildPre:function(field1,field2,size,bool){
//                if(size){
//                    paginationQuery1.size = size;
//                    paginationQuery2.size = size;
//                }
//                if(field2){
//
//                }else{
//                    if(bool){
//                        for(var prop  in field1){
//                            var obj = {};
//                            obj.gt = field1[prop];
//                            paginationQuery1['query']['bool']['must'][0]['range'][prop] = obj;
//                            paginationQuery1['sort'][0] = prop;
//                        }
//                    }else{
//                        for(var prop  in field1){
//                            var obj = {};
//                            obj.lt = field1[prop];
//                            paginationQuery1['query']['bool']['must'][0]['range'][prop] = obj;
//                            var obj = {};
//                            obj[prop] = 'desc';
//                            paginationQuery1['sort'][0] = obj;
//                        }
//                    }
//                    return paginationQuery1;
//                }
//            },
//            buildFirst:function(){
//
//            }

        };
    })
    //How to Use
    // 注入messageService
    //messageService.toast('Test');
    .factory('messageService',['$document','$log','$timeout','$compile','$rootScope','$window',function($document,$log,$timeout,$compile,$rootScope,$window){
      return {
        //content是要显示的内容
        toast:function(content){
          var messagePanel = angular.element('<toast>'+content+'</toast>');
          $document.find('body').append(messagePanel);
          var scope = $rootScope.$new(false);
          scope.toastTitle = '提示';
          $compile(messagePanel)(scope);

        }
      }
    }])
    .factory('DateService',function(){
      var now = new Date(); //当前日期
      var nowDayOfWeek = now.getDay(); //今天本周的第几天
      var nowDay = now.getDate(); //当前日
      var nowMonth = now.getMonth(); //当前月
      var nowYear = now.getYear(); //当前年
      nowYear += (nowYear < 2000) ? 1900 : 0; //

      var lastMonthDate = new Date(); //上月日期
      lastMonthDate.setDate(1);
      lastMonthDate.setMonth(lastMonthDate.getMonth()-1);
      var lastYear = lastMonthDate.getYear();
      var lastMonth = lastMonthDate.getMonth();
      //格局化日期：yyyy-MM-dd
      var formatDate = function(date) {
        var myyear = date.getFullYear();
        var mymonth = date.getMonth()+1;
        var myweekday = date.getDate();

        if(mymonth < 10){
          mymonth = "0" + mymonth;
        }
        if(myweekday < 10){
          myweekday = "0" + myweekday;
        }
        return (myyear + "-" + mymonth + "-" + myweekday);
      }

      return {
        //获取当前第几周
        getWeekNo: function getWeekNo() {
          var totalDays = 0;
          var now = new Date();
          var years=now.getYear();
          if (years < 1000)years+=1900;
          var days = new Array(12);	// Array to hold the total days in a month
          days[0] = 31;
          days[2] = 31;
          days[3] = 30;
          days[4] = 31;
          days[5] = 30;
          days[6] = 31;
          days[7] = 31;
          days[8] = 30;
          days[9] = 31;
          days[10] = 30;
          days[11] = 31;
          //  Check to see if this is a leap year
          if (Math.round(now.getYear()/4) == now.getYear()/4) {
            days[1] = 29
          }else {
            days[1] = 28
          }
          //  If this is January no need for any fancy calculation otherwise figure out the
          //  total number of days to date and then determine what week
          if (now.getMonth() == 0) {
            totalDays = totalDays + now.getDate();
          }else{
            var curMonth = now.getMonth();
            for (var count = 1; count <= curMonth; count++) {
              totalDays = totalDays + days[count - 1];
            }
            totalDays = totalDays + now.getDate();
          }
          var week = Math.round(totalDays/7);
          return week;
        },

        //格局化日期：MM.dd
        getFormatDate:function getFormatDate(date) {
          var myyear = date.getFullYear();
          var mymonth = date.getMonth()+1;
          var myweekday = date.getDate();

          if(mymonth < 10){
            mymonth = "0" + mymonth;
          }
          if(myweekday < 10){
            myweekday = "0" + myweekday;
          }
          return (mymonth + "." + myweekday);
        },

        //获得某月的天数
        getMonthDays:function getMonthDays(myMonth){
          var monthStartDate = new Date(nowYear, myMonth, 1);
          var monthEndDate = new Date(nowYear, myMonth + 1, 1);
          var days = (monthEndDate - monthStartDate)/(1000 * 60 * 60 * 24);
          return days;
        },

        //获得本季度的开端月份
        getQuarterStartMonth:function getQuarterStartMonth(){
          var quarterStartMonth = 0;
          if(nowMonth<3){
            quarterStartMonth = 0;
          }
          if(2<nowMonth && nowMonth<6){
            quarterStartMonth = 3;
          }
          if(5<nowMonth && nowMonth<9){
            quarterStartMonth = 6;
          }
          if(nowMonth>8){
            quarterStartMonth = 9;
          }
          return quarterStartMonth;
        },

        //获得本周的开端日期
        getWeekStartDate:function getWeekStartDate() {
          var curr = new Date;
          return formatDate(new Date(curr.setDate(curr.getDate() - curr.getDay()+1)));
        },

        //获得本周的停止日期
        getWeekEndDate:function getWeekEndDate() {
          var curr = new Date;
          return formatDate(new Date(curr.setDate(curr.getDate() - curr.getDay()+7)));;
        },

        //获取第几周日期
        getWeekDate:function getWeekDate(day) {
          var curr = new Date;
          return formatDate(new Date(curr.setDate(curr.getDate() - curr.getDay()+day)));;
        },

        //获得本月的开端日期
        getMonthStartDate:function getMonthStartDate(){
          var monthStartDate = new Date(nowYear, nowMonth, 1);
          return formatDate(monthStartDate);
        },

        //获得本月的停止日期
        getMonthEndDate:function getMonthEndDate(){
          var monthEndDate = new Date(nowYear, nowMonth, getMonthDays(nowMonth));
          return formatDate(monthEndDate);
        },

        //获得上月开端时候
        getLastMonthStartDate:function getLastMonthStartDate(){
          var lastMonthStartDate = new Date(nowYear, lastMonth, 1);
          return formatDate(lastMonthStartDate);
        },

        //获得上月停止时候
        getLastMonthEndDate:function getLastMonthEndDate(){
          var lastMonthEndDate = new Date(nowYear, lastMonth, getMonthDays(lastMonth));
          return formatDate(lastMonthEndDate);
        },

        //获得本季度的开端日期
        getQuarterStartDate:function getQuarterStartDate(){

          var quarterStartDate = new Date(nowYear, getQuarterStartMonth(), 1);
          return formatDate(quarterStartDate);
        },

        //或的本季度的停止日期
        getQuarterEndDate:function getQuarterEndDate(){
          var quarterEndMonth = getQuarterStartMonth() + 2;
          var quarterStartDate = new Date(nowYear, quarterEndMonth, getMonthDays(quarterEndMonth));
          return formatDate(quarterStartDate);
        }
      };
    })
