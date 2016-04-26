function staticEmployeeViewModule() {
	var thisInstance = this;
    thisInstance.constants = {
        colors: {
	        blue: '#508BC9',
	        green: '#00A79D',
	        lightBlue: '#C1D4E9'
        },
        graphSelector: 'team-pq-graph'
    };


    function initializeCircularProgess() {
        $('#pq-progess1').attr('data-progress', '95');
        $('#pq-progess2').attr('data-progress', '75');
        $('#pq-progess3').attr('data-progress', '61');
        $('#pq-progess4').attr('data-progress', '35');
        $('#pq-progess5').attr('data-progress', '24');
        $('#pq-progess6').attr('data-progress', '4');
    }
    this.init = function() {
    	initializeCircularProgess();
    	var selector = thisInstance.constants;
		var TeamGraph = new Highcharts.Chart({
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
	            text: '',
	        },
	        subtitle: {
	            text: '',
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
	            min: 0,
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
	            name: 'Your PQ',
	            type: 'areaspline',
	            data: [
	                [Date.UTC(2015, 10, 21), 320],
	                [Date.UTC(2015, 10, 22), 420],
	                [Date.UTC(2015, 10, 23), 220],
	                [Date.UTC(2015, 10, 24), 520],
	                [Date.UTC(2015, 10, 25), 320],
	                [Date.UTC(2015, 10, 26), 450],
	                [Date.UTC(2015, 10, 27), 520],
	                [Date.UTC(2015, 10, 28), 720],
	                [Date.UTC(2015, 10, 29), 420],
	                [Date.UTC(2015, 10, 30), 470],
	                [Date.UTC(2015, 11, 1), 340],
	                [Date.UTC(2015, 11, 2), 860],
	                [Date.UTC(2015, 11, 3), 620],
	                [Date.UTC(2015, 11, 4), 720],
	                [Date.UTC(2015, 11, 5), 920],
	                [Date.UTC(2015, 11, 6), 610],
	                [Date.UTC(2015, 11, 7), 320],
	                [Date.UTC(2015, 11, 9), 720],
	                [Date.UTC(2015, 11, 10), 820],
	                [Date.UTC(2015, 11, 11), 240],
	                [Date.UTC(2015, 11, 12), 760],
	                [Date.UTC(2015, 11, 13), 520],
	                [Date.UTC(2015, 11, 14), 820],
	                [Date.UTC(2015, 11, 15), 1020],
	                [Date.UTC(2015, 11, 16), 820],
	                [Date.UTC(2015, 11, 17), 560],
	                [Date.UTC(2015, 11, 19), 1120],
	                [Date.UTC(2015, 11, 20), 320],
	                [Date.UTC(2015, 11, 21), 520]
	            ],
	            color: selector.colors.blue,
	            fillOpacity: 0.15,
	            zIndex: 3
	        }, {
	            name: 'Team PQ',
	            data: [
	                [Date.UTC(2015, 10, 21), 620],
	                [Date.UTC(2015, 10, 22), 820],
	                [Date.UTC(2015, 10, 23), 520],
	                [Date.UTC(2015, 10, 24), 220],
	                [Date.UTC(2015, 10, 25), 720],
	                [Date.UTC(2015, 10, 26), 920],
	                [Date.UTC(2015, 10, 27), 620],
	                [Date.UTC(2015, 10, 28), 1120],
	                [Date.UTC(2015, 10, 29), 720],
	                [Date.UTC(2015, 10, 30), 220],
	                [Date.UTC(2015, 11, 1), 820],
	                [Date.UTC(2015, 11, 2), 920],
	                [Date.UTC(2015, 11, 3), 360],
	                [Date.UTC(2015, 11, 4), 560],
	                [Date.UTC(2015, 11, 5), 120],
	                [Date.UTC(2015, 11, 6), 690],
	                [Date.UTC(2015, 11, 7), 920],
	                [Date.UTC(2015, 11, 9), 540],
	                [Date.UTC(2015, 11, 10), 940],
	                [Date.UTC(2015, 11, 11), 1020],
	                [Date.UTC(2015, 11, 12), 780],
	                [Date.UTC(2015, 11, 13), 160],
	                [Date.UTC(2015, 11, 14), 660],
	                [Date.UTC(2015, 11, 15), 320],
	                [Date.UTC(2015, 11, 16), 870],
	                [Date.UTC(2015, 11, 17), 430],
	                [Date.UTC(2015, 11, 19), 780],
	                [Date.UTC(2015, 11, 20), 940],
	                [Date.UTC(2015, 11, 21), 740]
	            ],
	            color: selector.colors.green,
	            zIndex: 2
	        }, {
	            name: '',
	            type: 'areaspline',
	            lineWidth: 0,
	            data: [
	                [Date.UTC(2015, 10, 21), null],
	                [Date.UTC(2015, 10, 22), null],
	                [Date.UTC(2015, 10, 23), 220],
	                [Date.UTC(2015, 10, 24), 520],
	                [Date.UTC(2015, 10, 25), 320],
	                [Date.UTC(2015, 10, 26), 450],
	                [Date.UTC(2015, 10, 27), null],
	                [Date.UTC(2015, 10, 28), 720],
	                [Date.UTC(2015, 10, 29), 420],
	                [Date.UTC(2015, 10, 30), null],
	                [Date.UTC(2015, 11, 1), 340],
	                [Date.UTC(2015, 11, 2), 860],
	                [Date.UTC(2015, 11, 3), null],
	                [Date.UTC(2015, 11, 4), null],
	                [Date.UTC(2015, 11, 5), 920],
	                [Date.UTC(2015, 11, 6), 610],
	                [Date.UTC(2015, 11, 7), null],
	                [Date.UTC(2015, 11, 9), 720],
	                [Date.UTC(2015, 11, 10), 820],
	                [Date.UTC(2015, 11, 11), null],
	                [Date.UTC(2015, 11, 12), 760],
	                [Date.UTC(2015, 11, 13), 520],
	                [Date.UTC(2015, 11, 14), null],
	                [Date.UTC(2015, 11, 15), 1020],
	                [Date.UTC(2015, 11, 16), 820],
	                [Date.UTC(2015, 11, 17), null],
	                [Date.UTC(2015, 11, 19), null],
	                [Date.UTC(2015, 11, 20), null]
	                [Date.UTC(2015, 11, 20), 520]
	            ],
	            color: selector.colors.lightBlue,
	            marker: {
	            	states: {
	            		hover: {
	            			enabled: false
	            		}
	            	}
	            }
	        }]
	    });
    }
}
