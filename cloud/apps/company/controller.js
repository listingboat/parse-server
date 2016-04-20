var userUtils = require('../user/utils.js'),
    secret = require('../../secret.js'),
    configs =require('../../app_settings.js'),
    _ = require('underscore'),
    settingUtils = require('../settings/utils.js'),
    quizUtils = require('../quiz/utils.js'),
    companyUtils = require('../company/utils.js'),
    companyConstants = require('./constants.js'),
    md5 = require('../../packages/md5.js'),
    appSettings = require('../../app_settings.js'),
    commonConstants = require("../common/constants.js"),
    commonUtils = require("../common/utils.js"),
    userConstants = require("../user/constants.js");


// function that renders the department update page where you can add or remove department and edit question type for every department
exports.companyDepartmentSettingController = function(req, res){

    // function to generate hash of department id and question id
    function getDepartmentQuestionTypeHash(departmentId, questionTypeId){
        return  md5.hex_md5(secret.securityKey1 + currentUser.id + departmentId + questionTypeId + secret.securityKey2);
    }

    function render(path, context){
        context.getDepartmentQuestionTypeHash = getDepartmentQuestionTypeHash;
        context.defaultDepartment = companyConstants.DEFAULT_DEPARTMENT_NAME;
        context.isAccountOwner = (userConstants.USER_PERMISSION_TYPE.ACCOUNT_OWNER === currentUser.get('permission_type'));
        context.isSuperAdmin = (userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === currentUser.get('permission_type'));
        context.settingType = 'department';
        context.user = currentUser;
        context.contactUS = configs.CONTACT_US_EMAIL;
        res.render(path, context);
    }

    var currentUser = req.currentUser,
        errorCallback = req.errorCallback,
        context = {};
    context.departmentQuestionTypeMap = {};
    if(userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN !== currentUser.get('permission_type')) {
        companyUtils.getDepartmentSettingData(currentUser, currentUser.get("company"), context, function(data){
            _.extend(context, data);
            if(context.isDepartmentSetupRequired){
                render('company/initial_department_setup', context);
            }
            else {
                render('company/update_departments', context);
            }
        }, errorCallback);
    }
    else{
        var Company = Parse.Object.extend('Company'),
            companyQuery = new Parse.Query(Company);
        companyQuery.exists('name');
        companyQuery.find(function(companies){
            companies = commonUtils.sortObjectsByName(companies);
            context.companyList = companies;
            render('company/super_admin_department_settings', context);
        }, errorCallback);
    }
};

// controller to renders company department setting page for super admin
exports.superAdminDepartmentSettingsController = function(req, res){

    // function to generate hash of department id and question id
    function getDepartmentQuestionTypeHash(departmentId, questionTypeId){
        return  md5.hex_md5(secret.securityKey1 + currentUser.id + departmentId + questionTypeId + secret.securityKey2);
    }

    //function to render _company_department_setting_page with context and adds some values in context
    function render(){
        context.getDepartmentQuestionTypeHash = getDepartmentQuestionTypeHash;
        context.defaultDepartment = companyConstants.DEFAULT_DEPARTMENT_NAME;
        context.isAccountOwner = (userConstants.USER_PERMISSION_TYPE.ACCOUNT_OWNER === currentUser.get('permission_type'));
        context.isSuperAdmin = (userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === currentUser.get('permission_type'));
        context.settingType = 'department';
        context.user = currentUser;
        context.layout = "layout_partial";
        context.contactUS = configs.CONTACT_US_EMAIL;
        if(context.isDepartmentSetupRequired) {
            var path = 'company/_initial_department_setting'
        }
        else {
            var path = 'company/_department_settings';
        }
        res.render(path, context, function(error, partial){
            res.send({isDepartmentSetupRequired: context.isDepartmentSetupRequired, partial: partial});
        });
    }

    var currentUser = req.currentUser,
        errorCallback = req.errorCallback,
        context = {},
        companyID = (typeof req.query.companyId === "string") ? req.query.companyId.trim() : "";
    context.departmentQuestionTypeMap = {};
    if(userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === currentUser.get('permission_type')){    // check if the person is requesting is a superuser
        if(companyID != ""){   // and company id is given
            var CompanyModel = Parse.Object.extend("Company"),
                companyObject = new CompanyModel();
            companyObject.id = companyID;
            companyUtils.getDepartmentSettingData(currentUser, companyObject, context, function(data){
                _.extend(context, data);
                render();
            }, errorCallback)
        }
        else{
            res.status(404).send({message: "Unauthorized Access Denied"});
        }
    }
    else{
        res.status(404).send({message: "Unauthorized Access Denied"});
    }

};

