var assessmentConstants = require('./constants'),
    userConstants = require('../user/constants.js'),
    commonUtils = require('../common/utils.js'),
    secret = require('../../secret.js'),
    appSettings = require('../../app_settings.js'),
    soap = require('../../packages/soap.js');

// Function that applies validations on ranks received from user.
exports.ranksValidationsCheck = function(ranksDict) {
    var validationsResponse = false,
        sequenceBreak = false, ranksSelected = [];

    // check if atleast 1 rank is selected.
    for(var key in ranksDict){
        if(ranksDict[key] != ''){
            validationsResponse = true;
            ranksDict[key] = parseInt(ranksDict[key]);
            if(!isNaN(ranksDict[key]) && (ranksDict[key] > assessmentConstants.MAX_ANSWER_IN_ASSESSMENT || ranksDict[key] < 1)){
                validationsResponse = false;
            }
        }
    }
    // check if No 2 answers have same rank. and answers are in sequence
    if(validationsResponse){
        var ranksDictLength = Object.keys(ranksDict).length,
            thisRank;
        for(var i = 0; i < ranksDictLength; i++){
            thisRank = ranksDict['rank_answer'+(i+1)];
             // if sequence of answer breaks it sets the flag to false, after setting it false is any answer is fund it will set the validation to false
            if(isNaN(thisRank) || !thisRank){
                ranksDict['rank_answer' + (i + 1)] = "";
            }
            else{
                // sets the selected ans in the selectedRank map so that if any answer is repeated it'll invalidate the answers
                if(!ranksSelected[thisRank]){
                    ranksSelected[thisRank] = true;
                }
                else{
                    validationsResponse = false;
                    break;
                }
            }

        }
        validationsResponse = validationsResponse && ranksSelected[1]; // to check if first rank is selected
        if(validationsResponse) {
            for (var index = 2; index < ranksSelected.length; index++) { // check if answers are in sequence of not
                if(!sequenceBreak && !ranksSelected[index]){
                    sequenceBreak = true;
                }
                else if(sequenceBreak && ranksSelected[index]){
                    validationsResponse = false;
                    break;
                }
            }
        }
    }

    return validationsResponse;
};

function getNewAnswerObject(currentUser, latestQuestionAttempted, assessmentObject, ranksDict){
    var ranksDictLength = Object.keys(ranksDict).length,
        rank,
        UserAssessmentAnswers = Parse.Object.extend('User_Assessment_Answers'),
        UserAssessmentAnswersObject = new UserAssessmentAnswers();

    for(var i=0; i<ranksDictLength; i++){
        if(ranksDict['rank_answer'+(i+1)] == ''){
            rank = null;
        }
        else {
            rank = parseInt(ranksDict['rank_answer'+(i+1)]);
        }
        UserAssessmentAnswersObject.set('answer'+(i+1)+'Rank', rank);
    }
    UserAssessmentAnswersObject.set('assessmentQuestionAnswered', latestQuestionAttempted);
    UserAssessmentAnswersObject.set('user', currentUser);
    UserAssessmentAnswersObject.set('userAssessment', assessmentObject);
    return UserAssessmentAnswersObject;
}

// Function that saves user response of newly attempted question.
exports.saveQuestionResponse = function(currentUser, assessmentObject, latestAttemptedQuestionNumber, ranksDict, successCallback, errorCallback) {
    var  userAssessmentAnswersObject;

    // fetch question.
    exports.fetchAssessmentQuestions(currentUser,[latestAttemptedQuestionNumber], function(questions){
        var latestQuestionAttempted = questions[latestAttemptedQuestionNumber];
        assessmentObject.set('lastQuestionAnswered', latestQuestionAttempted);
        userAssessmentAnswersObject = getNewAnswerObject(currentUser, latestQuestionAttempted, assessmentObject, ranksDict);
        // we are setting assessment object in assessment answer object so assessment object will be saved with the assessment answer object
        userAssessmentAnswersObject.save().then(successCallback, errorCallback);

    }, errorCallback);
};


