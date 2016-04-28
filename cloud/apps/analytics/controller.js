var _ = require('underscore'),
    analyticsUtils = require('cloud/apps/analytics/utils.js'),
    commonUtils = require('cloud/apps/common/utils.js'),
    companyUtils = require('cloud/apps/company/utils.js'),
    analyticsConstants = require('cloud/apps/analytics/constants.js'),
    userConstants = require('cloud/apps/user/constants.js'),
    leaderBoardConstants = require('cloud/apps/leader_board/constants.js');


// controller to render user's analytics
exports.userAnalyticsController = function (req, res) {
    var context = {},
        currentUser = req.currentUser, // current logged in user
        last7DayScores = currentUser.get("last_7_day_pq_scores"), // last 7 day scores of user
        lastWeekPqScore = (last7DayScores && (last7DayScores.length == 7)) ? last7DayScores[6] : 0, // pq score last week
        companyUserCountGroupByPersonality, companyLast8dayScore, companyLast8DayUserCount, departmentLast8dayScore, bannerGraphData, departmentLast8DayUserCount,
        isSuperAdmin = (userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === currentUser.get('permission_type')),  // checks if user is super admin or not
        updatedUrl = req.app.namedRoutes.build('analytics.userAnalytics');
    context.userPQ = currentUser.get("pq_score");
    context.nextPQTarget = (typeof context.userPQ === "number") ? (context.userPQ + 100) - (context.userPQ % 100) : 100 ;
    context.user7DayGain = (typeof currentUser.get('last_7_day_pq_gain') === "number") ? currentUser.get('last_7_day_pq_gain') : '---';
    context.best7DayPQ = currentUser.get("best_7_day_pq_gain") || 0;
    context.bestStreak = currentUser.get("longest_streak") || 0;
    context.currentStreak = (currentUser.get("current_streak") < 0) ? currentUser.get("current_streak") : 0;

    // fetch user's company
    analyticsUtils.getUserCompanyAndDepartment(currentUser, function (currentUser, company, department) {

        // function to get list of other companies if user is a super admin
        analyticsUtils.getCompanyAndCompanyList(currentUser, isSuperAdmin, undefined, function(company, companyList){

            companyUserCountGroupByPersonality = analyticsUtils.getCompanyUserCounts(company); // get user count map of each personality in the company
            analyticsUtils.getPersonalityCirclesData(currentUser, function (personalityCirclesData) {   // function to get donut graph data or call center data
                analyticsUtils.updateCircleSequenceIfNoPersonalityScoreFound(currentUser, personalityCirclesData, function(personalityCirclesData){
                    _.extend(context, analyticsUtils.getLeastTwoPersonalities(personalityCirclesData));
                    //   count of the user in company with the primary personality same as user's most understood personality
                    context.userLeastUnderstoodWorkstyleUsers = (companyUserCountGroupByPersonality && companyUserCountGroupByPersonality.all > 0 && context.userLeastUnderstoodWorkstyle) ? Math.round((companyUserCountGroupByPersonality[context.userLeastUnderstoodWorkstyle.toLowerCase()] / companyUserCountGroupByPersonality.all) * 100) : 0;
                    // explore page url for the personality
                    context.userLeastUnderstoodWorkstyleUrl = (context.userLeastUnderstoodWorkstyle) ? "explore." + context.userLeastUnderstoodWorkstyle.toLowerCase() : null;

                    // explore page url for the personality
                    context.userMostUnderstoodWorkstyleUrl = (context.userMostUnderstoodWorkstyle) ? "explore." + context.userMostUnderstoodWorkstyle.toLowerCase() : null;

                    // user's department's most common personality
                    context.teamMostCommonWorkstyle = analyticsUtils.getDepartmentMostCommonWorkstyle(department);
                    //   count of the user in company with the primary personality same as user's department's most common personality
                    context.teamMostCommonWorkstyleUsers = (companyUserCountGroupByPersonality && companyUserCountGroupByPersonality.all > 0 && context.teamMostCommonWorkstyle) ? Math.round((companyUserCountGroupByPersonality[context.teamMostCommonWorkstyle.toLowerCase()] / companyUserCountGroupByPersonality.all) * 100) : 0;
                    // explore page url for the personality
                    context.teamMostCommonWorkstyleUrlName = ((context.teamMostCommonWorkstyle) ? ("explore." + context.teamMostCommonWorkstyle.toLowerCase()) : null);
                    context.personalityThemeTextMap = analyticsConstants.PERSONALITY_THEME_TEXT_MAP;

                    companyLast8dayScore = (Array.isArray(company.get("last_8_day_pq_scores")) && company.get("last_8_day_pq_scores").length > 0) ? company.get("last_8_day_pq_scores") : [0, 0, 0, 0, 0, 0, 0, 0];
                    companyLast8DayUserCount = (Array.isArray(company.get("last_8_day_user_count")) && company.get("last_8_day_user_count").length > 0) ? company.get("last_8_day_user_count") : [0, 0, 0, 0, 0, 0, 0, 0];
                    departmentLast8dayScore = (Array.isArray(department.get("live_8_day_pq_scores")) && department.get("live_8_day_pq_scores").length > 0) ? department.get("live_8_day_pq_scores") : [0, 0, 0, 0, 0, 0, 0, 0];
                    departmentLast8DayUserCount = (Array.isArray(department.get("last_8_day_user_count")) && department.get("last_8_day_user_count").length > 0) ? department.get("last_8_day_user_count") : [0, 0, 0, 0, 0, 0, 0, 0];

                    context.company7DayGain = (companyLast8dayScore[companyLast8dayScore.length -1]) ? Math.round(((companyLast8dayScore[0] - companyLast8dayScore[companyLast8dayScore.length -1]) / companyLast8DayUserCount[0])): "---";
                    context.companyHigestPQScore = (typeof company.get("highest_pq_score") !== "undefined") ? company.get("highest_pq_score") : "---";
                    context.departmentHigestPQScore = (department && typeof department.get("highest_pq_score") !== "undefined") ? department.get("highest_pq_score") : "---";
                    context.companyHighestPQUser = (company.get("highest_pq_user")) ? company.get("highest_pq_user").get("first_name") + " " + company.get("highest_pq_user").get("last_name") : "";
                    context.departmentHighestPQUser = (department && department.get("highest_pq_user")) ? department.get("highest_pq_user").get("first_name") + " " + department.get("highest_pq_user").get("last_name") : "";
                    context.departmentAvgScore = (departmentLast8DayUserCount[0] > 0)? Math.round(departmentLast8dayScore[0] / departmentLast8DayUserCount[0]) : 0;
                    // gets user analytics graph data
                    analyticsUtils.getUserAnalyticsGraphData(currentUser, function(userPQGraphData){
                        // gets department analytics graph data
                        analyticsUtils.getDepartmentAnalyticsGraphData(department, function(departmentAvgPQGraphData){

                            // gets banner graph data of the current users department
                            bannerGraphData = analyticsUtils.getBannerGraphDepartmentData(department);
                            bannerGraphData.departmentName = department.get("name");

                            context.personalityCirclesData = personalityCirclesData;

                            if(req.xhr) {
                                // return user analytics page rendered partial
                                res.render("analytics/_user_analytics", _.extend({}, context, {
                                    layout: 'layout_partial'
                                }), function (error, html) {

                                    // returns user company and department title section on the banner graph
                                    res.render("analytics/_analytics_banner_header", {
                                        company: company,  // current company
                                        companyList: companyList,  // list of the companies
                                        layout: 'layout_partial',
                                        department: department    // user's department
                                    }, function (error, analyticsBannerHeader) {
                                        res.send({
                                            success: true,
                                            partial: html,
                                            analyticsView: "employee_view",
                                            analyticsBannerHeader: analyticsBannerHeader,
                                            isSuperAdmin: isSuperAdmin,
                                            options: {
                                                graph1data: userPQGraphData,
                                                graph2data: departmentAvgPQGraphData,
                                                userTrainedGraph: true,
                                                bannerGraphData: bannerGraphData,
                                                updatedUrl: updatedUrl
                                            }
                                        });
                                    });
                                });
                            }
                            else{
                                _.extend(context, {
                                    graph1data: userPQGraphData,
                                    graph2data: departmentAvgPQGraphData,
                                    userTrainedGraph: true,
                                    personalityGraphClassMap: leaderBoardConstants.PERSONALITY_GRAPH_CLASS,
                                    PERSONALITY_CLASS_MAP_FOR_WORKSTYLE_METRIC: analyticsConstants.PERSONALITY_CLASS_MAP_FOR_WORKSTYLE_METRIC,
                                    bannerGraphData: bannerGraphData,
                                    companyList: companyList,
                                    department: department,
                                    company: company,
                                    viewType: 'employee_view'
                                });
                                res.render("analytics/index.ejs", context);
                            }
                        }, req.errorCallback);
                    }, req.errorCallback);
                }, req.errorCallback);
            }, req.errorCallback);
        }, req.errorCallback);
    }, req.errorCallback);
};