// function to add new department for the admin or account owner company
exports.addNewDepartmentController = function(req, res){

    // function to validate new department name if it is already exist or not
    function validateDepartmentData(formData, validationCallback){

        // function to validate parent department id and send paraent department object if id is valid
        function validateParentDepartment(parentId, validationSuccessCallback, validationErrorCallback){
            if(typeof parentId === "string" && parentId !== "") {
                var parentDepartmentExistenceQuery = new Parse.Query("Department"),   // query to validate if department with given id exist
                    parentDepartmentValidationQuery = new Parse.Query("Department"),  // query to validate if the department is not a child of any department
                    mainQuery, DepartmentModel = Parse.Object.extend("Department"),
                    parentDepartmentObject = new DepartmentModel();
                parentDepartmentObject.id = parentId;
                parentDepartmentExistenceQuery.equalTo("objectId", parentId);
                parentDepartmentValidationQuery.equalTo("subdepartments", parentDepartmentObject);
                mainQuery = Parse.Query.or(parentDepartmentExistenceQuery, parentDepartmentValidationQuery);
                mainQuery.find().then(function(result){

                    // if result length == 0 that means no department exist with this id
                    // if result length > 1 that means this department has a parent department
                    if(result.length == 1 && result[0].id == parentId){
                        validationSuccessCallback(result[0]);
                    }
                    else{
                        validationErrorCallback("Invalid Parent Department");
                    }
                }, errorCallback);
            }
            else{
                validationSuccessCallback();
            }
        }

        function validateCompany(currentUser, formData, validationSuccessCallback, validationErrorCallback) {
            if (userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === currentUser.get('permission_type')) {
                companyUtils.companyExists(formData.companyId, function (companyObject) {
                    if (companyObject) {
                        validationSuccessCallback()
                    }
                    else {
                        validationErrorCallback("Invalid Company");
                    }
                }, errorCallback);
            }
            else
                validationSuccessCallback();
        }
        function validationSuccessCallback(){
            validationCallback(true, formData);
        }
        function validationErrorCallback(error){
            validationCallback(false, formData, error);
        }
        // validate and set formData.companyId
        if(userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN !== currentUser.get('permission_type') && currentUser.get('company')){
            formData.companyId = currentUser.get('company').id;
        }
        else if(userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === currentUser.get('permission_type')){
            formData.companyId = formData.companyId || (currentUser.get('company') || {}).id;
        }
        if(typeof formData.companyId !== "string" || formData.companyId.trim() === ""){
            validationErrorCallback("No Company for department to add to");
            return;
        }
        formData.question_type_id_list = (typeof formData.question_type_id_list === "string")? formData.question_type_id_list.split(',') : [];
        if(formData.question_type_id_list_hash === md5.hex_md5(
                appSettings.securityKey1 + req.currentUser.id + formData.question_type_id_list + formData.time_stamp + appSettings.securityKey2)) {
            if (typeof formData.department_name === "string" && formData.department_name.trim() != "") {
                var departmentQueryObject = new Parse.Query("Department");
                departmentQueryObject.equalTo("company", getCompany(formData.companyId));
                departmentQueryObject.equalTo("name_lower_case", formData.department_name.toLowerCase());
                departmentQueryObject.first().then(function (department) {
                    if (!department) {
                        validateParentDepartment(formData.parent_id, function(parentDepartment){
                            formData.parentDepartment = parentDepartment;   // add parent department object in form data
                            if (Array.isArray(formData.question_types)) {
                                var questionTypesValid = true;
                                for (var questionTypeIndex in formData.question_types) {
                                    var questionTypeId = formData.question_types[questionTypeIndex];
                                    if(formData.question_type_id_list.indexOf(questionTypeId) == -1){
                                        validationErrorCallback("Invalid Data");
                                        questionTypesValid = false;
                                        break
                                    }
                                }
                                if(questionTypesValid) {
                                    validateCompany(currentUser, formData, validationSuccessCallback, validationErrorCallback);
                                }
                            }
                            else if(typeof formData.question_types === "string" && formData.question_types.trim() !== ""){
                                var questionTypeId = formData.question_types;
                                if (formData.question_type_id_list.indexOf(questionTypeId) === -1) {
                                    validationErrorCallback("Invalid Data");
                                }
                                else{
                                    formData.question_types = [formData.question_types];
                                    validateCompany(currentUser, formData, validationSuccessCallback, validationErrorCallback);
                                }
                            }
                            else{
                                formData.question_types = [];
                                validateCompany(currentUser, formData, validationSuccessCallback, validationErrorCallback);
                            }
                        }, validationErrorCallback);
                    }
                    else {
                        validationErrorCallback("Department with same name already exist");
                    }
                }, errorCallback);
            }
            else {
                validationErrorCallback("*Required");
            }
        }
        else{
            validationErrorCallback("Unauthorised Access");
        }
    }

    // function to generate hash of department id and question id
    function getDepartmentQuestionTypeHash(departmentId, questionTypeId){
        return  md5.hex_md5(secret.securityKey1 + currentUser.id + departmentId + questionTypeId + secret.securityKey2);
    }
    function getCompany(companyId) {
        var CompanyModel = Parse.Object.extend("Company"),
            company = new CompanyModel();
        company.id = companyId;
        return company
    }

    var currentUser = req.currentUser,
        errorCallback = req.errorCallback,
        formData = req.body,
        objectsToSave = [],
        QuestionType = Parse.Object.extend('Quiz_Question_Type');
    validateDepartmentData(formData, function(isDepartmentNameValid, validatedFormData, errorMessage){
        if(isDepartmentNameValid){
            var departmentModel = Parse.Object.extend("Department"),
                newDepartmentObject = new departmentModel(),
                companyObject = getCompany(validatedFormData.companyId),
                DepartmentQuestionTypeRelationModel = Parse.Object.extend("Department_Question_Type_Relation");
            companyObject.increment("department_count");  // increase the department count of the company
            newDepartmentObject.set("name", validatedFormData.department_name);
            newDepartmentObject.set("company", companyObject);
            newDepartmentObject.set("user_count", 0);
            newDepartmentObject.set("name_lower_case", (validatedFormData.department_name || '').toLowerCase());
            if(validatedFormData.parentDepartment){
                validatedFormData.parentDepartment.add("subdepartments", newDepartmentObject);
                newDepartmentObject.set("parent_department", validatedFormData.parentDepartment);  // add parent department pointer in sub department
                objectsToSave.push(validatedFormData.parentDepartment);
            }
            objectsToSave.push(newDepartmentObject);
            validatedFormData.question_types = validatedFormData.question_types.filter(function (id) {
                return id !== validatedFormData.question_type_id_list[0]
            }); // exclude default from list
            for (var index in validatedFormData.question_types) {
                var departmentQuestionTypeRelationObject = new DepartmentQuestionTypeRelationModel(),
                    questionTypeObject = new QuestionType();
                questionTypeObject.id = validatedFormData.question_types[index];
                departmentQuestionTypeRelationObject.set("question_type", questionTypeObject);
                departmentQuestionTypeRelationObject.set("department", newDepartmentObject);
                objectsToSave.push(departmentQuestionTypeRelationObject);
            }
            Parse.Object.saveAll(objectsToSave).then(function () {
                var departmentQuestionTypeMap = {};
                departmentQuestionTypeMap[validatedFormData.question_type_id_list[0]] = true;
                validatedFormData.question_types.forEach(function(questionTypeId){departmentQuestionTypeMap[questionTypeId] = true;});
                res.render("company/_department_row_partial", {
                    layout: "layout_partial",
                    department: newDepartmentObject,
                    questionTypeList: validatedFormData.question_type_id_list,
                    getDepartmentQuestionTypeHash: getDepartmentQuestionTypeHash,
                    departmentQuestionTypeMap: departmentQuestionTypeMap,
                    parentDepartment: validatedFormData.parentDepartment,
                    DEFAULT_QUESTION_TYPE_ID: validatedFormData.question_type_id_list[0]
                }, function (error, partial) {
                    res.send({success: true, newDepartmentPartial: partial, isParentDepartment : (validatedFormData.parentDepartment) ? false : true})
                });
            }, errorCallback);
        }
        else{
            res.send({success: false, departmentError: errorMessage});
        }
    })
};

