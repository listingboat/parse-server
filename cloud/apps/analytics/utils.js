var _ = require('underscore'),
    commonUtils = require('../common/utils.js'),
    userUtils = require('../user/utils.js'),
    analyticsConstants = require('./constants.js'),
    userConstants = require('../user/constants.js');

// this function returns analytics objects and updated objects for user and department
exports.getAnalyticsDataAndUpdatedUserDepartmentAndCompany = function (users, responses, lastAnalyticsDate, analyticsTillDate, pqScoreTillDate, successCallback, errorCallback) {

    var departmentAnalyticsMap = {},   // analytics map for departments
        companyAnalyticsMap = {},   // analytics map for company
        finalDateAndLastAnalyticsDateGap;
    finalDateAndLastAnalyticsDateGap = commonUtils.getDateDifference(analyticsTillDate, lastAnalyticsDate) + 1;



    // function to sync user pq score with the latest pq score, and update last 7 day pq gain
    function updateUserPqScoreToLatest(userAnalyticsMap, user, analyticsTillDate, pqScoreTillDate){
        var last7DayPQScores = (Array.isArray(user.get("last_7_day_pq_scores"))) ? (user.get("last_7_day_pq_scores")).slice() : [0],
            last7DayPqGain = 0;
        user.set("pq_score", last7DayPQScores[0]);  // sets pq score to user's last analytics record score

        if(userAnalyticsMap[user.id]) {
            var endDate = new Date(pqScoreTillDate),
                startDate = new Date(analyticsTillDate);
            startDate.setDate(startDate.getDate() + 1);

            // check if user has attemptest any quiz after last analytics date and then update pq score
            while (startDate.getTime() <= endDate.getTime()) {
                if (userAnalyticsMap[user.id].data[startDate.getTime()]) {
                    user.set("pq_score", userAnalyticsMap[user.id].data[startDate.getTime()].pq)
                }
                last7DayPqGain = user.get("pq_score") - last7DayPQScores[last7DayPQScores.length - 1];
                last7DayPQScores.unshift(user.get("pq_score"));  // adds current day pq score
                last7DayPQScores = last7DayPQScores.slice(0, 7);      // removes the 8th day pq score
                startDate.setDate(startDate.getDate() + 1);
            }
            if(last7DayPqGain) {
                user.set("last_7_day_pq_gain", last7DayPqGain)
            }

        }
    }

    // function to set values in either department analytics map
    // departmentAnalyticsMap : map for department analytics
    // userDepartmentID : department id
    // thisDate : date of the record
    // pq : pq score on that date for the current department
    // dataChanged : if this flag is true then department analytic record for that date will be saved
    // trainedThisWeek: true if user has attempted any question in this week
    // user: user object
    function setDepartmentAnalyticsMapValue(data) {
        var analyticsDate = data.analyticsDate.getTime(),
            departmentAnalyticsMap = data.departmentAnalyticsMap,
            userDepartmentID = data.userDepartmentID,
            pq = data.pq,
            dataChanged = data.dataChanged,
            trainedThisWeek = data.trainedThisWeek,
            user = data.user,
            departmentsParentMap = data.departmentsParentMap;
        if (userDepartmentID) {    // if id is not undefined
            if (!departmentAnalyticsMap[userDepartmentID]) {
                departmentAnalyticsMap[userDepartmentID] = {
                    date: {},
                    highest_pq: {
                        score: Number.MIN_VALUE
                    },
                    lowest_pq: {
                        score: Number.MAX_VALUE
                    },
                    user_trained_this_week: []
                };
                departmentAnalyticsMap[userDepartmentID].date[analyticsDate] = {
                    userCount: 1,
                    dataChanged: dataChanged,
                    pq: pq
                }
            }
            else if (typeof departmentAnalyticsMap[userDepartmentID].date[analyticsDate] === "undefined") {    // when department record for given date doesn't exist
                departmentAnalyticsMap[userDepartmentID].date[analyticsDate] = {
                    userCount: 1,    // sets user count to one
                    dataChanged: dataChanged,
                    pq: pq
                };
            }
            else {
                departmentAnalyticsMap[userDepartmentID].date[analyticsDate].userCount++;
                departmentAnalyticsMap[userDepartmentID].date[analyticsDate].pq += pq;
                departmentAnalyticsMap[userDepartmentID].date[analyticsDate].dataChanged = departmentAnalyticsMap[userDepartmentID].date[analyticsDate].dataChanged || dataChanged;
            }

            if (commonUtils.getDateDifference(analyticsTillDate, new Date(analyticsDate)) <= 7 && trainedThisWeek) {
                departmentAnalyticsMap[userDepartmentID].user_trained_this_week.push(user.id);
            }
            if (user && user.get("pq_score") > departmentAnalyticsMap[userDepartmentID].highest_pq.score) {
                departmentAnalyticsMap[userDepartmentID].highest_pq.score = user.get("pq_score");
                departmentAnalyticsMap[userDepartmentID].highest_pq.user = user;
            }
            if (user && user.get("pq_score") < departmentAnalyticsMap[userDepartmentID].lowest_pq.score) {
                departmentAnalyticsMap[userDepartmentID].lowest_pq.score = user.get("pq_score");
                departmentAnalyticsMap[userDepartmentID].lowest_pq.user = user;
            }

            // if this department is a sub department of any department
            if(departmentsParentMap[userDepartmentID]){
                // add this data in it's parent department analytics map also
                setDepartmentAnalyticsMapValue({
                    departmentAnalyticsMap: departmentAnalyticsMap,
                    userDepartmentID: departmentsParentMap[userDepartmentID],  // parent department id
                    analyticsDate: data.analyticsDate,
                    pq: pq,
                    dataChanged: data.dataChanged,
                    trainedThisWeek: trainedThisWeek,
                    user: user,
                    departmentsParentMap : departmentsParentMap
                });
            }
        }
    }


    // function to set values in either company analytics map
    // companyAnalyticsMap : map for company analytics
    // userCompanyID : company id
    // thisDate : date of the record
    // pq : pq score on that date for the current department
    // dataChanged : if this flag is true then department analytic record for that date will be saved
    // trainedThisWeek: true if user has attempted any question in this week
    // user: user object
    function setCompanyAnalyticsMapValue(data) {
        var analyticsDate = data.analyticsDate.getTime(),
            companyAnalyticsMap = data.companyAnalyticsMap,
            userCompanyID = data.userCompanyID,
            pq = data.pq,
            dataChanged = data.dataChanged,
            trainedThisWeek = data.trainedThisWeek,
            user = data.user;
        if (userCompanyID) {    // if id is not undefined
            if (!companyAnalyticsMap[userCompanyID]) {
                companyAnalyticsMap[userCompanyID] = {
                    date: {},
                    highest_pq: {
                        score: Number.MIN_VALUE
                    },
                    lowest_pq: {
                        score: Number.MAX_VALUE
                    },
                    user_trained_this_week: []
                };
                companyAnalyticsMap[userCompanyID].date[analyticsDate] = {
                    userCount: 1,
                    dataChanged: dataChanged,
                    pq: pq
                }
            }
            else if (typeof companyAnalyticsMap[userCompanyID].date[analyticsDate] === "undefined") {    // when department record for given date doesn't exist
                companyAnalyticsMap[userCompanyID].date[analyticsDate] = {
                    userCount: 1,    // sets user count to one
                    dataChanged: dataChanged,
                    pq: pq
                };
            }
            else {
                companyAnalyticsMap[userCompanyID].date[analyticsDate].userCount++;
                companyAnalyticsMap[userCompanyID].date[analyticsDate].pq += pq;
                companyAnalyticsMap[userCompanyID].date[analyticsDate].dataChanged = companyAnalyticsMap[userCompanyID].date[analyticsDate].dataChanged || dataChanged;
            }

            if (commonUtils.getDateDifference(analyticsTillDate, new Date(analyticsDate)) <= 7 && trainedThisWeek) {
                companyAnalyticsMap[userCompanyID].user_trained_this_week.push(user.id);
            }
            if (user && user.get("pq_score") > companyAnalyticsMap[userCompanyID].highest_pq.score) {
                companyAnalyticsMap[userCompanyID].highest_pq.score = user.get("pq_score");
                companyAnalyticsMap[userCompanyID].highest_pq.user = user;
            }
            if (user && user.get("pq_score") < companyAnalyticsMap[userCompanyID].lowest_pq.score) {
                companyAnalyticsMap[userCompanyID].lowest_pq.score = user.get("pq_score");
                companyAnalyticsMap[userCompanyID].lowest_pq.user = user;
            }
        }
    }

    // function to update most improved 7 day user for given department id
    function updateDepartmentBest7dayPqUser(departmentId, user, departmentAnalyticsMap, departmentsParentMap){
        // compare previous best 7 day pq gain user of department to the best 7 day pq gain of the current user
        if((departmentId && departmentAnalyticsMap[departmentId]) && ((!departmentAnalyticsMap[departmentId].most_improved_7_day_user) || (departmentAnalyticsMap[departmentId].most_improved_7_day_user && departmentAnalyticsMap[departmentId].most_improved_7_day_user.get("last_7_day_pq_gain") < user.get("last_7_day_pq_gain") ))){
            departmentAnalyticsMap[departmentId].most_improved_7_day_user = user;  // replace the user if current user has greater last 7 day pq gain
            // if this department is a child department of any department then update it's parent department also
            if(departmentsParentMap[departmentId]){
                updateDepartmentBest7dayPqUser(departmentsParentMap[departmentId], user, departmentAnalyticsMap, departmentsParentMap);
            }
        }

    }

    // function to update most improved 7 day user for given company id
    function updateCompanyBest7dayPqUser(companyId, user, companyAnalyticsMap){
        // compare previous last 7 day pq gain user of company to the best 7 day pq gain of the current user
        if((companyId && companyAnalyticsMap[companyId]) && ((!companyAnalyticsMap[companyId].most_improved_7_day_user) || (companyAnalyticsMap[companyId].most_improved_7_day_user && companyAnalyticsMap[companyId].most_improved_7_day_user.get("last_7_day_pq_gain") < user.get("last_7_day_pq_gain") ))){
            companyAnalyticsMap[companyId].most_improved_7_day_user = user;  // replace the user if current user has greater best 7 day pq gain
        }

    }

    // updates user's department call data if user has call data
    function updateDepartmentCallData(user, department, departmentAnalyticsMap, departmentObjectsMap, departmentsParentMap){
        if(department && department.get("call_data_type") && user.get("call_data")){  // check if user has a department and user has call data
            var departmentId = department.id,
                callData = user.get("call_data"),
                personalityList = userConstants.PERSONALITY_LIST;
            if(departmentAnalyticsMap[departmentId] && !departmentAnalyticsMap[departmentId].callData){  // check if department has no call center data
                departmentAnalyticsMap[departmentId].callData = {};  // create initial call center data map for the department
                for(var personalityIndex in personalityList){
                    departmentAnalyticsMap[departmentId].callData[personalityList[personalityIndex].toLowerCase()] = {
                        score: 0,
                        count: 0,
                        userCount: 0
                    }
                }
            }
            // update call data of user department for each personality
            for(var personalityIndex in personalityList){
                var personalityCallDataObject = callData.get(personalityList[personalityIndex].toLowerCase() + "Metric");
                if(personalityCallDataObject && personalityCallDataObject.count >= userConstants.CALL_COUNT_THRESHOLD) {
                    departmentAnalyticsMap[departmentId].callData[personalityList[personalityIndex].toLowerCase()].score += (typeof parseInt(personalityCallDataObject.score) == "number") ? parseInt(personalityCallDataObject.score) : 0;
                    departmentAnalyticsMap[departmentId].callData[personalityList[personalityIndex].toLowerCase()].count += (parseInt(personalityCallDataObject.count));
                    departmentAnalyticsMap[departmentId].callData[personalityList[personalityIndex].toLowerCase()].userCount++;
                }
            }
        }

        // if this department is a child department of any department then update it's parent department also
        if(department && departmentsParentMap[department.id]){
            updateDepartmentCallData(user, departmentObjectsMap[departmentsParentMap[department.id]], departmentAnalyticsMap, departmentObjectsMap, departmentsParentMap);
        }
    }

    function updateDepartmentLive8DayPqScore(departmentAnalyticsMap, departmentsParentMap, userDepartmentID, live8DayScores) {
        if(!departmentAnalyticsMap[userDepartmentID]) {
            departmentAnalyticsMap[userDepartmentID] = {
                date: {},
                user_trained_this_week: [],
                live_8_day_pq_scores : [0, 0, 0, 0, 0, 0, 0, 0]
            };
        } else if (!departmentAnalyticsMap[userDepartmentID].live_8_day_pq_scores) {
            departmentAnalyticsMap[userDepartmentID].live_8_day_pq_scores = [0, 0, 0, 0, 0, 0, 0, 0];
        }

        for (var pqScoreIndex in live8DayScores) {
            departmentAnalyticsMap[userDepartmentID].live_8_day_pq_scores[pqScoreIndex] += live8DayScores[pqScoreIndex];
        }
        departmentAnalyticsMap[userDepartmentID].last_7_day_pq_gain = departmentAnalyticsMap[userDepartmentID].live_8_day_pq_scores[0] - departmentAnalyticsMap[userDepartmentID].live_8_day_pq_scores[7];

        if(departmentsParentMap[userDepartmentID]){
            updateDepartmentLive8DayPqScore(departmentAnalyticsMap, departmentsParentMap, departmentsParentMap[userDepartmentID], live8DayScores);
        }
    }

    // get departments objects, department objects map againest it's id and department parent's map
    exports.getDepartmentsAndParentDict(function(departmentObjects, departmentsParentMap, departmentObjectsMap){
        // returns user analytics data for the users using given responses
        exports.getUserAnalyticsData(responses, function(userAnalyticsData){
            var userQueryObject = new Parse.Query(Parse.User),
                userAnalyticsMap = userAnalyticsData.userAnalyticsMap;
            if (analyticsTillDate >= lastAnalyticsDate) {

                for (var userIndex in users) { // iterate each user
                    var user = users[userIndex],
                        userDepartmentID = (user.get("department")) ? user.get("department").id : undefined,
                        userCompanyID = (user.get("company")) ? user.get("company").id : undefined,
                        last7DayScores = user.get("last_7_day_pq_scores"),
                        best7DayScore = user.get("best_7_day_pq_gain") || 0,
                        currentStreak = user.get("current_streak") || 0,
                        longestStreak = user.get("longest_streak") || 0,
                        lastAnalyticsPqScore, pq7DayGain, trainedThisWeek, live8DayScores;

                    if (!last7DayScores || last7DayScores.length < analyticsConstants.DEFAULT_PQ_GAIN_ARRAY_SIZE) {
                        last7DayScores = [0, 0, 0, 0, 0, 0, 0];
                    }

                    lastAnalyticsPqScore = last7DayScores [0]; // last analytics job calculated pq for user
                    if (!userAnalyticsMap[user.id]) {   // if user has not attempted any question after last analytics job
                        pq7DayGain = lastAnalyticsPqScore;
                        currentStreak = (currentStreak > 0) ? 0 : currentStreak;  // set current streak to 0 if user's current streak of attempting quizes breaks
                        var userJoinedDate = user.createdAt;
                        userJoinedDate.setHours(0, 0, 0, 0);
                        if(userJoinedDate > analyticsTillDate.getTime()){
                            currentStreak = null;
                            var numOfDays = 0;
                        }
                        else if (userJoinedDate > lastAnalyticsDate) {     // if user joined after last analytics
                            currentStreak -= commonUtils.getDateDifference(analyticsTillDate, userJoinedDate);
                            var startDate = new Date(userJoinedDate),
                                numOfDays = commonUtils.getDateDifference(analyticsTillDate, startDate) + 1;
                        }
                        else {
                            currentStreak -= (finalDateAndLastAnalyticsDateGap);
                            var startDate = lastAnalyticsDate,
                                numOfDays = commonUtils.getDateDifference(analyticsTillDate, startDate) + 1;
                        }

                        for (var index = 0; index < numOfDays; index++) {
                            var analyticsDate = new Date(startDate);
                            analyticsDate.setDate(startDate.getDate() + index);
                            analyticsDate.setHours(0, 0, 0, 0);

                            // sets last 7 day pq
                            last7DayScores.unshift(last7DayScores[0]);
                            live8DayScores = _.clone(last7DayScores);
                            last7DayScores = last7DayScores.slice(0, 7);

                            // update the department analytics record for current date
                            trainedThisWeek = (currentStreak > -7 && longestStreak > 0);
                            if (analyticsDate.getTime() == userJoinedDate.getTime()) {  // sets dataChanged flag to true if user is created that day
                                setDepartmentAnalyticsMapValue(
                                    {
                                        departmentAnalyticsMap: departmentAnalyticsMap,
                                        userDepartmentID: userDepartmentID,
                                        analyticsDate: analyticsDate,
                                        pq: last7DayScores[0],
                                        dataChanged: true,
                                        trainedThisWeek: trainedThisWeek,
                                        user: user,
                                        departmentsParentMap : departmentsParentMap
                                    });
                                setCompanyAnalyticsMapValue({
                                    companyAnalyticsMap: companyAnalyticsMap,
                                    userCompanyID: userCompanyID,
                                    analyticsDate: analyticsDate,
                                    pq: last7DayScores[0],
                                    dataChanged: true,
                                    trainedThisWeek: trainedThisWeek,
                                    user: user
                                });
                            }
                            else {
                                setDepartmentAnalyticsMapValue({
                                    departmentAnalyticsMap: departmentAnalyticsMap,
                                    userDepartmentID: userDepartmentID,
                                    analyticsDate: analyticsDate,
                                    pq: last7DayScores[0],
                                    dataChanged: false,
                                    trainedThisWeek: trainedThisWeek,
                                    user: user,
                                    departmentsParentMap : departmentsParentMap
                                });
                                setCompanyAnalyticsMapValue({
                                    companyAnalyticsMap: companyAnalyticsMap,
                                    userCompanyID: userCompanyID,
                                    analyticsDate: analyticsDate,
                                    pq: last7DayScores[0],
                                    dataChanged: false,
                                    trainedThisWeek: trainedThisWeek,
                                    user: user
                                });
                            }
                        }
                    }
                    else {    // if user has attempted quiz
                        var pqScore = lastAnalyticsPqScore;
                        var userJoinedDate = user.createdAt, startDate, numOfDays;
                        userJoinedDate.setHours(0, 0, 0, 0);
                        if(userJoinedDate > analyticsTillDate){  // if user joined last analytics date
                            numOfDays = 0;
                        }
                        else if (userJoinedDate > lastAnalyticsDate) {    // if user joined after last analytics
                            startDate = new Date(userJoinedDate);
                            numOfDays = commonUtils.getDateDifference(analyticsTillDate, userJoinedDate);
                        }
                        else {
                            startDate = new Date(lastAnalyticsDate);
                            numOfDays = commonUtils.getDateDifference(analyticsTillDate, lastAnalyticsDate)
                        }


                        for (var index = 0; index <= numOfDays; index++) {
                            var analyticsDate = new Date(startDate.getTime());
                            analyticsDate.setDate(startDate.getDate() + index);
                            analyticsDate.setHours(0, 0, 0, 0);
                            if (userAnalyticsMap[user.id].data[analyticsDate.getTime()]) {  // if user has attempted quiz on current day
                                currentStreak = (currentStreak < 0) ? 1 : (currentStreak + 1);   // increment current streak if current streak is not -ve else set current streak to one
                                if (currentStreak > longestStreak) {
                                    longestStreak = currentStreak
                                }
                                pqScore = userAnalyticsMap[user.id].data[analyticsDate.getTime()].pq;
                                pq7DayGain = pqScore - last7DayScores[6];
                                last7DayScores.unshift(pqScore);  // adds current day pq score
                                live8DayScores = _.clone(last7DayScores);
                                last7DayScores = last7DayScores.slice(0, 7);      // removes the 8th day pq score
                                best7DayScore = (best7DayScore < pq7DayGain) ? pq7DayGain : best7DayScore;
                                trainedThisWeek = (currentStreak > -7 && longestStreak > 0);
                                setDepartmentAnalyticsMapValue({
                                    departmentAnalyticsMap: departmentAnalyticsMap,
                                    userDepartmentID: userDepartmentID,
                                    analyticsDate: analyticsDate,
                                    pq: last7DayScores[0],
                                    dataChanged: true,
                                    trainedThisWeek: trainedThisWeek,
                                    user: user,
                                    departmentsParentMap : departmentsParentMap
                                });

                                setCompanyAnalyticsMapValue({
                                    companyAnalyticsMap: companyAnalyticsMap,
                                    userCompanyID: userCompanyID,
                                    analyticsDate: analyticsDate,
                                    pq: last7DayScores[0],
                                    dataChanged: true,
                                    trainedThisWeek: trainedThisWeek,
                                    user: user
                                });
                            }
                            else {
                                currentStreak = (currentStreak > 0) ? -1 : (currentStreak - 1);
                                pq7DayGain = last7DayScores[0] - last7DayScores[6];
                                last7DayScores.unshift(last7DayScores[0]);  // adds current day pq score
                                live8DayScores = _.clone(last7DayScores);
                                last7DayScores = last7DayScores.slice(0, 7);      // removes the 8th day pq score
                                trainedThisWeek = (currentStreak > -7 && longestStreak > 0);
                                if (analyticsDate.getTime() == userJoinedDate.getTime()) {
                                    setDepartmentAnalyticsMapValue({
                                        departmentAnalyticsMap: departmentAnalyticsMap,
                                        userDepartmentID: userDepartmentID,
                                        analyticsDate: analyticsDate,
                                        pq: last7DayScores[0],
                                        dataChanged: true,
                                        trainedThisWeek: trainedThisWeek,
                                        user: user,
                                        departmentsParentMap : departmentsParentMap
                                    });
                                    setCompanyAnalyticsMapValue({
                                        companyAnalyticsMap: companyAnalyticsMap,
                                        userCompanyID: userCompanyID,
                                        analyticsDate: analyticsDate,
                                        pq: last7DayScores[0],
                                        dataChanged: true,
                                        trainedThisWeek: trainedThisWeek,
                                        user: user
                                    });
                                }
                                else {
                                    setDepartmentAnalyticsMapValue({
                                        departmentAnalyticsMap: departmentAnalyticsMap,
                                        userDepartmentID: userDepartmentID,
                                        analyticsDate: analyticsDate,
                                        pq: last7DayScores[0],
                                        dataChanged: false,
                                        trainedThisWeek: trainedThisWeek,
                                        user: user,
                                        departmentsParentMap : departmentsParentMap
                                    });

                                    setCompanyAnalyticsMapValue({
                                        companyAnalyticsMap: companyAnalyticsMap,
                                        userCompanyID: userCompanyID,
                                        analyticsDate: analyticsDate,
                                        pq: last7DayScores[0],
                                        dataChanged: false,
                                        trainedThisWeek: trainedThisWeek,
                                        user: user
                                    });
                                }
                            }
                        }
                    }

                    // Update the live 8 day department pq scores
                    updateDepartmentLive8DayPqScore(departmentAnalyticsMap, departmentsParentMap, userDepartmentID, live8DayScores);

                    // update department and parent department call dataa
                    updateDepartmentCallData(user, user.get("department"), departmentAnalyticsMap, departmentObjectsMap, departmentsParentMap);

                    var last7DayPqGain;
                    if (typeof user.get('pq_score') === 'number' && typeof last7DayScores[analyticsConstants.DEFAULT_PQ_GAIN_ARRAY_SIZE - 1] === 'number')
                        last7DayPqGain = user.get('pq_score') - last7DayScores[analyticsConstants.DEFAULT_PQ_GAIN_ARRAY_SIZE - 1];
                    else
                        last7DayPqGain = null;

                    user.set("current_streak", currentStreak);
                    user.set("longest_streak", longestStreak);
                    user.set("last_7_day_pq_scores", last7DayScores);
                    user.set("best_7_day_pq_gain", best7DayScore);
                    user.set("last_7_day_pq_gain", last7DayPqGain);

                    // update user pq score to the latest
                    updateUserPqScoreToLatest(userAnalyticsMap, user, analyticsTillDate, pqScoreTillDate);

                    //// compare previous best 7 day pq gain user of department to the best 7 day pq gain of the current user
                    updateDepartmentBest7dayPqUser(userDepartmentID, user, departmentAnalyticsMap, departmentsParentMap);

                    //// compare previous best 7 day pq gain user of company to the best 7 day pq gain of the current user
                    updateCompanyBest7dayPqUser(userCompanyID, user, companyAnalyticsMap);
                }
            }


            exports.getUsersPersonalityScores(users, function (personalityScores) {    // gets personality scores for the users
                exports.getDepartmentAnalyticsObjects(
                    {
                        departmentObjects: departmentObjects,
                        personalityScores: personalityScores,
                        departmentAnalyticsMap: departmentAnalyticsMap,
                        users: users,
                        lastAnalyticsDate: lastAnalyticsDate,
                        finalDate: analyticsTillDate,
                        departmentsParentMap: departmentsParentMap,
                        departmentObjectsMap: departmentObjectsMap
                    }, function (departmentAnalyticsData) { // update department and create department analytics object
                    exports.getCompanyAnalyticsObjects(personalityScores, companyAnalyticsMap, users, lastAnalyticsDate, analyticsTillDate, function (companyAnalyticsData) { // update department and create department analytics object
                        successCallback(_.extend({}, {
                            users: users,
                            departmentAnalyticsMap: departmentAnalyticsMap
                        }, departmentAnalyticsData, userAnalyticsData, companyAnalyticsData));
                    }, errorCallback);
                }, errorCallback);
            }, errorCallback);
        }, errorCallback);
    }, errorCallback);
};

