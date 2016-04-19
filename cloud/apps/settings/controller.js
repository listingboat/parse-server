// All controllers for Settings app

var configs =require('cloud/app_settings.js'),
    settingUtils = require('cloud/apps/settings/utils.js'),
    commonUtils = require('cloud/apps/common/utils.js'),
    companyUtils = require('cloud/apps/company/utils.js'),
    userUtils = require('cloud/apps/user/utils.js'),
    analyticsUtils = require('cloud/apps/analytics/utils.js'),
    quizUtils = require('cloud/apps/quiz/utils.js'),
    secret = require('cloud/secret.js'),
    appSettings = require('cloud/app_settings.js'),
    _ = require('underscore'),
    md5 = require('cloud/packages/md5.js'),
    settingConstants = require('cloud/apps/settings/constants.js'),
    userConstants = require('cloud/apps/user/constants.js'),
    companyConstants = require('cloud/apps/company/constants.js'),
    commonConstants = require('cloud/apps/common/constants.js');

// controller that renders account setting page
exports.accountSettingsController = function(req, res){
    var currentUser = req.currentUser,
        errorCallback = req.errorCallback,
        context = {
            settingType: 'account',    // show account setting page and highlights the account setting on nav bar
            contactUS: configs.CONTACT_US_EMAIL,    // email address for contact us button
            user: currentUser,
            isAccountOwner : (userConstants.USER_PERMISSION_TYPE.ACCOUNT_OWNER === currentUser.get('permission_type')),    // true if user is account owner
            isSuperAdmin : (userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === currentUser.get('permission_type')),    // true if user is super admin
            firstNameMaxLength: userConstants.FIRST_NAME_MAX_LENGTH,
            lastNameMaxLength: userConstants.LAST_NAME_MAX_LENGTH,
            positionTitleMaxLength: userConstants.POSITION_TITLE_MAX_LENGTH
        };
    settingUtils.fetchDepartmentListIfUserWithCompany(currentUser, function(departmentList){
        var sortedDepartmentLists = companyUtils.getSortedDepartmentHierarchyList(departmentList);
        var form_data = {
            firstName : currentUser.get('first_name'),
            lastName : currentUser.get('last_name'),
            userEmail : currentUser.get('email'),
            positionTitle : currentUser.get('occupation'),
            department: (currentUser.get("department"))? currentUser.get("department").id : ''
            },
            phoneNumber = (currentUser.get("phone_number")) ? currentUser.get("phone_number") : ""
        if(phoneNumber != "") {
            // format phone number to display
            phoneNumber = ["(", phoneNumber.slice(0, 3), ") ", phoneNumber.slice(3, 6), "-", phoneNumber.slice(6, 10)].join("");
        }
        form_data.phoneNumber = phoneNumber;
        _.extend(context, form_data, sortedDepartmentLists);
        res.render('settings/account.ejs', context);
    }, errorCallback)
};

exports. accountSettingUpdateController = function(req, res){

    var currentUser = req.currentUser,
        errorCallback = req.errorCallback,
        context = {
            settingType: 'account',    // show account setting page and highlights the account setting on nav bar
            contactUS: configs.CONTACT_US_EMAIL,    // email address for contact us button
            user: currentUser,
            isAccountOwner : (userConstants.USER_PERMISSION_TYPE.ACCOUNT_OWNER === currentUser.get('permission_type')),    // true if user is account owner
            isSuperAdmin : (userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === currentUser.get('permission_type')),    // true if user is super admin
            firstNameMaxLength: userConstants.FIRST_NAME_MAX_LENGTH,
            lastNameMaxLength: userConstants.LAST_NAME_MAX_LENGTH,
            positionTitleMaxLength: userConstants.POSITION_TITLE_MAX_LENGTH
        }, firstName = req.body.first_name.trim(),    // user entered first name
        lastName = req.body.last_name.trim(),    // user entered last name
        positionTitle = req.body.position_title.trim(),// user entered company
        department = req.body.department,
        phoneNumber = (typeof  req.body.phone_number === "string") ? req.body.phone_number.trim() : "",
        form_data = {
            firstName : firstName,
            lastName : lastName,
            userEmail : currentUser.get('email'),
            positionTitle : positionTitle,
            department: department,
            phoneNumber: phoneNumber
        };

    settingUtils.fetchDepartmentListIfUserWithCompany(currentUser, function(departmentList){
        var sortedDepartmentLists = companyUtils.getSortedDepartmentHierarchyList(departmentList);
        settingUtils.validateUserAccountUpdateForm(form_data, departmentList, function(isValid, form_errors){    // validates received data
            _.extend(context, form_data, sortedDepartmentLists);    // appends user entered data with context
            if(isValid) {    // if data is valid
                settingUtils.updateUserInfo(form_data, currentUser, departmentList, function(userDataForPardot){
                    _.extend(context, {success: 'true', userDataForPardot: userDataForPardot});
                    res.render('settings/account.ejs', context);
                }, errorCallback);
            }
            else{    // if entered data is not valid
                _.extend(context, form_errors);
                res.render('settings/account.ejs', context);
            }
        });
    }, errorCallback)
};

