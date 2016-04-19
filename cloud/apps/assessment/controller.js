// All controllers for explore app
var assessmentConstants = require('cloud/apps/assessment/constants'),
    userUtils = require('cloud/apps/user/utils'),
    assessmentUtils = require('cloud/apps/assessment/utils'),
    userConstants = require('cloud/apps/user/constants.js'),
    appSettings = require('cloud/app_settings.js'),
    _ = require('underscore'),
    commonUtils = require('cloud/apps/common/utils.js');


// on boarding flow step one controller
exports.onBoardingStepOneController = function(req, res) {
    var videoUrl = assessmentConstants.ON_BOARDING_ONE_VIDEO_URL,
        videoHashRegex = /iframe\/(.*)?\?/i,
        videoHash = (videoHashRegex.exec(videoUrl))[1],
        videoThumbnail = commonUtils.getAbsoluteUrlForWorkstyle(req.app.namedRoutes.build('video.thumbnail', {video_hash: videoHash}));
    res.render('assessment/onboarding_step_one.ejs', {
        extra_class: 'transparent', // makes header transparent
        nav_items: false, // not show navigation headers,
        video_url: videoUrl,
        video_thumbnail: videoThumbnail,
        bind_class: 'show-next-button'
    });
};

// on boarding flow step two controller
exports.onBoardingStepTwoController = function(req, res) {
    res.render('assessment/onboarding_step_two.ejs', {
        extra_class: 'transparent', // makes header transparent
        nav_items: false // not show navigation headers
    });
};

// assessment overview
exports.introController = function(req, res) {
    res.render('assessment/intro.ejs', {
        extra_class: 'transparent', // makes header transparent
        nav_items: false // not show navigation headers
    });
};

// controller to load first question of new assessment of new question after last question for incomplete assessment
exports.assessmentStartController = function (req, res) {
    function createNewAssessmentIfNotAny(assessment, successCallback, errorCallback) {
        if (!assessment) { // create a new assessment if not assessment exists
            assessment = new UserAssessment();
            assessment.set('user', req.currentUser);
            assessment.set('completed', false);
            assessment.save().then(successCallback, errorCallback);
        }
        else {
            successCallback(assessment);
        }
    }

    var UserAssessment = Parse.Object.extend('User_Assessments'),
        assessmentQuery = new Parse.Query(UserAssessment), // query to fetch incomplete assessment
        errorCallback = req.errorCallback;
    assessmentQuery.include('lastQuestionAnswered');
    assessmentQuery.descending('completedAt');
    assessmentQuery.equalTo('completed', false);
    assessmentQuery.equalTo('user', req.currentUser);
    assessmentQuery.first({
        success: function (assessment) {

            createNewAssessmentIfNotAny(assessment, function (assessment) {
                var lastQuestion = assessment.get('lastQuestionAnswered'),
                    questionNumber = lastQuestion ? lastQuestion.get('questionNumber') + 1 : 1; // question is next to last question or first question
                if (questionNumber <= assessmentConstants.MAX_QUESTIONS_IN_ASSESSMENT) {
                    var Question = Parse.Object.extend('Assessment_Questions'),
                        questionQuery = new Parse.Query(Question);

                    questionQuery.equalTo('questionNumber', questionNumber); // query to fetch first question or question next last question
                    questionQuery.first({
                        success: function (question) {
                            res.render('assessment/assessment_question', { // render assessment page with question
                                question: question,
                                answerCount: assessmentConstants.MAX_ANSWER_IN_ASSESSMENT, // max options
                                rankCount: assessmentConstants.MAX_RANK, // max rank
                                presentQuestionNumber: questionNumber,
                                maxQuestionsCount: assessmentConstants.MAX_QUESTIONS_IN_ASSESSMENT,
                                extra_class: 'transparent', // makes header transparent
                                nav_items: false // not show navigation headers
                            });
                        },
                        error: errorCallback
                    })
                }

                else {
                    assessmentUtils.fetchAssessmentQuestionAnswers(req.currentUser, assessment, lastQuestion,
                        function (answers) {
                            var answersObject = {};
                            for (var i = 1; i <= assessmentConstants.MAX_ANSWER_IN_ASSESSMENT; i++) {
                                answersObject['rank_answer' + i] = answers.get('answer' + i + 'Rank');
                            }
                            res.render('assessment/assessment_question', { // render assessment page with question
                                question: lastQuestion,
                                answerCount: assessmentConstants.MAX_ANSWER_IN_ASSESSMENT, // max options
                                rankCount: assessmentConstants.MAX_RANK, // max rank
                                presentQuestionNumber: lastQuestion.get('questionNumber'),
                                maxQuestionsCount: assessmentConstants.MAX_QUESTIONS_IN_ASSESSMENT,
                                extra_class: 'transparent', // makes header transparent
                                nav_items: false, // not show navigation headers
                                answers: answersObject
                            });
                        },
                        errorCallback);
                }
            }, errorCallback);
        },
        error: errorCallback
    });
};

