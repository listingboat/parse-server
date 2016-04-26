function DepartmentComparisonGraphModule() {
	var thisInstance = this;
    thisInstance.colorsList = [
        {name: 'orange', value: '#FF6B35'},
        {name: 'yellow', value: '#ECA900'},
        {name: 'green', value: '#118C89'},
        {name: 'red', value: '#D84154'},
        {name: 'purple', value: '#754299'},
        {name: 'blue', value: '#4B91DD'}
    ];
    thisInstance.selectors = {
        graphSelector: 'team-pq-graph',
        closeBtn: '.js-close-btn',
        helpSection: '.js-help-section'
    };
    this.init = function (options) {
        var selector = thisInstance.selectors;
        $(document).on('click', selector.closeBtn, function (e) {
            e.preventDefault();
            $(this).closest(selector.helpSection).slideUp();
        });
        $.extend(thisInstance, options);
        initializeDepartmentComparisonGraph(options.topDefaultDepartments || [], options.topDefaultDepartmentAnalyticsData);
    };

    function initializeDepartmentComparisonGraph(departments, departmentsAnalyticData){
        var selector = thisInstance.selectors;
		thisInstance.departmentComparisonGraph = new Highcharts.Chart({
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
	            minPadding:0.1,
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
	        	}
	        },
	        tooltip:{
				formatter: function () {
					return '<span class="tooltip-header" style="color:' + this.series.color + ';">' + this.series.name + '</span><br><span class="tooltip-value">' + Math.round(this.y) + '</span><br><span class="tooltip-date">'
							+ Highcharts.dateFormat('%b %d,%Y', new Date(this.x)) + '</span>'
				},
       			useHTML: true,
       			borderRadius: 12,
       			borderWidth: 1,
       			backgroundColor: '#FFFFFF',
       			borderColor: '#A7A9AB'
	        },
            series: Array.isArray(departments)? departments.map(function(department, index){
                return {
                    id: department.id,
                    name: department.name,
					type: "spline",
                    data: (departmentsAnalyticData || {})[department.id],
                    color: thisInstance.colorsList[index % thisInstance.colorsList.length].value
                };
            }) : []
	    });
    }
}
