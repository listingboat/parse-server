var _ = require('underscore'),
    companyUtils = require('cloud/apps/company/utils.js'),
    configs = require('cloud/app_settings.js'),
    userSettingsConstants = require('cloud/apps/user_settings/constants.js'),
    userConstants = require('cloud/apps/user/constants.js'),
    leaderBoardConstants = require('cloud/apps/leader_board/constants.js'),
    analyticsUtils = require('cloud/apps/analytics/utils.js'),
    commonUtils = require('cloud/apps/common/utils.js'),
    userSettingsUtils = require('cloud/apps/user_settings/utils.js'),
    appSettings = require('cloud/app_settings.js');

// renders explore page(s)
exports.getUserSettingsPageController = function (req, res) {

    var departmentId = req.query.department || req.body.department || null,
        searchKey = req.query.searchKey || req.body.searchKey || null,
        pageToDisplay = req.query.page || req.body.page || 1,
        companyId = req.query.companyId || req.body.companyId || req.params.companyId || (req.currentUser.get('company') || {}).id,
        currentUser = req.currentUser,
        isSuperAdmin = (userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === currentUser.get('permission_type')),
        userQuery, updatedUrl, isCompletePage = req.body.isCompletePage || req.query.isCompletePage;
    // generate updated url with current filters
    updatedUrl = req.app.namedRoutes.build('userSettings.indexWithCompanyId', {companyId: companyId});

    if(departmentId){
        updatedUrl = commonUtils.updateQueryStringParameter(updatedUrl, "department", departmentId);
    }
    if(searchKey){
        updatedUrl = commonUtils.updateQueryStringParameter(updatedUrl, "searchKey", searchKey);
    }
    if(pageToDisplay){
        updatedUrl = commonUtils.updateQueryStringParameter(updatedUrl, "page", pageToDisplay);
    }
    if(isCompletePage){
        updatedUrl = commonUtils.updateQueryStringParameter(updatedUrl, "isCompletePage", isCompletePage);
    }

    analyticsUtils.getCompanyAndCompanyList(currentUser, isSuperAdmin, companyId, function (company, companyList) {
        // if search keyword are received in filter
        if (typeof searchKey === "string" && searchKey.trim() != "") {
            var searchKeyLower = searchKey.toLowerCase(),
                firstNameSearchQuery = new Parse.Query('User'),
                lastNameSearchQuery = new Parse.Query('User'),
                emailSearchQuery = new Parse.Query('User'),
                titleSearchQuery = new Parse.Query('User');
            firstNameSearchQuery.startsWith("first_name_lower_case", searchKeyLower);  // look for keyword in first name
            lastNameSearchQuery.startsWith("last_name_lower_case", searchKeyLower);  // look for keyword in last name
            emailSearchQuery.startsWith("email", searchKeyLower);   // look for keyword in email
            titleSearchQuery.startsWith("title_lower_case", searchKeyLower);   // look for keyword in email
            userQuery = Parse.Query.or(firstNameSearchQuery, lastNameSearchQuery, emailSearchQuery, titleSearchQuery);  // OR query
        }
        else {
            userQuery = new Parse.Query(Parse.User);
        }
        userQuery.include('department', 'primary_personality');
        userQuery.notEqualTo("is_deleted", true);  // exclude deleted user object

        // department filtering
        if (typeof departmentId === "string" && departmentId !== '') {
            var Department = Parse.Object.extend('Department'),
                departmentObject = new Department();
            departmentObject.id = departmentId;
            userQuery.equalTo('department', departmentObject)
        }

        // show only current user's company employees
        userQuery.equalTo('company', company);

        userQuery.count({
            success: function (totalCount) {

                //pagination
                userQuery.skip((pageToDisplay - 1) * userSettingsConstants.USER_PER_PAGE);
                userQuery.limit(userSettingsConstants.USER_PER_PAGE);

                // include primary personality object and company object with users
                userQuery.include('company', 'primary_personality', 'department');
                userQuery.find({
                    success: function (userObjectList) {
                        var departmentQuery = new Parse.Query('Department');
                        departmentQuery.equalTo('company', company);
                        departmentQuery.find({
                                success: function (departments) {
                                    var sortedDepartmentLists = companyUtils.getSortedDepartmentHierarchyList(departments),
                                        userCount = userObjectList.length,
                                        context = {
                                            userObjectList: userObjectList,
                                            departments: departments,
                                            userCount: userCount,
                                            totalCount: totalCount,
                                            pageToDisplay: pageToDisplay,
                                            userPerPage: userSettingsConstants.USER_PER_PAGE,
                                            departmentId: departmentId,
                                            searchKey: searchKey,
                                            company: company,
                                            companyList: companyList,
                                            personalityIconMap: leaderBoardConstants.PERSONALITY_ICON_MAP,
                                            permissionTypeList: userSettingsConstants.PERMISSION_TYPES_LIST,
                                            regularUserPermission: userConstants.USER_PERMISSION_TYPE.MEMBER,
                                            settingType: 'user_settings',
                                            isSuperAdmin: isSuperAdmin,
                                            user: req.currentUser,
                                            getPermissionTypeIndex: userSettingsUtils.getPermissionTypeIndex,
                                            contactUS: configs.CONTACT_US_EMAIL,    // email address for contact us button
                                            firstNameMaxLength: userConstants.FIRST_NAME_MAX_LENGTH,
                                            lastNameMaxLength: userConstants.LAST_NAME_MAX_LENGTH,
                                            positionTitleMaxLength: userConstants.POSITION_TITLE_MAX_LENGTH,
                                            phoneIdMaxLength: userConstants.PHONE_ID_MAX_LENGTH,
                                            identifierSourceMaxLength: userConstants.IDENTIFIER_SOURCE_MAX_LENGTH
                                        };
                                    _.extend(context, sortedDepartmentLists);
                                    if (!req.xhr) {
                                        res.render('user_settings/index', context);
                                    }
                                    else if (isCompletePage){
                                        res.render('user_settings/_user_management', _.extend(context, {layout: 'layout_partial'}), function(error, html) {
                                            res.send({
                                                html: html,
                                                updatedUrl: updatedUrl,
                                                companyId: companyId
                                            });
                                        });
                                    }
                                    else {
                                        var pageToRender = (userCount > 0) ? "user_settings/_user_list" : "user_settings/_empty_user_list";
                                        res.render(pageToRender, _.extend(context, {layout: 'layout_partial'}), function (error, html) {
                                            res.send({
                                                userListHtml: html,
                                                userCount: userCount,
                                                totalCount: totalCount,
                                                pageToDisplay: pageToDisplay,
                                                departmentId: departmentId,
                                                companyId: companyId,
                                                searchKey: searchKey,
                                                updatedUrl: updatedUrl
                                            });
                                        });
                                    }
                                },
                                error: req.errorCallback
                            }
                        );
                    },
                    error: req.errorCallback
                });
            },
            error: req.errorCallback
        });

    }, req.errorCallback);
};

