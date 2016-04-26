function SkillGraphModule(){
    var thisInstance = this;
    thisInstance.constants = {
        colors: {
            backgroundColor: 'rgba(255, 255, 255, 0.0)',
            backgroundGraphColor: '#aaaaaa',
            identifyStartColor: '#ffff00',
            identityEndColor: '#ff0000',
            understandStartColor: '#D31C5C',
            understandEndColor: '#80368D',
            connectStartColor: '#0C93CF',
            connectEndColor: '#00A980'
        },
        graphSelector: '#ScoreGraph'
    };

    // function to draw graph
    function drawGraph(selector, graphData){ // private function
        var seriesNameScoreMap = {
            'Identify Score': graphData.identify.score,
            'Understand Score': graphData.understand.score,
            'Connect Score': graphData.connect.score
        };

        $(selector).highcharts({ // draw high charts semi hamburger graph
            exporting: {enabled: false},
            credits: {enabled: false},
            chart: {
                backgroundColor: thisInstance.constants.colors.backgroundColor,
                plotBackgroundColor: thisInstance.constants.colors.backgroundColor,
                plotBorderWidth: 0,
                plotShadow: false
            },
            title: null,
            tooltip: {
                formatter: function() { // show tool tip on filled part of graph
                    if(this.key == 'Remaining' ){
                        return false;
                    } else {
                        return this.series.name + ": <b>" + seriesNameScoreMap[this.key] + "</b>";
                    }
                }
            },
            plotOptions: {
                pie: { // set shape of pie as semi circle
                    dataLabels: {
                        enabled: false
                    },
                    borderWidth: 0,
                    startAngle: 180,
                    endAngle: 360,
                    center: [null, null]
                }
            },
            series: [
                {  // background graph for identity
                    type: 'pie',
                    name: 'Identify Background',
                    tooltip:null,
                    innerSize: '310px', // inner radius
                    size: '321px', // outer radius
                    colors:[thisInstance.constants.colors.backgroundGraphColor], // color of graph
                    animation:false,
                    data: [
                        ['Remaining',   100.0]
                    ]
                },
                {  // background graph for understand
                    type: 'pie',
                    name: 'Understand Background',
                    tooltip:null,
                    innerSize: '260px', // inner radius
                    size: '271px', // outer radius
                    colors:[thisInstance.constants.colors.backgroundGraphColor], //color of graph
                    animation:false,
                    data: [
                        ['Remaining',   100.0] // covers full semi circle
                    ]
                },
                {  // background graph for connect
                    type: 'pie',
                    name: 'Connect Background',
                    tooltip:null,
                    innerSize: '210px', // inner radius
                    size: '221px', // outer radius
                    colors:[thisInstance.constants.colors.backgroundGraphColor],
                    animation:false,
                    data: [
                        ['Remaining',   100.0] // covers full semi circle
                    ]
                },
                {  // represent identity graph shown on basis of display percentage
                    type: 'pie',
                    name: 'Identify',
                    innerSize: '309px', // inner radius
                    size: '320px', // outer radius
                    colors:["#aaaaaa",{
                        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                        stops: [
                            [0, thisInstance.constants.colors.identifyStartColor],
                            [1, thisInstance.constants.colors.identityEndColor]
                        ]
                    }],
                    data: [
                        ['Remaining', 100 - graphData.identify.displayPercentage],
                        ['Identify Score', graphData.identify.displayPercentage]
                    ]
                },
                {  // represent understand graph shown on basis of display percentage
                    type: 'pie',
                    name: 'Understand',
                    innerSize: '259px',
                    size: '270px',
                    colors:["#aaaaaa",{
                        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                        stops: [
                            [0, thisInstance.constants.colors.understandStartColor],
                            [1, thisInstance.constants.colors.understandEndColor]
                        ]
                    }],
                    data: [
                        ['Remaining', 100 - graphData.understand.displayPercentage],
                        ['Understand Score', graphData.understand.displayPercentage]
                    ]
                },
                {  // represent connect graph shown on basis of display percentage
                    type: 'pie',
                    name: 'Connect',
                    innerSize: '209px',
                    size: '220px',
                    colors:["#aaaaaa",{
                        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                        stops: [
                            [0, thisInstance.constants.colors.connectStartColor],
                            [0, thisInstance.constants.colors.connectEndColor]

                        ]
                    }],
                    data: [
                        ['Remaining', 100 - graphData.connect.displayPercentage],
                        ['Connect Score', graphData.connect.displayPercentage]
                    ]
                }]
        });

    }
    thisInstance.init = function (graphData, graphSelector){
        var graphSelector = graphSelector || thisInstance.constants.graphSelector;
        // Highcharts to provide counter-clockwise animation for pies
        Highcharts.wrap(Highcharts.seriesTypes.pie.prototype, 'animate', function (proceed, init) {
            this.startAngleRad += Math.PI/2;
            proceed.call(this, init);
        });

        drawGraph(graphSelector, graphData);
    };
}
