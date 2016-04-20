var secret = require('../../secret.js'),
    appSettings = require('../../app_settings.js'),
    user_constants = require('../user/constants.js'),
    commonConstants = require('./constants.js'),
    _ = require('underscore');


exports.getAbsolutURL = function (path) {
    return appSettings.PROTOCOL + appSettings.DOMAIN + path;
};

function createProspectAndAddToList(userDict, apiKey, listId, successCallback, errorCallback) {
    var PardotQueueModel = Parse.Object.extend('Pardot_Call_Queue'),
        pardotQueueObject = new PardotQueueModel();
    if (listId) {    // if list id exist then send list with userDict
        var listVariableName = 'list_' + listId;
        userDict[listVariableName] = 1;
    }

    pardotQueueObject.set('email', userDict['email']);
    pardotQueueObject.set('pardotData', _.omit(userDict, 'email'));
    pardotQueueObject.save();

    userDict.api_key = apiKey;
    userDict.user_key = secret.PardotsUserKey;

    Parse.Cloud.httpRequest({
        url: appSettings.PARDOTS_URLS['CREATE_UPDATE_PROSPECT'],
        method: 'POST',
        body: userDict
    }).then(function (httpResponse) {    // success callback
            pardotQueueObject.destroy();
            var prospectId = httpResponse.text.slice(httpResponse.text.indexOf("<id>") + 4, httpResponse.text.indexOf('</id>'));
            console.log("prospect added successfully");
            successCallback(prospectId);
        },
        function (error) {   // error callback
            console.error("Error while creating prospect");
            console.error(userDict);
            console.error(error);
            errorCallback(error.status);
        });
}

// function that makes call for mail
function sendMailToProspect(userEmail, apiKey, campaignId, emailTemplateId, successCallback) {
    Parse.Cloud.httpRequest({
        url: appSettings.PARDOTS_URLS['SEND_MAIL_TO_PROSPECT'],
        method: 'POST',
        body: {
            api_key: apiKey,
            user_key: secret.PardotsUserKey,
            prospect_email: userEmail,
            campaign_id: campaignId,
            email_template_id: emailTemplateId
        }
    }).then(function (httpResponse) {
        successCallback();
    }, function (error) {
        console.error("Error while sending mail");
        console.error("User Email : " + userEmail);
        console.error("Campaign ID : " + campaignId);
        console.error("Email Template ID : " + emailTemplateId);
        console.error(error);
        successCallback();
    });
}

// function to report 155 error to admin list
exports.report155ToAdminList = function (campaignId, emailTemplateId, listId, successCallback, errorCallback) {
    exports.fetchPardotApiKey(function (apiKey) {
        // function read the pardot campaign and return pardot campaign object
        readCampaign(apiKey, campaignId, function (campaign) {
            var lastUpdate, currentTime;
            lastUpdate = new Date(parseInt(campaign.name.split('@')[1]));
            currentTime = new Date();

            if (!lastUpdate || isNaN(lastUpdate) || (lastUpdate && (currentTime.getTime() - lastUpdate.getTime()) >= appSettings.REPORT_ERROR_MAIL_DATA.EMAIL_INTERVAL_ON_155)) {    // if name has no timestamp associated with it
                exports.sendMailToLists({
                    api_key: apiKey,
                    user_key: secret.PardotsUserKey,
                    campaign_id: campaignId,
                    email_template_id: emailTemplateId,
                    list_ids: listId
                }, function () {
                    updateCampaignName(currentTime, apiKey, campaignId, successCallback, errorCallback);
                }, errorCallback);

            }
            else {
                successCallback();
            }
        }, errorCallback);
    }, function (error) {
        console.error("Error while getting api key");
        console.error(error);
        errorCallback();
    });
};


// function to send email to pardot lists
exports.fetchApiKeyAndSendMailToList = function(options, successCallback, errorCallback){
    exports.fetchPardotApiKey(function (apiKey) {   // get pardot api_key
        options.api_key = apiKey;
        options.user_key = secret.PardotsUserKey;

        exports.sendMailToLists(options, function () { //send mail
            successCallback();
        }, errorCallback);
    }, function (error) {
        console.error("Error while getting api key");
        console.error(error);
        errorCallback();
    });
};