// Function that checks if next question is already attempted earlier and if yes, return its old answers.
exports.checkIfNextQuestionAlreadyAttempted = function (currentUser, assessmentObject, nextQuestion, successCallback, errorCallback) {
    var UserAssessmentAnswers = Parse.Object.extend('User_Assessment_Answers'),
        assessmentAnswersQuery = new Parse.Query(UserAssessmentAnswers);

    assessmentAnswersQuery.equalTo('userAssessment', assessmentObject);
    assessmentAnswersQuery.equalTo('assessmentQuestionAnswered', nextQuestion);
    assessmentAnswersQuery.find({
        success: function(answers) {
            successCallback(answers);
        },
        error: errorCallback
    })
};


// Function that return answers of a question.
exports.fetchAssessmentQuestionAnswers = function(currentUser, assessmentObject, prevQuestion, successCallback, errorCallback) {
    var UserAssessmentAnswers = Parse.Object.extend('User_Assessment_Answers'),
        assessmentAnswersQuery = new Parse.Query(UserAssessmentAnswers);

    assessmentAnswersQuery.equalTo('userAssessment', assessmentObject);
    assessmentAnswersQuery.equalTo('assessmentQuestionAnswered', prevQuestion);
    assessmentAnswersQuery.first({
        success: function(answers){
            successCallback(answers);
        },
        error: errorCallback
    });
};


// Function that returns particular assessment question object.
exports.fetchQuestion = function (currentUser, questionNumber, successCallback, errorCallback) {
    var AssessmentQuestions = Parse.Object.extend('Assessment_Questions'),
        assessmentQuestionsQuery = new Parse.Query(AssessmentQuestions);

    assessmentQuestionsQuery.equalTo('questionNumber', questionNumber);
    assessmentQuestionsQuery.first({
        success: function(question) {
            successCallback(question);
        },
        error: errorCallback
    });
};


// Function that returns answers for any question if already answered.
exports.checkIfQuestionAlreadyAttempted = function(currentUser, assessmentObject, questionNumber, successCallback, errorCallback) {
    var AssessmentQuestions = Parse.Object.extend('Assessment_Questions'),
        assessmentQuestionsQuery =  new Parse.Query(AssessmentQuestions),
        UserAssessmentAnswers = Parse.Object.extend('User_Assessment_Answers'),
        assessmentAnswersQuery = new Parse.Query(UserAssessmentAnswers);

    assessmentQuestionsQuery.equalTo('questionNumber', questionNumber);
    exports.fetchAssessmentQuestions(currentUser, [questionNumber], function(questions){
        exports.fetchAssessmentQuestionResponses(currentUser, assessmentObject, [questions[questionNumber]], function(answers){
            successCallback(answers[questionNumber]);
        }, errorCallback);
    }, errorCallback);

};


// Function that returns next assessment question.
exports.fetchAssessmentQuestion = function(user, QuestionNumber, successCallback, errorCallback){
    var AssessmentQuestions = Parse.Object.extend('Assessment_Questions'),
        assessmentQuestionsQuery = new Parse.Query(AssessmentQuestions);

    assessmentQuestionsQuery.equalTo('questionNumber', QuestionNumber);
    assessmentQuestionsQuery.first({
        success: function(assessmentQuestion){
            successCallback(assessmentQuestion);
        },
        error: errorCallback
    });
};


// Function that returns latest assessment of the user.
exports.fetchUserLatestAssessment = function(user, successCallback, errorCallback) {
    var UserAssessments = Parse.Object.extend('User_Assessments'),
        userAssessmentsQuery = new Parse.Query(UserAssessments);
    userAssessmentsQuery.equalTo('user', user);
    userAssessmentsQuery.descending('createdAt');
    userAssessmentsQuery.include('lastQuestionAnswered');
    userAssessmentsQuery.equalTo('completed', false);
    userAssessmentsQuery.first({
        success: function (assessmentObject) {  // success
            successCallback(assessmentObject);
        },
        error: errorCallback
    });
};

 
// Function that saves answers for the non-attempted question and returns its NEXT question.
exports.saveNonAttemptedQuestion = function (currentUser, assessmentObject, questionNumber, ranksDict, successCallback, errorCallback) {

    // save user response of the question
    exports.saveQuestionResponse(currentUser, assessmentObject, questionNumber, ranksDict,
        function (currentAnswerObject) {   // success callback
            // fetch next question
            exports.fetchAssessmentQuestions(currentUser, [questionNumber + 1],
                function(questions) {    // success callback
                    var context = {},
                        nextQuestion = questions[questionNumber + 1];
                    context['question'] = nextQuestion;
                    context['presentQuestionNumber'] = nextQuestion.get('questionNumber');
                    successCallback(context);

                }, errorCallback
            );
        }, errorCallback
    );
}; 


