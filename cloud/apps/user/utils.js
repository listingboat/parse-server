var _ = require('underscore'),
    user_constants = require('cloud/apps/user/constants.js'),
    quizConstants = require('cloud/apps/quiz/constants.js'),
    secret = require('cloud/secret.js'),
    appSettings = require('cloud/app_settings.js'),
    commonUtils = require('cloud/apps/common/utils.js'),
    commonConstants = require('cloud/apps/common/constants.js'),
    companyConstants = require('cloud/apps/company/constants.js'),
    analyticsConstants = require('cloud/apps/analytics/constants.js');

// Function that saves the calculated scores in User_Personality_Score class (caching).
// Arguments: 1. 'familiarityCircleData': final json data that contains score, inner_circle and outer_circle value for personality(s).
//            2. 'personalitiesDict': key-value pair for each personality.
function saveUserPersonalityScores(user, familiarityCircleData, personalitiesDict, userScores, successCallback, errorCallback, hashTimeStamp){
    var UserPersonalityScore = Parse.Object.extend("User_Personality_Score");
    var personalityScoreList = [],
        personalityObjects = [];

    for(var i=0; i<familiarityCircleData['children'].length; i++){
        var personalityScore = new UserPersonalityScore(),
            userScore = userScores[familiarityCircleData['children'][i]['name']],
            personality = personalitiesDict[familiarityCircleData['children'][i]['name']];
        personalityScore.set('user', user);
        personalityScore.set('personality', personality);
        if(!userScore){
            userScore = 0;
        }
        personalityScore.set('score', userScore);
        personalityScore.set('inner_circle', familiarityCircleData['children'][i]['ppi']);
        personalityScore.set('outer_circle', familiarityCircleData['children'][i]['size']);
        personalityScore.set('actual_max_score', familiarityCircleData['children'][i]['actual_max_score']);
        personalityScore.set('sequence', familiarityCircleData['children'][i]['seq']);
        personalityScore.set('last_update_time_stamp', parseInt(hashTimeStamp));
        personalityScoreList.push(personalityScore);
        personalityObjects.push(personality);
    }
    var userPersonality = Parse.Object.extend('User_Personality_Score'),
        userPersonalityQuery = new Parse.Query(userPersonality);
    userPersonalityQuery.equalTo('user', user);
    userPersonalityQuery.containedIn('personality', personalityObjects);
    userPersonalityQuery.find({
        success: function(userPersonalityScores){
            Parse.Object.destroyAll(userPersonalityScores,
                {
                    success: function(){
                        Parse.Object.saveAll(personalityScoreList).then(function(){
                            successCallback();
                        }, errorCallback);
                    },
                    error: errorCallback
                }
            );
        }, error: errorCallback
    })
}

// Function that returns all 'Personalities' stores in Personality class.
exports.getPersonalitiesObjects = function (questionPersonality, successCallback, errorCallback){
    var personalitiesDict = {},
        Personality = Parse.Object.extend("Personality"),
        personalityQuery = new Parse.Query(Personality);

    if(questionPersonality != 'All'){
        personalityQuery.equalTo('name', questionPersonality.get('name'));
    }
    personalityQuery.find({
        success: function(personalities){
            for(var i=0; i< personalities.length; i++){
                personalitiesDict[personalities[i].get('name')] = personalities[i];
            }
            successCallback(personalitiesDict);
        },
        error: function(error){
            errorCallback(error);
        }
    });
};


// Function to calculate json object.
exports.calculateJsondata = function (user, options, successCallback, errorCallback){
    var familiarityCircleData = options['json_data'];
    var innerCircle, outerCircle;

    // calculate the score for those personalities with at least one quiz question in user response
    for (var key in options['personalities_scores']) {
        var indexOfPersonality = options['sequence_dict'][key],
            denominator = options['personality_score_denominator'];

        if (options['personalities_scores'][key] > denominator) {
            denominator = options['personalities_scores'][key];
        }
        innerCircle = familiarityCircleData['children'][indexOfPersonality]['ppi'] * options['starting_circle_adjustment'] / 100;
        if(innerCircle < 40){
            innerCircle = 40;
        }
        outerCircle = innerCircle + ((options['max_circle'] - innerCircle) * (options['user_scores'][key] / denominator));

        familiarityCircleData['children'][indexOfPersonality]['ppi'] = Math.round(innerCircle);
        familiarityCircleData['children'][indexOfPersonality]['size'] = Math.round(outerCircle);
        familiarityCircleData['children'][indexOfPersonality]['score'] = options['user_scores'][key];
        familiarityCircleData['children'][indexOfPersonality]['actual_max_score'] = options['personalities_scores'][key];

    }

    var length = familiarityCircleData['children'].length;
    // calculate the score for those personalities which was not calculated in loop above
    for (var dataIndex = 0; dataIndex < length; dataIndex++) {
        if (familiarityCircleData['children'][dataIndex]['size'] == 0) {
            familiarityCircleData['children'][dataIndex]['ppi'] = Math.round(familiarityCircleData['children'][dataIndex]['ppi'] * options['starting_circle_adjustment'] / 100);
            if(familiarityCircleData['children'][dataIndex]['ppi'] < 40){
                familiarityCircleData['children'][dataIndex]['ppi'] = 40;
            }
            familiarityCircleData['children'][dataIndex]['size'] = familiarityCircleData['children'][dataIndex]['ppi'];
        }
    }
    successCallback(familiarityCircleData);
};

// Function returning each personality's max_score and the score user has scored for that personality.
// Argument: 'questionPersonality': could be either 'All' or some personality object.
function getPersonalitiesTotal(user, question_personality, successCallback, errorCallback) {
    var personalitiesTotal = {},
        userScores = {};

    exports.fetchUserResponses(user, undefined, undefined, function(userResponses){
        if (question_personality == 'All') {  // For all personalities.
            for (var responseIndex = 0; responseIndex < userResponses.length; responseIndex++) {

                var quesPersonality = userResponses[responseIndex].get('question').get('personality').get('name');
                var quesScore = userResponses[responseIndex].get('question').get('difficulty').get('score');
                personalitiesTotal[quesPersonality] = (personalitiesTotal[quesPersonality] || 0) + quesScore;

                if (!userScores[quesPersonality]) {
                    userScores[quesPersonality] = 0;
                }
                if (userResponses[responseIndex].get('is_correct') == true) {
                    userScores[quesPersonality] += quesScore;
                }
            }
            successCallback(personalitiesTotal, userScores);
        }
        else {  // For new attempted question's personality.
            var personalityName = question_personality.get('name');
            personalitiesTotal[personalityName] = 0;
            userScores[personalityName] = 0;
            for (var responseIndex = 0; responseIndex < userResponses.length; responseIndex++) {
                if (userResponses[responseIndex].get('question').get('personality').id == question_personality.id) {
                    personalitiesTotal[personalityName] += userResponses[responseIndex].get('question').get('difficulty').get('score');

                    if (userResponses[responseIndex].get('is_correct') == true) {
                        userScores[personalityName] += userResponses[responseIndex].get('question').get('difficulty').get('score');
                    }
                }
            }
            successCallback(personalitiesTotal, userScores);
        }
    }, errorCallback);

}


// Function that returns personalities_total and user_scores dict.
// Arguments: 1. 'questionPersonality': could be either 'All' or some personality object.
exports.doCirclesQueries = function (user, questionPersonality, successCallback, errorCallback){
    var familiarityCircleData = {'name': 'familiarity', 'children': []},  // json data required by d3 for familiarity circles creation
        scoreSequenceDict = {};     // temporary dictionary

    if (questionPersonality == 'All') {   //. If scores are to be calculated for all personalities.
        exports.getUserAssessmentResult(user, questionPersonality, function (assessmentResults) {
            for (var resultIndex = 0; resultIndex < assessmentResults.length; resultIndex++) {

                familiarityCircleData['children'].push({
                    'name': assessmentResults[resultIndex].get('personality').get('name'),
                    'ppi': assessmentResults[resultIndex].get('score'),
                    'size': 0,
                    'score': 0,
                    'seq': assessmentResults[resultIndex].get('sequence')
                });

                scoreSequenceDict[assessmentResults[resultIndex].get('personality').get('name')] = resultIndex;
            }
            // Calculating personality(s)'s score and user's score(s)
            getPersonalitiesTotal(user, questionPersonality,
                function (personalitiesTotal, userScores) {
                    successCallback(personalitiesTotal, userScores, familiarityCircleData, scoreSequenceDict);
                }, errorCallback
            );
        }, errorCallback);
    }
    else {  // If score is to be updated only for new attempted question's personality.
        exports.getUserAssessmentResult(user, questionPersonality, function (assessmentResults) {
            familiarityCircleData['children'].push({
                'name': questionPersonality.get('name'),
                'ppi': assessmentResults[0].get('score'),
                'size': 0,
                'score': 0,
                'seq': assessmentResults[0].get('sequence')
            });
            scoreSequenceDict[assessmentResults[0].get('personality').get('name')] = 0;

            getPersonalitiesTotal(user, questionPersonality,
                function (personalitiesTotal, userScores) {
                    successCallback(personalitiesTotal, userScores, familiarityCircleData, scoreSequenceDict);
                }, errorCallback
            );
        }, errorCallback);

    }

};

