function LeaderBoardModule(){
    var thisInstance = this;
    // object to save constants for module
    thisInstance.constants = {
        selector: {
            paginationWrap: '.js_pagination_wrap',
            userListWrap: '.js_user_list_wrap',
            nextPageButton: '.js_next_page',
            prevPageButton: '.js_prev_page',
            rangeFirst: '.js_range_first',
            rangeLast: '.js_range_last',
            totalUserCount: '.js_total_count',
            personalityFilterWrap: '.js_personality_filter_wrap',
            personalityFilter: '.js_personality_filter',
            userEle: '.js_user_element',
            userLink: '.js_user_list_link',
            userMailTo: '.js_user_mail_to',
            graphWrapper: '.js_graph_container',
            searchBox: '.js_search_box',
            searchForm: '.js_search_form',
            departmentFilter: '.js_department_filter',
            paginationLastIndex: '.js_pagination_last_index',
            fullPageLoader: ".js-full-page-loader"
        },
        classes:{
            userMailTo: 'js_user_mail_to',
            userEle: 'js_user_element'
        }
    };
    // initialize module
    thisInstance.init = function(options){
        if(options.isPartial){   // if module is being run for partial than initialize select picker
            $(".selectpicker").selectpicker();
        }
        paginationBinding(); // bind events with next and previous buttons
        personalityFilterBindings(); // bind events with personality filters
        redirectUserBinding();
        searchBinding();
        departmentFilterBinding();
        thisInstance.personalityGraphClassMap = options.personalityGraphClassMap;
        thisInstance.personalityGraphModule = options.personalityGraphModule;
        thisInstance.userPerPage = options.userPerPage;
        thisInstance.selectedCompanyId = options.companyId;   // current selected company
        thisInstance.urlHistoryCountObject = options.urlHistoryCountObject;  // to give unique id to url

    };

    // this function accepts filters and callback. This function fetch user list according to filters applied and according to appropriate filter
    function fetchAndLoadUserList(filters, successCallback, errorCallback, alwaysCallback){
        var selector = thisInstance.constants.selector;
        // updates count of personality filters and rebinds filter events
        function updatePersonalityCount(data) {
            var $userListWrap = $(selector.userListWrap);
            if (data.personalityFilterHtml) {
                $(selector.personalityFilterWrap).html(data.personalityFilterHtml);
                personalityFilterBindings();
            }
            else if (!data.userCount) {
                $userListWrap.addClass('no-result-wrap');
                $(selector.personalityFilterWrap).find(
                    selector.personalityFilter).removeClass('active').each(
                    function () {
                        if ($(this).data('personality') == data.personalitySelected)
                            $(this).addClass('active');
                    });
            }
            if (data.userCount) {
                $userListWrap.removeClass('no-result-wrap');
            }
        }

        function updatePersonalityGraph(options) {
            if(options.personalityCountList) {
                thisInstance.personalityGraphModule.updateGraphData(options.personalityCountList, options.totalUserCount, options.personalitySelected);
            }
            else{
                thisInstance.personalityGraphModule.updateGraphPersonality(options.personalitySelected);
            }
        }

        // function to update pagination according to filter selected
        function updatePaginationText(userCount, pageToDisplay){
            var $paginationWrap = $(selector.paginationWrap),
                userPerPage = thisInstance.userPerPage;
            if(userCount && userCount !== 0) {
                $paginationWrap.removeClass('hide');
                var $nextButton = $paginationWrap.find(selector.nextPageButton),
                    $prevButton = $paginationWrap.find(selector.prevPageButton),
                    rangeFirst = (pageToDisplay - 1) * userPerPage + 1,
                    rangeLast = (((pageToDisplay * userPerPage) < userCount) ? (pageToDisplay * userPerPage) : userCount);
                $paginationWrap.find(selector.rangeFirst).text(rangeFirst);
                $paginationWrap.find(selector.rangeLast).text(rangeLast);
                $paginationWrap.find(selector.totalUserCount).text(userCount);
                if(rangeFirst == rangeLast){
                    $(selector.paginationLastIndex).addClass('hide');
                }
                else{
                    $(selector.paginationLastIndex).removeClass('hide');
                }

                if ((userCount - ((pageToDisplay - 1) * userPerPage)) <= userPerPage) {
                    $nextButton.addClass('disabled');
                }
                else {
                    $nextButton.removeClass('disabled');
                }
                if ((pageToDisplay - 1) == 0) {
                    $prevButton.addClass('disabled');
                }
                else {
                    $prevButton.removeClass('disabled');
                }
            }
            else {
                $paginationWrap.addClass('hide');
            }
        }

        // function to update text in search box when ajax call returns
        function updateSearchText(searchText){
            $(selector.searchBox).val(searchText);
        }

        // function to update department after ajax call returns
        function updateDepartmentFilter(departmentId){
            departmentId = departmentId || "";
            $(selector.departmentFilter).selectpicker('val', departmentId);
        }

        function updateUrl(url){
            if(url){
                thisInstance.urlHistoryCountObject.id += 1;
                window.history.pushState({isAjax: true, historyId: thisInstance.urlHistoryCountObject.id}, "test", url);
            }
        }

        // success callback which updates personality count and pagination text and handles no results
        successCallback = successCallback || function(data){
                updateUrl(data.updatedUrl);
                updatePaginationText(data.userCount, data.pageToDisplay);
                updateSearchText(data.searchKey);
                updateDepartmentFilter(data.departmentId);
                updatePersonalityCount(data);
                updatePersonalityGraph(data);
                var $userListWrap = $(selector.userListWrap);
                $userListWrap.html(data.userListHtml);
                redirectUserBinding();

                // save applied filters to module instance
                thisInstance.filtersToApply = filtersToApply;
            };
        // logic for applying filters
        if(filters.searchKey) {
            var filtersToApply = $.extend({}, filters, {page: filters.page || 1});
        }
        else if(filters.page){
            var filtersToApply = $.extend({}, thisInstance.filtersToApply, filters);
        }
        else{
            var filtersToApply = $.extend({}, thisInstance.filtersToApply, filters, {page: filters.page || 1, searchKey: filters.searchKey || ''});
        }

        // send selected company id to apply filter on that selected company
        if(thisInstance.selectedCompanyId){
            filtersToApply = $.extend(filtersToApply, {companyId: thisInstance.selectedCompanyId});
        }

        // check if ajax call is in progress and block entry if it is
        if(!fetchAndLoadUserList.ajaxLock) {
            $(selector.fullPageLoader).removeClass("hide"); // shows the loader when request is made
            fetchAndLoadUserList.ajaxLock = true;
            // makes call to current url and fetch user list

            $.ajax({
                data: JSON.stringify(filtersToApply),
                url: $(selector.graphWrapper).data("leader_board_index_url"),
                contentType: 'application/json',
                type: 'post'
            }).done(successCallback)
                .fail(function(error){
                    if(error && error.status === 401){
                        location.reload();
                    }
                    else{
                        errorCallback(error);
                    }
                })
                .always(function(){
                    $(selector.fullPageLoader).addClass("hide");  // hides the loader after request is complete
                    if(typeof alwaysCallback === "function") {
                        alwaysCallback();
                    }
                    fetchAndLoadUserList.ajaxLock = false;
                });
        }
        else if (typeof alwaysCallback === "function") {
            alwaysCallback();
        }
    }

    // function which binds events to next and previous pointers
    function paginationBinding(){
        var selector = thisInstance.constants.selector,
            $paginationWrap = $(selector.paginationWrap),
            $nextButton = $paginationWrap.find(selector.nextPageButton),
            $prevButton = $paginationWrap.find(selector.prevPageButton);

        // next button bindings
        $nextButton.click(function(event){
            event.preventDefault();
            if(!$nextButton.hasClass('disable')){
                var firstIndex = parseInt($paginationWrap.find(selector.rangeFirst).text()),
                    lastIndex = parseInt($paginationWrap.find(selector.rangeLast).text()),
                    totalUsers = parseInt($paginationWrap.find(selector.totalUserCount).text()),
                    usersPerPage = thisInstance.userPerPage,
                    currentPage = parseInt(firstIndex / usersPerPage) + 1;
                if (lastIndex != totalUsers) {
                    $nextButton.addClass('button-down');
                    fetchAndLoadUserList({page: currentPage + 1}, undefined, undefined, function(){
                        $nextButton.removeClass('button-down');
                    });
                }
            }
        });
        // previous button bindings
        $prevButton.click(function(event){
            event.preventDefault();
            if(!$prevButton.hasClass('disable')){
                var firstIndex = parseInt($paginationWrap.find(selector.rangeFirst).text()),
                    lastIndex = parseInt($paginationWrap.find(selector.rangeLast).text()),
                    usersPerPage = thisInstance.userPerPage,
                    currentPage = parseInt(firstIndex / usersPerPage) + 1;
                if (firstIndex >= usersPerPage) {
                    fetchAndLoadUserList({page: currentPage - 1}, undefined, undefined, function(){
                        $nextButton.removeClass('button-down');
                    });
                }
            }
        });
    }

    // bindings for filtering personality
    function personalityFilterBindings(){
        var selector = thisInstance.constants.selector;
        $(selector.personalityFilterWrap).find(selector.personalityFilter).click(function(event){
            event.preventDefault();
            var personality = $(this).data('personality');
            fetchAndLoadUserList({personality: personality, department: ""});
        });
    }

    // bind user list element with appropriate redirect logic
    function redirectUserBinding(){
        var selector = thisInstance.constants.selector,
            classes = thisInstance.constants.classes,
            $userListWrapElements = $(selector.userEle);
        $userListWrapElements.click(function(event){
            var $this = $(this);
            event.preventDefault();
            if(!$(event.target).hasClass(classes.userMailTo)){
                var url = $this.closest(selector.userEle).find(selector.userLink).attr('href');
            }
            else{
                var url = $(event.target).data('mail_to_link');
            }
            if(url) {
                if (event.ctrlKey) {
                    window.open(url, '_blank');
                }
                else {
                    window.location = url;
                }
            }
        });
    }

    // function that add search keys in filter
    function searchBinding(){
        var selector = thisInstance.constants.selector,
            $searchForm = $(selector.searchForm);
        $searchForm.on('submit', function(event){
            event.preventDefault();
            fetchAndLoadUserList({searchKey: $.trim($(selector.searchBox).val())});
        });
    }

    // binding to bind department filters
    function departmentFilterBinding(){
        var selector = thisInstance.constants.selector;
        $(selector.departmentFilter).change(function(){
            var value = $(this).val();
            fetchAndLoadUserList({department: value});
        });
    }
}
