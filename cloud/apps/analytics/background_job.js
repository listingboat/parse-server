// All controllers for user app
var _ = require('underscore'),
    commonUtils = require('../common/utils.js'),
    analyticsUtils = require('./utils.js');



// background job for analytics
exports.analyticsBackgroundJob = function(req, res){

    function errorCallback(error) {
        error = JSON.stringify(error) || "";
        console.error((new Error()).stack);
        res.error(error)
    }

    Parse.Cloud.useMasterKey();    // to get permission to update user object
    var userQueryObject = new Parse.Query(Parse.User),
        userResponseQuery = new Parse.Query("User_Response"),
        objectToSave = [];

    userQueryObject.notEqualTo("is_deleted", true);
    userQueryObject.count().then(function (userCount) {   // query to get present user count
        commonUtils.getQueryResult({    // query to get all the users
            modelName: Parse.User,
            totalCount: userCount,
            conditions: [
                ["include", "call_data", "department", "company"],
                ["notEqualTo", "is_deleted", true]
            ]
        }, function (users) {
            analyticsUtils.updateMissingCallDataIdentifiers(users, function (users) {
                analyticsUtils.updateUserCallDataPointers(users, function (users) {
                    analyticsUtils.getLastAnalyticsJobStatus(function (analyticsJobStatusObject) {    // get the last analytics job date to carry further
                        var date = analyticsJobStatusObject.get("last_calculated_at");
                        date.setHours(0, 0, 0, 0);
                        date.setDate(date.getDate() + 1);
                        var analyticsTillDate = new Date();
                        analyticsTillDate.setDate(analyticsTillDate.getDate() - 1);  // responses till this date will be considered in analytics
                        analyticsTillDate.setHours(0, 0, 0, 0);
                        var pqScoreTillDate = new Date(analyticsTillDate);
                        pqScoreTillDate.setDate(pqScoreTillDate.getDate() + 2);  // responses will be fetch this date **should be greater than final date**
                        userResponseQuery.greaterThanOrEqualTo("createdAt", date);
                        userResponseQuery.lessThan("createdAt", pqScoreTillDate);
                        userResponseQuery.count().then(function (responseCount) {    // counts the responses created after last analytics job
                            commonUtils.getQueryResult(     // get all the responses after last analytics job
                                {
                                    modelName: "User_Response",
                                    conditions: [
                                        ["include", "user"],
                                        ["include", "question"],
                                        ["include", "question.difficulty"],
                                        ["lessThan", "createdAt", pqScoreTillDate]
                                    ],
                                    createdAfter: date,
                                    totalCount: responseCount
                                }, function (responses) {
                                    // forms new analytics objects and maps the current responses on day to day basis of user
                                    pqScoreTillDate.setDate(pqScoreTillDate.getDate() - 1);
                                    analyticsUtils.getAnalyticsDataAndUpdatedUserDepartmentAndCompany(users, responses, date, analyticsTillDate, pqScoreTillDate, function (analyticsData) {   // updates all the users using userAnalyticsMap
                                        objectToSave = objectToSave.concat(analyticsData.analyticsObjects);   // adds new analytics object for users in an array of object to be saved
                                        objectToSave = objectToSave.concat(analyticsData.users);  // adds updated user objects  in an array of object to be saved
                                        analyticsJobStatusObject.set("last_calculated_at", analyticsTillDate); // sets current analytics job date in Analytics_Job_Status table
                                        objectToSave.push(analyticsJobStatusObject);
                                        objectToSave = objectToSave.concat(analyticsData.departmentObjectsToSave);    // adds updated department object with the array to be saved
                                        objectToSave = objectToSave.concat(analyticsData.departmentAnalyticObjectsToSave);   // adds department analytics object with the array to be saved
                                        objectToSave = objectToSave.concat(analyticsData.companyObjectsToSave);   // adds updated company object with the array to be saved
                                        objectToSave = objectToSave.concat(analyticsData.companyAnalyticObjectsToSave);   // adds company analytics object with the array to be saved
                                        Parse.Object.saveAll(objectToSave).then(function () {    // saves all the objects
                                            res.success("OK");
                                        }, errorCallback);
                                    }, errorCallback);
                                }, errorCallback);
                        }, errorCallback);
                    }, errorCallback);
                }, errorCallback);
            }, errorCallback);
        }, errorCallback);
    }, errorCallback);
    commonUtils.makeFailSafePardotCall();
};

