// Provides endpoints for quiz

exports.controllers = function (app) {
    var controller = require('./cloud/apps/quiz/controller.js'), // quiz app controller path
        decorators = require('./cloud/decorators');

    app.get('/quiz', 'quiz.start', [decorators.loginRequired, decorators.assessmentComplete], controller.quizStartController); // quiz start page
    app.get('/quiz/question', 'quiz.question', [decorators.loginRequired, decorators.assessmentComplete], controller.questionStartController); // start page
    app.get('/quiz/response', 'quiz.response', [decorators.loginRequired, decorators.assessmentComplete, decorators.ajaxRequired], controller.answerValidationController); // validation page
    app.post('/quiz/recalculate-score', 'quiz.recalculateScore', [decorators.loginRequired, decorators.assessmentComplete, decorators.ajaxRequired], controller.recalculateScoreController); // score recalculate
    app.get('/quiz/result', 'quiz.result', [decorators.loginRequired, decorators.assessmentComplete], controller.quizResultController);
    app.get('/quiz/question/next', 'quiz.nextQues', [decorators.loginRequired, decorators.ajaxRequired, decorators.assessmentComplete], controller.questionNextController);
};
