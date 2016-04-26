// module that handles switching between analytics and leader board page
function SwitchBetweenAnalyticsAndLeaderBoardModule(){
    var thisInstance = this;

    thisInstance.constants = {
        selector: {
            graphWrapper: '.js_graph_container',
            resultSection: ".js_result_section",
            analyticsSwitch : "#analytics_switch",
            switchViewInAnalytics: ".js_switch_view_in_analytics",
            departmentAnalyticsTableHelpSection: ".js_help_text_section",
            fullPageLoader: ".js-full-page-loader",
            teamTitleSection: ".js_team_title",
            companySectionInBannerGraph: ".js_company_analytics_select",
            companyList: ".js_company_list",
            accountOwnerCompanyName: ".js_account_owner_company_name",
            backLinkButton: ".js_back_link_wrap"
        },
        companySelectFontSizeList: [40, 40, 39, 39, 38, 38, 37, 37, 36, 36, 35, 35, 34, 34, 33, 33, 32, 32, 31, 31, 30, 30, 29, 29, 28, 28, 27, 27, 26, 26, 25, 25, 24, 24, 24]
    };

    thisInstance.init = function(options){
        thisInstance.urlHistoryCountObject ={id: 0};  // to give unique id to each url
        initResizeCompanySelectTextModule();
        $(thisInstance.constants.selector.analyticsSwitch).removeClass("disable"); // removes disable state of switch
        options.personalityGraphModule = (new PersonalityDistributionGraph());  // instantiate graph on the top of the page
        options.personalityGraphModule.init(options);    // generates the graph
        options.urlHistoryCountObject = thisInstance.urlHistoryCountObject;  // send this object to leader board module too
        if(options.personalitySelected){
            options.personalityGraphModule.updateGraphPersonality(options.personalitySelected);
        }
        thisInstance.personalityGraphModule = options.personalityGraphModule;
        thisInstance.totalUserCount = options.totalCount;
        thisInstance.personalityCountList = options.personalityCountList;
        browserHistoryBindingClass();  // binds event on browser back and forward button click
        analyticsViewSwitchBinding();
        if(options.isSuperAdmin){
            superAdminCompanyChangeBindings();
        }
        if(options.viewType === "account_owner_view"){
            accountOwnerViewBindings(options);
        }
        else if(options.viewType === "supervisor_view"){
            supervisorViewBindings(options)
        }
        else if(options.viewType === "supervisor_parent_department_view"){
            supervisorParentDepartmentViewBindings(options)
        }
        else if(options.viewType === "employee_view"){
            employeeViewBindings(options);
        }
        else {
            (new LeaderBoardModule()).init(options);   // initially renders the leader board
            $(thisInstance.constants.selector.analyticsSwitch).prop("checked", false);
        }
        pageSwitchButtonBinding();   // binds the toggel button on banner
        analyticsBackButtonBinding();  // bind back link click
        window.history.replaceState({isAjax: true, historyId : ++thisInstance.urlHistoryCountObject.id}, "test", location.href);
    };

    // binds the toggle button change event with it's behaviour
    function pageSwitchButtonBinding(){
        var analyticsSwitch = thisInstance.constants.selector.analyticsSwitch,
            selector = thisInstance.constants.selector;
        // error callback for the new page call
        function errorCallback(){
            $(analyticsSwitch).removeClass("disable");
            $(analyticsSwitch).prop("checked", !$(analyticsSwitch).prop("checked"));
            $(selector.fullPageLoader).addClass("hide");  // hide the loader
        }
        function successCallback(){
            $(analyticsSwitch).removeClass("disable");
            $(selector.fullPageLoader).addClass("hide"); // hide the loader
        }

        $(analyticsSwitch).on("change", function(){
            if(!$(analyticsSwitch).hasClass("disable")) {    // if button is not locked or it is not waiting for it's previous request's response
                $(selector.fullPageLoader).removeClass("hide");  // show the loader
                $(analyticsSwitch).addClass("disable");   // makes the button disable
                var requestData = {};
                if($(selector.companyList).val()){
                    requestData.companyId = $(selector.companyList).val();
                }
                if (!$(this).prop("checked")) {
                    fetchLeaderBoard(requestData, successCallback, errorCallback);
                }
                else {
                    fetchAnalyticsPage($(selector.graphWrapper).data("analytics_url"), requestData, successCallback, errorCallback)
                }
            }
            else{
                $(analyticsSwitch).prop("checked", !$(analyticsSwitch).prop("checked"));
            }
        });
    }

    function fetchLeaderBoard(requestData, successCallback, errorCallback){
        var selector = thisInstance.constants.selector;

        $.ajax({
            method: "get",
            url: $(selector.graphWrapper).data("leader_board_index_url"),
            data: $.extend({getCompletePage: true}, requestData),
            success: function (data) {
                if (data.success) {
                    thisInstance.personalityGraphModule.updateGraphData(data.options.personalityCountList, data.options.totalCount, null);
                    $(selector.resultSection).html(data.partial);  // flag to indicate this time module is being run for partial
                    data.options.personalityGraphModule = thisInstance.personalityGraphModule;
                    data.options.isPartial = true;
                    // updates company title on banner graph
                    updateAnalyticsBannerHeader(data);
                    if(data.options.updatedUrl){
                        window.history.pushState({isAjax: true, historyId : ++thisInstance.urlHistoryCountObject.id}, "test", data.options.updatedUrl);
                    }
                    data.options.urlHistoryCountObject = thisInstance.urlHistoryCountObject;
                    (new LeaderBoardModule()).init(data.options);
                    $(selector.analyticsSwitch).prop("checked", false);
                    successCallback();
                }
                else{
                    errorCallback();
                }
            },
            error: function(error){
                if(error && error.status === 401){
                    location.reload();
                }
                else{
                    errorCallback();
                }
            }
        });
    }

    // function to update company and department title on banner graph
    // add bindings for the company drop down if user is a super admin
    function updateAnalyticsBannerHeader(data){
        var selector = thisInstance.constants.selector;
        if(data.analyticsBannerHeader) {
            $(selector.backLinkButton).remove();
            $(selector.companySectionInBannerGraph).replaceWith(data.analyticsBannerHeader);
            if(data.isSuperAdmin) {
                $(".selectpicker").selectpicker();
                superAdminCompanyChangeBindings();
            }
            initResizeCompanySelectTextModule();
        }
    }

    function fetchAnalyticsPage(url, requestData, successCallback, errorCallback){

        var selector = thisInstance.constants.selector;
        $.ajax({
            method: "get",
            data: requestData,
            url: url,
            success: function (data) {
                if (data.success) {
                    $(selector.resultSection).html(data.partial);
                    analyticsViewSwitchBinding();
                    if (data.analyticsView == "employee_view") {  // if this flag is true
                        // update the banner graph
                        thisInstance.personalityGraphModule.updateGraphData(data.options.bannerGraphData.personalityCountList, data.options.bannerGraphData.totalUserCount, null);
                        updateAnalyticsBannerHeader(data);
                        // draw compare graph between user and department or department and company as the data is sent in options
                        employeeViewBindings(data.options)
                    }
                    else if (data.analyticsView === "account_owner_view") {
                        // update the banner graph
                        thisInstance.personalityGraphModule.updateGraphData(data.options.bannerGraphData.personalityCountList, data.options.bannerGraphData.totalUserCount, null);
                        updateAnalyticsBannerHeader(data);
                        accountOwnerViewBindings(data.options)

                    }
                    else if (data.analyticsView === "supervisor_view") {
                        // update the banner graph
                        thisInstance.personalityGraphModule.updateGraphData(data.options.bannerGraphData.personalityCountList, data.options.bannerGraphData.totalUserCount, null);
                        updateAnalyticsBannerHeader(data);
                        supervisorViewBindings(data.options)
                    }
                    else if (data.analyticsView === "supervisor_parent_department_view") {
                        // update the banner graph
                        thisInstance.personalityGraphModule.updateGraphData(data.options.bannerGraphData.personalityCountList, data.options.bannerGraphData.totalUserCount, null);
                        updateAnalyticsBannerHeader(data);
                        supervisorParentDepartmentViewBindings(data.options)
                    }
                    if(data.options.updatedUrl){
                        window.history.pushState({isAjax: true, historyId : ++thisInstance.urlHistoryCountObject.id}, "test", data.options.updatedUrl);
                    }
                    successCallback();
                }
                else {
                    errorCallback();
                }
            },
            error: function(error){
                if(error && error.status === 401){
                    location.reload();
                }
                else{
                    errorCallback();
                }
            }
        });
    }

    // add bindings for super admin company change drop down list
    function superAdminCompanyChangeBindings() {

        function requestCallback(){
            $(selector.fullPageLoader).addClass("hide");
        }
        var selector = thisInstance.constants.selector,
            requestData = {};
        $(selector.companyList).on("change", function () {
            $(selector.fullPageLoader).removeClass("hide"); // make company change request
            requestData.companyId = $(this).val(); // set selected company id in requeest data


            if($(selector.analyticsSwitch).prop("checked")) {  // when user is on analytics page
                fetchAnalyticsPage($(selector.graphWrapper).data("analytics_url"), requestData, requestCallback, requestCallback);
            }
            else{  // when user is on leader board
                fetchLeaderBoard(requestData, requestCallback, requestCallback);
            }
        });
    }

    // function to initialize company name font size in banner graph
    function initResizeCompanySelectTextModule() {

        function updateFontSize(textLength, $targetWrap){  // updates font size
            if(textLength < 16) {
                requiredFontSize = 40;
            }
            else {
                requiredFontSize = constants.companySelectFontSizeList[textLength - 16] || 16;
            }
            $targetWrap.css("fontSize",requiredFontSize+"px");
        }

        var selector = thisInstance.constants.selector,
            constants = thisInstance.constants, requiredFontSize;

        if($(selector.companySectionInBannerGraph).find(selector.companyList).length > 0) {  // if company list in banner graph
            var $companyList = $(selector.companySectionInBannerGraph).find(selector.companyList);
            $companyList.on("loaded.bs.select", function(){  // on load of selectpicker
                var textLength = $companyList.find("option:selected").text().length,
                    $targetWrap = $(selector.companyList).find(".filter-option");
                updateFontSize(textLength, $targetWrap);
            });
            $companyList.on("changed.bs.select", function(){  // on load of selectpicker
                var textLength = $companyList.find("option:selected").text().length,
                    $targetWrap = $(selector.companyList).find(".filter-option");
                updateFontSize(textLength, $targetWrap);
            });
            $companyList.on("changed.bs.select", function(){  // on load of selectpicker
                var textLength = $companyList.find("option:selected").text().length,
                    targetWrap = $(selector.companyList).find(".filter-option");
                updateFontSize(textLength, targetWrap);
            });
        }
        else{  // company name without list in banner graph
            var $companyName = $(selector.companySectionInBannerGraph).find(selector.accountOwnerCompanyName),
                textLength = $companyName.text().length,
                targetWrap = $companyName;
            updateFontSize(textLength, targetWrap);
        }

    }

    // analytics view from uses stats or company stats switch links binding
    function analyticsViewSwitchBinding(){
        var selector = thisInstance.constants.selector,
            isViewSwitchLinkLocked = false;  // flag to check lock on link
        $(selector.switchViewInAnalytics).on("click", function (event) {
            var $selectedLink = $(this);
            $(selector.switchViewInAnalytics).each(function(){   // check if links are locked or not
                isViewSwitchLinkLocked = isViewSwitchLinkLocked || $(this).hasClass("disable") ;
            });

            if(!isViewSwitchLinkLocked) {   // if not locked
                $(selector.switchViewInAnalytics).each(function () {  // lock the links
                    $selectedLink.addClass("disable");
                });
                $(selector.fullPageLoader).removeClass("hide");  // show the loader
                event.preventDefault();
                var requestData = {};
                fetchAnalyticsPage($(this).data("view_request_url"), {}, function () {   // make view request
                    $(selector.fullPageLoader).addClass("hide");  // hide the loader
                    $(selector.analyticsSwitch).prop("checked", true);   // switch analytics and leader board switch to the analytics
                }, function () {
                    $(selector.switchViewInAnalytics).each(function () {  // if error occurs remove lock from the links
                        $selectedLink.removeClass("disable");
                    });
                    $(selector.fullPageLoader).addClass("hide");  // hide the loader
                });
            }
        });
    }


    // function that make ajax request on back or forward navigation of browser
    function browserHistoryBindingClass(){
        var selector = thisInstance.constants.selector,
            $fullPageLoader = $(selector.fullPageLoader),
            thisClassInstance = this;
        thisClassInstance.working = false;  // flag to know if already a request is being processed
        thisClassInstance.workingHistoryId = null;  // save currently being processed url id


        // binda click event on browser back or forward nav
        window.onpopstate = function(event){
            event.preventDefault();
            // if not processing any request and new request url is pushed in history by us
            if(!thisClassInstance.working && event.state && event.state.isAjax) {
                thisClassInstance.working = true;  // set the lock
                thisClassInstance.workingHistoryId = (event.state) ? event.state.historyId: null;
                var url = location.href;
                $fullPageLoader.removeClass("hide");
                $.ajax({
                    method: "get",
                    url: url,
                    data: {getCompletePage: true},
                    success: function(data){
                        $(selector.resultSection).html(data.partial);
                        analyticsViewSwitchBinding();
                        if(data.options.bannerGraphData) {
                            thisInstance.personalityGraphModule.updateGraphData(data.options.bannerGraphData.personalityCountList, data.options.bannerGraphData.totalUserCount, null);
                        }
                        else{
                            thisInstance.personalityGraphModule.updateGraphData(data.options.personalityCountList, data.options.totalCount, null);
                        }
                        updateAnalyticsBannerHeader(data);
                        if(data.analyticsView == "employee_view"){
                            employeeViewBindings(data.options);
                        }
                        else if(data.analyticsView == "supervisor_view"){
                            supervisorViewBindings(data.options);
                        }
                        else if(data.analyticsView == "supervisor_parent_department_view"){
                            supervisorParentDepartmentViewBindings(data.options);
                        }
                        else if(data.analyticsView == "account_owner_view"){
                            accountOwnerViewBindings(data.options);
                        }
                        else{  // if received view is leaderboard view
                            data.options.urlHistoryCountObject = thisInstance.urlHistoryCountObject;
                            data.options.personalityGraphModule = thisInstance.personalityGraphModule;
                            data.options.isPartial = true;
                            (new LeaderBoardModule()).init(data.options);   // initially renders the leader board
                            $(thisInstance.constants.selector.analyticsSwitch).prop("checked", false);
                        }
                    }
                }).fail(function(error){
                    if(error && error.status === 401){
                        location.reload();
                    }
                }).always(function(){
                    thisClassInstance.working = false;
                    thisClassInstance.workingHistoryId = null;
                    $fullPageLoader.addClass("hide");
                });
            }
            // if already a request is being processed and browser's forward button is clicked
            else if (event.state && event.state.historyId && event.state.historyId > thisClassInstance.workingHistoryId){
                window.history.back();
            }
            // if already a request is being processed and browser's back button is clicked
            else if (event.state && event.state.historyId && event.state.historyId < thisClassInstance.workingHistoryId){
                window.history.forward();
            }
        }
    }

    function accountOwnerViewBindings(options){
        departmentAnalyticsHelpSectionBindings();  // sets the cookie to hide help section or hide the section if cookie already exist
        options.fetchAnalyticsPage = fetchAnalyticsPage;
        (new AccountOwnerAnalyticsModule()).init(options);
        $(thisInstance.constants.selector.analyticsSwitch).prop("checked", true);
    }

    function supervisorViewBindings(options){
        departmentAnalyticsHelpSectionBindings();
        (new SupervisorAnalyticsModule()).init(options);
        $(thisInstance.constants.selector.analyticsSwitch).prop("checked", true);
    }

    function supervisorParentDepartmentViewBindings(options){
        departmentAnalyticsHelpSectionBindings();  // sets the cookie to hide help section or hide the section if cookie already exist
        options.fetchAnalyticsPage = fetchAnalyticsPage;
        (new SupervisorParentDepartmentAnalyticsModule()).init(options);
        $(thisInstance.constants.selector.analyticsSwitch).prop("checked", true);
    }

    function employeeViewBindings(options){
        (new AnalyticCompareGraphModule()).init(options);
        $(thisInstance.constants.selector.analyticsSwitch).prop("checked", true);
    }

    // sets the cookie if not found or hide the help section if cookie found
    function departmentAnalyticsHelpSectionBindings(){
        var selector = thisInstance.constants.selector;
        if(getCookie("department_analytics_table_help_section")){
            $(selector.departmentAnalyticsTableHelpSection).addClass("hide")
        }
        else{
            setCookie("department_analytics_table_help_section", "true", (365 * 24 * 60 * 60 * 1000));
        }
    }


    function setCookie(cname, cvalue, exTime) {
        var d = new Date();
        d.setTime(d.getTime() + exTime);
        var expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
    }

    function getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1);
            if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
        }
        return "";
    }

    function analyticsBackButtonBinding() {
        var selector = thisInstance.constants.selector;

        $(document).on('click', selector.backLinkButton, function(event) {
            event.preventDefault();
            var $this = $(this);
            var url = $this.data('back_link_url'),
                requestData = {};
            requestData[$.trim($this.data('parent_key'))] = $.trim($this.data('parent_id'));
            $(selector.fullPageLoader).removeClass("hide");  // show the loader

            var callback = function() {
                $(selector.fullPageLoader).addClass("hide");  // hide the loader
            };
            fetchAnalyticsPage(url, requestData, callback, callback);
        });
    }
}
