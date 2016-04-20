var userUtils = require('../user/utils'),
    quizUtils = require('./utils'),
    quizConstants = require('./constants'),
    appSettings = require('../../app_settings.js'),
    userConstants = require('../user/constants'),
    secret = require('../../secret.js'),
    commonUtils = require('../common/utils');

// All controllers for quiz app

// Function that returns next question for the quiz.
exports.questionNextController = function (req, res) {
    var currentUser = req.currentUser,
        errorCallback = req.errorCallback;

    quizUtils.fetchNextQuizQuestion(currentUser, false,
        function (selectedQuestion, presentQuesNumber) { // fetch next question and question index
            var OptionModel = Parse.Object.extend('Option'),
                optionQuery = new Parse.Query(OptionModel);
            optionQuery.equalTo('question', selectedQuestion);
            optionQuery.ascending('order');
            optionQuery.find({  // fetch options related to question question according to is order
                success: function (options) {   // success callback
                    var skillName = selectedQuestion.get('skill').get('name'),
                        context = {
                            selectedQuestion: selectedQuestion,
                            options: options,
                            maxQuizQuestion: quizConstants.MAX_QUESTION_IN_QUIZ,
                            questionIndex: presentQuesNumber + 1,
                            skillName: skillName,
                            skillWrapperClass: quizConstants.questionWrapperClassMap[skillName.toLowerCase()],
                            skillIconClass: quizConstants.skillIconClassMap[skillName.toLowerCase()],
                            layout: 'layout_partial' // override default layout
                        },
                        questionType = selectedQuestion.get('question_type');
                    switch (questionType){
                        case "video_question":
                            res.render('quiz/_video_based_quiz_question', context);
                            break;
                        case "audio_question":
                            res.render('quiz/_audio_based_quiz_question', context);
                            break;
                        case "image_options_1x4":
                            res.render('quiz/_1x4_image_based_quiz_question', context);
                            break;
                        case "image_options_2x2":
                            res.render('quiz/_2x2_image_based_quiz_question', context);
                            break;
                        default :
                            res.render('quiz/_next_question', context);
                            break;

                    }
                },
                error: errorCallback
            });
        },
        errorCallback
    );
};

// starting question page which load first question of quiz of last of page of abandoned quiz
exports.questionStartController = function (req, res) {
    var currentUser = req.currentUser,
        currentQuiz = req.session.currentQuiz,
        newQuiz = false,
        errorCallback = req.errorCallback;
    function successCallback(selectedQuestion, questionIndex) { // success callback when question is selected
        var OptionModel = Parse.Object.extend('Option'),
            optionQuery = new Parse.Query(OptionModel);
        optionQuery.equalTo('question', selectedQuestion);
        optionQuery.ascending('order');
        optionQuery.find({  // find all options related to given question in ascending order for values given in 'order' column
            success: function (options) {
                req.session.currentQuiz = true;
                var skillName = selectedQuestion.get('skill').get('name'),
                    context = {
                        quest_quiz: true, // makes Quest & Quiz active in menu
                        extra_class: 'transparent', // makes the header transparent
                        skill_type_class: 'skill-connect', // sets quiz style
                        selectedQuestion: selectedQuestion, // selected question for given quiz
                        options: options, // all options related to question
                        maxQuizQuestion: quizConstants.MAX_QUESTION_IN_QUIZ, // max question possible in quiz
                        questionIndex: questionIndex + 1, // question index for question that is to be displayed
                        skillWrapperClass: quizConstants.questionWrapperClassMap[skillName.toLowerCase()], // wrapper class for styling according to question skill
                        skillIconClass: quizConstants.skillIconClassMap[skillName.toLowerCase()],
                        skillName: skillName, // skill name
                        loadQuizFromSession: currentQuiz && !newQuiz, // show restoring from session message if true
                        fromQuizStartController: true
                    };
                res.render('quiz/question', context);
            },
            error: errorCallback
        });
    }

    var quizNumber = currentUser.get('quiz_number'),
        selectedQuizQuestions = currentUser.get('selected_quiz_questions');
    if (currentQuiz && quizNumber && Array.isArray(selectedQuizQuestions) && selectedQuizQuestions.length === quizConstants.MAX_QUESTION_IN_QUIZ) { // check if to restore session
        var questionResponded = currentUser.get('question_responded'),
            questionIndex = selectedQuizQuestions.indexOf(currentUser.get('current_question'));
        if(questionIndex < (quizConstants.MAX_QUESTION_IN_QUIZ - 1) || (questionIndex == (quizConstants.MAX_QUESTION_IN_QUIZ - 1) && !questionResponded)) {
            if(!questionResponded) {  // check last question in quiz was responded
                var QuestionModel = Parse.User.extend('Question'),
                    questionQuery = new Parse.Query(QuestionModel);
                questionQuery.include('skill', 'category_type');
                questionQuery.get(selectedQuizQuestions[questionIndex], { // fetch last question in quiz which is not responded by user
                    success: function (lastAnsweredQuestion) {
                        successCallback(lastAnsweredQuestion, questionIndex, quizNumber);
                    },
                    error: errorCallback
                });
            }
            else { // fetch next question if last question is already responded by user
                quizUtils.fetchNextQuizQuestion(currentUser, false, successCallback, errorCallback); // fetch first question to display
            }
        }
        else { // fetch next quiz question if all question quiz are responded by user
            newQuiz = true;
            quizUtils.fetchNextQuizQuestion(currentUser, true, successCallback, errorCallback); // fetch first question to display
        }
    }
    else if(!currentQuiz) {
        // fetch new question if user has fresh session or no question in quiz_questions
        quizUtils.fetchMaxQuizNumber(currentUser, function (quizNumber) {
            currentUser.set('quiz_number', quizNumber);
            newQuiz = true;
            quizUtils.fetchNextQuizQuestion(currentUser, true, successCallback, errorCallback); // fetch first question to display
        });
    }
    else {
        newQuiz = true;
        quizUtils.fetchNextQuizQuestion(currentUser, true, successCallback, errorCallback); // fetch first question to display
    }
};

