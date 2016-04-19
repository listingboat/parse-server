// All controllers for UI statics app

// static template controllers
exports.staticIndexController = function(req, res) {
    res.render('ui-statics/index.ejs');
};

exports.staticMyPQConnectorController = function(req, res) {
    res.render('ui-statics/ui_statics_mypq_connector.ejs', {
        my_pq: true,
        extra_class: 'transparent'
    });
};

exports.staticMyPQOriginalController = function(req, res) {
    res.render('ui-statics/ui_statics_mypq_original.ejs', {
        my_pq: true,
        extra_class: 'transparent'
    });
};

exports.staticMyPQDreamerController = function(req, res) {
    res.render('ui-statics/ui_statics_mypq_dreamer.ejs', {
        my_pq: true,
        extra_class: 'transparent'
    });
};

exports.staticMyPQDoerController = function(req, res) {
    res.render('ui-statics/ui_statics_mypq_doer.ejs', {
        my_pq: true,
    	extra_class: 'transparent'
    });
};

exports.staticMyPQAdvisorController = function(req, res) {
    res.render('ui-statics/ui_statics_mypq_advisor.ejs', {
        my_pq: true,
    	extra_class: 'transparent'
    });
};

exports.staticMyPQOrganizerController = function(req, res) {
    res.render('ui-statics/ui_statics_mypq_organizer.ejs', {
        my_pq: true,
    	extra_class: 'transparent'
    });
};

exports.staticQuizStart = function(req, res) {
    res.render('ui-statics/ui_statics_quiz_start.ejs', {
        has_footer: false,
        quest_quiz: true,
        extra_class: 'transparent',
        skill_type_class: 'skill-connect'
    });
};

exports.staticConnectQuizQuestion = function(req, res) {
    res.render('ui-statics/ui_statics_connect_quiz_question.ejs', {
        has_footer: false,
        quest_quiz: true,
        extra_class: 'transparent',
        skill_type_class: 'skill-connect'
    });
};

exports.staticConnectQuizQuestionShortOption = function(req, res) {
    res.render('ui-statics/ui_statics_connect_quiz_question_short_option.ejs', {
        has_footer: false,
        quest_quiz: true,
        extra_class: 'transparent',
        skill_type_class: 'skill-connect'
    });
};

exports.staticIdentifyQuizQuestion = function(req, res) {
    res.render('ui-statics/ui_statics_identify_quiz_question.ejs', {
        has_footer: false,
        quest_quiz: true,
        extra_class: 'transparent',
        skill_type_class: 'skill-identify'
    });
};

exports.staticUnderstandQuizQuestion = function(req, res) {
    res.render('ui-statics/ui_statics_understand_quiz_question.ejs', {
        has_footer: false,
        quest_quiz: true,
        extra_class: 'transparent',
        skill_type_class: 'skill-understand'
    });
};

exports.staticQuizResult = function(req, res) {
    res.render('ui-statics/ui_statics_quiz_result.ejs', {
        has_footer: false,
        quest_quiz: true,
        extra_class: 'transparent',
        skill_type_class: 'skill-identify'
    });
};

exports.staticQuizQuestionSlide = function(req, res) {
    res.render('ui-statics/ui_statics_quiz_question_slide.ejs', {
        has_footer: false,
        quest_quiz: true,
        extra_class: 'transparent',
        skill_type_class: 'skill-connect'
    });
};

exports.staticQuizQuestionCorrect = function(req, res) {
    res.render('ui-statics/ui_statics_quiz_question_correct.ejs', {
        has_footer: false,
        quest_quiz: true,
        extra_class: 'transparent',
        skill_type_class: 'skill-connect'
    });
};

exports.staticQuizQuestionWrong = function(req, res) {
    res.render('ui-statics/ui_statics_quiz_question_wrong.ejs', {
        has_footer: false,
        quest_quiz: true,
        extra_class: 'transparent',
        skill_type_class: 'skill-connect'
    });
};

