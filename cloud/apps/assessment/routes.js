// Provides endpoints for explore pages

exports.controllers = function (app) {
    var controller = require('cloud/apps/assessment/controller.js'), // explore app controller path
        decorators = require('cloud/decorators');

    app.get('/assessment/onboarding-1', 'assessment.onBoardingOne', [
        decorators.loginRequired, decorators.assessmentInComplete],  controller.onBoardingStepOneController); // route to Overview page of explore app
    app.get('/assessment/onboarding-2', 'assessment.onBoardingTwo', [
        decorators.loginRequired, decorators.assessmentInComplete],  controller.onBoardingStepTwoController); // route to Overview page of explore app
    app.get('/assessment/intro', 'assessment.intro', [
        decorators.loginRequired,  decorators.assessmentInComplete], controller.introController); // route to Overview page of explore app
    app.get('/assessment/question', 'assessment.question', [
        decorators.loginRequired, decorators.assessmentInComplete], controller.assessmentStartController); // route to Overview page of explore app

    app.get('/assessment/question/next', 'assessment.questionNext', [decorators.loginRequired, decorators.assessmentInComplete, decorators.ajaxRequired], controller.assessmentQuestionNext);
    app.get('/assessment/submit', 'assessment.submitAssessment', [decorators.loginRequired, decorators.assessmentInComplete, decorators.ajaxRequired], controller.submitAssessmentSetResults);
    app.get('/assessment/question/previous', 'assessment.questionPrev', [decorators.loginRequired, decorators.assessmentInComplete, decorators.ajaxRequired], controller.assessmentQuestionPrevious);
    app.get('/assessment/complete', 'assessment.complete', [decorators.loginRequired, decorators.assessmentComplete],
        controller.assessmentCompleteController); // route to Assessment Complete page of assessment app
};