function readCampaign(apiKey, campaignId, successCallback, errorCallback) {
    Parse.Cloud.httpRequest({
        url: appSettings.PARDOTS_URLS['READ_CAMPAIGN'],
        method: 'POST',
        body: {
            api_key: apiKey,
            user_key: secret.PardotsUserKey,
            id: campaignId,
            format: 'json'
        }
    }).then(function (httpResponse) {
        successCallback(httpResponse.data.campaign);
    }, function (error) {    // error callback
        console.error("Error while reading campaign with id : " + campaignId);
        errorCallback(error);
    });
}
exports.readEmailTemplate = function (apiKey, templateId, successCallback, errorCallback) {
    var url = appSettings.PARDOTS_URLS['READ_TEMPLATE'] + templateId;
    Parse.Cloud.httpRequest({
        url: url,
        method: 'POST',
        body: {
            api_key: apiKey,
            user_key: secret.PardotsUserKey,
            format: 'json'
        }
    }).then(function (httpResponse) {
        if(httpResponse.data && httpResponse.data.emailTemplate && httpResponse.data.emailTemplate.htmlMessage) {
            successCallback(httpResponse.data.emailTemplate.htmlMessage);
        }
        else {
            console.error("Error while reading email template with id : " + templateId);
            errorCallback(httpResponse);
        }
    }, function (error) {    // error callback
        console.error("Error while reading email template with id : " + templateId);
        errorCallback(error);
    });
};

exports.customRender = function (html, context, successCallback, errorCallback){
    var errorMessage = '';
    html = html.replace(/\{%\s*([a-z_]*?)\s*%}/ig, function (matchString, subGroupMatch) {
        if (context[subGroupMatch] !== undefined) {
            return String(context[subGroupMatch]);
        }
        else {
            errorMessage += subGroupMatch + ' is undefined\n';
            return '';
        }
    });
    if(errorMessage !== '') {
        errorCallback("Error: missing data for placeholders:\n" + errorMessage);
    }
    else {
        successCallback(html);
    }
};

function updateCampaignName(currentTime, apiKey, campaignId, successCallback) {
    var newName = appSettings.REPORT_ERROR_MAIL_DATA.CAMPAIGN_NAME_PREFIX + currentTime.getTime();
    Parse.Cloud.httpRequest({
        url: appSettings.PARDOTS_URLS['UPDATE_CAMPAIGN'],
        method: 'POST',
        body: {
            api_key: apiKey,
            user_key: secret.PardotsUserKey,
            id: campaignId,
            name: newName
        }
    }).then(function (httpResponse) {
        console.log("Pardot Campaign " + campaignId + " successfully updated to new name " + newName);
        successCallback();
    }, function (error) {    // error callback
        console.error("ERROR while updating the campaign name with id: " + campaignId);
        successCallback();
    });
}

// function to send mail to lists with given options
exports.sendMailToLists = function (options, successCallback, errorCallback) {
    Parse.Cloud.httpRequest({
        url: appSettings.PARDOTS_URLS['SEND_MAIL_TO_LIST'],
        method: 'POST',
        body: options
    }).then(function (httpResponse) {
        console.log("Email with id " + options.email_template_id + " successfully sent to list " + options.list_ids);
        successCallback();
    }, function (error) {
        console.error("Error while sending mail");
        console.error("List Ids : " + options.list_ids);
        console.error("Campaign Id : " + options.campaign_id);
        console.error("Email Template Id : " + options.email_template_id);
        console.error(error);
        errorCallback();
    });
};

// Function that fetches the list id of particular pardot list and also saves it in Settings for further use.
exports.getListId = function (pardotListName, successCallback, errorCallback) {
    var Settings = Parse.Object.extend('Settings'),
        settingsQuery = new Parse.Query(Settings);
    settingsQuery.equalTo('name', pardotListName);
    settingsQuery.first({
        success: function (setting) {
            successCallback(setting.get('value'));
        },
        error: function (error) {
            console.error("Error while fetching id for list name " + pardotListName);
            console.error(error);
            errorCallback(error);
        }
    });
};