// Function that recalculates user_personality_score for personality(s).
// Arguments: 1. 'questionPersonality': could be either 'All' or some personality object
//            2. 'settings': key-value pair of settings
exports.reCalculatePersonalityScore = function (user, questionPersonality, settings, successCallback, errorCallback){

    // Querying user's assessment result(s).
    exports.doCirclesQueries(user, questionPersonality,
        function(personalitiesTotal, userScores, familiarityCircleData, scoreSequenceDict){
            // do calculations here
            var options = {
                'json_data': familiarityCircleData,
                'sequence_dict': scoreSequenceDict,
                'personalities_scores': personalitiesTotal,
                'user_scores': userScores,
                'personality_score_denominator': settings['personality_score_denominator'],
                'starting_circle_adjustment': settings['starting_circle_adjustment'],
                'max_circle': settings['max_circle']
            };
            exports.calculateJsondata(user, options,
                function(familiarityCircleData){
                    // get all personalities objects
                    exports.getPersonalitiesObjects(questionPersonality,
                        function(personalitiesDict){
                            // save calculated scores in User Personality Score table
                            saveUserPersonalityScores(user, familiarityCircleData, personalitiesDict, userScores, function(){
                                successCallback(familiarityCircleData, settings['radius_factor']);
                            }, function(error){
                                errorCallback(error);
                            });

                            // return json data back to the controller after caching is complete.
                        },
                        function(error){
                            errorCallback(error);
                        }
                    );
                },
                function(error){
                    errorCallback(error);
                }
            );
        },
        function(error){
            errorCallback(error);
        }
    );
};

// Function that returns settings values for list provided
// Arguments: 'requiredSettingsList': list of setting names whose values are to be fetched.
exports.getPQScoreSettings = function (user, successCallback, errorCallback){

    if(user._pqScoreSettings){
        successCallback(user._pqScoreSettings);
    }
    else {
        var maxCircleValue, startingCircleAdjustmentPercent, personalityScoreDenominatorValue, radiusFactor, skillScoreDenominator,
            Settings = Parse.Object.extend('Settings'),
            settingsQuery = new Parse.Query(Settings),
            requiredSettingsList = ['skill_score_denominator', 'personality_score_denominator', 'starting_circle_adjustment_percentage', 'max_circle', 'radius_factor'];

        settingsQuery.containedIn('name', requiredSettingsList);
        // Querying setting variables from Settings class.
        settingsQuery.find({
            success: function (settings) {
                for (var settingIndex = 0; settingIndex < settings.length; settingIndex++) {
                    switch (settings[settingIndex].get('name')) {
                        case 'personality_score_denominator':
                            personalityScoreDenominatorValue = settings[settingIndex].get('value');
                            break;
                        case 'starting_circle_adjustment_percentage':
                            startingCircleAdjustmentPercent = settings[settingIndex].get('value');
                            break;
                        case 'max_circle':
                            maxCircleValue = settings[settingIndex].get('value');
                            break;
                        case 'radius_factor':
                            radiusFactor = settings[settingIndex].get('value');
                            break;
                        case 'skill_score_denominator':
                            skillScoreDenominator = settings[settingIndex].get('value');
                            break;
                    }
                }

                user._pqScoreSettings = {
                    'personality_score_denominator': parseInt(personalityScoreDenominatorValue),
                    'starting_circle_adjustment': parseInt(startingCircleAdjustmentPercent),
                    'max_circle': parseInt(maxCircleValue),
                    'radius_factor': parseFloat(radiusFactor),
                    'skill_score_denominator': parseInt(skillScoreDenominator)
                };
                successCallback(user._pqScoreSettings);
            },
            error: errorCallback
        });
    }
};


// Function that returns json object to be passed to d3.js for creation of familiarity circles on myPQ page.
exports.getCirclesData = function (user, successCallback, errorCallback, noCacheTableCallback) {
    // Querying the settings variables needed for calculations.
    exports.getPQScoreSettings(user, function(settingsDict){
            // Querying on user's personality scores.
            var UserPersonalityScore = Parse.Object.extend("User_Personality_Score"),
                userPersonalityScoreQuery = new Parse.Query(UserPersonalityScore);
            userPersonalityScoreQuery.equalTo('user', user);
            userPersonalityScoreQuery.include('personality');
            userPersonalityScoreQuery.find({
                success: function(personalityScores){
                    if(personalityScores.length == user_constants.TOTAL_PERSONLITY_COUNT){     // If user personality scores are already filled in
                        var familiarityCircleData = {'name': 'familiarity', 'children': []},  // json data required by d3 for familiarity circles creation
                            orderedJsonData = familiarityCircleData;
                        // simply get all scores related to the user and send as json data.
                        for(var dataIndex=0; dataIndex<personalityScores.length; dataIndex++){
                            familiarityCircleData['children'].push({
                                'name': personalityScores[dataIndex].get('personality').get('name'),
                                'ppi': personalityScores[dataIndex].get('inner_circle'),
                                'size': personalityScores[dataIndex].get('outer_circle'),
                                'seq': personalityScores[dataIndex].get('sequence')
                            });
                        }

                        // ordering json data on 'sequence' key.
                        orderedJsonData['children'] = familiarityCircleData['children'].sort(function(a, b){
                            return a.seq - b.seq;
                        });

                        successCallback(orderedJsonData, settingsDict['radius_factor']);
                    }
                    else{   // if no record for user; calculate 'score', 'inner_circle' and 'outer_circle' fields for each personality;
                        noCacheTableCallback();
                    }

                },
                error: errorCallback
            });

        },
        function(error){
            errorCallback(error);
        }
    );
};

// function to fetch skill score in dict for each skill
function fetchSkillScore(user, successCallback, errorCallback, noCacheTableCallback){
    var UserSkillScore = Parse.Object.extend('User_Skill_Score'), // User Skill table
        query = new Parse.Query(UserSkillScore).include('skill'); // query to include skill data
    query.equalTo('user', user); // filter query for particular user
    query.find({
        success: function (userSkillScores) { // success callback
            if(userSkillScores.length == user_constants.TOTAL_SKILL_COUNT) {
                exports.getPQScoreSettings(user, function(settings){
                    var userSkillData = {}; // object to store all skill scores
                    for (var index in userSkillScores) {
                        var userSkillScore = userSkillScores[index],
                            skill = userSkillScore.get('skill'), // skill object
                            skillName = skill.get('name').toLowerCase(), // skill name
                            maxScore = userSkillScore.get('actual_max_score') || 0;
                        // if max score is aless then skill score denominator then replace max score with skill score denominator
                        if(settings.skill_score_denominator && settings.skill_score_denominator > maxScore){
                            maxScore = settings.skill_score_denominator;
                        }
                        userSkillData[skillName] = {};
                        userSkillData[skillName].maxScore = maxScore; // score for skill and user
                        userSkillData[skillName].score = userSkillScore.get('score'); // points scored by user
                    }
                    successCallback(userSkillData); // pass userSkillScores object to success back
                }, errorCallback);
            }
            else {    // if not valid skill score found
                noCacheTableCallback();
            }
        },
        error: errorCallback
    });
}

// to set score in cached table
function setSkillScore(user, skills, skillScore, skillObjectMap, skillScoreDenominator, hashTimeStamp, successCallback, errorCallback, hash) {
    var userSkillScores = [],
        UserSkillScore = Parse.Object.extend('User_Skill_Score'), // User Skill table
        skillDenominator = parseInt(skillScoreDenominator),
        skillObjects = [],
        maxScore;
    for (var skillIndex in skillScore) { // iterate over skills
        // set maxScore with summ of score of all questions if that is greater than already maxScore
        maxScore = skillScore[skillIndex].maxScore;
        if (skillScore[skillIndex].maxScore < skillDenominator) {
            skillScore[skillIndex].maxScore = skillDenominator;
        }
        if (!skills || skills.length === 0 || skillObjectMap[skillIndex]) { // save user score for required skill only
            var skillScoreObject = new UserSkillScore();
            skillScoreObject.set('skill', skillObjectMap[skillIndex]);
            skillScoreObject.set('score', skillScore[skillIndex].score);
            skillScoreObject.set('user', user);
            skillScoreObject.set('last_update_time_stamp', parseInt(hashTimeStamp));
            skillScoreObject.set('actual_max_score', maxScore);
            userSkillScores.push(skillScoreObject);  // collect new user skill score objects
            skillObjects.push(skillObjectMap[skillIndex]);  // collect skill object to later use
        }
    }
    var userSkillScoreQuery = new Parse.Query(UserSkillScore);
    if (!skills || skills.length !== 0) {
        userSkillScoreQuery.containedIn('skill', skillObjects);
    }
    userSkillScoreQuery.equalTo('user', user);
    userSkillScoreQuery.find({ // fetch required user skill score object for deletion
        success: function (userSkillScoreObjects) {
            Parse.Object.destroyAll(userSkillScoreObjects, { // bulk delete
                success: function () {
                    Parse.Object.saveAll(userSkillScores, {  // bulk create
                        success: function () {
                            successCallback(skillScore);
                        },
                        error: errorCallback
                    });
                    //successCallback(skillScore);
                },
                error: errorCallback
            });
        },
        error: errorCallback
    });
}