// controller that renders password setting page and updates the password
exports.passwordSettingsController = function(req, res){

    var currentUser = req.currentUser,
        context = {
            settingType: 'password',    // show password setting page and highlights the password setting on nav bar
            user : currentUser,
            isAccountOwner : (userConstants.USER_PERMISSION_TYPE.ACCOUNT_OWNER === currentUser.get('permission_type')),    // true if user is account owner
            isSuperAdmin : (userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === currentUser.get('permission_type')),    // true if user is super admin
            contactUS : configs.CONTACT_US_EMAIL    // email address for contact us button
        };
    res.render('settings/password.ejs', context);
};

exports.passwordChangeSettingsController = function(req, res){

    var currentUser = req.currentUser,
        errorCallback = req.errorCallback,
        context = {
            settingType: 'password',    // show password setting page and highlights the password setting on nav bar
            user : currentUser,
            isAccountOwner : (userConstants.USER_PERMISSION_TYPE.ACCOUNT_OWNER === currentUser.get('permission_type')),    // true if user is account owner
            isSuperAdmin : (userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === currentUser.get('permission_type')),    // true if user is super admin
            contactUS : configs.CONTACT_US_EMAIL    // email address for contact us button
        }, oldPassword = req.body.old_password,
        password1 = req.body.password1,
        password2 = req.body.password2,
        form_data = {
            oldPassword: oldPassword,
            password1: password1,
            password2: password2

        };

    settingUtils.validatePasswordUpdateForm(form_data, function(isValid, form_error){    // validates the received data
        if(isValid){    // if data is valid
            // to check if provided old password is correct
            Parse.User.logIn(currentUser.get('email'), oldPassword).then(function(user){    // if valid old password
                currentUser.set('password', password1);
                currentUser.save().then(function(){
                        settingUtils.sendPasswordChangedMail(user, function(){
                            _.extend(context, {success: true});
                            res.render('settings/password.ejs', context);
                        });
                    }, errorCallback);
            }, function(error){    // if invalid old password
                if(error.code == 101) {
                    _.extend(context, {oldPasswordError: 'Incorrect Password'});
                    res.render('settings/password.ejs', context);
                }
                else{
                    errorCallback(error);
                }
            });
        }
        else{
            _.extend(context, form_error);
            res.render('settings/password.ejs', context);
        }
    });
};

// controller that renders FAQ
exports.faqController = function(req, res){
    var currentUser = req.currentUser;
    res.render('settings/faq.ejs', {
        isAccountOwner : (userConstants.USER_PERMISSION_TYPE.ACCOUNT_OWNER === currentUser.get('permission_type')),    // true if user is account owner
        isSuperAdmin : (userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === currentUser.get('permission_type')),    // true if user is super admin
        settingType: 'faq',    // show password setting page and highlights the password setting on nav bar
        user : currentUser,
        contactUS : configs.CONTACT_US_EMAIL    // email address for contact us button
    });
};