exports.staticImageBasedQuizQuestionLandscape = function(req, res) {
    res.render('ui-statics/ui_statics_image_based_quiz_question_landscape.ejs', {
        has_footer: false,
        quest_quiz: true,
        extra_class: 'transparent',
        skill_type_class: 'skill-connect'
    });
};

exports.staticImageBasedQuizQuestionPortrait = function(req, res) {
    res.render('ui-statics/ui_statics_image_based_quiz_question_portrait.ejs', {
        has_footer: false,
        quest_quiz: true,
        extra_class: 'transparent',
        skill_type_class: 'skill-connect'
    });
};

exports.staticAudioBasedQuizQuestion = function(req, res) {
    res.render('ui-statics/ui_statics_audio_based_quiz_question.ejs', {
        has_footer: false,
        quest_quiz: true,
        extra_class: 'transparent',
        skill_type_class: 'skill-connect'
    });
};

exports.staticVideoBasedQuizQuestion = function(req, res) {
    res.render('ui-statics/ui_statics_video_based_quiz_question.ejs', {
        has_footer: false,
        quest_quiz: true,
        extra_class: 'transparent',
        skill_type_class: 'skill-connect'
    });
};

//About me pages
exports.staticAboutMeOrganizerController = function(req, res) {
    res.render('ui-statics/about_me_organizer.ejs', {
        has_footer: false,
        about_me: true
    });
};

exports.staticAboutMeAdvisorController = function(req, res) {
    res.render('ui-statics/about_me_advisor.ejs', {
        has_footer: false,
        about_me: true
    });
};

exports.staticAboutMeDoerController = function(req, res) {
    res.render('ui-statics/about_me_doer.ejs', {
        has_footer: false,
        about_me: true
    });
};

exports.staticAboutMeDreamerController = function(req, res) {
    res.render('ui-statics/about_me_dreamer.ejs', {
        has_footer: false,
        about_me: true
    });
};

exports.staticAboutMeOriginalController = function(req, res) {
    res.render('ui-statics/about_me_original.ejs', {
        has_footer: false,
        about_me: true
    });
};

exports.staticAboutMeConnectorController = function(req, res) {
    res.render('ui-statics/about_me_connector.ejs', {
        has_footer: false,
        about_me: true
    });
};

// Explore pages Controller
exports.staticExploreOverview = function(req, res) {
    res.render('ui-statics/ui_statics_explore_overview.ejs', {
        explore: true,
        overview_page: true
    });
};

exports.staticExploreOrganizer = function(req, res) {
    res.render('ui-statics/ui_statics_explore_organizer_pq.ejs', {
        explore: true,
        organizer_page: true,
        personality_banner_class: 'organizer-wrap',
        personality_type_slide: 'organizer-slideshow'
    });
};

exports.staticExploreAdvisor = function(req, res) {
    res.render('ui-statics/ui_statics_explore_advisor_pq.ejs', {
        explore: true,
        advisor_page: true,
        personality_banner_class: 'advisor-wrap',
        personality_type_slide: 'advisor-slideshow'
    });
};

exports.staticExploreConnector = function(req, res) {
    res.render('ui-statics/ui_statics_explore_connector_pq.ejs', {
        explore: true,
        connector_page: true,
        personality_banner_class: 'connector-wrap',
        personality_type_slide: 'connector-slideshow'
    });
};

exports.staticExploreOriginal = function(req, res) {
    res.render('ui-statics/ui_statics_explore_original_pq.ejs', {
        explore: true,
        original_page: true,
        personality_banner_class: 'original-wrap',
        personality_type_slide: 'original-slideshow'
    });
};

exports.staticExploreDoer = function(req, res) {
    res.render('ui-statics/ui_statics_explore_doer_pq.ejs', {
        explore: true,
        doer_page: true,
        personality_banner_class: 'doer-wrap',
        personality_type_slide: 'doer-slideshow'
    });
};

exports.staticExploreDreamer = function(req, res) {
    res.render('ui-statics/ui_statics_explore_dreamer_pq.ejs', {
        explore: true,
        dreamer_page: true,
        personality_banner_class: 'dreamer-wrap',
        personality_type_slide: 'dreamer-slideshow'
    });
};

