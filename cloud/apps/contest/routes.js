// Provides endpoints for user

exports.controllers = function (app) {
    var controller = require('./cloud/apps/contest/controller.js'), // user app controller path
        decorators = require('./cloud/decorators');

    app.get('/contest', 'contest.contestPage', [decorators.loginRequired, decorators.superAdminRequired], controller.contestPageController); // routes to render contest page with company list
    app.post('/contest/get-company-contest', 'contest.getCompanyContest', [decorators.loginRequired, decorators.superAdminRequired], controller.getCompanyContestController); // route to get current running contest detail or new contest form
    app.post('/contest/create-new-contest', 'contest.createNewContest', [decorators.loginRequired, decorators.superAdminRequired], controller.createNewContestController); // routes to create new contest
    app.post('/contest/delete-contest', 'contest.deleteContest', [decorators.loginRequired, decorators.superAdminRequired], controller.cancelContestController); // routes delete a contest
    app.post('/contest/send-contest-start-mail', 'contest.sendContestStartMailController', [decorators.loginRequired, decorators.superAdminRequired], controller.sendContestStartMailController); // routes to send contest announcement mail
    app.get('/contest/get-contest', 'contest.getContest', [decorators.loginRequired], controller.checkCompanyContestAndShowBannerController); // route for fetching running contest for a company
    app.get('/contest-rules', 'contestRules', controller.contestRulesPageController);
};