// controller that renders invite setting page
exports.inviteSettingsController = function(req, res){
    var currentUser = req.currentUser,
        errorCallback = req.errorCallback,
        isSuperAdmin = (userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === currentUser.get('permission_type')),    // true if user is account owner
        isAccountOwner = (userConstants.USER_PERMISSION_TYPE.ACCOUNT_OWNER === currentUser.get('permission_type')),
        companyList = null,    // true if user is super admin
        context = {};

    // function to check if user's company has only default department
    function setInitialDepartmentSettingContext(context, successCallback){
          var departmentQueryObject = new Parse.Query("Department");
        departmentQueryObject.equalTo("company", currentUser.get("company"));
        departmentQueryObject.find().then(function(departmentList){
            context.isDepartmentSetupRequired = (departmentList.length == 1 && departmentList[0].get("name").toLowerCase() == companyConstants.DEFAULT_DEPARTMENT_NAME.toLowerCase());
            if(context.isDepartmentSetupRequired){
                var quizQuestionTypeQuery = new Parse.Query("Quiz_Question_Type");
                 quizQuestionTypeQuery.find().then(function(questionTypes){
                    _.extend(context, companyUtils.getInitialDepartmentSetupData(questionTypes));
                    successCallback();
                }, errorCallback);
            }
            else if(departmentList.length == 0){ // add other department to company if it does not exists
                var DepartmentModel = Parse.Object.extend("Department"),
                    departmentObject = new DepartmentModel();
                departmentObject.set("name", companyConstants.DEFAULT_DEPARTMENT_NAME);
                departmentObject.set("company", currentUser.get('company'));
                departmentObject.set("name_lower_case", companyConstants.DEFAULT_DEPARTMENT_NAME.toLowerCase());
                departmentObject.set("user_count", 0);
                departmentObject.save().then(function() {
                    context.isDepartmentSetupRequired = true;
                    var quizQuestionTypeQuery = new Parse.Query("Quiz_Question_Type");
                    quizQuestionTypeQuery.find().then(function (questionTypes) {
                        _.extend(context, companyUtils.getInitialDepartmentSetupData(questionTypes));
                        successCallback();
                    }, errorCallback);
                }, errorCallback);
            }
            else
                successCallback();
        }, errorCallback);
    }


    function render(){
        context.isAccountOwner = isAccountOwner;
        context.isSuperAdmin = isSuperAdmin;
        context.companyList = companyList;
        context.defaultDepartment = companyConstants.DEFAULT_DEPARTMENT_NAME;
        context.settingType = 'invite';
        context.contactUS = configs.CONTACT_US_EMAIL;
        context.user = currentUser;
        context.companyNameMaxLength = companyConstants.COMPANY_NAME_MAX_LENGTH;
        context.isAccountOwner = (userConstants.USER_PERMISSION_TYPE.ACCOUNT_OWNER === currentUser.get('permission_type'));    // true if user is account owner
        context.isSuperAdmin = (userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === currentUser.get('permission_type'));    // true if user is super admin
        res.render('settings/invite.ejs', context);
    }

    if (isSuperAdmin) {
        var Company = Parse.Object.extend('Company'),
            companyQuery = new Parse.Query(Company);
        companyQuery.exists('name');
        companyQuery.find(function (companies) {
            companyList = companies;
            companyList = commonUtils.sortObjectsByName(companyList);
            render();
        }, errorCallback);
    }
    else if (isAccountOwner) {
        setInitialDepartmentSettingContext(context, function () {
            render();
        });
    }
    else {    //  else condition would not be called if user is super admin.
        render();
    }
};

// controller to send invitation of email addresss and add email to invite list
exports.sendInviteController = function(req, res){
    var company = null,
        errorCallback = req.errorCallback,
        emailArray = req.body.emailList,
        hash, emailListString, companyPardotName;
    function successCallback(){
        if(!successCallback.callCount || successCallback.callCount == 0){
            res.send({
                success: true
            })
        }
    }

    function generatePardotCallObject(emailList, companyPardotName, companyPardotListId){
        var pardotCallObjects = [],
            timeStamp = (new Date()).getTime();
        for(var index =0; index< emailList.length; index+= settingConstants.PARDOT_INVITE_OBJECT_LENGTH) {
            var sliceFrom, sliceTo;
            sliceFrom = index;
            sliceTo = (emailList.length - index < settingConstants.PARDOT_INVITE_OBJECT_LENGTH) ? emailList.length : settingConstants.PARDOT_INVITE_OBJECT_LENGTH + index;
            emailListString = emailList.slice(sliceFrom, sliceTo).toString();
            hash = require('cloud/packages/md5.js').hex_md5(secret.securityKey1 + emailListString + companyPardotName + companyPardotListId + timeStamp + secret.securityKey2);
            pardotCallObjects.push({inviteeList: emailList.slice(sliceFrom, sliceTo), hash: hash, timeStamp: timeStamp});
        }
        return pardotCallObjects;
    }

    function sendInvite() {
        if (emailArray && emailArray.length !== 0) {
            emailArray = emailArray.map(function (email) {
                return (email.trim().toLowerCase());
            });
            settingUtils.validateEmailArray(emailArray,
                function (validEmailList) {
                    settingUtils.verifyDomainName(validEmailList, company,
                        function (emailList) {

                            settingUtils.inviteUsers(emailList, company, {
                                success: function (invitedEmails, invitedUserWithoutCompany) {
                                    companyPardotName = company.get('pardotName');
                                    var companyPardotListId = company.get('pardot_list_id');
                                    if(invitedEmails) {
                                        var pardotCallObjects = generatePardotCallObject(invitedEmails, companyPardotName, companyPardotListId);
                                    }
                                    res.send({
                                        success: true,
                                        pardotCallObjects: pardotCallObjects,
                                        companyPardotName: companyPardotName,
                                        companyPardotListId: companyPardotListId
                                    });
                                },
                                error: errorCallback
                            });
                        },
                        function (notExistingDomainList) {
                            res.send({
                                errorCode: 'domain_matching_failed',
                                domainList: notExistingDomainList
                            });
                        }, errorCallback);
                },
                function (invalidEmailList) {
                    res.send({
                        errorCode: 'invalid_format',
                        emailList: invalidEmailList
                    })
                }
            );
        }
        else {
            errorCallback();
        }
    }

    if((userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === req.currentUser.get('permission_type'))){
        var companyId = req.body.companyId,
            Company = Parse.Object.extend('Company'),
            companyQuery = new Parse.Query(Company);
        companyQuery.get(companyId, {
            success: function (companyObject) {
                company = companyObject;
                sendInvite();
            },
            error: errorCallback
        })
    }
    else {
        var companyPointer = req.currentUser.get('company');
        companyPointer.fetch({
            success: function (companyObject) {
                company = companyObject;
                sendInvite();
            }, error: errorCallback
        });
    }
};