// returns the date just after last analytics job date
exports.getLastAnalyticsJobStatus = function (successCallback, errorCallback) {
    var analyticsJobStatusQuery = new Parse.Query("Analytics_Job_Status");
    analyticsJobStatusQuery.descending("last_calculated_at");
    analyticsJobStatusQuery.first().then(function (lastUpdatedRecord) {
        if (lastUpdatedRecord) {
            successCallback(lastUpdatedRecord);
        }
        else {
            var AnalyticJobStatusModel = Parse.Object.extend("Analytics_Job_Status"),
                analyticJobStatusObjects = new AnalyticJobStatusModel();
            analyticJobStatusObjects.set("last_calculated_at", analyticsConstants.INITIAL_ANALYTICS_DATE);
            successCallback(analyticJobStatusObjects);
        }
    }, errorCallback);
};


// function create analytics object for user using given responses and return analytics objects array
exports.getUserAnalyticsData = function (responses, successCallback) {
    var today = new Date(),
        userAnalyticsMap = {},
        analyticObjectsToSave = [],
        UserAnalyticsModel = Parse.Object.extend("User_Analytics");
    today.setHours(0, 0, 0, 0);
    for (var responseIndex in responses) {
        var responseUser = responses[responseIndex].get("user"),    // user of current response
            responseDate = responses[responseIndex].createdAt;    // response creation date
        responseDate.setHours(0, 0, 0, 0);
        if (responseUser) {   // if user responses older than today
            if (!userAnalyticsMap[responseUser.id]) {   // if no record for user in map
                userAnalyticsMap[responseUser.id] = {};    // create object for user
                var last7dayPq = responseUser.get("last_7_day_pq_scores");
                if (!last7dayPq || last7dayPq.length == 0) {
                    var pq = 0
                }
                else {
                    var pq = last7dayPq[0];
                }
                userAnalyticsMap[responseUser.id] = {
                    pq: pq,
                    data: {}
                };
            }

            if (!userAnalyticsMap[responseUser.id].data[responseDate.getTime()]) {   // if for current date response recored doesn't exist
                var currentPq = userAnalyticsMap[responseUser.id].pq;
                userAnalyticsMap[responseUser.id].currentAnalyticsObject = new UserAnalyticsModel();   // new analytics object for user
                userAnalyticsMap[responseUser.id].date = responseDate;    // current date for user record
                userAnalyticsMap[responseUser.id].currentAnalyticsObject.set("user", responseUser);
                userAnalyticsMap[responseUser.id].currentAnalyticsObject.set("date", responseDate);
                userAnalyticsMap[responseUser.id].currentAnalyticsObject.set("pq_score", currentPq);
                userAnalyticsMap[responseUser.id].data[responseDate.getTime()] = {
                    pq: currentPq
                };

                if(responseDate < today) {  // put analytics object in save list only if it is older than today
                    analyticObjectsToSave.push(userAnalyticsMap[responseUser.id].currentAnalyticsObject);
                }
            }
            if (responses[responseIndex].get("is_correct")) {  // if response is correct
                userAnalyticsMap[responseUser.id].pq += (responses[responseIndex].get("is_applicable")) ? responses[responseIndex].get("question").get("difficulty").get("score") : 0;
                userAnalyticsMap[responseUser.id].data[responseDate.getTime()].pq += (responses[responseIndex].get("is_applicable")) ? responses[responseIndex].get("question").get("difficulty").get("score") : 0;
                userAnalyticsMap[responseUser.id].currentAnalyticsObject.set("pq_score", userAnalyticsMap[responseUser.id].pq);
            }
        }
    }
    successCallback({analyticsObjects: analyticObjectsToSave, userAnalyticsMap: userAnalyticsMap});
};

