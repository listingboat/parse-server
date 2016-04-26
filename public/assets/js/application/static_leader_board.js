function leaderBoardGraph() {
    // Array for keeping track of open tooltips
    var openTooltips = [];
    var colors = {
        connector:  '#FF6B35',
        original:   '#ECA900',
        dreamer:    '#118C89',
        doer:       '#D84154',
        advisor:    '#754299',
        organizer:  '#4B91DD'
    };

    function createTooltip(series, percent, event) {
        var seriesId = 'id-series-'+series.index;
        percent = percent || 0;
        var maxPoint = series.points.filter(function(item) {
            if(item.y === series.dataMax) {
                return item;
            }
        });
        var chart = series.chart;
        var pointX = maxPoint[0].plotX + chart.plotLeft;
        var pointY = maxPoint[0].plotY + chart.plotTop;
        var $tooltip = $(".js-tooltip").clone();
        $tooltip.removeClass('js-tooltip');
        $tooltip.find('p').text(percent+'%');
        $tooltip.css({
            'top': pointY,
            'left': pointX,
            'color': colors[series.name.toLowerCase()]
        });
        $tooltip.attr('id', seriesId);
        $('#id-graph-container').append($tooltip);
    }

    function showTooltip(series, event) {
        var seriesId = 'id-series-'+series.index;
        if(openTooltips.indexOf(seriesId) < 0) {
            $('#'+seriesId).removeClass('hidden').data('show-event', event);
            openTooltips.push(seriesId);
        }
        else {
            $('#'+seriesId).data('show-event', 'click');
        }
    }

    function hideTooltip(series, event) {
        var seriesId = 'id-series-'+series.index;
        var showEvent = $('#'+seriesId).data('show-event');
        if(showEvent === event && openTooltips.indexOf(seriesId) >= 0) {
            $('#'+seriesId).addClass('hidden');
            popElemArray(openTooltips, seriesId);
        }
    }

    function popElemArray(arr, seriesId) {
        var i = arr.indexOf(seriesId);
        arr[i] = arr[arr.length-1];
        arr.pop();
    }
    
    this.init = function(graphPersonality) {
        var personalityGraph = new Highcharts.Chart({
            chart: {
                renderTo: 'id-graph-container',
                backgroundColor: 'transparent',
                marginBottom: 0,
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
                align: 'right',
                text: '',
                style: {
                    color: '#ffffff',
                    fontSize: '40px'
                }
            },
            subtitle: {
                align: 'right',
                text: '',
                style: {
                    fontFamily: 'Klavika-Light',
                    fontSize: '18px',
                    color: '#ffffff'
                }
            },
            xAxis: {
                visible: false,
                gridLineWidth: 0
            },
            yAxis: {
                visible: false,
                gridLineWidth: 0
            },
            tooltip: {
                enabled: false
            },
            plotOptions: {
                series: {
                    lineWidth: 3,
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                enabled: false
                            }
                        }
                    },
                    events: {
                        afterAnimate: function() {
                            createTooltip(this, 55);
                        },
                        mouseOver: function() {
                            showTooltip(this, 'hover');
                        },
                        mouseOut: function() {
                            hideTooltip(this, 'hover');
                        },
                        click: function() {
                            var series = this;
                            var seriesId = 'id-series-'+series.index;
                            var showEvent = $('#'+seriesId).data('show-event');
                            if(openTooltips.indexOf(seriesId) >= 0 && showEvent === 'click') {
                                hideTooltip(series, 'click')
                            }
                            else {
                                showTooltip(series, 'click');
                            }
                        }
                    }
                }
            },
            series: [{
                name: 'Advisor',
                color: colors.advisor,
                data: [0, 10, 20, 30, 40, 30, 20, 10, 0]
            }, {
                name: 'Original',
                color: colors.original,
                data: [50, 60, 70, 80, 90, 80, 70, 60, 50]
            }, {
                name: 'Dreamer',
                color: colors.dreamer,
                data: [100, 90, 80, 70, 60, 70, 80, 90, 100]
            }, {
                name: 'Doer',
                color: colors.doer,
                data: [150, 160, 170, 180, 190, 180, 170, 160, 150]
            }]
        });

        if(graphPersonality) {
            var otherGraph = personalityGraph.series.filter(function(item) {
                if(item.name === graphPersonality) {
                    item.update({
                        color: '#ffffff'
                    })
                }
                else {
                    return item;
                }
            });

            var opacity = otherGraph.length;
            for (var i = 0; i < otherGraph.length; i++) {
                otherGraph[i].update({
                    color: 'rgba(0, 0, 0, '+((opacity--)/10)+')'
                });
            };
        }
    };
}
