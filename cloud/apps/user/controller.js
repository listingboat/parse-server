// All controllers for user app
var utils = require('./utils.js'),
    _ = require('underscore'),
    path = require('path'),
    userConstants = require('./constants.js'),
    quizConstants = require('../quiz/constants.js'),
    appSettings = require('../../app_settings.js'),
    commonUtils = require('../common/utils.js'),
    secret = require('../../secret.js'),
    commonConstants = require('../common/constants.js'),
    quizUtils = require('../quiz/utils.js'),
    analyticsUtils = require('../analytics/utils.js'),
    companyUtils = require('../company/utils.js');

exports.homeController = function (req, res) {
    var user = Parse.User.current();
    if (!user) {
        res.redirect(req.app.namedRoutes.build('user.auth'));
    }
    else {
        res.redirect(req.app.namedRoutes.build('user.myPQ'));
    }
};

// controller to renders login and signup page
exports.authController = function (req, res) {
    var user = Parse.User.current();
    if (!user) {
        res.render('user/index', {
            stayLoggedIn: 'on' // to keep stay logged on check box checked
        });
    }
    else {
        res.redirect(req.app.namedRoutes.build('user.myPQ'));
    }
};

// controller to handle login functionality at backend
exports.signInController = function (req, res) {
    // login using email and password
    var userEmail = req.body.login_email.trim().toLowerCase(),    // user entered email
        password = req.body.login_password,
        errorCallback = req.errorCallback,
        stayLoggedIn = req.body.stay_logged_in || false,    // stay log in check
        form_data = {
            userEmail: userEmail,
            password: password,
            stayLoggedIn: stayLoggedIn
        };

    // validates the form data
    utils.validateLoginForm(form_data, function (isValid, form_errors) {
        if (!isValid) {    // if data is not valid
            _.extend(form_errors, form_data);

            form_errors['userEmailError'] = form_errors['passwordError'] = 'Error - your username/password were incorrect';
            res.render('user/index', form_errors);
        }
        else {
            Parse.User.logIn(userEmail, password).then(function (user) {
                if(!user.get("is_deleted")) {
                    if (stayLoggedIn) {
                        res.cookie('rememberme', userConstants.USER_SESSION_STAY_SIGNED_IN_PERIOD, {
                            maxAge: userConstants.USER_SESSION_STAY_SIGNED_IN_PERIOD,
                            httpOnly: true
                        });
                    } else {
                        res.cookie('rememberme', userConstants.USER_SESSION_DEFAULT_PERIOD, {
                            maxAge: userConstants.USER_SESSION_DEFAULT_PERIOD,
                            httpOnly: true
                        });
                    }
                    if (req.session.redirectURL) {
                        var redirectURL = req.session.redirectURL;
                        req.session.redirectURL = undefined;
                        res.redirect(redirectURL); // redirect to the url user entered
                    } else {
                        res.redirect(req.app.namedRoutes.build('user.myPQ'));  // redirect My PQ page
                    }
                }
                else{  // if user is deleted
                    Parse.User.logOut();
                    form_errors['userEmailError'] = form_errors['passwordError'] = 'Error - your username/password were incorrect';
                    res.render('user/index', _.extend(form_errors, form_data));
                }
            }, function (error) {
                if(error.code == 101) {
                    form_errors['userEmailError'] = form_errors['passwordError'] = 'Error - your username/password were incorrect';
                    res.render('user/index', _.extend(form_errors, form_data));
                }
                else{
                    errorCallback();
                }
            });
        }
    });
};

// controller to sign out user from session
exports.signOutController = function (req, res) {
    req.session = {}; // clears session when signing out
    res.cookie('rememberme', -1, {maxAge: -1, httpOnly: true}); // expire rememberme cookie
    Parse.User.logOut();
    var user = Parse.User.current();
    if (!user) {
        res.redirect(req.app.namedRoutes.build('user.auth'));
    }
    else {
        res.redirect(req.app.namedRoutes.build('user.myPQ'));
    }
};

