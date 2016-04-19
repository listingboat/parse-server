var appSettings = require('./cloud/app_settings.js'),
    commonUtils = require('./cloud/apps/common/utils.js'),
    logger = require('./cloud/packages/loggly.js'),
    commonConstants = require('./cloud/apps/common/constants.js'),
    userConstants = require('./cloud/apps/user/constants.js'),
    companyConstants = require('./cloud/apps/company/constants.js'),
    userUtils = require('./cloud/apps/user/utils.js'),
    secret = require('./cloud/secret.js'),
    _ = require('underscore');

// function that adds the given email list in invite list at pardot
exports.addProspectToInviteList = function(company, emailList, companyPardotListId, successCallback) {
    var companyName, userList = new Array(emailList.length);

    companyName = company;
    for (var index = 0; index < emailList.length; index++) {
        userList[index] = {
            email: emailList[index],
            company: companyName
        };
        if(companyPardotListId){
            userList[index]['list_' + companyPardotListId] = 1;
        }
    }
    commonUtils.addUserBatchesToPardotInviteList(userList, appSettings.PARDOTS_LIST_NAMES['INVITE_LIST'], successCallback);
};

exports.validateEmailArray = function(emailArray, successCallback, errorCallback) {
    var invalidEmail = [],
        validEmail = [];
    for (var emailIndex in emailArray) {
        var email = emailArray[emailIndex].trim();
        if (email !== '') {
            if (commonUtils.validateEmailAddress(email)) {
                validEmail.push(email);
            }
            else {
                invalidEmail.push(email);
            }
        }
    }
    if (invalidEmail.length !== 0) {
        errorCallback(invalidEmail);
    }
    else {
        successCallback(validEmail);
    }
};

exports.verifyDomainName = function (emailList, companyPointer, successCallback, invalidDomainCallback, errorCallback) {
    var domainMap = {},
        domainList = [];
    for (var emailIndex in emailList) {
        var email = emailList[emailIndex],
            domain = email.split('@')[1];
        if(!domainMap[domain]) {
            domainMap[domain] = true;
            domainList.push(domain);
        }
    }

    var CompanyDomain = Parse.Object.extend('Company_Domain'),
        companyDomainQuery = new Parse.Query(CompanyDomain);

    companyDomainQuery.include('company');
    companyDomainQuery.equalTo('company', companyPointer);
    companyDomainQuery.containedIn('domain', domainList);
    companyDomainQuery.find({
        success: function(companyDomains){
            if(companyDomains.length == domainList.length){
                successCallback(emailList);
            }
            else {
                var fetchDomainMap = {}, addedDomainMap = {}, notExistingDomainList = [];
                for (var companyDomainIndex in companyDomains) {
                    var domain = companyDomains[companyDomainIndex].get('domain');
                    if (!fetchDomainMap[domain]) {
                        fetchDomainMap[domain] = true;
                    }
                }
                for (var emailIndex in emailList) {
                    var email = emailList[emailIndex],
                        domain = email.split('@')[1];
                    if (!addedDomainMap[domain] && !fetchDomainMap[domain]) {
                        notExistingDomainList.push(domain);
                        addedDomainMap[domain] = true;
                    }
                }
                invalidDomainCallback(notExistingDomainList);
            }
        },
        error: errorCallback
    })
};