// function to delete department if it has user count less than one
exports.removeDepartmentController = function(req, res){
    var errorCallback = req.errorCallback,
        currentUser = req.currentUser,
        departmentId = (typeof req.body.departmentId === "string") ? req.body.departmentId.trim() : "",
        departmentQuery = new Parse.Query("Department"),
        company = currentUser.get("company");
    if(departmentId != "") {
        departmentQuery.equalTo("company", company);
        departmentQuery.equalTo("objectId", departmentId);
        departmentQuery.first().then(function(department){
            if(department){
                if(!department.get("user_count") || department.get("user_count") == 0 ) {
                    if(department.get("name_lower_case") !== companyConstants.DEFAULT_DEPARTMENT_NAME.toLowerCase()) {
                        department.destroy().then(function () {
                            res.send({success: true});
                        }, errorCallback)
                    }
                    else{
                        res.status(404).send({message: "You can't delete this department"});
                    }
                }
                else{
                    res.status(404).send({message: "Department has user associated with it"});
                }
            }
            else{
                res.send({success: false});
            }
        }, errorCallback);
    }
    else{
        res.status(404).send({message: "Unauthorized Access Denied"});
    }
};

// function to add question type and department relation
exports.addQuestionTypeInDepartmentController = function(req, res){
    var errorCallback = req.errorCallback,
        currentUser = req.currentUser,
        departmentId = req.body.departmentId,
        questionTypeId = req.body.questionTypeId,
        departmentModel = Parse.Object.extend("Department"),
        questionTypeModel = Parse.Object.extend("Quiz_Question_Type"),
        departmentObject = new departmentModel(),
        questionTypeObject = new questionTypeModel(),
        hash = req.body.hash;
    departmentObject.id = departmentId;
    questionTypeObject.id = questionTypeId;
    if(hash == md5.hex_md5(secret.securityKey1 + currentUser.id + departmentId + questionTypeId + secret.securityKey2)){    // if both department and question type id are authenticated
        companyUtils.findDepartmentQuestionTypeRelation(departmentObject, questionTypeObject, function(relation){
            if(relation && relation.length > 0){    // if relation already exist
                res.send({success: true});
            }
            else{    // if it is an new relation
                var departmentQuestionTypeRelationModel = Parse.Object.extend("Department_Question_Type_Relation"),
                    departmentQuestionTypeRelationObject = new departmentQuestionTypeRelationModel();
                departmentQuestionTypeRelationObject.set("department", departmentObject);
                departmentQuestionTypeRelationObject.set("question_type", questionTypeObject);
                departmentQuestionTypeRelationObject.save().then(function(){
                    res.send({success: true});
                }, errorCallback);
            }
        }, errorCallback)
    }
    else{
        res.status(404).send({message: "Unauthorized Access Denied"});
    }
};