// controller that renders user's my pq page
exports.myPQController = function (req, res) {

    // function that renders the my-pq page
    // in context it expects user, primaryPersonality, superPowerTagLineMap, headerWrapperClass
    function renderMyPq(currentUser, primaryPersonality) {
        // Skill Graph util
        utils.getSkillsGraphData(currentUser,
            function (skillGraphData) { //success callback
                context['skillGraphData'] = skillGraphData; // current user object
                // For familiarity circles section
                utils.getUserDoughnutGraphData(currentUser,
                    function (personalityCirclesData) { // success callback
                        if (!personalityCirclesData.foundPersonalityScores) {
                            renderPqWithoutScore();
                        }
                        else {
                            _.extend(context, personalityCirclesData);
                            context['renderScoreSection'] = true;    // flag to load score section along with the PQ page
                            if(!currentUser.get('pq_score')){
                                currentUser = utils.calculatePQScore(currentUser, skillGraphData);
                            }

                            context.nextTargetPq = (typeof currentUser.get('pq_score') === "number") ? (currentUser.get('pq_score') + 100) - (currentUser.get('pq_score') % 100) : null ;

                            if(currentUser.dirtyKeys().length > 0) {
                                currentUser.save().then(function () {
                                    res.render('user/my_pq', context);
                                }, errorCallback)
                            }
                            else{
                                res.render('user/my_pq', context);
                            }
                        }
                    }, errorCallback
                );
            }, errorCallback,
            renderPqWithoutScore    // callback when skill score doesn't exist or not valid
        );
    }

    function renderPqWithoutScore(){
        context['renderScoreSection'] = false;    // flag that indicate not load score section along with the page make ajax call to recalculate skill and personality score
        var userResponseQuery = new Parse.Query('User_Response');
        userResponseQuery.equalTo('user', currentUser);
        userResponseQuery.equalTo('is_applicable', true);
        userResponseQuery.count().then(function(responseCount){
            // batch count indicates how many calls required to get all the user responses(1000 user responses in one batch)
            context['batchCount'] = Math.floor(responseCount / userConstants.USER_RESPONSE_QUERY_BATCH_SIZE);
            if(responseCount > context['batchCount'] * userConstants.USER_RESPONSE_QUERY_BATCH_SIZE) {
                context['batchCount']++;
            }
            context['hashTimeStamp'] = (new Date()).getTime();    // time stamp is used in hash for security
            context['batchCountHash'] = require('cloud/packages/md5.js').hex_md5(secret.securityKey1 + context['batchCount'] + context['hashTimeStamp'] + secret.securityKey2);
            res.render('user/my_pq', context);
        }, errorCallback);
    }

    // For badge section
    var currentUser = Parse.User.current(),
        errorCallback = req.errorCallback,
        PERSONALITY_CLASS_MAP = userConstants.PERSONALITY_CLASS_MAP,
        primaryPersonalityPointer = currentUser.get("primary_personality");

    var context = {
        'my_pq': true,
        'extra_class': 'transparent',
        'user': currentUser,
        skillWrapperClass: "skill-connect"
    };
    primaryPersonalityPointer.fetch(function(primaryPersonality){
        primaryPersonality = currentUser.get("primary_personality");
        context['primaryPersonality'] = primaryPersonality; // primary personality of user
        context['superPowerTagLineMap'] = userConstants.SUPERPOWER_TAGLINE_MAP; // map for super power tag line image
        context['headerWrapperClass'] = PERSONALITY_CLASS_MAP[  // controls header background and color
                primaryPersonality.get('name').toLowerCase()] || 'doer-wrap';
        context['badgeWithoutPQUrl'] = commonUtils.getAbsoluteUrlForWorkstyle(req.app.namedRoutes.build('user.badgeWithoutPQ', {id: currentUser.id}));    // url for badge without pq
        context['badgeGifUrl'] = commonUtils.getAbsoluteUrlForWorkstyle(req.app.namedRoutes.build('user.badgeGif', {id: currentUser.id}));    // url for badge gif
        context['homePageUrl'] = appSettings.PROTOCOL_FOR_WORK_STYLE + appSettings.DOMAIN_FOR_WORK_STYLE;    // url for home page
        context['publicProfileURL'] = commonUtils.getAbsoluteUrlForWorkstyle(req.app.namedRoutes.build('user.myPQPublic', {id: currentUser.id}));    // user public profile page
        context['thumbnailPath'] = commonUtils.getAbsoluteUrlForWorkstyle('/assets/images/link-img.png');
        quizUtils.isMyPQUnlocked(currentUser, function(isUnlocked){
            if(isUnlocked){
                renderMyPq(currentUser, primaryPersonality)
            }
            else{
                res.render('user/my_pq_locked', context);
            }
        }, errorCallback);
    }, errorCallback);
};


// controller that render public my-PQ page
exports.publicMyPQController = function (req, res) {

    function renderPublicPQUser(user, currentUser) {
        var primaryPersonality = user.get('primary_personality'),
            context = {
                'extra_class': 'transparent',
                'user': user,
                'companyExists': user.get('company')? true : false,
                'primaryPersonality': primaryPersonality,
                'personalityDescription': userConstants.PERSONALITY_DESCRIPTION_MAP,
                'superPowerTagLineMap': userConstants.SUPERPOWER_TAGLINE_MAP, // map for super power tag line image
                'headerWrapperClass': userConstants.PERSONALITY_CLASS_MAP[  // controls header background and color
                    primaryPersonality.get('name').toLowerCase()] || 'doer-wrap'
            };
        if(!currentUser){
            context['logged_out'] = true;
            context['nav_items'] = false;
        }
        context['homePageURL'] =  appSettings.PROTOCOL_FOR_WORK_STYLE + appSettings.DOMAIN_FOR_WORK_STYLE;
        res.render('user/' + userConstants.PUBLIC_PROFILE_PARTIALS_MAP[primaryPersonality.get('name').toLowerCase()], _.extend({}, context, {layout: 'layout_partial'}), function(error, personalityDescriptionPartial){
            res.render('user/mypq_public_logged_out', _.extend(context, {
                personalityDescriptionPartial: personalityDescriptionPartial
            }));
        });
    }

    // renders the public pq page for the same company case
    // expects in context user, isAccountOwner, isSuperAdmin, superPowerTagLineMap, primaryPersonality, headerWrapperClass, learnMorePersonalityUrlNameMap
    function renderPublicPQForSameCompany(user, context){
         // Skill Graph util
        utils.getSkillsGraphData(user,
            function (skillGraphData) { //success callback
                context['skillGraphData'] = skillGraphData; // user object
                // For familiarity circles section
                utils.getUserDoughnutGraphData(user,
                    function (personalityCirclesData) { // success callback
                        if (!personalityCirclesData.foundPersonalityScores) {
                            renderPublicPQWithoutScore();
                        }
                        else {
                            _.extend(context, personalityCirclesData);
                            context['renderScoreSection'] = true;    // falg to load score section along with the public pq page
                            if(!user.get('pq_score')){
                                user = utils.calculatePQScore(user, skillGraphData);
                                user.save().then(function(){
                                    res.render('user/my_pq_same_company_profile', context);
                                }, errorCallback)
                            }
                            else {
                                res.render('user/my_pq_same_company_profile', context);
                            }
                        }
                    }, errorCallback);
            }, errorCallback, renderPublicPQWithoutScore
        );
    }

    function renderPublicPQWithoutScore(){
        var userId = context.user.id,
            userResponseQuery = new Parse.Query('User_Response');
        userResponseQuery.equalTo('user', context.user);
        userResponseQuery.equalTo('is_applicable', true);
        userResponseQuery.count().then(function(responseCount){
             // batch count indicates how many calls required to get all the user responses(1000 user responses in one batch)
            context['batchCount'] = Math.floor(responseCount / userConstants.USER_RESPONSE_QUERY_BATCH_SIZE);
            if(responseCount > context['batchCount'] * userConstants.USER_RESPONSE_QUERY_BATCH_SIZE) {
                context['batchCount']++;
            }
            context['hashTimeStamp'] = (new Date()).getTime();
            context['batchCountHash'] = require('cloud/packages/md5.js').hex_md5(secret.securityKey1 + context['batchCount'] + context['hashTimeStamp'] + userId + secret.securityKey2);
            context['renderScoreSection'] = false;    // flag to indicate not to load score section along with the page
            res.render('user/my_pq_same_company_profile', context);
        }, errorCallback);

    }

    var currentUser = Parse.User.current(),    // current user
        errorCallback = req.errorCallback,
        userQuery = new Parse.Query(Parse.User),    // Query object for user class
        context;
    userQuery.include('primary_personality');
    userQuery.notEqualTo('is_deleted', true);
    userQuery.get(req.params.id, function (user) {    // gets the user object by id
        if (user) {
            if (currentUser) {
                if(user.get('primary_personality')) {
                    if (user.id == currentUser.id) {    // if current user and user whose id is received are the same
                        exports.myPQController(req, res);    // render my-pq page
                    }

                    else if (user.get('company') && currentUser.get('company') && (user.get('company').id == currentUser.get('company').id)) {    // if user belongs to the same company as the user whose id is received
                        var PERSONALITY_CLASS_MAP = userConstants.PERSONALITY_CLASS_MAP,
                            primaryPersonality = user.get('primary_personality');

                        context = {
                            'extra_class': 'transparent',
                            'user': user,
                            'companyExists': user.get('company')? true : false,
                            'isAccountOwner': currentUser.get('is_account_owner'),
                            'superPowerTagLineMap': userConstants.SUPERPOWER_TAGLINE_MAP, // map for super power tag line image
                            'isSuperAdmin': (userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === currentUser.get('permission_type'))
                        };

                        context['primaryPersonality'] = primaryPersonality; // primary personality of user
                        context['headerWrapperClass'] = PERSONALITY_CLASS_MAP[  // controls header background and color
                            primaryPersonality.get('name').toLowerCase()] || 'doer-wrap';
                        context['learnMorePersonalityUrlNameMap'] = userConstants.LEARN_MORE_PERSONALITY_URL_NAME_MAP;
                        quizUtils.isMyPQUnlocked(user, function(isUnlocked){
                            if(isUnlocked){
                                renderPublicPQForSameCompany(user, context);
                            }
                            else{
                                renderPublicPQUser(user, currentUser);
                            }
                        }, errorCallback)
                    }
                    else{    // if user belongs to other company then the user whose id is received
                        renderPublicPQUser(user, currentUser);
                    }
                }
                else {
                    res.render('common/404');
                }
            } else {
                renderPublicPQUser(user, currentUser);
            }
        }
        else{
            res.render('common/404');
        }
    });
};

