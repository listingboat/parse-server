var  md5 = require('../../packages/md5.js'),
    secret = require('../../secret.js'),
    quizUtils = require('../quiz/utils.js'),
    userUtils = require('../user/utils.js'),
    _ = require('underscore'),
    companyConstants = require('../company/constants.js'),
    appSettings = require('../../app_settings.js'),
    commonUtils = require('../common/utils.js');



// function to find relation of department with question type
exports. findDepartmentQuestionTypeRelation = function(departmentObject, questionTypeObject, successCallback, errorCallback){
    var departmentQuestionTypeRelationQuery = new Parse.Query("Department_Question_Type_Relation");
    departmentQuestionTypeRelationQuery.equalTo("department", departmentObject);
    departmentQuestionTypeRelationQuery.equalTo("question_type", questionTypeObject);
    departmentQuestionTypeRelationQuery.include("department", "question_type");
    departmentQuestionTypeRelationQuery.limit(1000);
    departmentQuestionTypeRelationQuery.find().then(successCallback, errorCallback);
};

exports.getInitialDepartmentSetupData = function(questionTypes){
    var context = {};
    if(questionTypes && questionTypes.length > 0){
        context.questionTypes = [];
        context.questionTypeHashTimeStamp = (new Date()).getTime();
        for(var index in questionTypes){
            if(questionTypes[index].get("name_lower_case") != companyConstants.DEFAULT_QUESTION_TYPE_NAME.toLowerCase()) {
                var questionType = {
                    id: questionTypes[index].id,
                    name: questionTypes[index].get("name"),
                    hash: md5.hex_md5(secret.securityKey1 + context.questionTypeHashTimeStamp + questionTypes[index].id + secret.securityKey2)
                };
                context.questionTypes.push(questionType);
            }
            else{
                context.basicQuestionType = {
                    name: questionTypes[index].get("name")
                }
            }
        }
        return context;
    }
    else{
        return context;
    }
};

exports.fetchCustomDepartmentCount = function(company, successCallback, errorCallback){
    var departmentQueryObject = new Parse.Query("Department");
        departmentQueryObject.equalTo("company", company);
        departmentQueryObject.notEqualTo("name_lower_case", companyConstants.DEFAULT_DEPARTMENT_NAME.toLowerCase());
        departmentQueryObject.count().then(successCallback, errorCallback);
};

// get question type for the given department
function getQuestionTypeOfDepartmentList(departmentList, successCallback, errorCallback){
    var departmentQuestionTypeRelationQuery = new Parse.Query("Department_Question_Type_Relation");
    departmentQuestionTypeRelationQuery.containedIn("department", departmentList);
    departmentQuestionTypeRelationQuery.find().then(successCallback, errorCallback);
}

// function creates department object against their ID and list of parent department object and add those in
exports.getParentDepartmentListAndDepartmentMap = function (departmentList) {

    var departmentObjectMap = _.object(_.pluck(departmentList, "id"), departmentList),// create map of department objects against their id
        childDepartmentsMap = {}, parentDepartmentList = [];

    // creates child departments map
    // all the departments has a parent department will be true
    for (var parentDepartmentIndex  in departmentList) {
        var childDepartments = departmentList[parentDepartmentIndex].get("subdepartments");
        for (var childDepartmentIndex in childDepartments) {
            if (childDepartments[childDepartmentIndex]) {
                childDepartmentsMap[childDepartments[childDepartmentIndex].id] = true;
            }
        }
    }

    // create department list of those department who are not child of any department
    for (var parentDepartmentIndex  in departmentList) {
        if (!childDepartmentsMap[departmentList[parentDepartmentIndex].id]) {
            parentDepartmentList.push(departmentList[parentDepartmentIndex]);
        }
    }

    return {
        departmentObjectMap: departmentObjectMap,
        parentDepartmentList: parentDepartmentList
    }
};