// function returns personality score for all the given users
exports.getUsersPersonalityScores = function (users, successCallback, errorCallback) {
    var userPersonalityScoreQuery = new Parse.Query("User_Personality_Score");
    userPersonalityScoreQuery.containedIn("user", users);
    userPersonalityScoreQuery.count().then(function (personalityScoresCount) {
        commonUtils.getQueryResult({
            modelName: "User_Personality_Score",
            conditions: [["include", "user"], ["include", "personality"], ["containedIn", "user", users]],
            totalCount: personalityScoresCount
        }, successCallback, errorCallback)
    }, errorCallback);
};

exports.getDepartmentsAndParentDict = function(successCallback, errorCallback){
    var departmentCountQuery = new Parse.Query("Department");
    departmentCountQuery.count().then(function (objectCount) { // query to get number of departments
        commonUtils.getQueryResult({   // query to get all the departments
            modelName: "Department",
             conditions: [["include", "subdepartments"]],
            totalCount: objectCount
        }, function (departmentObjects) {

            var departmentsParentsMap = {},
                departmentObjectsMap = {};
            for(var departmentIndex in departmentObjects){
                if(!departmentObjectsMap[departmentObjects[departmentIndex].id]){
                    departmentObjectsMap[departmentObjects[departmentIndex].id] = departmentObjects[departmentIndex];
                }
                var subDepartments = departmentObjects[departmentIndex].get("subdepartments");
                for(var subDepartmentIndex in subDepartments){
                    departmentsParentsMap[subDepartments[subDepartmentIndex].id] = departmentObjects[departmentIndex].id
                }
            }
            successCallback(departmentObjects, departmentsParentsMap, departmentObjectsMap);
        }, errorCallback);
    }, errorCallback);
};