// controller that renders about me page
exports.aboutMeController = function (req, res) {

    // For Top Head Section
    var currentUser = Parse.User.current(),
        errorCallback = req.errorCallback,
        context = {},
        downloadPdf = req.query.downloadPdf || false,
        primaryPersonalityPointer = currentUser.get('primary_personality');

    context['explore'] = true; // Highlights about me on navigation bar
    context['about_me'] = true; // Highlights about me on navigation bar
    context['user'] = currentUser; // To get user's name and occupation
    context['superPowerTagLineMap'] = userConstants.SUPERPOWER_TAGLINE_MAP; // map for super power tag line image
    context['downloadPdf'] = downloadPdf;
    primaryPersonalityPointer.fetch().then(function (primaryPersonality) {
        context['primaryPersonality'] = primaryPersonality;  // primaryPersonality for users
        context['headerWrapperClass'] = userConstants.PERSONALITY_CLASS_MAP[ // controls header background and color
            primaryPersonality.get('name').toLowerCase()] || 'doer-warp';
        context['video_url'] = userConstants.ABOUT_ME_VIDEO_URL[primaryPersonality.get('name').toLowerCase()];
        utils.getAboutMeContent(currentUser, function (data) {
            _.extend(context, data); // appends receive data with the context
            res.render('user/about_me', _.extend(context, {quiz_start_link: 'quiz.start'}));
        }, errorCallback);
    }, errorCallback);
};


// controller that renders the small email signature image
exports.smallEmailSignatureController = function (req, res) {
    var signatureImage, absolutURL,
        userQuery = new Parse.Query(Parse.User),    // query object for user
        errorCallback = req.errorCallback;

    userQuery.include('primary_personality');
    userQuery.get(req.params.id).then(function (user) {    // finds the user with provided user id
        if (!user) {
            errorCallback();    // if no user found
        }
        else {
            // selects the image ile according to user's personality
            signatureImage = userConstants.SMALL_SIGNATURE_IMAGE_MAP[user.get('primary_personality').get('name').toLowerCase()];
            absolutURL = commonUtils.getAbsolutURL('/assets/images/' + signatureImage);    // gets the absolute url for the signature image
            utils.renderImage(req, res, absolutURL);
        }
    }, errorCallback);
};

// controller to render badge without PQ
exports.withoutPQBadgeController = function(req, res){
    var signatureImage, absolutURL,
        userQuery = new Parse.Query(Parse.User),    // query object for user
        errorCallback = req.errorCallback;

    userQuery.include('primary_personality');
    userQuery.get(req.params.id).then(function (user) {    // finds the user with provided user id
        if (!user) {
            errorCallback();    // if no user found
        }
        else {
            // selects the image ile according to user's personality
            signatureImage = userConstants.BADGE_WITHOUT_PQ_MAP[user.get('primary_personality').get('name').toLowerCase()];
            absolutURL = commonUtils.getAbsolutURL('/assets/images/' + signatureImage);    // gets the absolute url for the signature image
            utils.renderImage(req, res, absolutURL);
        }
    }, errorCallback);
};

// controller to render badge gif
exports.badgeGifController = function(req, res){
    var signatureImage, absolutURL,
        userQuery = new Parse.Query(Parse.User),    // query object for user
        errorCallback = req.errorCallback;

    userQuery.include('primary_personality');
    userQuery.get(req.params.id).then(function (user) {    // finds the user with provided user id
        if (!user) {
            errorCallback();    // if no user found
        }
        else {
            // selects the image ile according to user's personality
            signatureImage = userConstants.BADGE_GIF_MAP[user.get('primary_personality').get('name').toLowerCase()];
            absolutURL = commonUtils.getAbsolutURL('/assets/images/' + signatureImage);    // gets the absolute url for the signature image
            utils.renderImage(req,res, absolutURL);
        }
    }, errorCallback);
};