exports.inviteUsers = function (emailList, company, callbacks) {
    var userQuery = new Parse.Query(Parse.User),
        existingUsersEmail = [], numberOfInvites;
    userQuery.equalTo('company', company);
    userQuery.containedIn('email', emailList);
    userQuery.limit(1000);
    userQuery.find({
        success: function (users) {
            if (users && users.length !== 0) {
                existingUsersEmail = users.map(function(userObject){
                    return userObject.get('email');
                });

                emailList = _.difference(emailList, existingUsersEmail);
            }
            emailList = _.uniq(emailList);
            var InvitedUser = Parse.Object.extend('Invited_User'),
                invitedUserQuery = new Parse.Query(InvitedUser),
                alreadyInvitedUserEmails = [],
                objectsToBeSaved = [],
                invitedUserWithoutCompany, userObjectsWithoutCompany,
                listToAddInPardot;
            invitedUserQuery.include('user', 'user.primary_personality', 'user.department');
            invitedUserQuery.containedIn('email', emailList);
            invitedUserQuery.limit(1000);
            invitedUserQuery.find({
                success: function (alreadyInvitedUsers) {
                    // get the email of already invited emails
                    alreadyInvitedUserEmails = alreadyInvitedUsers.map(function (inviteObject) {
                        return inviteObject.get('email');
                    });
                    numberOfInvites = emailList.length - alreadyInvitedUserEmails.length;
                    var departmentQuery = new Parse.Query("Department");
                    departmentQuery.equalTo("company", company);
                    departmentQuery.equalTo("name", companyConstants.DEFAULT_DEPARTMENT_NAME);
                    departmentQuery.first().then(function(companyOtherDepartment){
                    // To get the objects of already invited user without company
                    invitedUserWithoutCompany = alreadyInvitedUsers.filter(function(inviteObject){
                        if(!inviteObject.get('company')){
                            numberOfInvites++;
                            inviteObject.set('company', company);    // sets the company of object with no company
                            if(inviteObject.get('user')){   // is invitee is registered
                                var invitedUser = inviteObject.get('user'),
                                    userDepartment = invitedUser.get("department");
                                if(userDepartment) {
                                    userDepartment.increment("user_count", -1);
                                }
                                invitedUser.set("department", companyOtherDepartment);
                                companyOtherDepartment.increment("user_count");

                                // updates workstyle count for the personality
                                if(userDepartment) {
                                    objectsToBeSaved.push(userDepartment);
                                }
                                invitedUser.set('company', company);     // sets the company with the invitee user object
                                company.increment('user_count'); // update user count for a company
                                if(invitedUser.get('primary_personality')){ // increment count of user for a given personality and company
                                    // updates workstyle count for the personality
                                    if(userDepartment) {
                                        userDepartment.increment(invitedUser.get('primary_personality').get('name').toLowerCase() + '_count', -1);
                                    }
                                    companyOtherDepartment.increment(invitedUser.get('primary_personality').get('name').toLowerCase() + '_count');
                                    company.increment(invitedUser.get('primary_personality').get('name').toLowerCase() + '_count');
                                }
                            }
                            return true;
                        }
                        else{
                            return false;
                        }
                    });
                        company.increment("invited_user_count", numberOfInvites);
                    Parse.Cloud.useMasterKey();    // to give permission to edit another user
                    objectsToBeSaved = objectsToBeSaved.concat(invitedUserWithoutCompany);
                    listToAddInPardot = emailList;
                    emailList = _.difference(emailList, alreadyInvitedUserEmails);
                    emailList = _.uniq(emailList);
                    for (var emailIndex in emailList) {
                        var email = emailList[emailIndex];
                        var invitedUser = new InvitedUser();
                        invitedUser.set('company', company);
                        invitedUser.set('email', email);
                        objectsToBeSaved.push(invitedUser);
                    }
                    if (objectsToBeSaved.length !== 0) {
                        Parse.Object.saveAll(objectsToBeSaved, {
                            success: function () {
                                callbacks.success(listToAddInPardot, invitedUserWithoutCompany);
                            }, error: callbacks.error
                        });
                    }
                    else {
                        callbacks.success(listToAddInPardot);
                    }
                    }, callbacks.error);
                },
                error: callbacks.error
            });

        },
        error: callbacks.error
    });
};