// function returns new department analytics objects and updated department objects to save based on argument
exports.getDepartmentAnalyticsObjects = function (options, successCallback, errorCallback) {
    var departmentAnalyticObjectsToSave = [],
        departmentObjectsToSave = [],
        DepartmentAnalyticsModel = Parse.Object.extend("Department_Analytics"),
        departmentPQGroupedByCompany = {},   // map to save parent departments pq score against their id grouped by company
        subDepartmentPQGroupedByParentDepartment = {},  // map to save child department pq score grouped by their parent department
        departmentObjects = options.departmentObjects,  // list of department objects
        personalityScores = options.personalityScores,   // personality score objects of all the users
        departmentAnalyticsMap = options.departmentAnalyticsMap,  // departments analytics data map
        lastAnalyticsDate = options.lastAnalyticsDate,   // date when last analytics job was ran
        finalDate = options.finalDate,   // date till analytics job has to run
        departmentsParentMap = options.departmentsParentMap,    // map for department's parent id against department id
        departmentObjectsMap = options.departmentObjectsMap;   // map of department objects against their id


    // sets the last 8 day pq scores and user counts for the department objects in map departmentObjects
    for (var departmentIndex in departmentObjects) {
        var last8DayPqScores = departmentObjects[departmentIndex].get("last_8_day_pq_scores"),
            last8DayUserCounts = departmentObjects[departmentIndex].get("last_8_day_user_count");
        last8DayPqScores = (!last8DayPqScores || last8DayPqScores.length < 8) ? [0, 0, 0, 0, 0, 0, 0, 0] : last8DayPqScores;
        last8DayUserCounts = (!last8DayUserCounts || last8DayUserCounts.length < 8) ? [0, 0, 0, 0, 0, 0, 0, 0] : last8DayUserCounts;
        if (!departmentObjectsMap[departmentObjects[departmentIndex].id]) {
            departmentObjectsMap[departmentObjects[departmentIndex].id] = departmentObjects[departmentIndex];
        }
        departmentObjectsMap[departmentObjects[departmentIndex].id].set("last_8_day_pq_scores", last8DayPqScores);
        departmentObjectsMap[departmentObjects[departmentIndex].id].set("last_8_day_user_count", last8DayUserCounts);
        if(departmentObjects[departmentIndex].get("company")){
            if(!departmentsParentMap[departmentObjects[departmentIndex].id]) {
                if (!departmentPQGroupedByCompany[departmentObjects[departmentIndex].get("company").id]) {    // if object with company id doesn't exist in departmentPQGroupedByCompany
                    departmentPQGroupedByCompany[departmentObjects[departmentIndex].get("company").id] = {};   // create object with company id
                }
                departmentPQGroupedByCompany[departmentObjects[departmentIndex].get("company").id][departmentObjects[departmentIndex].id] = {
                    pq: last8DayPqScores[0],
                    departmentId: departmentObjects[departmentIndex].id
                };  // save department pq score and id in map
            }
            else{
                if (!subDepartmentPQGroupedByParentDepartment[departmentsParentMap[departmentObjects[departmentIndex].id]]) {    // if object with company id doesn't exist in departmentPQGroupedByCompany
                    subDepartmentPQGroupedByParentDepartment[departmentsParentMap[departmentObjects[departmentIndex].id]] = {};   // create object with company id
                }
                subDepartmentPQGroupedByParentDepartment[departmentsParentMap[departmentObjects[departmentIndex].id]][departmentObjects[departmentIndex].id] = {
                    pq: last8DayPqScores[0],
                    departmentId: departmentObjects[departmentIndex].id
                };  // save department pq score and id in map
            }
        }
    }

    userUtils.getPersonalityMap(function(personalityMap) {
        updateDepartmentPersonalityScores(personalityScores, departmentObjectsMap, departmentAnalyticsMap, personalityMap, departmentsParentMap);  // updates the department object's personality score
        // creates the department analytics object using departmentAnalyticsMap and updates the last 8 day pq score for every department or company
        for (var departmentId in departmentObjectsMap) {
            var companyID = (departmentObjectsMap[departmentId].get("company")) ? departmentObjectsMap[departmentId].get("company").id : undefined;
            // if department has any analytics record
            if (departmentAnalyticsMap[departmentId]) {   // if new analytics record exist for company or department
                var last8DayPqScores = departmentObjectsMap[departmentId].get("last_8_day_pq_scores") || [0, 0, 0, 0, 0, 0, 0, 0],
                    last8DayUserCounts = departmentObjectsMap[departmentId].get("last_8_day_user_count") || [0, 0, 0, 0, 0, 0, 0, 0],
                    startDate = new Date(lastAnalyticsDate);
                startDate.setHours(0, 0, 0, 0);
                while (startDate.getTime() <= finalDate.getTime()) {   // run through each date from last analytics
                    // if department  has analytics record of that date
                    if (departmentAnalyticsMap[departmentId].date[startDate.getTime()] && departmentAnalyticsMap[departmentId].date[startDate.getTime()].dataChanged) {
                        var departmentAnalyticObject = new DepartmentAnalyticsModel();
                        departmentAnalyticObject.set("department", departmentObjectsMap[departmentId]);
                        departmentAnalyticObject.set("pq_score", departmentAnalyticsMap[departmentId].date[startDate.getTime()].pq);
                        departmentAnalyticObject.set("user_count", departmentAnalyticsMap[departmentId].date[startDate.getTime()].userCount);
                        departmentAnalyticObject.set("date", new Date(startDate));
                        departmentAnalyticObjectsToSave.push(departmentAnalyticObject);
                    }
                    // if department has analytics record of that date then it's current pq will be the same as present date analytics record
                    if (departmentAnalyticsMap[departmentId].date[startDate.getTime()]) {
                        last8DayPqScores.unshift(departmentAnalyticsMap[departmentId].date[startDate.getTime()].pq);
                        last8DayUserCounts.unshift(departmentAnalyticsMap[departmentId].date[startDate.getTime()].userCount);
                    }
                    // otherwise last day score will also be it's present day score
                    else {
                        last8DayPqScores.unshift(last8DayPqScores[0]);
                        last8DayUserCounts.unshift(last8DayUserCounts[0]);
                    }
                    last8DayPqScores = last8DayPqScores.slice(0, 8);
                    last8DayUserCounts = last8DayUserCounts.slice(0, 8);
                    startDate.setDate(startDate.getDate() + 1);
                }

                // updates department object
                if (departmentAnalyticsMap[departmentId].highest_pq.user) {
                    departmentObjectsMap[departmentId].set("highest_pq_score", departmentAnalyticsMap[departmentId].highest_pq.score);
                    departmentObjectsMap[departmentId].set("highest_pq_user", departmentAnalyticsMap[departmentId].highest_pq.user);
                }
                if (departmentAnalyticsMap[departmentId].lowest_pq.user) {
                    departmentObjectsMap[departmentId].set("lowest_pq_score", departmentAnalyticsMap[departmentId].lowest_pq.score);
                    departmentObjectsMap[departmentId].set("lowest_pq_user", departmentAnalyticsMap[departmentId].lowest_pq.user);
                }
                if (departmentAnalyticsMap[departmentId].most_improved_7_day_user) {
                    departmentObjectsMap[departmentId].set("most_improved_7_day_user", departmentAnalyticsMap[departmentId].most_improved_7_day_user);
                }
                departmentObjectsMap[departmentId].set("user_trained_this_week", _.uniq(departmentAnalyticsMap[departmentId].user_trained_this_week).length);
                departmentObjectsMap[departmentId].set("last_8_day_pq_scores", last8DayPqScores);
                departmentObjectsMap[departmentId].set("last_8_day_user_count", last8DayUserCounts);
                departmentObjectsMap[departmentId].set("live_8_day_pq_scores", departmentAnalyticsMap[departmentId].live_8_day_pq_scores);
                departmentObjectsMap[departmentId].set("last_7_day_pq_gain", departmentAnalyticsMap[departmentId].last_7_day_pq_gain);
                if (!departmentsParentMap[departmentId] && companyID && departmentPQGroupedByCompany[companyID] && departmentPQGroupedByCompany[companyID][departmentId]) {
                    departmentPQGroupedByCompany[companyID][departmentId].pq = last8DayPqScores[0];   // update parent department score in department rank map
                }
                else if (departmentsParentMap[departmentId] && subDepartmentPQGroupedByParentDepartment[departmentsParentMap[departmentId]] && subDepartmentPQGroupedByParentDepartment[departmentsParentMap[departmentId]][departmentId]) {
                    subDepartmentPQGroupedByParentDepartment[departmentsParentMap[departmentId]][departmentId].pq = last8DayPqScores[0];   // update sub department score in department rank map
                }
            }
            departmentObjectsToSave.push(departmentObjectsMap[departmentId]);
        }


        for (var companyId in departmentPQGroupedByCompany) {  // iterate departments company wise
            var departmentRankArray = _.sortBy(departmentPQGroupedByCompany[companyId], function (companyDepartmentObject) {   // sore department of current company
                return -companyDepartmentObject.pq;
            });
            for (var rank in departmentRankArray) {   // update department rank
                departmentObjectsMap[departmentRankArray[rank].departmentId].set("rank", parseInt(rank) + 1);
            }
        }

        for (var parentDepartmentId in subDepartmentPQGroupedByParentDepartment) {  // iterate departments parent department wise
            var departmentRankArray = _.sortBy(subDepartmentPQGroupedByParentDepartment[parentDepartmentId], function (subDepartmentObject) {   // sore sub department of current parent department
                return -subDepartmentObject.pq;
            });
            for (var rank in departmentRankArray) {   // update sub department rank
                departmentObjectsMap[departmentRankArray[rank].departmentId].set("rank", parseInt(rank) + 1);
            }
        }

        successCallback({
            departmentObjectsToSave: departmentObjectsToSave,
            departmentAnalyticObjectsToSave: departmentAnalyticObjectsToSave
        });

    }, errorCallback);

};


// function returns new company analytics objects and updated company objects to save based on argument
exports.getCompanyAnalyticsObjects = function (personalityScores, companyAnalyticsMap, users, lastAnalyticsDate, finalDate,successCallback, errorCallback) {
    var companyObjectMap = {},     // map to save the department objects
        companyAnalyticObjectsToSave = [],
        companyObjectsToSave = [],
        CompanyAnalyticsModel = Parse.Object.extend("Company_Analytics");

    var companyCountQuery = new Parse.Query("Company");
    companyCountQuery.count().then(function (objectCount) { // query to get number of companies or departments
        commonUtils.getQueryResult({   // query to get all the companies or departments
            modelName: "Company",
            totalCount: objectCount
        }, function (companyObjects) {

            // sets the last 8 day pq scores and user counts for the department objects in map companyObjects
            for (var companyIndex in companyObjects) {
                var last8DayPqScores = companyObjects[companyIndex].get("last_8_day_pq_scores"),
                    last8DayUserCounts = companyObjects[companyIndex].get("last_8_day_user_count");
                last8DayPqScores = (!last8DayPqScores || last8DayPqScores.length < 8) ? [0, 0, 0, 0, 0, 0, 0, 0] : last8DayPqScores;
                last8DayUserCounts = (!last8DayUserCounts || last8DayUserCounts.length < 8) ? [0, 0, 0, 0, 0, 0, 0, 0] : last8DayUserCounts;
                if (!companyObjectMap[companyObjects[companyIndex].id]) {
                    companyObjectMap[companyObjects[companyIndex].id] = companyObjects[companyIndex];
                }
                companyObjectMap[companyObjects[companyIndex].id].set("last_8_day_pq_scores", last8DayPqScores);
                companyObjectMap[companyObjects[companyIndex].id].set("last_8_day_user_count", last8DayUserCounts);
            }

            updateCompanyPersonalityScores(personalityScores, companyObjectMap);   // updates the company object's most and least understood personality

            // creates the company analytics object using companyAnalyticsMap and updates the last 8 day pq score for every department or company
            for (var companyId in companyObjectMap) {

                // if department has any analytics record
                if (companyAnalyticsMap[companyId]) {   // if new analytics record exist for company
                    var last8DayPqScores = companyObjectMap[companyId].get("last_8_day_pq_scores") || [0, 0, 0, 0, 0, 0, 0, 0],
                        last8DayUserCounts = companyObjectMap[companyId].get("last_8_day_user_count") || [0, 0, 0, 0, 0, 0, 0, 0],
                        startDate = new Date(lastAnalyticsDate);
                    startDate.setHours(0, 0, 0, 0);
                    while (startDate.getTime() <= finalDate.getTime()) {   // run through each date from last analytics
                        // if company has analytics record of that date
                        if (companyAnalyticsMap[companyId].date[startDate.getTime()] && companyAnalyticsMap[companyId].date[startDate.getTime()].dataChanged) {
                            //var companyAnalyticObject = new DepartmentAnalyticsModel();

                            var companyAnalyticObject = new CompanyAnalyticsModel();
                            companyAnalyticObject.set("company", companyObjectMap[companyId]);
                            companyAnalyticObject.set("pq_score", companyAnalyticsMap[companyId].date[startDate.getTime()].pq);
                            companyAnalyticObject.set("user_count", companyAnalyticsMap[companyId].date[startDate.getTime()].userCount);
                            companyAnalyticObject.set("date", new Date(parseInt(startDate.getTime())));
                            companyAnalyticObjectsToSave.push(companyAnalyticObject);
                        }
                        // if company has analytics record of that date then it's current pq will b same as present date analytics record
                        if (companyAnalyticsMap[companyId].date[startDate.getTime()]) {
                            last8DayPqScores.unshift(companyAnalyticsMap[companyId].date[startDate.getTime()].pq);
                            last8DayUserCounts.unshift(companyAnalyticsMap[companyId].date[startDate.getTime()].userCount);
                        }
                        // otherwise last day score will also be it's present day score
                        else {
                            last8DayPqScores.unshift(last8DayPqScores[0]);
                            last8DayUserCounts.unshift(last8DayUserCounts[0]);
                        }
                        last8DayPqScores = last8DayPqScores.slice(0, 8);
                        last8DayUserCounts = last8DayUserCounts.slice(0, 8);
                        startDate.setDate(startDate.getDate() + 1);
                    }

                    // updates department object
                    if (companyAnalyticsMap[companyId].highest_pq.user) {
                        companyObjectMap[companyId].set("highest_pq_score", companyAnalyticsMap[companyId].highest_pq.score);
                        companyObjectMap[companyId].set("highest_pq_user", companyAnalyticsMap[companyId].highest_pq.user);
                    }
                    if (companyAnalyticsMap[companyId].lowest_pq.user) {
                        companyObjectMap[companyId].set("lowest_pq_score", companyAnalyticsMap[companyId].lowest_pq.score);
                        companyObjectMap[companyId].set("lowest_pq_user", companyAnalyticsMap[companyId].lowest_pq.user);
                    }

                    if (companyAnalyticsMap[companyId].most_improved_7_day_user) {
                        companyObjectMap[companyId].set("most_improved_7_day_user", companyAnalyticsMap[companyId].most_improved_7_day_user);
                    }
                    companyObjectMap[companyId].set("user_trained_this_week", _.uniq(companyAnalyticsMap[companyId].user_trained_this_week).length);
                    companyObjectMap[companyId].set("last_8_day_pq_scores", last8DayPqScores);
                    companyObjectMap[companyId].set("last_8_day_user_count", last8DayUserCounts);
                }
                 companyObjectsToSave.push(companyObjectMap[companyId]);
            }


            successCallback({
                companyObjectsToSave: companyObjectsToSave,
                companyAnalyticObjectsToSave: companyAnalyticObjectsToSave
            });

        }, errorCallback);
    }, errorCallback);
};

