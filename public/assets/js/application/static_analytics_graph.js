function analyticsGraphModule() {
	var thisInstance = this;
    thisInstance.constants = {
        colors: {
	        orange: '#FF6B35',
	        yellow: '#ECA900',
	        green: '#118C89',
	        red: '#D84154',
	        purple: '#754299',
	        blue: '#4B91DD'
        },
        graphSelector: 'team-pq-graph',
        closeBtn: '.js-close-btn',
        helpSection: '.js-help-section'
    };
    this.init = function() {

    	initResizeTextModule();
    	var selector = thisInstance.constants;
    	$(document).on('click',selector.closeBtn,function(e){
    		e.preventDefault();
    		$(this).closest(selector.helpSection).slideUp();
    	});

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
	            text: ''
	        },
	       xAxis: {
	       		type: 'datetime',
            	tickInterval: 7 * 24 * 3600 * 1000,
            	min: Date.UTC(2015, 10, 28),
            	max: Date.UTC(2015, 11, 31),
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
	        plotOptions: {
	        	spline: {
	        		pointStart: 0,
        			lineWidth: 3,
	        		marker: {
	        			enabled: false,
	        			symbol: "circle",
	        			fillColor: "#FFFFFF",
	        			states: {
	        				hover: {
	        					lineColor: null,
	        					lineWidth: 2
	        				}
	        			}
	        		},
	        		states: {
        				hover: {
        					lineWidthPlus: 2
        				}
        			}
	        	},
	        	series: {
	        		pointStart: Date.UTC(2015, 10, 28),
	        		pointInterval: 7 * 24 * 3600 * 1000
	        	}
	        },
	        tooltip:{
	        	formatter: function() {
	        		return '<span class="tooltip-header" style="color:'+this.series.color+';">'+this.series.name+'</span><br><span class="tooltip-value">'+this.y+'</span><br><span class="tooltip-date">'
	        		+Highcharts.dateFormat('%b %d,%Y',new Date(this.x))+'</span>'
	        	},
       			useHTML: true,
       			borderRadius: 12,
       			borderWidth: 1,
       			backgroundColor: '#FFFFFF',
       			borderColor: '#A7A9AB'
	        },
	        series: [{
	            name: 'Sales Chicago',
	            data: [
	            	[Date.UTC[2015,10,28],700],
	            	[Date.UTC[2015,11,4],600],
	            	[Date.UTC[2015,11,11],950],
	            	[Date.UTC[2015,11,18],540],
	            	[Date.UTC[2015,11,24],850],
	            	[Date.UTC[2015,11,30],350]
	            ],
	            color: selector.colors.green
	        }, {
	            name: 'Sales Denver',
	            data: [
	            	[Date.UTC[2015,10,28],720],
	            	[Date.UTC[2015,11,4],1100],
	            	[Date.UTC[2015,11,11],900],
	            	[Date.UTC[2015,11,18],1060],
	            	[Date.UTC[2015,11,24],550],
	            	[Date.UTC[2015,11,30],150]
	            ],
	            color: selector.colors.purple
	        }, {
	            name: 'Customer Service',
	            data: [
	            	[Date.UTC[2015,10,28],550],
	            	[Date.UTC[2015,11,4],340],
	            	[Date.UTC[2015,11,11],1150],
	            	[Date.UTC[2015,11,18],900],
	            	[Date.UTC[2015,11,24],1050],
	            	[Date.UTC[2015,11,30],750]
	            ],
	            color: selector.colors.blue
	        }, {
	            name: 'Marketing - Chicago',
	            data: [
	            	[Date.UTC[2015,10,28],90],
	            	[Date.UTC[2015,11,4],500],
	            	[Date.UTC[2015,11,11],370],
	            	[Date.UTC[2015,11,18],750],
	            	[Date.UTC[2015,11,24],1150],
	            	[Date.UTC[2015,11,30],250]
	            ],
	            color: selector.colors.orange
	        },
	        {
	            name: 'Marketing - Denver',
	            data: [
	            	[Date.UTC[2015,10,28],990],
	            	[Date.UTC[2015,11,4],640],
	            	[Date.UTC[2015,11,11],1170],
	            	[Date.UTC[2015,11,18],320],
	            	[Date.UTC[2015,11,24],950],
	            	[Date.UTC[2015,11,30],475]
	            ],
	            color: selector.colors.red
	        }]
	    });
    }
}

function initResizeTextModule() {
	$(document).on('change','.js-company-selectwrap',function(){
		var $this = $(this),
		textLength = $this.val().length,
		tragetWrap = $this.closest('.js-selectpicker-wrap').find('.bootstrap-select .filter-option'),
		requiredFontSize;
		if(textLength < 20) {
			requiredFontSize = 40;
		}
		else {
			requiredFontSize = calculateFontSize(textLength);
		}
		tragetWrap.css("fontSize",requiredFontSize+"px");
	})
}

function calculateFontSize(stringLength) {
	var reqFontSize = (26-(((stringLength-22)*8)/28));
	return reqFontSize;
}