// function to recalculate skill score for given user and skill object passed
exports.reCalculateSkillScore = function (user, skills, successCallback, errorCallback) {

    exports.fetchUserResponses(user, undefined, undefined, function(userResponses){
            var skillScore = { // initialize score and max score with zero
                    identify: {
                        maxScore: 0,
                        score: 0
                    },
                    understand: {
                        maxScore: 0,
                        score: 0
                    },
                    connect: {
                        maxScore: 0,
                        score: 0
                    }
                },
                skillObjectMap = {};
            // iterate over user responses and calculate sum and max score
            for (var userResponseIndex in userResponses) {  // iterate over responses and accumulate score and max score
                var userResponse = userResponses[userResponseIndex],
                    skill = userResponse.get('question').get('skill'),
                    skillKey = skill.get('name').toLowerCase(),
                    score = userResponse.get('question').get('difficulty').get('score');
                skillScore[skillKey].maxScore += score;

                if (userResponse.get('is_correct')) {    // count score for correct answers
                    skillScore[skillKey].score += score;
                }

                if(skills && skills.length !== 0 && !skillObjectMap[skillKey]){  // collect skill object from responses
                    skillObjectMap[skillKey] = skill;
                }
            }
            var Settings = Parse.Object.extend('Settings'),
                settingsQuery = new Parse.Query(Settings);
            settingsQuery.equalTo('name', 'skill_score_denominator'); // add table which are to be joined with Question
            settingsQuery.first({
                success: function (skillDenominatorSetting) {
                    if(!skills || skills.length == 0) {
                        var skillModel = Parse.Object.extend('Skill'),
                            skillQuery = new Parse.Query(skillModel);
                        skillQuery.find({
                            success: function (skillModelObjects) {
                                for (var skillModelObjectIndex in skillModelObjects) {
                                    var skill = skillModelObjects[skillModelObjectIndex],
                                        skillKey = skill.get('name').toLowerCase();
                                    if (!skillObjectMap[skillKey]) {  // collect skill object from responses
                                        skillObjectMap[skillKey] = skill;
                                    }
                                }
                                setSkillScore(user, skills, skillScore, skillObjectMap, skillDenominatorSetting.get('value'), 0, successCallback, errorCallback);
                            },
                            error: errorCallback
                        });
                    }
                    else{
                        setSkillScore(user, skills, skillScore, skillObjectMap, skillDenominatorSetting.get('value'), 0, successCallback, errorCallback);
                    }
                },
                error: errorCallback
            })
        }, errorCallback );
};

// function to fetch skill levels
function fetchSkillLevel(successCallback, errorCallback) {
    var SkillLevel = Parse.Object.extend('Skill_Level'), // Skill level table
        query = new Parse.Query(SkillLevel);
    query.find({
        success: function (skillLevels) {
            var skillLevelList = new Array(skillLevels.length);
            // iterate over skill levels and create list of skill containing min score and display percentages
            for (var index in skillLevels) {
                var skillLevel = skillLevels[index];
                skillLevelList[parseInt(skillLevel.get('level') - 1)] = {
                    minScorePercentage: skillLevel.get('minScorePercentage'),
                    minDisplayPercentage: skillLevel.get('minDisplayPercentage')
                };
            }
            successCallback(skillLevelList);
        },
        error: errorCallback
    });
}


// function to calculate score percentage and display percentage from fetched data
exports.getSkillsGraphData = function (user, successCallback, errorCallback, noCacheTableCallback) {
    fetchSkillLevel(function (skillLevelList) { // success callback
            fetchSkillScore(user,
                function (userSkillScores) { // success callback
                    var graphData = {};
                    for (var userSkillName in userSkillScores) {
                        var userSkill = userSkillScores[userSkillName]; // userSkill object

                        // calculate score percentage
                        var scorePercentage = Math.round(userSkill.score / userSkill.maxScore * 100);
                        if (scorePercentage > skillLevelList[0].minScorePercentage) {
                            for (var skillLevelIndex = 0; skillLevelIndex < skillLevelList.length; skillLevelIndex++) {
                                var maxScorePercentage = ( // maximum percentage for this level
                                        skillLevelList[skillLevelIndex + 1] ? skillLevelList[
                                        skillLevelIndex + 1].minScorePercentage : 100),
                                    maxDisplayPercentage = ( // maximum percentage of graph is shown in this level
                                        skillLevelList[skillLevelIndex + 1] ? skillLevelList[
                                        skillLevelIndex + 1].minDisplayPercentage : 100),
                                    skillLevel = skillLevelList[skillLevelIndex]; // skillLevel object

                                if (scorePercentage > skillLevel.minScorePercentage // check level of user
                                    && scorePercentage <= maxScorePercentage) {
                                    // calculate display percentage to be shown on graph
                                    userSkill.displayPercentage = Math.round(
                                        skillLevel.minDisplayPercentage +
                                        (scorePercentage - skillLevel.minScorePercentage) /
                                        (maxScorePercentage - skillLevel.minScorePercentage) *
                                        (maxDisplayPercentage - skillLevel.minDisplayPercentage)
                                    );
                                }
                            }
                        }
                        else {
                            // calculate display percentage for beginner
                            userSkill.displayPercentage = Math.round(
                                (scorePercentage) /
                                (skillLevelList[0].minScorePercentage) *
                                (skillLevelList[0].minDisplayPercentage)
                            );
                        }
                        graphData[userSkillName] = { // set skill graph data
                            score: userSkill.score,
                            displayPercentage: userSkill.displayPercentage
                        };
                    }
                    successCallback(graphData); // success callback is passed with user skill graph data
                },
                errorCallback, // called when skill level is not fetched
                noCacheTableCallback
            );
        },
        errorCallback // called when user skill data is not fetched
    );
};

// function to generate Personality Factor map and personality description map
function getPersonaltyFactorAndDescription(successCallback, errorCallback){
    var personalityFactorDict = {    // Dictionary for personality Factors
            'strength':{},
            'distress_response':{},
            'psych_need':{}
        },
        personalityDescriptionMap = {},    // Dictionary for personality description
        personalityFactorQuery = new Parse.Query('Personality_Factors');
    personalityFactorQuery.include('personality');

    personalityFactorQuery.find().then(function (personalityFactors) {
        for (resultIndex = 0; resultIndex < personalityFactors.length; resultIndex++) {
            var personalityName = personalityFactors[resultIndex].get('personality').get('name').toLowerCase();
            // mapping personality Factor
            personalityFactorDict[personalityFactors[resultIndex].get('factor')][personalityName] = personalityFactors[resultIndex].get('content');
            // map personality description if hasn't been mapped
            if (!personalityDescriptionMap[personalityName]) {
                personalityDescriptionMap[personalityName] = personalityFactors[resultIndex].get('personality').get('description');
            }
        }
        successCallback(personalityFactorDict, personalityDescriptionMap);
    },function(error){
        errorCallback(error);
    });
}

// function to get latest assessment result for given user
exports.getUserAssessmentResult = function(user , personalityType, successCallback, errorCallback){

    function getAssessmentResult(assessment){
        var userAssessmentResultQuery = new Parse.Query('User_Assessment_Results');
        userAssessmentResultQuery.equalTo('userAssessment', assessment);    // innerQuery
        userAssessmentResultQuery.equalTo('scoreSection', user_constants.SCORE_SECTION);    // result with scoreSection = Condominium
        userAssessmentResultQuery.ascending('sequence');    // least sequence no. will be on top
        userAssessmentResultQuery.include('personality');
        if(personalityType != 'All'){
            userAssessmentResultQuery.equalTo('personality', personalityType);
        }
        userAssessmentResultQuery.find().then(function (userAssessmentResult) {
            successCallback(userAssessmentResult);
        }, errorCallback);
    }

    var assessment = user.get('assessment');
    if(assessment){
        getAssessmentResult(assessment)
    }
    else {
        var userAssessmentQuery = new Parse.Query('User_Assessments');
        userAssessmentQuery.descending('completedAt');    // last completed assessment will be on the top
        userAssessmentQuery.equalTo('completed', true);    // not completed assessment will be excluded
        userAssessmentQuery.equalTo('user', user);    // assessment will be of current user only
        userAssessmentQuery.first().then(function (assessment) {
            user.set('assessment', assessment);
            user.save();
            getAssessmentResult(assessment)
        }, errorCallback);
    }
};

// function to get Core and Secoandry typ badge class along with base, phase and stage
function getPersonaltySpectrumData(userAssessmentResults, successCallback){
    var context = {},
        base;
    for (resultIndex = 0; resultIndex < userAssessmentResults.length; resultIndex++) {
        userAssessmentResultObject = userAssessmentResults[resultIndex];

        // Sets the base
        if (!base && userAssessmentResultObject.get('base')) {
            // sets the core type badge
            context['coreType'] = userAssessmentResultObject.get('personality').get('name').toLowerCase();
            base = userAssessmentResultObject.get('personality').get('name').toLowerCase(); // sets base
        }

    }
    successCallback(context, base);
}

// function to get Personality factors using base phase and stage from the given personality Factor Dict
function getPersonalityFactors(base, personalityFactorDict){
    var aboutMeData = {};
    // Strength content
    aboutMeData['strength'] = personalityFactorDict['strength'][base] + '. ';

    // mild Distress content
    aboutMeData['distressResponse'] = personalityFactorDict['distress_response'][base];

    // Psych Needs  content
    aboutMeData['psychNeed'] = personalityFactorDict['psych_need'][base];

    return aboutMeData;
}