// function to update department's most, least understood personality with  if call data scores for that personality id department is call center department
function updateDepartmentPersonalityScores(personalityScores, departmentObjectsMap, departmentAnalyticsMap, personalityMap, departmentsParentMap) {
    var scoresGroupedByDepartment,
        personalityScoreMap = {};
    // groups the personality score object department wise
    scoresGroupedByDepartment = _.groupBy(personalityScores, function (personalityScoreObject) {
        if (personalityScoreObject.get("user") && personalityScoreObject.get("user").get("department")) {
            return personalityScoreObject.get("user").get("department").id
        }
        else {
            return undefined
        }
    });
    delete scoresGroupedByDepartment["undefined"];    // deletes the personality score of the users with no department


    // iterate departments and generate personality score map for non call center department
    for (var departmentKey in departmentObjectsMap) {

        // flag to indicate that parent department of the current department is need to be updated or not
        // if current department has a parent and parent is a non call center department then this flag will be true
        var updateParentDepartment = (typeof departmentsParentMap[departmentKey] !== "undefined" && departmentAnalyticsMap[departmentsParentMap[departmentKey]] && !departmentAnalyticsMap[departmentsParentMap[departmentKey]].callData),
            parentDepartmentKey = departmentsParentMap[departmentKey];

        // if department socre is found and department is a non call center department
        if (departmentAnalyticsMap[departmentKey] && !departmentAnalyticsMap[departmentKey].callData && scoresGroupedByDepartment[departmentKey]) {

            // iterate personality scores for each personality
            if (!personalityScoreMap[departmentKey]) {
                personalityScoreMap[departmentKey] = {};
                if (updateParentDepartment) {
                    personalityScoreMap[parentDepartmentKey] = {}
                }
            }
            for (var personalityScoreIndex in scoresGroupedByDepartment[departmentKey]) {
                var personalityName = scoresGroupedByDepartment[departmentKey][personalityScoreIndex].get("personality").get("name").toLowerCase();
                if (!personalityScoreMap[departmentKey][personalityName]) {
                    personalityScoreMap[departmentKey][personalityName] = {
                        score: 0,
                        personalityObject: scoresGroupedByDepartment[departmentKey][personalityScoreIndex].get("personality")
                    }
                }
                if (scoresGroupedByDepartment[departmentKey][personalityScoreIndex].get("score")) {
                    personalityScoreMap[departmentKey][personalityName].score += scoresGroupedByDepartment[departmentKey][personalityScoreIndex].get("score");

                    // if need to update parent department too
                    if (updateParentDepartment) {
                        if (!personalityScoreMap[parentDepartmentKey][personalityName]) {
                            personalityScoreMap[parentDepartmentKey][personalityName] = {  // create parent department score object if not exist
                                score: 0,
                                personalityObject: scoresGroupedByDepartment[departmentKey][personalityScoreIndex].get("personality")
                            }
                        }
                        // update score
                        personalityScoreMap[parentDepartmentKey][personalityName].score += scoresGroupedByDepartment[departmentKey][personalityScoreIndex].get("score");
                    }
                }
            }
        }
    }


    // update personality score and sets most and least understood personality for each department
    for (var departmentKey in departmentObjectsMap) {

        // if department has call center data
        if (departmentAnalyticsMap[departmentKey] && departmentAnalyticsMap[departmentKey].callData) {

            var mostUnderstoodPersonalityCallDataScore = Number.MAX_VALUE,  // max call duration means least understood personality
                leastUnderstoodPersonalityCallDataScore = Number.MIN_VALUE,  // min call duration means most understood personality
                mostUnderstoodPersonalityObject, leastUnderstoodPersonalityObject;
            for (var personality in departmentAnalyticsMap[departmentKey].callData) {  // find most and least understood personality and it's call data score
                var personalityCallDataScore = departmentAnalyticsMap[departmentKey].callData[personality].score / departmentAnalyticsMap[departmentKey].callData[personality].userCount,
                    personalityCallDataUserCount = departmentAnalyticsMap[departmentKey].callData[personality].userCount;

                if (personalityCallDataScore < mostUnderstoodPersonalityCallDataScore) {
                    mostUnderstoodPersonalityCallDataScore = personalityCallDataScore;
                    mostUnderstoodPersonalityObject = personalityMap[personality];
                }
                if (personalityCallDataUserCount > 0 && personalityCallDataScore > leastUnderstoodPersonalityCallDataScore) {
                    leastUnderstoodPersonalityCallDataScore = personalityCallDataScore;
                    leastUnderstoodPersonalityObject = personalityMap[personality];
                }
            }

            departmentObjectsMap[departmentKey].set("most_understood_personality", mostUnderstoodPersonalityObject);   // sets most understood personality
            // call data score for most understood personality
            departmentObjectsMap[departmentKey].set("most_understood_personality_call_data_score", Math.round(mostUnderstoodPersonalityCallDataScore));

            departmentObjectsMap[departmentKey].set("least_understood_personality", leastUnderstoodPersonalityObject);   // sets least understood personality
            // call data for the least understood personality
            departmentObjectsMap[departmentKey].set("least_understood_personality_call_data_score", Math.round(leastUnderstoodPersonalityCallDataScore));

        }
        // if department is a non call center department
        else if (personalityScoreMap[departmentKey]) {
            var mostUnderstoodPersonalityCallDataScore = Number.MIN_VALUE,  // max call duration means least understood personality
                leastUnderstoodPersonalityCallDataScore = Number.MAX_VALUE,  // min call duration means most understood personality
                mostUnderstoodPersonalityObject, leastUnderstoodPersonalityObject;
            for (var personalityScoreIndex in personalityScoreMap[departmentKey]) {
                var personalityScore = personalityScoreMap[departmentKey][personalityScoreIndex].score;
                if (personalityScore > mostUnderstoodPersonalityCallDataScore) {
                    mostUnderstoodPersonalityCallDataScore = personalityScore;
                    mostUnderstoodPersonalityObject = personalityScoreMap[departmentKey][personalityScoreIndex].personalityObject;
                }
                if (personalityScore < leastUnderstoodPersonalityCallDataScore) {
                    leastUnderstoodPersonalityCallDataScore = personalityScore;
                    leastUnderstoodPersonalityObject = personalityScoreMap[departmentKey][personalityScoreIndex].personalityObject;
                }
            }
            departmentObjectsMap[departmentKey].set("most_understood_personality", mostUnderstoodPersonalityObject);   // sets most understood personality
            // call data score for most understood personality
            departmentObjectsMap[departmentKey].set("most_understood_personality_call_data_score", null);


            departmentObjectsMap[departmentKey].set("least_understood_personality", leastUnderstoodPersonalityObject);   // sets least understood personality
            // call data for the least understood personality
            departmentObjectsMap[departmentKey].set("least_understood_personality_call_data_score", null);

        }
    }
}


function updateCompanyPersonalityScores(personalityScores, companyObjects) {
    var scoresGroupedByCompany,
        CompanyModel = Parse.Object.extend("Department");

    //groups the personality score object company wise
    scoresGroupedByCompany = _.groupBy(personalityScores, function (personalityScoreObject) {
        if (personalityScoreObject.get("user") && personalityScoreObject.get("user").get("company")) {
            return personalityScoreObject.get("user").get("company").id
        }
        else {
            return undefined
        }
    });
    delete scoresGroupedByCompany["undefined"];    // deletes the personality score of the users with no department

    // calculate the each personality score for the companies and update company objects
    for (var companyKey in scoresGroupedByCompany) {
        var personalityScoreMap = {};
        // iterate personality scores for each personality and saves total score for each personalty in a map
        for (var personalityScoreIndex in scoresGroupedByCompany[companyKey]) {
            var personalityName = scoresGroupedByCompany[companyKey][personalityScoreIndex].get("personality").get("name").toLowerCase();
            if (!personalityScoreMap[personalityName]) {
                personalityScoreMap[personalityName] = {
                    score: 0,
                    personalityObject: scoresGroupedByCompany[companyKey][personalityScoreIndex].get("personality")
                }
            }
            if (scoresGroupedByCompany[companyKey][personalityScoreIndex].get("score")) {
                personalityScoreMap[personalityName].score += scoresGroupedByCompany[companyKey][personalityScoreIndex].get("score");
            }
        }

        if (companyObjects[companyKey]) {
            var mostUnderstoodPersonalityScore = Number.MIN_VALUE,
                leastUnderstoodPersonalityScore = Number.MAX_VALUE;
            // sets most and least understood personality in company object
            for (var personalityName in personalityScoreMap) {
                if (personalityScoreMap[personalityName].score > mostUnderstoodPersonalityScore) {
                    mostUnderstoodPersonalityScore = personalityScoreMap[personalityName].score;
                    companyObjects[companyKey].set("most_understood_personality", personalityScoreMap[personalityName].personalityObject)
                }
                if (personalityScoreMap[personalityName].score < leastUnderstoodPersonalityScore) {
                    leastUnderstoodPersonalityScore = personalityScoreMap[personalityName].score
                    companyObjects[companyKey].set("least_understood_personality", personalityScoreMap[personalityName].personalityObject)
                }
            }
        }
    }
}