// function that performs initial department setup
// it creates the sent departments along with the relation with given question type
exports.initialDepartmentSetupController = function (req, res) {

    // function return the company object whose departments are being setup
    function getCompany(successCallback) {
        if ((userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === currentUser.get('permission_type')) && companyId != "") {
            var companyQueryObject = new Parse.Query("Company");
            companyQueryObject.get(companyId).then(successCallback, errorCallback)
        }
        else if (userConstants.USER_PERMISSION_TYPE.ACCOUNT_OWNER === currentUser.get('permission_type')) {
            successCallback(currentUser.get("company"));
        }
        else {
            successCallback();
        }
    }

    // function to validate selected question types of a department
    function validateDepartmentQuestionType(validQuestionTypeDict, departmentQuestionTypes) {
        for (var questionTypeIndex in departmentQuestionTypes) {
            // checks if selected question type is an valid question type or not
            if (!validQuestionTypeDict[departmentQuestionTypes[questionTypeIndex]]) {
                return false
            }
        }
        return true;
    }

    // function to check if department name valid or not and department name has already occurred or not
    function checkDepartmentNameAndOccurrence(departmentOccurrenceMap, departmentName) {
        if (departmentName.trim() !== "" && departmentName.toLowerCase() !== companyConstants.DEFAULT_DEPARTMENT_NAME.toLowerCase() && !departmentOccurrenceMap[departmentName]) {
            departmentOccurrenceMap[departmentName] = true;
            return true;
        }
        else {
            return false;
        }
    }

    // function to create and return new department object
    function createDepartmentObject(departmentName, company) {
        var departmentObject = new DepartmentModel();
        departmentObject.set("name", departmentName.trim());
        departmentObject.set("company", company);
        departmentObject.set("name_lower_case", departmentName.toLowerCase().trim());
        departmentObject.set("user_count", 0);
        return departmentObject;
    }

    // function to create department and question type relation objects for all selected question type and push those object in objectsTpSave list
    function createAndSaveDepartmentQuestionTypeRelations(department, selectedQuestionTypes, questionTypeObjectsMap) {
        for (var questionTypeIndex in selectedQuestionTypes) {    // adds other relations with department
            var newDepartmentQuestionRelation = new DepartmentQuestionTypeRelationModel();
            newDepartmentQuestionRelation.set("department", department);
            newDepartmentQuestionRelation.set("question_type", questionTypeObjectsMap[selectedQuestionTypes[questionTypeIndex]]);
            objectsToSave.push(newDepartmentQuestionRelation);
        }
    }

    // function validates all received data like question type id's  and department names and relation between department name and question types
    function validateReceivedData(successCallback, errorCallback) {
        var validatedData = {},
            QuestionTypeModel = Parse.Object.extend("Quiz_Question_Type");
        validatedData.isValid = true;
        validatedData.questionTypeMap = {};
        for (var index in otherQuestionTypes) {    // validate other question type id's
            // if not valid then it sets isValid to false
            if (otherQuestionTypes[index].hash != md5.hex_md5(secret.securityKey1 + hashTimeStamp + otherQuestionTypes[index].id + secret.securityKey2)) {
                validatedData.isValid = false;
                break;
            }
            else {    // if id is valid then it creates their object
                var questionTypeObject = new QuestionTypeModel();
                questionTypeObject.id = otherQuestionTypes[index].id;
                validatedData.questionTypeMap[otherQuestionTypes[index].id] = questionTypeObject;
            }
        }

        if (validatedData.isValid) { // if all the question type ID's were valid

            var departmentOccurrenceMap = {};  // map to keep occurrence track of every department
            for (var departmentIndex in newDepartments) {  // iterate each parent department
                var parentDepartment = newDepartments[departmentIndex],
                    departmentName = (typeof parentDepartment.name === "string") ? parentDepartment.name.toLowerCase() : "";
                parentDepartment.questionType = _.uniq(parentDepartment.questionType);   // removes the duplicate question types form the selected question type list

                // validates department name, occurrence and selected question types
                if (checkDepartmentNameAndOccurrence(departmentOccurrenceMap, departmentName) && validateDepartmentQuestionType(validatedData.questionTypeMap, parentDepartment.questionType)) {

                    // iterate subdepartment of the parent department and validate each sub department as parent department
                    for (var subDepartmentIndex in parentDepartment.subDepartments) {
                        var subDepartment = parentDepartment.subDepartments[subDepartmentIndex],
                            subDepartmentName = (typeof subDepartment.name === "string") ? subDepartment.name.toLowerCase() : "";
                        subDepartment.questionType = _.uniq(subDepartment.questionType);
                        if (!(checkDepartmentNameAndOccurrence(departmentOccurrenceMap, subDepartmentName) && validateDepartmentQuestionType(validatedData.questionTypeMap, parentDepartment.questionType))) {
                            validatedData.isValid = false;
                            break;
                        }
                    }
                }
                else {
                    validatedData.isValid = false;
                    break;
                }
            }
            if (validatedData.isValid) {
                successCallback(validatedData);
            }
            else {
                errorCallback("Invalid Data");
            }

        }
        else {
            errorCallback("Invalid Data");
        }
    }

    var currentUser = req.currentUser,
        companyId = (typeof req.body.companyId === "string") ? req.body.companyId.trim() : "",
        errorCallback = req.errorCallback,
        newDepartments = req.body.departments,
        otherQuestionTypes = req.body.otherQuestionTypes,
        hashTimeStamp = req.body.hashTimeStamp,
        objectsToSave = [],
        departmentSubDepartmentRelationMap = {},
        departmentObjectMap = {},
        DepartmentModel = Parse.Object.extend("Department"),
        DepartmentQuestionTypeRelationModel = Parse.Object.extend("Department_Question_Type_Relation");
    getCompany(function (company) {
        if (company) {
            companyUtils.fetchCustomDepartmentCount(company, function (departmentCount) {
                if (departmentCount === 0) {    // checks if valid company's user is making the setup request
                    validateReceivedData(function (validatedData) {
                        var newDepartmentCount = 0;
                        for (var departmentIndex in newDepartments) {  // iterate paren department
                            newDepartments[departmentIndex].questionType = _.uniq(newDepartments[departmentIndex].questionType); // to remove repeated department types
                            var parentDepartment = createDepartmentObject(newDepartments[departmentIndex].name, company),    // creates department object
                                subDepartmentObjectsList = [];
                            objectsToSave.push(parentDepartment);

                            // create department and question type rel for all selected question types
                            createAndSaveDepartmentQuestionTypeRelations(parentDepartment, newDepartments[departmentIndex].questionType, validatedData.questionTypeMap);

                            newDepartmentCount++;
                            var subDepartments = newDepartments[departmentIndex].subDepartments;

                            for (var subDepartmentIndex in subDepartments) {  // iterate each sub department of the parent department
                                var subDepartment = createDepartmentObject(subDepartments[subDepartmentIndex].name, company);
                                objectsToSave.push(subDepartment);
                                // create department and question type rel for all selected question types
                                createAndSaveDepartmentQuestionTypeRelations(subDepartment, subDepartments[subDepartmentIndex].questionType, validatedData.questionTypeMap);
                                newDepartmentCount++;
                                subDepartmentObjectsList.push(subDepartment);
                            }
                            if (subDepartmentObjectsList.length > 0) {  // if parent department has any sub department
                                parentDepartment.set("subdepartments", subDepartmentObjectsList);   // set sub department pointers in parant department's subdepartment array
                            }
                        }
                        company.increment("department_count", newDepartmentCount);
                        Parse.Object.saveAll(objectsToSave).then(function (savedObjectList) {

                            // update parent department pointer in child objects
                            var updatedChildObjectList = [];

                            // iterate each saved object
                            for(var savedObjectIndex in savedObjectList){
                                if(savedObjectList[savedObjectIndex].className === "Department"){  // if object is of class Department
                                    var parentDepartmentObject = savedObjectList[savedObjectIndex],
                                        subDepartmentsOfParent = parentDepartmentObject.get("subdepartments");
                                    // iterate sub departments of the department and update parent_department pointer
                                    for(var subDepartmentIndex in subDepartmentsOfParent){
                                        subDepartmentsOfParent[subDepartmentIndex].set("parent_department", parentDepartmentObject);
                                        updatedChildObjectList.push(subDepartmentsOfParent[subDepartmentIndex]);
                                    }
                                }
                            }

                            // if no object is updated
                            if(updatedChildObjectList.length == 0) {
                                res.send({success: true});
                            }
                            else{
                                Parse.Object.saveAll(updatedChildObjectList).then(function () {  // save updated objects
                                    res.send({success: true});
                                }, errorCallback)
                            }
                        }, errorCallback);
                    }, function (errorMessage) {
                        res.send({success: false, message: errorMessage});
                    }, errorCallback);
                }
                else {
                    res.status(404).send({message: "Unauthorized Access Denied"});
                }

            }, errorCallback);
        }
        else {
            res.status(404).send({message: "Unauthorized Access Denied"});
        }
    });

};

