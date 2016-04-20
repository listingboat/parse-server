var constants = require('./constants'),
    userUtils = require('../user/utils.js'),
    companyConstants = require('../company/constants.js')
    _ = require('underscore');

// Function that returns User's personality Score object for the personality.
exports.getUserPersonalityScore = function(user, personality, successCallback, errorCallback){
    var UserPersonalityScore = Parse.Object.extend('User_Personality_Score'),
        userPersonalityScoreQuery = new Parse.Query(UserPersonalityScore);
    userPersonalityScoreQuery.equalTo('user', user);
    userPersonalityScoreQuery.equalTo('personality', personality);
    userPersonalityScoreQuery.find({
        success: function(personalityScores){
            if (personalityScores.length > 0){
                successCallback(personalityScores[0]);
            }
            else {
                successCallback();
            }
        },
        error: function(error){
            errorCallback(error);
        }
    });
};

// function to calculate personality response after response
exports.recalculatePersonalityScoreAfterQuizResponse = function(user, questionPersonalityId, scoreChange, settings ,successCallback, invalidDataCallback, errorCallback){
    var personalityScoreQuery = new Parse.Query("User_Personality_Score"),
        personalityModel = Parse.Object.extend("Personality"),
        personalityObject = new personalityModel();
    personalityObject.id = questionPersonalityId;
    personalityScoreQuery.equalTo('user', user);
    personalityScoreQuery.equalTo('personality', personalityObject);
    personalityScoreQuery.descending('createdAt');
    personalityScoreQuery.first().then(function(personalityScoreObject){
        if(personalityScoreObject && typeof personalityScoreObject.get('actual_max_score') !== 'undefined'){
            var lastUpdate = personalityScoreObject.get('last_update_time_stamp'),
                score = personalityScoreObject.get('score'),
                maxScore = personalityScoreObject.get('actual_max_score'),
                innerCircle = personalityScoreObject.get('inner_circle'),
                outerCircle, personalityScoreDenominator;
            if(!lastUpdate || lastUpdate < scoreChange.hashTimeStamp ) {
                score += scoreChange.userScoreIncrement;
                maxScore += scoreChange.totalScoreIncrement;
                personalityScoreDenominator = (settings.personality_score_denominator > maxScore) ? settings.personality_score_denominator : maxScore;
                outerCircle = Math.round(innerCircle + ((settings.max_circle - innerCircle) * (score / personalityScoreDenominator)));
                personalityScoreObject.set('score', score);
                personalityScoreObject.set('actual_max_score', maxScore);
                personalityScoreObject.set('outer_circle', outerCircle);
                personalityScoreObject.set('last_update_time_stamp', scoreChange.hashTimeStamp);
                personalityScoreObject.save().then(successCallback, errorCallback);
            }
            else{
                errorCallback({message: "'Invalid score update request"});
            }
        }
        else{
            invalidDataCallback();
        }
    }, errorCallback);
};

// function to calculate skill response after response
exports.recalculateSkillScoreAfterQuizResponse = function(user, questionSkillId, scoreChange, settings ,successCallback, invalidDataCallback, errorCallback){
    var skillScoreQuery = new Parse.Query("User_Skill_Score"),
        skillModel = Parse.Object.extend("Skill"),
        skillObject = new skillModel();
    skillObject.id = questionSkillId;
    skillScoreQuery.equalTo('user', user);
    skillScoreQuery.equalTo('skill', skillObject);
    skillScoreQuery.descending('createdAt');
    skillScoreQuery.first().then(function(skillScoreObject){
        if(skillScoreObject && typeof skillScoreObject.get('actual_max_score') !== 'undefined'){
            var lastUpdate = skillScoreObject.get('last_update_time_stamp'),
                score = skillScoreObject.get('score'),
                maxScore = skillScoreObject.get('actual_max_score');
            if(!lastUpdate || lastUpdate < scoreChange.hashTimeStamp ) {
                score += scoreChange.userScoreIncrement;
                maxScore += scoreChange.totalScoreIncrement;
                skillScoreObject.set('score', score);
                skillScoreObject.set('actual_max_score', maxScore);
                skillScoreObject.set('last_update_time_stamp', scoreChange.hashTimeStamp);
                skillScoreObject.save().then(successCallback, errorCallback);
            }
            else{
                errorCallback({message: "'Invalid score update request"});
            }
        }
        else{
            invalidDataCallback();
        }
    }, errorCallback);
};

