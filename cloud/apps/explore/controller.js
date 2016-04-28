
var userConstants = require('cloud/apps/user/constants.js'),
    exploreConstants = require('cloud/apps/explore/constants');
// All controllers for explore app

// renders explore page(s)
exports.exploreOverviewController = function(req, res) {
    res.render('explore/overview.ejs', {
        explore: true,  // make 'Explore' active in main header
        overview_page: true, // make 'Overview' active in Explore header
        video_url: exploreConstants.EXPLORE_VIDEO_URL['overview']
    });
};

// renders Organizer personality page
exports.exploreOrganizerController = function(req, res) {
    res.render('explore/organizer.ejs', {
        explore: true,  // make 'Explore' active in main header
        organizer_page: true,    // make 'Organizer' active in Explore header
        personality_banner_class: userConstants.PERSONALITY_CLASS_MAP['organizer'],    // to be used as css class
        personality_type_slide: 'organizer-slideshow',  // to be used as css class
        video_url: exploreConstants.EXPLORE_VIDEO_URL['organizer']
    });
};

// renders Connector personality page
exports.exploreConnectorController = function(req, res) {
    res.render('explore/connector.ejs', {
        explore: true,  // make 'Explore' active in main header
        connector_page: true,    // make 'Connector' active in Explore header
        personality_banner_class: userConstants.PERSONALITY_CLASS_MAP['connector'],    // to be used as css class
        personality_type_slide: 'connector-slideshow',  // to be used as css class
        video_url: exploreConstants.EXPLORE_VIDEO_URL['connector']
    });
};

// renders Original personality page
exports.exploreOriginalController = function(req, res) {
    res.render('explore/original.ejs', {
        explore: true,  // make 'Explore' active in main header
        original_page: true,    // make 'Original' active in Explore header
        personality_banner_class: userConstants.PERSONALITY_CLASS_MAP['original'],    // to be used as css class
        personality_type_slide: 'original-slideshow',  // to be used as css class
        video_url: exploreConstants.EXPLORE_VIDEO_URL['original']
    });
};

// renders Doer personality page
exports.exploreDoerController = function(req, res) {
    res.render('explore/doer.ejs', {
        explore: true,  // make 'Explore' active in main header
        doer_page: true,    // make 'Doer' active in Explore header
        personality_banner_class: userConstants.PERSONALITY_CLASS_MAP['doer'],    // to be used as css class
        personality_type_slide: 'doer-slideshow',  // to be used as css class
        video_url: exploreConstants.EXPLORE_VIDEO_URL['doer']
    });
};

// renders Advisor personality page
exports.exploreAdvisorController = function(req, res) {
    res.render('explore/advisor.ejs', {
        explore: true,  // make 'Explore' active in main header
        advisor_page: true,    // make 'Advisor' active in Explore header
        personality_banner_class: userConstants.PERSONALITY_CLASS_MAP['advisor'],    // to be used as css class
        personality_type_slide: 'advisor-slideshow',  // to be used as css class
        video_url: exploreConstants.EXPLORE_VIDEO_URL['advisor']
    });
};

// renders Dreamer personality page
exports.exploreDreamerController = function(req, res) {
    res.render('explore/dreamer.ejs', {
        explore: true,  // make 'Explore' active in main header
        dreamer_page: true,    // make 'Dreamer' active in Explore header
        personality_banner_class: userConstants.PERSONALITY_CLASS_MAP['dreamer'],    // to be used as css class
        personality_type_slide: 'dreamer-slideshow',  // to be used as css class
        video_url: exploreConstants.EXPLORE_VIDEO_URL['dreamer']
    });
};

// renders personality predictor pages
exports.startPersonalityPredictorController = function(req, res) {
    res.render('explore/personality_predictor_start.ejs', {
        apply: true, // makes explore tab in menu active
        predictor_page: true // makes predictor tab in explore menu active
    });
};

// renders personality first question page with all questions
exports.personalityPredictorQuestionsController = function(req, res) {
    var PersonalityPredictorQuestion = Parse.Object.extend('Personality_Predictor_Question'),
        errorCallback = req.errorCallback,
        questionQuery = new Parse.Query(PersonalityPredictorQuestion);
    var questionsObject = {
        initial: {},
        type_a: [{}, {}, {}],
        type_b: [{}, {}, {}]
    };
    questionQuery.find({
        success: function (questions) {
            for(var index in questions){
                var question = questions[index],
                    questionType = question.get('type');
                if(questionType == 'initial') {
                    questionsObject[questionType].question_text = question.get('question_text');
                    questionsObject[questionType].option_a = question.get('option_a');
                    questionsObject[questionType].option_b = question.get('option_b');
                }
                else{
                    var questionIndex = question.get('index') - 1;
                    questionsObject[questionType][questionIndex].question_text = question.get('question_text');
                    questionsObject[questionType][questionIndex].option_a = question.get('option_a');
                    questionsObject[questionType][questionIndex].option_b = question.get('option_b');
                    questionsObject[questionType][questionIndex].option_c = question.get('option_c') || '';
                }
            }
            res.render('explore/_personality_predictor_questions_content', {
                layout: 'layout_partial',
                apply: true, // makes explore tab in menu active
                predictor_page: true, // makes predictor tab in explore menu active
                questionsObject: questionsObject
            });
        },
        error: errorCallback
    });
};

exports.personalityPredictorResult = function(req, res){
    var personality = req.query.personality;
    res.render('explore/_personality_predictor_result', {
        layout: 'layout_partial',
        apply: true, // makes explore tab in menu active
        predictor_page: true, // makes predictor tab in explore menu active
        headerWrapClass: userConstants.PERSONALITY_CLASS_MAP[personality], // controls header background and color
        superPowerTextImage: userConstants.SUPERPOWER_TAGLINE_MAP[personality],
        learnMoreLink: req.app.namedRoutes.build(userConstants.LEARN_MORE_PERSONALITY_URL_NAME_MAP[personality]),
        learnMoreText: 'LEARN MORE ABOUT ' + personality.toUpperCase() + 'S'
    });
};
