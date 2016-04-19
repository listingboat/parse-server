// All controllers for contest app

var configs =require('./cloud/app_settings.js'),
    contestUtils = require('./cloud/apps/contest/utils.js'),
    commonUtils = require('./cloud/apps/common/utils.js'),
    analyticsUtils = require('./cloud/apps/analytics/utils.js'),
    _ = require('underscore'),
    appSettings = require('./cloud/app_settings.js'),
    contestConstants = require('./cloud/apps/contest/constants.js'),
    commonConstants = require('./cloud/apps/common/constants.js');

// controller to render contest page with the company drop down
exports.contestPageController = function(req, res){
    var currentUser = req.currentUser,
        context = {
            isAccountOwner: true,
            isSuperAdmin : true,    // true if user is super admin
            settingType: 'contest',    // show password setting page and highlights the password setting on nav bar
            user : currentUser,
            contactUS : configs.CONTACT_US_EMAIL    // email address for contact us button
        };

    // gets company list
    analyticsUtils.getCompanyAndCompanyList(currentUser, true, undefined, function(company, companyList){
        context.companyList = companyList;
        res.render('contest/index', context);
    }, req.errorCallback);

};

// controller to send contest detail or create contest form
exports.getCompanyContestController = function(req, res){
    var companyId = req.body.companyId;

    if(typeof companyId === "string" && companyId.trim() !== ""){ // check if company id is sent
        contestUtils.getCompanyContest(companyId, null, function (contest) {  // get running contest
            if (contest) {  // if contest found
                // get the contest detail partial
                contestUtils.getContestDetailPartial(res, contest, function (renderedPartial, partialContext, contestEndDate) {
                    partialContext.formattedEndDate = (contestEndDate.getMonth() + 1) + "/" + contestEndDate.getDate() + "/" + (contestEndDate.getFullYear());
                    partialContext.contestHeading += " Wins:";
                    res.send({success: true, contestFound: true, partial: renderedPartial, options: partialContext});
                }, req.errorCallback);
            }
            else {  // if no contest is running currently for selected company
                var datePickerStartDate = new Date();
                // change it to EST from UTC
                commonUtils.addOffsetInDate((-1 * commonConstants.CST_TO_UTC_OFFSET), datePickerStartDate);
                contestUtils.getNewContestFormPartial(res, function (renderedPartial) {
                    // send create new contest form
                    res.send({
                        success: true,
                        contestFound: false,
                        partial: renderedPartial,
                        datePickerStartDate: datePickerStartDate
                    });
                }, req.errorCallback);
            }
        }, req.errorCallback);
    }
    else{  // if no company id is sent
        res.status(404).send();
    }
};


// controller to create new contest
exports.createNewContestController = function(req, res){

    var contestData = {
        contestType: (typeof req.body.contestType === "string") ? req.body.contestType.trim().toLowerCase() : "",
        contestText: (typeof req.body.contestText === "string") ? req.body.contestText.trim() : "",
        contestEndDateString: (typeof req.body.contestEndDate === "string") ? req.body.contestEndDate : "",
        contestAward: (typeof req.body.contestAward === "string") ? req.body.contestAward.trim() : "",
        companyId: (typeof req.body.contestAward === "string") ? req.body.companyId.trim() : ""
    };

    contestUtils.validateContestData(contestData);   // validate contest data
    if(contestData.isDataValid){
        var companyQuery = new Parse.Query("Company");
        companyQuery.get(contestData.companyId).then(function(company){  // gets the company object
            if(company){  // if company found with id same as received company id

                // get running contest of the company
                contestUtils.getCompanyContest(contestData.companyId, null, function (runningContest) {
                    if (!runningContest) {  // if no running contest found

                        // creates new contest
                        var ContestModel = Parse.Object.extend("Contest"),
                            contestObject = new ContestModel();
                        contestObject.set("company", company);
                        contestObject.set("end_date", contestData.contestEndDate);
                        contestObject.set("type", contestData.contestType);
                        contestObject.set("award", contestData.contestAward);
                        contestObject.set("is_canceled", false);
                        if (contestData.contestType === contestConstants.CONTEST_TYPE_KEYS.OTHER) {
                            contestObject.set("text", contestData.contestText);
                        }
                        contestObject.set("end_date_yyyymmdd", contestData.endDateYYYYDDMM);  // saves end date Integer in format: YYYYMMDD

                        contestObject.save().then(function (contest) {
                            // render contest detail partial
                            contestUtils.getContestDetailPartial(res, contest, function (renderedPartial, partialContext, contestEndDate) {
                                partialContext.formattedEndDate = (contestEndDate.getMonth() + 1) + "/" + contestEndDate.getDate() + "/" + (contestEndDate.getFullYear());
                                partialContext.contestHeading += " Wins:";
                                res.send({success: true, partial: renderedPartial, options: _.extend({contestId: contest.id}, partialContext)});
                            }, req.errorCallback);
                        }, req.errorCallback);
                    }
                    else {
                        res.send({success: false, errorMessage: "Selected Company Already Has a Contest Running"});
                    }
                }, req.errorCallback)
            }
            else{
                res.send({success: false, errorMessage: "Invalid Company"});
            }
        }, req.errorCallback);
    }
    else{
        res.send({success: false, errorMessage: "Invalid Contest Data"});
    }
};