// renders explore page(s) for invited users that have not yet been registered.
exports.getInvitedUserSettingsPageController = function (req, res) {

    var departmentId = 'invitedUsers',
        searchKey = req.query.searchKey || req.body.searchKey || null,
        pageToDisplay = req.query.page || req.body.page || 1,
        companyId = req.query.companyId || req.body.companyId || req.params.companyId || (req.currentUser.get('company') || {}).id,
        currentUser = req.currentUser,
        isSuperAdmin = (userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === currentUser.get('permission_type')),
        userQuery = new Parse.Query('Invited_User'), updatedUrl,  isCompletePage = req.body.isCompletePage;

    updatedUrl = req.app.namedRoutes.build('userSettings.invitedUsersWithCompanyId', {companyId: companyId});

    if(searchKey){
        updatedUrl = commonUtils.updateQueryStringParameter(updatedUrl, "searchKey", searchKey);
    }
    if(pageToDisplay){
        updatedUrl = commonUtils.updateQueryStringParameter(updatedUrl, "page", pageToDisplay);
    }
    if(isCompletePage){
        updatedUrl = commonUtils.updateQueryStringParameter(updatedUrl, "isCompletePage", isCompletePage);
    }

    analyticsUtils.getCompanyAndCompanyList(currentUser, isSuperAdmin, companyId, function (company, companyList) {
        // if search keyword are received in filter
        if (typeof searchKey === "string" && searchKey.trim() != "") {
            var searchKeyLower = searchKey.toLowerCase();
            userQuery.startsWith("email", searchKeyLower);   // look for keyword in email
        }

        // show only current user's company employees
        userQuery.equalTo('company', company);

        // only show users who have not registered yet
        userQuery.doesNotExist('user');

        userQuery.count({
            success: function (totalCount) {

                //pagination
                userQuery.skip((pageToDisplay - 1) * userSettingsConstants.USER_PER_PAGE);
                userQuery.limit(userSettingsConstants.USER_PER_PAGE);

                userQuery.find({
                    success: function (userObjectList) {
                        var departmentQuery = new Parse.Query('Department');
                        departmentQuery.equalTo('company', company);
                        departmentQuery.find({
                                success: function (departments) {
                                    var sortedDepartmentLists = companyUtils.getSortedDepartmentHierarchyList(departments);
                                    var userCount = userObjectList.length,
                                        context = {
                                            userObjectList: userObjectList,
                                            departments: departments,
                                            userCount: userCount,
                                            totalCount: totalCount,
                                            pageToDisplay: pageToDisplay,
                                            userPerPage: userSettingsConstants.USER_PER_PAGE,
                                            departmentId: departmentId,
                                            searchKey: searchKey,
                                            company: company,
                                            companyList: companyList,
                                            personalityIconMap: leaderBoardConstants.PERSONALITY_ICON_MAP,
                                            permissionTypeList: userSettingsConstants.PERMISSION_TYPES_LIST,
                                            regularUserPermission: userConstants.USER_PERMISSION_TYPE.MEMBER,
                                            settingType: 'user_settings',
                                            isSuperAdmin: isSuperAdmin,
                                            user: req.currentUser,
                                            getPermissionTypeIndex: userSettingsUtils.getPermissionTypeIndex,
                                            contactUS: configs.CONTACT_US_EMAIL,   // email address for contact us button
                                            firstNameMaxLength: userConstants.FIRST_NAME_MAX_LENGTH,
                                            lastNameMaxLength: userConstants.LAST_NAME_MAX_LENGTH,
                                            positionTitleMaxLength: userConstants.POSITION_TITLE_MAX_LENGTH,
                                            phoneIdMaxLength: userConstants.PHONE_ID_MAX_LENGTH,
                                            identifierSourceMaxLength: userConstants.IDENTIFIER_SOURCE_MAX_LENGTH,
                                            showInvitedUser: true
                                        };
                                    _.extend(context, sortedDepartmentLists);
                                    if (!req.xhr) {
                                        res.render('user_settings/index', context);
                                    }
                                    else if (req.body.isCompletePage || req.query.isCompletePage){
                                        res.render('user_settings/_user_management', _.extend(context, {layout: 'layout_partial'}), function(error, html) {
                                            res.send({
                                                html: html,
                                                updatedUrl: updatedUrl,
                                                companyId: companyId
                                            });
                                        });
                                    }
                                    else {
                                        var pageToRender = (userCount > 0) ? "user_settings/_invited_user_list" : "user_settings/_empty_user_list";
                                        res.render(pageToRender, _.extend(context, {layout: 'layout_partial'}), function (error, html) {
                                            res.send({
                                                userListHtml: html,
                                                userCount: userCount,
                                                totalCount: totalCount,
                                                pageToDisplay: pageToDisplay,
                                                departmentId: departmentId,
                                                companyId: companyId,
                                                searchKey: searchKey,
                                                updatedUrl: updatedUrl
                                            });
                                        });
                                    }
                                },
                                error: req.errorCallback
                            }
                        );
                    },
                    error: req.errorCallback
                });
            },
            error: req.errorCallback
        });

    }, req.errorCallback);
};

