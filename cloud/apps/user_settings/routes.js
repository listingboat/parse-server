// Provides endpoints for user

exports.controllers = function (app) {
    var controller = require('./cloud/apps/user_settings/controller.js'), // user app controller path
        decorators = require('./cloud/decorators');

    app.get('/user-management', 'userSettings.index', [decorators.loginRequired, decorators.adminRequired], controller.getUserSettingsPageController);
    app.get('/user-management/companies/:companyId?', 'userSettings.indexWithCompanyId', [decorators.loginRequired, decorators.adminRequired], controller.getUserSettingsPageController);
    app.post('/user-management', 'userSettings.index', [decorators.loginRequired, decorators.adminRequired], controller.getUserSettingsPageController);
    app.post('/user-management/companies/:companyId?', 'userSettings.indexWithCompanyId', [decorators.loginRequired, decorators.adminRequired], controller.getUserSettingsPageController);
    app.get('/invited-user-management', 'userSettings.invitedUsers', [decorators.loginRequired, decorators.adminRequired], controller.getInvitedUserSettingsPageController);
    app.post('/invited-user-management', 'userSettings.invitedUsers', [decorators.loginRequired, decorators.adminRequired], controller.getInvitedUserSettingsPageController);
    app.get('/invited-user-management/companies/:companyId?', 'userSettings.invitedUsersWithCompanyId', [decorators.loginRequired, decorators.adminRequired], controller.getInvitedUserSettingsPageController);
    app.post('/invited-user-management/companies/:companyId?', 'userSettings.invitedUsersWithCompanyId', [decorators.loginRequired, decorators.adminRequired], controller.getInvitedUserSettingsPageController);
    app.post('/change-department', 'userSettings.changeDepartment', [decorators.loginRequired, decorators.adminRequired], controller.changeUserDepartmentController);
    app.post('/change-permission-type', 'userSettings.changePermissionType', [decorators.loginRequired, decorators.adminRequired], controller.changePermissionTypeController);
    app.post('/delete-user', 'userSettings.deleteUser', [decorators.loginRequired, decorators.adminRequired], controller.deleteUserController);  // route to delete user
    app.post('/send-invite-reminder', 'userSettings.sendInviteReminder', [decorators.loginRequired, decorators.adminRequired], controller.sendInviteReminderController);
    app.post('/remove-invited-user', 'userSettings.removeInvitedUser', [decorators.loginRequired, decorators.adminRequired], controller.removeInvitedUserController);
    app.get('/remove-invited-user-prospect', 'userSettings.deleteInvitedUserProspect', [decorators.loginRequired, decorators.adminRequired], controller.deleteInvitedUserFromPardotLists);
    app.get('/delete-user-prospect', 'userSettings.deleteUserProspect', [decorators.loginRequired, decorators.adminRequired], controller.deletePardotProspectFromLists);  // route to delete user
    app.post("/user-management/edit-user", "userSettings.editUserDetail", [decorators.loginRequired, decorators.adminRequired], controller.editUserDetailController);  // rout to edit user detail
};
