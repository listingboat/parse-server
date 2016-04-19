// Provides endpoints for static templates

module.exports = function () {
    var express = require('express'),
        app = express(),
        controller = require('./cloud/apps/ui-statics/controller.js'), // ui-statics app controller path
        app_settings = require('./cloud/app_settings.js'),
        asset_helper = (require('./cloud/asset_helper.js')).asset_helper(),
        env = app_settings.PRODUCTION ? 'production' : 'development';

    asset_helper.registerAssetHelper(app, env); // adding helper for app

    app.set('layout', 'ui-statics/uiStaticLayout');

    app.get('/', controller.staticIndexController); // routes for static templates list page
    app.get('/ui-statics-mypq-connector', controller.staticMyPQConnectorController);
    app.get('/ui-statics-mypq-original', controller.staticMyPQOriginalController);
    app.get('/ui-statics-mypq-dreamer', controller.staticMyPQDreamerController);
    app.get('/ui-statics-mypq-doer', controller.staticMyPQDoerController);
    app.get('/ui-statics-mypq-advisor', controller.staticMyPQAdvisorController);
    app.get('/ui-statics-mypq-organizer', controller.staticMyPQOrganizerController);

    app.get('/quiz-start', controller.staticQuizStart); // routes for static quiz start page
    app.get('/connect-quiz-question', controller.staticConnectQuizQuestion); // routes for static quiz question page
    app.get('/connect-quiz-question-true-false', controller.staticConnectQuizQuestionShortOption); // routes for static quiz question page
    app.get('/identify-quiz-question', controller.staticIdentifyQuizQuestion); // routes for static quiz question page
    app.get('/understand-quiz-question', controller.staticUnderstandQuizQuestion); // routes for static quiz question page
    app.get('/quiz-result', controller.staticQuizResult); // routes for static quiz result page
    app.get('/quiz-question-slide', controller.staticQuizQuestionSlide); // routes for static quiz result page
    app.get('/quiz-question-correct', controller.staticQuizQuestionCorrect); // routes for static quiz result page
    app.get('/quiz-question-wrong', controller.staticQuizQuestionWrong); // routes for static quiz result page
    app.get('/image-quiz-question-portrait', controller.staticImageBasedQuizQuestionPortrait); // routes for image based quiz question page
    app.get('/image-quiz-question-landscape', controller.staticImageBasedQuizQuestionLandscape); // routes for image based quiz question page
    app.get('/audio-quiz-question', controller.staticAudioBasedQuizQuestion); // routes for audio based quiz question page
    app.get('/video-quiz-question', controller.staticVideoBasedQuizQuestion); // routes for video based quiz question page

    app.get('/about-me-organizer', controller.staticAboutMeOrganizerController);
    app.get('/about-me-advisor', controller.staticAboutMeAdvisorController);
    app.get('/about-me-doer', controller.staticAboutMeDoerController);
    app.get('/about-me-dreamer', controller.staticAboutMeDreamerController);
    app.get('/about-me-original', controller.staticAboutMeOriginalController);
    app.get('/about-me-connector', controller.staticAboutMeConnectorController);

    app.get('/explore-overview', controller.staticExploreOverview); // routes for static quiz result page
    app.get('/explore-organizer', controller.staticExploreOrganizer);
    app.get('/explore-advisor', controller.staticExploreAdvisor);
    app.get('/explore-connector', controller.staticExploreConnector);
    app.get('/explore-original', controller.staticExploreOriginal);
    app.get('/explore-dreamer', controller.staticExploreDreamer);
    app.get('/explore-doer', controller.staticExploreDoer);
    app.get('/explore-personality-predictor-1', controller.staticExplorePersonalityPredictor1);
    app.get('/explore-personality-predictor-2', controller.staticExplorePersonalityPredictor2);
    app.get('/explore-personality-predictor-3', controller.staticExplorePersonalityPredictor3);

    app.get('/onboarding-step-one', controller.staticOnboardingStepOneController); // routes for static quiz result page
    app.get('/onboarding-step-two', controller.staticOnboardingStepTwoController); // routes for static quiz result page

    app.get('/assessment-overview', controller.staticAssessmentOverviewController); // routes for static quiz result page
    app.get('/ppi-assessment', controller.staticPPIAssessmentController); // routes for static quiz result page

    app.get('/login-page', controller.staticLoginController); // routes for Login page
    app.get('/register-page', controller.staticRegisterController); // routes for Register page
    app.get('/register-terms-condition-page', controller.staticRegisterTermsConditionController); // routes for Register page
    app.get('/after-login-terms-condition-page', controller.staticAfterLoginTermsConditionController); // routes for Register page
    app.get('/validate-info', controller.staticValidateInfoController); // routes for Register page
    app.get('/join-waitlist', controller.staticJoinWaitlistController); // routes for join waitlist page
    app.get('/join-waitlist-confirm', controller.staticJoinWaitlistConfirmController); // routes for join waitlist page
    app.get('/join-waitlist-confirm-register', controller.staticJoinWaitlistConfirmRegisterController); // routes for join waitlist page
    app.get('/set-new-pwd', controller.staticSetNewPwdController); // routes for join waitlist page

    // Routes for My PQ Public Profile
    app.get('/advisor-public-profile', controller.staticAdvisorPublicProfileController);
    app.get('/doer-public-profile', controller.staticDoerPublicProfileController);
    app.get('/connector-public-profile', controller.staticConnectorPublicProfileController);
    app.get('/original-public-profile', controller.staticOriginalPublicProfileController);
    app.get('/dreamer-public-profile', controller.staticDreamerPublicProfileController);
    app.get('/organizer-public-profile', controller.staticOrganizerPublicProfileController);

    // PQ Modals
    app.get('/doer-public-profile-view', controller.staticDoerPublicProfileViewController);
    app.get('/advisor-public-profile-view', controller.staticAdvisorPublicProfileViewController);
    app.get('/connector-public-profile-view', controller.staticConnectorPublicProfileViewController);
    app.get('/original-public-profile-view', controller.staticOriginalPublicProfileViewController);
    app.get('/dreamer-public-profile-view', controller.staticDreamerPublicProfileViewController);
    app.get('/organizer-public-profile-view', controller.staticOrganizerPublicProfileViewController);

    // WPA Output Pages
    app.get('/pre-baseline-test-profile', controller.staticPreBaselineProfileController);
    app.get('/mypq-locked', controller.staticMyPQLockedController);
    app.get('/mypq-unlocked', controller.staticMyPQUnlockedController);
    app.get('/first-time-quiz', controller.staticFirstTimeQuiz);

    // Error pages routes
    app.get('/404', controller.static404);
    app.get('/500', controller.static500);
    app.get('/site-under-maintenance', controller.staticSiteUnderMaintenanceController);

    // Settings page route
    app.get('/settings', controller.staticSettingsController);
    app.get('/add-department-get-started', controller.staticAddDepartmentGetStartedController);
    app.get('/add-department', controller.staticAddDepartmentController);
    app.get('/add-department-select-trainings', controller.staticSelectTrainingsController);
    app.get('/department-list', controller.staticDepartmentListController);
    app.get('/add-more-department-with-trainings', controller.staticDepartmentSelectTrainingsController);
    app.get('/add-departments-subdivision', controller.staticAddDepartmentsSubdivisionController);
    app.get('/admin-user-settings', controller.staticAdminUserSettingsController);
    app.get('/admin-user-settings-dropdown', controller.staticAdminUserSettingsDropdownController);
    app.get('/add-more-sub-department-with-trainings', controller.staticSubDepartmentSelectTrainingsController);
    app.get('/contest-setup', controller.staticContestSetupController);
    app.get('/contest-setup-error-states', controller.staticContestSetupErrorStatesController);
    app.get('/existing-contest-details', controller.staticExistingContestController);

    //Full Page Loader Controller
    app.get('/full-page-loader', controller.staticFullPageLoaderController);

    //Forget password Email template
    app.get('/forget-password-email', controller.staticForgetPasswordEmailController);
    app.get('/password-recovery-email', controller.staticPasswordRecoveryEmailController);

    //My team page
    app.get('/my-team', controller.staticMyTeamController);
    app.get('/my-team-no-result', controller.staticMyTeamNoResultController);

    //Analytics Page
    app.get('/analytics-admin-view', controller.staticAnalyticsAdminViewController);
    app.get('/analytics-non-call-center-employee-view', controller.staticAnalyticsEmployeeViewNonCallCenterController);
    app.get('/analytics-call-center-employee-view', controller.staticAnalyticsEmployeeViewCallCenterController);
    app.get('/analytics-super-admin-view', controller.staticAnalyticsSuperAdminViewController);
    app.get('/analytics-super-admin-sub-dept-view', controller.staticAnalyticsSuperAdminSubDeptViewController);
    app.get('/analytics-supervisor-team-view', controller.staticAnalyticsSupervisorTeamViewController);
    app.get('/analytics-call-center-employee-view-null-state', controller.staticAnalyticsEmployeeViewCallCenterNullStateController);
    app.get('/analytics-call-center-employee-view-no-data-overlay', controller.staticAnalyticsEmployeeViewCallCenterNoDataOverlayController);

    //Contest Related Pages
    app.get('/rewards-top-pq-banner', controller.staticTopPQBannerController);
    app.get('/rewards-top-pq-growth-banner', controller.staticTopPQGrowthBannerController);
    app.get('/custom-rewards-banner', controller.staticCustomRewardsBannerController);
    app.get('/top-pq-contest-annoucement-email', controller.staticTopPQAnnoucementEmailTemplateController);
    app.get('/top-pq-contest-winner-annoucement-email', controller.staticTopPQWinnerAnnoucementEmailTemplateController);
    app.get('/top-pq-contest-winner-profile-annoucement-email', controller.staticTopPQWinnerProfileAnnoucementEmailTemplateController);
    app.get('/top-pq-growth-contest-annoucement-email', controller.staticTopPQGrowthAnnoucementEmailTemplateController);
    app.get('/custom-contest-annoucement-email', controller.staticCustomContestAnnoucementEmailTemplateController);
    app.get('/contest-rules-page', controller.staticContestRulesPageController);

    //PDF Report related pages
    app.get('/advisor-pq-details-page', controller.staticPdfReportAdvisorPQDetailPageController);
    app.get('/organizer-pq-details-page', controller.staticPdfReportOrganizerPQDetailPageController);
    app.get('/connector-pq-details-page', controller.staticPdfReportConnectorPQDetailPageController);
    app.get('/doer-pq-details-page', controller.staticPdfReportDoerPQDetailPageController);
    app.get('/dreamer-pq-details-page', controller.staticPdfReportDreamerPQDetailPageController);
    app.get('/original-pq-details-page', controller.staticPdfReportOriginalPQDetailPageController);
    app.get('/organizer-pq-personality-matters', controller.staticPdfReportOrganizerPQPersonalityMattersController);
    app.get('/advisor-pq-personality-matters', controller.staticPdfReportAdvisorPQPersonalityMattersController);
    app.get('/connector-pq-personality-matters', controller.staticPdfReportConnectorPQPersonalityMattersController);
    app.get('/doer-pq-personality-matters', controller.staticPdfReportDoerPQPersonalityMattersController);
    app.get('/dreamer-pq-personality-matters', controller.staticPdfReportDreamerPQPersonalityMattersController);
    app.get('/original-pq-personality-matters', controller.staticPdfReportOriginalPQPersonalityMattersController);
    app.get('/north-america-workstyle-distribution', controller.staticPdfReportNorthAmericaWorkstyleDistributionController);
    app.get('/pdf-report-user-detail-page', controller.staticPdfReportUserDetailPageController);
    app.get('/pdf-report-cover-page', controller.staticPdfReportCoverPageController);
    app.get('/print-report-notification', controller.staticPrintReportNotificationEmailController);
    app.get('/advisor-pq-details-cover-page', controller.staticPdfReportAdvisorPQDetailCoverPageController);
    app.get('/advisor-pq-personality-matters-page', controller.staticPdfReportAdvisorPQPersonalityMattersPageController);

    
    //New PQ Pages
    app.get('/ui-statics-mypq-advisor-page', controller.staticMyPQAdvisorPageController);
    app.get('/ui-statics-mypq-connector-page', controller.staticMyPQConnectorPageController);
    app.get('/ui-statics-mypq-doer-page', controller.staticMyPQDoerPageController);
    app.get('/ui-statics-mypq-dreamer-page', controller.staticMyPQDreamerPageController);
    app.get('/ui-statics-mypq-organizer-page', controller.staticMyPQOrganizerPageController);
    app.get('/ui-statics-mypq-original-page', controller.staticMyPQOriginalPageController);
    app.get('/ui-statics-mypq-new-user-page', controller.staticMyPQNewUserPageController);
    
    //Weekly Recap Email template
    app.get('/ui-statics-weekly-email-above-avg', controller.staticWeeklyEmailAboveAvgController);
    app.get('/ui-statics-weekly-email-below-avg', controller.staticWeeklyEmailBelowAvgController);

    return app;
}();