exports.sendInviteReminderController = function(req, res) {
    var currentUser = req.currentUser,
        invitedUserId = req.body.invitedUserId,
        invitedUserQuery = new Parse.Query('Invited_User');
    invitedUserQuery.doesNotExist('user');


    invitedUserQuery.get((typeof invitedUserId === "string" ? invitedUserId.trim() : ""), {
        success: function(user) {
            if(user) {
                if (currentUser && (currentUser.get('permission_type') === userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN || (
                    currentUser.get('permission_type') === userConstants.USER_PERMISSION_TYPE.ACCOUNT_OWNER && user.get('company') && currentUser.get('company') && user.get('company').id === currentUser.get('company').id))) {

                    userSettingsUtils.sendInviteUserMail(user, function () {
                        res.send({success: true});
                    }, function () {
                        res.send({success: false});
                    });
                } else {
                    res.status(403);
                }
            } else {
                res.send({success: false});
            }
        }, error: function(error) {
            console.error(error);
            res.send({success: false});
        }
    });
};

exports.removeInvitedUserController = function(req, res) {
    var currentUser = req.currentUser,
        invitedUserEmail = req.body.invitedUserEmail,
        invitedUserQuery = new Parse.Query('Invited_User');
    invitedUserQuery.doesNotExist('user');
    invitedUserQuery.equalTo('email', (typeof invitedUserEmail === "string" ? invitedUserEmail.trim() : ""));
    invitedUserQuery.find({
        success: function(users) {
            if(users.length > 0) {
                var isValid = false;
                for (var userIndex in users) {
                    var user = users[userIndex];
                    if (currentUser && (currentUser.get('permission_type') === userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN || (
                        currentUser.get('permission_type') === userConstants.USER_PERMISSION_TYPE.ACCOUNT_OWNER && user.get('company') && currentUser.get('company') && user.get('company').id === currentUser.get('company').id))) {
                        isValid = true;
                        break;
                    }
                }
                if (isValid) {
                    Parse.Object.destroyAll(users, {
                        success: function () {
                            exports.getInvitedUserSettingsPageController(req, res);
                        }
                    });
                } else {
                    res.status(403);
                }
            } else {
                res.status(404);
            }
        }, error: function(error) {
            console.error(error);
            res.send({success: false});
        }
    });
};