// controller to display admin/executive analytics page
exports.accountOwnerAnalyticsController = function(req, res){
    var currentUser = req.currentUser,
        isAccountOwner = (userConstants.USER_PERMISSION_TYPE.ACCOUNT_OWNER === currentUser.get('permission_type')),
        isSuperAdmin = (userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === currentUser.get('permission_type')),
        companyId =  req.query.companyId || req.params.companyId || "", updatedUrl;
    if(isAccountOwner || isSuperAdmin){ // allow only account owner or super admin to view this page
        var userQuery = new Parse.Query(Parse.User);
        userQuery.include('department', 'company', 'company.most_understood_personality',  'company.least_understood_personality', 'company.highest_pq_user');
        userQuery.get(currentUser.id, {success: function(currentUser){ // fetch user with all foriengn key objects included
            // function to get company object of either of the current user company or requested company (if user is a super admin)
            // this function also returns list of all the companies if user is a super admin
            analyticsUtils.getCompanyAndCompanyList(currentUser, isSuperAdmin, companyId, function(company, companyList){
                var last8DayPQScores = company.get('last_8_day_pq_scores') || [], // array containing score for last 8 days
                    last8DayUserCount = company.get('last_8_day_user_count') || [], // array containing user count for last 8 days
                    companyPQScore = last8DayPQScores[0], // pq score for company calculated in last nightly job
                    companyUserCount = company.get('user_count'), // latest company user
                    userAssessed = analyticsUtils.getAssessedUsersInCompany(company), // get user assessed by summing user count from each personality
                    userInvited = company.get('invited_user_count'), // all user invited to a company
                    pqScore8Daysback = last8DayPQScores[7], // pq score of company 8 days back
                    userCount8Daysback = last8DayUserCount[7], // user count 8 days back
                    userCount1Daysback = last8DayUserCount[0]; // user count till last nightly job
                updatedUrl = req.app.namedRoutes.build('analytics.accountOwnerAnalyticsWithCompanyId', {companyId: company.id});
                var departmentsQuery = new Parse.Query('Department');
                departmentsQuery.equalTo('company', company);
                departmentsQuery.find({
                    success: function (companyDepartments) {

                        var topDefaultCompanyDepartments = null,
                            departmentData = companyUtils.getParentDepartmentListAndDepartmentMap(companyDepartments);
                        if (Array.isArray(departmentData.parentDepartmentList)) {
                            // sort company departments by their average pq
                            departmentData.parentDepartmentList = departmentData.parentDepartmentList.sort(function (deptA, deptB) {
                                var averageA = analyticsUtils.getDepartmentAveragePQ(deptA),
                                    averageB = analyticsUtils.getDepartmentAveragePQ(deptB);
                                if(deptA && deptB && typeof averageA === "number" && typeof averageB === "number"){
                                    return averageB - averageA;
                                }
                                else if(typeof averageA === "number"){
                                    return -1;
                                }
                                else if(typeof averageB === "number"){
                                    return 1;
                                }
                                else return 0;
                            });
                            topDefaultCompanyDepartments = departmentData.parentDepartmentList.slice(0, analyticsConstants.DEFAULT_DEPARTMENT_COUNT);
                        }
                        analyticsUtils.getDepartmentsAnalyticsGraphData(topDefaultCompanyDepartments, function (topDefaultDepartmentAnalyticsData) {
                            var context = {
                                companyDepartments: departmentData.parentDepartmentList,
                                company7DayGain: ((typeof companyPQScore === "number") && (typeof pqScore8Daysback === "number") && userCount1Daysback > 0) ?
                                    Math.round((companyPQScore - pqScore8Daysback) / userCount1Daysback) : null,
                                getDepartmentWeekOverWeekGrowth: analyticsUtils.getDepartmentWeekOverWeekGrowth,
                                getDepartment7DayGain: analyticsUtils.getDepartment7DayGain,
                                getDepartmentAveragePQ: analyticsUtils.getDepartmentAveragePQ,
                                getDepartmentUserTrainedThisWeekPercentage: analyticsUtils.getDepartmentUserTrainedThisWeekPercentage,
                                topDefaultDepartmentAnalyticsData: topDefaultDepartmentAnalyticsData,
                                colorsList: analyticsConstants.colorsList,
                                companyHighestPQScore: company.get('highest_pq_score'),
                                companyHighestPQUser: company.get('highest_pq_user'),
                                companyAveragePQScore: typeof userCount1Daysback === "number" && typeof companyPQScore === "number" && userCount1Daysback > 0 ? Math.round((companyPQScore / userCount1Daysback)) : null,
                                companyAveragePQGrowth: typeof companyPQScore === "number" && typeof userCount1Daysback === "number" &&
                                typeof userCount8Daysback === "number" && typeof pqScore8Daysback === "number" && userCount1Daysback > 0 && userCount8Daysback > 0 ?
                                    commonUtils.roundWithPrecision((((companyPQScore / userCount1Daysback) - (pqScore8Daysback / userCount8Daysback)) / (pqScore8Daysback / userCount8Daysback) * 100), 1) : null,
                                userAssessed: userAssessed || null,
                                userInvited: userInvited || null,
                                percentageInvitedUserAssessed: (typeof userInvited === "number" && userInvited > 0 ? (Math.round((userAssessed || 0) / userInvited * 100, 0)) : null),
                                trainedThisWeek: (typeof userAssessed === "number" && typeof company.get('user_trained_this_week') === "number" && !isNaN(userAssessed) && userAssessed > 0)
                                    ? (Math.round(company.get('user_trained_this_week') / userAssessed * 100)) : null,
                                leastUnderStoodWorkstyle: company.get('least_understood_personality'),
                                leastUnderStoodWorkstyleUserPercentage: (typeof companyUserCount === "number" && companyUserCount > 0 &&
                                company.get('least_understood_personality') &&
                                typeof company.get(company.get('least_understood_personality').get('name').toLowerCase() + '_count') === "number") ?
                                    Math.round(company.get(company.get('least_understood_personality').get('name').toLowerCase() + '_count') / companyUserCount * 100) : null,
                                mostUnderStoodWorkstyle: company.get('most_understood_personality'),
                                mostUnderStoodWorkstyleUserPercentage: (typeof companyUserCount === "number" && companyUserCount > 0 &&
                                company.get('most_understood_personality') &&
                                typeof company.get(company.get('most_understood_personality').get('name').toLowerCase() + '_count') === "number") ?
                                    Math.round(company.get(company.get('most_understood_personality').get('name').toLowerCase() + '_count') / companyUserCount * 100) : null,
                                PERSONALITY_CLASS_MAP_FOR_WORKSTYLE_METRIC: analyticsConstants.PERSONALITY_CLASS_MAP_FOR_WORKSTYLE_METRIC,
                                personalityGraphClassMap: leaderBoardConstants.PERSONALITY_GRAPH_CLASS
                            };

                            var companyBannerGraphData = analyticsUtils.getBannerGraphDepartmentData(company),
                                topAndLowestPerformingDepartmentsData = analyticsUtils.getLowestAndTopPerformingDepartmentAndWeeklyGain(departmentData.parentDepartmentList);

                            _.extend(context, topAndLowestPerformingDepartmentsData, departmentData);

                            if (req.xhr) {
                                context.layout = 'layout_partial';
                                res.render('analytics/_account_owner_analytics', context, function (error, html) {

                                    // returns user company and department title section on the banner graph
                                    res.render("analytics/_analytics_banner_header", {
                                        company: company,  // selected or current user company
                                        companyList: companyList,  // list of companies(if user is a super admin)
                                        layout: 'layout_partial'
                                    }, function (error, analyticsBannerHeader) {
                                        res.send({
                                            success: true,
                                            partial: html,
                                            analyticsView: 'account_owner_view',
                                            isSuperAdmin: isSuperAdmin,
                                            analyticsBannerHeader: analyticsBannerHeader,
                                            options: {
                                                updatedUrl: updatedUrl,
                                                bannerGraphData: companyBannerGraphData,
                                                topDefaultDepartmentAnalyticsData: topDefaultDepartmentAnalyticsData,
                                                topDefaultDepartments: Array.isArray(topDefaultCompanyDepartments) ? topDefaultCompanyDepartments.map(function (dpt) {
                                                    return {id: dpt.id, name: dpt.get('name')};
                                                }) : []
                                            }
                                        }); // send analytics partial to be loaded with ajax call
                                    });
                                });
                            }
                            else{
                                _.extend(context, {
                                    viewType: 'account_owner_view',
                                    company: company,
                                    companyList: companyList,
                                    bannerGraphData: companyBannerGraphData,
                                    topDefaultDepartmentAnalyticsData: topDefaultDepartmentAnalyticsData,
                                    topDefaultDepartments: Array.isArray(topDefaultCompanyDepartments) ? topDefaultCompanyDepartments.map(function (dpt) {
                                        return {id: dpt.id, name: dpt.get('name')};
                                    }) : []
                                });
                                res.render("analytics/index", context)
                            }
                        });
                    }, error: req.errorCallback
                });
            }, req.errorCallback);
        },
            error: req.errorCallback
        });
    }
    else{
        res.status(404).end(); // give out 404 for case where user is not account owner
    }
};

