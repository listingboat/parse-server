var leaderBoardConstants = require('./cloud/apps/leader_board/constants.js'),
    _ = require('underscore'),
    userConstants = require('./cloud/apps/user/constants.js'),
    companyUtils = require('./cloud/apps/company/utils.js'),
    commonUtils = require('./cloud/apps/common/utils.js');

// renders explore page(s)
exports.leaderBoardController = function (req, res) {

    function getUserCount(queryObject, totalUserCount, company, successCallback){
        if((searchKey || "").trim() !== "" || (departmentId || "").trim() !== ""){
            queryObject.count().then(successCallback, req.errorCallback)
        }
        else if(!personalitySelected){
            successCallback(totalUserCount);
        }
        else {
            successCallback(company.get(personalitySelected.toLowerCase() + '_count'));
        }
    }

    // function returns company object of the given company id or user's company object if no company id is given
    // also returns list of all the company object
    function getCompanyAndCompanyList(user, isSuperAdmin, companyId, successCallback, errorCallback){
        if(isSuperAdmin){
            var companyQueryObject = new Parse.Query("Company");

            if(!companyId || companyId == user.get('company').id){  // requested company and current user's company is the same or no company id is sent
                companyQueryObject.limit(1000);
                companyQueryObject.find().then(function(companyList){
                    companyList = commonUtils.sortObjectsByName(companyList);
                    for(var companyIndex in companyList){
                        if(companyList[companyIndex].id == user.get('company').id){
                            successCallback(companyList[companyIndex], companyList)
                        }
                    }
                }, errorCallback);
            }
            else {
                companyQueryObject.include("most_understood_personality", "least_understood_personality", "highest_pq_user");
                companyQueryObject.find().then(function(companyList){
                    companyList = commonUtils.sortObjectsByName(companyList);
                    var company = _.find(companyList, function(companyObject){
                        return companyObject.id == companyId
                    });
                    company == company || user.get("company");
                    successCallback(company, companyList);
                }, errorCallback);
            }
        }
        else{
            user.get("company").fetch(successCallback, errorCallback);
        }
    }

    var personalitySelected = req.query.personality || req.body.personality || null,
        departmentId = req.query.department || req.body.department || null,
        searchKey = req.query.searchKey || req.body.searchKey || null,
        pageToDisplay = req.query.page || req.body.page || 1,
        getCompletePage = req.query.getCompletePage || req.body.getCompletePage || false,
        companyId = req.query.companyId || req.body.companyId || req.params.companyId ||"",
        totalUserCount = 0,
        currentUser = req.currentUser,
        isSuperAdmin = (userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === currentUser.get('permission_type')),
        updatedUrl;


    // generate updated url with current filters
    if(typeof companyId === "string" && companyId !== ""){
        updatedUrl = req.app.namedRoutes.build('leaderBoard.indexWithCompanyId', {companyId: companyId});
    }
    else{
        updatedUrl = req.app.namedRoutes.build('leaderBoard.index');
    }

    if(personalitySelected){
        updatedUrl = commonUtils.updateQueryStringParameter(updatedUrl, "personality", personalitySelected);
    }
    if(departmentId){
        updatedUrl = commonUtils.updateQueryStringParameter(updatedUrl, "department", departmentId);
    }
    if(searchKey){
        updatedUrl = commonUtils.updateQueryStringParameter(updatedUrl, "searchKey", searchKey);
    }
    if(pageToDisplay){
        updatedUrl = commonUtils.updateQueryStringParameter(updatedUrl, "page", pageToDisplay);
    }
    if(getCompletePage){
        updatedUrl = commonUtils.updateQueryStringParameter(updatedUrl, "getCompletePage", getCompletePage);
    }

    getCompanyAndCompanyList(currentUser, isSuperAdmin, companyId , function(company, companyList){

        // if search keyword are received in filter
        if(typeof searchKey === "string" && searchKey.trim() != ""){
            var searchKeyLower = searchKey.toLowerCase(),
                firstNameSearchQuery = new Parse.Query('User'),
                lastNameSearchQuery = new Parse.Query('User'),
                emailSearchQuery = new Parse.Query('User'),
                titleSearchQuery = new Parse.Query('User');
            firstNameSearchQuery.startsWith("first_name_lower_case", searchKeyLower);  // look for keyword in first name
            lastNameSearchQuery.startsWith("last_name_lower_case", searchKeyLower);  // look for keyword in last name
            emailSearchQuery.startsWith("email", searchKeyLower);   // look for keyword in email
            titleSearchQuery.startsWith("title_lower_case", searchKeyLower);   // look for keyword in email
            var userQuery = Parse.Query.or(firstNameSearchQuery, lastNameSearchQuery, emailSearchQuery, titleSearchQuery);  // OR query
        }
        else{
            var userQuery = new Parse.Query(Parse.User);
        }

        userQuery.notEqualTo("is_deleted", true);  // exclude deleted user
        // department filtering
        if(typeof departmentId === "string" && departmentId !== ''){
            var Department = Parse.Object.extend('Department'),
                departmentObject = new Department();
            departmentObject.id = departmentId;
            userQuery.equalTo('department', departmentObject)
        }

        // personality filtering
        if(['Organizer', 'Advisor', 'Connector', 'Dreamer', 'Original', 'Doer'].indexOf(personalitySelected) != -1){
            var personalityQuery = new Parse.Query('Personality');
            personalityQuery.equalTo('name', personalitySelected);
            userQuery.matchesQuery('primary_personality', personalityQuery);
        }

        //pagination
        userQuery.skip((pageToDisplay - 1) * leaderBoardConstants.USER_PER_PAGE);
        userQuery.limit(leaderBoardConstants.USER_PER_PAGE);

        // show only current user's company employees
        userQuery.equalTo('company', company);

        // ordering with PQ score
        userQuery.descending('pq_score');
        // include primary personality object and company object with users

        userQuery.include('company', 'primary_personality');
        userQuery.find({
            success: function (userObjectList) {
                if (userObjectList.length !== 0 || getCompletePage || !req.xhr) {
                    // set count of all personality types
                    var personalityCountList = [
                        {name: 'Organizer', count: company.get('organizer_count') || 0},
                        {name: 'Advisor', count: company.get('advisor_count') || 0},
                        {name: 'Connector', count: company.get('connector_count') || 0},
                        {name: 'Dreamer', count: company.get('dreamer_count') || 0},
                        {name: 'Original', count: company.get('original_count') || 0},
                        {name: 'Doer', count: company.get('doer_count') || 0}
                    ];
                    // set total user count

                    totalUserCount = company.get('user_count') || 0;
                    getUserCount(userQuery, totalUserCount, company, function (userCount) {

                        // sort personality filter according to their user count
                        personalityCountList = personalityCountList.sort(function (p1, p2) {
                            return (p2.count - p1.count);
                        });
                        var context = {
                            leader_board: true,
                            userObjectList: userObjectList,
                            userCount: userCount,
                            totalUserCount: totalUserCount,
                            pageToDisplay: pageToDisplay,
                            userPerPage: leaderBoardConstants.USER_PER_PAGE,
                            personalitySelected: personalitySelected,
                            departmentId: departmentId,
                            searchKey: searchKey,
                            personalityCountList: personalityCountList,
                            personalityGraphClassMap: leaderBoardConstants.PERSONALITY_GRAPH_CLASS,
                            company: company,
                            companyId: companyId,
                            companyList: companyList,
                            personalityIconMap: leaderBoardConstants.PERSONALITY_ICON_MAP,
                            personalityFilterIconMap: leaderBoardConstants.PERSONALITY_FILTER_ICON_MAP,
                        };
                        if (getCompletePage && req.xhr) {
                            var departmentQuery = new Parse.Query('Department');
                            departmentQuery.equalTo("company", company);
                            departmentQuery.greaterThan("user_count", 0);
                            departmentQuery.find({
                                success: function (departmentList) {
                                    var sortedDepartmentLists = companyUtils.getSortedDepartmentHierarchyList(departmentList);  // get sorted parent and child department list
                                    res.render('leader_board/_team_directory', _.extend(context, sortedDepartmentLists,{
                                        layout: 'layout_partial'
                                    }), function (error, html) {

                                        // render company title section partial for banner graph
                                        res.render("leader_board/_analytics_banner_header", {
                                            company: company,
                                            layout: 'layout_partial',
                                            companyList: companyList
                                        }, function (error, analyticsBannerHeader) {

                                            res.send(
                                                {
                                                    success: true,
                                                    partial: html,
                                                    analyticsBannerHeader: analyticsBannerHeader,
                                                    isSuperAdmin: isSuperAdmin,
                                                    options: {
                                                        companyName: context.company.get("name"),
                                                        graphPersonality: context.personalitySelected,
                                                        personalityGraphClassMap: context.personalityGraphClassMap,
                                                        personalityCountList: context.personalityCountList,
                                                        totalCount: totalUserCount,
                                                        userPerPage: context.userPerPage,
                                                        companyId: context.company.id,
                                                        isSuperAdmin: isSuperAdmin,
                                                        updatedUrl: updatedUrl
                                                    }
                                                }
                                            );
                                        });
                                    });
                                }, error: req.errorCallback
                            });
                        }
                        else if (!req.xhr) {
                            var departmentQuery = new Parse.Query('Department');
                            departmentQuery.equalTo("company", company);
                            departmentQuery.greaterThan("user_count", 0);
                            departmentQuery.find({
                                success: function (departmentList) {
                                    var sortedDepartmentLists = companyUtils.getSortedDepartmentHierarchyList(departmentList);  // get sorted parent and child department list
                                    res.render('leader_board/index', _.extend(context, sortedDepartmentLists));
                                }, error: req.errorCallback
                            });
                        }
                        else {
                            res.render('leader_board/_user_list', _.extend(context, {layout: 'layout_partial'}), function (error, html) {
                                res.render('leader_board/_personality_filter', _.extend(context, {layout: 'layout_partial'}), function (error, personalityFilterHtml) {

                                    res.send({
                                        userListHtml: html,
                                        userCount: userCount,
                                        totalUserCount: totalUserCount,
                                        personalityFilterHtml: personalityFilterHtml,
                                        personalityCountList: personalityCountList,
                                        pageToDisplay: pageToDisplay,
                                        personalitySelected: personalitySelected,
                                        departmentId: departmentId,
                                        searchKey: searchKey,
                                        updatedUrl: updatedUrl,
                                        isSuperAdmin: isSuperAdmin
                                    });
                                });
                            });
                        }
                    });
                }
                else{
                    res.render('leader_board/_empty_user_list', {layout: 'layout_partial', companyId: company.id}, function (error, html) {
                        res.send({
                            userListHtml: html,
                            userCount: 0,
                            pageToDisplay: pageToDisplay,
                            personalitySelected: personalitySelected,
                            searchKey: searchKey,
                            departmentId: departmentId,
                            updatedUrl: updatedUrl
                        });
                    });

                }
            },
            error: req.errorCallback
        });
    }, req.errorCallback);
};