// search for the user migration data and saves it
exports.migrateUserController = function(req, res){
    var currentUser =  Parse.User.current(),
        errorCallback = req.errorCallback;
    utils.findOldAssessmentResult(currentUser, function(dataForPardotCall){
        res.send(dataForPardotCall);
    }, function(error) {
        res.send({success: false})
    })
};

// controller that registers user
// status = false in response means render the partial template
// status = true in response means user is registered make another ajax call for migration data and not render any partial
exports.registerController = function (req, res) {

    function errorCallback(error) {
        res.render('user/_register_form_partial', _.extend({formError: 'Registration unsuccessful. Please try again.'}, form_data), function(error, partial){
            res.send({status: false, partial: partial});
        });
    }

    function fetchDepartmentList(successCallback, errorCallback){
        var departmentQuery = new Parse.Query("Department");
        departmentQuery.find().then(function(departmentList){
            successCallback(departmentList);
        }, errorCallback);
    }

    var context = {
        firstNameMaxLength: userConstants.FIRST_NAME_MAX_LENGTH,
        lastNameMaxLength: userConstants.LAST_NAME_MAX_LENGTH,
        positionTitleMaxLength: userConstants.POSITION_TITLE_MAX_LENGTH,
        emailMaxLength: userConstants.EMAIL_MAX_LENGTH
    };

    if (req.method == 'GET') {    // if request is of GET type
        context.enableDepartmentCheck = false;
        var userEmail = (req.query && req.query.email) ? req.query.email : "";  //get the user email from query string
        if(commonUtils.validateEmailAddress(userEmail)) {  // check if email sent from query string is valid
            context.isEmailNonEditable = true;   // flag to make email field non editable
            context.userEmail = userEmail;
            utils.isUserInInviteList(userEmail, function (invite, company) {
                if(invite && company) {   // if user is invited by company
                    utils.getDepartmentList(company, function (departmentList) {   // get department list of company
                        var sortedDepartmentLists = companyUtils.getSortedDepartmentHierarchyList(departmentList);
                        _.extend(context, sortedDepartmentLists);
                        context.enableDepartmentCheck = true;
                        res.render('user/register.ejs', _.extend({stayLogedIn: true}, context));
                    }, req.errorCallback);
                }
                else if(invite){   // if user is invited by a friend
                    res.render('user/register.ejs', _.extend({stayLogedIn: true}, context));
                }
                else{
                    res.render('user/register.ejs', _.extend({stayLogedIn: true}, context));
                }
            }, req.errorCallback);
        }
        else{
            res.render('user/register.ejs', _.extend({stayLogedIn: true}, context));
        }
    }
    else {    // if request is of POST type
        var firstName = req.body.first_name.trim(),    // user entered first name
            lastName = req.body.last_name.trim(),    // user entered last name
            userEmail = req.body.user_email.trim().toLowerCase(),    // user entered email
            phoneNumber = (typeof req.body.phone_number === "string") ? req.body.phone_number.trim() : "",
            positionTitle = req.body.position_title.trim(),    // user entered position title
            password1 = req.body.password1,    // user entered password
            password2 = req.body.password2,    // user entered confirm password
            stayLogedIn = req.body.stay_loged_in,    // stay log in check
            agreeTermsOfService = (req.body.agree_terms_of_service === "on") ? "on" : undefined,    // agree terms of services check
            department = req.body.department,
            isEmailNonEditable = (req.query && req.query.email) ? true : false,  // flag to keep email field non editable
            form_data = {
                firstName: firstName,
                lastName: lastName,
                userEmail: userEmail,
                positionTitle: positionTitle,
                password1: password1,
                password2: password2,
                stayLogedIn: stayLogedIn,
                agreeTermsOfService: agreeTermsOfService,
                department: department,
                phoneNumber: phoneNumber,
                isEmailNonEditable: isEmailNonEditable
            };
        utils.isUserInInviteList(userEmail, function (invite, company) {
            utils.getDepartmentList(company, function(departmentList){
                var sortedDepartmentLists = companyUtils.getSortedDepartmentHierarchyList(departmentList);
                _.extend(form_data, sortedDepartmentLists);
                context.layout = 'layout_partial';
                utils.validateRegistationForm(form_data, departmentList[0], company, departmentList, function (isValid, form_errors) {
                    if (isValid) {    // if data is not valid
                        utils.isUserAlreadyExist(userEmail, function (isNewUser) {    // checks if user already exist
                            if (isNewUser) {    // if user not already exist
                                if (invite) {    // if user is invited
                                    form_data['company'] = company;
                                    utils.registerUser(form_data, invite, departmentList, function (userPardotDataDict) {    // registers the user
                                        if (stayLogedIn) {
                                            res.cookie('rememberme', userConstants.USER_SESSION_STAY_SIGNED_IN_PERIOD, {
                                                maxAge: userConstants.USER_SESSION_STAY_SIGNED_IN_PERIOD,
                                                httpOnly: true
                                            });
                                        } else {
                                            res.cookie('rememberme', userConstants.USER_SESSION_DEFAULT_PERIOD, {
                                                maxAge: userConstants.USER_SESSION_DEFAULT_PERIOD,
                                                httpOnly: true
                                            });
                                        }
                                        res.send(_.extend({status: true}, userPardotDataDict));
                                    }, errorCallback);
                                }
                                else {     // if user is not invited
                                    utils.isCompanyRegistered(userEmail, function (isRegisteredCompany) {    // checks is his company registered
                                        if (isRegisteredCompany) {    // if company registered
                                            utils.getTellOthersMailContent(res, function (mailContent) {

                                                res.render('user/_user_not_invited_partial.ejs', _.extend({layout: 'layout_partial'}, mailContent), function(error, partial){
                                                    res.send({status: false, partial: partial});
                                                });
                                            });
                                        }
                                        else {    // if user's company not registered
                                            utils.isUserInWaitList(userEmail, function (isInWaitList) {    //checks if user is in wait list
                                                if (isInWaitList) {    // if user in wait list
                                                    utils.getTellOthersMailContent(res, function (mailContent) {

                                                        res.render('user/_registeration_unsuccessful_partial.ejs', _.extend({layout: 'layout_partial'}, mailContent), function(error, partial){
                                                            res.send({status: false, partial: partial});
                                                        });
                                                    });
                                                }
                                                else {    //if user not in wait list
                                                    utils.putUserInWaitList(form_data, function () {    //puts user inwait list
                                                        utils.getTellOthersMailContent(res, function (mailContent) {
                                                            res.render('user/_registeration_unsuccessful_partial.ejs', _.extend({layout: 'layout_partial'}, mailContent), function(error, partial){
                                                                res.send({status: false, partial: partial});
                                                            });
                                                        });
                                                    }, errorCallback)
                                                }
                                            }, errorCallback);
                                        }
                                    }, errorCallback);
                                }

                            }
                            else {
                                 _.extend(context, form_data, {userEmailError: 'User with this email already exist'});
                                res.render('user/_register_form_partial', context, function(error, partial){
                                    res.send({status: false, partial: partial});
                                });
                            }
                        }, errorCallback);
                    }
                    else {
                        _.extend(context, form_data, form_errors);
                        res.render('user/_register_form_partial', context, function(error, partial){
                            res.send({status: false, partial: partial});
                        });
                    }
                });
            }, errorCallback);
        }, errorCallback);
    }
};