// function returns donut graph data of for the user those are not assosiated with call center department
// returns call center data for the employee those have call center department
// it returns an array of object in that each object is for a personality in descending order of the score and a flag to employee is assosiated with call center data or not and is mising PBR data or not
exports.getPersonalityCirclesData = function (user, successCallback, errorCallback) {

    // if user is employee of an call center department
    if (user.get("department") && user.get("department").get("call_data_type")) {

        // TODO: We need to modify logic to modify to verify phone Id, identifier source, company name with and call_data_type id before usage of user.get('call_data').
        var userPhoneId = user.get("phoneId"),
            userIdentifierSource = user.get("identifierSource");

        // if user has valid PBR data
        if (typeof userPhoneId === "string" && typeof userIdentifierSource === "string" && userPhoneId.trim() !== "" && userIdentifierSource.trim() !== "") {
            var callData = [], callCenterDataObject = user.get("call_data"), insufficientDataList = [];
            for (var personalityIndex in userConstants.PERSONALITY_LIST) {

                // sets personalityCallDataScore to undefined if user is missing call data object
                var personalityCallDataScore = (callCenterDataObject) ? callCenterDataObject.get(userConstants.PERSONALITY_LIST[personalityIndex].toLowerCase() + "Metric") : undefined,

                    // sets this flag to true if personality score object has count and score in valid format and count of personalityScore crosses the threshold
                    isDataSufficient = (personalityCallDataScore && parseInt(personalityCallDataScore.count) >= userConstants.CALL_COUNT_THRESHOLD && !isNaN(parseInt(personalityCallDataScore.score)));
                if (!isDataSufficient) {  // if data is insufficient for current personality
                    insufficientDataList.push({
                        name: userConstants.PERSONALITY_LIST[personalityIndex],
                        personalityClass: analyticsConstants.PERSONALITY_CLASS_MAP_FOR_CALL_CENTER_DATA[userConstants.PERSONALITY_LIST[personalityIndex].toLowerCase()],
                        isDataInsufficient: isDataSufficient
                    });
                }
                else {  // if data is sufficient and is in valid format
                    callData.push({
                        name: userConstants.PERSONALITY_LIST[personalityIndex],
                        callDuration: (personalityCallDataScore && isDataSufficient) ? parseInt(personalityCallDataScore.score) || 0 : Number.MIN_VALUE,
                        personalityClass: analyticsConstants.PERSONALITY_CLASS_MAP_FOR_CALL_CENTER_DATA[userConstants.PERSONALITY_LIST[personalityIndex].toLowerCase()],
                        isDataSufficient: isDataSufficient
                    });
                }
            }

            callData = callData.sort(function(callCenterDataObj1, callCenterDataObj2){
                return (callCenterDataObj2.callDuration - callCenterDataObj1.callDuration);
            });
            // round the score
            for (var index in callData) {
                callData[index].callDuration = Math.round(callData[index].callDuration)
            }
            successCallback({
                isCallDataDepartmentEmployee: true,
                missingPBR: false,
                callData: callData,
                foundPersonalityScores: true,
                insufficientDataList: insufficientDataList
            });
        }
        else {
            successCallback({
                isCallDataDepartmentEmployee: true,
                missingPBR: true,
                foundPersonalityScores: true
            });
        }
    }
    else {
        userUtils.getUserPersonalityScores(user, function (personalityScores) { // fetch user's personality score
            userUtils.getPQScoreSettings(user, function (settings) {
                var graphData = [], foundPersonalityScores = true;
                // gets the personality score and name array
                for (var personalityIndex in personalityScores) {
                    var personalityDataMap = {},
                        personalityScoreObject = personalityScores[personalityIndex],
                        personalityScore = personalityScoreObject.get("score"),
                        personalityMaxScore = personalityScoreObject.get("actual_max_score"),
                        personalityName = personalityScoreObject.get("personality").get("name"),
                        personalitySequence = personalityScoreObject.get("sequence") || 0,
                        personalityScoreDenominator = settings.personality_score_denominator || 0;
                    // set max score to either personality max score or personality score denominator whichever is greater
                    personalityMaxScore = (personalityMaxScore && personalityMaxScore > personalityScoreDenominator) ? personalityMaxScore : personalityScoreDenominator;
                    if (personalityScore && personalityMaxScore) {
                        personalityDataMap.personalityScorePercentage = Math.round((personalityScore / personalityMaxScore) * 100);
                    }
                    else {
                        personalityDataMap.personalityScorePercentage = 0;
                    }
                    personalityDataMap.sequence = personalitySequence;
                    personalityDataMap.name = personalityName;
                    graphData.push(personalityDataMap);
                }


                // sorts the array in order of sequence
                graphData = _.sortBy(graphData, function (personality) {
                    return personality.sequence;
                });

                if (graphData.length == 0) {
                    foundPersonalityScores = false;
                    for (var index in userConstants.PERSONALITY_LIST) {
                        graphData.push({
                            personalityScorePercentage: 0,
                            name: userConstants.PERSONALITY_LIST[index]
                        });
                    }
                }
                // add style classes with each array object
                for (var personalityIndex in graphData) {
                    graphData[personalityIndex].personalityClass = analyticsConstants.PERSONALITY_CLASS_MAP_FOR_DONUT_GRAPH[graphData[personalityIndex].name.toLowerCase()];
                    graphData[personalityIndex].donutGraphSize = analyticsConstants.DONUT_GRAPH_SIZE[personalityIndex];
                }
                successCallback({
                    isCallDataDepartmentEmployee: false,
                    missingPBR: false,
                    doughnutGraphData: graphData,
                    foundPersonalityScores: foundPersonalityScores
                });
            }, errorCallback);
        }, errorCallback);
    }
};

// function returns the map of the user count of each personality in the company
exports.getCompanyUserCounts = function(company){
    if(company) {
        var totalUsers = company.get("user_count");
        if (totalUsers) {
            var userCountMap = {
                all: totalUsers
            };
            for (var index in userConstants.PERSONALITY_LIST) {
                userCountMap[userConstants.PERSONALITY_LIST[index].toLowerCase()] = company.get(userConstants.PERSONALITY_LIST[index].toLowerCase() + "_count") || 0;
            }
            return userCountMap;
        }
    }
};

exports.getUserCompanyAndDepartment = function(currentUser, successCallback, errorCallback){
    var userQuery = new Parse.Query(Parse.User);
    userQuery.include("primary_personality");
    userQuery.include("company");
    userQuery.include("primary_personality");
    userQuery.include("company.highest_pq_user");
    userQuery.include("company.lowest_pq_user");
    userQuery.include("department");
    userQuery.include("department.highest_pq_user");
    userQuery.include("department.lowest_pq_user");
    userQuery.include("call_data");
    userQuery.get(currentUser.id).then(function(user){
        if(!user.get("department")){  // if user has no department
            userUtils.setDefaultDepartment(user, user.get("company"), function(){  // set default department
                successCallback(user, user.get("company"), user.get("department"));
            }, errorCallback)
        }
        else {
            successCallback(user, user.get("company"), user.get("department"));
        }
    }, errorCallback);
};

// function to return most common workstyle of the department and return undefined if no department is sent
exports.getDepartmentMostCommonWorkstyle = function(department){
    if(department){
        var teamMostCommonPersonality = null,
            teamMostCommonPersonalityUserCount = 0;
        for(var index in userConstants.PERSONALITY_LIST){
            var userCount = department.get(userConstants.PERSONALITY_LIST[index].toLowerCase() + "_count") || 0;
            if(userCount > teamMostCommonPersonalityUserCount){
                teamMostCommonPersonality = userConstants.PERSONALITY_LIST[index];
                teamMostCommonPersonalityUserCount = userCount;
            }
        }
        return teamMostCommonPersonality;
    }
};

exports.getAssessedUsersInCompany = function(company){
    return userConstants.PERSONALITY_LIST.reduce(function(userCount, personality){
        return userCount + (company.get(personality.toLowerCase() + '_count') || 0);
    }, 0);
};


exports.getAssessedUsersInDepartment = function(department){
    return userConstants.PERSONALITY_LIST.reduce(function(userCount, personality){
        return userCount + (department.get(personality.toLowerCase() + '_count') || 0);
    }, 0);
};

// sends graph data for the user
exports.getUserAnalyticsGraphData = function(user, successCallback, errorCallback){
    var userAnalyticsQuery = new Parse.Query("User_Analytics"),
        dateBefore90Days = new Date(),  // date 90 days before yesterday
        today = new Date(),  // today day date
        analyticsGraphData = [], userAnalyticsMap = {}, date, score, scoreBefore90Days = 0, wasTrained;
    dateBefore90Days.setDate(dateBefore90Days.getDate() - 90);
    dateBefore90Days.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    userAnalyticsQuery.equalTo("user", user);
    userAnalyticsQuery.descending("date");
    userAnalyticsQuery.limit(90);   // fetch the last 90 records
    userAnalyticsQuery.find().then(function(userAnalyticsRecords){

        // gets the record created in last 90 days from the records fetched in query
        for(var index in userAnalyticsRecords){
            date = userAnalyticsRecords[index].get("date");
            date.setHours(0, 0, 0, 0);
            userAnalyticsMap[date.getTime()] = userAnalyticsRecords[index].get("pq_score");
            scoreBefore90Days = (date.getTime() <= dateBefore90Days.getTime() && !scoreBefore90Days) ? userAnalyticsMap[date.getTime()] : scoreBefore90Days;
        }

        date = new Date(dateBefore90Days);
        // creates the last 90 days record from today for the user
        // calculated till today so that graph does not break if user has attempted quiz yesterday
        while(date.getTime() <= today.getTime())
        {
            score = userAnalyticsMap[date.getTime()] || scoreBefore90Days;
            wasTrained = (userAnalyticsMap[date.getTime()]) ? true : false;  // flag to show user was trained that day or not
            analyticsGraphData.push({
                timeStamp: date.getTime(),
                score: score,
                trained : wasTrained
            });
            scoreBefore90Days = score;
            date.setDate(date.getDate() + 1);
        }

        successCallback(analyticsGraphData);
    }, errorCallback);
};

// sends graph data for the department
exports.getDepartmentAnalyticsGraphData = function(department, successCallback, errorCallback){
    if(department) {
        var userAnalyticsQuery = new Parse.Query("Department_Analytics"),
            dateBefore90Days = new Date(),  //date 90 days before yesterday
            today = new Date(),  // today day date
            analyticsGraphData = [], departmentAnalyticsMap = {}, date, score, userCount, avgScore, scoreBefore90Days = 0, wasTrained;
        dateBefore90Days.setDate(dateBefore90Days.getDate() - 90);
        dateBefore90Days.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        userAnalyticsQuery.equalTo("department", department);
        userAnalyticsQuery.descending("date");
        userAnalyticsQuery.limit(90);  // fetch the last 90 records
        userAnalyticsQuery.find().then(function (departmentAnalyticsRecords) {

            // gets the record created in last 91 days from the records fetched in query
            for (var index in departmentAnalyticsRecords) {
                date = departmentAnalyticsRecords[index].get("date");
                date.setHours(0, 0, 0, 0);
                score = departmentAnalyticsRecords[index].get("pq_score");
                userCount = departmentAnalyticsRecords[index].get("user_count");
                avgScore = (score && userCount) ? Math.floor(score / userCount) : 0;
                departmentAnalyticsMap[date.getTime()] = avgScore;
                scoreBefore90Days = (date.getTime() <= dateBefore90Days.getTime() && !scoreBefore90Days) ? departmentAnalyticsMap[date.getTime()] : scoreBefore90Days;
            }
            date = new Date(dateBefore90Days);
            // creates the last 90 days record from today for the user
            // calculated till today so that graph does not break if user has attempted quiz yesterday
            while (date.getTime() <= today.getTime()) {
                avgScore = departmentAnalyticsMap[date.getTime()] || scoreBefore90Days;
                analyticsGraphData.push({
                    timeStamp: date.getTime(),
                    score: avgScore
                });
                scoreBefore90Days = avgScore;
                date.setDate(date.getDate() + 1);
            }

            successCallback(analyticsGraphData);
        }, errorCallback);
    }
    else{
        successCallback();
    }
};