// function that validates user account update form
exports.validateUserAccountUpdateForm = function(form_data, departmentList, callback){
    var isValid = true,
        form_errors = {},
        phoneNumberRegex1 = /^\d{3}([- .]?)\d{3}\1\d{4}$/,    // allows xxx-xxx-xxxx, xxx.xxx.xxxx, xxx xxx xxxx, xxxxxxxxxx
        phoneNumberRegex2 = /^\(\d{3}\)\s?\d{3}-\d{4}$/;    // (xxx)-xxx-xxxx or (xxx)-xxx-xxxx

    // Validates First Name
    if (form_data['firstName'] == ''){
        form_errors['firstNameError'] = "*Required";
        isValid = false;
    }
    else if(form_data["firstName"].length > userConstants.FIRST_NAME_MAX_LENGTH){
        form_errors['firstNameError'] = "First name can not be more than "+userConstants.FIRST_NAME_MAX_LENGTH+" characters long.";
        isValid = false;
    }

    // Validates Last Name
    if (form_data['lastName'] == ''){
        form_errors['lastNameError'] = "*Required";
        isValid = false;
    }
    else if(form_data["lastName"].length > userConstants.LAST_NAME_MAX_LENGTH){
        form_errors['lastNameError'] = "Last name can not be more than "+userConstants.LAST_NAME_MAX_LENGTH+" characters long.";
        isValid = false;
    }

    // Validates Position Title
    if (form_data['positionTitle'] == ''){
        form_errors['positionTitleError'] = "*Required";
        isValid = false;
    }
    else if(form_data["positionTitle"].length > userConstants.POSITION_TITLE_MAX_LENGTH){
        form_errors['positionTitleError'] = "Position title can not be more than "+userConstants.POSITION_TITLE_MAX_LENGTH+" characters long.";
        isValid = false;
    }

    // Validates Phone Number
    if(form_data['phoneNumber'] == ""){
        form_errors['phoneNumberError'] = "*Required";
        isValid = false;
    }
    else if (!phoneNumberRegex1.test(form_data['phoneNumber']) && !phoneNumberRegex2.test(form_data['phoneNumber'])){
        form_errors['phoneNumberError'] = "Phone number must be in format xxx-xxx-xxxx, (xxx) xxx-xxxx, xxx xxx xxxx, xxx.xxx.xxxx or xxxxxxxxxx";
        isValid = false;
    }

    // Validate Department
    if(departmentList && departmentList.length > 0){
        var selectedDepartment = _.where(departmentList, {id: form_data['department']});
        if (!(form_data['department']) || (form_data['department'].trim() == "")) {
            form_errors['departmentError'] = "*Required";
            isValid = false;
        }
        else if (selectedDepartment.length === 0) {
            form_errors['departmentError'] = "Please select a valid department.";
            isValid = false;
        }
        else {
            form_data.selected_department = selectedDepartment[0]
        }
    }


    callback(isValid, form_errors);
};

// function that updates user info
exports.updateUserInfo = function(form_data, currentUser, departmentList, successCallback, errorCallback) {
    var dataForPardot = {}, email, firstName, lastName, timeStamp, hash, objectsToSave = [], previousDepartment,
        phoneNumber = form_data['phoneNumber'];
    phoneNumber = phoneNumber.replace(/[-()\s\.]/g,'');    // remove all '- ( ) and whitespaces' from the phone number;
    userUtils.fetchUserPrimaryPersonality(currentUser, function(primaryPersonality){
        currentUser.set('first_name', form_data.firstName);
        currentUser.set('first_name_lower_case', (form_data.firstName || '').toLowerCase());
        currentUser.set('last_name', form_data.lastName);
        currentUser.set('last_name_lower_case', (form_data.lastName || '').toLowerCase());
        currentUser.set('occupation', form_data.positionTitle);
        currentUser.set('title_lower_case', (form_data.positionTitle || '').toLowerCase());
        currentUser.set('phone_number', phoneNumber);
        if (form_data.selected_department) {

            // find current department in department list
            previousDepartment = _.find(departmentList, function(department){
                return (department.id == currentUser.get("department").id);
            });
            if(!(previousDepartment) || (previousDepartment && previousDepartment.id != form_data.selected_department.id)){
                if(previousDepartment) {
                    previousDepartment.increment("user_count", -1);  // decrement the user count of current department
                    // decrement the user count of current department's parent department if any
                    if(previousDepartment.get("parent_department")){
                        previousDepartment.get("parent_department").increment("user_count", -1);
                    }
                }

                form_data.selected_department.increment("user_count"); // increment the user count of new department
                // increment the user count of new department's parent if any
                if(form_data.selected_department.get("parent_department")){
                    form_data.selected_department.get("parent_department").increment("user_count");
                }
                if(primaryPersonality){  // if user has primary personality
                    // reduce workstyle count from the pervious department
                    if(previousDepartment) {
                        previousDepartment.increment(primaryPersonality.get("name").toLowerCase() + "_count", -1);
                        if(previousDepartment.get("parent_department")){
                            previousDepartment.get("parent_department").increment(primaryPersonality.get("name").toLowerCase() + "_count", -1);
                        }
                    }
                    // increment workstyle count in new department
                    form_data.selected_department.increment(primaryPersonality.get("name").toLowerCase() + "_count");

                    if(form_data.selected_department.get("parent_department")){
                        form_data.selected_department.get("parent_department").increment(primaryPersonality.get("name").toLowerCase() + "_count");
                    }
                }
                currentUser.set("department", form_data.selected_department);
                if(previousDepartment) {
                    objectsToSave.push(previousDepartment);
                }
            }
        }

        objectsToSave.push(currentUser);
        Parse.Object.saveAll(objectsToSave).then(function(){
            email = currentUser.get('email');
            firstName = form_data.firstName;
            lastName = form_data.lastName;
            timeStamp = (new Date()).getTime();
            // don't change the sequence of hashing to check sequence check app/user/utils/ function: "validateDataForPardotCall"
            hash = require('./cloud/packages/md5.js').hex_md5(secret.securityKey1 + email + firstName + lastName + timeStamp + secret.securityKey2);
            successCallback({
                email: email,
                firstName: firstName,
                lastName: lastName,
                timeStamp: timeStamp,
                hash: hash
            })
        }, errorCallback);
    }, errorCallback)
};

