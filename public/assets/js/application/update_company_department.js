
function DepartmentSettingsModule() {
    var thisInstance = this;

    thisInstance.selectors = {
        departmentDataContainer: ".js_data_container",
        newDepartmentField: "#new_department",
        createNewDepartmentButton : ".js_create_new_department",
        questionTypeValue: ".js_question_type_values",
        departmentRow: ".js_department_row",
        newDepartmentButton: ".js_add_new_department_button",
        newDepartmentForm: ".js_add_new_department_form",
        newSubDepartmentForm: ".js_add_new_sub_department_form",
        cancelAddNewDepartmentButton: ".js_cancel_add_department",
        addDepartmentButtonWrap: "js_add_new_department_button",
        departmentListWrapper: ".js_department_list",
        errorModal: '#id-upload-csv-error',
        message: '.js_message',
        addSubDepartmentLink: ".js_add_sub_department_form",
        parentIdFieldInSubDepartmentForm: ".js_parent_id_field"
        //removeDepartmentBlock: ".js_remove_department_block",
        //removeDepartmentLink: ".js_remove_department_link"
    };

    thisInstance.dataAttributeNames = {
        addNewDepartmentUrl: "add_new_department_url",
        //removeDepartmentUrl: "remove_department_url",
        addDepartmentQuestionTypeRelation: "add_department_question_type_relation",
        removeDepartmentQuestionTypeRelation: "remove_department_question_type_relation"
    };

    this.init = function (options) {
        options = options || {};
        thisInstance.companyId = options.companyId;
        addNewParentDepartmentFormBindings();  // bindings for add department form
        addNewSubDepartmentFormBindings();
        changeQuestionTypeBinding();
        //deleteDepartmentBinding();
    };

    // bindings to add new department form for new parent department
    function addNewParentDepartmentFormBindings() {
        var selector = thisInstance.selectors,
            $form = $(selector.newDepartmentForm);

        // add new department form when add new department button is clicked
        $(selector.newDepartmentButton).click(function(event){
            event.preventDefault();
            $form.removeClass('hide');
            $(selector.addDepartmentButtonWrap).addClass('hide');
        });

        // hide the add new department form when cancel link is clicked and not disabled at that time
        $(selector.cancelAddNewDepartmentButton).click(function(event){
            event.preventDefault();
            if(!$(this).hasClass("disabled")) {
                $form.addClass('hide');
                $(selector.addDepartmentButtonWrap).removeClass('hide');
            }
        });

        // add bindings for add new department form of parent department
        $form.on("submit", function (event) {    // on submit of add new department form
            var $this = $(this);
            event.preventDefault();
            if (validateDepartmentName($this)) {    // if entered department is valid
                makeAddDepartmentRequest($this, function(){ // make ajax call to add department
                    $form.addClass('hide');
                    $(selector.addDepartmentButtonWrap).removeClass('hide');
                });
            }
        });

        //$form.find(":input").on('input', function () {     // if new department field has error-bubble class it removes the error-bubble on input
        //    $(this).closest(".form-group").removeClass('error-wrap');
        //});
    }

    // bindings to add new department form for new sub department
    function addNewSubDepartmentFormBindings($addSubDepartmentLink){

        // new sub department form button bindings
        function formBindings($form){
            // cancle button bindings
            $form.find(selector.cancelAddNewDepartmentButton).on("click", function(){
                if(!$(this).hasClass("disabled")) {
                    $form.remove();
                }
            });

            // add department button binding
            $form.on("submit", function(event){
                event.preventDefault();
                if(validateDepartmentName($form)) {  // validate department name
                    makeAddDepartmentRequest($form, function () {  // make ajax call to add new department
                        $form.remove();
                    });
                }
            });
        }

        function resetSubDepartmentForm($openSubDepartmentForm, $parentDepartment){
            $openSubDepartmentForm.removeClass("hide");  // show the form
            $openSubDepartmentForm.find(selector.newDepartmentField).val("");  // reset name field
            $openSubDepartmentForm.find("input:checkbox").prop("checked", true);  // check all the checkbox of question type
            $openSubDepartmentForm.find(selector.createNewDepartmentButton).prop("disabled", false);
            $openSubDepartmentForm.find(selector.cancelAddNewDepartmentButton).removeClass("disabled");
            $openSubDepartmentForm.removeClass("js_add_new_sub_department_form");
            $openSubDepartmentForm.addClass("js_sub_form_of_" + $parentDepartment.data("department_id"));
            // add the parent id field in form
            $openSubDepartmentForm.find(selector.parentIdFieldInSubDepartmentForm).val($parentDepartment.data("department_id"));
        }

        var selector = thisInstance.selectors;

        // if $addSubDepartmentLink is not passed in args it run bindings on all the add sub department link on the page
        $addSubDepartmentLink = $addSubDepartmentLink || $(selector.addSubDepartmentLink);

        // when add sub department link is clicked
        $addSubDepartmentLink.on("click", function(){
            var $parentDepartment = $(this).closest(selector.departmentRow);
            if($(".js_sub_form_of_" + $parentDepartment.data("department_id")).length == 0) {
                $(selector.addSubDepartmentLink).addClass("disabled");

                //finds the last child department if any else return parent department itself
                var $insertAfter = ($(".js_sub_of_" + $parentDepartment.data("department_id")).length > 0)
                        ? $(".js_sub_of_" + $parentDepartment.data("department_id")).last() : $parentDepartment,

                    // clone and insets the add new department form after last child or parent(if no child)
                    $openSubDepartmentForm = $(selector.newSubDepartmentForm).clone().insertAfter($insertAfter);
                resetSubDepartmentForm($openSubDepartmentForm, $parentDepartment);
                formBindings($openSubDepartmentForm);  // run form bindings
            }
        });

    }

    //// function to add event listener on remove department link
    //function deleteDepartmentBinding($this) {
    //    var selector = thisInstance.selectors;
    //    $this = $this || $(selector.departmentRow);
    //    $this.find(selector.removeDepartmentLink).click(function () {
    //        var $removeDepartmentLink  = $(this)
    //        if(!$removeDepartmentLink.hasClass("disabled")) {
    //            makeRemoveDepartmentRequest($removeDepartmentLink);
    //        }
    //    });
    //}


    function changeQuestionTypeBinding($this) {
        var selector = thisInstance.selectors;
        $this = $this || $(selector.questionTypeValue);
        $this.find(':checkbox').on("change", function () {
            function enableCheckboxCallback() {
                $(checkboxElement).prop("disabled", false);
            }

            var checkboxElement = this;
            var data = {
                departmentId: ($(checkboxElement).closest(selector.departmentRow).data("department_id")),
                questionTypeId: $(checkboxElement).val(),
                hash: ($(this).data("hash"))
            };
            if (thisInstance.companyId) {
                data.companyId = thisInstance.companyId;
            }

            $(this).prop("disabled", true);
            if ($(this).is(":checked")) {
                addQuestionTypeInDepartment(data, checkboxElement, enableCheckboxCallback);
            }
            else {
                removeQuestionTypeFromDepartment(data, checkboxElement, enableCheckboxCallback);
            }
        });
    }

    function validateDepartmentName($form) {
        var selector = thisInstance.selectors,
            $newDepartmentField = $form.find(selector.newDepartmentField),
            newDepartmentName = $.trim($newDepartmentField.val());
        if (newDepartmentName && newDepartmentName != "") {
            return true;
        }
        else {
            $newDepartmentField.closest(".form-group").find('.error-text-wrap').text('*Required');
            $newDepartmentField.closest(".form-group").addClass('error-wrap');
            return false;
        }
    }

    // function to make add new department call
    function makeAddDepartmentRequest($form, successCallback) {
        var selector = thisInstance.selectors,
            dataAttr = thisInstance.dataAttributeNames;

        // disable form button and cancel link
        $form.find(selector.createNewDepartmentButton).prop("disabled", true);
        $form.find(selector.cancelAddNewDepartmentButton).addClass("disabled");
        var data = $form.serialize();
        if(thisInstance.companyId){
            data = data + '&' + $.param({companyId: thisInstance.companyId});
        }

        $.ajax({
            type: "post",
            url: $(selector.departmentDataContainer).data(dataAttr.addNewDepartmentUrl),
            data: data
        }).done(function (data) {
            if (data.success) {    // if new department is addedd successfully
                var $newDepartmentRow = $(data.newDepartmentPartial).insertBefore($form); // add new department row at the end of the department list
                $form[0] ? $form[0].reset() : null;
                changeQuestionTypeBinding($form.closest(selector.departmentListWrapper).find(selector.departmentRow + ":last"));
                if(data.isParentDepartment){  // if new department is a parent department
                    // bind it's add sub department  link
                    addNewSubDepartmentFormBindings($newDepartmentRow.find(selector.addSubDepartmentLink));
                }
                successCallback();
            }
            else {     // if there was something wrong with the new department name then it shows the error message
                //$newDepartmentField.closest(".form-group").find('.error-text-wrap').text(data.departmentError);
                //$newDepartmentField.closest(".form-group").addClass('error-wrap');
                showErrorModal(data.departmentError);
            }
        }).fail(function(error){
            if(error && error.status === 401){
                location.reload();
            }
        }).always(function(){
            $form.find(selector.createNewDepartmentButton).prop("disabled", false);
            $form.find(selector.cancelAddNewDepartmentButton).removeClass("disabled");
        });
    }

    //// function that makes delete department request
    //function makeRemoveDepartmentRequest($removeDepartmentLink){
    //    var selector = thisInstance.selectors,
    //        dataAttr = thisInstance.dataAttributeNames;
    //    $removeDepartmentLink.addClass("disabled");
    //    $.ajax({
    //        method: "post",
    //        url: $(selector.departmentDataContainer).data(dataAttr.removeDepartmentUrl),
    //        data: {departmentId: $removeDepartmentLink.closest(selector.departmentRow).data("department_id")},
    //        success: function(data){
    //            if(data.success){
    //                $removeDepartmentLink.closest(selector.departmentRow).remove()
    //            }
    //            else{
    //                $removeDepartmentLink.removeClass("disabled");
    //            }
    //        },
    //        error: function(error){
    //            $removeDepartmentLink.removeClass("disabled");
    //        }
    //    });
    //}

    function addQuestionTypeInDepartment(data, checkboxElement, alwaysCallback) {
        var selector = thisInstance.selectors,
            dataAttr = thisInstance.dataAttributeNames;
        $.ajax({
            type: "POST",
            url: $(selector.departmentDataContainer).data(dataAttr.addDepartmentQuestionTypeRelation),
            data: data,
            error: function (error) {
                if(error && error.status === 401){
                    location.reload();
                }
                else {
                    $(checkboxElement).prop("checked", false);
                }
            }
        }).always(alwaysCallback);
    }

    function removeQuestionTypeFromDepartment(data, checkboxElement, alwaysCallback) {
        var selector = thisInstance.selectors,
            dataAttr = thisInstance.dataAttributeNames;
        $.ajax({
            type: "POST",
            url: $(selector.departmentDataContainer).data(dataAttr.removeDepartmentQuestionTypeRelation),
            data: data,
            error: function (error) {
                if(error && error.status === 401){
                    location.reload();
                }
                else {
                    $(checkboxElement).prop("checked", true);
                }
            }
        }).always(alwaysCallback);
    }

    function showErrorModal(errorMessage) {
        var selector = thisInstance.selectors,
            $errorModal = $(selector.errorModal);
        $errorModal.find(selector.message).text(errorMessage);
        $errorModal.modal('show');
    }
}