// Function that saves new answers for already attempted question and returns its next question.
exports.saveAlreadyAttemptedQuestionAndFetchNext = function(currentUser, assessmentObject, questionNumber, answer, ranksDict, successCallback, errorCallback) {

    if((!assessmentObject.get("lastQuestionAnswered") && questionNumber === 1) ||
        (assessmentObject.get("lastQuestionAnswered") && questionNumber === assessmentObject.get("lastQuestionAnswered").get("questionNumber") + 1)){
        assessmentObject.set("lastQuestionAnswered", answer.get("assessmentQuestionAnswered"));
        answer.set("userAssessment", assessmentObject);
    }

    var data = {}, context = {},
        prevAnswers = {};

    // save new responses for this question
    var ranksDictLength = Object.keys(ranksDict).length,
        rank;
    for (var i = 0; i < ranksDictLength; i++) {
        if (ranksDict['rank_answer' + (i + 1)] == '') {
            rank = null;
        }
        else {
            rank = parseInt(ranksDict['rank_answer' + (i + 1)]);
        }
        answer.set('answer' + (i + 1) + 'Rank', rank);
    }
    answer.save().then(function () {
        // fetch next question
        exports.fetchAssessmentQuestions(currentUser, [questionNumber +1],
            function (questions) {   // success callback
                var nextQuestion = questions[questionNumber + 1];
                // check if next question is already attempted earlier.
                exports.fetchAssessmentQuestionResponses(currentUser, assessmentObject, [nextQuestion],
                    function (answers) { // success callback
                        var answer = answers[nextQuestion.get("questionNumber")];
                        if (answer) {    // if next question is already attempted by user earlier
                            for (var i = 1; i <= assessmentConstants.MAX_ANSWER_IN_ASSESSMENT; i++) {
                                prevAnswers['rank_answer' + i] = answer.get('answer' + i + 'Rank');
                            }
                            data['prevAnswers'] = prevAnswers;
                            context['question'] = nextQuestion;
                            context['presentQuestionNumber'] = nextQuestion.get('questionNumber');
                            successCallback(context, data);
                        }
                        else {  // If user has not yet attempted next question
                            context['question'] = nextQuestion;
                            context['presentQuestionNumber'] = nextQuestion.get('questionNumber');
                            successCallback(context, data);
                        }
                    }, errorCallback
                );
            }, errorCallback
        );
    }, errorCallback);
};


// Function that fetches previous question and its old answers.
exports.fetchPrevQuestionAndPrevAnswers = function(currentUser, assessmentObject, questionNumber, successCallback, errorCallback) {
    var data = {}, context = {}, prevAnswers = {};

    // fetch prev question
    exports.fetchAssessmentQuestions(currentUser, [questionNumber - 1],
        function(questions) {    // success callback
            var prevQuestion = questions[questionNumber - 1];
            // fetch its prev answers
            exports.fetchAssessmentQuestionResponses(currentUser, assessmentObject, [prevQuestion],
                function(answers) {
                    var answer = answers[prevQuestion.get("questionNumber")];
                    context['question'] = prevQuestion;
                    context['presentQuestionNumber'] = questionNumber - 1;

                    for(var i=1; i <= assessmentConstants.MAX_ANSWER_IN_ASSESSMENT; i++) {
                        prevAnswers['rank_answer' + i] = (answer? answer.get('answer' + i + 'Rank') : '');
                    }
                    data['prevAnswers'] = prevAnswers;
                    successCallback(context, data);
                }, errorCallback
            );
        }, errorCallback
    );
}; 