exports.fetchQuestionsCount = function (successCallback, errorCallback){ // function to find total number of questions
    var QuestionModel = Parse.Object.extend('Question'), // Questions model
        query = new Parse.Query(QuestionModel); // query on questions model
    query.count({
        success: function(count){
            successCallback(count)
        },
        error: function(error){
            errorCallback(error);
        }
    })
};

exports.fetchMaxQuizNumber = function (user, successCallback, errorCallback){ // function to max quiz number
    var UserResponseModel = Parse.Object.extend('User_Response'), // model for user response
        query = new Parse.Query(UserResponseModel); // query on user response model
    query.equalTo('user', user); // response belonging to user
    query.descending('quiz_number'); // to order to find max quiz
    query.select('quiz_number'); // fetch only quiz_number of user response
    query.first({
        success: function(response){ // call successCallback with argument quiz_number when successful
            if(response) {
                successCallback(response.get('quiz_number'));
            }
            else {
                successCallback(0);
            }
        },
        error: errorCallback // call errorCallback with argument error when unsuccessful
    });
};

// functon that checks if user's mypq page unlocked or not
exports.isMyPQUnlocked = function (user, successCallback, errorCallback) {

    function checkFirstQuizIsComplete(){
        if (user.get('quiz_number') > 1 || (user.get('quiz_number') == 1 && Array.isArray(user.get('selected_quiz_questions')) &&
            user.get('selected_quiz_questions').indexOf(user.get('current_question')) === (constants.MAX_QUESTION_IN_QUIZ - 1) && user.get('question_responded'))) {
            successCallback(true);
        }
        else {
            successCallback(false);
        }
    }

    Parse.Cloud.useMasterKey();
    var userQuizNumber = user.get('quiz_number');
    if (typeof userQuizNumber == 'undefined') {    // if user latest quiz number is undefined
        exports.fetchMaxQuizNumber(user, function (quizNumber) {
            user.set('quiz_number', quizNumber);
            user.save().then({
                success: function(){},
                error: errorCallback
            });
            checkFirstQuizIsComplete();
        }, errorCallback)
    }
    else{
        checkFirstQuizIsComplete();
    }
};

// Function that returns user's last quiz's responses
exports.fetchLastQuizQuestions = function (user, successCallback, errorCallback){
    var UserResponseModel = Parse.Object.extend('User_Response'), // user response model
        innerQuery = new Parse.Query(UserResponseModel), // in query on user response model
        query = new Parse.Query(UserResponseModel); // query on user response model

    innerQuery.equalTo('user', user); // responses related to user
    innerQuery.descending('quiz_number'); // order response according to quiz number to find max
    innerQuery.limit(1); // limit response to one
    innerQuery.select('quiz_number'); // fetch only quiz_number attribute of final response
    innerQuery.first({
       success: function(lastQuestionResponse){
           query.equalTo('quiz_number', lastQuestionResponse.get('quiz_number')); // response which have quiz_number returned by inner query
           query.equalTo('user', user); // fetch response only for given user
           query.include('question', 'question.difficulty', 'question.personality', 'question.skill');
           query.find({
               success: function(userResponses){
                   var userResponsesList = [];
                   for (var i=0;i<userResponses.length; i++){
                       userResponsesList.push(userResponses[i].get('question').id);
                   }
                   successCallback(userResponsesList);

               },
               error: function(error){
                   errorCallback(error);
               }
           });
       }
    });
};