exports.validateLoginForm = function (form_data, Callback) {
    var isValid = true,
        passwordRegex = new RegExp(/(^(?=.*\d).{8,}$)/),    // Regular expression for password
        form_errors = {};

    if(form_data['userEmail'] == ''){
        form_errors['userEmailError'] = "*Required";
        isValid = false;
    }
    else if (!commonConstants.EMAIL_REGEX.test(form_data['userEmail'])){
        form_errors['userEmailError'] = "Invalid Format";
        isValid = false;
    }
    if (!passwordRegex.test(form_data['password'])){
        form_errors['passwordError'] = "Invalid Password";
        isValid = false;
    }
    Callback(isValid, form_errors);
};

exports.validateRegistationForm = function(form_data, defaultUnknownDepartment, company, departmentList, successCallback){
    var isValid = true,
        passwordRegex = /(^(?=.*\d).{8,}$)/,    // Regular expression for password
        phoneNumberRegex1 = /^\d{3}([- .]?)\d{3}\1\d{4}$/,    // allows xxx-xxx-xxxx, xxx.xxx.xxxx, xxx xxx xxxx, xxxxxxxxxx
        phoneNumberRegex2 = /^\(\d{3}\)\s?\d{3}-\d{4}$/,    // (xxx)-xxx-xxxx or (xxx)-xxx-xxxx
        form_errors = {};

    // Validates First Name
    if (form_data['firstName'] == ''){
        form_errors['firstNameError'] = "*Required";
        isValid = false;
    }
    else if(form_data['firstName'].length > user_constants.FIRST_NAME_MAX_LENGTH){
        form_errors['firstNameError'] = "First name can not be more than " + user_constants.FIRST_NAME_MAX_LENGTH + " characters long";
        isValid = false;
    }

    // Validates Last Name
    if (form_data['lastName'] == ''){
        form_errors['lastNameError'] = "*Required";
        isValid = false;
    }
    else if(form_data['lastName'].length > user_constants.LAST_NAME_MAX_LENGTH){
        form_errors['lastNameError'] = "Last name can not be more than " + user_constants.LAST_NAME_MAX_LENGTH + " characters long";
        isValid = false;
    }


    // Validates Position Title
    if (form_data['positionTitle'] == ''){
        form_errors['positionTitleError'] = "*Required";
        isValid = false;
    }
    else if(form_data['positionTitle'].length > user_constants.POSITION_TITLE_MAX_LENGTH){
        form_errors['positionTitleError'] = "Position title can not be more than " + user_constants.POSITION_TITLE_MAX_LENGTH + " characters long";
        isValid = false;
    }


    // Validates User Email
    if(form_data['userEmail'] == ''){
        form_errors['userEmailError'] = "*Required";
        isValid = false;
    }
    else if (! commonUtils.validateEmailAddress(form_data['userEmail'])){
        form_errors['userEmailError'] = "Invalid Format";
        isValid = false;
    }
    else if(form_data['userEmail'].length > user_constants.EMAIL_MAX_LENGTH){
        form_errors['userEmailError'] = "Email can not be more than " + user_constants.EMAIL_MAX_LENGTH + " characters long";
        isValid = false;
    }

    // Validates Phone Number
    if(form_data['phoneNumber'] == ""){
        form_errors['phoneNumberError'] = "*Required";
        isValid = false;
    }
    else if (!phoneNumberRegex1.test(form_data['phoneNumber']) && !phoneNumberRegex2.test(form_data['phoneNumber'])){
        form_errors['phoneNumberError'] = "Phone number must be in format xxx-xxx-xxxx, (xxx) xxx-xxxx, xxx xxx xxxx, xxx.xxx.xxxx or xxxxxxxxxx";
        isValid = false;
    }


    // Validates Department
    var selectedDepartment = _.where(departmentList, {id: form_data['department']});
    if(company) {
        if (!(form_data['department']) || (form_data['department'] == "")) {
            form_errors['departmentError'] = "*Required";
            isValid = false;
        }
        else if (selectedDepartment.length === 0) {
            form_errors['departmentError'] = "Please select a valid department.";
            isValid = false;
        }
        else {
            form_data.selected_department = selectedDepartment[0]
        }
    }
    else{
        form_data.selected_department = defaultUnknownDepartment;
    }


    // Validates Password 1
    if (!passwordRegex.test(form_data['password1'])){
        form_errors['password1Error'] = "Password must be at least 8 character long and must contain at least one number";
        isValid = false;
    }

    // Validates password2
    if (form_data['password1'] != form_data['password2']){
        form_errors['password2Error'] = "Password did not match";
        isValid = false;
    }

    // validate if user agrees terms of services or not
    if(typeof form_data["agreeTermsOfService"] === "undefined"){
        form_errors['formError'] = "You must agree to the terms of service before register";
        isValid = false;
    }
    successCallback(isValid, form_errors);
};

exports.isCompanyRegistered = function(user_email, successCallback, errorCallback){
    var isRegisteredCompany =false,
        company,
        company_domain = user_email.split('@')[1],    // domain of the company
        domainQuery = new Parse.Query('Company_Domain');    // query object for Company_Domain model
    domainQuery.equalTo('domain', company_domain);    // search domain with provided domain

    domainQuery.first().then(function(domain){
        if(domain) {    // if match found of the provided domain
            isRegisteredCompany = true;
            company = domain.get("company");
        }
        successCallback(isRegisteredCompany, company);
    }, function(error){
        errorCallback(error);
    });
};

exports.getDepartmentList = function(company, successCallback, errorCallback){
    var departmentQuery = new Parse.Query("Department");
    departmentQuery.equalTo("company", company);
    departmentQuery.include("subdepartments");
    if(!company){
        departmentQuery.equalTo("name", companyConstants.DEFAULT_DEPARTMENT_NAME);
    }
    departmentQuery.find().then(function (departmentList) {
        if(Array.isArray(departmentList)) {
            successCallback(departmentList);
        }
        else{
            successCallback([]);
        }
    }, errorCallback);

};


// function register a user
exports.registerUser = function(form_data, invite, departmentList, successCallback, errorCallback){
    var user = new Parse.User(),    // user object
        firstName, lastName, companyName, listName, timeStamp, hash, email, objectsToSave = [];
    var phoneNumber = form_data['phoneNumber'];
    phoneNumber = phoneNumber.replace(/[-()\s\.]/g,'');    // remove all '- ( ) and whitespaces' from the phone number

    user.set('phone_number', phoneNumber);    // sets user's phone number
    user.set('username', form_data['userEmail']);    // sets user's username
    user.set('email', form_data['userEmail']);    // sets user's email
    user.set('password', form_data['password1']);    // sets user's password
    user.set('first_name', form_data['firstName']);    // sets user's first name
    user.set('first_name_lower_case', (form_data['firstName'] || '').toLowerCase());    // sets user's first name lower case field
    user.set('last_name', form_data['lastName']);    // sets user's last name
    user.set('last_name_lower_case', (form_data['lastName'] || '').toLowerCase());    // sets user's last name lower case field

    if(form_data['company']) { // increment user count when user is added to a company
        form_data['company'].increment('user_count');    // increment company's user count
        user.set('company', form_data['company']);    // sets user's company
    }
    form_data.selected_department.increment("user_count");

    // increment parent department user count too if department has any parent
    if(form_data.selected_department.get("parent_department")){
        form_data.selected_department.get("parent_department").increment("user_count");
    }
    objectsToSave.push(form_data.selected_department);
    user.set('occupation', form_data['positionTitle']);    // sets user's occupation
    user.set('title_lower_case', (form_data['positionTitle'] || '').toLowerCase());    // sets user's occupation lower case field
    user.set('department', form_data.selected_department);
    user.set('tos_accepted', true);  // user accepted terms of service
    user.set("permission_type", user_constants.USER_PERMISSION_TYPE.MEMBER);  // set user permission type to normal member

    // find phoneId and identifierSource for user
    exports.phoneIdAndIdentifierSourceLookup(form_data['userEmail'], function(result){
        if(result){  // if record found
            user.set("phoneId", result.phoneId);
            user.set("identifierSource", result.identifierSource);
            if (result.isSupervisor) {
                user.set("permission_type", user_constants.USER_PERMISSION_TYPE.SUPERVISOR)
            }
        }

        user.signUp().then(function(user){    // sign up the user
            invite.set('user', user);
            objectsToSave.push(invite);
            Parse.Object.saveAll(objectsToSave).then(function(){
                // data to add user prospect in register list at pardot
                // don't change the sequence of hashing
                // for correct sequence check app/user/utils/ function: "validateDataForPardotCall"
                email = form_data['userEmail'];
                firstName = form_data['firstName'];
                lastName = form_data['lastName'];
                if(form_data['company']) {
                    companyName = form_data['company'].get('pardotName');
                }
                listName = appSettings.PARDOTS_LIST_NAMES['REGISTER_LIST'];
                timeStamp = (new Date()).getTime();
                if(companyName) {
                    hash = require('cloud/packages/md5.js').hex_md5(secret.securityKey1 + email + firstName + lastName + companyName + listName + timeStamp + secret.securityKey2);
                }
                else{
                    hash = require('cloud/packages/md5.js').hex_md5(secret.securityKey1 + email + firstName + lastName + listName + timeStamp + secret.securityKey2);
                }
                successCallback({
                    firstName: firstName,
                    lastName: lastName,
                    companyName: companyName,
                    email: email,
                    listName: listName,
                    timeStamp: timeStamp,
                    hash: hash
                }, errorCallback);
            }, errorCallback);

        },function(error){
            errorCallback(error);
        });
    }, errorCallback);

};

