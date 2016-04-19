var userConstants = require('./cloud/apps/user/constants.js'),
    commonUtils = require('./cloud/apps/common/utils.js'),
    userSettingsConstants = require('./cloud/apps/user_settings/constants.js'),
    appSettings = require('./cloud/app_settings.js'),
    secret = require('./cloud/secret.js');

exports.getPermissionTypeIndex = function (permissionTypeList, permissionType) {
    var index = null;
    permissionTypeList.forEach(function (permissionTypeData, permissionTypeIndex) {
        if (permissionTypeData.value === permissionType)
            index = permissionTypeIndex
    });
    return index;
};

// function to get user object with give id
exports.getActiveUserById = function(userId, includeArgs, successCallback, errorCallback){
    if(typeof userId === "string" && userId.trim() !== ""){
        var userQuery = new Parse.Query("User");
        userQuery.include.apply(userQuery, includeArgs);
        userQuery.notEqualTo("is_deleted", true);
        userQuery.get(userId).then(successCallback, errorCallback);
    }
    else{
        successCallback();
    }
};

// function to validate user details
exports.validateUserDetails = function(formData, user, currentUser, callback){
    var isValid = true, emptyRequiredField = false, errorMessage = "",
        form_errors = {},
        phoneNumberRegex1 = /^\d{3}([- .]?)\d{3}\1\d{4}$/,    // allows xxx-xxx-xxxx, xxx.xxx.xxxx, xxx xxx xxxx, xxxxxxxxxx
        phoneNumberRegex2 = /^\(\d{3}\)\s?\d{3}-\d{4}$/;    // (xxx)-xxx-xxxx or (xxx)-xxx-xxxx

    // Validates First Name
    if (formData['firstName'] == ''){
        form_errors['firstNameError'] = true;
        isValid = false;
        emptyRequiredField = true;
    }
    else if(formData["firstName"].length > userConstants.FIRST_NAME_MAX_LENGTH){
        form_errors['firstNameError'] = true;
        errorMessage += "<p class='error-msg-field js_error_message'>First name can not be more than<span> "+userConstants.FIRST_NAME_MAX_LENGTH+" characters long.</span></p>";
        isValid = false;
    }

    // Validates Last Name
    if (formData['lastName'] == ''){
        form_errors['lastNameError'] = true;
        isValid = false;
        emptyRequiredField = true;
    }
    else if(formData["lastName"].length > userConstants.LAST_NAME_MAX_LENGTH){
        form_errors['lastNameError'] = true;
        errorMessage += "<p class='error-msg-field js_error_message'>Last name can not be more than<span> "+userConstants.LAST_NAME_MAX_LENGTH+" characters long.</span></p>";
        isValid = false;
    }

    // Validates Phone Number
    if(formData['phoneNumber'] == ""){
        form_errors['phoneNumberError'] = true;
        isValid = false;
        emptyRequiredField = true;
    }
    else if (!phoneNumberRegex1.test(formData['phoneNumber']) && !phoneNumberRegex2.test(formData['phoneNumber'])){
        form_errors['phoneNumberError'] = true;
        errorMessage += "<p class='error-msg-field js_error_message'>Phone number must be<span> in format xxx-xxx-xxxx, (xxx) xxx-xxxx, xxx xxx xxxx, xxx.xxx.xxxx or xxxxxxxxxx</span></p>";
        isValid = false;
    }

    // Validates Position Title
    if (formData['positionTitle'] == ''){
        form_errors['positionTitleError'] = true;
        isValid = false;
        emptyRequiredField = true;
    }
    else if(formData["positionTitle"].length > userConstants.POSITION_TITLE_MAX_LENGTH){
        form_errors['positionTitleError'] = true;
        errorMessage += "<p class='error-msg-field js_error_message'>Position title can not be more than<span> "+userConstants.POSITION_TITLE_MAX_LENGTH+" characters long.</span></p>";
        isValid = false;
    }

    if(!formData.department){
        form_errors['departmentError'] = true;
        errorMessage += "<p class='error-msg-field js_error_message'>Invalid <span> Department</span></p>";
        isValid = false;
    }

    // Validate phoneId
    if(formData['phoneId'].length > userConstants.PHONE_ID_MAX_LENGTH){
        form_errors['phoneId'] = true;
        errorMessage += "<p class='error-msg-field js_error_message'>Phone ID cannot be more than <span>"+userConstants.PHONE_ID_MAX_LENGTH+" characters long.</span></p>";
        isValid = false;
    }

    // validate identifierSource
    if(formData['identifierSource'].length > userConstants.IDENTIFIER_SOURCE_MAX_LENGTH){
        form_errors['identifierSource'] = true;
        errorMessage += "<p class='error-msg-field js_error_message'>Source ID cannot be more than <span>"+userConstants.IDENTIFIER_SOURCE_MAX_LENGTH+" characters long.</span></p>";
        isValid = false;
    }

    var currentUserPermissionIndex = exports.getPermissionTypeIndex(userSettingsConstants.PERMISSION_TYPES_LIST, currentUser.get("permission_type")),
        userPermissionIndex = exports.getPermissionTypeIndex(userSettingsConstants.PERMISSION_TYPES_LIST, user.get("permission_type")),
        userNewPermissionTypeIndex = exports.getPermissionTypeIndex(userSettingsConstants.PERMISSION_TYPES_LIST, formData.permissionType);
    currentUserPermissionIndex = (typeof currentUserPermissionIndex !== "number") ? 3 : currentUserPermissionIndex;
    userPermissionIndex = (typeof userPermissionIndex !== "number") ? 3 : userPermissionIndex;
    if(typeof userNewPermissionTypeIndex !== "number" || (currentUserPermissionIndex > userPermissionIndex) || (currentUserPermissionIndex > userNewPermissionTypeIndex)){
        form_errors['permissionTypeError'] = true;
        errorMessage += "<p class='error-msg-field js_error_message'>Invalid <span> Permission Type</span></p>";
        isValid = false;
    }

    if(emptyRequiredField){
        errorMessage = "<p class='error-msg-field js_error_message'>Please make sure <span>no fields are left empty</span></p>" + errorMessage;
    }
    callback(isValid, form_errors, errorMessage);
};