exports.getDepartmentSettingData = function(currentUser, company, data, successCallback, errorCallback){

    data.DEFAULT_QUESTION_TYPE_NAME = companyConstants.DEFAULT_QUESTION_TYPE_NAME.toLowerCase();
    userUtils.getDepartmentList(company, function(departmentList){    // get department list
        data.departmentList = departmentList;
        quizUtils.getQuestionTypes(function(questionTypes){    // get list of question types
            questionTypes = questionTypes.filter(function(questionTypeObject){return questionTypeObject.get('name').toLowerCase() === companyConstants.DEFAULT_QUESTION_TYPE_NAME.toLowerCase()}).concat(
                questionTypes.filter(function(questionTypeObject){return questionTypeObject.get('name').toLowerCase() !== companyConstants.DEFAULT_QUESTION_TYPE_NAME.toLowerCase()}));
            data.questionTypeList = questionTypes;
            data.questionTypeIDList = questionTypes.map(function(obj){return obj.id});
            data.timeStamp = (new Date()).getTime();
            data.questionTypeIDListHash = md5.hex_md5(appSettings.securityKey1 + currentUser.id + data.questionTypeIDList + data.timeStamp + appSettings.securityKey2);
            data.isDepartmentSetupRequired = (departmentList.length == 1 && departmentList[0].get("name").toLowerCase() == companyConstants.DEFAULT_DEPARTMENT_NAME.toLowerCase());
            if(data.isDepartmentSetupRequired){
                _.extend(data, exports.getInitialDepartmentSetupData(questionTypes));
                successCallback(data);
            }
            else if(departmentList.length == 0){
                var DepartmentModel = Parse.Object.extend("Department"),
                    departmentObject = new DepartmentModel();
                departmentObject.set("name", companyConstants.DEFAULT_DEPARTMENT_NAME);
                departmentObject.set("company", company);
                departmentObject.set("name_lower_case", companyConstants.DEFAULT_DEPARTMENT_NAME.toLowerCase());
                departmentObject.set("user_count", 0);
                departmentObject.save().then(function(){
                    data.isDepartmentSetupRequired = true;
                    _.extend(data, exports.getInitialDepartmentSetupData(questionTypes));
                    successCallback(data);
                }, errorCallback);
            }
            else {
                getQuestionTypeOfDepartmentList(departmentList, function (departmentQuestionTypeList) {
                    var selectedQuestionTypeDepartmentMap = {};
                    // generate department and question type relation map
                    _.extend(data, exports.getSortedDepartmentHierarchyList(departmentList));
                    for (var index = 0; index < departmentQuestionTypeList.length; index++) {
                        var departmentId = departmentQuestionTypeList[index].get("department").id,
                            questionTypeId = departmentQuestionTypeList[index].get("question_type").id;
                        if (!selectedQuestionTypeDepartmentMap[departmentId]) {
                            selectedQuestionTypeDepartmentMap[departmentId] = {}
                        }
                        selectedQuestionTypeDepartmentMap[departmentId][questionTypeId] = true;
                    }
                    data.departmentQuestionTypeMap = selectedQuestionTypeDepartmentMap;
                    successCallback(data);
                }, errorCallback);
            }
        }, errorCallback);
    })
};

exports.companyExists = function(companyId, successCallback, errorCallback){
    var CompanyModel = Parse.Object.extend('Company'),
        companyQuery = new Parse.Query(CompanyModel);
    companyQuery.get(companyId, {
        success: successCallback,
        error: errorCallback
    });
};

// function to return sorted list of parent department and their sub departments
exports.getSortedDepartmentHierarchyList = function(departmentList){

    var parentDepartmentsList = [], childDepartmentsList = {};

    //  put the department in parent list or in it's parent's child list
    for(var index in departmentList){
        var department = departmentList[index];
        if(department.get("parent_department")){
            if(!childDepartmentsList[department.get("parent_department").id]){
                childDepartmentsList[department.get("parent_department").id] = [];
            }
            childDepartmentsList[department.get("parent_department").id].push(department);
        }
        else{
            parentDepartmentsList.push(department);
        }
    }

    // sort parent parent department list along with their child department list
    parentDepartmentsList = commonUtils.sortObjectsByName(parentDepartmentsList);
    for(var parentId in childDepartmentsList){
        childDepartmentsList[parentId] = commonUtils.sortObjectsByName(childDepartmentsList[parentId])
    }
    
    return {parentDepartmentList: parentDepartmentsList, childDepartmentsList: childDepartmentsList};
};