// renders answer validation page
exports.answerValidationController = function (req, res) {

    function notAllowedCallback(error) { // error callback
        res.status(404).end();
    }

    var user = req.currentUser;
    if(!user.get('question_responded')) { // verify if user has responded to question asked
        var optionId = req.query.optionId, // id of option selected by user
            OptionModel = Parse.Object.extend('Option'), // option table model
            optionQuery = new Parse.Query(OptionModel),
            changedScoreData = {}, hash,
            questionSkillId, questionPersonalityId,
            errorCallback = req.errorCallback;
        changedScoreData.userScoreIncrement = 0;    // increase if question is answered correct
        changedScoreData.totalScoreIncrement = 0;    // increases if the same question was attempted incorrect in last try
        optionQuery.include('question', 'question.difficulty', 'question.skill', 'question.personality'); // to display points and skill on question page

        optionQuery.get(optionId, { // get object for selected option
            success: function (optionObject) { // option is successfully fetch for given id
                var UserResponseModel = Parse.Object.extend('User_Response'), // user response model
                    userResponseQuery = new Parse.Query(UserResponseModel), // query on user response model
                    question = optionObject.get('question'), // question related to option selected by user
                    quizQuestions = user.get('selected_quiz_questions'),
                    questionScore = question.get('difficulty').get('score');
                questionSkillId = question.get('skill').id;
                questionPersonalityId = question.get('personality').id;
                // if selected option's question is last one in quiz question for user
                if(user.get('current_question') == question.id) {
                    userResponseQuery.descending('createdAt'); // order by creation of response
                    userResponseQuery.equalTo('user', user);
                    userResponseQuery.equalTo('question', question); // filter response for given question
                    userResponseQuery.limit(2); // fetch only two last response for given question which may be updated
                    userResponseQuery.find().then(
                        function (userResponses) {
                            var userLatestResponse = userResponses[0], // latest response of user for given question
                                userPreviousResponse = userResponses[1]; // previous response of user for given question
                            userLatestResponse.set('is_correct', optionObject.get('is_correct'));
                            userLatestResponse.set('answer', optionObject);

                            // update attempted questions data
                            var questionsAttemptedData = (user.get('questions_attempted') || {});
                            questionsAttemptedData[question.id] = questionsAttemptedData[question.id] || {};
                            questionsAttemptedData[question.id].type = question.get('category_type').id;
                            questionsAttemptedData[question.id].correctlyAttemptedCount = (questionsAttemptedData[question.id].correctlyAttemptedCount || 0) + (
                                    (optionObject.get('is_correct'))? 1 : 0);
                            user.set('questions_attempted', questionsAttemptedData);

                            var objectsToSave = [userLatestResponse];     // array to bulk save data
                            if(optionObject.get('is_correct')){
                                changedScoreData.userScoreIncrement = questionScore;
                            }
                            // make previous response to not applicable if new response to same question is correct and previous response was incorrect
                            if (userPreviousResponse && !userPreviousResponse.get('is_correct')) {
                                userPreviousResponse.set('is_applicable', false); // set previous wrong response to correct
                                objectsToSave.push(userPreviousResponse); // add updated user previous response to list of objects to be saved
                                changedScoreData.totalScoreIncrement = 0;
                            }
                            else{
                                changedScoreData.totalScoreIncrement = questionScore;
                            }

                            user.set('question_responded', true);
                            objectsToSave.push(user); // add user to list of object need to be saved
                            Parse.Object.saveAll(objectsToSave, { // bulk save response and user
                                success: function () {
                                    changedScoreData.hashTimeStamp = (new Date()).getTime();    // time stamp for security so data can't be tempered
                                    hash = require('cloud/packages/md5.js').hex_md5(secret.securityKey1 + changedScoreData.totalScoreIncrement + changedScoreData.userScoreIncrement + questionSkillId + questionPersonalityId + changedScoreData.hashTimeStamp + secret.securityKey2);
                                    var context = {
                                        question: question,
                                        option: optionObject,
                                        layout: 'layout_partial'
                                    };
                                    if (Array.isArray(quizQuestions) && quizQuestions.indexOf(user.get('current_question')) === (quizConstants.MAX_QUESTION_IN_QUIZ - 1)) { // check
                                        req.session.currentQuiz = null; // delete current Quiz data for last response
                                    }
                                    res.render('quiz/_answer_validation', context, function(error, validationHtml){
                                        res.send({
                                            questionSkillId: questionSkillId,
                                            questionPersonalityId: questionPersonalityId,
                                            validationHtml: validationHtml,
                                            changedScoreData: changedScoreData,
                                            hash: hash
                                        });
                                    });
                                },
                                error: errorCallback
                            });
                        },
                        errorCallback
                    );
                }
                else {
                    notAllowedCallback();
                }
            },
            error: notAllowedCallback
        });
    }
    else{
        notAllowedCallback();
    }
};