// function to lookup record in PBR_lookup table for given email id and return
exports.phoneIdAndIdentifierSourceLookup = function(userEmail, successCallback, errorCallback){
    if(userEmail){
        var pbrQueryObject = new Parse.Query("PBR_Lookup");

        pbrQueryObject.equalTo("email", (userEmail || '').toLowerCase());
        pbrQueryObject.equalTo("active", true);
        pbrQueryObject.first().then(function(result){
            if(result) {
                successCallback({
                    phoneId: result.get("phoneId"),
                    identifierSource: result.get("identifierSource"),
                    isSupervisor: result.get("isSupervisor")
                });
            }
            else{
                successCallback();
            }
        }, errorCallback);
    }
    else{
        successCallback();
    }
};

exports.putUserInWaitList = function(form_data, successcallback, errorCallback) {
    var WaitingList = Parse.Object.extend('User_Waiting_List'),
        wait_list_object = new WaitingList(),    // wait-list object
        email = form_data['userEmail'],
        firstName = form_data['firstName'],
        lastName = form_data['lastName'],
        companyName = form_data['company'],
        timeStamp = (new Date()).getTime(),
        listName, hash;

    wait_list_object.set('first_name',  firstName);    // sets user's first name
    wait_list_object.set('last_name', lastName);    // sets user's last name
    wait_list_object.set('email', email);    // sets user's email
    if(form_data['phoneNumber']){    // checks if phone number is in form data
        var phoneNumber = form_data['phoneNumber'];
        phoneNumber = phoneNumber.replace(/[-()\s\.]/g,'');    // remove all '- ( ) and whitespaces' from the phone number
        wait_list_object.set('phone', phoneNumber);    // sets user's phone number
    }

    listName = appSettings.PARDOTS_LIST_NAMES['WAIT_LIST_JOIN']; // Name of the pardot list

    if(companyName){    // checks if company name is in form data
        wait_list_object.set('company', companyName);
        hash = require('cloud/packages/md5.js').hex_md5(secret.securityKey1 + email + firstName + lastName + companyName + listName + timeStamp + secret.securityKey2);
    } else {
        hash = require('cloud/packages/md5.js').hex_md5(secret.securityKey1 + email + firstName + lastName + listName + timeStamp + secret.securityKey2);
    }

    wait_list_object.save(null).then(function(object){
        successcallback({
            firstName: firstName,
            lastName: lastName,
            companyName: companyName,
            email: email,
            listName: listName,
            timeStamp: timeStamp,
            hash: hash
        });
    }, function (error) {
        errorCallback(error);
    });
};

// function to get the required content for about me page
exports.getAboutMeContent = function(user, successCallback, errorCallback){
    var data = {};
    getPersonaltyFactorAndDescription(function(personalityFactorDict, personalityDescriptionMap){
        exports.getUserAssessmentResult(user, 'All', function(userAssessmentResults){
            getPersonaltySpectrumData(userAssessmentResults, function(data_received, base){

                personalityOrder = userAssessmentResults.map(function(obj){
                    return obj.get('personality').get('name');
                });
                data = {    // for personality spectrum section
                    personalityOrder : personalityOrder,
                    personalityDescriptionMap: personalityDescriptionMap,
                    iconClassMap : user_constants.PERSONALITY_ICON_CLASS_MAP,
                    badgeClassMap: user_constants.PERSONALITY_BADGE_CLASS_MAP,    // for badge class
                    learnMorePersonalityUrlNameMap : user_constants.LEARN_MORE_PERSONALITY_URL_NAME_MAP    // for learn more links
                };
                data = _.extend(data, data_received);
                _.extend(data, getPersonalityFactors(base, personalityFactorDict));
                successCallback(data);
            });
        }, function(error){
            errorCallback(error);
        });
    }, function(error){
        errorCallback(error);
    });
};

 // function to validate join wait list form data
exports.validateJoinWaitListForm = function(form_data, Callback){
    var isValid = true,
        phoneNumberRegex1 = new RegExp(/^\d{3}([- .]?)\d{3}\1\d{4}$/),    // allows xxx-xxx-xxxx, xxx.xxx.xxxx, xxx xxx xxxx, xxxxxxxxxx
        phoneNumberRegex2 = new RegExp(/^\(\d{3}\)\s?\d{3}-\d{4}$/),    // (xxx)-xxx-xxxx or (xxx)-xxx-xxxx
        form_errors = {};

    // Validates First Name
    if (form_data['firstName'] == ''){
        form_errors['firstNameError'] = "*Required";
        isValid = false;
    }
    else if(form_data["firstName"].length > user_constants.FIRST_NAME_MAX_LENGTH){
        form_errors['firstNameError'] = "First name can not be more than "+user_constants.FIRST_NAME_MAX_LENGTH+" characters long";
        isValid = false;
    }

    // Validates Last Name
    if (form_data['lastName'] == ''){
        form_errors['lastNameError'] = "*Required";
        isValid = false;
    }
    else if(form_data["lastName"].length > user_constants.LAST_NAME_MAX_LENGTH){
        form_errors['lastNameError'] = "Last name can not be more than "+user_constants.LAST_NAME_MAX_LENGTH+" characters long";
        isValid = false;
    }

    // Validates Company
    if (form_data['company'] == ''){
        form_errors['companyError'] = "*Required";
        isValid = false;
    }

    // Validates User Email
    if(form_data['userEmail'] == ''){
        form_errors['userEmailError'] = "*Required";
        isValid = false;
    }
    else if (!commonUtils.validateEmailAddress(form_data['userEmail'])){
        form_errors['userEmailError'] = "Invalid Format";
        isValid = false;
    }
    else if(form_data["userEmail"].length > user_constants.EMAIL_MAX_LENGTH){
        form_errors['userEmailError'] = "Email can not be more than "+user_constants.EMAIL_MAX_LENGTH+" characters long";
        isValid = false;
    }

    // Validates Phone Number
    if (!phoneNumberRegex1.test(form_data['phoneNumber']) && !phoneNumberRegex2.test(form_data['phoneNumber'])){
        form_errors['phoneNumberError'] = "Phone number must be in format xxx-xxx-xxxx, (xxx) xxx-xxxx, xxx xxx xxxx, xxx.xxx.xxxx or xxxxxxxxxx";
        isValid = false;
    }
    Callback(isValid, form_errors);
};

// function to check if user already exist
exports.isUserAlreadyExist = function(user_email, successCallback, errorCallback){
    var isNewUser = true,    // true if user is not already registered
        userQuery = new Parse.Query(Parse.User);    // query object for user model

    userQuery.equalTo('email', user_email);    // search user with provided user email
    userQuery.count().then(function(userCount){
        if(userCount){
            isNewUser = false;
        }
        successCallback(isNewUser);
    }, function(error){
        errorCallback(error);
    });
};

// function to check if there is an invite in Invited_User for the user
exports.isUserInInviteList = function(user_email, successCallback, errorCallback){
    var company,
        invitedUserQuery = new Parse.Query('Invited_User');
    invitedUserQuery.include('company');
    invitedUserQuery.equalTo('email', user_email);
    invitedUserQuery.first().then(function(invite) {    // search for the invite
        if(invite){    // if user is in invite list
            company = invite.get('company');
        }
        successCallback(invite, company);
    }, function(error){
        errorCallback(error);
    });
};

// function to check if user already in wait list
exports.isUserInWaitList = function(user_email, successCallback, errorCallback) {
    var isInWaitList = false,    // true if user is in waitlist
        waitingListQuery = new Parse.Query('User_Waiting_List');    // wait list query object
    waitingListQuery.equalTo('email', user_email);
    waitingListQuery.count().then(function (resultCount) {    // search for the record with given email address
        if (resultCount) {    // if user record found
            isInWaitList = true;
        }
        successCallback(isInWaitList)
    }, function (error) {
        errorCallback(error);
    });
};


// function that saves old assessment result of the user from migrated user table