exports.getDepartmentsAnalyticsGraphData = function(departments, successCallback, errorCallback){
    if(Array.isArray(departments)) {
        var departmentAnalyticsQuery = new Parse.Query("Department_Analytics"),
            dateBefore90Days = new Date(),  //date 90 days before today
            today = new Date(),  // today day date
            analyticsGraphData = {}, departmentAnalyticsMap = {}, date, score, userCount, avgScore, scoreBefore90Days = {};
        dateBefore90Days.setDate(dateBefore90Days.getDate() - analyticsConstants.DEFAULT_DAYS_COUNT);
        dateBefore90Days.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        departmentAnalyticsQuery.lessThan('date', today);
        departmentAnalyticsQuery.containedIn("department", departments);
        departmentAnalyticsQuery.descending("date");
        departmentAnalyticsQuery.limit(analyticsConstants.DEFAULT_DAYS_COUNT * departments.length);  // fetch the last 90 records
        departmentAnalyticsQuery.include('department');
        departmentAnalyticsQuery.find().then(function (departmentAnalyticsRecords) {
            // gets the record created in last 91 days from the records fetched in query
            for (var index in departmentAnalyticsRecords) {
                var date = departmentAnalyticsRecords[index].get("date");
                date.setHours(0, 0, 0, 0);
                var score = departmentAnalyticsRecords[index].get("pq_score"),
                    userCount = departmentAnalyticsRecords[index].get("user_count"),
                    avgScore = (score && userCount) ? score / userCount : 0,
                    department = departmentAnalyticsRecords[index].get('department');
                if(! departmentAnalyticsMap[department.id]){
                    departmentAnalyticsMap[department.id] = {};
                }
                departmentAnalyticsMap[department.id][date.getTime()] = avgScore;
                scoreBefore90Days[department.id] = (date.getTime() <= dateBefore90Days.getTime() &&
                    !scoreBefore90Days[department.id]) ? avgScore : scoreBefore90Days[department.id];
            }
            date = new Date(dateBefore90Days);

            // creates the last 90 days record from today for the user
            while (date.getTime() < today.getTime()) {
                for(var departmentIndex in departments) {
                    var department = departments[departmentIndex],
                        departmentId = department.id;
                    avgScore = departmentAnalyticsMap[departmentId]? departmentAnalyticsMap[departmentId][date.getTime()] || scoreBefore90Days[departmentId] || 0 : 0;
                    analyticsGraphData[departmentId] = analyticsGraphData[departmentId] || [];
                    analyticsGraphData[departmentId].push([
                        date.getTime(),
                        avgScore
                    ]);
                    scoreBefore90Days[departmentId] = avgScore;
                }
                date.setDate(date.getDate() + 1);
            }

            successCallback(analyticsGraphData);
        }, errorCallback);
    }
    else{
        successCallback();
    }
};


exports.getCompanyAnalyticsGraphData = function(companies, successCallback, errorCallback){
    if(Array.isArray(companies)) {
        var companyAnalyticsQuery = new Parse.Query("Company_Analytics"),
            dateBefore90Days = new Date(),  //date 90 days before today
            today = new Date(),  // today day date
            analyticsGraphData = {}, companyAnalyticsMap = {}, date, score, userCount, avgScore, scoreBefore90Days = {};
        dateBefore90Days.setDate(dateBefore90Days.getDate() - analyticsConstants.DEFAULT_DAYS_COUNT);
        dateBefore90Days.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        companyAnalyticsQuery.lessThan('date', today);
        companyAnalyticsQuery.containedIn("company", companies);
        companyAnalyticsQuery.descending("date");
        companyAnalyticsQuery.limit(analyticsConstants.DEFAULT_DAYS_COUNT * companies.length);  // fetch the last 90 records
        companyAnalyticsQuery.include('company');
        companyAnalyticsQuery.find().then(function (companyAnalyticsRecords) {
            // gets the record created in last 91 days from the records fetched in query
            for (var index in companyAnalyticsRecords) {
                var date = companyAnalyticsRecords[index].get("date");
                date.setHours(0, 0, 0, 0);
                var score = companyAnalyticsRecords[index].get("pq_score"),
                    userCount = companyAnalyticsRecords[index].get("user_count"),
                    avgScore = (score && userCount) ? score / userCount : 0,
                    company = companyAnalyticsRecords[index].get('company');
                if(! companyAnalyticsMap[company.id]){
                    companyAnalyticsMap[company.id] = {};
                }
                companyAnalyticsMap[company.id][date.getTime()] = avgScore;
                scoreBefore90Days[company.id] = (date.getTime() <= dateBefore90Days.getTime() &&
                    !scoreBefore90Days[company.id]) ? avgScore : scoreBefore90Days[company.id];
            }
            date = new Date(dateBefore90Days);

            // creates the last 90 days record from today for the user
            while (date.getTime() < today.getTime()) {
                for(var companyIndex in companies) {
                    var company = companies[companyIndex],
                        companyId = company.id;
                    avgScore = companyAnalyticsMap[companyId]? companyAnalyticsMap[companyId][date.getTime()] || scoreBefore90Days[companyId] || 0 : 0;
                    analyticsGraphData[companyId] = analyticsGraphData[companyId] || [];
                    analyticsGraphData[companyId].push([
                        date.getTime(),
                        avgScore
                    ]);
                    scoreBefore90Days[companyId] = avgScore;
                }
                date.setDate(date.getDate() + 1);
            }

            successCallback(analyticsGraphData);
        }, errorCallback);
    }
    else{
        successCallback();
    }
};

// function to generate banner graph daya for the department
exports.getBannerGraphDepartmentData = function(departmentOrCompany){
    var personalityCountList, totalUserCount = 0;
    personalityCountList = [   // user count of each personality in the department
        {name: 'Organizer', count: departmentOrCompany.get('organizer_count') || 0},
        {name: 'Advisor', count: departmentOrCompany.get('advisor_count') || 0},
        {name: 'Connector', count: departmentOrCompany.get('connector_count') || 0},
        {name: 'Dreamer', count: departmentOrCompany.get('dreamer_count') || 0},
        {name: 'Original', count: departmentOrCompany.get('original_count') || 0},
        {name: 'Doer', count: departmentOrCompany.get('doer_count') || 0}
    ];

    // sorts the personality according to the user count
    personalityCountList = personalityCountList.sort(function(p1, p2){return (p2.count - p1.count);});
    totalUserCount = departmentOrCompany.get("user_count") || 0;  // total count of the user in the department

    return {personalityCountList: personalityCountList, totalUserCount: totalUserCount}
};

// function updates the sequence of the doughnut graphs if user personality scores are not found
exports.updateCircleSequenceIfNoPersonalityScoreFound = function (user, personalityCircleData, successCallback, errorCallback) {
    // if user has no call center data and his persnality scores are not found and user has no assessment
    if (!personalityCircleData.isCallDataDepartmentEmployee && !personalityCircleData.foundPersonalityScores && user.get("primary_personality")) {
        userUtils.getUserAssessmentResult(user, "All", function (assessmentResults) {   // fetch user's assessment result
            if (Array.isArray(assessmentResults) && assessmentResults.length == userConstants.TOTAL_PERSONLITY_COUNT) {
                var personalitySequenceMap = {};
                // generate the sequence map using assessment results
                for (var index in assessmentResults) {
                    personalitySequenceMap[assessmentResults[index].get("personality").get("name").toLowerCase()] = assessmentResults[index].get("sequence");
                }

                // update the sequence and size of the doughnut graph and
                for (var index in personalityCircleData.doughnutGraphData) {
                    personalityCircleData.doughnutGraphData[index].sequence = personalitySequenceMap[personalityCircleData.doughnutGraphData[index].name.toLowerCase()];
                    personalityCircleData.doughnutGraphData[index].donutGraphSize = analyticsConstants.DONUT_GRAPH_SIZE[personalitySequenceMap[personalityCircleData.doughnutGraphData[index].name] - 1];
                }

                // sorts the array in ascending order of the score
                personalityCircleData.doughnutGraphData = _.sortBy(personalityCircleData.doughnutGraphData, function (personality) {
                    return personality.sequence
                });

                successCallback(personalityCircleData);
            }
            else {
                successCallback(personalityCircleData)
            }
        }, errorCallback);
    }
    else {
        successCallback(personalityCircleData)
    }
};

// function returns least two personalities name according to data pased in arguments
exports.getLeastTwoPersonalities = function(personalityCirclesData) {
    if(personalityCirclesData.missingPBR){
        return{};
    }
    else if(personalityCirclesData.isCallDataDepartmentEmployee){  // if user is call center employee
        if(personalityCirclesData.callData.length > 2){
            return {
                userLeastUnderstoodWorkstyle: personalityCirclesData.callData[0].name,
                userLeastUnderstoodWorkstyleScore: personalityCirclesData.callData[0].callDuration,
                userSecondLeastUnderstoodWorkstyle: personalityCirclesData.callData[1].name,
                userMostUnderstoodWorkstyle: personalityCirclesData.callData[personalityCirclesData.callData.length - 1].name,
                userMostUnderstoodWorkstyleScore: personalityCirclesData.callData[personalityCirclesData.callData.length - 1].callDuration
            }
        }
        else{
            return {}
        }
    }
    else if(!personalityCirclesData.foundPersonalityScores){  // if user is not assessed or has no personality scores
         return {
            userLeastUnderstoodWorkstyle: null,
            userSecondLeastUnderstoodWorkstyle: null
        }
    }
    else{   // if user has no personality scores
        var sortedPersonalityData = _.sortBy(personalityCirclesData.doughnutGraphData, function (personality) {
            return -personality.personalityScorePercentage
        });
        return {
            userLeastUnderstoodWorkstyle: sortedPersonalityData[sortedPersonalityData.length - 1].name,
            userSecondLeastUnderstoodWorkstyle: sortedPersonalityData[sortedPersonalityData.length - 2].name
        };
    }
};

function addPaginationData(paginationData){//1 - 15 of 99
    var rangeStart = (paginationData.currentPage - 1) * paginationData.perPage + 1,
        rangeEnd = (paginationData.currentPage) * paginationData.perPage;
        rangeEnd = (paginationData.count < rangeEnd) ? paginationData.count : rangeEnd;
        var lastPageNumber = parseInt(paginationData.count / paginationData.perPage + ((paginationData.count % paginationData.perPage !== 0)? 1 : 0));
    _.extend(paginationData,
        {
            displayText: (rangeStart + ' - ' + rangeEnd + ' of ' + paginationData.count),
            isFirstPage: (paginationData.currentPage === 1),
            isLastPage: (paginationData.currentPage === lastPageNumber)
        });
}

exports.fetchDepartmentEmployees = function(department, page, successCallback, errorCallback){
    page = (page && page >= 1 && !isNaN(parseInt(page)))? parseInt(page) : 1;
    var userCount = department.get('user_count'),
        userQuery = new Parse.Query(Parse.User);
    userQuery.equalTo('department', department);
    userQuery.descending('pq_score');
    userQuery.skip((page - 1) * analyticsConstants.EMPLOYEE_COUNT_PER_PAGE);
    userQuery.limit(analyticsConstants.EMPLOYEE_COUNT_PER_PAGE);
    userQuery.find({
        success: function (userList) {
            var paginationData = {
                currentPage: page,
                count: userCount,
                perPage: analyticsConstants.EMPLOYEE_COUNT_PER_PAGE
            };
            addPaginationData(paginationData);
            successCallback(userList, paginationData);
        },
        error: errorCallback
    });
};