exports.staticExplorePersonalityPredictor1 = function(req, res) {
    res.render('ui-statics/ui_statics_explore_personality_predictor1.ejs', {
        explore: true,
        predictor_page: true
    });
};

exports.staticExplorePersonalityPredictor2 = function(req, res) {
    res.render('ui-statics/ui_statics_explore_personality_predictor2.ejs', {
        explore: true,
        predictor_page: true
    });
};

exports.staticExplorePersonalityPredictor3 = function(req, res) {
    res.render('ui-statics/ui_statics_explore_personality_predictor3.ejs', {
        explore: true,
        predictor_page: true
    });
};

//onboarding flow controller
exports.staticOnboardingStepOneController = function(req, res) {
    res.render('ui-statics/ui_statics_onboarding_step_one.ejs', {
        has_footer: false,
        extra_class: 'transparent',
        nav_items: false
    });
};

exports.staticOnboardingStepTwoController = function(req, res) {
    res.render('ui-statics/ui_statics_onboarding_step_two.ejs', {
        has_footer: false,
        extra_class: 'transparent',
        nav_items: false
    });
};

// Assessment pages controller
exports.staticAssessmentOverviewController = function(req, res) {
    res.render('ui-statics/ui_statics_assessment_overview.ejs', {
        has_footer: false,
        extra_class: 'transparent',
        nav_items: false
    });
};

exports.staticPPIAssessmentController = function(req, res) {
    res.render('ui-statics/ui_statics_ppi_assessment.ejs', {
        has_footer: false,
        extra_class: 'transparent',
        nav_items: false
    });
}

//login page controller
exports.staticLoginController = function(req, res) {
    res.render('ui-statics/ui_statics_login.ejs', {
        header_footer: false
    });
};

exports.staticRegisterController = function(req, res) {
    res.render('ui-statics/ui_statics_register.ejs', {
        header_footer: false
    });
};

exports.staticRegisterTermsConditionController = function(req, res) {
    res.render('ui-statics/ui_statics_register_terms_condition.ejs', {
        header_footer: false
    });
};

exports.staticAfterLoginTermsConditionController = function(req, res) {
    res.render('ui-statics/ui_statics_after_login_terms_condition.ejs', {
        header_footer: false
    });
};

exports.staticValidateInfoController = function(req, res) {
    res.render('ui-statics/ui_statics_validate_info.ejs', {
        header_footer: false
    });
};

exports.staticJoinWaitlistController = function(req, res) {
    res.render('ui-statics/ui_statics_join_waitlist.ejs', {
        header_footer: false
    });
};

exports.staticJoinWaitlistConfirmController = function(req, res) {
    res.render('ui-statics/ui_statics_join_waitlist_confirm.ejs', {
        header_footer: false
    });
};

exports.staticJoinWaitlistConfirmRegisterController = function(req, res) {
    res.render('ui-statics/ui_statics_join_waitlist_confirm_register.ejs', {
        header_footer: false
    });
};

exports.staticSetNewPwdController = function(req, res) {
    res.render('ui-statics/ui_statics_set_new_pwd.ejs');
};

//PQ Pages : Public Profile Controller ui_statics_mypq_advisor_public_profile.ejs
exports.staticAdvisorPublicProfileController = function(req, res) {
    res.render('ui-statics/ui_statics_mypq_advisor_public_profile.ejs', {
        my_pq: true,
        extra_class: 'transparent'
    });
};

exports.staticDoerPublicProfileController = function(req, res) {
    res.render('ui-statics/ui_statics_mypq_doer_public_profile.ejs', {
        my_pq: true,
        extra_class: 'transparent'
    });
};

exports.staticConnectorPublicProfileController = function(req, res) {
    res.render('ui-statics/ui_statics_mypq_connector_public_profile.ejs', {
        my_pq: true,
        extra_class: 'transparent'
    });
};

exports.staticOriginalPublicProfileController = function(req, res) {
    res.render('ui-statics/ui_statics_mypq_original_public_profile.ejs', {
        my_pq: true,
        extra_class: 'transparent'
    });
};