exports.setQuestionResponse = function (options) { // function to set initial response of question
    var UserResponseModel = Parse.Object.extend('User_Response'),
        userResponseObject = new UserResponseModel();
    userResponseObject.set('is_correct', options.userResponseDict.isCorrect || false); // set response correctness
    userResponseObject.set('quiz_number', options.userResponseDict.quizNumber || 1); // set quiz number for response
    userResponseObject.set('is_applicable', options.userResponseDict.isApplicable || true); // set applicability
    userResponseObject.set('question', options.userResponseDict.question); // set question of response
    userResponseObject.set('user', options.user); // set question of response
    userResponseObject.save().then(function () {
        options.success(); // callback does not wait for success full or recalculation
    }, options.error); // save response to database
};

// function to fetch new question for same quiz of different quiz
exports.fetchNextQuizQuestion = function (user, isNextQuiz, successCallback, errorCallback) {
    if (isNextQuiz) {
        user.set('selected_quiz_questions', undefined);
        user.increment('quiz_number');
    }
    if (
        Array.isArray(user.get('selected_quiz_questions')) &&
        user.get('selected_quiz_questions').length === constants.MAX_QUESTION_IN_QUIZ &&
        user.get('selected_quiz_questions').indexOf(user.get('current_question')) !== -1 &&
        user.get('selected_quiz_questions').indexOf(user.get('current_question')) !== (constants.MAX_QUESTION_IN_QUIZ - 1)
    ) {
        var questionQuery = new Parse.Query('Question'),
            questionIndex = user.get('selected_quiz_questions').indexOf(user.get('current_question')) + 1,
            questionId = user.get('selected_quiz_questions')[questionIndex];
        questionQuery.include('skill', 'category_type');
        questionQuery.get(questionId, {
            success: function (selectedQuestion) {
                setResponseAndUpdateUser(user, selectedQuestion, questionIndex, successCallback, errorCallback);
            },
            error: errorCallback
        });
    }
    else {
        selectQuizQuestions(user, function (selectedQuestion, questionIndex) {
            setResponseAndUpdateUser(user, selectedQuestion, questionIndex, successCallback, errorCallback);
        }, errorCallback);
    }
};

function setResponseAndUpdateUser(user, selectedQuestion, questionIndex, successCallback, errorCallback) {
    user.set('current_question', selectedQuestion.id);
    user.set('question_responded', false);

    // TODO: fix case where recalculation is not called with when question is first shown and
    // when user moves to new quiz that score is not taken in to account
    exports.setQuestionResponse({ // set first response before question is rendered
        user: user,
        userResponseDict: {
            question: selectedQuestion,
            quizNumber: user.get('quiz_number') // sets quiz index as 1 by default
        },
        success: function () {
            successCallback(selectedQuestion, questionIndex);
        }, // return callback
        error: errorCallback // errorCallback is called with error in case of error
    });
}

function getQuestionCorrectlyAttempted(user, questionTypes){
    var questionTypeMap = {};
    for (var index in questionTypes){
        questionTypeMap[questionTypes[index].id] = true;
    }
    var questionsAttempted = user.get('questions_attempted') || {},
        questionsCorrectlyAttempted = [];
    for (var questionId in questionsAttempted) {
        var questionData = questionsAttempted[questionId];
        if (questionData && questionData.correctlyAttemptedCount && questionData.type && questionTypeMap[questionData.type]) {
            questionsCorrectlyAttempted.push(questionId);
        }
    }
    return questionsAttempted;
}