// Function that logs in Pardot and returns a unique api key.
exports.fetchPardotApiKey = function (successCallback, errorCallback) {
    if(Parse.Cloud.httpRequest._cachedResponse && Parse.Cloud.httpRequest._cachedResponse['pardotApiKey']){
        successCallback(Parse.Cloud.httpRequest._cachedResponse['pardotApiKey']);
    }
    else {
        Parse.Cloud.httpRequest({
            url: appSettings.PARDOTS_URLS['LOGIN'],
            method: 'POST',
            body: {
                email: secret.PardotsUserEmail,
                password: secret.PardotsUserPassword,
                user_key: secret.PardotsUserKey,
                format: 'json'
            }
        }).then(function (httpResponse) {    // success callback
            if (httpResponse.data && httpResponse.data.api_key) {
                if (!Parse.Cloud.httpRequest._cachedResponse){
                    Parse.Cloud.httpRequest._cachedResponse = {};
                }
                Parse.Cloud.httpRequest._cachedResponse['pardotApiKey'] = httpResponse.data.api_key;
                successCallback(httpResponse.data.api_key);
            }
            else {
                errorCallback(httpResponse);
            }
        }, function (error) {    // error callback
            errorCallback(error);
        });
    }
};

exports.addProspectBatchToList = function (apiKey, prospects, successCallback, errorCallback) {
    var newProspects = JSON.stringify({prospects: prospects});
    Parse.Cloud.httpRequest({    // request to add prospect in list
        url: appSettings.PARDOTS_URLS['CREATE_UPDATE_PROSPECT_BATCH'],
        method: 'POST',
        body: {
            user_key: secret.PardotsUserKey,
            api_key: apiKey,
            prospects: newProspects
        }
    }).then(function (httpResponse) {
        console.log("prospect batch added successfully");
        successCallback();
    }, function (error) {
        console.error("Error while adding prospect batch");
        console.error("Prospects : " + newProspects);
        console.error(error);
        errorCallback();
    });
};

// Function thats adds the prospect to a list.
exports.updateUserPardotProspect = function (userDict, listName, successCallback, errorCallback) {
    exports.fetchPardotApiKey(function (apiKey) {    // fetches the api key
        if (listName) {    // if list name provided
            exports.getListId(listName, function (listId) {    // gets the list id from the database
                createProspectAndAddToList(userDict, apiKey, listId, successCallback, errorCallback);
            }, errorCallback);
        }
        else {
            createProspectAndAddToList(userDict, apiKey, false, successCallback, errorCallback);
        }
    }, errorCallback);
};

exports.addUserBatchesToPardotInviteList = function (userList, listName, successCallback, errorCallback) {
    successCallback.callCount = 1;
    exports.fetchPardotApiKey(function (apiKey) {    // fetches the api key
        exports.getListId(listName, function (listId) {
            successCallback.callCount--;
            var batchNumber = 0,
                listNameVariable = 'list_' + listId,
                PardotQueueModel = Parse.Object.extend('Pardot_Call_Queue');
            while (userList.length >= batchNumber * appSettings.PARDOT_BATCH_SIZE) {
                successCallback.callCount++;
                var prospects = {}, initailIndex = batchNumber * appSettings.PARDOT_BATCH_SIZE,
                    finalIndex = appSettings.PARDOT_BATCH_SIZE + initailIndex - 1,
                    pardotQueueObject, objectsList = [];

                if (initailIndex + appSettings.PARDOT_BATCH_SIZE > userList.length) {
                    finalIndex = userList.length - 1
                }

                for (var index = initailIndex; index <= finalIndex; index++) {
                    pardotQueueObject = new PardotQueueModel();
                    prospects[userList[index].email] = _.omit(userList[index], 'email');
                    prospects[userList[index].email][listNameVariable] = 1;
                    pardotQueueObject.set('email', userList[index].email);
                    pardotQueueObject.set('pardotData', prospects[userList[index].email]);
                    objectsList.push(pardotQueueObject);
                }
                Parse.Object.saveAll(objectsList);
                exports.addProspectBatchToList(apiKey, prospects, function (httpResponse) {
                    Parse.Object.destroyAll(objectsList);
                    successCallback.callCount--;
                    successCallback();
                }, function (error) {
                    successCallback.callCount--;
                    successCallback();
                });
                batchNumber++
            }
        }, function (error) {
            console.error("Error while getting list ID");
            console.error(error);
            successCallback.callCount--;
            successCallback();
        });
    }, function (error) {
        console.error("Error while getting api key");
        console.error(error);
        successCallback.callCount--;
        successCallback();
    });
};

