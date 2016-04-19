// Provides endpoints for explore pages

exports.controllers = function (app) {
    var controller = require('./cloud/apps/explore/controller.js'), // explore app controller path
        decorators = require('./cloud/decorators');

    app.get('/explore/overview', 'explore.overview', decorators.loginRequired, controller.exploreOverviewController); // route to Overview page of explore app
    app.get('/explore/organizer', 'explore.organizer', decorators.loginRequired, controller.exploreOrganizerController);  // route to Organizer Personality page
    app.get('/explore/connector', 'explore.connector', decorators.loginRequired, controller.exploreConnectorController);  // route to Connector Personality page
    app.get('/explore/original', 'explore.original', decorators.loginRequired, controller.exploreOriginalController); // route to Original Personality page
    app.get('/explore/doer', 'explore.doer', decorators.loginRequired, controller.exploreDoerController); // route to Doer Personality page
    app.get('/explore/advisor', 'explore.advisor', decorators.loginRequired, controller.exploreAdvisorController);    // route to Advisor Personality page
    app.get('/explore/dreamer', 'explore.dreamer', decorators.loginRequired, controller.exploreDreamerController);    // route to Dreamer Personality page
    app.get('/apply/personality-predictor', 'explore.personalityPredictor', decorators.loginRequired, controller.startPersonalityPredictorController);  // route for personality predictor start page
    app.get('/explore/personality-predictor', 'explore.oldPersonalityPredictor', decorators.loginRequired, controller.startPersonalityPredictorController);  // route for personality predictor start page
    app.get('/apply/personality-predictor-questions', 'explore.personalityPredictorQuestions',
        [decorators.loginRequired, decorators.ajaxRequired], controller.personalityPredictorQuestionsController);  // route for personality predictor questions page
    app.get('/explore/personality-predictor-questions', 'explore.oldPersonalityPredictorQuestions',
        [decorators.loginRequired, decorators.ajaxRequired], controller.personalityPredictorQuestionsController);  // route for personality predictor questions page
    app.get('/apply/personality-predictor-result', 'explore.personalityPredictorResult',
        [decorators.loginRequired, decorators.ajaxRequired], controller.personalityPredictorResult);  // route for personality predictor start page
    app.get('/explore/personality-predictor-result', 'explore.oldPersonalityPredictorResult',
        [decorators.loginRequired, decorators.ajaxRequired], controller.personalityPredictorResult);  // route for personality predictor start page
};