exports.validatePasswordUpdateForm = function(form_data, Callback){
    var isValid = true,
        passwordRegex = /(^(?=.*\d).{8,}$)/,    // Regular expression for password
        form_errors = {};

    // Validates old password if empty
    if (form_data['oldPassword'] == ''){
        form_errors['oldPassword'] = "*Required";
        isValid = false;
    }
    // Validates Password 1
    if (!form_data['password1'].match(passwordRegex)){
        form_errors['password1Error'] = "password must be at least 8 characters long and must contain at least one number";
        isValid = false;
    }

    // Validates password 2
    if (form_data['password1'] != form_data['password2']){
        form_errors['password2Error'] = "Password did not match";
        isValid = false;
    }
    Callback(isValid, form_errors);
};

exports.sendPasswordChangedMail = function(user, successCallback){
    var settingsQueryObject = new Parse.Query('Settings'),
        campaignId, emailTemplateId;
    settingsQueryObject.containedIn('name', [appSettings.CAMPAIGN, appSettings.PARDOT_EMAIL_TEMPLATE_NAME.PASSWORD_CHANGED]);
    settingsQueryObject.find().then(function(result){
        if(result.length == 2){
            for(var index = 0; index < result.length; index++){
                if(result[index].get('name') == appSettings.CAMPAIGN){
                    campaignId = result[index].get('value');
                }
                else if(result[index].get('name') == appSettings.PARDOT_EMAIL_TEMPLATE_NAME.PASSWORD_CHANGED){
                    emailTemplateId = result[index].get('value');
                }
            }
            commonUtils.sendEmailToUser(user.get('email'), campaignId, emailTemplateId, successCallback);
        }
        else{
            logger.log("ERROR in settings query");
            successCallback();
        }
    },function(error){
        logger.log("ERROR in settings query");
        logger.log(error);
        successCallback();
    });
};

exports.inviteFriend = function(friendEmail, currentUser, successCallback, errorCallback){
    var inviteObject = new (Parse.Object.extend("Invited_User"))(),
        objects = [];
    objects.push(currentUser);
    inviteObject.set('email', friendEmail);
    objects.push(inviteObject);
    Parse.Object.saveAll(objects).then(successCallback, errorCallback);
};

exports.fetchDepartmentListIfUserWithCompany = function(user, successCallback, errorCallback){
    var company = user.get("company");
    if(company){
        userUtils.getDepartmentList(company, function(departmentList){
            successCallback(departmentList);
        }, errorCallback)
    }
    else{
        successCallback();
    }
};
