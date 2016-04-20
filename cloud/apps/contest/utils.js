var commonUtils = require('../common/utils.js'),
    commonConstants = require('../common/constants.js'),
    contestConstants = require('./constants.js'),
    appSettings = require('../../app_settings.js'),
    _ = require('underscore');


// function to get current running contest of the company, returns undefined if no contest is running right now
exports.getCompanyContest = function (companyId, includes, successCallback, errorCallback){
    includes = includes || null;
    var CompanyModel = Parse.Object.extend("Company"),
        companyObject = new CompanyModel(),
        contestQuery = new Parse.Query("Contest"),
        timeNow = new Date();
    companyObject.id = companyId;
    contestQuery.include("company");
    contestQuery.equalTo("company", companyObject);
    if(Array.isArray(includes)) {
        contestQuery.include.apply(contestQuery, includes);
    }
    contestQuery.greaterThan("end_date", timeNow);
    contestQuery.equalTo("is_canceled", false);
    contestQuery.first().then(successCallback, errorCallback);
};

exports.getContestDetailPartial = function(res, contest, successCallback, errorCallback){
    var context = {};
    context.contestHeading = (contest.get("text")) ? contest.get("text") : contestConstants.CONTEST_TYPE_DISPLAY_TEXT[contest.get("type")] || "";  // title of contest
    context.contestAward = (contest.get("award")) ? contest.get("award") : "";  // award of contest
    var contestEndDate = contest.get("end_date");  // end date of contest
    // convert time from UTC to EST for display
    commonUtils.addOffsetInDate((-1 * commonConstants.CST_TO_UTC_OFFSET), contestEndDate);
    context.formattedEndDate = commonUtils.formatDateInMMDDYYYFormat(contestEndDate);  // format the end date of contest in required format
    context.layout = "layout_partial";
    context.contestId = contest.id;
    // render contest detail div and send
    res.render("contest/_contest_detail_partial", context, function(error, renderedPartial){
        if(error){
            errorCallback();
        }
        else{
            successCallback(renderedPartial, context, contestEndDate);
        }
    });
};

exports.getNewContestFormPartial = function(res, successCallback, errorCallback){

    res.render("contest/_contest_form_partial",
        {
            layout: "layout_partial",
            top_pq: contestConstants.CONTEST_TYPE_KEYS.TOP_PQ_SCORE,
            top_7_day_pq: contestConstants.CONTEST_TYPE_KEYS.TOP_7_DAY_PQ_GAIN,
            other: contestConstants.CONTEST_TYPE_KEYS.OTHER,
            contestTextMaxLength: contestConstants.CONTEST_TEXT_MAX_LENGTH,
            contestAwardMaxLength: contestConstants.CONTEST_AWARD_MAX_LENGTH
        }, function(error, renderedPartial){
            if(error){
                errorCallback(error)
            }
            else{
                successCallback(renderedPartial)
            }
        }
    );
};

// function validates the sent contest data
exports.validateContestData = function(contestData){
    contestData.isDataValid = false;

    // if contest type is valid or not
    for(var key in contestConstants.CONTEST_TYPE_KEYS){
        contestData.isDataValid = contestData.isDataValid || (contestData.contestType === contestConstants.CONTEST_TYPE_KEYS[key]);
    }
    if(contestData.isDataValid){
        // if contest type is other then it has extra contest Text or not
        if(contestData.contestType === contestConstants.CONTEST_TYPE_KEYS.OTHER && (contestData.contestText === "" || contestData.contestText.length > contestConstants.CONTEST_TEXT_MAX_LENGTH)){
            contestData.isDataValid = false;
        }
        contestData.contestType = contestData.contestType;
    }
    else{
        contestData.isDataValid = false;
    }


    // if any award is set or not
    if(contestData.contestAward === "" || contestData.contestAward.length > contestConstants.CONTEST_AWARD_MAX_LENGTH){
        contestData.isDataValid = false;
    }

    validateAndConvertContestEndDateToUTC(contestData);
    return contestData
};