// controller to calculate user's skill and personality score for his last attempted question
exports.recalculateScoreController = function (req, res) {

    // validate received score change
    function validateReceivedData(changedScoreData, hash){
        var reGeneratedHash = require('cloud/packages/md5.js').hex_md5(secret.securityKey1 + changedScoreData.totalScoreIncrement + changedScoreData.userScoreIncrement + questionSkillId + questionPersonalityId + changedScoreData.hashTimeStamp + secret.securityKey2);
        return (hash == reGeneratedHash);
    }

    // callback if no cache table record found or invalid record found
    function noCacheTableRecordFound(){
        context.success = false;    // flag to make cache table recalculation request
        var userResponseQuery = new Parse.Query('User_Response');
        userResponseQuery.equalTo('user', currentUser);
        userResponseQuery.equalTo('is_applicable', true);
        userResponseQuery.count().then(function(responseCount){
            // batch count indicates how many calls required to get all the user responses(1000 user responses in one batch)
            context.batchCount = Math.floor(responseCount / userConstants.USER_RESPONSE_QUERY_BATCH_SIZE);
            if(responseCount > context.batchCount * userConstants.USER_RESPONSE_QUERY_BATCH_SIZE) {
                context.batchCount++;
            }
            context.hashTimeStamp = changedScoreData.hashTimeStamp;    // time stamp is used in hash for security
            context.batchCountHash = require('cloud/packages/md5.js').hex_md5(secret.securityKey1 + context.batchCount + context.hashTimeStamp + secret.securityKey2);
            context.getUserResponsesUrl = (req.app.namedRoutes.build('user.getUserResponses'));
            context.recalculateCacheTableUrl = (req.app.namedRoutes.build('user.recalculateCacheTable'));
            res.send(context);
        }, errorCallback);
    }



    var currentUser = req.currentUser,
        context = {},
        errorCallback = req.errorCallback,
        changedScoreData = req.body.changedScoreData,
        questionPersonalityId = req.body.questionPersonalityId,
        questionSkillId = req.body.questionSkillId;
    if(validateReceivedData(req.body.changedScoreData, req.body.hash)) {    // if received data is valid
        userUtils.getPQScoreSettings(currentUser, function(settingsDict){
            quizUtils.recalculatePersonalityScoreAfterQuizResponse(currentUser, questionPersonalityId, changedScoreData, settingsDict, function(){
                quizUtils.recalculateSkillScoreAfterQuizResponse(currentUser, questionSkillId, changedScoreData, settingsDict, function(){
                    if(currentUser.get('pq_score')) {
                        currentUser.set('pq_score', currentUser.get('pq_score') + changedScoreData.userScoreIncrement);
                        currentUser.set('last_7_day_pq_gain', currentUser.get('last_7_day_pq_gain') + changedScoreData.userScoreIncrement);
                        currentUser.save().then(function(){
                            res.send({success: true});
                        }, errorCallback)
                    }
                    else{
                        noCacheTableRecordFound();
                    }
                }, noCacheTableRecordFound, errorCallback)
            }, noCacheTableRecordFound, errorCallback);
        }, errorCallback);
    }
    else{
        res.status(404).send({message: "Unauthorized Access Denied"});
    }

};