// function to remove question type and department relation
exports.removeQuestionTypeInDepartmentController = function(req, res){
    var errorCallback = req.errorCallback,
        currentUser = req.currentUser,
        departmentId = req.body.departmentId,
        questionTypeId = req.body.questionTypeId,
        departmentModel = Parse.Object.extend("Department"),
        questionTypeModel = Parse.Object.extend("Quiz_Question_Type"),
        departmentObject = new departmentModel(),
        questionTypeObject = new questionTypeModel(),
        hash = req.body.hash;
    departmentObject.id = departmentId;
    questionTypeObject.id = questionTypeId;
    if(hash == md5.hex_md5(secret.securityKey1 + currentUser.id + departmentId + questionTypeId + secret.securityKey2)){    // authenticate question type id and department id
        companyUtils.findDepartmentQuestionTypeRelation(departmentObject, questionTypeObject, function(relation){
            // exclude default question type from all department list
            relation = (Array.isArray(relation) && relation.length !== 0)? relation.filter(function(obj){
                    return (typeof obj.get('question_type') === "undefined" ||
                    typeof obj.get('question_type').get('name') !== "string" ||
                    obj.get('question_type').get('name').toLowerCase() !== companyConstants.DEFAULT_QUESTION_TYPE_NAME.toLowerCase());}) : [];
            if(relation.length !== 0){
                  Parse.Object.destroyAll(relation).then(function(){
                    res.send({success: true});
                }, errorCallback);
            }
            else{    // if no relation found
                res.send({success: true});
            }
        }, errorCallback)
    }
    else{
        res.status(404).send({message: "Unauthorized Access Denied"});
    }

};

