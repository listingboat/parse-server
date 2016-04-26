function SupervisorAnalyticsModule(){
    var thisInstance = this;
    thisInstance.selectors = {
        employeeNextPage: '.js_employee_next_page',
        employeePrevPage: '.js_employee_prev_page',
        employeeTableWrapper: '.js_employee_table_wrap',
        employeePaginationInfo: '.js_employee_pagination'
    };
    thisInstance.init = function(options){
        (new SupervisorCompareGraph()).init(options);
        employeePaginationBindings();
    };

    function employeePaginationBindings(){
        var selectors = thisInstance.selectors,
            $tableWrapper = $(selectors.employeeTableWrapper),
            $paginationInfo = $(selectors.employeePaginationInfo);

        function successCallback(html) {
            $tableWrapper.html(html);
            employeePaginationBindings();
        }


        $(selectors.employeeNextPage).click(function (event) {
            event.preventDefault();
            var $thisEle = $(this);
            if (!$thisEle.hasClass('disabled')) {
                var pageData = $paginationInfo.data();
                $thisEle.addClass('disabled');
                fetchDepartmentEmployees(pageData.current_page + 1, successCallback, function () {
                    $thisEle.removeClass('disabled');
                });
            }
        });

        $(selectors.employeePrevPage).click(function (event) {
            event.preventDefault();
            var $thisEle = $(this);
            if (!$thisEle.hasClass('disabled')) {
                var pageData = $paginationInfo.data();
                $thisEle.addClass('disabled');
                fetchDepartmentEmployees(pageData.current_page - 1, successCallback, function(){
                    $thisEle.removeClass('disabled');
                });
            }
        });
    }

    function fetchDepartmentEmployees(page, successCallback, errorCallback){
        var $tableWrapper = $(thisInstance.selectors.employeeTableWrapper),
            employeeTableUrl = $tableWrapper.data('employee_list_url'),
            departmentId = $tableWrapper.data('department_id');
        $.ajax({
            url: employeeTableUrl,
            data: {page: page, departmentId: departmentId},
            dataType: 'html'
        }).done(successCallback
        ).fail(function(error){
                if(error && error.status === 401){
                    location.reload();
                }
                else{
                    errorCallback(error);
                }
            });
    }
}