exports.createNewPardotList = function (data, successCallback, errorCallback){
    exports.fetchPardotApiKey(function (apiKey) {
        data = _.extend({}, data, {
            user_key: secret.PardotsUserKey,
            api_key: apiKey,
            format: 'json'
        });
        Parse.Cloud.httpRequest({    // request to add prospect in list
            url: appSettings.PARDOTS_URLS['CREATE_LIST'],
            method: 'POST',
            body: data
        }).then(function(httpResponse){
            if(httpResponse.data && httpResponse.data.list && httpResponse.data.list.id) {
                successCallback(httpResponse.data.list.id);
            }
            else{
                errorCallback(httpResponse);
            }
        }, errorCallback);
    }, function (error) {
        console.error("Error while getting api key");
        console.error(error);
        errorCallback();
    });
};

exports.sendEmailToUser = function (userEmail, campaignId, emailTemplateId, successCallback) {
    exports.fetchPardotApiKey(function (apiKey) {
        sendMailToProspect(userEmail, apiKey, campaignId, emailTemplateId, successCallback);
    }, function (error) {
        console.error("Error while getting api key");
        console.error(error);
        successCallback();
    })
};

// function gives absolute work style url for given relative path
exports.getAbsoluteUrlForWorkstyle = function (relativePath) {
    return appSettings.PROTOCOL + appSettings.DOMAIN + relativePath;
};

exports.validateReportErrorData = function (hash, timeStamp) {
    var newHash = require('cloud/packages/md5.js').hex_md5(secret.securityKey1 + timeStamp + secret.securityKey2);
    return hash == newHash;
};

exports.validateEmailAddress = function (email) {
    var emailValidator = commonConstants.EMAIL_REGEX;
    return email.match(emailValidator);
};

function getQueryObject(modelName, conditions) {
    var queryObject = new Parse.Query(modelName);
    for (var index in conditions) {
        queryObject[conditions[index][0]].apply(queryObject, conditions[index].slice(1));
    }
    queryObject.ascending("createdAt");
    queryObject.limit(1000);
    return (queryObject);
}

exports.getQueryResult = function (queryData, successCallback, errorCallback) {
//exports.getQueryResult = function(modelName, conditions, alreadyFetchedResults, createdAfter, totalCount, successCallback, errorCallback){
    function queryResultCallback() {
        callCount++;
        if (callCount == batchesToFetch) {
            queryData.createdAfter = newCreatedAfter;
            for (var index = 0; index < batchesToFetch; index++) {
                queryData.alreadyFetchedResults = queryData.alreadyFetchedResults.concat(newResults[index]);
            }
            if (queryData.alreadyFetchedResults.length == queryData.totalCount) {
                successCallback(queryData.alreadyFetchedResults)
            }
            else {
                exports.getQueryResult(queryData, successCallback, function(error){
                    console.error("Error while fetching "+queryData.modelName);
                    errorCallback(error);
                });
            }
        }
    }

    function getResults(index, successCallback) {
        var query = getQueryObject(queryData.modelName, queryData.conditions);
        query.skip(index * 1000);
        if (queryData.createdAfter) {
            query.greaterThanOrEqualTo("createdAt", queryData.createdAfter);
        }
        query.find().then(function (results) {
            if (index == batchesToFetch - 1) {
                newCreatedAfter = results[results.length - 1].createdAt;
                var excludeObjects = fetchObjectsWithSameCreatedAt(results, newCreatedAfter);   // fetch object to exclude
                queryData.conditions = queryData.conditions || [];
                queryData.conditions.push(["notContainedIn", "objectId", excludeObjects]);
            }
            newResults[index] = results;
            successCallback();
        }, errorCallback)
    }


    // function that returns objects with same created at as sent in arguments
    function fetchObjectsWithSameCreatedAt(objects, createdAt) {
        var filteredIds = [];
        for (var resultIndex = objects.length - 1; resultIndex >= 0; resultIndex--) {
            if (createdAt.getTime() === objects[resultIndex].createdAt.getTime()) {
                filteredIds.push(objects[resultIndex].id)
            }
            else {
                break;
            }
        }
        return filteredIds;
    }


    queryData.alreadyFetchedResults = queryData.alreadyFetchedResults || [];

    var batchesToFetch = parseInt((queryData.totalCount - queryData.alreadyFetchedResults.length) / 1000),
        newResults = [];
    if (!(queryData.totalCount - queryData.alreadyFetchedResults.length) % 1000 === 0) {
        batchesToFetch++;
    }
    batchesToFetch = (batchesToFetch > 10) ? 10 : batchesToFetch;
    if(batchesToFetch == 0){
        successCallback();
    }
    else {
        var callCount = 0, newCreatedAfter;
        for (var index = 0; index < batchesToFetch; index++) {
            getResults(index, queryResultCallback);
        }
    }

};

