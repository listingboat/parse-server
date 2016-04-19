// Provides endpoints for leader board controllers

exports.controllers = function (app) {
    var controller = require('./cloud/apps/leader_board/controller.js'), // explore app controller path
        decorators = require('./cloud/decorators');

    app.get('/leader-board', 'leaderBoard.index', [decorators.loginRequired, decorators.companyExists], controller.leaderBoardController); // route to Overview page of explore app
    app.get('/leader-board/companies/:companyId?', 'leaderBoard.indexWithCompanyId', [decorators.loginRequired, decorators.companyExists], controller.leaderBoardController); // route to Overview page of explore app
    app.post('/leader-board', 'leaderBoard.index', [decorators.loginRequired, decorators.companyExists], controller.leaderBoardController); // route to Overview page of explore app
    app.post('/leader-board/companies/:companyId?', 'leaderBoard.indexWithCompanyId', [decorators.loginRequired, decorators.companyExists], controller.leaderBoardController); // route to Overview page of explore app
};