exports.deleteInvitedUserFromPardotLists = function(req, res) {
    var currentUser = req.currentUser,
        userEmail =  typeof req.query.userEmail === "string"? req.query.userEmail.trim() : "",
        companyId =  typeof req.query.companyId === "string"? req.query.companyId.trim() : "",
        companyQuery = new Parse.Query("Company"),
        invitedUserQuery = new Parse.Query('Invited_User'),
        successCallback, errorCallback;

    successCallback = function(company) {
        var pardotData = {},
            settingQuery = new Parse.Query("Settings");
        pardotData.email = userEmail;  // add user email in pardot data
        if (company !== undefined)
            pardotData["list_" + company.get('pardot_list_id')] = 0;  // add user's company's list in exclude list
        settingQuery.equalTo("name" , appSettings.PARDOTS_LIST_NAMES.INVITE_LIST);
        settingQuery.first().then(function(setting) {  // get list id
            pardotData["list_" + setting.get("value")] = 0;  // add invite list in exclude list
            commonUtils.updateUserPardotProspect(pardotData, false, function () {  // update user prospect
                res.send({success: true});
            }, function () {
                res.send({success: false});
            });
        });
    };

    errorCallback = function() {
        res.status(403);
    };

    if (currentUser && (currentUser.get('permission_type') === userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN || (
        currentUser.get('permission_type') === userConstants.USER_PERMISSION_TYPE.ACCOUNT_OWNER && currentUser.get('company') && currentUser.get('company').id === companyId))) {
        invitedUserQuery.equalTo('email', userEmail);
        invitedUserQuery.find().then(function (invitedUser) {
            if (invitedUser.length === 0) {
                companyQuery.get(companyId, {
                    success: function (company) {
                        successCallback(company);
                    }, error: function () {
                        successCallback();
                    }
                });
            } else {
                errorCallback();
            }
        }, errorCallback);
    } else {
        errorCallback();
    }
};