exports.staticDreamerPublicProfileController = function(req, res) {
    res.render('ui-statics/ui_statics_mypq_dreamer_public_profile.ejs', {
        my_pq: true,
        extra_class: 'transparent'
    });
};

exports.staticOrganizerPublicProfileController = function(req, res) {
    res.render('ui-statics/ui_statics_mypq_organizer_public_profile.ejs', {
        my_pq: true,
        extra_class: 'transparent'
    });
};

//PQ Public Profile View
exports.staticDoerPublicProfileViewController = function(req, res) {
    res.render('ui-statics/ui_statics_pq_doer_public_profile_view.ejs', {
        my_pq: true,
        nav_items: false,
        extra_class: 'transparent'
    });
};

exports.staticAdvisorPublicProfileViewController = function(req, res) {
    res.render('ui-statics/ui_statics_pq_advisor_public_profile_view.ejs', {
        my_pq: true,
        nav_items: false,
        extra_class: 'transparent'
    });
};

exports.staticConnectorPublicProfileViewController = function(req, res) {
    res.render('ui-statics/ui_statics_pq_connector_public_profile_view.ejs', {
        my_pq: true,
        nav_items: false,
        extra_class: 'transparent'
    });
};

exports.staticOriginalPublicProfileViewController = function(req, res) {
    res.render('ui-statics/ui_statics_pq_original_public_profile_view.ejs', {
        my_pq: true,
        nav_items: false,
        extra_class: 'transparent'
    });
};

exports.staticDreamerPublicProfileViewController = function(req, res) {
    res.render('ui-statics/ui_statics_pq_dreamer_public_profile_view.ejs', {
        my_pq: true,
        nav_items: false,
        extra_class: 'transparent'
    });
};

exports.staticOrganizerPublicProfileViewController = function(req, res) {
    res.render('ui-statics/ui_statics_pq_organizer_public_profile_view.ejs', {
        my_pq: true,
        nav_items: false,
        extra_class: 'transparent'
    });
};

// WPA Output Pages Controller
exports.staticPreBaselineProfileController = function(req, res) {
    res.render('ui-statics/ui_statics_pre_baseline_test_profile.ejs', {
        my_pq: true,
        nav_items: false,
        extra_class: 'transparent'
    });
};

exports.staticMyPQLockedController = function(req, res) {
    res.render('ui-statics/ui_statics_mypq_locked.ejs', {
        my_pq: true,
        extra_class: 'transparent'
    });
};

exports.staticMyPQUnlockedController = function(req, res) {
    res.render('ui-statics/ui_statics_profile_unlocked.ejs', {
        has_footer: false,
        my_pq: true,
        skill_type_class: 'skill-connect',
        extra_class: 'transparent'
    });
};

// Error pages controller
exports.static404 = function(req, res) {
    res.render('ui-statics/ui_statics_404.ejs', {
        header_footer: false
    });
};

exports.static500 = function(req, res) {
    res.render('ui-statics/ui_statics_500.ejs', {
        header_footer: false
    });
};

// Settings page controller
exports.staticSettingsController = function(req, res) {
    res.render('ui-statics/ui_statics_settings.ejs');
};
exports.staticAdminUserSettingsController = function(req, res) {
    res.render('ui-statics/ui_statics_admin_user_settings.ejs');
};
exports.staticAdminUserSettingsDropdownController = function(req, res) {
    res.render('ui-statics/ui_statics_admin_user_settings_dropdown.ejs');
};

//First time quiz
exports.staticFirstTimeQuiz = function(req, res) {
    res.render('ui-statics/ui_statics_first_time_quiz.ejs', {
        has_footer: false,
        quest_quiz: true,
        extra_class: 'transparent',
        skill_type_class: 'skill-connect'
    });
};

//Full page loader
exports.staticFullPageLoaderController = function(req, res) {
    res.render('ui-statics/ui_statics_full_page_loader.ejs');
};

exports.staticForgetPasswordEmailController = function(req, res) {
    res.render('ui-statics/ui_statics_forget_password_email.ejs', {
        layout : 'ui-statics/uiEmailBase'
    });
};