// controller to display supervisor analytics page
exports.supervisorAnalyticsController = function(req, res){


    function userWeekOverWeekGrowth(user){
        var last7DayPQScore = user.get('last_7_day_pq_scores');
        if (Array.isArray(last7DayPQScore) && typeof last7DayPQScore[6] === "number" && last7DayPQScore[6] > 0 && typeof user.get('pq_score') === "number") {
            return Math.round((user.get('pq_score') - last7DayPQScore[6]) * 100 / last7DayPQScore[6]) + '%';
        }
        else
            return "---";
    }
    var currentUser = req.currentUser,
        isSupervisor = (userConstants.USER_PERMISSION_TYPE.SUPERVISOR === currentUser.get('permission_type')),
        isAccountOwner = (userConstants.USER_PERMISSION_TYPE.ACCOUNT_OWNER === currentUser.get('permission_type')),
        isSuperAdmin = (userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === currentUser.get('permission_type'));
    if ((isSupervisor || isAccountOwner || isSuperAdmin) && currentUser.get('department')) { // not allow regular_user to view this page

        var departmentId = req.query.department_id || req.params.departmentId || currentUser.get('department').id,  // get the department id from request query params or url params if sent
            updatedUrl = req.app.namedRoutes.build('analytics.supervisorAnalyticsWithDepartmentId', {departmentId: departmentId});
        analyticsUtils.fetchDepartmentAfterVerification(req.currentUser, departmentId,
            ['company', 'most_understood_personality', 'least_understood_personality', 'highest_pq_user', 'most_improved_7_day_user', 'parent_department', 'subdepartments.most_improved_7_day_user'],
            function (department) { // successCallback
                analyticsUtils.getCompanyAndCompanyList(currentUser, isSuperAdmin, null, function(company, companyList) {

                    company = department.get('company');
                    var userAssessed = analyticsUtils.getAssessedUsersInDepartment(department), // get user assessed by summing user count from each personality
                        live8DayPQScores = department.get('live_8_day_pq_scores') || [], // array containing score for last 8 days of current users
                        last8DayUserCount = department.get('last_8_day_user_count') || [], // array containing user count for last 8 days
                        departmentPQScore = live8DayPQScores[0], // pq score for department calculated in last nightly job
                        departmentUserCount = department.get('user_count'), // latest department user
                        pqScore8Daysback = live8DayPQScores[7], // pq score of department 8 days back
                        userCount8Daysback = last8DayUserCount[7], // user count 8 days back
                        userCount1Daysback = last8DayUserCount[0], // user count till last nightly job
                        subDepartments = department.get('subdepartments'),
                        context = {
                            currentUser: currentUser,
                            department: department,
                            company: company,
                            teamRank: department.get('rank'),
                            rankPostfix: commonUtils.nth,
                            userWeekOverWeekGrowth: userWeekOverWeekGrowth,
                            departmentCount: department.get('parent_department')? ((department.get('parent_department').get('subdepartments') || {}).length || null) : company.get('department_count'),
                            team7DayPQGain: ((typeof departmentPQScore === "number") && (typeof pqScore8Daysback === "number") && userCount1Daysback > 0) ?
                                Math.round((departmentPQScore - pqScore8Daysback) / userCount1Daysback) : null,
                            departmentHighestPQScore: department.get('highest_pq_score'),
                            departmentHighestPQUser: department.get('highest_pq_user'),
                            departmentAveragePQScore: typeof userCount1Daysback === "number" && typeof departmentPQScore === "number" && userCount1Daysback > 0 ? Math.round((departmentPQScore / userCount1Daysback)) : null,
                            departmentAveragePQGrowth: typeof departmentPQScore === "number" && typeof userCount1Daysback === "number" &&
                            typeof pqScore8Daysback === "number" && userCount1Daysback > 0 ?
                                commonUtils.roundWithPrecision((((departmentPQScore / userCount1Daysback) - (pqScore8Daysback / userCount1Daysback)) / (pqScore8Daysback / userCount1Daysback) * 100), 1) : null,
                            userAssessed: userAssessed || null,
                            trainedThisWeek: (typeof userAssessed === "number" && typeof department.get('user_trained_this_week') === "number" && !isNaN(userAssessed) && userAssessed > 0)
                                ? (Math.round(department.get('user_trained_this_week') / userAssessed * 100)) : null,
                            leastUnderStoodWorkstyle: department.get('least_understood_personality'),
                            leastUnderStoodWorkstyleUserPercentage: (typeof departmentUserCount === "number" && departmentUserCount > 0 &&
                            department.get('least_understood_personality') &&
                            typeof department.get(department.get('least_understood_personality').get('name').toLowerCase() + '_count') === "number") ?
                                Math.round(department.get(department.get('least_understood_personality').get('name').toLowerCase() + '_count') / departmentUserCount * 100) : null,
                            mostUnderStoodWorkstyle: department.get('most_understood_personality'),
                            mostUnderStoodWorkstyleUserPercentage: (typeof departmentUserCount === "number" && departmentUserCount > 0 &&
                            department.get('most_understood_personality') &&
                            typeof department.get(department.get('most_understood_personality').get('name').toLowerCase() + '_count') === "number") ?
                                Math.round(department.get(department.get('most_understood_personality').get('name').toLowerCase() + '_count') / departmentUserCount * 100) : null,
                            topPerformerUser: department.get('highest_pq_user'),
                            best7DayGainUser: department.get('most_improved_7_day_user'),
                            best7DayGainUserScoreGain: typeof department.get('most_improved_7_day_user') !== "undefined" ? department.get('most_improved_7_day_user').get('last_7_day_pq_gain') : null,
                            PERSONALITY_CLASS_MAP_FOR_WORKSTYLE_METRIC: analyticsConstants.PERSONALITY_CLASS_MAP_FOR_WORKSTYLE_METRIC,
                            colorsList: analyticsConstants.colorsList,
                            personalityGraphClassMap: leaderBoardConstants.PERSONALITY_GRAPH_CLASS,
                            updatedUrl: updatedUrl
                        },
                        bannerGraphData = analyticsUtils.getBannerGraphDepartmentData(department);

                    bannerGraphData.departmentName = department.get("name");

                    if (!Array.isArray(subDepartments)) {
                        analyticsUtils.fetchDepartmentEmployees(department, 1, function (userList, employeePaginationData) {
                            // gets department analytics graph data
                            analyticsUtils.getCompanyAnalyticsGraphData([company], function (companyAnalyticsData) {
                                analyticsUtils.getDepartmentsAnalyticsGraphData([department], function (departmentAnalyticsData) {
                                    _.extend(context, {
                                        employeePaginationData: employeePaginationData,
                                        userList: userList
                                    });
                                    if(req.xhr) {  // if request as an ajax request
                                        context.layout = 'layout_partial';
                                        res.render('analytics/_supervisor_analytics', context, function (error, html) {
                                            res.render("analytics/_analytics_banner_header", {
                                                company: company,  // selected or current user company
                                                department: department,
                                                companyList: companyList,  // list of companies(if user is a super admin)
                                                layout: 'layout_partial',
                                                showBackLink: (isSuperAdmin || isAccountOwner || (isSupervisor && department.get('parent_department') !== undefined && department.get('parent_department').id === currentUser.get('department').id))
                                            }, function (error, analyticsBannerHeader) {
                                                res.send({
                                                    success: true,
                                                    partial: html,
                                                    analyticsView: 'supervisor_view',
                                                    isSuperAdmin: isSuperAdmin,
                                                    analyticsBannerHeader: analyticsBannerHeader,
                                                    options: {
                                                        updatedUrl: updatedUrl,
                                                        bannerGraphData: bannerGraphData,
                                                        departmentName: department.get('name'),
                                                        departmentAnalyticsGraphData: departmentAnalyticsData[department.id],
                                                        companyName: company.get('name'),
                                                        companyAnalyticsGraphData: companyAnalyticsData[company.id]
                                                    }
                                                }); // send analytics partial to be loaded with ajax call
                                            });
                                        });
                                    }
                                    else{  // if request is a get request
                                        _.extend(context, {
                                            companyList: companyList,
                                            viewType: 'supervisor_view',
                                            bannerGraphData: bannerGraphData,
                                            departmentAnalyticsGraphData: departmentAnalyticsData[department.id],
                                            departmentName: department.get('name'),
                                            companyName: company.get('name'),
                                            companyAnalyticsGraphData: companyAnalyticsData[company.id],
                                            showBackLink: (isSuperAdmin || isAccountOwner || (isSupervisor && department.get('parent_department') !== undefined && department.get('parent_department').id === currentUser.get('department').id))
                                        });
                                        res.render("analytics/index", context);
                                    }
                                }, req.errorCallback);
                            }, req.errorCallback);
                        }, req.errorCallback);
                    }
                    else {
                        var topDefaultDepartments = subDepartments.slice(0, analyticsConstants.DEFAULT_DEPARTMENT_COUNT);
                        analyticsUtils.getDepartmentsAnalyticsGraphData(topDefaultDepartments, function (topDefaultDepartmentAnalyticsData) {
                            var departmentData = companyUtils.getParentDepartmentListAndDepartmentMap(subDepartments),
                                topAndLowestPerformingDepartmentsData = analyticsUtils.getLowestAndTopPerformingDepartmentAndWeeklyGain(departmentData.parentDepartmentList);

                            _.extend(context, topAndLowestPerformingDepartmentsData, departmentData, {
                                topDefaultDepartmentAnalyticsData: topDefaultDepartmentAnalyticsData,
                                getDepartmentWeekOverWeekGrowth: analyticsUtils.getDepartmentWeekOverWeekGrowth,
                                getDepartmentAveragePQ: analyticsUtils.getDepartmentAveragePQ,
                                getDepartmentUserTrainedThisWeekPercentage: analyticsUtils.getDepartmentUserTrainedThisWeekPercentage

                            });
                            if (req.xhr) {   // if request is an ajax request
                                context.layout = 'layout_partial';
                                res.render('analytics/_supervisor_parent_department', context, function (error, html) {

                                    // returns user company and department title section on the banner graph
                                    res.render("analytics/_analytics_banner_header", {
                                        company: company,  // selected or current user company
                                        department: department,
                                        companyList: companyList,  // list of companies(if user is a super admin)
                                        layout: 'layout_partial',
                                        showBackLink: (isSuperAdmin || isAccountOwner || (isSupervisor && department.get('parent_department') !== undefined && department.get('parent_department').id == currentUser.get('department').id))
                                    }, function (error, analyticsBannerHeader) {
                                        res.send({
                                            success: true,
                                            partial: html,
                                            analyticsView: 'supervisor_parent_department_view',
                                            isSuperAdmin: isSuperAdmin,
                                            analyticsBannerHeader: analyticsBannerHeader,
                                            options: {
                                                updatedUrl: updatedUrl,
                                                bannerGraphData: bannerGraphData,
                                                topDefaultDepartmentAnalyticsData: topDefaultDepartmentAnalyticsData,
                                                topDefaultDepartments: Array.isArray(topDefaultDepartments) ? topDefaultDepartments.map(function (dpt) {
                                                    return {id: dpt.id, name: dpt.get('name')};
                                                }) : []
                                            }
                                        }); // send analytics partial to be loaded with ajax call
                                    });
                                });
                            }
                            else{  // if request is a get request

                                _.extend(context, {
                                    companyList: companyList,
                                    viewType: 'supervisor_parent_department_view',
                                    bannerGraphData: bannerGraphData,
                                    departmentName: department.get('name'),
                                    companyName: company.get('name'),
                                    showBackLink: (isSuperAdmin || isAccountOwner || (isSupervisor && department.get('parent_department') !== undefined && department.get('parent_department').id === currentUser.get('department').id)),
                                    topDefaultDepartmentAnalyticsData: topDefaultDepartmentAnalyticsData,
                                    topDefaultDepartments: Array.isArray(topDefaultDepartments) ? topDefaultDepartments.map(function (dpt) {
                                        return {id: dpt.id, name: dpt.get('name')};
                                    }) : []
                                });
                                res.render("analytics/index", context);
                            }
                        });
                    }
                }, req.errorCallback);
            }, req.errorCallback);
    }
    else{
        res.status(404).end(); // give out 404 for case where user is not supervisor
    }
};