exports.getDepartmentController = function(req, res){
    var email = req.body.email.toLowerCase().trim(),
        errorCallback = req.errorCallback;
    utils.isUserInInviteList(email, function (invite, company) {
        utils.getDepartmentList(company, function(departmentList){
            var sortedDepartmentLists = companyUtils.getSortedDepartmentHierarchyList(departmentList);
            res.render("user/_departments_partial", _.extend({layout: 'layout_partial'}, sortedDepartmentLists), function(error, partial){
                var isPartialFound = (company)? true : false;
                res.send({partial: partial, success: isPartialFound});
            });
        }, errorCallback);
    }, errorCallback)
};

exports.joinWaitListController = function (req, res) {

    var context = {
        firstNameMaxLength: userConstants.FIRST_NAME_MAX_LENGTH,
        lastNameMaxLength: userConstants.LAST_NAME_MAX_LENGTH,
        emailMaxLength: userConstants.EMAIL_MAX_LENGTH
    };

    if (req.method == 'GET') {
        res.render('user/join_waitlist.ejs', context);
    }
    else {    // if request is of POST type
        var firstName = typeof req.body.first_name === "string"? req.body.first_name.trim() : '',    // user entered first name
            errorCallback = req.errorCallback,
            lastName = typeof req.body.last_name === "string"? req.body.last_name.trim() : '',    // user entered last name
            userEmail = typeof req.body.user_email === "string"? req.body.user_email.trim().toLowerCase() : '',    // user entered email
            company = typeof req.body.company === "string"? req.body.company.trim() : '',    // user entered company
            phoneNumber = req.body.phone_number,    // user entered phone number
            form_data = {
                firstName: firstName,
                lastName: lastName,
                userEmail: userEmail,
                company: company,
                phoneNumber: phoneNumber,
                firstNameMaxLength: userConstants.FIRST_NAME_MAX_LENGTH,
                lastNameMaxLength: userConstants.LAST_NAME_MAX_LENGTH,
                emailMaxLength: userConstants.EMAIL_MAX_LENGTH
            };
        _.extend(form_data, context);
        utils.validateJoinWaitListForm(form_data, function (isValid, form_errors) {    // validates user data
            if (isValid) {    // if data is valid
                utils.isUserAlreadyExist(userEmail, function (isNewUser) {    // checks if user already exist
                    if (isNewUser) {    // if user not already exist
                        utils.isUserInInviteList(userEmail, function (isInvited) {    // checks if user is already invited
                            if (!isInvited) {    // if user is not invited
                                utils.isUserInWaitList(userEmail, function (isInWaitList) {    // check if user already in wait list
                                    if (!isInWaitList) {    // is user is not in wait list
                                        utils.putUserInWaitList(form_data, function (pardotDataDict) {    // put user in wait list
                                            utils.getTellOthersMailContent(res, function (mailContent) {
                                                res.render('user/join_waitlist_confirm.ejs', _.extend(mailContent, pardotDataDict));
                                            });
                                        }, errorCallback);
                                    }
                                    else {    // if user already in waitlist
                                        res.render('user/join_waitlist.ejs',
                                            _.extend({userEmailError: 'You are already listed in our wait list.'},
                                                form_data));
                                    }
                                }, errorCallback);
                            }
                            else {    // if user has an invite
                                res.render('user/join_waitlist.ejs',
                                    _.extend({userEmailError: 'There is an invite with this email, You can register on Workstyle directly'},
                                        form_data));
                            }
                        }, errorCallback);
                    }
                    else {    // if user already exist
                        res.render('user/join_waitlist.ejs', _.extend({userEmailError: 'User with this email already exist'}, form_data));
                    }
                }, errorCallback);
            }
            else {    // if form is invalid
                _.extend(form_errors, form_data);
                res.render('user/join_waitlist.ejs', form_errors);
            }
        });
    }
};

// controller that request for password reset link
exports.forgotPasswordController = function (req, res) {
    var email = (typeof req.query.email === "string") ? req.query.email.trim().toLowerCase() : "";
    if (!email.match(commonConstants.EMAIL_REGEX)) {    // if email is in invalid format
        res.send({message: 'Invalid email address.', success: false});    // send error
    }
    else {
        if (email !== "") {
            var userQuery = new Parse.Query(Parse.User);
            userQuery.equalTo("email", email);
            userQuery.notEqualTo("is_deleted", true);
            userQuery.first().then(function (user) {
                if (user) {
                    Parse.User.requestPasswordReset(email).then(function () {
                        res.send({success: true});
                    }, function (error) {
                        if (error.code == 205) {
                            res.send({message: 'No user found with this email', success: false});
                        }
                        else {
                            res.send({message: 'Invalid email address.', success: false});
                        }
                    });

                }
                else {
                    res.send({message: 'No user found with this email', success: false});
                }
            }, function (error) {
                res.send({message: 'Something Went Wrong..', success: false});
            });
        }
        else{
            res.send({message: '*Required', success: false});
        }
    }
};