exports.staticPasswordRecoveryEmailController = function(req, res) {
    res.render('ui-statics/ui_statics_password_recovery_email.ejs', {
        layout : 'ui-statics/uiEmailBase'
    });
};

//Site Under Maintenance
exports.staticSiteUnderMaintenanceController = function(req, res) {
    res.render('ui-statics/ui_statics_site_under_maintenance.ejs', {
        header_footer: false
    });
};

//My Team 
exports.staticMyTeamController = function(req, res) {
    res.render('ui-statics/ui_statics_my_team.ejs', {
        my_team: true,
        graphPersonality: 'Advisor',
        profileGraph: 'advisor-graph'
    });
};
exports.staticMyTeamNoResultController = function(req, res) {
    res.render('ui-statics/ui_statics_my_team_no_result.ejs', {
        my_team: true
    });
};
// Settings Add department page controller
exports.staticAddDepartmentController = function(req, res) {
    res.render('ui-statics/ui_statics_add_department.ejs');
};

exports.staticAddDepartmentGetStartedController = function(req, res) {
    res.render('ui-statics/ui_statics_add_department_get_started.ejs');
};

exports.staticSelectTrainingsController = function(req, res) {
    res.render('ui-statics/ui_statics_add_department_select_trainings.ejs');
};

exports.staticDepartmentListController = function(req, res) {
    res.render('ui-statics/ui_statics_department_list.ejs');
};

exports.staticDepartmentSelectTrainingsController = function(req, res) {
    res.render('ui-statics/ui_statics_add_more_department_with_trainings.ejs');
};

exports.staticAddDepartmentsSubdivisionController = function(req, res) {
    res.render('ui-statics/ui_statics_add_departments_subdivision.ejs');
};

exports.staticSubDepartmentSelectTrainingsController = function(req, res) {
    res.render('ui-statics/ui_statics_add_more_sub_department_with_trainings.ejs');
};

//Analytics Pages Controller
exports.staticAnalyticsAdminViewController = function(req, res) {
    res.render('ui-statics/ui_statics_analytics_admin_view.ejs', {
        my_team: true
    });
};
exports.staticAnalyticsEmployeeViewNonCallCenterController = function(req, res) {
    res.render('ui-statics/ui_statics_analytics_employee_view_non_call_center.ejs', {
        my_team: true
    });
};
exports.staticAnalyticsEmployeeViewCallCenterController = function(req, res) {
    res.render('ui-statics/ui_statics_analytics_employee_view_call_center.ejs', {
        my_team: true
    });
};
exports.staticAnalyticsSuperAdminViewController = function(req, res) {
    res.render('ui-statics/ui_statics_analytics_super_admin_view.ejs', {
        my_team: true
    });
};
exports.staticAnalyticsSuperAdminSubDeptViewController = function(req, res) {
    res.render('ui-statics/ui_statics_analytics_super_admin_view_subdept.ejs', {
        my_team: true
    });
};
exports.staticAnalyticsSupervisorTeamViewController = function(req, res) {
    res.render('ui-statics/ui_statics_analytics_supervisor_team_view.ejs', {
        my_team: true
    });
};
exports.staticAnalyticsEmployeeViewCallCenterNullStateController = function(req, res) {
    res.render('ui-statics/ui_statics_analytics_employee_view_call_center_null_state.ejs', {
        my_team: true
    });
};
exports.staticAnalyticsEmployeeViewCallCenterNoDataOverlayController = function(req, res) {
    res.render('ui-statics/ui_statics_analytics_employee_view_call_center_no_data_overlay.ejs', {
        my_team: true
    });
};
//Settings page Contest related controller
exports.staticContestSetupController = function(req, res) {
    res.render('ui-statics/ui_statics_contest_setup.ejs');
};

exports.staticContestSetupErrorStatesController = function(req, res) {
    res.render('ui-statics/ui_statics_contest_setup_error_states.ejs');
};

exports.staticExistingContestController = function(req, res) {
    res.render('ui-statics/ui_statics_existing_contest_details.ejs');
};

exports.staticContestRulesPageController = function(req, res) {
    res.render('ui-statics/ui_statics_contest_rules_page.ejs');
};

