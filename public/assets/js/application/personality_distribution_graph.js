function PersonalityDistributionGraph() {
    // Array for keeping track of open tooltips
    var thisInstance = this;
    thisInstance.personalitySelected = null;
    thisInstance.personalitySelectedByUser = null;
    thisInstance.graphData = null;
    var colors = {
        connector: '#FF6B35',
        original: '#ECA900',
        dreamer: '#118C89',
        doer: '#D84154',
        advisor: '#754299',
        organizer: '#4B91DD'
    };
    var slot = 1;

    // function to check if series belongs to selected personality filter
    function isSeriesSelectedByDefault(series){
        return series.name.toLowerCase() == (thisInstance.personalitySelected || thisInstance.graphData[0].name).toLowerCase();
    }

    // function to check series was activated by user by clicking
    function isSeriesSelectedByUser(series){
        return typeof thisInstance.personalitySelectedByUser === "string" && series.name.toLowerCase() == thisInstance.personalitySelectedByUser.toLowerCase();
    }

    // function to check if series has tool tip shown
    function isSeriesSelected(series){
        return isSeriesSelectedByDefault(series) || isSeriesSelectedByUser(series);
    }

    // return point in graph where to display tool tip
    function seriesMaxPoint(series){
        var arrayCount = thisInstance.personalityGraph.series.length;
        return series.points[parseInt(series.points.length * (series.index + slot + 1) / (arrayCount + 2 * slot + 1))];
    }

    // generates graph for user count for personality
    function generateGraphData(personalityCountList, totalCount) {
        var pointsCount = 4500,   // 500 * 9
            gap = 500;

        // caching optimization to speed up graph data generation
        generateGraphData._dataCache = generateGraphData._dataCache || null;
        generateGraphData._dataCacheKey = generateGraphData._dataCacheKey || null;
        var _dataCacheKey = personalityCountList.reduce(function(key, personalityData){
            return key + personalityData.name + personalityData.count;
        }, '') + totalCount;

        // verify if count for personality is not updated and data cache exists
        if(generateGraphData._dataCacheKey && generateGraphData._dataCacheKey === _dataCacheKey){
            return generateGraphData._dataCache; // returns cached graph data
        }
        else {
            var graphData = personalityCountList.map(
                function (personalityData, arrayIndex) {
                    var countPercent = (totalCount > 0 ? (personalityData.count / totalCount * 100) : 0),
                        dataArray = (new Array(pointsCount));

                    for (var dataIndex = 0; dataIndex < dataArray.length; dataIndex++) {
                        dataArray[dataIndex] = (countPercent * Math.exp(-Math.pow(dataIndex - gap * (arrayIndex + slot + 1), 2) / 250000));
                    }
                    personalityData.data = dataArray;
                    personalityData.percent = countPercent;
                    return personalityData;
                }
            );
        generateGraphData._dataCache = graphData;
        generateGraphData._dataCacheKey = _dataCacheKey;
        return graphData;
        }
    }

    // tool tip for given series
    function createTooltip(series, event) {
        var seriesId = 'id-series-' + series.index;
        var maxPoint = seriesMaxPoint(series);
        $('#' + seriesId).remove();
        var chart = series.chart,
            pointX = maxPoint.plotX + chart.plotLeft,
            pointY = maxPoint.plotY + chart.plotTop,
            $tooltip = $(".js-tooltip").clone();
        $tooltip.removeClass('js-tooltip');
        if(isSeriesSelectedByDefault(series)){
            $tooltip.removeClass('hidden');
        }
        var toolTipText = thisInstance.graphData[series.index].name + ": " + Math.round(thisInstance.graphData[series.index].percent) + '%',
            $toolTipContent = $tooltip.find('p');
        $toolTipContent.text(toolTipText);
        $tooltip.css({
            'top': pointY, // set pixels from top
            'left': pointX - toolTipText.length * 4.2 / 2, // set pixels from left after adjustment
            'color': colors[series.name.toLowerCase()]
        });
        $tooltip.attr('id', seriesId);
        $('#id-graph-container').append($tooltip);
    }

    // show tool tip for series
    function showTooltip(series, event) {
        var seriesId = 'id-series-' + series.index;
        if (!isSeriesSelected(series)) {
            $('#' + seriesId).removeClass('hidden').addClass('').data('show-event', event);
        }
        else {
            $('#' + seriesId).removeClass('hidden').data('show-event', 'click');
        }
    }

    // hide too tip for series
    function hideTooltip(series, event) {
        var seriesId = 'id-series-' + series.index,
            showEvent = $('#' + seriesId).data('show-event');
        if (showEvent === event &&
            !isSeriesSelectedByDefault(series)) {
            $('#' + seriesId).addClass('hidden');
        }
    }

    // initialized graph after first page load
    function initializeGraph(companyName) {
        return (new Highcharts.Chart({
            chart: {
                renderTo: 'id-graph-container',
                backgroundColor: 'transparent',
                marginBottom: -1,
                style: {
                    fontFamily: 'Klavika-Regular'
                },
                marginTop: 10,
                marginLeft: 10,
                marginRight: 10,
            },
            credits: {
                enabled: false
            },
            legend: {
                enabled: false
            },
            title: {
                align: 'right',
                text: companyName,
                style: {
                    color: '#ffffff',
                    fontSize: '40px'
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
                        afterAnimate: function () {
                                createTooltip(this);
                        },
                        mouseOver: function () {
                            showTooltip(this, 'hover');
                        },
                        mouseOut: function () {
                            hideTooltip(this, 'hover');
                        },
                        click: function () {
                            var series = this,
                                seriesId = 'id-series-' + series.index,
                                showEvent = $('#' + seriesId).data('show-event');
                            if (isSeriesSelectedByUser(series)
                                && showEvent === 'click') {
                                hideTooltip(series, 'click');
                                thisInstance.personalitySelectedByUser = null;
                            }
                            else if(!isSeriesSelectedByDefault(series)){
                                showTooltip(series, 'click');
                                if(typeof thisInstance.personalitySelectedByUser === 'string') {
                                    var selectedSeries = thisInstance.personalityGraph.series.filter(
                                        function (series) {
                                            return (series.name.toLowerCase() == thisInstance.personalitySelectedByUser.toLowerCase())
                                        })[0];
                                    hideTooltip(selectedSeries, 'click');
                                }
                                thisInstance.personalitySelectedByUser = series.name;
                            }
                        }
                    }
                }
            },
            series: thisInstance.graphData.map(function (personalityData, index) {
                return {
                    name: thisInstance.graphData[index].name,
                    color: colors[thisInstance.graphData[index].name.toLowerCase()],
                    data: thisInstance.graphData[index].data
                }
            })
        }));
    }

    // update data for graph
    thisInstance.updateGraphData = function(personalityCountList, totalCount, selectedPersonality, departmentName){
        thisInstance.graphData = generateGraphData(personalityCountList, totalCount);
         thisInstance.personalityGraph.series.forEach(function(seriesItem, index){
             seriesItem.update({
                 name: thisInstance.graphData[index].name,
                 color: colors[thisInstance.graphData[index].name.toLowerCase()],
                 data: thisInstance.graphData[index].data
             })
         });
        for(var seriesIndex in thisInstance.personalityGraph.series){
            createTooltip(thisInstance.personalityGraph.series[seriesIndex]);
        }
        thisInstance.updateGraphPersonality(selectedPersonality);
    };

    // update background and graph color on the basis of personality filter selected
    thisInstance.updateGraphPersonality = function(selectedPersonality){
        thisInstance.personalitySelected = selectedPersonality;
        if (thisInstance.personalityGraph && selectedPersonality) {
            var otherGraph = thisInstance.personalityGraph.series.filter(function (item) {
                if (item.name.toLowerCase() === selectedPersonality.toLowerCase()) {
                    item.update({
                        color: '#ffffff'
                    });
                    showTooltip(item, 'click');
                    return false
                }
                else {
                    hideTooltip(item, 'click');
                    return true;
                }
            });

            var opacity = otherGraph.length;
            for (var i = 0; i < otherGraph.length; i++) {
                otherGraph[i].update({
                    color: 'rgba(0, 0, 0, ' + ((opacity--) / 10) + ')'
                });
            }
        }
        var $graphWrapper = $(".js_graph_container");
        for (var personalityKey in thisInstance.personalityGraphClassMap) {
            $graphWrapper.removeClass(thisInstance.personalityGraphClassMap[personalityKey]);
        }
        if (typeof selectedPersonality === 'string' && selectedPersonality.trim() != '') {
            $graphWrapper.addClass(thisInstance.personalityGraphClassMap[selectedPersonality.toLowerCase()]);
        }
    };

    // generate graph data and initialize graph
    thisInstance.init = function (options) {
        thisInstance.graphData = generateGraphData(options.personalityCountList, options.totalCount);
        thisInstance.personalityGraph = initializeGraph();
        thisInstance.personalityGraphClassMap = options.personalityGraphClassMap;
        thisInstance.updateGraphPersonality(options.personalitySelected);
        for(var seriesIndex in thisInstance.personalityGraph.series){
            createTooltip(thisInstance.personalityGraph.series[seriesIndex]);
        }
    };
}