// controller that renders user_management.html file for Parse (used to show our domain in password reset link)
exports.userManagementHtml = function (req, res) {
    res.render('common/user_management.ejs', {layout: 'layout_partial.ejs'});
};

// controller that renders set new password page
exports.setForgotPassword = function (req, res) {
    res.render('user/set_forgot_pwd.ejs', {logged_out: true});
};

exports.forgotPasswordResetSuccessController = function (req, res) {
    res.render('user/forgot_password_reset_success', {protocol: appSettings.PROTOCOL, domain: appSettings.DOMAIN});
};

exports.termsConditionsController = function (req, res) {
    res.render('common/terms_conditions');
};

exports.privacyPolicyController = function (req, res) {
    res.render('common/privacy_policy');
};


// controller that makes validates received data is valid or not and then makes pardot call with that data
// eg: adds user prospect to register list , migrated assessment complete list,assessment complete list and updates user prospect
exports.makePardotCallForUser = function(req, res){
    req.currentUser = Parse.User.current();
    utils.validateDataForPardotCall(req, function(isValid, userDict, listName){
        if(isValid){
            function successCallback(){
                commonUtils.updateUserPardotProspect(userDict, listName, function () {
                    res.send({success: true});
                }, function () {
                    res.send({success: false});
                });
            }
            function errorCallback(){
                res.send({success: false});
            }
            if(listName === appSettings.PARDOTS_LIST_NAMES.REGISTER_LIST && req.currentUser && userDict.email === req.currentUser.get('email') && req.currentUser.get('company')){
                var companyQuery = new Parse.Query('Company');
                companyQuery.get(req.currentUser.get('company').id ,function(company){
                    if(company.get('pardot_list_id')) {
                        userDict['list_' + company.get('pardot_list_id')] = 1;
                        successCallback();
                    }
                    else{
                        successCallback();
                    }
                }, errorCallback);
            }
            else {
                successCallback();
            }
        }
        else{
            errorCallback();
        }
    });
};

// controller that updaes user last updated time at pardot
exports.updateUserLastActivityController = function(req, res){
    function errorCallback(error){
        res.send({success: false});
    }
    var currentUser = req.currentUser,
        currentTime = new Date();
    commonUtils.updateUserPardotProspect({email: currentUser.get('email')}, false, function(){    // pardot update call
        currentUser.set('last_activity', currentTime);    // updates last activity at parse
        currentUser.save().then(function(){
            res.send({success: true});
        }, errorCallback);
    }, errorCallback);
};


// controller to send user response batches
exports.getUserResponsesController = function (req, res) {
    function getUser(userId, successCallback) {     // function to get user object, whose responses should be fetched
        if (userId) {    // if user is is given
            var userQuery = new Parse.Query(Parse.User),
            // validate user id with hash
                regeneratedHash = require('cloud/packages/md5.js').hex_md5(secret.securityKey1 + batchCount + hashTimeStamp + userId + secret.securityKey2);
            if (regeneratedHash == batchCountHash) {    // is valid user id
                userQuery.get(userId).then(function (user) {
                    successCallback(user);    // fetch user object and return
                }, errorCallback)
            }
            else {    // if invalid user id
                res.status(404).send({message: "Unauthorized Access Denied"});
            }
        }
        else {    // if no user id is given, return current user
            successCallback(req.currentUser);
        }
    }

    var batchNumber = parseInt(req.body.batchNumber),
        batchCount = req.body.batchCount,
        batchCountHash = req.body.batchCountHash,
        userId = req.body.userId,
        hashTimeStamp = req.body.hashTimeStamp,
        errorCallback = req.errorCallback,
        createdAfter = req.body.createdAfter,
        smallBatchCount = req.body.smallBatchCount;

    getUser(userId, function (user) {
        if (typeof batchNumber == 'number') {
            utils.fetchUserResponses(user, batchNumber, smallBatchCount, function (userResponses) {
                var lastResponseCreatedAt = userResponses[userResponses.length - 1].createdAt;
                res.send(_.extend(utils.getScoreMap(userResponses, batchNumber), {lastResponseCreatedAt: lastResponseCreatedAt}));
            }, errorCallback, createdAfter);
        }
        else {
            res.status(404).send({message: "Invalid Batch Number"});
        }
    });
};

