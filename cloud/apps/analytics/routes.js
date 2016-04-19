// Provides endpoints for analytics controllers

exports.controllers = function (app) {
    var controller = require('./cloud/apps/analytics/controller.js'), // analytics app controller path
        decorators = require('./cloud/decorators');

    app.get('/analytics/user-analytics', 'analytics.userAnalytics', [decorators.loginRequired, decorators.companyExists], controller.userAnalyticsController); // route to send user analytics page
    app.get('/analytics/account-owner-analytics', 'analytics.accountOwnerAnalytics', [decorators.loginRequired, decorators.companyExists], controller.accountOwnerAnalyticsController); // route to send user analytics page
    app.get('/analytics/account-owner-analytics/companies/:companyId?', 'analytics.accountOwnerAnalyticsWithCompanyId', [decorators.loginRequired, decorators.companyExists], controller.accountOwnerAnalyticsController); // route to send user analytics page
    app.get('/analytics/supervisor-analytics', 'analytics.supervisorAnalytics', [decorators.loginRequired, decorators.companyExists], controller.supervisorAnalyticsController); // route to send user analytics page
    app.get('/analytics/supervisor-analytics/departments/:departmentId?', 'analytics.supervisorAnalyticsWithDepartmentId', [decorators.loginRequired, decorators.companyExists], controller.supervisorAnalyticsController); // route to send user analytics page
    app.get('/analytics/department-employees', 'analytics.fetchEmployeesController', [decorators.loginRequired, decorators.companyExists], controller.fetchEmployeesController); // route to send user analytics page
    app.get('/analytics/department-analytics-data', 'analytics.departmentAnalyticsData', [decorators.loginRequired, decorators.companyExists], controller.departmentAnalyticsGraphDataController); // route to send user analytics page
};