// Contest Banner Pages Controller
exports.staticTopPQBannerController = function(req, res) {
    res.render('ui-statics/ui_statics_rewards_top_pq_banner.ejs', {
        my_pq: true,
        extra_class: 'transparent'
    });
};
exports.staticTopPQGrowthBannerController = function(req, res) {
    res.render('ui-statics/ui_statics_rewards_top_pq_growth_banner.ejs', {
        my_pq: true,
        extra_class: 'transparent'
    });
};
exports.staticCustomRewardsBannerController = function(req, res) {
    res.render('ui-statics/ui_statics_custom_rewards_banner.ejs', {
        my_pq: true,
        extra_class: 'transparent'
    });
};
exports.staticTopPQAnnoucementEmailTemplateController = function(req, res) {
    res.render('ui-statics/ui_statics_top_pq_contest_email_announcement.ejs', {
        layout : 'ui-statics/uiContestEmailBase'
    });
};
exports.staticTopPQWinnerAnnoucementEmailTemplateController = function(req, res) {
    res.render('ui-statics/ui_statics_top_pq_contest_winner_email_announcement.ejs', {
        layout : 'ui-statics/uiContestEmailBase'
    });
};
exports.staticTopPQWinnerProfileAnnoucementEmailTemplateController = function(req, res) {
    res.render('ui-statics/ui_statics_top_pq_contest_winner_profile_email_announcement.ejs', {
        layout : 'ui-statics/uiContestEmailBase'
    });
};
exports.staticTopPQGrowthAnnoucementEmailTemplateController = function(req, res) {
    res.render('ui-statics/ui_statics_top_pq_growth_contest_email_announcement.ejs', {
        layout : 'ui-statics/uiContestEmailBase'
    });
};
exports.staticCustomContestAnnoucementEmailTemplateController = function(req, res) {
    res.render('ui-statics/ui_statics_custom_contest_email_announcement.ejs', {
        layout : 'ui-statics/uiContestEmailBase'
    });
};

//PDF Report Related Controller
exports.staticPdfReportAdvisorPQDetailPageController = function (req, res) {
    res.render('ui-statics/ui_statics_pdf_report_advisor_pq_detail_page.ejs', {
        header_footer: false
    });
};
exports.staticPdfReportOrganizerPQDetailPageController = function (req, res) {
    res.render('ui-statics/ui_statics_pdf_report_organizer_pq_detail_page.ejs', {
        header_footer: false
    });
};
exports.staticPdfReportConnectorPQDetailPageController = function (req, res) {
    res.render('ui-statics/ui_statics_pdf_report_connector_pq_detail_page.ejs', {
        header_footer: false
    });
};
exports.staticPdfReportDoerPQDetailPageController = function (req, res) {
    res.render('ui-statics/ui_statics_pdf_report_doer_pq_detail_page.ejs', {
        header_footer: false
    });
};
exports.staticPdfReportDreamerPQDetailPageController = function (req, res) {
    res.render('ui-statics/ui_statics_pdf_report_dreamer_pq_detail_page.ejs', {
        header_footer: false
    });
};
exports.staticPdfReportOriginalPQDetailPageController = function (req, res) {
    res.render('ui-statics/ui_statics_pdf_report_original_pq_detail_page.ejs', {
        header_footer: false
    });
};
exports.staticPdfReportOrganizerPQPersonalityMattersController = function (req, res) {
    res.render('ui-statics/ui_statics_personality_matters_organizer_pq.ejs', {
        header_footer: false
    });
};
exports.staticPdfReportAdvisorPQPersonalityMattersController = function (req, res) {
    res.render('ui-statics/ui_statics_personality_matters_advisor_pq.ejs', {
        header_footer: false
    });
};
exports.staticPdfReportConnectorPQPersonalityMattersController = function (req, res) {
    res.render('ui-statics/ui_statics_personality_matters_connector_pq.ejs', {
        header_footer: false
    });
};
exports.staticPdfReportDoerPQPersonalityMattersController = function (req, res) {
    res.render('ui-statics/ui_statics_personality_matters_doer_pq.ejs', {
        header_footer: false
    });
};
exports.staticPdfReportDreamerPQPersonalityMattersController = function (req, res) {
    res.render('ui-statics/ui_statics_personality_matters_dreamer_pq.ejs', {
        header_footer: false
    });
};
exports.staticPdfReportOriginalPQPersonalityMattersController = function (req, res) {
    res.render('ui-statics/ui_statics_personality_matters_original_pq.ejs', {
        header_footer: false
    });
};
exports.staticPdfReportNorthAmericaWorkstyleDistributionController = function (req, res) {
    res.render('ui-statics/ui_statics_north_america_workstyle_distribution_page.ejs', {
        header_footer: false
    });
};
exports.staticPdfReportUserDetailPageController = function (req, res) {
    res.render('ui-statics/ui_statics_pdf_report_user_detail_page.ejs', {
        header_footer: false
    });
};
exports.staticPdfReportCoverPageController = function (req, res) {
    res.render('ui-statics/ui_statics_pdf_report_cover_page.ejs', {
        header_footer: false
    });
};
exports.staticPrintReportNotificationEmailController = function(req, res) {
    res.render('ui-statics/ui_statics_print_report_notification.ejs', {
        layout : 'ui-statics/uiEmailBase'
    });
};
exports.staticPdfReportAdvisorPQDetailCoverPageController = function (req, res) {
    res.render('ui-statics/ui_statics_pdf_report_advisor_pq_detail_cover_page.ejs', {
        header_footer: false
    });
};
exports.staticPdfReportAdvisorPQPersonalityMattersPageController = function (req, res) {
    res.render('ui-statics/ui_statics_personality_matters_advisor_pq_page.ejs', {
        header_footer: false
    });
};