// Function that is called on 'NEXT' button press.
exports.assessmentQuestionNext = function(req, res) {

    // function to render next question of the last attempted question
    // if last attempted question pointer is undefined or invalid then it'll render question number 1
    function renderNextQuestion(assessmentObject){
        var questionToRender = 1;
        if(assessmentObject && assessmentObject.get("lastQuestionAnswered") && typeof assessmentObject.get("lastQuestionAnswered").get("questionNumber") === "number"){
            questionToRender = assessmentObject.get("lastQuestionAnswered").get("questionNumber") + 1 || 1;
            if(questionToRender > assessmentConstants.MAX_QUESTIONS_IN_ASSESSMENT){
                questionToRender = 1;
            }
        }
        assessmentUtils.fetchAssessmentQuestions(currentUser, [questionToRender], function(questions){
            if(questions){
                context.question = questions[questionToRender];
                context.presentQuestionNumber = questions[questionToRender].get('questionNumber');
                var data = {};
                res.render('assessment/_next_question', context, function (error, html) {
                    data['html'] = html;
                    res.send({success: true, content: data});
                });
            }
            else{
                errorCallback();
            }
        }, errorCallback);
    }

    var currentUser = Parse.User.current(),
        questionNumber = parseInt(req.query.presentQuestionNumber),
        ranksDict = req.query.options,
        errorCallback = req.errorCallback,
        context = {
            answerCount: assessmentConstants.MAX_ANSWER_IN_ASSESSMENT, // max options
            rankCount: assessmentConstants.MAX_RANK, // max rank
            maxQuestionsCount: assessmentConstants.MAX_QUESTIONS_IN_ASSESSMENT,
            layout: 'layout_partial'
        };
    if(isNaN(questionNumber) || questionNumber < 1 || questionNumber > assessmentConstants.MAX_QUESTIONS_IN_ASSESSMENT){
        assessmentUtils.fetchUserLatestAssessment(currentUser, function(assessmentObject){
            renderNextQuestion(assessmentObject);
        }, errorCallback);
    }
    else if (assessmentUtils.ranksValidationsCheck(ranksDict, questionNumber) && questionNumber >= 1 && questionNumber < assessmentConstants.MAX_QUESTIONS_IN_ASSESSMENT) {   // validation checks
        var latestAttemptedQuestionNumber;

        // fetch user's latest assessment
        assessmentUtils.fetchUserLatestAssessment(currentUser,
            function (assessmentObject) {    // If user has some latest assessment
                // fetches the questions and cache them in user object
                if((typeof assessmentObject.get('lastQuestionAnswered') === "undefined" && questionNumber == 1) || (assessmentObject.get('lastQuestionAnswered') && questionNumber <= assessmentObject.get('lastQuestionAnswered').get("questionNumber") + 1)) {  // If user has already attempted at least 1 question of this assessment
                    assessmentUtils.fetchAssessmentQuestions(currentUser, [questionNumber, questionNumber + 1], function (questions) {
                        latestAttemptedQuestionNumber = questionNumber;
                        // Querying if present question is already attempted previously by the user.
                        assessmentUtils.fetchAssessmentQuestionResponses(currentUser, assessmentObject, [questions[questionNumber], questions[questionNumber + 1]], function () {
                            assessmentUtils.checkIfQuestionAlreadyAttempted(currentUser, assessmentObject, questionNumber,
                                function (answer) { // success callback
                                    if (answer) { // if present question is already attempted
                                        assessmentUtils.saveAlreadyAttemptedQuestionAndFetchNext(currentUser, assessmentObject, latestAttemptedQuestionNumber, answer, ranksDict,
                                            function (addedContext, data) {  // success callback
                                                var newContext = {};
                                                _.extend(newContext, context, addedContext);
                                                res.render('assessment/_next_question', newContext, function (error, html) {
                                                    data['html'] = html;
                                                    res.send({success: true, content: data});
                                                });
                                            }, errorCallback
                                        );
                                    }
                                    else{  // if user is the question just next to the last question attempted
                                        // save user response
                                        assessmentUtils.saveNonAttemptedQuestion(currentUser, assessmentObject, questionNumber, ranksDict,

                                            function (addedContext) {
                                                var data = {}, newContext = {};
                                                _.extend(newContext, context, addedContext);
                                                res.render('assessment/_next_question', newContext, function (error, html) {
                                                    data['html'] = html;
                                                    res.send({success: true, content: data});
                                                });
                                            }, errorCallback
                                        );
                                    }
                                }, errorCallback
                            );
                        }, errorCallback);
                    }, errorCallback)
                }
                else{
                    renderNextQuestion(assessmentObject);
                }
            }, errorCallback
        );
    }
    else if (assessmentUtils.ranksValidationsCheck(ranksDict, questionNumber) && questionNumber == assessmentConstants.MAX_QUESTIONS_IN_ASSESSMENT) {  // if either user has attempted last question or validations have failed.
        // fetch user's latest assessment
        assessmentUtils.fetchUserLatestAssessment(currentUser, function (assessmentObject) {    // If user has some latest assessment
            // fetch the given question number and cache in user object
            assessmentUtils.fetchAssessmentQuestions(currentUser, [questionNumber], function () {
                if (assessmentObject.get("lastQuestionAnswered").get("questionNumber") === (questionNumber - 1)) {  // if last question is getting attempted first time.
                    // save the responses.
                    assessmentUtils.saveLastQuestionIfNotAlreadyAttempted(currentUser, assessmentObject, questionNumber, ranksDict,

                        function () {    // success callback
                            res.send({finalPage: true, success: true});
                        },
                        errorCallback
                    );

                }
                else if ((assessmentObject.get("lastQuestionAnswered").get("questionNumber") === (questionNumber))) {    // if last question has already been attempted by the user.
                    // Querying if present question is already attempted previously by the user.
                    assessmentUtils.checkIfQuestionAlreadyAttempted(currentUser, assessmentObject, questionNumber,
                        function (answer) { // success callback
                            if(answer) {
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
                                answer.save(null).then(function () {
                                    res.send({finalPage: true, success: true});
                                }, errorCallback);
                            }
                            else{
                                renderNextQuestion(assessmentObject);
                            }
                        },
                        errorCallback
                    );
                }
                else {
                    renderNextQuestion(assessmentObject);
                }

            }, errorCallback);
        }, errorCallback);
    }
    else {
        res.send({success: false, content: "Please select at least one answer, And ranks must start from 1 and must be sequential."});
    }
};