exports.fetchEmployeesController = function(req, res){
    var page = req.query.page || 1;
    analyticsUtils.fetchDepartmentAfterVerification(req.currentUser, req.query.departmentId, null, function (department) { // successCallback
        analyticsUtils.fetchDepartmentEmployees(department, page, function (userList, employeePaginationData) {
            var context = {
                layout: 'layout_partial',
                userList: userList,
                employeePaginationData: employeePaginationData,
                userWeekOverWeekGrowth: function userWeekOverWeekGrowth(user) {
                    var last7DayPQScore = user.get('last_7_day_pq_scores');
                    if (Array.isArray(last7DayPQScore) && typeof last7DayPQScore[6] === "number" && last7DayPQScore[6] > 0 && typeof user.get('pq_score') === "number") {
                        return Math.round((user.get('pq_score') - last7DayPQScore[6])) + '%';
                    }
                    else
                        return "---";
                }
            };
            res.render('analytics/_department_employee_list', context);
        });
    }, function (error) { // errorCallback
        if (error && error.status && error.status === 404) {
            res.status(404).end();
        }
        else {
            req.errorCallback()
        }
    });
};

exports.departmentAnalyticsGraphDataController = function(req, res){
    if((userConstants.USER_PERMISSION_TYPE.ACCOUNT_OWNER === req.currentUser.get('permission_type') ||
        userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === req.currentUser.get('permission_type') ||
        userConstants.USER_PERMISSION_TYPE.SUPERVISOR === req.currentUser.get('permission_type')) &&
        req.query.departmentId){
        analyticsUtils.fetchDepartmentAfterVerification(req.currentUser, req.query.departmentId, null, function (department) {
            analyticsUtils.getDepartmentsAnalyticsGraphData([department],
                function (departmentAnalyticsData) {
                    res.send({success: true, departmentAnalyticsData: departmentAnalyticsData});
                },
                req.errorCallback
            );
        }, function (error) {
            if (error && error.status && error.status === 404) {
                res.status(404).end();
            }
            else {
                req.errorCallback()
            }
        });
    }
    else{
        res.status(404).end();
    }
};