exports.findOldAssessmentResult = function(user, successCallback, errorCallback){
    var groupedResultSet, validationResultObject,
        migratedUserQuery = new Parse.Query('Migrated_Users');    // query object of MIGRATED_USER table
    migratedUserQuery.equalTo('email', user.get('email'));    // find result with given email
    migratedUserQuery.equalTo('scoresection', user_constants.MIGRATED_USER_RESULT_SCORE_SECTION);    // find required score section
    migratedUserQuery.descending('userid');
    migratedUserQuery.ascending('score');    // arrange the results in ascending order of socre
    migratedUserQuery.find().then(function(migrtaedUserResults){    // fire the query
        if(migrtaedUserResults.length > 0){    // if result found
            var keyArray = new Array(),
                index =0;
            exports.getPersonalityMap(function(personalityMap){    // function to get the personality map to map the personality according to score name
                 // group the results into array sets according to their userid and their userid becomes the key to each set
                groupedResultSet = _.groupBy(migrtaedUserResults, function(resultObject){ return resultObject.get('userid')});

                keyArray = _.keys(groupedResultSet);
                keyArray = _.sortBy(keyArray, function(key){ return parseInt(key, 10) });    // sorts the keys
                for(index = keyArray.length -1; index >=0; index--){    // validates each sets in descending order of their user id until valid set is found
                    validationResultObject = validateAssessmentResults(groupedResultSet[keyArray[index]], user, personalityMap); // validates the result sets
                    if(validationResultObject.isValid){    // if set is valid
                        break;
                    }
                }
                if(validationResultObject.isValid) {   // if set is valid
                    saveMigratedResult(validationResultObject.assessmentResultObjects, function () {    // saves that valid set of result
                        setUserPersonalitiesAndAssessment(validationResultObject.assessmentResultObjects, validationResultObject.assessmentObject, user, function () {    // sets user personalities
                            // data to add user prospect in assessment complete migrated list at pardot
                            // don't change the sequence of hashing
                            // for correct sequence check app/user/utils/ function: "validateDataForPardotCall"
                            var hash, listName, email, timeStamp;
                            email = user.get('email');
                            listName = appSettings.PARDOTS_LIST_NAMES['MIGRATED_ASSESSMENT_COMPLETE'];
                            timeStamp = (new Date()).getTime();
                            hash = require('cloud/packages/md5.js').hex_md5(secret.securityKey1 + email + listName + timeStamp + secret.securityKey2);
                            successCallback({
                                success: true,
                                isNewUser: true,
                                email: email,
                                listName: listName,
                                timeStamp: timeStamp,
                                hash: hash
                            });
                        }, function (error) {
                            errorCallback(error);
                        })
                    }, errorCallback);
                }
                else{
                    successCallback({success: true, isNewUser: false});
                }

            }, errorCallback);
        }
        else{
            successCallback({success: true, isNewUser: false});
        }
    }, errorCallback);
};

// function that saves the given object array
function saveMigratedResult(userAssessmentResultObjects, successCallback, errorCallBack){
    Parse.Object.saveAll(userAssessmentResultObjects).then(function(){
        successCallback()
    }, function(error){
        errorCallBack(error);
    });
}

// function that validates the given migrated result and gives the array of User_Assessment_Results object
function validateAssessmentResults(migratedUserResults, user, personalityMap, successCallback, errorCallback){
    var isResultValid = true,
        userAssessment = Parse.Object.extend('User_Assessments'),
        assessmentObject = new userAssessment(),    // object of user assessment
        userAssessmentResultObjects = new Array();

    if(migratedUserResults.length == user_constants.MIGRATED_USER_RESULT_LIMIT){    // if the given result count is valid
        assessmentObject.set('user', user);    // dummy assessment object for the assessment results
        assessmentObject.set('completed', true);

        var resultCountObject= {    // object that keep track of scoreName and floorType 'base' occurrence
                'base' : false
            }, score, scoreName, scoreSection, sequence, floorType;
        resultCountObject[user_constants.MIGRATED_SCORE_NAME_ACTIONS] = false;
        resultCountObject[user_constants.MIGRATED_SCORE_NAME_REFLECTIONS] = false;
        resultCountObject[user_constants.MIGRATED_SCORE_NAME_REACTIONS] = false;
        resultCountObject[user_constants.MIGRATED_SCORE_NAME_OPINIONS] = false;
        resultCountObject[user_constants.MIGRATED_SCORE_NAME_EMOTIONS] = false;
        resultCountObject[user_constants.MIGRATED_SCORE_NAME_THOUGHTS] = false;


        for (index = 0; index < user_constants.MIGRATED_USER_RESULT_LIMIT; index++) {    // validates each migratedUserResults
            var assessmentResult = Parse.Object.extend('User_Assessment_Results'),
                userAssessmentResult = new assessmentResult(),
                baseOccurrenceSequence = 100,
                baseOccurrenceIndex;
            userAssessmentResult.set('userAssessment', assessmentObject);
            score = migratedUserResults[index].get('score');
            scoreName = migratedUserResults[index].get('scorename');
            scoreSection = migratedUserResults[index].get('scoresection');
            sequence = migratedUserResults[index].get('sequence');
            floorType = migratedUserResults[index].get('floortype').toLowerCase();

            if (score <= 100) {    // if score is less then equal to 100
                userAssessmentResult.set('score', score);    // sets the score in assessment result object

                if (sequence > 0 && sequence < 7) {    // if sequence is between 1-6
                    userAssessmentResult.set('sequence', sequence);    // sets the sequence in assessment result object
                    userAssessmentResult.set('scoreSection', scoreSection);    // sets the scoreSection in assessment result object

                    if (scoreName && (resultCountObject[scoreName.toLowerCase()] == false)) {    // if the same score name has not occured yet
                        resultCountObject[scoreName.toLowerCase()] = true;    // sets score name occurrence to true
                        userAssessmentResult.set('scoreName', scoreName);    // sets the scoreName in assessment result object
                        userAssessmentResult.set('personality', personalityMap[user_constants.USER_SCORE_NAME_MAP[scoreName.toLowerCase()].toLowerCase()]);    // sets the personality in assessment result object

                        if (floorType) {    // if floor type exist

                            if (floorType == 'phase') {    // if the floor type is phase
                                userAssessmentResult.set('phase', true);    // sets the phase in assessment result object
                                userAssessmentResult.set('stage', false);    // sets the stage in assessment result object
                                userAssessmentResult.set('base', false);    // sets the base in assessment result object
                            }
                            else if (floorType == 'stage') {    // if the floor type is stage
                                userAssessmentResult.set('stage', true);    // sets the stage in assessment result object
                                userAssessmentResult.set('phase', false);    // sets the phase in assessment result object
                                userAssessmentResult.set('base', false);    // sets the base in assessment result object
                            }
                            else if (floorType == 'other') {    // if the floor type is other
                                userAssessmentResult.set('stage', false);    // sets the stage in assessment result object
                                userAssessmentResult.set('phase', false);    // sets the phase in assessment result object
                                userAssessmentResult.set('base', false);    // sets the base in assessment result object
                            }
                            else if (floorType == 'base') {    // if the floor type is base
                                if(baseOccurrenceSequence > sequence) {
                                    if(baseOccurrenceIndex <= 6){
                                        userAssessmentResultObjects[baseOccurrenceIndex].set('base', false);
                                    }
                                    baseOccurrenceIndex = index;
                                    baseOccurrenceSequence = sequence;
                                    resultCountObject['base'] = true;    // sets the occurrence of base type
                                    userAssessmentResult.set('base', true);    // sets the base in assessment result object
                                    userAssessmentResult.set('phase', false);    // sets the phase in assessment result object
                                    userAssessmentResult.set('stage', false);    // sets the stage in assessment result object
                                }
                                else{
                                    userAssessmentResult.set('stage', false);    // sets the stage in assessment result object
                                    userAssessmentResult.set('phase', false);    // sets the phase in assessment result object
                                    userAssessmentResult.set('base', false);    // sets the base in assessment result object
                                }
                            }
                            else {
                                isResultValid = false;
                                break;
                            }
                            userAssessmentResultObjects[index] = userAssessmentResult;   // put the object in  array
                        }
                        else {
                            isResultValid = false;
                            break;
                        }
                    }
                    else {
                        isResultValid = false;
                        break;
                    }
                }
                else {
                    isResultValid = false;
                    break;
                }
            }
            else {
                isResultValid = false;
                break;
            }
        }
        if(isResultValid) {
            isResultValid = resultCountObject['base'];    // result is valid if base has occured atleast once
        }
        return ({isValid: isResultValid, assessmentResultObjects: userAssessmentResultObjects, assessmentObject: assessmentObject})

    }
    else{
        isResultValid = false;
        return({isValid: isResultValid, assessmentResultObjects: userAssessmentResultObjects, assessmentObject: assessmentObject})
    }
}

// function that fetch all the personalityies and maps them
exports.getPersonalityMap = function(successCallback, errorCallback){
    var personalityMap = {},
        personalityQuery = new Parse.Query('Personality');
    personalityQuery.find().then(function(personalities){
        if(personalities) {
            for (index = 0; index < personalities.length; index++) {
                personalityMap[personalities[index].get('name').toLowerCase()] = personalities[index];
            }
        }
        successCallback(personalityMap);
    }, function(error){
        errorCallback(error)
    });
}

// function that sets the user's primary secoandry personality
function setUserPersonalitiesAndAssessment(userAssessmentResultObjects, userAssessmentObject, user, successCallback, errorCallback){
    for(var index=0; index<userAssessmentResultObjects.length; index++){
        if(userAssessmentResultObjects[index].get('base')){    // if base is true
            var primary_personality = userAssessmentResultObjects[index].get('personality');
            user.set('primary_personality', primary_personality);
            if(user.get('company')) { // increment user count for given personality in company
                user.get('company').increment(primary_personality.get('name').toLowerCase() + '_count');
            }
            if(user.get('department')) { // increment user count for given personality in department
                user.get('department').increment(primary_personality.get('name').toLowerCase() + '_count');
            }
            break;
        }
    }
    user.set('assessment', userAssessmentObject);
    user.save().then(function(){
        successCallback();
    }, function(error){
        errorCallback(error);
    });
}

