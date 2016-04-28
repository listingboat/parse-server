// Provides endpoints for user

exports.controllers = function (app) {
    var controller = require('cloud/apps/company/controller.js'), // user app controller path
        decorators = require('cloud/decorators');

    app.get('/company/departments', 'company.department', [decorators.loginRequired, decorators.adminRequired, decorators.companyExists], controller.companyDepartmentSettingController); // routes for edit department page
    app.get('/company/get-department-setting-page', 'company.getDepartmentSettingPage', [decorators.loginRequired, decorators.adminRequired, decorators.companyExists], controller.superAdminDepartmentSettingsController); // routes for edit department page
    app.post('/company/add-new-department', 'company.addNewCompanyDepartment', [decorators.loginRequired, decorators.adminRequired, decorators.companyExists], controller.addNewDepartmentController); // routes for adding new departments
    //app.post('/company/remove-department', 'company.removeCompanyDepartment', [decorators.loginRequired, decorators.adminRequired, decorators.companyExists], controller.removeDepartmentController); // routes for deleting departments
    app.post('/company/add-department-question-type-relation', 'company.addDepartmentQuestionTypeRelation', [decorators.loginRequired, decorators.adminRequired, decorators.companyExists], controller.addQuestionTypeInDepartmentController); // routes for adding question type in department
    app.post('/company/remove-department-question-type-relation', 'company.removeDepartmentQuestionTypeRelation', [decorators.loginRequired, decorators.adminRequired, decorators.companyExists], controller.removeQuestionTypeInDepartmentController); // routes for removing question type in department
    app.post('/company/initial-department-setup', 'company.initialDepartmentSetup', [decorators.loginRequired, decorators.adminRequired, decorators.companyExists], controller.initialDepartmentSetupController); // routes for initial department setup
    app.post('/company/add-new-company', 'company.addNewCompany', [decorators.loginRequired, decorators.superAdminRequired], controller.addNewCompanyController); // route to controller for adding new company
    app.get('/company/add-pardot-list-to-company', 'company.addPardotListToCompany', [decorators.loginRequired, decorators.superAdminRequired], controller.addPardotListToCompanyController); // route for controller creating pardot list for company if missing
};