exports.changeUserDepartmentController = function(req, res){
    var userId = req.body.user_id,
        departmentId = req.body.department_id;

    if(typeof userId === "string" && typeof departmentId === "string" && userId.trim() !== "" && departmentId.trim() !== "") {
        Parse.Cloud.useMasterKey();
        var userQuery = new Parse.Query(Parse.User);
        userQuery.include('primary_personality', 'company', 'department');
        userQuery.descending('createdAt');
        userQuery.get(userId.trim(), {
            success: function(user){
                var departmentQuery = new Parse.Query("Department");
                departmentQuery.get(departmentId.trim(), {
                    success: function (department) {
                        if (
                            department &&
                            (department.get('company') || {}).id === (user.get('company') || {}).id &&
                            (req.currentUser.get('permission_type') === userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN ||
                                (
                                    req.currentUser.get('permission_type') === userConstants.USER_PERMISSION_TYPE.ACCOUNT_OWNER &&
                                    req.currentUser.get('company') && req.currentUser.get('company').id === (user.get('company') || {}).id
                                )
                            )
                        ) {
                            // find current department in department list
                            var previousDepartment = user.get('department'),
                                objectsToSave = [],
                                primaryPersonality = user.get('personality');
                            if (!(previousDepartment) || (previousDepartment && previousDepartment.id != department.id)) {
                                if (previousDepartment) {
                                    previousDepartment.increment("user_count", -1);  // decrement the user count of current department
                                    // decrement the user count of current department's parent department if any
                                    if (previousDepartment.get("parent_department")) {
                                        previousDepartment.get("parent_department").increment("user_count", -1);
                                    }
                                }

                                department.increment("user_count"); // increment the user count of new department
                                // increment the user count of new department's parent if any
                                if (department.get("parent_department")) {
                                    department.get("parent_department").increment("user_count");
                                }
                                if (primaryPersonality) {  // if user has primary personality
                                    // reduce workstyle count from the pervious department
                                    if (previousDepartment) {
                                        previousDepartment.increment(primaryPersonality.get("name").toLowerCase() + "_count", -1);
                                        if (previousDepartment.get("parent_department")) {
                                            previousDepartment.get("parent_department").increment(primaryPersonality.get("name").toLowerCase() + "_count", -1);
                                        }
                                    }
                                    // increment workstyle count in new department
                                    department.increment(primaryPersonality.get("name").toLowerCase() + "_count");

                                    if (department.get("parent_department")) {
                                        department.get("parent_department").increment(primaryPersonality.get("name").toLowerCase() + "_count");
                                    }
                                }
                                user.set("department", department);
                                if (previousDepartment) {
                                    objectsToSave.push(previousDepartment);
                                }
                                objectsToSave.push(user);

                                Parse.Object.saveAll(objectsToSave, {
                                    success: function(){
                                        res.send({
                                            success: true
                                        });
                                    },
                                    error: req.errorCallback
                                })

                            }
                        }
                        else {
                            res.status(404).end();
                        }
                    },
                    error: req.errorCallback
                });
            },
            error: req.errorCallback
        })
    }
    else{
        res.status(404).end();
    }

};

exports.changePermissionTypeController = function(req, res){
    var userId = req.body.user_id,
        permissionType = req.body.permission_type;

    if(typeof userId === "string" && typeof permissionType === "string" && userId.trim() !== "" && permissionType.trim() !== "") {
        Parse.Cloud.useMasterKey();
        var userQuery = new Parse.Query(Parse.User);
        userQuery.include('primary_personality', 'company', 'department');
        userQuery.get(userId.trim(), {
            success: function(user){
                var userPermissionIndex = userSettingsUtils.getPermissionTypeIndex(userSettingsConstants.PERMISSION_TYPES_LIST, user.get('permission_type')),
                    currentUserPermissionIndex = userSettingsUtils.getPermissionTypeIndex(userSettingsConstants.PERMISSION_TYPES_LIST, req.currentUser.get('permission_type')),
                    userNewPermissionIndex = userSettingsUtils.getPermissionTypeIndex(userSettingsConstants.PERMISSION_TYPES_LIST, permissionType);

                if (
                    (req.currentUser.get('permission_type') === userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN ||
                        (
                            req.currentUser.get('permission_type') === userConstants.USER_PERMISSION_TYPE.ACCOUNT_OWNER &&
                            req.currentUser.get('company') && req.currentUser.get('company').id === (user.get('company') || {}).id
                        )
                    ) && userNewPermissionIndex >= currentUserPermissionIndex && userPermissionIndex >= currentUserPermissionIndex) {
                    user.set("permission_type", permissionType);
                    user.save(null, {
                        success: function () {
                            res.send({success: true});
                        },
                        error: req.errorCallback
                    });
                }
                else {
                    res.status(404).end();
                }
            },
            error: req.errorCallback
        })
    }
    else{
        res.status(404).end();
    }
};