exports.getTellOthersMailContent = function(res, successCallback){
    res.render('mails/tell_others/tell_others_mail_subject.ejs', {layout: 'layout_partial.ejs'}, function(err, subject) {
        res.render('mails/tell_others/tell_others_mail_body.ejs', {layout: 'layout_partial.ejs', protocol: appSettings.PROTOCOL, domain: appSettings.DOMAIN_FOR_WORK_STYLE}, function (err, body) {
            successCallback({mailSubject: subject, mailBody: body});
        })
    });
};

// validates the recived data for pardot call
exports.validateDataForPardotCall = function(req, successCallback) {
    var hash = "hash", hashReceived, stringToHash, firstName, lastName, companyName, email, listName, timeStamp, currentTimeStamp, userDict = {};
    hashReceived = req.body.hash;
    email = req.body.email;
    firstName = req.body.firstName;
    lastName = req.body.lastName;
    companyName = req.body.companyName;
    listName = req.body.listName;
    timeStamp = req.body.timeStamp;
    currentTimeStamp = (new Date).getTime();
    stringToHash = secret.securityKey1;
    stringToHash += email;
    userDict['email'] = email;

    if (timeStamp && Math.floor(currentTimeStamp - timeStamp) > user_constants.PARDOT_DATA_VALIDITY) {  // If time stamp is more than 5 minutes before current time stop Pardot Call
        successCallback(false, userDict, listName);
        return;
    }

    if (firstName) {
        userDict['first_name'] = firstName;
        stringToHash += firstName;
    }
    if (lastName) {
        userDict['last_name'] = lastName;
        stringToHash += lastName;
    }
    if (companyName) {
        userDict['company'] = companyName;
        stringToHash += companyName;
    }

    if (listName) {
        stringToHash += listName;
    }
    else {
        listName = false;
    }
    if(timeStamp) {
        stringToHash += timeStamp;
    }
    stringToHash += secret.securityKey2;
    hash = require('cloud/packages/md5.js').hex_md5(stringToHash);
    if (hash == hashReceived) {
        successCallback(true, userDict, listName);
    }
    else {
        successCallback(false, userDict, listName);
    }
};


//function te fetch userResponses for the given user
// put user responses in user object
// it returns maximum a batch of thousand responses
// skips batchNumber*1000 responses
exports.fetchUserResponses = function (user, batchNumber, smallBatchCount, successCallback, errorCallback, createdAfter) {

    if(batchNumber != undefined && smallBatchCount != undefined) {
        var userResponseQuery = new Parse.Query("User_Response");
        userResponseQuery.equalTo('user', user);
        userResponseQuery.include('question', 'question.personality', 'question.difficulty', 'question.skill');//include('question', 'question. difficulty', 'question.skill')
        userResponseQuery.limit(user_constants.USER_RESPONSE_QUERY_BATCH_SIZE);
        userResponseQuery.skip((batchNumber % smallBatchCount) * user_constants.USER_RESPONSE_QUERY_BATCH_SIZE);
        userResponseQuery.equalTo('is_applicable', true);
        userResponseQuery.ascending("createdAt");
        if (createdAfter) {
            userResponseQuery.greaterThan("createdAt", createdAfter);
        }
        userResponseQuery.find().then(function (results) {
            if (results && results.length > 0) {
                successCallback(results);
            }
            else {
                successCallback();
            }

        }, errorCallback);
    }
    else{
        successCallback();
    }
};

exports.getScoreMap = function (userResponses, batchNumber) {
    var responseMap = {
        skillScore: {
            connect: {
                maxScore: 0,
                score: 0
            },
            understand: {
                maxScore: 0,
                score: 0
            },
            identify: {
                maxScore: 0,
                score: 0
            }
        },
        personalityScore: {
            Doer: {
                maxScore: 0,
                score: 0
            },
            Original: {
                maxScore: 0,
                score: 0
            },
            Dreamer: {
                maxScore: 0,
                score: 0
            },
            Advisor: {
                maxScore: 0,
                score: 0
            },
            Organizer: {
                maxScore: 0,
                score: 0
            },
            Connector: {
                maxScore: 0,
                score: 0
            }
        },
        batchNumber: batchNumber
    };
    for (var index in userResponses) {
        var personality = userResponses[index].get('question').get('personality').get('name'),
            skill = userResponses[index].get('question').get('skill').get('name').toLowerCase(),
            score = userResponses[index].get('question').get('difficulty').get('score'),
            hash;
        responseMap.skillScore[skill].maxScore += score;
        responseMap.personalityScore[personality].maxScore += score;
        if (userResponses[index].get('is_correct')) {
            responseMap.skillScore[skill].score += score;
            responseMap.personalityScore[personality].score += score;
        }
    }
    hash = require('cloud/packages/md5.js').hex_md5(secret.securityKey1 + responseMap + secret.securityKey2);
    return {hash: hash, responseData: responseMap};
};

// function validate all the received user responses batches and make one combined batch
// returns result object with valid flag and combined response object
exports.validateResponseBatches = function (responseBatches) {
    var regeneratedHash, isValid = true,
        userResponseMap = {
            skillScore: {
                connect: {
                    maxScore: 0,
                    score: 0
                },
                understand: {
                    maxScore: 0,
                    score: 0
                },
                identify: {
                    maxScore: 0,
                    score: 0
                }
            },
            personalityScore: {
                Doer: {
                    maxScore: 0,
                    score: 0
                },
                Original: {
                    maxScore: 0,
                    score: 0
                },
                Dreamer: {
                    maxScore: 0,
                    score: 0
                },
                Advisor: {
                    maxScore: 0,
                    score: 0
                },
                Organizer: {
                    maxScore: 0,
                    score: 0
                },
                Connector: {
                    maxScore: 0,
                    score: 0
                }
            }
        };
    for (var index in responseBatches) {

        regeneratedHash = require('cloud/packages/md5.js').hex_md5(secret.securityKey1 + responseBatches[index].responseData + secret.securityKey2);
        if (responseBatches[index].hash == regeneratedHash) {
            for (var key in  userResponseMap.skillScore) {
                userResponseMap.skillScore[key].maxScore += (responseBatches[index].responseData.skillScore[key].maxScore);
                userResponseMap.skillScore[key].score += (responseBatches[index].responseData.skillScore[key].score);
            }
            for (var key in  userResponseMap.personalityScore) {
                userResponseMap.personalityScore[key].maxScore += (responseBatches[index].responseData.personalityScore[key].maxScore);
                userResponseMap.personalityScore[key].score += (responseBatches[index].responseData.personalityScore[key].score);
            }
        }
        else {
            isValid = false;
            break;
        }
    }
    if(isValid) {
        return {isValid: isValid, userResponsesScore: userResponseMap};
    }
    else{
        return {isValid: isValid};
    }
};


// function that recalculates the skillScore for the user and returns skill graph data
exports.resetUserSkillCacheData = function (user, calculatedSkillScore, hashTimeStamp, successCallback, errorCallback) {

    // function destroy old sill score if exist and call function to save latest skill score
    function destroyOldSkillScore(successCallback, errorCallback) {
        var UserSkillScore = Parse.Object.extend('User_Skill_Score'), // User Skill table
            query = new Parse.Query(UserSkillScore).include('skill'); // query to include skill data
        query.equalTo('user', user); // filter query for particular user
        query.find({
            success: function (userSkillScores) { // success callback
                if (userSkillScores.length > 0) {
                    Parse.Object.destroyAll(userSkillScores).then(function () {
                        saveSkillScore(successCallback, errorCallback);
                    }, errorCallback);
                }
                else {
                    saveSkillScore(successCallback, errorCallback);
                }
            },
            error: errorCallback
        });
    }

    // function that calculates the skill score using user responses
    function saveSkillScore(successCallback, errorCallback) {
        var Settings = Parse.Object.extend('Settings'),
            skillObjectMap = {};
        exports.getPQScoreSettings(user, function(settings){
                var skillModel = Parse.Object.extend('Skill'),
                    skillQuery = new Parse.Query(skillModel);
                skillQuery.find({
                    success: function (skillModelObjects) {
                        for (var skillModelObjectIndex in skillModelObjects) {
                            var skill = skillModelObjects[skillModelObjectIndex],
                                skillKey = skill.get('name').toLowerCase();
                            if (!skillObjectMap[skillKey]) {  // collect skill object from responses
                                skillObjectMap[skillKey] = skill;
                            }
                        }
                        setSkillScore(user, [], calculatedSkillScore, skillObjectMap, settings.skill_score_denominator, hashTimeStamp, successCallback, errorCallback);
                    },
                    error: errorCallback
                });
            },
            errorCallback)
    }


    fetchSkillLevel(function (skillLevelList) { // success callback
            destroyOldSkillScore(function (userSkillScores) { // success callback
                    var graphData = {};
                    for (var userSkillName in userSkillScores) {
                        var userSkill = userSkillScores[userSkillName]; // userSkill object

                        // calculate score percentage
                        var scorePercentage = Math.round(userSkill.score / userSkill.maxScore * 100);
                        if (scorePercentage > skillLevelList[0].minScorePercentage) {
                            for (var skillLevelIndex = 0; skillLevelIndex < skillLevelList.length; skillLevelIndex++) {
                                var maxScorePercentage = ( // maximum percentage for this level
                                        skillLevelList[skillLevelIndex + 1] ? skillLevelList[
                                        skillLevelIndex + 1].minScorePercentage : 100),
                                    maxDisplayPercentage = ( // maximum percentage of graph is shown in this level
                                        skillLevelList[skillLevelIndex + 1] ? skillLevelList[
                                        skillLevelIndex + 1].minDisplayPercentage : 100),
                                    skillLevel = skillLevelList[skillLevelIndex]; // skillLevel object

                                if (scorePercentage > skillLevel.minScorePercentage // check level of user
                                    && scorePercentage <= maxScorePercentage) {
                                    // calculate display percentage to be shown on graph
                                    userSkill.displayPercentage = Math.round(
                                        skillLevel.minDisplayPercentage +
                                        (scorePercentage - skillLevel.minScorePercentage) /
                                        (maxScorePercentage - skillLevel.minScorePercentage) *
                                        (maxDisplayPercentage - skillLevel.minDisplayPercentage)
                                    );
                                }
                            }
                        }
                        else {
                            // calculate display percentage for beginner
                            userSkill.displayPercentage = Math.round(
                                (scorePercentage) /
                                (skillLevelList[0].minScorePercentage) *
                                (skillLevelList[0].minDisplayPercentage)
                            );
                        }
                        graphData[userSkillName] = { // set skill graph data
                            score: userSkill.score,
                            displayPercentage: userSkill.displayPercentage
                        };
                    }
                    successCallback(graphData); // success callback is passed with user skill graph data
                },
                errorCallback
            );
        },
        errorCallback // called when user skill data is not fetched
    );
};