// controller that adds friend to invite list
exports.inviteFriendController = function (req, res) {

    function getPardotCallData(email){
        var timeStamp = (new Date()).getTime(),
            hash = require('cloud/packages/md5.js').hex_md5(secret.securityKey1 + email + appSettings.PARDOTS_LIST_NAMES.FRIEND_INVITE_LIST + timeStamp + secret.securityKey2);
        return {
            email: email,
            listName: appSettings.PARDOTS_LIST_NAMES.FRIEND_INVITE_LIST,
            timeStamp: timeStamp,
            hash: hash
        }
    }

    var errorCallback = req.errorCallback,
        friendEmail = req.body.email.trim().toLowerCase(),
        currentUser = req.currentUser,
        inviteNumber = (currentUser.get("invitesUsed") ? currentUser.get("invitesUsed") : 0) + 1;
    if (inviteNumber <= appSettings.MAX_INVITES_ALLOWED) {
        currentUser.set("invitesUsed", (currentUser.get("invitesUsed"))? currentUser.get("invitesUsed") + 1 : 1);
        if (commonUtils.validateEmailAddress(friendEmail)) {
            userUtils.isUserAlreadyExist(friendEmail, function (isNewUser) {
                if (isNewUser) {
                    userUtils.isUserInInviteList(friendEmail, function (invite) {
                        if (invite) {
                            res.send({alreadyInvited: true});
                        }
                        else {
                            settingUtils.inviteFriend(friendEmail, currentUser, function () {
                                res.send({success: true, pardotCallData: getPardotCallData(friendEmail)});
                            }, errorCallback)
                        }
                    });
                }
                else {
                    res.send({alreadyRegistered: true});
                }
            }, errorCallback)
        }
        else {
            res.send({invalidEmail: true});
        }
    }
    else {
        res.send({maxInvitesReached: true});
    }
};

// controller that add invitees in pardot
exports.addInviteeInPardotController = function(req, res){
    function successCallback() {
        if (!successCallback.callCount || successCallback.callCount == 0) {
            res.send({
                success: true
            });
        }
    }
    var invitees = req.body.inviteeList,
        companyPardotName = req.body.companyPardotName,
        hashReceived = req.body.hash,
        timeStamp = req.body.timeStamp,
        currentTimeStamp = (new Date()).getTime(),
        companyPardotListId = req.body.companyPardotListId,
        hash, inviteeListString;
    if(invitees && timeStamp && Math.floor(currentTimeStamp - timeStamp) < userConstants.PARDOT_DATA_VALIDITY) {
        if(invitees.length > 0) {
            inviteeListString = invitees.toString();

            hash = require('cloud/packages/md5.js').hex_md5(secret.securityKey1 + inviteeListString + companyPardotName + companyPardotListId + timeStamp + secret.securityKey2);
            if (hash == hashReceived) {
                settingUtils.addProspectToInviteList(companyPardotName, invitees, companyPardotListId, successCallback);
            }
            else {
                res.send({success: false});
            }
        }
        else{
            res.send({success: false});
        }
    }
    else{
        res.send({success: false});
    }
};