// Function that saves new responses for already attempted question and fetches its previous question.
exports.saveNewResponsesAndFetchPrevQuestion = function(currentUser, assessmentObject, questionNumber, answer, ranksDict, successCallback, errorCallback) {

    // save new responses
    var ranksDictLength = Object.keys(ranksDict).length,
        rank,
        prevAnswers = {},
        context = {},
        data = {};

    for (var i = 0; i < ranksDictLength; i++) {
        if (ranksDict['rank_answer' + (i + 1)] == '') {
            rank = null;
        }
        else {
            rank = parseInt(ranksDict['rank_answer' + (i + 1)]);
        }
        answer.set('answer' + (i + 1) + 'Rank', rank);
    }
    // fetch previous question
    exports.fetchAssessmentQuestions(currentUser, [questionNumber -1],
        function(questions) {    // success callback
            var prevQuestion = questions[questionNumber - 1];
            // fetch its prev answers
            exports.fetchAssessmentQuestionResponses(currentUser, assessmentObject, [prevQuestion],
                function(answers) {
                    var prevQuestionAnswer = answers[prevQuestion.get("questionNumber")];
                    context['question'] = prevQuestion;
                    context['presentQuestionNumber'] = prevQuestion.get('questionNumber');

                    for(var i=1; i<=assessmentConstants.MAX_ANSWER_IN_ASSESSMENT; i++) {
                        prevAnswers['rank_answer' + i] = prevQuestionAnswer.get('answer' + i + 'Rank');
                    }
                    data['prevAnswers'] = prevAnswers;
                    answer.save().then(function(){
                        successCallback(context, data);
                    }, errorCallback);
                }, errorCallback
            );
        }, errorCallback
    );
};

 
// Function that saves answers for newly attempted question and returns its previous question.
exports.saveResponsesAndFetchPrevQuestion = function(currentUser, assessmentObject, questionNumber, question, ranksDict, successCallback, errorCallback) {

    // save responses for this
    var UserAssessmentAnswers = Parse.Object.extend('User_Assessment_Answers'),
        UserAssessmentAnswersObject = new UserAssessmentAnswers(),
        ranksDictLength = Object.keys(ranksDict).length,
        rank, context = {}, data = {}, prevAnswers = {};

    for(var i=0; i<ranksDictLength; i++){
        if(ranksDict['rank_answer'+(i+1)] == ''){
            rank = null;
        }
        else {
            rank = parseInt(ranksDict['rank_answer'+(i+1)]);
        }
        UserAssessmentAnswersObject.set('answer'+(i+1)+'Rank', rank);
    }
    assessmentObject.set('lastQuestionAnswered', question); // update 'lastQuestionAnswered' field in 'User_Assessments'.
    UserAssessmentAnswersObject.set('assessmentQuestionAnswered', question);
    UserAssessmentAnswersObject.set('user', currentUser);
    UserAssessmentAnswersObject.set('userAssessment', assessmentObject);

    //fetch old question
    exports.fetchAssessmentQuestions(currentUser, [questionNumber - 1],
        function (questions) {    // success callback
            var prevQuestion = questions[questionNumber - 1];
            // fetch its prev answers
            exports.fetchAssessmentQuestionResponses(currentUser, assessmentObject, [prevQuestion],
                function (answers) { // success callback
                    var answer = answers[prevQuestion.get("questionNumber")];
                    context['question'] = prevQuestion;
                    context['presentQuestionNumber'] = prevQuestion.get('questionNumber');
                    for (var i = 1; i <= assessmentConstants.MAX_ANSWER_IN_ASSESSMENT; i++) {
                        prevAnswers['rank_answer' + i] = answer.get('answer' + i + 'Rank');
                    }
                    data['prevAnswers'] = prevAnswers;
                    // we are setting assessment object in assessment answer object so assessment object will be saved with the assessment answer object
                    UserAssessmentAnswersObject.save().then(function(){
                        successCallback(context, data);
                    }, errorCallback);
                }, errorCallback
            );
        }, errorCallback
    );
};
 