// function that calculates user personality score and return familiarity circle data
exports.recalculateCacheTablePersonalityScore = function (user, calculatedPersonalityScore, hashTimeStamp, successCallback, errorCallback) {


    function resetUserPersonalityCacheData(settings) {
        var familiarityCircleData = {'name': 'familiarity', 'children': []},  // json data required by d3 for familiarity circles creation
            scoreSequenceDict = {};     // dictionary to store the sequence of personality for user

        exports.getUserAssessmentResult(user, 'All', function (assessmentResults) {
            for (var resultIndex = 0; resultIndex < assessmentResults.length; resultIndex++) {

                familiarityCircleData['children'].push({
                    'name': assessmentResults[resultIndex].get('personality').get('name'),
                    'ppi': assessmentResults[resultIndex].get('score'),
                    'size': 0,
                    'score': 0,
                    'seq': assessmentResults[resultIndex].get('sequence')
                });

                scoreSequenceDict[assessmentResults[resultIndex].get('personality').get('name')] = resultIndex;
            }
            // Calculating personality(s)'s score and user's score(s)
            getUserPersonalityTotal(function (personalitiesTotal, userScores) {
                    var options = {
                        'json_data': familiarityCircleData,
                        'sequence_dict': scoreSequenceDict,
                        'personalities_scores': personalitiesTotal,
                        'user_scores': userScores,
                        'personality_score_denominator': settings['personality_score_denominator'],
                        'starting_circle_adjustment': settings['starting_circle_adjustment'],
                        'max_circle': settings['max_circle']
                    };
                    exports.calculateJsondata(user, options,
                        function (familiarityCircleData) {
                            // get all personalities objects
                            exports.getPersonalitiesObjects('All',
                                function (personalitiesDict) {
                                    // save calculated scores in User Personality Score table
                                    saveUserPersonalityScores(user, familiarityCircleData, personalitiesDict, userScores, function () {
                                        successCallback(familiarityCircleData, settings['radius_factor']);
                                    }, errorCallback, hashTimeStamp);

                                    // return json data back to the controller after caching is complete.
                                },
                                errorCallback
                            );
                        }, errorCallback
                    );
                }, errorCallback
            );
        }, errorCallback);
    }

    function getUserPersonalityTotal(successCallback, errorCallback) {
        var personalitiesTotal = {},
            userScores = {};

        for (var personalityKey in calculatedPersonalityScore) {
            personalitiesTotal[personalityKey] = calculatedPersonalityScore[personalityKey].maxScore;
            userScores[personalityKey] = calculatedPersonalityScore[personalityKey].score;
        }
        successCallback(personalitiesTotal, userScores);
    }


    // Querying the settings variables needed for calculations.
    exports.getPQScoreSettings(user, function (settings) {
            // Querying on user's personality scores.
            var UserPersonalityScore = Parse.Object.extend("User_Personality_Score"),
                userPersonalityScoreQuery = new Parse.Query(UserPersonalityScore);
            userPersonalityScoreQuery.equalTo('user', user);
            userPersonalityScoreQuery.include('personality');
            userPersonalityScoreQuery.find({
                success: function (personalityScores) {
                    if (personalityScores.length > 0) {     // If user personality scores are already filled in
                        Parse.Object.destroyAll(personalityScores).then(function () {
                            resetUserPersonalityCacheData(settings);
                        }, errorCallback)
                    }
                    else {   // if no record for user; calculate 'score', 'inner_circle' and 'outer_circle' fields for each personality
                        resetUserPersonalityCacheData(settings);
                    }

                },
                error: errorCallback
            });

        }, errorCallback
    );

};

exports.calculatePQScore = function(user, skillGraphData){
    var pq_score = Object.keys(skillGraphData).reduce(function (sum, key) {
        return sum + skillGraphData[key].score;
    }, 0);
    user.set('pq_score', pq_score);
    var last7DayGain = user.get('last_7_day_pq_scores');
    if (last7DayGain !== undefined && typeof last7DayGain[analyticsConstants.DEFAULT_PQ_GAIN_ARRAY_SIZE - 1] === 'number' && typeof pq_score === 'number')
        user.set('last_7_day_pq_gain', pq_score - last7DayGain[analyticsConstants.DEFAULT_PQ_GAIN_ARRAY_SIZE - 1]);
    else
        user.set('last_7_day_pq_gain', null);
    return user
};


exports.renderImage = function(req, res, absoluteURL){
    Parse.Cloud.httpRequest({    // cloud code module to fetch image
        url: absoluteURL,    // url for the image
        success: function (response) {
            res.writeHead(200, {    // set the head of the response
                'Content-type': 'image/png',    // content type of the response
                'Content-Length': response.buffer.length,
                'Request-Url': req.url
            });
            res.end(response.buffer);    // sends the image
        },
        error: function(error){
            res.status(500).end();
        }
    });
};

// function that returns latest personality score for the user
exports.getUserPersonalityScores = function(user, successCallback, errorCallback) {
    var userPersonalityScoreQuery = new Parse.Query("User_Personality_Score");
    userPersonalityScoreQuery.equalTo("user", user);
    userPersonalityScoreQuery.include("personality");
    userPersonalityScoreQuery.descending("createdAt");
    userPersonalityScoreQuery.find().then(successCallback, errorCallback);
};

// function sets default department of the company with the user
exports.setDefaultDepartment = function(user, company, successCallback, errorCallback){
    if(user && company && !user.get("department")){
        var departmentQuery = new Parse.Query("Department");
        departmentQuery.equalTo("company", company);
        departmentQuery.equalTo("name", companyConstants.DEFAULT_DEPARTMENT_NAME);
        departmentQuery.first().then(function(department){
            user.set("department", department);
            department.increment("user_count");  // increments the user count in the department
            if(user.get("primary_personality") && user.get("primary_personality").get("name")){   // increment personality count for the default department
                department.increment(user.get("primary_personality").get("name").toLowerCase() + "_count");
            }
            user.save().then(successCallback, errorCallback);
        }, errorCallback);
    }
    else{
        successCallback();
    }
};

// fetch primary personality of the user and returns primary personality or undefined if user  has no primary personality
exports.fetchUserPrimaryPersonality = function(user, successCallback, errorCallback){
    var primaryPersonality = user.get("primary_personality");
    if(primaryPersonality){
        primaryPersonality.fetch().then(successCallback, errorCallback);
    }
    else{
        successCallback();
    }
};

exports.getUserDoughnutGraphData = function(user, successCallback, errorCallback){
    exports.getUserPersonalityScores(user, function (personalityScores) { // fetch user's personality score
        exports.getPQScoreSettings(user, function(settings){
            var graphData = [];
            // gets the personality score and name array
            if(Array.isArray(personalityScores) && personalityScores.length > 0) {
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
                //

                // sorts the array in order of sequence
                graphData = _.sortBy(graphData, function (personality) {
                    return personality.sequence;
                });

                // add style classes with each array object
                for (var personalityIndex in graphData) {
                    graphData[personalityIndex].personalityClass = analyticsConstants.PERSONALITY_CLASS_MAP_FOR_DONUT_GRAPH[graphData[personalityIndex].name.toLowerCase()];
                    graphData[personalityIndex].donutGraphSize = analyticsConstants.DONUT_GRAPH_SIZE[personalityIndex];
                }
                successCallback({
                    doughnutGraphData: graphData,
                    foundPersonalityScores: true
                });
            }
            else{
                successCallback({
                    doughnutGraphData: graphData,
                    foundPersonalityScores: false
                });
            }
        }, errorCallback);
    }, errorCallback);
};