// function to update user object with given details
exports.updateUserDetails = function(formData, user, successCallback, errorCallback){
    Parse.Cloud.useMasterKey();
    var objectsToSave = [], hash, timeStamp;
    formData.phoneNumber = formData['phoneNumber'];
    formData.phoneNumber = formData.phoneNumber.replace(/[-()\s\.]/g,'');    // remove all '- ( ) and whitespaces' from the phone number;
    user.set("first_name", formData.firstName);
    user.set("last_name", formData.lastName);
    user.set("phone_number", formData.phoneNumber);
    user.set("occupation", formData.positionTitle);
    user.set("permission_type", formData.permissionType);
    if (user.get("department") && user.get("department").get('call_data_type') && formData.phoneId && formData.identifierSource) {
    // If user's department is Call Center update phoneID and identifierSource and User's Call Data
        user.set("phoneId", formData.phoneId);
        user.set("identifierSource", formData.identifierSource);
        var userCallData = user.get('call_data');
        if (!userCallData) {
            var UserCallData = Parse.Object.extend('User_Calldata');
            userCallData = new UserCallData();
            user.set('call_data', userCallData)
        }
        userCallData.set("phoneId", formData.phoneId);
        userCallData.set("identifierSource", formData.identifierSource);
        objectsToSave.push(userCallData);
    }
    if(!user.get("department") || (user.get("department") && user.get("department").id !== formData.department.id)) {
        var userDepartment = user.get("department"),
            userPrimaryPersonalityName = (user.get("primary_personality")) ? user.get("primary_personality").get("name") : "";
        userPrimaryPersonalityName = (userConstants.PERSONALITY_LIST.indexOf(userPrimaryPersonalityName) !== -1) ? userPrimaryPersonalityName.toLowerCase() : "";
        if (!userDepartment || userDepartment.id !== formData.department.id) {
            if (userDepartment) {
                userDepartment.increment("user_count", -1);
                if (userDepartment.get("parent_department")) {
                    userDepartment.get("parent_department").increment("user_count", -1);
                }
                if (userPrimaryPersonalityName !== "") {
                    if (userDepartment.get("parent_department")) {
                        userDepartment.get("parent_department").increment(userPrimaryPersonalityName + "_count", -1);
                    }
                    userDepartment.increment(userPrimaryPersonalityName + "_count", -1);
                }
                objectsToSave.push(userDepartment);
            }

            formData.department.increment("user_count", 1);
            if (formData.department.get("parent_department")) {
                formData.department.get("parent_department").increment("user_count", 1);
            }
            if (userPrimaryPersonalityName !== "") {
                if (formData.department.get("parent_department")) {
                    formData.department.get("parent_department").increment(userPrimaryPersonalityName + "_count", 1);
                }
                formData.department.increment(userPrimaryPersonalityName + "_count", 1);
            }
            user.set("department", formData.department);
        }
    }

    timeStamp = (new Date()).getTime();
    hash = require('./cloud/packages/md5.js').hex_md5(secret.securityKey1 + user.get('email') + user.get('first_name') + user.get('last_name') + timeStamp + secret.securityKey2);

    objectsToSave.push(user);

    Parse.Object.saveAll(objectsToSave).then(function() {
        successCallback({
            email: user.get('email'),
            firstName: user.get('first_name'),
            lastName: user.get('last_name'),
            timeStamp: timeStamp,
            hash: hash
        });
    }, errorCallback)
};

exports.sendInviteUserMail = function(user, successCallback, errorCallBack){
    var settingsQueryObject = new Parse.Query('Settings'),
        campaignId, emailTemplateId;
    settingsQueryObject.containedIn('name', [appSettings.CAMPAIGN, appSettings.PARDOT_EMAIL_TEMPLATE_NAME.INVITE_USER]);
    settingsQueryObject.find().then(function(result){
        if(result.length == 2){
            for(var index = 0; index < result.length; index++){
                if(result[index].get('name') == appSettings.CAMPAIGN){
                    campaignId = result[index].get('value');
                }
                else if(result[index].get('name') == appSettings.PARDOT_EMAIL_TEMPLATE_NAME.INVITE_USER){
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
        errorCallBack();
    });
};