// controller to delete contest
exports.cancelContestController = function(req, res){
    var contestId = (typeof req.body.contestId === "string") ? req.body.contestId.trim() : "",
        companyId = (typeof req.body.companyId === "string") ? req.body.companyId.trim() : "";
    if(companyId !== "" && contestId !== ""){  // check if company and contest id's are sent

        contestUtils.getCompanyContest(companyId, null, function (contest) {  // get the current running contest of the company whose id is sent
            if (contest && contest.id === contestId) {  // if current running contest is found and it's id is same as the id we received
                contest.set("is_canceled", true);
                contest.save().then(function () {  // delete the contest
                    var datePickerStartDate = new Date();
                    // change it to EST from UTC
                    commonUtils.addOffsetInDate((-1 * commonConstants.CST_TO_UTC_OFFSET), datePickerStartDate);
                    contestUtils.getNewContestFormPartial(res, function (renderedPartial) {
                        // send create new contest form
                        res.send({
                            success: true,
                            contestFound: false,
                            partial: renderedPartial,
                            datePickerStartDate: datePickerStartDate
                        });
                    }, req.errorCallback);

                }, req.errorCallback);
            }
            else {
                res.send({success: false, errorMessage: "Invalid Contest"});
            }
        }, req.errorCallback);
    }
    else{
        res.send({success: false, errorMessage: "Invalid Contest"});
    }
};

exports.sendContestStartMailController = function (req, res) {
    var contestId = (typeof req.body.contestId === "string") ? req.body.contestId.trim() : "",
        companyId = (typeof req.body.companyId === "string") ? req.body.companyId.trim() : "", company;

    if (companyId !== "" && contestId !== "") {  // check if both contest and company id is sent
        contestUtils.getCompanyContest(companyId, null, function (contest) {  // get the current running contest of the company whose id is sent
            if (contest && contest.id === contestId) {  // match result contest id to the received contest id and check if they both are same or not
                company = contest.get("company");
                var companyPardotListId = (company.get("pardot_list_id")) ? parseInt(company.get("pardot_list_id")) : undefined;
                if (companyPardotListId && !isNaN(companyPardotListId)) {  // if company has pardot list
                        // Settings query to get campaign and email template id
                        var settingQuery = new Parse.Query("Settings");
                        settingQuery.containedIn("name", [
                            appSettings.CAMPAIGN,
                            appSettings.PARDOT_EMAIL_TEMPLATE_NAME.EMAIL_LAYOUT,
                            appSettings.PARDOT_EMAIL_TEMPLATE_NAME.TOP_PQ_SCORE,
                            appSettings.PARDOT_EMAIL_TEMPLATE_NAME.TOP_WEEKLY_GAIN,
                            appSettings.PARDOT_EMAIL_TEMPLATE_NAME.CUSTOM_CONTEST
                        ]);
                    settingQuery.find().then(function (settings) {
                        var settingsMap = {};

                        // maps the id's with name of the settings
                        for (var index in settings) {
                            settingsMap[settings[index].get("name")] = parseInt(settings[index].get("value"));
                        }
                        // render announcement template for the contest
                        contestUtils.renderContestAnnouncementEmail(res, contest, settingsMap, function (emailTemplate) {
                            commonUtils.fetchApiKeyAndSendMailToList({   // send email to the company list
                                list_ids: companyPardotListId,
                                campaign_id: settingsMap[appSettings.CAMPAIGN],
                                email_template_id: settingsMap[appSettings.PARDOT_EMAIL_TEMPLATE_NAME.EMAIL_LAYOUT],
                                html_content: emailTemplate,  // email template
                                from_email: "admin@workstyle.com",
                                from_name: "Workstyle",
                                name: "Contest: " + contestId + " Announcement Mail",
                                subject: "Workstyle Contest"
                            }, function () {
                                res.send({success: true});
                            }, req.errorCallback);
                        }, req.errorCallback);
                    }, function (error) {
                        res.send({success: false});
                    });
                }
                else {
                    res.send({success: false});
                }
            }
            else {
                res.send({success: false});
            }
        }, req.errorCallback);
    }
    else {
        res.send({success: false});

    }
};

