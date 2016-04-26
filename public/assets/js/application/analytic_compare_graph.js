// module to draw compare graph between user and department or department and company
function AnalyticCompareGraphModule(){
    var thisInstance = this;
    thisInstance.constants = {
        colors: {
            blue: '#508BC9',
            green: '#00A79D',
            lightBlue: '#C1D4E9'
        },
        graphSelector: 'team-pq-graph',
        selector: {
            dayFilter: ".js_day_filter",
            pbrFixRequestLink: ".js_fix_pbr_request_link",
            pbrRequestSuccessModal : ".js_fix_pbr_request_success_modal",
            pbrRequestFailModal: ".js_fix_pbr_request_fail_modal"
        }
    };


    this.init = function(options) {
        var graphData = mapGraphData(options, 30); // initially get graph data for 30 days
        generateGraph(graphData.graphSeries, graphData.minValue);   // initially draw graph for 30 days
        dayFilterBinding(options);   // filter button binding
        fixPBRBindings();  // binds pbr lookup request link
    };

    // it send mail admins about fixing PBR Data for user
    function fixPBRBindings(){
        var selector = thisInstance.constants.selector;

        // when pbr lookup data link is clicked
        $(selector.pbrFixRequestLink).on("click", function(event){
            event.preventDefault();
            $.ajax({  // request to send mail to all the admin to fix user's PBR data
                method: "get",
                url: $(this).data("request_url"),
                success: function(result){
                    if(result.success){
                        $(selector.pbrRequestSuccessModal).modal('show');
                    }
                    else{
                        $(selector.pbrRequestFailModal).modal('show');
                    }
                },
                error: function(){
                    $(selector.pbrRequestFailModal).modal('show');
                }
            });
        })
    }

    // use received data to generate proper graph data for given date
    function mapGraphData (options, numberOfDays){
        var userAnalyticsGraph = [], departmentAnalyticsGraph = [], index, userTrainedGraph = [], minValue = Number.MAX_VALUE;

        for(index = options.graph1data.length - (numberOfDays); index < options.graph1data.length; index++){
            userAnalyticsGraph.push([options.graph1data[index].timeStamp, options.graph1data[index].score]);
            departmentAnalyticsGraph.push([options.graph2data[index].timeStamp, options.graph2data[index].score]);

            // find the minimum value in graph series
            minValue = (options.graph1data[index].score < options.graph2data[index].score) ?
                (options.graph1data[index].score < minValue) ? options.graph1data[index].score : minValue :
                (options.graph2data[index].score < minValue) ? options.graph2data[index].score : minValue;

            if(options.userTrainedGraph){   // generate user training day graph if required
                if(options.graph1data[index].trained){  // if user trained that day
                    userTrainedGraph.push([(options.graph1data[index].timeStamp), options.graph1data[index].score]);  // start graph form the start of day
                    // draw graph till the 16 hr of that day to keep distance between to consecutive trained days
                    // use score of the next day in that case
                    userTrainedGraph.push([(options.graph1data[index].timeStamp + 57600000), (options.graph1data[index + 1]) ? options.graph1data[index + 1].score : options.graph1data[index].score]);
                    // set score null in the next millisecond after 16th hr of that day to show a line
                    userTrainedGraph.push([(options.graph1data[index].timeStamp + 57600001), null]);
                }
                else{ // if not trained that day
                    userTrainedGraph.push([options.graph1data[index].timeStamp, null]);
                }
            }

        }
        return({graphSeries : [userAnalyticsGraph, departmentAnalyticsGraph, userTrainedGraph], minValue: minValue});
    }


    // binds the day filter buttons
    function dayFilterBinding(options){
        var selector = thisInstance.constants.selector,
            graphData;

        $(selector.dayFilter).on("click", function(){
            $(selector.dayFilter).removeClass("active");
            $(this).addClass("active");
            graphData = mapGraphData(options, $(this).data("days"));
            thisInstance.graph.series.forEach(function(seriesItem, index){
                seriesItem.update({
                    data: graphData.graphSeries[index]
                });
            });

            // updates y axis min value
            thisInstance.graph.yAxis[0].update({
                min: (typeof graphData.minValue === "number" && graphData.minValue !== Number.MAX_VALUE) ? graphData.minValue * .9 : 0
            });
        })
    }

    // generate graph
    function generateGraph(graphData, yMin){
        var selector = thisInstance.constants;
        thisInstance.graph = new Highcharts.Chart({
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
                min: typeof (yMin === "number" && yMin !== Number.MAX_VALUE) ? yMin * .9 : 0,  // set the min value of y axis
                startOnTick: false,
                minPadding: 0,
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
            tooltip:{
                formatter: function() {
                    var points = this.points;
                    if(points.length >= 2){
                        return '<span class="tooltip-comp-value" style="color:'+points[0].color+';">'+points[0].y+'</span>vs<span class="tooltip-comp-value" style="color:'+points[1].color+';">'+points[1].y+'</span><br><span class="tooltip-date">'
                        +Highcharts.dateFormat('%B %d,%Y',new Date(points[0].x))+'</span>';
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
                id: "userAnalyticsGraph",
                name: 'Your PQ',
                type: 'areaspline',
                data: graphData[0],
                color: selector.colors.blue,
                fillOpacity: 0.15,
                zIndex: 3
            }, {
                id: "departmentAnalyticsGraph",
                name: 'Team PQ',
                data: graphData[1],
                color: selector.colors.green,
                zIndex: 2
            }, {
                id: "userTrainedGraph",
                name: '',
                type: 'areaspline',
                lineWidth: 0,
                data: graphData[2],
                color: selector.colors.lightBlue,
                marker: {
                    states: {
                        hover: {
                            enabled: false
                        }
                    }
                }
            }
            ]
        });
    }
}