// controller to recalculate pseronality and skill score for given user
exports.recalculateCacheTableScoresController = function (req, res) {

    Parse.Cloud.useMasterKey();
    // validate if all the batches received in correct order with the userId(if given)
    function validateReceivedBatchNumbers(batchCountHash, hashTimeStamp, responseBatches, userId) {
        var indexCount = [], isValid = true,
            regeneratedHash;
        if (!userId) {    // if no user id recived don't use userID in hash
            regeneratedHash = require('cloud/packages/md5.js').hex_md5(secret.securityKey1 + responseBatches.length + hashTimeStamp + secret.securityKey2);
        }
        else {
            regeneratedHash = require('cloud/packages/md5.js').hex_md5(secret.securityKey1 + responseBatches.length + hashTimeStamp + userId + secret.securityKey2);
        }
        if (batchCountHash == regeneratedHash) {
            // check if every index is occurred exectly one time
            for (var index in responseBatches) {
                if (!indexCount[responseBatches[index].responseData.batchNumber]) {
                    indexCount[responseBatches[index].responseData.batchNumber] = 1;
                }
                else {
                    indexCount[responseBatches[index].responseData.batchNumber]++;
                }
            }
            for (var index = 0; index < (responseBatches.length && isValid); index++) {
                isValid = isValid && (indexCount[index] && indexCount[index] == 1);
            }
        }
        else {
            isValid = false;
        }
        return isValid;

    }

    // function return user object for whom we have to recalculate cache tables
    function getUser(userId, successCallback) {
        if (userId) {
            var userQuery = new Parse.Query(Parse.User);
            userQuery.get(userId).then(function (user) {
                successCallback(user);
            }, errorCallback)
        }
        else {
            successCallback(req.currentUser);
        }
    }

    var batchCountHash = req.body.batchCountHash,
        hashTimeStamp = req.body.hashTimeStamp,
        userId = req.body.userId,
        responseBatches = JSON.parse(req.body.responseBatches),
        errorCallback = req.errorCallback, primaryPersonality;
    if (validateReceivedBatchNumbers(batchCountHash, hashTimeStamp, responseBatches, userId)) {
        var result = utils.validateResponseBatches(responseBatches);
        if (result.isValid) {
            getUser(userId, function (user) {
                utils.resetUserSkillCacheData(user, result.userResponsesScore.skillScore, hashTimeStamp, function (graphData) {
                    utils.recalculateCacheTablePersonalityScore(user, result.userResponsesScore.personalityScore, hashTimeStamp, function (familiarityCircleData, radiusFactor) {
                        // gets the url to generate badge
                        analyticsUtils.getUserCompanyAndDepartment(user, function (userWithData) {
                            user = userWithData;
                            primaryPersonality = user.get("primary_personality");
                            utils.getUserDoughnutGraphData(user, function (personalityCirclesData) {
                                var context = {
                                    doughnutGraphData: personalityCirclesData.doughnutGraphData,
                                    layout: "layout_partial"
                                };
                                updatedUser = utils.calculatePQScore(user, graphData);
                                updatedUser.save().then(function () {
                                    res.render("user/_my_pq_personality_donut_graph.ejs", context, function (error, html) {
                                        res.send({
                                            skillGraphData: graphData,
                                            familiarityCircleData: familiarityCircleData,
                                            radiusFactor: radiusFactor,
                                            partial: html
                                        });
                                    });
                                }, errorCallback);
                                //});
                            }, errorCallback);
                        }, errorCallback);
                    }, errorCallback);
                }, errorCallback);
            });
        }
        else {
            res.status(404).send({message: "'Invalid Batches"});
        }
    }
    else {
        res.status(404).send({message: "Unauthorized Access Denied"});
    }

};

// controller to render account terms accept or decline page
exports.accountTermsController = function(req, res){
    res.render('common/account_terms');
};

// controller to set or unset account_terms_accepted flag in user based on user response of account terms page
exports.accountTermsResponseController = function(req, res){

    // function fetch current user company and sens in successCallback
    function getUserCompany(user, successCallback, errorCallback){
        if(user.get("company")){
            user.get("company").fetch().then(successCallback, errorCallback);
        }
        else {
            successCallback();
        }
    }

    function formatLongDate(date) {
        commonUtils.addOffsetInDate((-1 * commonConstants.CST_TO_UTC_OFFSET), date);
        var hours = date.getHours(),
            minutes = date.getMinutes(),
            seconds = date.getSeconds(),
            timePostfix = (hours >= 12) ? "PM" : "AM";
        hours = (hours % 12 == 0) ? 12 : hours % 12;
        return commonConstants.SHORT_MONTH_NAME_MAP[date.getMonth()] + ' ' + date.getDate() + ","+ date.getFullYear() + " " + hours + ":" + minutes+":" + seconds + " " +timePostfix+ " CST";
    }

    var currentUser = req.currentUser,
        termsAccepted = (req.body.accepted === "true") ? true : false,  // true if user clicked "I AGREE" button, false on otherwise
        previousAgreemetResponse = currentUser.get("account_terms_accepted"),
        settingQuery= new Parse.Query("Settings"),
        today = new Date();
    if(!previousAgreemetResponse && previousAgreemetResponse !== termsAccepted) {
        currentUser.set("account_terms_accepted", termsAccepted);
        currentUser.set("account_terms_accepted_at", today);
        currentUser.save().then(function () {
            settingQuery.containedIn("name", [appSettings.CAMPAIGN, appSettings.PARDOT_EMAIL_TEMPLATE_NAME.EMAIL_LAYOUT, appSettings.PARDOTS_LIST_NAMES.ACCOUNT_TERMS_ACCEPTED_EMAIL_LIST]);
            settingQuery.find().then(function(settings) {
                if(settings.length === 3) {
                    var settingsMap = {};

                    // maps the id's with name of the settings
                    for (var index in settings) {
                        settingsMap[settings[index].get("name")] = parseInt(settings[index].get("value"));
                    }
                    getUserCompany(currentUser, function (company) {  // fetch user company
                        var context = {  // context variable for rendring email template
                            userName: currentUser.get("first_name") + " " + currentUser.get("last_name"),
                            userId: currentUser.id,
                            userEmail: currentUser.get("email"),
                            layout: 'user/email_base',
                            baseUrl: appSettings.PROTOCOL + appSettings.DOMAIN,
                            userCompanyName: (company) ? company.get("name") ? company.get("name") : "" : "",
                            formattedDate: formatLongDate(new Date(today.getTime()))
                        };

                        // render email template
                        res.render("user/_account_terms_accepted_email_template", context, function (error, html) {
                            if (!error) {  // if rendered successfully
                                commonUtils.fetchApiKeyAndSendMailToList({   // send email to the admin's email list
                                    list_ids: settingsMap[appSettings.PARDOTS_LIST_NAMES.ACCOUNT_TERMS_ACCEPTED_EMAIL_LIST],  // list id of the admins whom we need to send email
                                    campaign_id: settingsMap[appSettings.CAMPAIGN],
                                    email_template_id: settingsMap[appSettings.PARDOT_EMAIL_TEMPLATE_NAME.EMAIL_LAYOUT],
                                    html_content: html,  // email template
                                    from_email: currentUser.get("email"),
                                    from_name: currentUser.get("first_name"),
                                    name: "Account Terms Accepted",
                                    subject: context.userName + " has accepted terms"
                                }, function () {
                                    res.redirect(req.app.namedRoutes.build('user.myPQ'));
                                }, req.errorCallback);
                            }
                            else {
                                req.errorCallback(error);
                            }
                        })
                    }, req.errorCallback);
                }
                else{
                    console.error("Settings missing while sending accepted terms mail.")
                    res.redirect(req.app.namedRoutes.build('user.myPQ'));
                }

            }, req.errorCallback);
        }, req.errorCallback);
    }
    else{
        res.redirect(req.app.namedRoutes.build('user.myPQ'));
    }
};