exports.saveLastQuestionIfNotAlreadyAttempted = function(currentUser, assessmentObject, questionNumber, ranksDict, successCallback, errorCallback) {
    // fetch question.
    var AssessmentQuestions = Parse.Object.extend('Assessment_Questions'),
        assessmentQuestionsQuery = new Parse.Query(AssessmentQuestions),
        UserAssessmentAnswers = Parse.Object.extend('User_Assessment_Answers'),
        UserAssessmentAnswersObject;

    assessmentQuestionsQuery.equalTo('questionNumber', questionNumber);
    exports.fetchAssessmentQuestions(currentUser, [questionNumber], function(questions){
        var latestQuestionAttempted = questions[questionNumber];
        UserAssessmentAnswersObject = new UserAssessmentAnswers();

        // save responses in this new instance.
        var ranksDictLength = Object.keys(ranksDict).length,
            rank;

        for (var i = 0; i < ranksDictLength; i++) {
            if (ranksDict['rank_answer' + (i + 1)] == '') {
                rank = null;
            }
            else {
                rank = parseInt(ranksDict['rank_answer' + (i + 1)]);
            }
            UserAssessmentAnswersObject.set('answer' + (i + 1) + 'Rank', rank);
        }
        // update 'lastQuestionAnswered' field in 'User_Assessments'.
        assessmentObject.set('lastQuestionAnswered', latestQuestionAttempted);

        UserAssessmentAnswersObject.set('assessmentQuestionAnswered', latestQuestionAttempted);
        UserAssessmentAnswersObject.set('user', currentUser);
        UserAssessmentAnswersObject.set('userAssessment', assessmentObject);
        UserAssessmentAnswersObject.save().then(function(){
            successCallback();
        }, errorCallback);
    }, errorCallback)
};