function selectQuizQuestions(user, successCallback, errorCallback) {
    fetchQuestionFiltersAndCount(user,
        function (questionCount, questionTypes) {
            var questionsCorrectlyAttempted = getQuestionCorrectlyAttempted(user, questionTypes),
                quizQuestionQueries = [], questionPoolCount, randomQuestionIndexes, questionsToExclude;
            if ((questionCount - questionsCorrectlyAttempted.length) > constants.MAX_QUESTION_IN_QUIZ) {
                questionPoolCount = questionCount - questionsCorrectlyAttempted.length;
                randomQuestionIndexes = selectUniqueRandomNumbers(0, questionPoolCount, constants.MAX_QUESTION_IN_QUIZ);
                questionsToExclude = questionsCorrectlyAttempted;
            }
            else {
                questionPoolCount = questionCount;
                randomQuestionIndexes = selectUniqueRandomNumbers(0, questionPoolCount, constants.MAX_QUESTION_IN_QUIZ);
                questionsToExclude = undefined;
            }
            if (!Array.isArray(randomQuestionIndexes) || randomQuestionIndexes.length !== constants.MAX_QUESTION_IN_QUIZ) {
                errorCallback("Random Question Indexes Undefined");
                return;
            }
            // Reference https://parse.com/questions/is-it-possible-to-query-for-a-random-object
            for (var questionIndex = 0; questionIndex < constants.MAX_QUESTION_IN_QUIZ; questionIndex++) {
                var quizSelectedQuestionQuery = new Parse.Query('Question'),
                    quizSelectedQuestionQuery2 = new Parse.Query('Question'),
                    selectedQuestionIndex = randomQuestionIndexes[questionIndex];
                quizSelectedQuestionQuery.skip(selectedQuestionIndex);

                if (Array.isArray(questionsToExclude) && questionsToExclude.length !== 0)
                    quizSelectedQuestionQuery.notContainedIn('id', questionsToExclude);

                quizSelectedQuestionQuery.containedIn('category_type', questionTypes);
                quizSelectedQuestionQuery.limit(1);
                quizSelectedQuestionQuery2.matchesKeyInQuery("objectId", "objectId", quizSelectedQuestionQuery);
                quizQuestionQueries.push(quizSelectedQuestionQuery2);
            }
            var fetchQuizQuestionsQuery = Parse.Query.or.apply(Parse.Query, quizQuestionQueries);
            fetchQuizQuestionsQuery.include('skill', 'category_type');

            fetchQuizQuestionsQuery.find({
                success: function (quizQuestions) {
                    user.set('selected_quiz_questions', quizQuestions.map(function (questionObj) {
                        return questionObj.id;
                    }));
                    successCallback(quizQuestions[0], 0);
                },
                error: errorCallback
            });
        },
        errorCallback
    );
}

function fetchQuestionFiltersAndCount(user, successCallback, errorCallback){
    function findBasicQuestionTypeFallback(){
        var questionTypeQuery = new Parse.Query('Quiz_Question_Type');
        questionTypeQuery.equalTo("name_lower_case", companyConstants.DEFAULT_QUESTION_TYPE_NAME.toLowerCase());
        questionTypeQuery.find({
            success: function (questionTypes){
                if(Array.isArray(questionTypes) && questionTypes.length !== 0 && questionTypes[0].get('question_count')){
                    var questionCount = questionTypes[0].get('question_count');
                    successCallback(questionCount, questionTypes);
                }
                else{
                    errorCallback("There is no basic question type or question_count is undefined or zero");
                }
            },
            error: errorCallback
        })
    }
    if(user.get('company') && user.get('department')) {
        var departmentQuizQuestionTypeQuery = new Parse.Query('Department_Question_Type_Relation');
        departmentQuizQuestionTypeQuery.equalTo('department', user.get('department'));
        departmentQuizQuestionTypeQuery.include('question_type');
        departmentQuizQuestionTypeQuery.find({
            success: function(departmentQuizQuestionTypeObjects){
                if(Array.isArray(departmentQuizQuestionTypeObjects) && departmentQuizQuestionTypeObjects.length !== 0){
                    var questionTypes = departmentQuizQuestionTypeObjects.filter(function (obj) {
                            return (obj && obj.get('question_type') && obj.get('question_type').get('question_count'));
                        }).map(function (obj) {
                            return obj.get('question_type')
                        }),
                        questionsCount = questionTypes.reduce(function (sum, obj) {
                            return sum + obj.get('question_count');
                        }, 0);
                    successCallback(questionsCount, questionTypes);
                }
                else{
                    findBasicQuestionTypeFallback();
                }
            },
            error: errorCallback
        })

    }
    else {
        findBasicQuestionTypeFallback();
    }
}

