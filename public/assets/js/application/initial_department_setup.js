function InitialDepartmentSetupModule(){
    var thisInstance = this;
    thisInstance.constants = {  // constants
        selector: {
            errorModal: '#id-upload-csv-error',
            message: '.js_message',
            inviteDiv: "#invite_div",    // actual invite page div
            departmentSetupDiv: "#department_setup_div",    // div with text box where we add departments
            toInvitePage: "#to-invite-page",    // back button on add department page
            departmentSetupForm: "#department-setup-form",    //  form with text box to add new departments
            lastDepartmentDiv: ".js_active",     // active text box on input of that text box we add new text box
            newDepartmentField: ".js_new_department_field",    // new department text box
            newDepartmentDiv: ".js_new_department_div",     // new department text box's parent div
            removeDepartmentAnchor: ".js_remove_department_anchor",    // "X" to remove department box
            questionTypeDiv: "#select-question-type-div",  // select question type main div
            departmentQuestionRelationDiv: ".js_relation_div",    // question type row for department
            sampleDepartmentQuestionRelationDiv: ".js_relation_div_sample",    // sample question type row
            departmentLabelSpan: ".js_department_label_span",    // section with department name on select question type page
            departmentQuestionTypeRelationForm : "#department-question-type-form",    // select question type form
            questionTypes: ".js_question_types",    // select question type checkbox div
            initialSetupPage: "#start-department-settings-section",
            inviteEmployeeSection: "#invite-employees-section",
            departmentSetupButton: "#setup-department-button",
            departmentSubdivisionPage: ".js_department_subdivision_page",
            toDepartmentSetupStep1: ".js_to_department_setup_step_1",
            toDepartmentSetupStep2: ".js_to_department_setup_step_2",
            sampleDepartmentSubDivisionSection: ".js_sample_department_division_set",
            departmentSubDivisionSection: ".js_department_division_set",
            parentDepartmentHeadingInSubdivisionSection: ".js_parent_department_heading",
            newSubDepartmentField: ".js_new_sub_department_field",
            newSubDepartmentDiv: ".js_new_sub_department_div",
            lastActiveSubDepartment: ".js_active_sub_department",
            addSubDepartmentsForm: "#add-sub-department-form",
            parentDepartmentInSelectQuestionType: ".js_parent_department"
        },
        class: {
            lastDepartmentActiveClass: "active",    // class to hide 'X' button from text box
            lastDepartmentBeActiveClass: "js_active",  // class to add on last department box
            sampleRelationDivClass: "js_relation_div_sample",
            usedRelationDivClass: "js_relation_div",
            parentDepartmentQuestionRelation: "js_parent_department"
        }
    };
    thisInstance.departmentCount = 0;
    thisInstance.requestDataObject = {};
    thisInstance.init = function(options){
        options = options || {};
        thisInstance.setupCompleteCallback = options.setupCompleteCallback;
        thisInstance.requestDataObject.companyId = options.companyId;
        backButtonBindings();
        dataInitialization();
        bindParentDepartmentValidation();
        bindSubDepartmentValidation();
        submitDepartmentSettingBindings();
        bindAddParentDepartmentBoxBinding();
    };

    function backButtonBindings() {
        var selector = thisInstance.constants.selector;
        $(selector.toDepartmentSetupStep1).click(function () {
            $(selector.inviteDiv).addClass("hide");
            $(selector.questionTypeDiv).addClass("hide");
            $(selector.departmentSubdivisionPage).addClass("hide");
            $(selector.departmentSetupDiv).removeClass("hide");
        });

        $(selector.toDepartmentSetupStep2).click(function () {
            $(selector.inviteDiv).addClass("hide");
            $(selector.questionTypeDiv).addClass("hide");
            $(selector.departmentSetupDiv).addClass("hide");
            $(selector.departmentSubdivisionPage).removeClass("hide");
        });
    }

    function dataInitialization(){
        var selector = thisInstance.constants.selector;
        thisInstance.defaultDepartmentName = $(selector.questionTypeDiv).data("default_department_name").toLowerCase();
        thisInstance.requestDataObject.hashTimeStamp = $(selector.questionTypeDiv).data("hash_time_stamp");
        thisInstance.requestDataObject.otherQuestionTypes = [];
        $(selector.sampleDepartmentQuestionRelationDiv).find(selector.questionTypes).each(function(){
            thisInstance.requestDataObject.otherQuestionTypes.push({
                id: $(this).data("question_type_id"),
                hash: $(this).data("question_type_hash")
            });
        });
    }

    // binds remove link and remove error wrap on input of newly added department
    function newParentDepartmentFieldBindings($this){
        var selector = thisInstance.constants.selector;
        $this.find(selector.removeDepartmentAnchor).on("click", function(event){
            var $departmentQuestionRelation = $("#" + $(this).closest(selector.newDepartmentDiv).data("department_index"));
            $departmentQuestionRelation.remove();
            removeChildDepartments($(this).closest(selector.newDepartmentDiv));
            $(this).closest(selector.newDepartmentDiv).remove();
        });

        $this.find(selector.newDepartmentField).on("input", function(){
            $(this).closest(selector.newDepartmentDiv).removeClass("error-wrap");
        });
    }

    // binds remove link and remove error wrap on input of newly added department
    function newChildDepartmentFieldBindings($this){
        var selector = thisInstance.constants.selector;
        $this.find(selector.removeDepartmentAnchor).on("click", function(event){
            var $departmentQuestionRelation = $("#" + $(this).closest(selector.newSubDepartmentDiv).data("department_index"));
            $departmentQuestionRelation.remove();
            $(this).closest(selector.newSubDepartmentDiv).remove();
        });

        $this.find(selector.newSubDepartmentField).on("input", function(){
            $(this).closest(selector.newSubDepartmentDiv).removeClass("error-wrap");
        });
    }

    // binds the add new department filed on input of last department field
    function bindAddParentDepartmentBoxBinding(){
        var selector = thisInstance.constants.selector;
        $(selector.lastDepartmentDiv).find(selector.newDepartmentField).one("input", function(event){
            var $currentInputDiv = $(this).closest(selector.lastDepartmentDiv);

            // insert the new text box and reset it's value
            var $newTextBox = $currentInputDiv.clone().insertAfter($currentInputDiv).find(selector.newDepartmentField).val("");

            $currentInputDiv.removeClass(thisInstance.constants.class.lastDepartmentActiveClass);  // removes the style class from current input's parent div
            $currentInputDiv.removeClass(thisInstance.constants.class.lastDepartmentBeActiveClass);  // removes the event binding class from current input's parent div
            $currentInputDiv.data("department_index", ("dep" + thisInstance.departmentCount++));  // set unique department name for new created department and increase department counter value
            bindParentDepartmentNameUpdation($currentInputDiv.find(selector.newDepartmentField));  // bind the focus out event on parent department text box
            bindAddParentDepartmentBoxBinding();
            newParentDepartmentFieldBindings($currentInputDiv);
        });
    }

    // binds the add new department filed on input of last department field
    function bindAddChildDepartmentBoxBinding($subDivisionSection){
        var selector = thisInstance.constants.selector;
        $subDivisionSection.find(selector.newSubDepartmentField).one("input", function(event){
            var $currentInputDiv = $(this).closest(selector.lastActiveSubDepartment);

            // insert the new text box and reset it's value
            var $newTextBox = $currentInputDiv.clone().insertAfter($currentInputDiv).find(selector.newSubDepartmentField).val("");

            $currentInputDiv.removeClass(thisInstance.constants.class.lastDepartmentActiveClass); // removes the style class from current input's parent div
            $currentInputDiv.removeClass("js_active_sub_department");  // removes the event binding class from current input's parent div
            $currentInputDiv.data("department_index", ("dep" + thisInstance.departmentCount++));  // set unique department name for new created department and increase department counter value
            bindChildDepartmentNameUpdation($currentInputDiv.find(selector.newSubDepartmentField));
            bindAddChildDepartmentBoxBinding($newTextBox.closest(selector.lastActiveSubDepartment));
            newChildDepartmentFieldBindings($currentInputDiv);
        });
    }

    // binds department field focus out event,
    // when we focus out it updates the department name on the other scree or remove department field from the list if it is empty on focus out
    function bindParentDepartmentNameUpdation($this){
        var selector = thisInstance.constants.selector;
        $this.focusout(function(){
            var $parentDiv = $(this).closest(selector.newDepartmentDiv);  // find the parent div

            // if value of input box is blank and input box is not the last one
            if(!$parentDiv.hasClass(thisInstance.constants.class.lastDepartmentBeActiveClass) && $.trim($(this).val()) == ""){
                var $respectedRelationRow = $("#" + $parentDiv.data("department_index"));
                $respectedRelationRow.remove();  // remove the input box
                removeChildDepartments($parentDiv);
                $parentDiv.remove();
            }
            else if(!$parentDiv.hasClass(thisInstance.constants.class.lastDepartmentBeActiveClass)){
                updateParentDepartmentQuestionRelation($parentDiv);
                createUpdateDepartmentSubdivisionSection($parentDiv)
            }
        });

    }

    // binds department field focus out event,
    // when we focus out it updates the department name on the other scree or remove department field from the list if it is empty on focus out
    function bindChildDepartmentNameUpdation($this){
        var selector = thisInstance.constants.selector;
        $this.focusout(function(){
            var $parentDiv = $(this).closest(selector.newSubDepartmentDiv);
            if(!$parentDiv.hasClass(selector.lastActiveSubDepartment) && $.trim($(this).val()) == ""){
                var $respectedRelationRow = $("#" + $parentDiv.data("department_index"));
                $respectedRelationRow.remove();
                $parentDiv.remove();
            }
            else if(!$parentDiv.hasClass(selector.lastActiveSubDepartment)){
                updateChildDepartmentQuestionRelation($parentDiv);
            }
        });

    }

    // remove just deleted parent department's sub department and their question types
    function removeChildDepartments($parentDepartment){
        $(".js_sub_of_" + $parentDepartment.data("department_index")).remove();
        $(".js_child_of_rel_" + $parentDepartment.data("department_index")).remove();

    }

    // function to validate department name
    function validateDepartmentName(departmentName, departmentValidationDict){
        if(departmentName.toLowerCase() != thisInstance.defaultDepartmentName) {
            if(departmentValidationDict[departmentName.toLowerCase()]){
                departmentValidationDict[departmentName.toLowerCase()].count++;
                return ({duplicateError : true});
            }
            else {
                departmentValidationDict[departmentName.toLowerCase()] = {};
                departmentValidationDict[departmentName.toLowerCase()].count = 1;
                departmentValidationDict[departmentName.toLowerCase()].name = departmentName;
                return ({isValid: true});
            }
        }
        else{
            return({invalidNameError: true})
        }
    }

    // binds form on add department page
    function bindParentDepartmentValidation(){
        var selector = thisInstance.constants.selector;
        $(selector.departmentSetupForm).submit(function(event) {
            event.preventDefault();
            if ($(selector.departmentLabelSpan).length > 1) {
                var duplicateErrorCount = 0,
                    invalidNameError = false,
                    departmentValidationDict = {};
                $(this).find(selector.newDepartmentField).each(function () {    // iterate each department text box and validates
                    if (!$(this).closest(selector.newDepartmentDiv).hasClass(thisInstance.constants.class.lastDepartmentBeActiveClass)) {
                        var departmentName = $.trim($(this).val()),
                            validationResult = validateDepartmentName(departmentName, departmentValidationDict);
                        if (validationResult.duplicateError) {
                            $(this).closest(selector.newDepartmentDiv).addClass("error-wrap");
                            duplicateErrorCount++;
                        }
                        else if (validationResult.invalidNameError) {
                            $(this).closest(selector.newDepartmentDiv).addClass("error-wrap");
                            invalidNameError = true;
                        }
                    }
                });
                if (duplicateErrorCount || invalidNameError) {   // if any name is invalid
                    generateDepartmentValidationErrorMessages(invalidNameError, duplicateErrorCount, departmentValidationDict)
                }
                else {
                    $(selector.departmentSetupDiv).addClass("hide");
                    $(selector.departmentSubdivisionPage).removeClass("hide");
                }
            }
            else{
                showErrorModal("At least add one department.");
            }
        });
    }


    // function to generate error message for invalid departments submition
    function generateDepartmentValidationErrorMessages(invalidNameError, duplicateErrorCount, departmentValidationDict){

        function getDuplicateDepartmentErrorMsg(){
            errorMsg += "Duplicate department name" + ((duplicateErrorCount > 1) ? "s  " : "  ");
            for (var duplicateNameKey in departmentValidationDict) {
                if (departmentValidationDict[duplicateNameKey].count > 1) {
                    errorMsg += departmentValidationDict[duplicateNameKey].name + ", ";
                }
            }
            errorMsg = errorMsg.substring(0, errorMsg.length - 2);
        }

        var errorMsg = "";
        if (invalidNameError) {    // if any department has name 'other'
            errorMsg += "Other department already exists. \n";
            if (duplicateErrorCount) {
                getDuplicateDepartmentErrorMsg();
            }
        }
        else if (duplicateErrorCount) {    // if duplicate name exist
            getDuplicateDepartmentErrorMsg();
        }
        showErrorModal(errorMsg);
    }

    // binds form on add department page
    function bindSubDepartmentValidation(){

        function addParentDepartmentsInValidation($form, validationDict){

        }
        var selector = thisInstance.constants.selector;
        $(selector.addSubDepartmentsForm).submit(function(event) {
            event.preventDefault();
            var duplicateErrorCount = 0,
                invalidNameError = false,
                departmentValidationDict = {},
                $thisElement = $(this);
            $thisElement.find(selector.parentDepartmentHeadingInSubdivisionSection).each(function(){
                if($(this).text() != ""){
                    departmentValidationDict[$(this).text().toLowerCase()] = 1;
                }
            });
            $thisElement.find(selector.newSubDepartmentField).each(function () {    // iterate each department text box and validates
                if (!$(this).closest(selector.newSubDepartmentDiv).hasClass("js_active_sub_department")) {
                    var departmentName = $.trim($(this).val()),
                        validationResult = validateDepartmentName(departmentName, departmentValidationDict);
                    if (validationResult.duplicateError) {
                        $(this).closest(selector.newSubDepartmentDiv).addClass("error-wrap");
                        duplicateErrorCount++;
                    }
                    else if (validationResult.invalidNameError) {
                        $(this).closest(selector.newSubDepartmentDiv).addClass("error-wrap");
                        invalidNameError = true;
                    }
                }
            });
            if (duplicateErrorCount || invalidNameError) {   // if any name is invalid
                generateDepartmentValidationErrorMessages(invalidNameError, duplicateErrorCount, departmentValidationDict);
            }
            else {
                $(selector.departmentSetupDiv).addClass("hide");
                $(selector.departmentSubdivisionPage).addClass("hide");
                $(selector.questionTypeDiv).removeClass("hide");
            }
        });
    }


    // binds form on choose skill type page
    function submitDepartmentSettingBindings(){
        var selector = thisInstance.constants.selector;
        $(selector.departmentQuestionTypeRelationForm).submit(function(event){
            event.preventDefault();
            var $form = $(this);
            thisInstance.requestDataObject.departments = [];
            $form.find(selector.parentDepartmentInSelectQuestionType).each(function(){    // iterate each department row to get data
                var departmentObject ={},
                    $relationDiv = $(this);
                departmentObject.name = $relationDiv.find(selector.departmentLabelSpan).text();
                departmentObject.questionType = [];
                departmentObject.subDepartments = [];
                $(".js_child_of_rel_" + $relationDiv.attr("id")).each(function(){
                    var childDepartmentObject = {},
                        $childDepartmentDiv = $(this);
                    childDepartmentObject.name = $childDepartmentDiv.find(selector.departmentLabelSpan).text();
                    childDepartmentObject.questionType = [];
                    $childDepartmentDiv.find(selector.questionTypes).each(function(){
                        var $questionType = $(this);
                        if($questionType.is(":checked")){
                            childDepartmentObject.questionType.push($questionType.data("question_type_id"));
                        }
                    });
                    departmentObject.subDepartments.push(childDepartmentObject);
                });
                $relationDiv.find(selector.questionTypes).each(function(){
                    var $questionType = $(this);
                    if($questionType.is(":checked")){
                        departmentObject.questionType.push($questionType.data("question_type_id"));
                    }
                });
                thisInstance.requestDataObject.departments.push(departmentObject);
            });
            setupDepartment();
        });

    }


    // function to make department setup request
    function setupDepartment(){
        var selector = thisInstance.constants.selector;
        showLoader(true);
        $(selector.departmentSetupButton).prop("disabled", true);
        $.ajax({
            method: "post",
            url: $(selector.questionTypeDiv).data("setup_url"),
            contentType: 'application/json',
            data: JSON.stringify(thisInstance.requestDataObject),
            success: function(data){
                if(data.success){    // if departments created successfully
                    $(selector.questionTypeDiv).remove();    // remove select question types section
                    $(selector.departmentSetupDiv).remove();    // remove add department section
                    if(typeof thisInstance.setupCompleteCallback === "function") {    // if this flow is called from invite page
                        thisInstance.setupCompleteCallback();
                    }
                    else{    // if no setup complete callback is passed
                        location.reload();
                    }
                }
                else{
                    showErrorModal(data.message);
                }
            },
            error: function(error){
                if(error && error.status === 401){
                    location.reload();
                }
                else {
                    showErrorModal(error.message);
                }
            }
        }).always(function(){
            showLoader(false);
            $(selector.departmentSetupButton).prop("disabled", false);
        })
    }

    // create update department name on next screen
    function updateParentDepartmentQuestionRelation($department){
        var selector = thisInstance.constants.selector,
            departmentName = $.trim($department.find((selector.newDepartmentField)).val());
        if($relation = $("#" + $department.data("department_index")).length == 0) {
            var $sample = $(selector.sampleDepartmentQuestionRelationDiv);
            var $new = $sample.clone().insertBefore($sample);
            $new.removeClass(thisInstance.constants.class.sampleRelationDivClass);
            $new.removeClass("hide");
            $new.attr("id", $department.data("department_index"));
            $new.addClass(thisInstance.constants.class.parentDepartmentQuestionRelation);
            $new.addClass(thisInstance.constants.class.usedRelationDivClass);
            $new.find(selector.departmentLabelSpan).text(departmentName);
        }
        else{
            var $relation = $("#" + $department.data("department_index"));
            $relation.find(selector.departmentLabelSpan).text(departmentName);
        }
    }
    // create update department name on next screen
    function updateChildDepartmentQuestionRelation($department){
        var selector = thisInstance.constants.selector,
            departmentName = $.trim($department.find((selector.newSubDepartmentField)).val());
        if($relation = $("#" + $department.data("department_index")).length == 0) {
            var $sample = $(selector.sampleDepartmentQuestionRelationDiv),
                $insertAfter = ($(".js_child_of_rel_" + $department.closest(selector.departmentSubDivisionSection).data("parent")).length > 0)
                    ? $(".js_child_of_rel_" + $department.closest(selector.departmentSubDivisionSection).data("parent")).last()
                    : $("#" + $department.closest(selector.departmentSubDivisionSection).data("parent"));
            var $new = $sample.clone();
            $new.insertAfter($insertAfter);
            $new.removeClass(thisInstance.constants.class.sampleRelationDivClass);
            $new.removeClass("hide");
            $new.attr("id", $department.data("department_index"));
            $new.addClass(thisInstance.constants.class.usedRelationDivClass);
            $new.addClass("js_child_of_rel_" + $department.closest(selector.departmentSubDivisionSection).data("parent"));
            $new.find(selector.departmentLabelSpan).text(departmentName);
        }
        else{
            var $relation = $("#" + $department.data("department_index"));
            $relation.find(selector.departmentLabelSpan).text(departmentName);
        }
    }

    // create update department subdivision section
    function createUpdateDepartmentSubdivisionSection($department){
        var selector = thisInstance.constants.selector,
            departmentName = $.trim($department.find((selector.newDepartmentField)).val());
        if($relation = $(".js_sub_of_" + $department.data("department_index")).length == 0) {
            var $sample = $(selector.sampleDepartmentSubDivisionSection);
            var $new = $sample.clone().insertBefore($sample);
            $new.removeClass("js_sample_department_division_set");
            $new.removeClass("hide");
            $new.addClass("js_sub_of_"+ $department.data("department_index"));
            $new.data("parent" ,$department.data("department_index"));
            $new.addClass("js_department_division_set");
            $new.find(selector.parentDepartmentHeadingInSubdivisionSection).text(departmentName);
            bindAddChildDepartmentBoxBinding($new.find(selector.lastActiveSubDepartment));
        }
        else{
            var $relation = $(".js_sub_of_" + $department.data("department_index"));
            $relation.find(selector.parentDepartmentHeadingInSubdivisionSection).text(departmentName);
        }
    }


    // function that takes message in argument and shows that message in modal
    function showErrorModal(errorMessage) {
        var selector = thisInstance.constants.selector,
            $errorModal = $(selector.errorModal);
        $errorModal.find(selector.message).text(errorMessage);
        $errorModal.modal('show');
    }

    // function to show loader on page
    function showLoader(show){
        var loader = $('.js-full-page-loader');
        if(show){
            loader.removeClass('hide');
        }
        else{
            loader.addClass('hide');
        }
    }

}