// controller to submit assessment
exports.submitAssessmentSetResults = function(req, res){

    var errorCallback = req.errorCallback;
    // fetch user's latest assessment

    assessmentUtils.fetchUserLatestAssessment(req.currentUser,
        function (assessmentObject) {    // If user has some latest assessment
            if (
                assessmentObject
                && assessmentObject.get('lastQuestionAnswered')
                && assessmentObject.get('lastQuestionAnswered').get('questionNumber') == assessmentConstants.MAX_QUESTIONS_IN_ASSESSMENT
            ) {
                // call kahler api
                assessmentUtils.callKahlerAPI(req.currentUser, assessmentObject,
                    function (updatedUser) {
                        // set assessment as complete.
                        var currentDate = new Date();
                        assessmentObject.set('completed', true);
                        assessmentObject.set('completedAt', currentDate);
                        assessmentObject.save(null).then(function () {
                            // gets the data to make pardot call
                            assessmentUtils.getDataForAssessmentCompletePardotCall(req.currentUser.get('email'), function(pardotData){
                                // render assessment complete page
                                var data = {
                                    'success': true,
                                    'assessmentCompleteUrl': req.app.namedRoutes.build('assessment.complete'),
                                    'pardotCallUrl': req.app.namedRoutes.build('user.makePardotCall')    // url to make pardot call
                                };
                                _.extend(data, pardotData);
                                res.send(data);
                                assessmentUtils.sendPdfReportMail(updatedUser, function() {
                                    return {success: true};
                                });
                            });
                        }, errorCallback);
                    },
                    errorCallback);
            }
            else {
                res.send({success: false});
            }
        },
        errorCallback);
};