// function validates the contestEndDateString of contestData object and add contestEndDate(UTC converted date) in contest data object
function validateAndConvertContestEndDateToUTC(contestData){

    if(contestData.contestType  !== contestConstants.CONTEST_TYPE_KEYS.TOP_7_DAY_PQ_GAIN) {
        var dateStringRegex = /(\d{1,2}\/){2}\d{4}/;
        if (dateStringRegex.test(contestData.contestEndDateString)) {  // check if date string is is valid format or not
            var splittedDate = contestData.contestEndDateString.split("/"),// split day, month and year
                month = parseInt(splittedDate[0], 10) - 1,
                day = parseInt(splittedDate[1], 10),
                year = parseInt(splittedDate[2], 10);
            contestData.endDateYYYYDDMM = "";
            if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {  // check if day month and years are a number or not
                var contestEndDate = new Date(year, month, day, 23, 59, 59, 0),  // generate date by given moth day and year
                    today = new Date();
                setContestEndDateInteger(contestEndDate, contestData);
                // check if sent date is greater then time now and date is same as the sent is dateString
                if (contestEndDate.getTime() > today.getTime() && contestEndDate.getDate() == day && contestEndDate.getMonth() == month && contestEndDate.getFullYear() == year) {
                    commonUtils.addOffsetInDate((commonConstants.CST_TO_UTC_OFFSET), contestEndDate);
                    contestData.contestEndDate = contestEndDate;
                }
                else {
                    contestData.isDataValid = false;
                }

            }
            else {
                contestData.isDataValid = false;
            }
        }
        else {
            contestData.isDataValid = false;
        }
    }
    else{  // when contest type is top 7 day pq gain
        var dateAfterAWeek = new Date();  // fetch today's date
        commonUtils.addOffsetInDate((-1 * commonConstants.CST_TO_UTC_OFFSET), dateAfterAWeek);  // convert it ot EST
        // set time to 23:59:00
        dateAfterAWeek.setHours(23);
        dateAfterAWeek.setMinutes(59);
        dateAfterAWeek.setSeconds(59);
        dateAfterAWeek.setDate(dateAfterAWeek.getDate() + 7);  // add 7 days in date
        setContestEndDateInteger(dateAfterAWeek, contestData);
        commonUtils.addOffsetInDate((commonConstants.CST_TO_UTC_OFFSET), dateAfterAWeek);  // change it back to UTC
        contestData.contestEndDate = dateAfterAWeek;
    }
}


// function to initialize endDateYYYYDDMM in contest data
// it format date to an integer value in format YYYYMMDD
function setContestEndDateInteger(date, contestData){
    contestData.endDateYYYYDDMM = null;
    if(Object.prototype.toString.call(date) === '[object Date]'){
        contestData.endDateYYYYDDMM = date.getFullYear();
        contestData.endDateYYYYDDMM *= 100;
        contestData.endDateYYYYDDMM += (date.getMonth() + 1);
        contestData.endDateYYYYDDMM *= 100;
        contestData.endDateYYYYDDMM += date.getDate();
        if(!contestData.endDateYYYYDDMM){
            contestData.endDateYYYYDDMM = null;
        }
    }
}

// function to render contest announcement email
exports.renderContestAnnouncementEmail = function(res, contest, settings, successCallback, errorCallback){
    var context = {
            award : contest.get("award") || "",
            base_url: appSettings.PROTOCOL + appSettings.DOMAIN,  // base url for images and home page url
            analytics_url: appSettings.PROTOCOL + appSettings.DOMAIN + res.app.namedRoutes.build('leaderBoard.index'), // url to leaderboard
            contest_rules_url: appSettings.PROTOCOL + appSettings.DOMAIN + res.app.namedRoutes.build('contestRules') // url to contest rules
        }, templateId, contestEndDate = contest.get("end_date"),
        company = contest.get('company');
    commonUtils.addOffsetInDate((-1 * commonConstants.CST_TO_UTC_OFFSET), contestEndDate);
    context.end_date = getFormattedDateForEmailTemplate(contestEndDate);
    context.company_name = company.get("name");

    // set context and template name based on the type of contest
    switch(contest.get("type")) {

        case contestConstants.CONTEST_TYPE_KEYS.TOP_PQ_SCORE:
            templateId = settings[appSettings.PARDOT_EMAIL_TEMPLATE_NAME.TOP_PQ_SCORE];
            break;

        case contestConstants.CONTEST_TYPE_KEYS.TOP_7_DAY_PQ_GAIN:
            templateId = settings[appSettings.PARDOT_EMAIL_TEMPLATE_NAME.TOP_WEEKLY_GAIN];
            break;

        case contestConstants.CONTEST_TYPE_KEYS.OTHER:
            templateId = settings[appSettings.PARDOT_EMAIL_TEMPLATE_NAME.CUSTOM_CONTEST];
            context.contest_name = (contest.get("text")) ? contest.get("text") : "CUSTOM CONTEST";
            break;
    }
    commonUtils.fetchPardotApiKey(function(apiKey){
        commonUtils.readEmailTemplate(apiKey, templateId, function (html) {
            commonUtils.customRender(html, context, successCallback, errorCallback);
        }, errorCallback);
    }, errorCallback);
};

// function to return formatted date (eg: 03/01/2016 March 1ST)
function getFormattedDateForEmailTemplate(date){
    if(typeof date.getDate === "function") {
        var day = date.getDate(), numberPostfix = commonUtils.nth(day),
            hours = date.getHours(),
            minutes = date.getMinutes(),
            seconds = date.getSeconds(),
            timePostfix = (hours >= 12) ? "PM" : "AM";
        hours = (hours % 12 == 0) ? 12 : hours % 12;
        return commonConstants.MONTH_NAME_MAP[date.getMonth()].toUpperCase() + " " + date.getDate() + numberPostfix +","+ date.getFullYear() + " " + hours + ":" + minutes+":" + seconds + " " +timePostfix+ " CST";
    }
    else{
        return "";
    }
}