// function to send PBR data lookup request mail to all the admin for current user
exports.sendFixPbrMailController = function(req, res){

    // function fetch current user company and sens in successCallback
    function getUserCompanyName(user, successCallback, errorCallback){
        if(user.get("company")){
            user.get("company").fetch().then(successCallback, errorCallback);
        }
        else {
            successCallback();
        }
    }

    var currentUser = req.currentUser,
        userPhoneId = currentUser.get("phoneId"),  // current user phoneID
        userIdentifierSource = currentUser.get("identifierSource");  // current user identifierSource

    // verify if current user actually missing PBR data
    if (typeof userPhoneId !== "string" || typeof userIdentifierSource !== "string" || userPhoneId.trim() === "" || userIdentifierSource.trim() === ""){
        var settingQuery = new Parse.Query("Settings");

        // to get id of campaign and blank email template
        settingQuery.containedIn("name", [appSettings.CAMPAIGN, appSettings.PARDOT_EMAIL_TEMPLATE_NAME.EMAIL_LAYOUT]);
        settingQuery.find().then(function(settings){
            var settingsMap = {};

            // maps the id's with name of the settings
            for(var index in settings){
                settingsMap[settings[index].get("name")] = parseInt(settings[index].get("value"));
            }

            getUserCompanyName(currentUser, function(company){  // fetch user company
                var context = {  // context variable for rendring email template
                    userName: currentUser.get("first_name")+ " " + currentUser.get("last_name"),
                    userId: currentUser.id,
                    userEmail: currentUser.get("email"),
                    layout : 'user/email_base',
                    baseUrl: appSettings.PROTOCOL + appSettings.DOMAIN,
                    userCompany: company
                };

                // render email template
                res.render("user/fix_pbr_email_template", context, function(error, html){
                    if(!error){  // if rendered successfully
                        commonUtils.fetchApiKeyAndSendMailToList({   // send email to the admin's email list
                            list_ids: appSettings.REPORT_ERROR_MAIL_DATA.ADMIN_LIST_ID,  // list id of the admins whom we need to send email
                            campaign_id: settingsMap[appSettings.CAMPAIGN],
                            email_template_id: settingsMap[appSettings.PARDOT_EMAIL_TEMPLATE_NAME.EMAIL_LAYOUT],
                            html_content: html,  // email template
                            from_email: currentUser.get("email"),
                            from_name : currentUser.get("first_name"),
                            name: "PBR Data Missing",
                            subject: currentUser.get("first_name")+"'s PBR Data Missing"
                        }, function(){
                            res.send({success: true});
                        }, req.errorCallback);
                    }
                    else{
                        req.errorCallback(error);
                    }
                })
            }, req.errorCallback);
        }, req.errorCallback);
    }
    else{
        res.status(404).send();
    }
};

// controller that renders the pdf report pages
exports.getPdfReportController = function (req, res) {

    var currentUser = Parse.User.current(),
        errorCallback = req.errorCallback,
        context = {},
        primaryPersonalityPointer = currentUser.get('primary_personality');

    primaryPersonalityPointer.fetch().then(function (primaryPersonality) {
        context = {
            user: currentUser,  // To get user's name and occupation
            layout: 'layout_partial',
            header_footer: false,
            superPowerTagLineMap: userConstants.DARK_SUPERPOWER_TAGLINE_MAP, // map for super power tag line image
            personalityPqIconsMap: userConstants.PERSONALITY_PQ_ICONS_MAP,
            personalityPqTextMap: userConstants.PERSONALITY_PQ_TEXT_MAP,
            personalityDescriptionBody: userConstants.PERSONALITY_DESCRIPTION_BODY_MAP[primaryPersonality.get('name').toLowerCase()],
            iconClassMap: userConstants.PERSONALITY_ICON_CLASS_MAP, // map for personality icon class
            primaryPersonality: primaryPersonality,  // primaryPersonality for users
            headerWrapperClass: userConstants.REPORT_CLASS_MAP[  // controls header background and color
                primaryPersonality.get('name').toLowerCase()] || 'doer-details-report',
            textColor: userConstants.PERSONALITY_COLOR_MAP[primaryPersonality.get('name').toLowerCase()],
            communicationDetails: userConstants.PERSONALITY_COMMUNICATION_MAP[primaryPersonality.get('name').toLowerCase()]
        };
        utils.getAboutMeContent(currentUser, function (data) {
            _.extend(context, data); // appends receive data with the context
            res.render('pdf_report/_report_cover_page', {layout: 'layout_partial', header_footer: false}, function(error, coverPage) {
                res.render('pdf_report/_north_america_workstyle_distribution_page', {layout: 'layout_partial', header_footer: false}, function(error, distributionPage) {
                    res.render('pdf_report/_user_personality_details', context, function(error, personalityDetailsPage) {
                        res.render('pdf_report/_user_details', context, function(error, userDetailsPage) {
                            res.render(userConstants.REPORT_PERSONALITY_DESCRIPTION_VIEW_MAP[primaryPersonality.get('name').toLowerCase()], context, function(error, personalityMattersPage) {
                                res.send({
                                    success: true,
                                    coverPage: coverPage,
                                    distributionPage: distributionPage,
                                    personalityDetailsPage: personalityDetailsPage,
                                    userDetailsPage: userDetailsPage,
                                    personalityMattersPage: personalityMattersPage
                                });
                            });
                        });
                    });
                });
            });
        }, errorCallback);
    }, errorCallback);
};
