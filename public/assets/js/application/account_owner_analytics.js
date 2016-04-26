// Module to handle account owner analytics flow and bindings
function AccountOwnerAnalyticsModule(){
    var thisInstance = this;
    thisInstance.selectors = {
        departmentTableRow: '.js_department_row',
        graphRangeFilter: '.js_graph_range_filter',
        openSupervisorButton: '.js_open_supervisor_view_button',
        fullPageLoader: ".js-full-page-loader",

    };
    thisInstance.classes = {
        openSupervisorView: 'js_open_supervisor_view_button',
        subdepartmentCaret: 'js_subdepartment_caret'
    };
    thisInstance.colorsList = [ // list of color  available to us for displaying data on graph and related data
        {
            name: 'orange',
            value: '#FF6B35',
            teamClass: 'team-orange-wrap'
        },
        {
            name: 'yellow',
            value: '#ECA900',
            teamClass: 'team-yellow-wrap'
        },
        {
            name: 'green',
            value: '#118C89',
            teamClass: 'team-green-wrap'
        },
        {
            name: 'red',
            value: '#D84154',
            teamClass: 'team-red-wrap'
        },
        {
            name: 'purple',
            value: '#754299',
            teamClass: 'team-purple-wrap'
        },
        {
            name: 'blue',
            value: '#4B91DD',
            teamClass: 'team-blue-wrap'
        }
    ];

    thisInstance.init = function(options){ // initialized module and run all bindings
        thisInstance.departmentAnalyticsData = options.topDefaultDepartmentAnalyticsData;
        var selector = thisInstance.selectors;
        thisInstance.filteredDepartmentAnalyticsData = applyRangeFilterAndGetData(parseInt($(selector.graphRangeFilter + '.active').data('days')));
        thisInstance.departmentGraphInstance = new DepartmentComparisonGraphModule();
        thisInstance.departmentGraphInstance.init($.extend({}, options, {topDefaultDepartmentAnalyticsData: thisInstance.filteredDepartmentAnalyticsData})); // initialized graph
        thisInstance.fetchAnalyticsPage = options.fetchAnalyticsPage;
        departmentRowClickBindings(); // adding bindings to remove and add department graph
        graphFiltersBindings();
    };

    function departmentRowClickBindings() {
        var selectors = thisInstance.selectors,
            classes = thisInstance.classes;

        function requestCallback() {
            $(selectors.fullPageLoader).addClass("hide");
        }
        $(selectors.departmentTableRow).click(function (event) {
            var $this = $(this),
                $target = $(event.target);
            event.preventDefault();
            if ($target.hasClass(classes.openSupervisorView)) {
                $(selectors.fullPageLoader).removeClass("hide"); // make company change request
                var url = $this.data('supervisor_analytics_url'),
                    departmentId = $this.data('department_id');
                thisInstance.fetchAnalyticsPage(url, {department_id: departmentId}, requestCallback, requestCallback);
            }
            else if(!$target.hasClass(classes.subdepartmentCaret)){// do nothing if target is caret to expanding to display sub departments
                addOrRemoveDepartmentGraph($this);
            }
        });
    }

    // function to add bindings to remove or add department to graph
    function addOrRemoveDepartmentGraph($this) {
        var selectors = thisInstance.selectors;
        var departmentId = $this.data('department_id'),
            departmentSeries = thisInstance.departmentGraphInstance.departmentComparisonGraph.get(departmentId);
        if (departmentSeries) {
            // remove department series
            departmentSeries.remove();
            $this.removeClass($this.data('department_color'));
        }
        else {
            function successCallback() {
                var departmentName = $this.data('department_name'),
                    colour = thisInstance.colorsList.find(function(colorObject){
                        return colorObject.teamClass === $this.data('department_color');
                    }).value;
                thisInstance.departmentGraphInstance.departmentComparisonGraph.addSeries({
                    id: departmentId,
                    name: departmentName,
                    data: thisInstance.filteredDepartmentAnalyticsData[departmentId],
                    color: colour
                });
                $this.addClass($this.data('department_color'));
            }

            function errorCallback() {
            }

            // check if department data exists
            if (!thisInstance.departmentAnalyticsData[departmentId]) {
                var departmentAnalyticsUrl = $this.data('department_analytics_data_url');
                fetchDepartmentData(departmentId, departmentAnalyticsUrl, successCallback, errorCallback);
            }
            else {
                successCallback();
            }
        }
    }

    // function to fetch departments analytics data from backend
    function fetchDepartmentData(departmentId, departmentAnalyticsUrl, successCallback, errorCallback){
        var selector = thisInstance.selectors;
        $.ajax({
            url: departmentAnalyticsUrl,
            data: {departmentId: departmentId},
            type: "GET"
        }).done(function(data){
            $.extend(thisInstance.departmentAnalyticsData, data.departmentAnalyticsData);
            var filterData = applyRangeFilterAndGetData(parseInt($(selector.graphRangeFilter + '.active').data('days')), data.departmentAnalyticsData);
            $.extend(thisInstance.filteredDepartmentAnalyticsData, filterData);
            successCallback();
        }).fail(function(error){
            if(error && error.status === 401){
                location.reload();
            }
            else{
                errorCallback(error);
            }
        });
    }

    // function for binding graph range filters
    function graphFiltersBindings(){
        var selector = thisInstance.selectors;
        $(selector.graphRangeFilter).click(function(){
            var $this = $(this),
                filterDays = $this.data('days');
                thisInstance.filteredDepartmentAnalyticsData = applyRangeFilterAndGetData(parseInt(filterDays));
            updateGraphData(thisInstance.filteredDepartmentAnalyticsData);
            $(selector.graphRangeFilter).removeClass('active');
            $this.addClass('active');
        });
    }

    // function to update data of all series using given data dict
    function updateGraphData(departmentAnalyticsData){
        thisInstance.departmentGraphInstance.departmentComparisonGraph.series.forEach(function(series){
            var departmentId = series.options.id;
            if(departmentAnalyticsData[departmentId]) {
                series.update({
                    data: departmentAnalyticsData[departmentId]
                });
            }
        });
    }

    // function to return data after applying range filters
    function applyRangeFilterAndGetData(days, departmentAnalyticsData){
        departmentAnalyticsData = $.extend(true, {}, departmentAnalyticsData || thisInstance.departmentAnalyticsData);
        for(var index in departmentAnalyticsData){
            if(Array.isArray(departmentAnalyticsData[index])) {
                departmentAnalyticsData[index] = (departmentAnalyticsData[index] || []).slice(90 - parseInt(days));
            }
        }
        return departmentAnalyticsData;
    }
}
