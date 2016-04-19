// Provides endpoints for user

exports.controllers = function (app) {
    var controller = require('./cloud/apps/user/controller.js'), // user app controller path
        decorators = require('./cloud/decorators');

    app.get('/', 'user.home', controller.homeController);
    app.get('/forgot-password', 'user.forgotPassword', controller.forgotPasswordController);
    app.get('/user-management-html', 'user.userManagementHtml', controller.userManagementHtml);
    app.get('/set-forgot-password', 'user.setForgotPassword', controller.setForgotPassword);
    app.get('/forgot-password-reset-success', 'user.forgotPasswordResetSuccessController', controller.forgotPasswordResetSuccessController);
    app.get('/register', 'user.register', controller.registerController); // routes for rendering register page
    app.get('/migrate-user', 'user.migrate', [decorators.loginRequired], controller.migrateUserController); // routes for rendering register page
    app.get('/join-waitlist', 'user.joinWaitList', controller.joinWaitListController); // routes for rendering register page
    app.post('/join-waitlist', 'user.joinWaitList', controller.joinWaitListController); // routes for rendering register page
    app.post('/register', 'user.register', decorators.ajaxRequired, controller.registerController); // routes for fetching register detail
    app.get('/sign-in', 'user.auth', controller.authController);
    app.post('/sign-in', 'user.signIn', controller.signInController); // route for signing in
    app.post('/get-departments', 'user.getDepartments', controller.getDepartmentController); // route for signing in
    app.post('/update-pardot-prospect', 'user.makePardotCall', controller.makePardotCallForUser); // route for signing in
    app.get('/update-last-activity', 'user.updateLastActivity',decorators.loginRequired ,controller.updateUserLastActivityController); // route for updating last activity for user prospect at pardot
    app.post('/get-user-responses', 'user.getUserResponses',decorators.loginRequired ,controller.getUserResponsesController); // route for getting user response batch
    app.post('/recalculate-cache-table', 'user.recalculateCacheTable',decorators.loginRequired ,controller.recalculateCacheTableScoresController); // route for recalculating cache table data
    app.get('/sign-out', 'user.signOut', controller.signOutController); // route for signing out
    app.get('/play', 'user.myPQ', [decorators.loginRequired, decorators.assessmentComplete], controller.myPQController); // route for my pq page
    app.get('/my-pq', 'user.oldMyPQ', [decorators.loginRequired, decorators.assessmentComplete], controller.myPQController); // route for my pq page
    app.get('/my-pq/:id', 'user.myPQPublic', controller.publicMyPQController); // routes for public profile page
    app.get('/explore/my-report', 'user.myReport', [decorators.loginRequired, decorators.assessmentComplete], controller.aboutMeController); // routes for about me page
    app.get('/pdf-report', 'user.pdfReport', [decorators.loginRequired, decorators.ajaxRequired], controller.getPdfReportController); // routes for pdf report
    app.get('/about-me', 'user.oldMyReport', [decorators.loginRequired, decorators.assessmentComplete], controller.aboutMeController); // routes for about me page
    app.get('/user/:id/persona', 'user.smallEmailSignature', controller.smallEmailSignatureController); // routes for email signature badges
    app.get('/terms-conditions', 'user.termsConditions', controller.termsConditionsController); // routes for terms and conditions page
    app.get('/privacy-policy', 'user.privacyPolicy', controller.privacyPolicyController); // routes for privacy policy page
    app.get('/user/:id/badge-without-pq', 'user.badgeWithoutPQ', controller.withoutPQBadgeController); // route to render badge without pq
    app.get('/user/:id/badge-gif', 'user.badgeGif', controller.badgeGifController); // route to render badge gif
    app.get('/account-terms', 'user.accountTerms', decorators.loginRequired, controller.accountTermsController); // route to render account terms accept or decline page
    app.post('/account-terms', 'user.accountTerms', decorators.loginRequired, controller.accountTermsResponseController); // route to send response of account terms accept or decline
    app.get('/fix-pbr-request', 'user.fixPbrRequest', decorators.loginRequired, controller.sendFixPbrMailController); // route to make fix pbr data request
};