// function to add new department for the admin or account owner company
exports.addNewCompanyController = function(req, res){
    var currentUser = req.currentUser,
        errorCallback = req.errorCallback,
        newCompanyName = req.body.companyName || '',
        companyDomains = req.body.companyDomains || [],
        CompanyModel = Parse.Object.extend('Company'),
        CompanyDomainModel = Parse.Object.extend('Company_Domain'),
        companyQuery = new Parse.Query("Company"),
        companyDomainQuery = new Parse.Query("Company_Domain");

    var validateCompanyData = function() {
        var returnValue = true, errorDict = {};
        if (newCompanyName.length <= 0 || newCompanyName.length > companyConstants.COMPANY_NAME_MAX_LENGTH) {
            errorDict['companyName'] = 'Please enter a valid company name!';
            returnValue = false;
        }
        if (companyDomains.length <= 0){
            errorDict['companyDomainName'] = 'Company domain is required!';
            returnValue = false;
        } else {
            for (var index in companyDomains) {
                companyDomains[index] = companyDomains[index].toLowerCase();
                if(!commonUtils.validateDomain(companyDomains[index])) {
                    errorDict[companyDomains[index]] = 'Company domain is invalid!';
                    returnValue = false;
                }
            }
            // Get unique domains
            companyDomains = companyDomains.filter(function(item, i, ar){ return ar.indexOf(item) === i; });
        }
        if (!returnValue) {
            res.send({success: false, errors: errorDict});
        }
        return returnValue;
    };

    if(userConstants.USER_PERMISSION_TYPE.SUPER_ADMIN === currentUser.get('permission_type')) {
        if (validateCompanyData()) {
            companyQuery.matches('name', commonUtils.getCaseInsensitiveRegex(newCompanyName));
            companyQuery.find().then(function (companies) {
                if (companies.length == 0) {
                    var objectsToSave = [], newCompany = new CompanyModel();
                    newCompany.set('name', newCompanyName);
                    newCompany.set('pardotName', (newCompanyName || '').toLowerCase().replace(/\s\t\n/, '_'));
                    objectsToSave.push(newCompany);
                    companyDomainQuery.containedIn('domain', companyDomains);
                    companyDomainQuery.find().then(function (domains) {
                        if (domains.length == 0) {
                            for (var index in companyDomains) {
                                var newCompanyDomain = new CompanyDomainModel();
                                newCompanyDomain.set('company', newCompany);
                                newCompanyDomain.set('domain', companyDomains[index]);
                                objectsToSave.push(newCompanyDomain);
                            }
                            Parse.Object.saveAll(objectsToSave).then(function () {
                                res.send({success: true, company: newCompany});
                            }, errorCallback);
                        } else {
                            var errorDict = {};
                            for (var domainIndex in domains) {
                                errorDict[domains[domainIndex].get('domain')] = 'Company Domain already exists!';
                            }
                            res.send({success: false, errors: errorDict});
                        }
                    }, errorCallback);
                } else {
                    res.send({success: false, errors: {companyName: 'Company with this name already exists!'}});
                }
            }, errorCallback);
        }
    } else {
        res.status(404).send({message: "Unauthorized Access Denied"});
    }
};


// function to add new department for the admin or account owner company
exports.addPardotListToCompanyController = function(req, res){
    var currentUser = req.currentUser,
        errorCallback = req.errorCallback,
        newCompanyId = req.query.company_id,
        companyModel = Parse.Object.extend('Company'),
        companyQuery = new Parse.Query(companyModel);
    if (typeof newCompanyId === "string" && newCompanyId.trim() !== "") {
        companyQuery.get(newCompanyId, {
            success: function (company) {
                if (company && !company.get('pardot_list_id')) {
                    var pardotCompanyName = (appSettings.PRODUCTION? "Workstyle - " : "Workstyle Dev - ") + company.get('name');

                    commonUtils.createNewPardotList({
                        name: pardotCompanyName
                    }, function (pardotListId) {
                        company.set('pardot_list_id', String(pardotListId));
                        company.save().then(function(){
                            res.send({
                                success: true
                            });
                        }, errorCallback);
                    }, errorCallback);
                } else {
                    res.send({success: false, errorMessage: 'Invalid Request'});
                }
            },
            error: errorCallback
        });
    }
};