// function to find and update call data pointer for the users who are missing call data
exports.updateUserCallDataPointers = function(users, successCallback, errorCallback) {

    // maps the user object with key userCompanyName_userPhoneId_userIdentifierSource
    // and also creates an array of phone id's for which call data is missing
    var callDataUserMap = {}, phoneIdsWithNoCallData = [];
    for (var userIndex in users) {
        var user = users[userIndex],
            userDepartment = user.get("department"),
            userCompany = user.get("company"),
            userPhoneId = user.get("phoneId"),
            userIdentifierSource = user.get("identifierSource");
        if ((typeof userPhoneId === "string" && userPhoneId.trim() !== "") && (typeof userIdentifierSource === "string" && userIdentifierSource.trim() != "") && !user.get("call_data") && userCompany && userDepartment && userDepartment.get("call_data_type")) {
            phoneIdsWithNoCallData.push(userPhoneId);
            callDataUserMap[userCompany.get("name") + "_" + userPhoneId + "_" + userIdentifierSource] = user;
        }
    }
    // get missing call data of users
    exports.getUserCallDataByPhoneIds(phoneIdsWithNoCallData, function (callData) {
        // update user call data pointer
        for (var callDataIndex in callData) {
            var callDataCompanyName = callData[callDataIndex].get("companyName"),
                callDataPhoneId = callData[callDataIndex].get("phoneId"),
                callDataIdentifierSource = callData[callDataIndex].get("identifierSource"),
                userMapKey = callDataCompanyName + "_" + callDataPhoneId + "_" + callDataIdentifierSource;
            if (callDataUserMap[userMapKey]) {  // if call data found for the user
                callDataUserMap[userMapKey].set("call_data", callData[callDataIndex]);
            }
        }
        successCallback(users)
    }, errorCallback);
};

// function to return user call data filtered by phoneId
exports.getUserCallDataByPhoneIds = function(phoneIds, successCallback, errorCallback){
    var userCallDataQuery = new Parse.Query("User_Calldata");
    userCallDataQuery.containedIn("phoneId", phoneIds);
    userCallDataQuery.count().then(function(callDataCount){

        commonUtils.getQueryResult({
            modelName: "User_Calldata",
            totalCount: callDataCount,
            conditions: [["containedIn", "phoneId", phoneIds]]
        }, successCallback, errorCallback);
    }, errorCallback);
};

/***
 * @param user: current user object
 * @param isSuperAdmin: true if user is a super admin, false otherwise
 * @param companyId: id of the requested company
 * @param successCallback
 * @param errorCallback
 *
 * :- returns company object of current user when
 *      - current user is not a super admin
 *      - if no companyId is sent
 * :- returns company list when user is a super admin
 ***/
exports.getCompanyAndCompanyList = function(user, isSuperAdmin, companyId, successCallback, errorCallback){
    var companyQueryObject = new Parse.Query("Company");
    companyQueryObject.include("most_understood_personality", "least_understood_personality", "highest_pq_user");
    if (isSuperAdmin) {
        companyQueryObject.limit(1000);
        companyQueryObject.find().then(function (companyList) {
            companyList = commonUtils.sortObjectsByName(companyList);
            var company = _.find(companyList, function (companyObject) {
                return companyObject.id == companyId
            });
            company = company || user.get("company");
            successCallback(company, companyList);
        }, errorCallback);
    }
    else if(user.get('company')){
        companyQueryObject.get(user.get('company').id, {
            success: successCallback,
            error: errorCallback
        });
    }
    else{
        errorCallback("User is not associated with any company");
    }
};

/**
 * function fetches department after verification of user credentials
 * @param user : current user
 * @param departmentId : id of department needed to be fetched
 * @param successCallback : function which will be called after successful fetch of department
 * @param errorCallback : function which will be called after department is not successfully fetched
 */
exports.fetchDepartmentAfterVerification = function (user, departmentId, includes, successCallback, errorCallback) {
    var Department = Parse.Object.extend('Department'), departmentQuery;
    if (user.get('permission_type') === userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN || (user.get('department') && user.get('department').id === departmentId)) {
        departmentQuery = new Parse.Query(Department);
        if(includes && includes.length > 1){
            departmentQuery.include.apply(departmentQuery, includes);
        }
        departmentQuery.get(departmentId, {
            success: successCallback,
            error: errorCallback
        });
    }
    else {
        departmentQuery = new Parse.Query(Department);
        if (user.get('permission_type') === userConstants.USER_PERMISSION_TYPE.ACCOUNT_OWNER) {
            if (includes && includes.length > 1) {
                departmentQuery.include.apply(departmentQuery, includes);
            }
            departmentQuery.get(departmentId, {
                success: function (department) {
                    if (user.get('company') && department.get('company') && user.get('company').id === department.get('company').id) {
                        successCallback(department);
                    }
                    else {
                        errorCallback({message: 'Unauthorized Access', status: 404});
                    }
                },
                error: errorCallback
            });
        }
        else if (user.get('permission_type') === userConstants.USER_PERMISSION_TYPE.SUPERVISOR && user.get('department')) {
            var userQuery = new Parse.Query(Parse.User);
            if (includes && includes.length > 1) {
                includes = includes.map(function(includeString){return 'department.subdepartments.' + includeString});
                includes = includes.concat(['department', 'department.subdepartments']);
                userQuery.include.apply(userQuery, includes);
            }
            else {
                userQuery.include('department', 'department.subdepartments');
            }
            userQuery.get(user.id, {
                success: function (user) {
                    var department = null;
                    if (Array.isArray(user.get('department').get('subdepartments')) && user.get('department').get('subdepartments').filter(function (departmentEle) {
                            department = departmentEle;
                            return departmentEle.id === departmentId
                        }).length >= 1) {
                            successCallback(department);
                    }
                    else {
                        errorCallback({message: 'Unauthorized Access', status: 404});
                    }
                },
                error: errorCallback
            });
        }
        else {
            res.status(404).end();
        }
    }
};

exports.getDepartmentAveragePQ = function (department) {
    if (department) {
        var last8DayPQScores = department.get('live_8_day_pq_scores'),
            last8DayUserCount = department.get('last_8_day_user_count');
        if (Array.isArray(last8DayPQScores) && Array.isArray(last8DayUserCount) && typeof last8DayPQScores[0] === "number" &&
            typeof last8DayUserCount[0] === "number" && last8DayUserCount[0] > 0) {
            return Math.round((last8DayPQScores[0] / last8DayUserCount[0]));
        }
        else
            return null;
    }
    else
        return null;
};

exports.getDepartmentUserTrainedThisWeekPercentage = function (department) {
    if (department) {
        var userTrained = department.get('user_trained_this_week'),
            userCount = department.get('user_count');
        if (typeof userTrained === "number" && typeof userCount === "number" && userCount > 0) {
            return commonUtils.roundWithPrecision((userTrained / userCount) * 100, 1);
        }
        else
            return null;
    }
    else
        return null;
};


exports.getDepartmentWeekOverWeekGrowth = function (department) {
    if (department) {
        var live8DayPQScores = department.get('live_8_day_pq_scores');
        if (Array.isArray(live8DayPQScores) && typeof live8DayPQScores[0] === "number" && typeof live8DayPQScores[7] === "number" && live8DayPQScores[7] > 0) {
            return commonUtils.roundWithPrecision(((live8DayPQScores[0] - live8DayPQScores[7]) / live8DayPQScores[7] * 100), 1);
        }
        else
            return null;
    }
    else
        return null;
};


exports.getDepartment7DayGain = function (department) {
    if (department) {
        var live8DayPQScores = department.get('live_8_day_pq_scores') || [0, 0, 0, 0, 0, 0, 0, 0];
        var last8DayUserCount = department.get('last_8_day_user_count') || [0, 0, 0, 0, 0, 0, 0, 0];
        if (Array.isArray(live8DayPQScores) && typeof live8DayPQScores[0] === "number" && typeof live8DayPQScores[7] === "number" && last8DayUserCount[0] > 0) {
            return Math.round(((live8DayPQScores[0] - live8DayPQScores[7]) / last8DayUserCount[0]));
        } else {
            return null
        }
    } else {
        return null
    }
};

exports.getUserWeeklyGain = function (user) {
    if (user) {
        var last7DayPQScores = user.get('last_7_day_pq_scores');
        if (Array.isArray(last7DayPQScores) && typeof user.get('pq_score') === "number" && typeof last7DayPQScores[6] === "number") {
            return (user.get('pq_score') - last7DayPQScores[6]);
        }
        else
            return null;
    }
    else
        return null;
};

exports.getLowestAndTopPerformingDepartmentAndWeeklyGain = function (departments) {
    var maxWeeklyGain = -1, minWeeklyGain = Number.MAX_VALUE, minDepartment = null, maxDepartment = null;
    if (Array.isArray(departments)) {
        for (var index in departments) {
            var department = departments[index], // array containing score for last 8 days
                live8DayPQScores = department.get('live_8_day_pq_scores') || [0, 0, 0, 0, 0, 0, 0, 0],
                pqScoresDifference = (typeof live8DayPQScores[0] === "number" && typeof live8DayPQScores[7] === "number") ? live8DayPQScores[0] - live8DayPQScores[7] : 0,
                userCount = department.get('last_8_day_user_count')[0] || 0;
            var weeklyGain = (pqScoresDifference === 0 || userCount === 0) ? 0 : pqScoresDifference / userCount;
            if (weeklyGain > maxWeeklyGain) {
                maxDepartment = department;
                maxWeeklyGain = weeklyGain;
            }
            if (weeklyGain < minWeeklyGain) {
                minDepartment = department;
                minWeeklyGain = weeklyGain;
            }
        }
    }
    return {
        topPerformingDepartment: maxDepartment,
        topPerformingDepartmentWeeklyGrowth: Math.round(maxWeeklyGain),
        lowestPerformingDepartment: minDepartment,
        lowestPerformingDepartmentWeeklyGrowth: Math.round(minWeeklyGain)
    }
};

exports.updateMissingCallDataIdentifiers = function (users, successCallBack, errorCallback) {
    var pbrLookupQuery = new Parse.Query('PBR_Lookup'),
        missingDataUsersIndexDict = {},
        userIndex;

    for (var index in users) {
        if (users[index].get('identifierSource') === undefined || users[index].get('identifierSource') === null || users[index].get('phoneId') === undefined || users[index].get('phoneId') === null) {
            missingDataUsersIndexDict[users[index].get('email')] = index;
        }
    }

    if(_.isEmpty(missingDataUsersIndexDict)) {
        successCallBack(users);
    } else {
        pbrLookupQuery.equalTo("active", true);
        pbrLookupQuery.containedIn('email', Object.keys(missingDataUsersIndexDict));
        pbrLookupQuery.find().then(function (pbrLookupObjects) {
            for (var pbrLookupIndex in pbrLookupObjects) {
                var pbrLookupObject = pbrLookupObjects[pbrLookupIndex];
                userIndex = missingDataUsersIndexDict[pbrLookupObject.get('email')];
                var user = users[userIndex];
                user.set('identifierSource', pbrLookupObject.get('identifierSource'));
                user.set('phoneId', pbrLookupObject.get('phoneId'));
            }
            successCallBack(users);
        }, errorCallback)
    }
};
