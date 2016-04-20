// Use Parse.Cloud.define to define as many cloud functions as you want.

// add app.js to initialize cloud app
require('./app.js');
var appSettings = require('./app_settings.js'),
    commonUtils = require('./apps/common/utils.js'),
    analyticsBackgroundJob = require('./apps/analytics/background_job.js').analyticsBackgroundJob;
    companyConstants = require('./apps/company/constants.js');

// JOBS
/*
Parse.Cloud.job("publishKahlerJob", function(request, status) {
    var userQuery = new Parse.Query("User");
    userQuery.get(request.params.user, {
        success: function (user) {
            Parse.Config.get().then(function (config) {
                var soap = require('cloud/packages/soap.js');
                var xmlReader = require('cloud/packages/xmlreader.js');
                var SOAPClient = soap.SOAPClient;
                var SOAPClientParameters = soap.SOAPClientParameters;
                var params = new SOAPClientParameters();
                params.add('sTrainerID', config.get("KAHLER_ID"));
                params.add('sTrainerPass', config.get("KAHLER_PASS"));
                var data = {
                    'email': user.username
                };
                var assessmentAnswers = new Parse.Query("User_Assessment_Answers");
                assessmentAnswers.equalTo("user", user);
                var assessment = new Parse.Query("User_Assessments");
                assessment.get(request.params.assessment, {
                     success: function (assessment) {
                         assessmentAnswers.equalTo("userAssessment", assessment);
                         assessmentAnswers.include("assessmentQuestionAnswered");
                         assessmentAnswers.find({
                            success: function (answers) {
                                for (var answerIndex = 0; answerIndex < answers.length; answerIndex++) {
                                    var answer = answers[answerIndex];
                                    data['Q' + answer.get("assessmentQuestionAnswered").questionNumber] = formAnswerString(answer);
                                }
                                params.add('PPIReceived', data);
                                SOAPClient.invoke(config.get("KAHLER_URL"), params, config.get("KAHLER_SOAP_ACTION"), function (resp) {
                                    xmlReader.read(resp.text, function (nullObject, obj) {
                                        var scoreSections = obj["soap:Envelope"]["soap:Body"]["ELOYAPPISubmitResponse"]["ELOYAPPISubmitResult"]["PPISCORES"]["ScoreSection"].array;
                                        var UserAssessmentResults = Parse.Object.extend("User_Assessment_Results");
                                        var error = false;
                                        for (var sectionIndex = 0; sectionIndex < scoreSections.length; sectionIndex++) {
                                            var section = scoreSections[sectionIndex];
                                            var sectionName = section.attributes()["ID"];
                                            var scores = section["score"].array;
                                            for (var scoreIndex = 0; scoreIndex < scores.length; scoreIndex++) {
                                                var score = scores[scoreIndex];
                                                var attributes = score.attributes();
                                                var callbacks = {
                                                    error: function (obj, error) {
                                                        error = true;
                                                    }
                                                };
                                                if (scoreIndex == scores.length - 1 && sectionIndex == scoreSections.length - 1) {
                                                    callbacks["error"] = function (obj, error) {
                                                        status.error(error.message);
                                                    };
                                                    callbacks["success"] = function () {
                                                        if (error) {
                                                            status.error();
                                                        }
                                                        else {
                                                            status.success();
                                                        }
                                                    };
                                                }
                                                var result = new UserAssessmentResults();
                                                result.set("userAssessment", assessment);
                                                result.set("scoreSection", sectionName);
                                                result.set("scoreName", attributes["ID"]);
                                                result.set("score", parseInt(score.text()));
                                                result.set("base", Boolean(attributes["base"]));
                                                result.set("phase", Boolean(attributes["phase"]));
                                                result.set("stage", (attributes["stage"] != "undefined" && attributes["stage"] != null) ?
                                                    attributes["stage"] :
                                                    (parseInt(score.text()) == 100 && !(Boolean(attributes["base"]) || Boolean(attributes["phase"]))));
                                                result.save(null, callbacks);
                                            }
                                        }
                                    });
                                }, function (resp) {
                                   status.error(resp.text);
                                });
                            },
                            error: function (error) {
                                status.error(error.message);
                            }
                        });
                    },
                    error: function (object, error) {
                        status.error(error.message);
                    }
                });
            });
        },
        error: function (object, error) {
            status.error(error.message);
        }
    });


    function formAnswerString(answer) {
        var answerString = '';
        for (var answerIndex = 1; answerIndex < 6; answerIndex++) {
            var answerRank = answer['answer' + answerIndex + 'Rank'];
            answerString += (answerRank !== null && answerRank !== undefined) ? answerRank : ' ';
        }
        return answerString;
    }
});

// background job for user analytics
Parse.Cloud.job("calculateAnalytics", analyticsBackgroundJob);

Parse.Cloud.define("publishKahler", function (request, response) {
    Parse.Config.get().then(function (config) {
        Parse.Cloud.httpRequest({
            url: 'https://api.parse.com/1/jobs/publishKahlerJob',
            method: 'POST',
            headers: {
                "X-Parse-Application-Id": config.get("APPLICATION_ID"),
                "X-Parse-Master-Key": config.get("MASTER_KEY"),
                "Content-Type": "application/json"
            },
            body: {
                assessment: request.params.assessment,
                user: request.user.id
            }
        }).then(function(httpResponse) {
            response.success(httpResponse);
        }, function(httpResponse) {
            response.error(httpResponse);
        });
    });
});
 */