//New PQ Pages Controller
exports.staticMyPQAdvisorPageController = function(req, res) {
    res.render('ui-statics/ui_statics_mypq_advisor_page.ejs', {
        my_pq: true,
        extra_class: 'transparent',
        skill_type_class: 'skill-connect'
    });
};
exports.staticMyPQConnectorPageController = function(req, res) {
    res.render('ui-statics/ui_statics_mypq_connector_page.ejs', {
        my_pq: true,
        extra_class: 'transparent',
        skill_type_class: 'skill-connect'
    });
};
exports.staticMyPQDoerPageController = function(req, res) {
    res.render('ui-statics/ui_statics_mypq_doer_page.ejs', {
        my_pq: true,
        extra_class: 'transparent',
        skill_type_class: 'skill-connect'
    });
};
exports.staticMyPQDreamerPageController = function(req, res) {
    res.render('ui-statics/ui_statics_mypq_dreamer_page.ejs', {
        my_pq: true,
        extra_class: 'transparent',
        skill_type_class: 'skill-connect'
    });
};
exports.staticMyPQOrganizerPageController = function(req, res) {
    res.render('ui-statics/ui_statics_mypq_organizer_page.ejs', {
        my_pq: true,
        extra_class: 'transparent',
        skill_type_class: 'skill-connect'
    });
};
exports.staticMyPQOriginalPageController = function(req, res) {
    res.render('ui-statics/ui_statics_mypq_original_page.ejs', {
        my_pq: true,
        extra_class: 'transparent',
        skill_type_class: 'skill-connect'
    });
};
exports.staticMyPQNewUserPageController = function(req, res) {
    res.render('ui-statics/ui_statics_mypq_new_user_page.ejs', {
        my_pq: true,
        extra_class: 'transparent',
        skill_type_class: 'skill-connect'
    });
};

//Weekly Recap Email template controller
exports.staticWeeklyEmailAboveAvgController = function(req, res) {
    res.render('ui-statics/ui_statics_weekly_email_above_avg.ejs', {
        layout : 'ui-statics/uiEmailBase'
    });
};
exports.staticWeeklyEmailBelowAvgController = function(req, res) {
    res.render('ui-statics/ui_statics_weekly_email_below_avg.ejs', {
        layout : 'ui-statics/uiEmailBase'
    });
};