function selectUniqueRandomNumbers(rangeMin, rangeMax, numberCount){
    var numbersDict = {}, selectedNumbers = [], maxTries = 100, tries = 0;
    if(rangeMax - rangeMin > numberCount) {
        while (selectedNumbers.length !== numberCount && tries < maxTries) {
            var randomNumber = rangeMin + Math.floor(Math.random() * (rangeMax - rangeMin));
            if (numbersDict[randomNumber] === true) {
                tries++;
            }
            else {
                numbersDict[randomNumber] = true;
                selectedNumbers.push(randomNumber);
            }
        }
        return selectedNumbers;
    }
    else {
        return undefined;
    }
}

// Function that returns
exports.lastQuizResult = function(currentUser, successcallback, errorCallback){
    exports.fetchMaxQuizNumber(currentUser,   // Fetch latest quiz number for this user
        function(quizNumber) {
            var quizMaxScore = 0,
                userQuizScore = 0,
                SkillScoresDict = {
                    'Understand': 0,
                    'Identify': 0,
                    'Connect': 0
                },
                questionScore = 0,
                UserResponseModel = Parse.Object.extend('User_Response'),
                userResponseQuery = new Parse.Query(UserResponseModel);

            userResponseQuery.equalTo('user', currentUser);
            userResponseQuery.equalTo('quiz_number', quizNumber);
            userResponseQuery.equalTo('is_applicable', true);
            userResponseQuery.include('question', 'question.skill', 'question.difficulty');
            userResponseQuery.find({        // Calculate User's total score in this quiz, score he/she could have earned if answered all questions correct.
                success: function(quizResponses){   // success callback
                    var skillName;
                    for(var i=0; i<quizResponses.length; i++){
                        questionScore = quizResponses[i].get('question').get('difficulty').get('score');
                        quizMaxScore += questionScore;

                        if(quizResponses[i].get('is_correct') == true){
                            userQuizScore += questionScore;
                            skillName = quizResponses[i].get('question').get('skill').get('name');
                            if(!(skillName in SkillScoresDict)){
                                SkillScoresDict[skillName] = 0;
                            }
                            SkillScoresDict[skillName] += questionScore;
                        }
                    }

                    var newScoresDict = {},
                        oldScoresDict = {},
                        skillScoreDenominator,
                        UserSkillScore = Parse.Object.extend('User_Skill_Score'),
                        userSkillQuery = new Parse.Query(UserSkillScore);

                    userSkillQuery.equalTo('user', currentUser);
                    userSkillQuery.include('skill');
                    userSkillQuery.find({       // For each skill, calculate user's previous score and new score.
                        success: function (skillScores) {     // success callback
                            for (var i = 0; i < skillScores.length; i++) {

                                newScoresDict[skillScores[i].get('skill').get('name')] = {
                                    'score': skillScores[i].get('score'),
                                    'max_score': skillScores[i].get('max_score')
                                };

                                oldScoresDict[skillScores[i].get('skill').get('name')] = {
                                    'score': skillScores[i].get('score') - SkillScoresDict[skillScores[i].get('skill').get('name')],
                                    'max_score': skillScores[i].get('max_score')
                                };
                            }

                            // Calculate levels for new scores(after taking the quiz)
                            userUtils.getPQScoreSettings(currentUser,
                                function (settingsDict) {     // success callback
                                    skillScoreDenominator = settingsDict['skill_score_denominator'];

                                    exports.getSkillsLevel(
                                        function (skillLevelsDict) {

                                            // Calculate levels for new scores (after taking the quiz)
                                            exports.calculateSkillLevel(skillScoreDenominator, newScoresDict, skillLevelsDict,
                                                function (newLevelsDict, skillLevelsDict) {       // success callback
                                                    // Calculate levels for old scores (before taking the quiz)
                                                    exports.calculateSkillLevel(skillScoreDenominator, oldScoresDict, skillLevelsDict,
                                                        function (oldLevelsDict, skillLevelsDict) {      // success callback

                                                            var data = {
                                                                'userQuizScore': userQuizScore,
                                                                'quizMaxScore': quizMaxScore,
                                                                'newLevels': newLevelsDict,
                                                                'prevLevels': oldLevelsDict,
                                                                'skillLevelsDict': skillLevelsDict,
                                                                'quizNumber' : quizNumber
                                                            };

                                                            successcallback(data);
                                                        },
                                                        function (error) {    // error callback
                                                            errorCallback(error);
                                                        }
                                                    );
                                                },
                                                function (error) {    // error callback
                                                    errorCallback(error);
                                                }
                                            );

                                        },
                                        function (error) {
                                            errorCallback(error);
                                        }
                                    );

                                },
                                function (error) {    // error callback
                                    errorCallback(error);
                                }
                            );
                        },
                        error: function (error) { // error callback
                            errorCallback(error);
                        }
                    });

                },
                error: function (error) { // error callback
                    errorCallback(error);
                }
            });
        },
        function(error){    // error callback
            errorCallback(error);
        }
    );
};