exports.assessmentQuestionPrevious = function(req, res) {

    // function to render next question of the last attempted question
    // if last attempted question pointer is undefined or invalid then it'll render question number 1
    function renderNextQuestion(assessmentObject){
        var questionToRender = 1;
        if(assessmentObject && assessmentObject.get("lastQuestionAnswered") && typeof assessmentObject.get("lastQuestionAnswered").get("questionNumber") === "number"){
            questionToRender = assessmentObject.get("lastQuestionAnswered").get("questionNumber") + 1 || 1;
            if(questionToRender > assessmentConstants.MAX_QUESTIONS_IN_ASSESSMENT){
                questionToRender = 1;
            }
        }
        assessmentUtils.fetchAssessmentQuestions(currentUser, [questionToRender], function(questions){
            if(questions){
                context.question = questions[questionToRender];
                context.presentQuestionNumber = questions[questionToRender].get('questionNumber');
                var data = {};
                res.render('assessment/_next_question', context, function (error, html) {
                    data['html'] = html;
                    res.send({success: true, content: data});
                });
            }
            else{
                errorCallback();
            }
        }, errorCallback);
    }

    var currentUser = Parse.User.current(),
        questionNumber = parseInt(req.query.presentQuestionNumber),
        ranksDict = req.query.options,
        errorCallback = req.errorCallback,
        context = {
            answerCount: assessmentConstants.MAX_ANSWER_IN_ASSESSMENT, // max options
            rankCount: assessmentConstants.MAX_RANK, // max rank
            maxQuestionsCount: assessmentConstants.MAX_QUESTIONS_IN_ASSESSMENT,
            layout: 'layout_partial'
        };

    // fetch user's latest assessment
    if(!isNaN(questionNumber) && questionNumber && questionNumber >= 2 && questionNumber <= assessmentConstants.MAX_QUESTIONS_IN_ASSESSMENT) {
        assessmentUtils.fetchUserLatestAssessment(currentUser,
            function (assessmentObject) {    // If user has some latest assessment
                if (questionNumber <= assessmentObject.get('lastQuestionAnswered').get("questionNumber") + 1) {
                    if (ranksDict) {// If something checked out
                        if (assessmentUtils.ranksValidationsCheck(ranksDict, questionNumber)) {
                            // get present question
                            assessmentUtils.fetchAssessmentQuestions(currentUser, [questionNumber, questionNumber - 1], function (questions) {
                                questions = Object.keys(questions).map(function(value, index){ return questions[value] });
                                assessmentUtils.fetchAssessmentQuestionResponses(currentUser, assessmentObject, questions, function () {
                                    assessmentUtils.fetchAssessmentQuestions(currentUser, [questionNumber],
                                        function (questions) {    // success callback
                                            var question = questions[questionNumber];
                                            // Querying if present question already attempted
                                            assessmentUtils.fetchAssessmentQuestionResponses(currentUser, assessmentObject, [question],
                                                function (answers) { // success callback
                                                    var answer = answers[question.get("questionNumber")];
                                                    if (answer) { // if present question was already attempted earlier
                                                        assessmentUtils.saveNewResponsesAndFetchPrevQuestion(currentUser, assessmentObject, questionNumber, answer, ranksDict,
                                                            function (addedContext, data) {  // success callback
                                                                var newContext = {};
                                                                _.extend(newContext, context, addedContext);
                                                                res.render('assessment/_next_question', newContext, function (error, html) {
                                                                    data['html'] = html;
                                                                    res.send({success: true, content: data});
                                                                });
                                                            }, errorCallback
                                                        );
                                                    }
                                                    else if (assessmentObject.get("lastQuestionAnswered").get("questionNumber") === (questionNumber - 1)) {  // If present question was not attempted earlier
                                                        assessmentUtils.saveResponsesAndFetchPrevQuestion(currentUser, assessmentObject, questionNumber, question, ranksDict,
                                                            function (addedContext, data) {   // success callback
                                                                var newContext = {};
                                                                _.extend(newContext, context, addedContext);
                                                                res.render('assessment/_next_question', newContext, function (error, html) {
                                                                    data['html'] = html;
                                                                    res.send({success: true, content: data});
                                                                });
                                                            }, errorCallback
                                                        );
                                                    }
                                                }, errorCallback
                                            );
                                        }, errorCallback
                                    );
                                }, errorCallback);
                            }, errorCallback);

                        }
                        else {
                            res.send({
                                success: false,
                                content: "Please select at least one answer, And ranks must start from 1 and must be sequential."
                            });
                        }

                    }
                    else if (assessmentObject.get("lastQuestionAnswered").get("questionNumber") == questionNumber - 1) {  // If nothing checked and the question is next to the last attempted question only(question is not attempted yet)

                        var prevAnswers = {},
                            data = {};
                        // get previous question and its already saved answers
                        assessmentUtils.fetchPrevQuestionAndPrevAnswers(currentUser, assessmentObject, questionNumber,
                            function (addedContext, data) {
                                var newContext = {};
                                _.extend(newContext, context, addedContext);
                                res.render('assessment/_next_question', newContext, function (error, html) {
                                    data['html'] = html;
                                    res.send({success: true, content: data});
                                });

                            }, errorCallback
                        );
                    }
                    else { // if nothing is checked but this question is attempted alread
                        res.send({
                            success: false,
                            content: "Please select at least one answer, And ranks must start from 1 and must be sequential."
                        });
                    }
                }
                else {
                    renderNextQuestion(assessmentObject);
                }
            }, errorCallback
        );
    }
    else{
        assessmentUtils.fetchUserLatestAssessment(currentUser, function(assessmentObject){
            renderNextQuestion(assessmentObject);
        }, errorCallback);
    }
};

exports.assessmentCompleteController = function(req, res) {
    var currentUser = Parse.User.current(),
        errorCallback = req.errorCallback,
        assessmentCompleteContext = {
            'extra_class': 'transparent',
            'nav_items': false,
            'user': currentUser
        },
        primaryPersonality = currentUser.get('primary_personality');
    primaryPersonality.fetch().then(function(primaryPersonalityObject){
        assessmentCompleteContext['primaryPersonality'] = primaryPersonality; // primary personality of logged in user
        assessmentCompleteContext['superPowerTagLineMap'] = userConstants.SUPERPOWER_TAGLINE_MAP; // map for super power tag line image
        assessmentCompleteContext['headerWrapperClass'] = userConstants.PERSONALITY_CLASS_MAP[  // controls header background and color
                primaryPersonalityObject.get('name').toLowerCase()] || 'doer-wrap';
        res.render('assessment/pre_baseline', assessmentCompleteContext);
    }, errorCallback);
};