// controller to delete a user
exports.deleteUserController = function(req, res){
    var userId = (typeof req.body.userId  === "string") ? req.body.userId.trim() : "",
        currentUser = req.currentUser,
        isSuperAdmin = res.locals.isSuperAdmin,
        isAccountOwner = res.locals.isAccountOwner,
        currentUserCompany = currentUser.get("company") || {};
    userSettingsUtils.getActiveUserById(userId, ["primary_personality", "company", "department"], function(user){  // get the user object with received user id

        if(user){
            var userCompany = user.get("company") || {};
            if(isSuperAdmin || (isAccountOwner && userCompany.id === currentUserCompany.id)){
                var userDepartment = user.get("department"),
                    userPrimaryPersonality = user.get("primary_personality");
                if(userDepartment){
                    var parentDepartment = userDepartment.get("parent_department");
                    userDepartment.increment("user_count", -1);
                    if(parentDepartment){
                        parentDepartment.increment("user_count", -1);
                    }
                    if(userPrimaryPersonality){
                        if(parentDepartment){
                            parentDepartment.increment(userPrimaryPersonality.get("name").toLowerCase() + "_count", -1);
                        }
                        userDepartment.increment(userPrimaryPersonality.get("name").toLowerCase() + "_count", -1)
                    }
                }

                if(userCompany){
                    userCompany.increment("user_count", -1);
                    if(userPrimaryPersonality){
                        userCompany.increment(userPrimaryPersonality.get("name").toLowerCase() + "_count", -1)
                    }
                }

                Parse.Cloud.useMasterKey();
                user.set("is_deleted", true);
                user.save().then(function(){
                    exports.getUserSettingsPageController(req, res);  // it'll refresh the page with given filters and exclude the deleted user
                }, req.errorCallback);
            }
            else{
                res.status(404).end();
            }
        }
        else{
            res.status(404).end();
        }
    }, req.errorCallback);
};

// controller to delete user prospect from all lists of pardot
exports.deletePardotProspectFromLists = function(req, res){
    var userId = (typeof req.query.userId === "string") ? req.query.userId.trim() : "",
        userQuery = new Parse.Query(Parse.User), pardotData = {};
    if(userId !== "") {
        //userQuery.equalTo("objectId", userId);
        userQuery.include("company");
        userQuery.get(userId).then(function(user){  // get the user
            if(user  && user.get("is_deleted") === true){  // check if user is found and deleted from workstyle
                pardotData.email = user.get("email");  // add user email in pardot data

                if(user.get("company") && user.get("company").get("pardot_list_id")){  // add user's company's list in exclude list
                    pardotData["list_" + user.get("company").get("pardot_list_id")] = 0;
                }
                var settingQuery = new Parse.Query("Settings");

                // get all the pardot list names of the app
                var pardotListsToExclude = [ 
                    appSettings.PARDOTS_LIST_NAMES.ASSESSMENT_COMPLETE,
                    appSettings.PARDOTS_LIST_NAMES.FRIEND_INVITE_LIST,
                    appSettings.PARDOTS_LIST_NAMES.INVITE_LIST,
                    appSettings.PARDOTS_LIST_NAMES.MIGRATED_ASSESSMENT_COMPLETE,
                    appSettings.PARDOTS_LIST_NAMES.REGISTER_LIST
                ];
                settingQuery.containedIn("name" , pardotListsToExclude);
                settingQuery.find().then(function(settings){  // get list id of all the lists
                    if(Array.isArray(settings)){
                        for (var index in settings){  // add each list in exclude list
                            pardotData["list_" + settings[index].get("value")] = 0;
                        }
                    }
                    if(Object.keys(pardotData).length > 1) {
                        commonUtils.updateUserPardotProspect(pardotData, false, function () {  // update user prospect
                            res.send({success: true});
                        }, function () {
                            res.send({success: false});
                        });
                    }
                    else{
                        res.send({success: false});
                    }
                }, req.errorCallback);
            }
            else{
                res.send({success: false});
            }
        }, req.errorCallback);
    }
    else{
        res.send({success: false});
    }
};