// Function that takes Scores for each skill and returns its Level accordingly.
exports.getSkillsLevel = function(successCallback, errorCallback){
    var skillLevelsDict = {},
        SkillLevel = Parse.Object.extend('Skill_Level'),
        skillLevelQuery = new Parse.Query(SkillLevel);

    skillLevelQuery.select('level', 'minScorePercentage', 'name');
    skillLevelQuery.find({
        success: function(skillLevels){     // success callback
            for(var i=0; i<skillLevels.length; i++){    // Map each skill level to its 'minPercent' and 'name'
                skillLevelsDict[parseInt(skillLevels[i].get('level'))] = {
                    'minPercent': skillLevels[i].get('minScorePercentage'),
                    'name': skillLevels[i].get('name')
                };
            }
            successCallback(skillLevelsDict);
        },
        error: function(error){     // error callback
            errorCallback(error);
        }
    });
};

exports.calculateSkillLevel = function(skillScoreDenominator, scoresDict, skillLevelsDict, successCallback, errorCallback){
    var ResultLevelsDict = {};

    //Loop on skills and calculate their level.
    for(var key in scoresDict){
        var denominator = skillScoreDenominator;
        if(scoresDict[key]['max_score'] > denominator){
            denominator = scoresDict[key]['max_score'];
        }
        var scorePercent = (scoresDict[key]['score'] / denominator) * 100;

        if(scorePercent <= skillLevelsDict[1]['minPercent']){
            ResultLevelsDict[key] = 0;
        }
        else if(scorePercent > skillLevelsDict[1]['minPercent'] && scorePercent <= skillLevelsDict[2]['minPercent']){
            ResultLevelsDict[key] = 1;
        }
        else if(scorePercent > skillLevelsDict[2]['minPercent'] && scorePercent <= skillLevelsDict[3]['minPercent']){
            ResultLevelsDict[key] = 2;
        }
        else if(scorePercent > skillLevelsDict[3]['minPercent'] && scorePercent <= skillLevelsDict[4]['minPercent']){
            ResultLevelsDict[key] = 3;
        }
        else if(scorePercent > skillLevelsDict[4]['minPercent'] && scorePercent <= 100){
            ResultLevelsDict[key] = 4;
        }
    }

    successCallback(ResultLevelsDict, skillLevelsDict);
};

// function returns the list of all question type
exports.getQuestionTypes = function(successCallback, errorCallback){
    var questionTypeQueryObject = new Parse.Query("Quiz_Question_Type");
    questionTypeQueryObject.limit(1000);
    questionTypeQueryObject.find().then(function(questionTypeList){
        successCallback(questionTypeList)
    }, errorCallback)
};
