//// module to draw compare graph between department and company or department and company
function SupervisorCompareGraph() {
    var thisInstance = this;
    thisInstance.selectors = {
        graphSelector: 'team-pq-graph',
        closeBtn: '.js-close-btn',
        helpSection: '.js-help-section',
        graphRangeFilter: '.js_graph_range_filter'
    };

    thisInstance.constants = {
        colors: {
            blue: '#508BC9',
            green: '#00A79D',
            lightBlue: '#C1D4E9'
        }
    };

    this.init = function (options) {
        thisInstance.graphData = {
            departmentAnalytics: options.departmentAnalyticsGraphData,
            companyAnalytics: options.companyAnalyticsGraphData
        };
        thisInstance.filteredGraphData = applyRangeFilterAndGetData(30);
        initializeGraph(thisInstance.filteredGraphData.graphData, thisInstance.filteredGraphData.minValue);
        graphFiltersBindings();
    };

    function initializeGraph(graphData, ymin) {
        var selector = thisInstance.selectors,
            constants = thisInstance.constants;
        thisInstance.supervisorComparisonGraph = new Highcharts.Chart({

            chart: {
                renderTo: selector.graphSelector,
                backgroundColor: 'transparent',
                marginBottom: 70,
                type: 'spline',
                style: {
                    fontFamily: 'Klavika-Regular'
                }
            },
            credits: {
                enabled: false
            },
            legend: {
                enabled: false
            },
            title: {
                text: ''
            },
            subtitle: {
                text: ''
            },
            xAxis: {
                type: 'datetime',
                tickInterval: 7 * 24 * 3600 * 1000,
                tickLength: 0,
                labels: {
                    format: "{value:%b %d}",
                    style: {
                        fontFamily: 'Klavika-Regular',
                        fontSize: '15px',
                        color: '#000',
                        opacity: 0.8
                    }
                }
            },
            yAxis: {
                title: {
                    text: ''
                },
                startOnTick: false,
                min: (typeof ymin === "number") ? ymin * 0.9 : 0,
                minPadding:0,
                maxPadding: 0,
                labels: {
                    style: {
                        fontFamily: 'Klavika-Regular',
                        fontSize: '15px',
                        color: '#000',
                        opacity: 0.6
                    }
                }
            },
            tooltip: {
                formatter: function () {
                    var points = this.points;
                    if (points.length >= 2) {
                        return '<span class="tooltip-comp-value" style="color:' + points[0].color + ';">' + Math.round(points[0].y) + '</span>vs<span class="tooltip-comp-value" style="color:' + points[1].color + ';">' + Math.round(points[1].y) + '</span><br><span class="tooltip-date">'
                            + Highcharts.dateFormat('%B %d,%Y', new Date(points[0].x)) + '</span>';
                    }
                    else {
                        return false;
                    }
                },
                style: {
                    fontFamily: 'Klavika-Medium',
                    fontSize: '18px',
                    color: '#2A2C30'
                },
                shared: true,
                useHTML: true,
                borderRadius: 12,
                borderWidth: 1,
                backgroundColor: '#FFFFFF',
                borderColor: '#A7A9AB'
            },
            plotOptions: {
                spline: {
                    lineWidth: 6,
                    marker: {
                        enabled: false,
                        symbol: 'circle'
                    }
                },
                areaspline: {
                    lineWidth: 6,
                    marker: {
                        enabled: false,
                        symbol: 'circle'
                    }
                }
            },
            series: [{
                id: "departmentAnalytics",
                name: 'Team PQ',
                type: 'areaspline',
                data: graphData.departmentAnalytics,
                color: constants.colors.blue,
                fillOpacity: 0.15,
                zIndex: 3
            },
             {
                id: "companyAnalytics",
                name: 'Company PQ',
                data: graphData.companyAnalytics,
                color: constants.colors.green,
                zIndex: 2
            }]
        });
    }

        // function for binding graph range filters
    function graphFiltersBindings(){
        var selector = thisInstance.selectors;
        $(selector.graphRangeFilter).click(function(){
            var $this = $(this),
                filterDays = $this.data('days');
                thisInstance.filteredGraphData = applyRangeFilterAndGetData(parseInt(filterDays));
            updateGraphData(thisInstance.filteredGraphData.graphData, thisInstance.filteredGraphData.minValue);
            $(selector.graphRangeFilter).removeClass('active');
            $this.addClass('active');
        });
    }

    // function to update data of all series using given data dict
    function updateGraphData(graphData, ymin){
        thisInstance.supervisorComparisonGraph.series.forEach(function(series){
            var graphId = series.options.id;
            if(graphData[graphId]) {
                series.update({
                    data: graphData[graphId]
                });
            }
        });

        // update min value of y axis
        thisInstance.supervisorComparisonGraph.yAxis[0].update({
            min: (typeof ymin === "number") ? ymin * 0.9 : 0
        });
    }

    // function to return data after applying range filters
    function applyRangeFilterAndGetData(days, graphData){
        var minValue = Number.MAX_VALUE;
        graphData = $.extend(true, {}, graphData || thisInstance.graphData);
        for(var index in graphData){
            if(Array.isArray(graphData[index])) {
                graphData[index] = (graphData[index] || []).slice(90 - parseInt(days));
            }

            // finds min value of the series
            for(var innerIndex in graphData[index]) {
                var value = graphData[index][innerIndex][1];
                minValue = (minValue < value) ? minValue : value;
            }
        }

        return {graphData: graphData, minValue: minValue};
    }
}