exports.checkCompanyContestAndShowBannerController = function (req, res) {
    var currentUser = req.currentUser, response = {};

    function sendResponse(error, modalHtml) {
        if (error) {
            req.errorCallback(error);
        }
        else {
            response.modalHtml = modalHtml;
            response.success = true;
            res.send(response);
        }
    }

    function formatLongDate(date) {
        commonUtils.addOffsetInDate((-1 * commonConstants.CST_TO_UTC_OFFSET), date);
        var hours = date.getHours(),
            minutes = date.getMinutes(),
            seconds = date.getSeconds(),
            timePostfix = (hours >= 12) ? "PM" : "AM";
        hours = (hours % 12 == 0) ? 12 : hours % 12;
        return commonConstants.SHORT_MONTH_NAME_MAP[date.getMonth()] + ' ' + date.getDate() + ","+ date.getFullYear() + " " + hours + ":" + minutes+":" + seconds + " " +timePostfix+ " CST";
    }

 
    // updates company with the leading user of the contest
    function updateCompanyContestData(company, user, fieldName, successCallback, errorCallback){
        if(company && user && (!company.get(fieldName) || (company.get(fieldName) && company.get(fieldName).id !== user.id))){
            company.set(fieldName, user);
            if(fieldName === "highest_pq_user"){
                company.set("highest_pq_score", user.get("pq_score"));
            }
            company.save().then(successCallback, errorCallback);
        }
        else{
            successCallback()
        }
    }

    if (currentUser.get('company')) {
        contestUtils.getCompanyContest(currentUser.get('company').id, ['company', 'company.most_improved_7_day_user', 'company.highest_pq_user'],
            function (contest) {
                if (contest) {
                    response.contest_id = contest.id;
                    var context = {
                        formatedLongDate: formatLongDate(new Date(contest.get("end_date"))),
                        userWeeklyGain: analyticsUtils.getUserWeeklyGain,
                        currentUser: req.currentUser,
                        contest: contest,
                        layout: 'layout_partial'
                    }, company = contest.get("company");
                    switch (contest.get('type')) {
                        case contestConstants.CONTEST_TYPE_KEYS.TOP_PQ_SCORE:
                            var userQuery = new Parse.Query(Parse.User);
                            userQuery.equalTo("company", currentUser.get("company"));
                            userQuery.descending("pq_score");
                            userQuery.notEqualTo("is_deleted", true);  // exclude deleted user object
                            userQuery.first().then(function(user){
                                context.leadingUser = user;
                                updateCompanyContestData(company, user, "highest_pq_user", function(){
                                    res.render('contest/_banner_top_pq', context, function (error, bannerHtml) {
                                        if (!error) {
                                            response.bannerHtml = bannerHtml;
                                            res.render('contest/_top_pq_modal', context, sendResponse);
                                        }
                                        else {
                                            req.errorCallback(error);
                                        }
                                    });
                                }, req.errorCallback);
                            });
                            break;
                        case contestConstants.CONTEST_TYPE_KEYS.TOP_7_DAY_PQ_GAIN:
                            var userQuery = new Parse.Query(Parse.User);
                            userQuery.equalTo("company", currentUser.get("company"));
                            userQuery.descending("last_7_day_pq_gain");
                            userQuery.notEqualTo("is_deleted", true);  // exclude deleted user object
                            userQuery.first().then(function(user) {
                                context.leadingUser = user;
                                updateCompanyContestData(company, user, "most_improved_7_day_user", function(){
                                    res.render('contest/_banner_7_day_gain', context, function (error, bannerHtml) {
                                        if (!error) {
                                            response.bannerHtml = bannerHtml;
                                            res.render('contest/_top_7_day_gain_modal', context, sendResponse);
                                        }
                                        else {
                                            req.errorCallback(error);
                                        }
                                    });
                                }, req.errorCallback);
                            });
                            break;
                        case contestConstants.CONTEST_TYPE_KEYS.OTHER:
                            res.render('contest/_banner_other', context, function (error, bannerHtml) {
                                if (!error) {
                                    response.bannerHtml = bannerHtml;
                                    res.render('contest/_top_other_modal', context, sendResponse);
                                }
                                else {
                                    req.errorCallback(error);
                                }
                            });
                            break;
                        default:
                            req.errorCallback();
                            break;
                    }
                }
                else {
                    res.send({success: false});
                }
            }, req.errorCallback);
    }
    else {
        res.status(404).end();
    }
};

exports.contestRulesPageController = function (req, res) {
    res.render('contest/contest_rules');
};