// TODO: remove Parse.Cloud.beforeDelete when beforeDelete for it is defined in parse-develop
// Parse.Cloud does not have beforeDelete defined in parse develop app
Parse.Cloud.beforeDelete = Parse.Cloud.beforeDelete || function(){};

Parse.Cloud.beforeDelete(Parse.User, function(request, response) {
    var query = new Parse.Query(Parse.User);
    query.include('company', 'primary_personality', "department");
    var objectsToUpdate = [];
    query.get(request.object.id, {
        success: function(user){
            if(user.get("department")){
                user.get("department").increment("user_count", -1);
                objectsToUpdate.push(user.get('department'));
            }
            if(user.get("company")) {
                user.get("company").increment("user_count", -1);

                if (user.get('primary_personality')) {
                    user.get('company').increment(
                        user.get('primary_personality').get('name').toLowerCase() + '_count', -1);
                }
                objectsToUpdate.push(user.get('company'));
            }
            if (objectsToUpdate.length !== 0) {
                Parse.Object.saveAll(objectsToUpdate, {
                    success: function () {
                        request.object = user;
                        response.success();
                    },
                    error: response.error
                });
            }
            else {
                response.success();
            }
        }, error: response.error
    });
});

// Add default department with company if company is has no default department
Parse.Cloud.afterSave("Company", function(request){
    var DepartmentModel = Parse.Object.extend("Department"),
        departmentObject = new DepartmentModel();
    if(!request.object.existed()) {
        request.object.increment("department_count");  // increase the department count for the company
        departmentObject.set("company", request.object);
        departmentObject.set("name", companyConstants.DEFAULT_DEPARTMENT_NAME);
        departmentObject.set("name_lower_case", companyConstants.DEFAULT_DEPARTMENT_NAME.toLowerCase());
        departmentObject.set("user_count", 0);
        departmentObject.save().then(function () {
            console.log("Department Created");
        }, function (error) {
            console.error("company ID: " + request.object.get.id);
            console.error("Company name : " + request.object.get(name));
            console.error("In Company afterSave");
            console.error(error);
        });
    }
});

// Add default question type relation with every new department
Parse.Cloud.afterSave("Department", function(request){

    function errorCallback(error){
        console.error("Department ID : " + request.object.id);
        console.error("In Department afterSave");
        console.error(error);
    }

    var DepartmentQuestionTypeRelationModel = Parse.Object.extend("Department_Question_Type_Relation"),
        questionTypeQueryObject = new Parse.Query("Quiz_Question_Type");
    if(!request.object.existed()) {
        questionTypeQueryObject.limit(1000);

        // if department is not the default department then only fetch default question type only
        if(request.object.get("name_lower_case") !== companyConstants.DEFAULT_DEPARTMENT_NAME.toLowerCase()){
            questionTypeQueryObject.equalTo("name_lower_case", companyConstants.DEFAULT_QUESTION_TYPE_NAME.toLowerCase());
        }

        questionTypeQueryObject.find().then(function (questionTypes) {    // finds the default question type
            var objectsToSave = [];
            for(var index in questionTypes){
                var departmentQuestionTypeRelationObject = new DepartmentQuestionTypeRelationModel();
                departmentQuestionTypeRelationObject.set("department", request.object);
                departmentQuestionTypeRelationObject.set("question_type", questionTypes[index]);
                objectsToSave.push(departmentQuestionTypeRelationObject)
            }
            if (objectsToSave.length > 0) {
                Parse.Object.saveAll(objectsToSave).then(function () {
                    console.log("Question Type and Department relation created")
                }, errorCallback);
            }

        }, errorCallback);
    }
});