// controller to edit user detail
exports.editUserDetailController = function(req, res){

    // function that returns department object with given id
    function getUpdatedUserDepartment(user, departmentId, successCallback){
        if(user.get("department") && user.get("department").id === departmentId){
            successCallback(user.get("department"));
        }
        else{
            var departmentQuery = new Parse.Query("Department");
            departmentQuery.equalTo("company", user.get("company"));
            departmentQuery.include("parent_department");
            departmentQuery.get(departmentId, function(department){
                successCallback( department);
            }, req.errorCallback);
        }
    }

    var userQuery = new Parse.Query(Parse.User),
        currentUser = req.currentUser,
        formData = {
            userId: (typeof req.body.userId === "string") ? req.body.userId.trim(): "",
            firstName: (typeof req.body.first_name === "string") ? req.body.first_name.trim(): "",
            lastName: (typeof req.body.last_name === "string") ? req.body.last_name.trim(): "",
            positionTitle: (typeof req.body.position_title === "string") ? req.body.position_title.trim(): "",
            phoneNumber: (typeof req.body.phone_number === "string") ? req.body.phone_number.trim(): "",
            permissionType: (typeof req.body.permission_type === "string") ? req.body.permission_type.trim(): "",
            departmentId: (typeof req.body.department === "string") ? req.body.department.trim(): "",
            phoneId: (typeof req.body.phoneId === "string" && req.body.phoneId.trim() !== "") ? req.body.phoneId.trim(): null,
            identifierSource: (typeof req.body.identifierSource === "string" && req.body.identifierSource.trim() !== "") ? req.body.identifierSource.trim(): null
        };
    userQuery.include("company");
    userQuery.include("department");
    userQuery.include("department.parent_department");
    userQuery.include("primary_personality");
    userQuery.get(formData.userId).then(function(user){  // fetch user with given id
        if(user){
            if(res.locals.isSuperAdmin ||(currentUser.get("company") && user.get("company") && currentUser.get("company").id === user.get("company").id)){
                getUpdatedUserDepartment(user, formData.departmentId, function(department){
                    formData.department = department;
                    userSettingsUtils.validateUserDetails(formData, user, currentUser, function(isValid, form_errors, errorMessage){
                        if(isValid){
                            userSettingsUtils.updateUserDetails(formData, user, function(pardotDataDict){
                                res.send({
                                    success: true,
                                    first_name: formData.firstName,
                                    last_name: formData.lastName,
                                    position_title: formData.positionTitle,
                                    phone_number: formData.phoneNumber,
                                    department: formData.departmentId,
                                    permission_type: formData.permissionType,
                                    phoneId: formData.phoneId,
                                    identifierSource: formData.identifierSource,
                                    pardotDataDict: pardotDataDict
                                });
                            }, req.errorCallback);
                        }
                        else{
                            res.send({success: false, userDetailFormError: true, formErrors: form_errors, errorMessage: errorMessage});
                        }
                    })
                });
            }
            else{
                res.status(404).send({msg: "Unauthorized Access Denied"})
            }
        }
        else{
            res.send({success: false, errorMessage: "Invalid User"});
        }
    }, function(error){
        if(error.code === 101){
            res.send({success: false, errorMessage: "Invalid User"});
        }
        else{
            req.errorCallback();
        }
    });
};
