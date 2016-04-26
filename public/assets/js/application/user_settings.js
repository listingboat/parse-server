function UserSettingsModule() {
    var thisInstance = this;
    // object to save constants for module
    thisInstance.constants = {
        selector: {
            paginationWrap: '.js_pagination_wrap',
            userListWrap: '.js_user_list_wrap',
            nextPageButton: '.js_next_page',
            prevPageButton: '.js_prev_page',
            rangeFirst: '.js_range_first',
            rangeLast: '.js_range_last',
            totalUserCount: '.js_total_count',
            searchBox: '.js_search_box',
            searchForm: '.js_search_form',
            departmentFilter: '.js_department_filter',
            paginationLastIndex: '.js_pagination_last_index',
            fullPageLoader: ".js-full-page-loader",
            userDepartmentDropdown: '.js_user_department_dropdown',
            userPermissionTypeDropdown: '.js_user_permission_type_dropdown',
            userListHeader: '.js_user_list_header',
            userInvitedListHeader: '.js_invited_user_list_header',
            sendInviteReminderLink: '.js_send_invite_reminder',
            removeInvitedUserLink: '.js_remove_invited_user',
            userRow: '.js_user_row',
            companyDropdown: '.js_company_select',
            settingsWrap: '.js_user_settings_wrap',
            deleteUserLink: ".js_delete_user_link",
            deleteUserModal: "#delete-user",
            modalDeleteUserButton: ".js_delete_user_modal_link",
            errorModal: ".js_error_modal",
            editUserDetailLink: ".js_edit_user_detail_link",
            editUserDetailModal: ".js_edit_user_detail_modal",
            editModalFirstNameField: ".js_edit_modal_first_name_field",
            editModalLastNameField: ".js_edit_modal_last_name_field",
            editModalPhoneNumberField: ".js_edit_modal_phone_number_field",
            editModalPositionTitleField: ".js_edit_modal_position_title_field",
            editModalSelectDepartmentField: "#edit_modal_department_select",
            editModalPermissionTypeField: "#edit_modal_permission_type_select",
            editModalSouceIdField: ".js_source_id",
            editModalPhoneIdField: ".js_phone_id",
            phoneIdSourceIdWrap: ".js_phone_id_wrap",
            submitUserDetailButton: ".js_submit_user_detail",
            inputContainerDiv: ".js_input_container",
            userDetailForm: ".js_user_detail_form",
            errorMessage: ".js_error_message",
            userRowNameSection: ".js_user_row_name_section",
            userRowPositionTitleSection: ".js_user_row_position_title_section",
            successModal: ".js_success_modal",
            successModalHelpText: ".js_success_modal_help_text",
            successModalHeader: ".js_success_modal_header"
        },
        classes: {
            userMailTo: 'js_user_mail_to',
            userEle: 'js_user_element',
            noWrap: 'no-result-wrap',
            inputError: "error-wrap"
        }
    };
    // initialize module
    thisInstance.init = function (options) {
        paginationBinding(); // bind events with next and previous buttons
        searchBinding();
        departmentFilterBinding();
        changeUserDepartmentBinding();
        changeUserPermissionTypeBinding();
        changeCompanyBinding();
        changeUserDetailBindings();  // binds edit user detail form
        browserHistoryBindingClass();
        sendInviteReminderBindings(); // binds the send reminder link on invited user list
        removeInvitedUserBindings(); // binds the remove user link on invited user list
        thisInstance.userPerPage = options.userPerPage;
        thisInstance.urlHistoryCountObject = 0;
        window.history.replaceState({isAjax: true, historyId : ++thisInstance.urlHistoryCountObject}, "urlHistory", location.href);
        thisInstance.companyId = options.companyId;   // current selected company
    };

    // this function accepts filters and callback. This function fetch user list according to filters applied and according to appropriate filter
    function fetchAndLoadUserList(filters, successCallback, errorCallback, alwaysCallback) {
        var selector = thisInstance.constants.selector;

        // success callback which updates personality count and pagination text and handles no results
        successCallback = successCallback || function (data) {
                pageLoadCallback(data);  // callback to update filter options and run bindings

                // save applied filters to module instance
                thisInstance.filtersToApply = filtersToApply;
            };
        // logic for applying filters
        if (filters.searchKey) {
            var filtersToApply = $.extend({}, filters, {page: filters.page || 1});
        }
        else if (filters.page) {
            var filtersToApply = $.extend({}, thisInstance.filtersToApply, filters);
        }
        else {
            var filtersToApply = $.extend({}, thisInstance.filtersToApply, filters, {
                page: filters.page || 1,
                searchKey: filters.searchKey || ''
            });
        }


        // send selected company id to apply filter on that selected company
        if (thisInstance.companyId) {
            filtersToApply = $.extend(filtersToApply, {companyId: thisInstance.companyId});
        }

        if(!filtersToApply.department && $(selector.departmentFilter).val()){
            filtersToApply.department = $(selector.departmentFilter).val();
        }


        // check if ajax call is in progress and block entry if it is
        if (!fetchAndLoadUserList.ajaxLock) {
            $(selector.fullPageLoader).removeClass("hide"); // shows the loader when request is made
            fetchAndLoadUserList.ajaxLock = true;
            // makes call to current url and fetch user list

            $.ajax({
                url: $(thisInstance.constants.selector.departmentFilter).val() === 'invitedUsers' ? $.trim($(selector.departmentFilter).data('invited_user_url')) : $(selector.userListWrap).data("fetch_user_list_url"),
                data: JSON.stringify(filtersToApply),
                contentType: 'application/json',
                type: 'post'
            }).done(function(data){
                if(data.updatedUrl){
                    window.history.pushState({isAjax: true, historyId : ++thisInstance.urlHistoryCountObject}, "urlHistory", data.updatedUrl);
                }
                successCallback(data);
            }).fail(function(error){
                if(error && error.status === 401){
                    location.reload();
                }
                else{
                    errorCallback()
                }
            }).always(function () {
                $(selector.fullPageLoader).addClass("hide");  // hides the loader after request is complete
                if (typeof alwaysCallback === "function") {
                    alwaysCallback();
                }
                fetchAndLoadUserList.ajaxLock = false;
            });
        }
        else if (typeof alwaysCallback === "function") {
            alwaysCallback();
        }
    }

    // function which binds events to next and previous pointers
    function paginationBinding() {
        var selector = thisInstance.constants.selector,
            $paginationWrap = $(selector.paginationWrap),
            $nextButton = $paginationWrap.find(selector.nextPageButton),
            $prevButton = $paginationWrap.find(selector.prevPageButton);

        // next button bindings
        $nextButton.click(function (event) {
            event.preventDefault();
            if (!$nextButton.hasClass('disable')) {
                var firstIndex = parseInt($paginationWrap.find(selector.rangeFirst).text()),
                    lastIndex = parseInt($paginationWrap.find(selector.rangeLast).text()),
                    totalUsers = parseInt($paginationWrap.find(selector.totalUserCount).text()),
                    usersPerPage = thisInstance.userPerPage,
                    currentPage = parseInt(firstIndex / usersPerPage) + 1;
                if (lastIndex != totalUsers) {
                    $nextButton.addClass('button-down');
                    fetchAndLoadUserList({page: currentPage + 1}, undefined, undefined, function () {
                        $nextButton.removeClass('button-down');
                    });
                }
            }
        });
        // previous button bindings
        $prevButton.click(function (event) {
            event.preventDefault();
            if (!$prevButton.hasClass('disable')) {
                var firstIndex = parseInt($paginationWrap.find(selector.rangeFirst).text()),
                    lastIndex = parseInt($paginationWrap.find(selector.rangeLast).text()),
                    usersPerPage = thisInstance.userPerPage,
                    currentPage = parseInt(firstIndex / usersPerPage) + 1;
                if (firstIndex >= usersPerPage) {
                    fetchAndLoadUserList({page: currentPage - 1}, undefined, undefined, function () {
                        $nextButton.removeClass('button-down');
                    });
                }
            }
        });
    }

    // function that add search keys in filter
    function searchBinding() {
        var selector = thisInstance.constants.selector,
            $searchForm = $(selector.searchForm);
        $searchForm.on('submit', function (event) {
            event.preventDefault();
            fetchAndLoadUserList({searchKey: $.trim($(selector.searchBox).val())});
        });
    }

    // binding to bind department filters
    function departmentFilterBinding() {
        var selector = thisInstance.constants.selector;
        $(selector.departmentFilter).change(function () {
            var value = $(this).val();
            fetchAndLoadUserList({department: value});
        });
    }

    function changeUserDepartmentBinding() {
        var selector = thisInstance.constants.selector;
        $(selector.userDepartmentDropdown).each(function () {
            var $this = $(this);
            $this.data('current_value', $this.val());
        });
        $(selector.userDepartmentDropdown).change(function () {
            var $this = $(this),
                userId = $this.closest(selector.userRow).data('user_id'),
                departmentId = $this.val();
            $.ajax({
                url: $this.closest(selector.userListWrap).data('change_department_url'),
                type: 'POST',
                data: {department_id: departmentId, user_id: userId}
            }).done(function (response) {
                if (response.success) {
                    $this.data('current_value', $this.val());
                }
                else {
                    $this.selectpicker('val', $this.data('current_value'));
                }
            }).fail(function (error) {
                if(error && error.status === 401){
                    location.reload();
                }
                else {
                    $this.selectpicker('val', $this.data('current_value'));
                }
            });
        });
    }

    function changeUserPermissionTypeBinding() {
        var selector = thisInstance.constants.selector;
        $(selector.userPermissionTypeDropdown).each(function () {
            var $this = $(this);
            $this.data('current_value', $this.val());
        });
        $(selector.userPermissionTypeDropdown).change(function () {
            var $this = $(this),
                userId = $this.closest(selector.userRow).data('user_id'),
                permissionType = $this.val();
            $.ajax({
                url: $this.closest(selector.userListWrap).data('change_permission_type_url'),
                type: 'POST',
                data: {permission_type: permissionType, user_id: userId}
            }).done(function (response) {
                if (response.success) {
                    $this.data('current_value', $this.val());
                }
                else {
                    $this.selectpicker('val', $this.data('current_value'));
                }
            }).fail(function (error) {
                if(error && error.status === 401){
                    location.reload();
                }
                else {
                    $this.selectpicker('val', $this.data('current_value'));
                }
            });
        });
    }

    function changeCompanyBinding() {
        var selector = thisInstance.constants.selector;
        $(selector.companyDropdown).each(function () {
            var $this = $(this);
            $this.data('current_value', $this.val());
        });
        $(selector.companyDropdown).change(function () {
            var $this = $(this),
                companyId = $this.val();
            thisInstance.companyId = companyId;
            $(selector.fullPageLoader).removeClass("hide");
            window.history.replaceState({isAjax: true, historyId : ++thisInstance.urlHistoryCountObject, isCompletePage: true}, "urlHistory");
            $.ajax({
                url: $(selector.userListWrap).data("fetch_user_list_url"),
                type: 'POST',
                data: {companyId: companyId, isCompletePage: true}
            }).done(function (data) {
                if (data.html) {
                    $(selector.settingsWrap).html(data.html);
                    paginationBinding(); // bind events with next and previous buttons
                    searchBinding();
                    departmentFilterBinding();
                    changeUserDepartmentBinding();
                    changeUserPermissionTypeBinding();
                    changeUserDetailBindings();
                    $this.data('current_value', $this.val());
                    $('.selectpicker').selectpicker();
                }
                else {
                    $this.selectpicker('val', $this.data('current_value'));
                }
                if(data.updatedUrl){
                    window.history.pushState({isAjax: true, historyId : ++thisInstance.urlHistoryCountObject, isCompletePage: true}, "urlHistory", data.updatedUrl);
                }
            }).fail(function (error) {
                if(error && error.status === 401){
                    location.reload();
                }
                else {
                    $this.selectpicker('val', $this.data('current_value'));
                }
            }).always(function(){
                $(selector.fullPageLoader).addClass("hide");
                thisInstance.filtersToApply = {};
            });
        });
    }


    // binds edit user detail form
    function changeUserDetailBindings(){


        var selector = thisInstance.constants.selector,
            classes = thisInstance.constants.classes,
            userId, thisClassInstance = this;
        thisClassInstance.isLockOn = false;

        $(selector.editUserDetailLink).off("click").on("click", function(){
            userId = $(this).data("user_id");
            fillUserDetailInModal($(this));
            submitUserDetailBindings(userId, $(this).closest(selector.userRow));
            deleteUserBindings(userId);
            $(selector.editUserDetailModal).modal("show");
        });

        // function to clean previous error messages
        function cleanOldErrors(){
            $(selector.errorMessage).remove();
            $(selector.userDetailForm).find(selector.inputContainerDiv).removeClass(classes.inputError);
        }

        // function to fill user detail in edit detail form
        function fillUserDetailInModal($editUserDetailLink){
            var phoneNumberRegex = /^\d{10}$/,    // xxxxxxxxxx
                phoneNumberValue = $editUserDetailLink.data("phone_number"),
                $departmentSelect = $(selector.editModalSelectDepartmentField),
                $permissionTypeSelect = $(selector.editModalPermissionTypeField),
                $userPermissionTypeSelect = $editUserDetailLink.closest(selector.userRow).find(selector.userPermissionTypeDropdown),
                $userDepartmentSelect = $editUserDetailLink.closest(selector.userRow).find(selector.userDepartmentDropdown);

            $(selector.editModalFirstNameField).val($editUserDetailLink.data("first_name"));
            $(selector.editModalLastNameField).val($editUserDetailLink.data("last_name"));

            if(phoneNumberRegex.test(phoneNumberValue)) {
                phoneNumberValue = phoneNumberValue.toString();
                phoneNumberValue = ["(", phoneNumberValue.slice(0, 3), ") ", phoneNumberValue.slice(3, 6), "-", phoneNumberValue.slice(6, 10)].join("");
                $(selector.editModalPhoneNumberField).val(phoneNumberValue);
            }
            else{
                $(selector.editModalPhoneNumberField).val("");
            }

            $(selector.editModalPositionTitleField).val($editUserDetailLink.data("position"));

            if ($editUserDetailLink.data("is_call_center")) {
                $(selector.editModalPhoneIdField).val($editUserDetailLink.data("phone_id"));
                $(selector.editModalSouceIdField).val($editUserDetailLink.data("identifier_source"));
                $(selector.phoneIdSourceIdWrap).removeClass('hide');
            } else {
                $(selector.editModalPhoneIdField).val("");
                $(selector.editModalSouceIdField).val("");
                $(selector.phoneIdSourceIdWrap).addClass('hide');
            }

            $departmentSelect.html($userDepartmentSelect.html());
            $departmentSelect.val($userDepartmentSelect.val());
            $($departmentSelect).selectpicker("refresh");

            $permissionTypeSelect.html($userPermissionTypeSelect.html());
            $permissionTypeSelect.val($userPermissionTypeSelect.val());
            $($permissionTypeSelect).selectpicker("refresh");
        }

        // function to validate updated details
        function validateUserDetails(){
            // function to check if passed input field is empty or not
            function validateRequireField($input){
                if($.trim($input.val()) === ""){
                    $input.closest(selector.inputContainerDiv).addClass(classes.inputError);
                    return false;
                }
                else{
                    return true
                }
            }

            var isValid = true, emptyFieldError,
                errorMessages = "",
                phoneNumberRegex1 = /^\d{3}([- .]?)\d{3}\1\d{4}$/,    // (xxx)-xxx-xxxx
                phoneNumberRegex2 = /^\(\d{3}\)\s?\d{3}-\d{4}$/,    // (xxx)-xxx-xxxx
                phoneNumber = $.trim($(selector.editModalPhoneNumberField).val());   // xxxxxxxxxx

            cleanOldErrors();
            isValid = validateRequireField($(selector.editModalFirstNameField)) && isValid;  // validate first name

            isValid = validateRequireField($(selector.editModalLastNameField)) && isValid;   // validate last name

            isValid = validateRequireField($(selector.editModalPositionTitleField)) && isValid;  // validate position title

            emptyFieldError = (!isValid);

            // validate phone number
            if(!phoneNumberRegex1.test(phoneNumber) && !phoneNumberRegex2.test(phoneNumber)) {
                $(selector.editModalPhoneNumberField).closest(selector.inputContainerDiv).addClass(classes.inputError);
                isValid = false;
                errorMessages += "<p class='error-msg-field js_error_message'>Phone number must be <span>in format xxx-xxx-xxxx, (xxx) xxx-xxxx, xxx xxx xxxx, xxx.xxx.xxxx or xxxxxxxxxx</span></p>"
            }

            if(!isValid) {  // if form is invalid
                if (emptyFieldError) {  // if any required field is missing
                    errorMessages = "<p class='error-msg-field js_error_message'>Please make sure <span>no fields are left empty</span></p>" + errorMessages;
                }
                $(errorMessages).insertBefore($(selector.userDetailForm));  // show error message
            }
            return isValid;
        }

        // binds form submit event
        function submitUserDetailBindings(userId, $userRow){

            function showErrors(formErrors, errorMessage){
                if(formErrors.firstNameError){
                    $(selector.editModalFirstNameField).closest(selector.inputContainerDiv).addClass(classes.inputError);
                }
                if(formErrors.lastNameError){
                    $(selector.editModalLastNameField).closest(selector.inputContainerDiv).addClass(classes.inputError);
                }
                if(formErrors.positionTitleError){
                    $(selector.editModalPositionTitleField).closest(selector.inputContainerDiv).addClass(classes.inputError);
                }
                if(formErrors.phoneNumberError){
                    $(selector.editModalPhoneNumberField).closest(selector.inputContainerDiv).addClass(classes.inputError);
                }
                if(formErrors.departmentError){
                    $(selector.editModalSelectDepartmentField).closest(selector.inputContainerDiv).addClass(classes.inputError);
                }
                if(formErrors.permissionTypeError){
                    $(selector.editModalPermissionTypeField).closest(selector.inputContainerDiv).addClass(classes.inputError);
                }
                $(errorMessage).insertBefore($(selector.userDetailForm));
            }

            // update user row after user detail updation
            function updateUserRow(data){
                var $editUserLink = $userRow.find(selector.editUserDetailLink);
                if(data.first_name && data.last_name){
                    $userRow.find(selector.userRowNameSection).text(data.first_name +" "+data.last_name);
                    $editUserLink.data("first_name", data.first_name);
                    $editUserLink.data("last_name", data.last_name);
                }

                if(data.position_title){
                    $userRow.find(selector.userRowPositionTitleSection).text(data.position_title);
                    $editUserLink.data("occupation", data.position_title);
                }

                if(data.phone_number){
                    $editUserLink.data("phone_number", data.phone_number);
                }

                if(data.department){
                    $userRow.find(selector.userDepartmentDropdown).val(data.department);
                    $userRow.find(selector.userDepartmentDropdown).selectpicker("refresh");
                    $editUserLink.data("department", data.department);
                }

                if(data.permission_type){
                    $userRow.find(selector.userPermissionTypeDropdown).val(data.permission_type);
                    $userRow.find(selector.userPermissionTypeDropdown).selectpicker("refresh");
                    $editUserLink.data("permission_type", data.permission_type);
                }

                if(data.phoneId){
                    $editUserLink.data("phone_id", data.phoneId);
                }

                if(data.identifierSource){
                    $editUserLink.data("identifier_source", data.identifierSource);
                }
            }

            $(selector.userDetailForm).find("input").on("input", cleanOldErrors);
            $(selector.userDetailForm).find("select").on("change", cleanOldErrors);
            $(selector.userDetailForm).off("submit").on("submit", function(event){
                event.preventDefault();
                if(validateUserDetails() && !thisClassInstance.isLockOn){
                    $(selector.fullPageLoader).removeClass("hide");
                    thisClassInstance.isLockOn = true;
                    $.ajax({
                        method: "post",
                        url: $(selector.userListWrap).data("edit_user_detail_url"),
                        data: $(this).serialize() + "&userId="+userId,
                        success: function(data){
                            if(data.success){
                                $(selector.editUserDetailModal).modal("hide");
                                setTimeout(function(){
                                    $(selector.successModalHeader).text("User Has Been Updated!");
                                    $(selector.successModalHelpText).addClass("hide");
                                    $(selector.successModal).modal("show");
                                }, 500);
                                updateUserRow(data);
                                updateUserDataInPardot(data.pardotDataDict);
                            }
                            else if(data.userDetailFormError){
                                showErrors(data.formErrors, data.errorMessage);
                            }
                            else{
                                $(selector.editUserDetailModal).modal("hide");
                                setTimeout(function(){
                                    $(selector.errorModal).modal("show");
                                }, 500);
                            }
                        }
                    }).fail(function () {
                        if(error && error.status === 401){
                            location.reload();
                        }
                        else {
                            setTimeout(function () {
                                $(selector.errorModal).modal("show");
                            }, 500);
                        }
                    }).always(function(){
                        $(selector.fullPageLoader).addClass("hide");
                        thisClassInstance.isLockOn = false;
                    });
                }
            })
        }


        // function to bind delete user links
        function deleteUserBindings(userId) {

            // function removes bindings from delete confirmation modals
            function cleanOldBindings() {
                $(selector.deleteUserLink).unbind("click");
                $(selector.modalDeleteUserButton).unbind("click");
            }

            var selector = thisInstance.constants.selector;

            cleanOldBindings();  // remove the old bindings

            // show modal and update it's user_id field
            $(selector.deleteUserLink).on("click", function () {
                if(!thisClassInstance.isLockOn) {
                    $(selector.editUserDetailModal).modal("hide");
                    setTimeout(function () {
                        $(selector.deleteUserModal).modal("show");
                    }, 500);
                }
            });

            // on click of delete confirmation link of the modal
            $(selector.modalDeleteUserButton).on("click", function () {
                if(!thisClassInstance.isLockOn) {
                    thisClassInstance.isLockOn = true;
                    // success callback which updates personality count and pagination text and handles no results
                    var successCallback = function (data) {
                        pageLoadCallback(data);
                        deleteUserFromProspectList(userId);
                        setTimeout(function(){
                            $(selector.successModalHeader).text("User Has Been Updated!");
                            $(selector.successModalHelpText).removeClass("hide");
                            $(selector.successModal).modal("show");
                        }, 500);
                    };
                    $(selector.deleteUserModal).modal("hide");  // hide confirmation modal
                    $(selector.fullPageLoader).removeClass("hide");  // show loader
                    $.ajax({
                        url: $(selector.userListWrap).data("delete_user_url"),
                        method: "POST",
                        data: JSON.stringify($.extend({}, {
                            userId: userId,
                            companyId: thisInstance.companyId
                        }, thisInstance.filtersToApply)),
                        contentType: 'application/json'
                    }).done(successCallback)
                        .fail(function (error) {
                            if(error && error.status === 401){
                                location.reload();
                            }
                            else {
                                setTimeout(function () {
                                    $(selector.errorModal).modal("show");
                                }, 500);
                            }
                        })
                        .always(function () {
                            thisClassInstance.isLockOn = false;
                            userId = undefined;
                            $(selector.fullPageLoader).addClass("hide");
                        });
                }
            });
        }
    }

    // function to delete user from the pardot lists
    function deleteUserFromProspectList(userId){
        $.ajax({
            url: $(thisInstance.constants.selector.userListWrap).data("delete_user_prospect_url"),
            method: "get",
            data: {
                userId: userId
            }
        });
    }

    // callback which updates personality count and pagination text and handles no results
    function pageLoadCallback(data){
        var selector = thisInstance.constants.selector;
            // function to update pagination according to filter selected
        function updatePaginationText(totalCount, pageToDisplay) {
            var $paginationWrap = $(selector.paginationWrap),
                userPerPage = thisInstance.userPerPage;
            if (totalCount && totalCount !== 0) {
                $paginationWrap.removeClass('hide');
                var $nextButton = $paginationWrap.find(selector.nextPageButton),
                    $prevButton = $paginationWrap.find(selector.prevPageButton),
                    rangeFirst = (pageToDisplay - 1) * userPerPage + 1,
                    rangeLast = (((pageToDisplay * userPerPage) < totalCount) ? (pageToDisplay * userPerPage) : totalCount);
                $paginationWrap.find(selector.rangeFirst).text(rangeFirst);
                $paginationWrap.find(selector.rangeLast).text(rangeLast);
                $paginationWrap.find(selector.totalUserCount).text(totalCount);
                if (rangeFirst == rangeLast) {
                    $(selector.paginationLastIndex).addClass('hide');
                }
                else{
                    $(selector.paginationLastIndex).removeClass('hide');
                }

                if ((totalCount - ((pageToDisplay - 1) * userPerPage)) <= userPerPage) {
                    $nextButton.addClass('disabled');
                }
                else {
                    $nextButton.removeClass('disabled');
                }
                if ((pageToDisplay - 1) == 0) {
                    $prevButton.addClass('disabled');
                }
                else {
                    $prevButton.removeClass('disabled');
                }
            }
            else {
                $paginationWrap.addClass('hide');
            }
        }

        // function to update text in search box when ajax call returns
        function updateSearchText(searchText) {
            $(selector.searchBox).val(searchText);
        }

        // function to update department after ajax call returns
        function updateDepartmentFilter(departmentId) {
            departmentId = departmentId || "";
            $(selector.departmentFilter).selectpicker('val', departmentId);
        }

        updatePaginationText(data.totalCount, data.pageToDisplay);
        updateSearchText(data.searchKey);
        updateDepartmentFilter(data.departmentId);
        var $userListWrap = $(selector.userListWrap);
        $userListWrap.html(data.userListHtml);
        changeUserDepartmentBinding();
        changeUserPermissionTypeBinding();
        changeUserDetailBindings();  // binds delete user links
        if (data.departmentId === "invitedUsers") {
            $(selector.userInvitedListHeader).removeClass('hide');
            $(selector.userListHeader).addClass('hide');
        } else {
            $(selector.userInvitedListHeader).addClass('hide');
            $(selector.userListHeader).removeClass('hide');
        }
        if (data.totalCount === 0) {
            $userListWrap.addClass(thisInstance.constants.classes.noWrap);
        }
        else {
            $userListWrap.removeClass(thisInstance.constants.classes.noWrap);
        }

        $(selector.userDepartmentDropdown).selectpicker();
        $(selector.userPermissionTypeDropdown).selectpicker();

    }

    function updateUserDataInPardot(data) {
        var selector = thisInstance.constants.selector;
        $.ajax({
            type: "post",
            url: $(selector.userListWrap).data("update_pardot_data_url"),
            data: data
        });
    }

    function sendInviteReminderBindings() {
        var selector = thisInstance.constants.selector,
            $loader = $(selector.fullPageLoader);
        $(document).on("click", selector.sendInviteReminderLink, function() {
            var $this = $(this);
            $loader.removeClass('hide');
            $.ajax({
                type: "POST",
                url: $this.data('send_reminder_url').trim(),
                data: {
                    invitedUserId: $this.data('invited_user_id')
                },
                success: function (data) {
                    $loader.addClass('hide');
                    if(data.success)
                        $('#id-invite-reminder-success').modal('show');
                },
                error: function () {
                    $loader.addClass('hide');
                }
            });
        });
    }

    function deleteUserFromInvitePardotList(url, data) {
        $.ajax({
            type: "get",
            url: url,
            data: data
        });
    }

    function removeInvitedUserBindings() {
        var selector = thisInstance.constants.selector,
            $loader = $(selector.fullPageLoader);
        $(document).on("click", selector.removeInvitedUserLink, function() {
            var $this = $(this),
                userEmail = $this.data('invited_user_email').trim(),
                url = $this.data('remove_invited_user_url').trim(),
                $paginationWrap = $(selector.paginationWrap),
                firstIndex = parseInt($paginationWrap.find(selector.rangeFirst).text()),
                usersPerPage = thisInstance.userPerPage,
                currentPage = parseInt(firstIndex / usersPerPage) + 1,
                searchKey = $.trim($(selector.searchBox).val()),
                pardotUrl = $.trim($this.data('delete_invited_prospect_url')),
                userCompanyId = $.trim($this.data('invited_user_company')),
                filtersToApply = {};

            if (firstIndex >= usersPerPage) {
                filtersToApply['page'] = currentPage;
            }

            if (searchKey.length) {
                filtersToApply['searchKey'] = searchKey;
            }

            // send selected company id to apply filter on that selected company
            if (thisInstance.companyId) {
                filtersToApply = $.extend(filtersToApply, {companyId: thisInstance.companyId});
            }

            $(selector.deleteUserModal).modal("show");
            $(selector.modalDeleteUserButton).off("click").on("click", function() {
                $(selector.deleteUserModal).modal("hide");
                $loader.removeClass('hide');
                $.ajax({
                    type: "POST",
                    url: url,
                    data: $.extend(filtersToApply, {invitedUserEmail: userEmail}),
                    success: function (data) {
                        $loader.addClass('hide');
                        if (data.success == false) {
                            $("#id-department-name-error-modal").modal('show');
                        } else {
                            pageLoadCallback(data);  // callback to update filter options and run bindings
                            thisInstance.filtersToApply = filtersToApply;  // save applied filters to module instance
                            deleteUserFromInvitePardotList(pardotUrl, {userEmail: userEmail, companyId: userCompanyId});
                        }
                    },
                    error: function () {
                        $loader.addClass('hide');
                        $("#id-department-name-error-modal").modal('show');
                    }
                });
            });
        });
    }

    // function that make ajax request on back or forward navigation of browser
    function browserHistoryBindingClass(){
        var selector = thisInstance.constants.selector,
            $fullPageLoader = $(selector.fullPageLoader),
            thisClassInstance = this;
        thisClassInstance.working = false;  // flag to know if already a request is being processed
        thisClassInstance.workingHistoryId = null;  // save currently being processed url id


        // binda click event on browser back or forward nav
        window.onpopstate = function(event){
            event.preventDefault();
            // if not processing any request and new request url is pushed in history by us
            if(!thisClassInstance.working && event.state && event.state.isAjax) {
                thisClassInstance.working = true;  // set the lock
                thisClassInstance.workingHistoryId = (event.state) ? event.state.historyId: null;
                var url = location.href;
                $fullPageLoader.removeClass("hide");
                var data = (event.state.isCompletePage) ? {isCompletePage: true} : {};
                $.ajax({
                    method: "get",
                    url: url,
                    data: data,
                    success: function(data){
                        if(event.state.isCompletePage){  // when complete page is sent
                            if (data.html) {
                                $(selector.settingsWrap).html(data.html);
                                paginationBinding(); // bind events with next and previous buttons
                                searchBinding();
                                departmentFilterBinding();
                                changeUserDepartmentBinding();
                                changeUserPermissionTypeBinding();
                                changeUserDetailBindings();
                                $(selector.companyDropdown).data('current_value', data.companyId);
                                $(selector.companyDropdown).selectpicker('val', data.companyId);
                                $('.selectpicker').selectpicker();
                            }
                            else {
                                $(selector.companyDropdown).selectpicker('val', data.companyId);
                            }
                        }
                        else{ // when only user list section is sent
                            pageLoadCallback(data);
                            // logic for applying filters

                            if (data.searchKey) {
                                thisInstance.filtersToApply = $.extend({}, thisInstance.filtersToApply, {searchKey: data.searchKey || ""});
                            }
                            else if (data.pageToDisplay) {
                                thisInstance.filtersToApply = $.extend({}, thisInstance.filtersToApply, data.pageToDisplay);
                            }
                            else if(data.departmentId){
                                thisInstance.filtersToApply = $.extend({}, thisInstance.filtersToApply, data.departmentId);
                            }
                            $(selector.companyDropdown).selectpicker("val", data.companyId);
                        }
                    }
                }).always(function(){
                    thisClassInstance.working = false;
                    thisClassInstance.workingHistoryId = null;
                    $fullPageLoader.addClass("hide");
                });
            }
            // if already a request is being processed and browser's forward button is clicked
            else if (event.state && event.state.historyId && event.state.historyId > thisClassInstance.workingHistoryId){
                window.history.back();
            }
            // if already a request is being processed and browser's back button is clicked
            else if (event.state && event.state.historyId && event.state.historyId < thisClassInstance.workingHistoryId){
                window.history.forward();
            }
        }
    }
}