// Function that calls Kahler API and stores results in database.
exports.callKahlerAPI = function(user, assessment, successCallback, errorCallback) {

    // function that destroys old assessment results if any
    function destroyOldResults(assessment, successCallback, errorCallback){
        var assessmentRestultsQuery = new Parse.Query("User_Assessment_Results");
        assessmentRestultsQuery.equalTo("userAssessment", assessment);
        assessmentRestultsQuery.find().then(function(assessmentResults){
            if(assessmentResults && assessmentResults.length > 0){
                Parse.Object.destroyAll(assessmentResults).then(successCallback, errorCallback);
            }
            else{
                successCallback();
            }
        }, errorCallback);
    }

    Parse.Config.get().then(
        function (config) {
            var xmlReader = require('cloud/packages/xmlreader.js');
            var SOAPClient = soap.SOAPClient;
            var SOAPClientParameters = soap.SOAPClientParameters;
            var params = new SOAPClientParameters();
            params.add('sTrainerID', config.get("KAHLER_ID"));
            params.add('sTrainerPass', config.get("KAHLER_PASS"));
            var data = {
                'email': user.get('email')
            };
            var assessmentAnswers = new Parse.Query("User_Assessment_Answers");
            assessmentAnswers.equalTo("user", user);
            assessmentAnswers.equalTo("userAssessment", assessment);
            assessmentAnswers.include("assessmentQuestionAnswered");
            assessmentAnswers.find({
                success: function (answers) {
                    for (var answerIndex = 0; answerIndex < answers.length; answerIndex++) {
                        var answer = answers[answerIndex];
                        data['Q' + answer.get("assessmentQuestionAnswered").get('questionNumber')] = formAnswerString(answer);
                    }
                    params.add('PPIReceived', data);
                    SOAPClient.invoke(config.get("KAHLER_URL"), params, config.get("KAHLER_SOAP_ACTION"), function (resp) {
                        xmlReader.read(resp.text, function (nullObject, obj) {
                            var scoreSections = obj["soap:Envelope"]["soap:Body"]["ELOYAPPISubmitResponse"]["ELOYAPPISubmitResult"]["PPISCORES"]["ScoreSection"].array,
                                qvString = obj["soap:Envelope"]["soap:Body"]["ELOYAPPISubmitResponse"]["ELOYAPPISubmitResult"]["PPISCORES"]["QVSTRING"].text(),
                                personality = Parse.Object.extend('Personality'),
                                personalityQuery = new Parse.Query(personality);
                            personalityQuery.find({
                                success: function (personalites) {
                                    var personalityMap = {},
                                        UserAssessmentResults = Parse.Object.extend("User_Assessment_Results"),
                                        userAssessmentResultList = [];
                                    for (var personalityIndex in personalites){
                                        var personalityObject = personalites[personalityIndex];
                                        personalityMap[assessmentConstants.PERSONALITY_NAME_MAP[personalityObject.get('name').toLowerCase()]] = personalityObject;
                                    }
                                    destroyOldResults(assessment, function () {
                                        for (var sectionIndex = 0; sectionIndex < scoreSections.length; sectionIndex++) {
                                            var section = scoreSections[sectionIndex];
                                            var sectionName = section.attributes()["ID"];
                                            var scores = section["score"].array;
                                            assessment.set("qvString", qvString);
                                            if (sectionName.toLowerCase() == userConstants.SCORE_SECTION.toLowerCase()) {
                                                for (var scoreIndex = 0; scoreIndex < scores.length; scoreIndex++) {
                                                    var score = scores[scoreIndex];
                                                    var attributes = score.attributes();
                                                    var assessmentPersonality = personalityMap[attributes["ID"].toLowerCase()];
                                                    var result = new UserAssessmentResults();
                                                    result.set("userAssessment", assessment);
                                                    result.set("scoreSection", sectionName);
                                                    result.set("scoreName", attributes["ID"]);
                                                    result.set("sequence", parseInt(attributes["seq"]));
                                                    result.set("score", parseInt(score.text()));
                                                    result.set("base", Boolean(attributes["base"]));
                                                    result.set("phase", Boolean(attributes["phase"]));
                                                    result.set("stage", (String(attributes["stage"]) != "undefined" && String(attributes["stage"]) != "null") ?
                                                        Boolean(attributes["stage"]) :
                                                        (parseInt(score.text()) == 100 && !(Boolean(attributes["base"]) || Boolean(attributes["phase"]))));
                                                    result.set("personality", assessmentPersonality);
                                                    if (Boolean(attributes["base"])) {
                                                        user.set('primary_personality', assessmentPersonality);
                                                        user.set("assessment", assessment);
                                                        if(user.get('company')) { // update count of user for given personality and company
                                                            user.get('company').increment(assessmentPersonality.get('name').toLowerCase() + '_count');
                                                        }
                                                        if(user.get('department')) { // update count of user for given personality and company
                                                            user.get('department').increment(assessmentPersonality.get('name').toLowerCase() + '_count');
                                                        }
                                                    }
                                                    userAssessmentResultList.push(result);
                                                }
                                            }
                                        }

                                        var objectsToSave = userAssessmentResultList;
                                        objectsToSave.push(user);
                                        Parse.Object.saveAll(objectsToSave, {
                                            success: function () {
                                                successCallback(user);
                                            },
                                            error: errorCallback
                                        });
                                    }, errorCallback);
                                },
                                error: errorCallback
                            });
                        });
                    }, errorCallback);
                },
                error: errorCallback
            });
        },
        function (object, error) {
            errorCallback(error);
        }
    );

    function formAnswerString(answer) {
        var answerString = '';
        for (var answerIndex = 1; answerIndex < 6; answerIndex++) {
            var answerRank = answer.get('answer' + answerIndex + 'Rank');
            answerString += (answerRank !== null && answerRank !== undefined) ? answerRank : ' ';
        }
        return answerString;
    }
};

// function  returns data to add user in assessment complete list at pardot
// don't change the sequence of hashing
// for correct sequence check app/user/utils/ function: "validateDataForPardotCall"
exports.getDataForAssessmentCompletePardotCall = function(email, successCallback){
    var hash, listName, timeStamp = (new Date()).getTime();
    listName = appSettings.PARDOTS_LIST_NAMES['ASSESSMENT_COMPLETE'];
    hash = require('cloud/packages/md5.js').hex_md5(secret.securityKey1 + email + listName + timeStamp + secret.securityKey2);
    successCallback({
        success: true,
        email: email,
        listName: listName,
        hash: hash,
        timeStamp: timeStamp
    })
};

