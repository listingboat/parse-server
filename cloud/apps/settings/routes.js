// Provides endpoints for user

exports.controllers = function (app) {
    var controller = require('cloud/apps/settings/controller.js'), // user app controller path
        decorators = require('cloud/decorators');

    app.get('/settings/account', 'settings.account', [decorators.loginRequired], controller.accountSettingsController); // routes for Get request on  user account settings
    app.post('/settings/account', 'settings.account', [decorators.loginRequired], controller.accountSettingUpdateController); // routes for Post request on user account settings
    // TODO: re add this router when change password functionality is implemented
    app.get('/settings/password', 'settings.password', [decorators.loginRequired], controller.passwordSettingsController); // routes for user password settings
    app.post('/settings/password', 'settings.password', [decorators.loginRequired], controller.passwordChangeSettingsController); // routes for user password settings
    app.get('/settings/faq', 'settings.faq', [decorators.loginRequired], controller.faqController); // routes for user password settings
    app.get('/settings/invite', 'settings.invite', [decorators.loginRequired], controller.inviteSettingsController); // routes for user invite settings
    app.post('/settings/send-invite', 'settings.sendInvite', [decorators.loginRequired, decorators.adminRequired], controller.sendInviteController); // routes for user invite settings
    app.post('/settings/invite-friend', 'settings.inviteFriend', [decorators.loginRequired], controller.inviteFriendController); // routes to add friend in invite list
    app.post('/settings/add-invitee-in-pardot', 'settings.addInviteeInPardot', [decorators.loginRequired, decorators.adminRequired], controller.addInviteeInPardotController); // routes for adding new invited users in pardot
};