// renders Quiz start page
exports.quizStartController = function (req, res) {


    var currentUser = req.currentUser,
        errorCallback = req.errorCallback;
    quizUtils.fetchMaxQuizNumber(currentUser, function (quizCount) {
            if (quizCount < 1) {    // if user's first quiz
                res.render('quiz/first_time_quiz.ejs', {
                    quest_quiz: true,
                    extra_class: 'transparent',
                    skillWrapperClass: 'skill-connect' // sets quiz style
                });
            }
            else {
                res.render('quiz/quiz_start', {
                    quest_quiz: true, // make Quest & Quiz active in menu
                    extra_class: 'transparent', // make the header transparent
                    skillWrapperClass: 'skill-connect' // sets quiz style
                });
            }
        }, errorCallback
    );
};

// Function that renders quiz's result/recap page
exports.quizResultController = function (req, res) {
    var currentUser = Parse.User.current(),
        newLevels = {},
        prevLevels = {},
        skillLevelsDict = {},
        primaryPersonalityPointer = currentUser.get('primary_personality');


    var context = {
            quest_quiz: true, // make Quest & Quiz active in menu
            extra_class: 'transparent' // make the header transparent
        },
        errorCallback = req.errorCallback;
    quizUtils.lastQuizResult(currentUser, function (data) {     // success Callback
            newLevels = data.newLevels;
            prevLevels = data.prevLevels;
            skillLevelsDict = data['skillLevelsDict'];
            var skillName = '';

            var skillCount = 0;
            if (newLevels['Connect'] > prevLevels['Connect']) {
                context['ConnectLevel'] = skillLevelsDict[String(newLevels['Connect'])]['name'];
                skillName = skillName + 'skill-connect ';
                skillCount++;
            }
            if (newLevels['Understand'] > prevLevels['Understand']) {
                context['UnderstandLevel'] = skillLevelsDict[String(newLevels['Understand'])]['name'];
                skillName = skillName + 'skill-understand ';
                skillCount++;
            }

            if (newLevels['Identify'] > prevLevels['Identify']) {
                context['IdentifyLevel'] = skillLevelsDict[String(newLevels['Identify'])]['name'];
                skillName = skillName + 'skill-identify ';
                skillCount++;
            }

            context['userQuizScore'] = data['userQuizScore'];
            context['quizMaxScore'] = data['quizMaxScore'];
            if (skillCount >= 1) {
                context['skillWrapperClass'] = skillName;
            }
            else {
                context['skillWrapperClass'] = 'skill-connect';
            }
            context['user'] = currentUser;
            context['skillCount'] = skillCount;
            context['homePageUrl'] = appSettings.PROTOCOL_FOR_WORK_STYLE + appSettings.DOMAIN_FOR_WORK_STYLE;    // workstyle home page url
            context['publicProfileURL'] = commonUtils.getAbsoluteUrlForWorkstyle(req.app.namedRoutes.build('user.myPQPublic', {id: currentUser.id}));    // user public profile url
            context['thumbnailPath'] = commonUtils.getAbsoluteUrlForWorkstyle('/assets/images/link-img.png');    // thumbnail url
            context['badgeWithoutPQUrl'] = commonUtils.getAbsoluteUrlForWorkstyle(req.app.namedRoutes.build('user.badgeWithoutPQ', {id: currentUser.id}));    // url for badge without pq
            context['badgeGifUrl'] = commonUtils.getAbsoluteUrlForWorkstyle(req.app.namedRoutes.build('user.badgeGif', {id: currentUser.id}));    // url for badge gif

        var userQuizNumber = currentUser.get('quiz_number');
        if (userQuizNumber == 1 && Array.isArray(currentUser.get('selected_quiz_questions')) &&
            currentUser.get('selected_quiz_questions').indexOf(currentUser.get('current_question')) === (quizConstants.MAX_QUESTION_IN_QUIZ - 1) && currentUser.get('question_responded')) {    // if it was the user's first quiz
            context['isFirstQuiz'] = true;    // sets the user's first quiz flag
            res.render('quiz/result', context);
        }
        else {
            context['isFirstQuiz'] = false;
            res.render('quiz/result', context);
        }
    }, errorCallback);
};