exports.getDateDifference = function (date1, date2) {
    var timeDiff = Math.abs(date2.getTime() - date1.getTime());
    var diffDays = Math.floor(timeDiff / (1000 * 3600 * 24));
    return diffDays;
};

exports.roundWithPrecision = function(num, powOf10){
    var multiplier = Math.pow(10, powOf10);
    return Math.round(num * multiplier) / multiplier;
};

exports.getCaseInsensitiveRegex = function(str) {
    return new RegExp('^' + str.replace(/[-[\]{}()*+?.,\\\/^$|#\s]/g, "\\$&") + '$', 'i');
};

// function to format date in formate "<Month Name> <Date>,<Year>"
exports.formatDateInMMDDYYYFormat = function (date) {
    return commonConstants.MONTH_NAME_MAP[date.getMonth()] + " " + date.getDate() + "," + (date.getFullYear());
};

exports.addOffsetInDate = function (offset, date) {
    date.setTime(date.getTime() + offset);
};

exports.validateDomain = function (domain) {
    var domainValidator = commonConstants.DOMAIN_REGEX;
    return domain.match(domainValidator);
};

exports.nth = function (rank) {
    if (typeof rank === "number") {
        if (rank > 3 && rank < 21) return 'th';
        switch (rank % 10) {
            case 1:
                return 'st';
            case 2:
                return 'nd';
            case 3:
                return 'rd';
            default:
                return 'th';
        }
    }
    else
        return '';
};

// function to add or update query parameter
// http://stackoverflow.com/questions/5999118/add-or-update-query-string-parameter
exports.updateQueryStringParameter = function(uri, key, value) {
    var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
    var separator = uri.indexOf('?') !== -1 ? "&" : "?";
    if (uri.match(re)) {
        return uri.replace(re, '$1' + key + "=" + value + '$2');
    }
    else {
        return uri + separator + key + "=" + value;
    }
};

exports.makeFailSafePardotCall = function() {
    var pardotCallQueueQuery = new Parse.Query('Pardot_Call_Queue'),
        errorCallBack = function(error) {
        console.error(error);
    };

    pardotCallQueueQuery.find().then(function(pardotCallQueueObjects) {
        if(pardotCallQueueObjects.length > 0) {
            exports.fetchPardotApiKey(function (apiKey) {
                var batchNumber = 0;
                while (pardotCallQueueObjects.length >= batchNumber * appSettings.PARDOT_BATCH_SIZE) {
                    var prospects = {}, initailIndex = batchNumber * appSettings.PARDOT_BATCH_SIZE,
                        finalIndex = appSettings.PARDOT_BATCH_SIZE + initailIndex - 1;

                    if (initailIndex + appSettings.PARDOT_BATCH_SIZE > pardotCallQueueObjects.length) {
                        finalIndex = pardotCallQueueObjects.length - 1
                    }

                    for (var index = initailIndex; index <= finalIndex; index++) {
                        prospects[pardotCallQueueObjects[index].get('email')] = _.omit(pardotCallQueueObjects[index].get('pardotData'), 'email');
                    }

                    exports.addProspectBatchToList(apiKey, prospects, function (httpResponse) {
                        pardotCallQueueQuery = new Parse.Query('Pardot_Call_Queue');
                        pardotCallQueueQuery.containedIn('email', Object.keys(prospects));
                        pardotCallQueueQuery.find().then(function(pardotCallQueueObjects) {
                            Parse.Object.destroyAll(pardotCallQueueObjects);
                        });
                    }, errorCallBack);
                    batchNumber++
                }
            }, errorCallBack);
        }
    }, errorCallBack);
};

// function to sort objects by their name
exports.sortObjectsByName = function(objectList){
    return objectList.sort(function compareName(a, b){
        return (a.get("name") || "").toLowerCase().localeCompare((b.get("name") || "").toLowerCase());
    });
};