//This function fetches the questions with the number given in array 'questionNumbers'  and saves them in user object
exports.fetchAssessmentQuestions = function(user, questionNumbers, successCallback, errorCallback){

    function getQuestions(questionsToFetch){
        var assessmentQuestionQuery = new Parse.Query("Assessment_Questions");
        assessmentQuestionQuery.containedIn("questionNumber", questionsToFetch);
        assessmentQuestionQuery.find().then(function(questions){
            for(var index in questions){
                user._question[questions[index].get("questionNumber")] = questions[index];
            }
            successCallback(user._question);
        }, errorCallback);
    }

    var questionsToFetch = [];
    if(user._question){
        for(var questionIndex in questionNumbers){
            if(!user._question[questionNumbers[questionIndex]]){
                questionsToFetch.push(questionNumbers[questionIndex]);
            }
        }
        if(questionsToFetch.length > 0){
            getQuestions(questionsToFetch);
        }
        else{
            successCallback(user._question);
        }
    }
    else{
        questionsToFetch = questionNumbers
        user._question = {};
        getQuestions(questionsToFetch);
    }

};

//This function fetches the answers of the questions  given in array 'question'  and saves them in user object
// if answer is not found of any question then it saves false at that answer place instead
exports.fetchAssessmentQuestionResponses = function(user, userAssessment, questions, successCallback, errorCallback){
    function getAnswers(questionsAnswersToFetch){
        var assessmentAnswerQuery = new Parse.Query("User_Assessment_Answers");
        assessmentAnswerQuery.equalTo("userAssessment", userAssessment);
        assessmentAnswerQuery.containedIn("assessmentQuestionAnswered", questionsAnswersToFetch);
        assessmentAnswerQuery.include("assessmentQuestionAnswered");
        assessmentAnswerQuery.find().then(function(answers){
            for(var index in answers){
                var questionNumber = answers[index].get("assessmentQuestionAnswered").get("questionNumber");
                user._answer[questionNumber] = answers[index];
            }
            successCallback(user._answer);
        }, errorCallback);
    }

    var questionsAnswersToFetch = [];
    if(user._answer){
        for(var questionIndex in questions){
            var questionObject = questions[questionIndex],
                questionNumber = questionObject.get("questionNumber");
            if(!user._answer[questionNumber] && user._answer[questionNumber] != false){
                questionsAnswersToFetch.push(questionObject);
            }
        }
        if(questionsAnswersToFetch.length > 0){
            getAnswers(questionsAnswersToFetch);
        }
        else{
            successCallback(user._answer);
        }
    }
    else{
        user._answer = {};
        for(var questionIndex in questions){
            user._answer[questions[questionIndex].get("questionNumber")] = false;
        }
        questionsAnswersToFetch = questions;
        getAnswers(questionsAnswersToFetch);
    }
};

exports.sendPdfReportMail = function(user, successCallback){
    var settingsQueryObject = new Parse.Query('Settings'),
        campaignId, emailTemplateId;
    settingsQueryObject.containedIn('name', [appSettings.CAMPAIGN, appSettings.PARDOT_EMAIL_TEMPLATE_NAME.PDF_REPORT]);
    settingsQueryObject.find().then(function(result){
        if(result.length == 2){
            for(var index = 0; index < result.length; index++){
                if(result[index].get('name') == appSettings.CAMPAIGN){
                    campaignId = result[index].get('value');
                }
                else if(result[index].get('name') == appSettings.PARDOT_EMAIL_TEMPLATE_NAME.PDF_REPORT){
                    emailTemplateId = result[index].get('value');
                }
            }
            commonUtils.sendEmailToUser(user.get('email'), campaignId, emailTemplateId, successCallback);
        }
        else{
            logger.log("ERROR in settings query");
            successCallback();
        }
    },function(error){
        logger.log("ERROR in settings query");
        logger.log(error);
        successCallback();
    });
};
