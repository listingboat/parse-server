function UserInviteModule() {// module to handle invite user to mattersight
    var thisInstance = this;

    thisInstance.constants = {  // constants
        selector: {
            sendInvite: '.js_send_invite',
            uploadAndSendInvite: '.js_upload_and_send_invite',
            textArea: '.js-invite-textarea',
            selectFile: '.js-csv-select',
            fileNameInput: '.js-csv-name',
            errorModal: '#id-upload-csv-error',
            successModal: '#id-upload-csv-success',
            uploadModal: '#id-upload-csv',
            uploadForm: '#upload-form',
            textAreaForm: '#text-area-form',
            message: '.js_message',
            company: '.js_company_select',
            departmentSetupStartButton: ".js_start_department_setup",
            inviteDiv: "#invite_div",
            departmentSetupDiv: "#department_setup_div",
            toInvitePage: "#to-invite-page",
            toQuestionTypeSelect: "#to-invite-page",
            departmentSetupForm: "#department-setup-form",
            lastDepartmentDiv: ".js_active",
            newDepartmentField: ".js_new_department_field",
            newDepartmentDiv: ".new_department_div",
            lastDepartmentActiveClass: "active",
            lastDepartmentBeActiveClass: "js_active",
            removeDepartmentAnchor: ".js_remove_department_anchor",
            departmentNameErrorModal: "#id-department-name-error-modal",
            selectDepartmentDiv: "#select-question-type-div",
            departmentQuestionRelationDiv: ".js_relation_div",
            sampleDepartmentQuestionRelationDiv: ".js_relation_div_sample",
            departmentLabelSpan: ".js_department_label_span"
        },
        MAX_INVITE_BATCH_SIZE: 1000
    };

    thisInstance.init = function (options) {  // module initializer
        thisInstance.isSuperAdmin = (options && options.isSuperAdmin) ? true : false;
        readFileBindings();  // read file and parse and send invite
        sendInviteBindings(); // read text area and parse and send invite

    };

    function clearUploadForm() { // clears upload form
        $(thisInstance.constants.selector.uploadForm)[0].reset();
    }

    function clearTextAreaForm() {  // clears text area form
        $(thisInstance.constants.selector.textAreaForm)[0].reset();
    }

    function selectCompanyValidation(successCallback) {
        var selector = thisInstance.constants.selector;
        if(thisInstance.isSuperAdmin){
            var company = $(selector.company).val();
            if(!company || company === '') {
                showErrorModal('Please select a company and try again.');
                setTimeout(function () {;
                $(selector.uploadModal).addClass('hide');
                }, 148);
                $(selector.uploadModal).modal('hide');
                setTimeout(function () {
                    $(selector.uploadModal).removeClass('hide');
                }, 1000);
            }
            else{
                successCallback();
            }
        }
        else{
            successCallback();
        }
    }

    function sendInviteBindings() {  // function to bind events for text area and send invite button
        var selector = thisInstance.constants.selector;
        $(selector.sendInvite).click(function () {
            var $this = $(this),
                emailCSV = $(selector.textArea).val();
            if(emailCSV && emailCSV.trim() !== '') {
                selectCompanyValidation(function () {
                    var sendInviteUrl = $this.data('send_invite_url');
                    parseCSV(emailCSV, function (emailArray) {
                        validateEmailArray(emailArray,
                            function (emailList) {
                                callSendInvite(sendInviteUrl, emailList, false);
                            },
                            function (invalidEmailList) {
                                var message = "Uh oh! Email" + ((invalidEmailList.length > 1) ? "s " : " ")
                                    + invalidEmailList.join(', ')
                                    + ((invalidEmailList.length > 1) ? " are " : " is ")
                                    + "not valid. Please check the email"
                                    +((invalidEmailList.length > 1) ? "s " : " ")
                                    +"and try again.";
                                showErrorModal(message);
                            });
                    });
                });
            }
        });
    }

    function readFileBindings() { // bind events for selecting file and upload and send invite
        var selector = thisInstance.constants.selector,
            selectedFile = null;
        $(document).on('change', selector.selectFile, function (e) {
            var files = $(this)[0].files;
            if (files.length > 0) {
                $(selector.fileNameInput).val(files[0].name);
                selectedFile = files[0];
            }
        });
        $(selector.uploadAndSendInvite).click(function () {
            var $this = $(this);
            selectCompanyValidation(function() {
                if (selectedFile) {
                    var sendInviteUrl = $this.data('send_invite_url');
                    readFileAndvalidateEmailArray(selectedFile,
                        function (emailList) {
                            callSendInvite(sendInviteUrl, emailList, true, function () {
                                selectedFile = null; // clears file stored in variable after successful upload
                            });
                            $(selector.uploadModal).modal('hide');
                        }, function (invalidEmailList) {
                            var message = "Uh oh! Email" + ((invalidEmailList.length > 1) ? "s " : " ")
                                + invalidEmailList.join(', ')
                                + ((invalidEmailList.length > 1) ? " are " : " is ")
                                + "not valid. Please check the email"
                                + ((invalidEmailList.length > 1) ? "s " : " ")
                                +"and try again.";
                            showErrorModal(message);
                        });
                }
            });
        });
    }

    function callSendInvite(url, emailList, isUploded, successCallback){
        var responseArray = [],
            totalBatchCalls = parseInt(emailList.length / thisInstance.constants.MAX_INVITE_BATCH_SIZE);
        totalBatchCalls += (totalBatchCalls * thisInstance.constants.MAX_INVITE_BATCH_SIZE < emailList.length)? 1 : 0;
        for(var index = 0; index < emailList.length; index+= thisInstance.constants.MAX_INVITE_BATCH_SIZE){
            var sliceFrom = index, sliceSize;
            sliceSize = (emailList.length - index < thisInstance.constants.MAX_INVITE_BATCH_SIZE)? emailList.length : index + thisInstance.constants.MAX_INVITE_BATCH_SIZE;
            sendInvite(url, emailList.slice(sliceFrom, sliceSize), isUploded, successCallback);
        }


        function sendInvite(url, emailList, isUploaded, successCallback) { // function to send list of email to send invite url and display error or success
            var selector = thisInstance.constants.selector;
            $(selector.uploadAndSendInvite).attr('disabled', 'disabled').addClass('disabled');
            $(selector.sendInvite).attr('disabled', 'disabled').addClass('disabled');
            var companyId = (thisInstance.isSuperAdmin) ? $(selector.company).val() : null;
            showLoader(true);
            $.ajax({
                type: 'post',
                url: url,
                data: {emailList: emailList, companyId: companyId}
            }).done(function (data) {
                if (data.success) {
                    for(var index =0; index< data.pardotCallObjects.length; index++) {
                        addInviteesInPardot(data.pardotCallObjects[index].inviteeList, data.companyPardotName, data.pardotCallObjects[index].hash, data.companyPardotListId, data.pardotCallObjects[index].timeStamp);
                    }
                }
                inviteResponseCallback(data, emailList, isUploaded, successCallback);
            }).fail(function(error){
                if(error && error.status === 401){
                    location.reload();
                }
                else {
                    inviteResponseCallback();
                }
            });
        }

        function inviteResponseCallback(data, emailList, isUploaded, successCallback){
            inviteResponseCallback.currentBatchCalls = (inviteResponseCallback.currentBatchCalls || 0) + 1;
            if(data) {
                responseArray.push(data);
            }
            var selector = thisInstance.constants.selector;
            if(inviteResponseCallback.currentBatchCalls >= totalBatchCalls) {
                if(responseArray.length == inviteResponseCallback.currentBatchCalls) {
                    var invalidEmailsArray, invalidDomainsArray;

                    invalidEmailsArray = responseArray.filter(function (result) {
                        return (result.errorCode && result.errorCode == "invalid_format")
                    });

                    invalidDomainsArray = responseArray.filter(function (result) {
                        return (result.errorCode && result.errorCode == "domain_matching_failed")
                    });

                    if (invalidEmailsArray.length > 0) {
                        var errorObj = {
                            errorCode: "invalid_format",
                            emailList: []
                        };

                        for (var index = 0; index < invalidEmailsArray.length; index++) {
                            errorObj.emailList = errorObj.emailList.concat(invalidEmailsArray[index].emailList);
                        }
                        inviteErrorHandler(errorObj, emailList);
                    }
                    else if (invalidDomainsArray.length > 0) {
                        var errorObj = {
                            errorCode: "domain_matching_failed",
                            domainList: []
                        };

                        for (var index = 0; index < invalidDomainsArray.length; index++) {
                            errorObj.domainList = errorObj.domainList.concat(invalidDomainsArray[index].domainList);
                        }
                        inviteErrorHandler(errorObj, emailList);
                    }
                    else {
                        showLoader(false);
                        showSuccessModal();
                        if (isUploaded) {
                            clearUploadForm();
                        }
                        else {
                            clearTextAreaForm();
                        }
                        if (typeof successCallback == 'function') {
                            successCallback();
                        }
                    }
                    $(selector.uploadAndSendInvite).removeAttr('disabled').removeClass('disabled');
                    $(selector.sendInvite).removeAttr('disabled').removeClass('disabled');
                }
                else{
                    showLoader(false);
                    showErrorModal("Oops, looks like a neuron misfired. Please try again.");
                    $(selector.uploadAndSendInvite).removeAttr('disabled').removeClass('disabled');
                    $(selector.sendInvite).removeAttr('disabled').removeClass('disabled');
                }
            }
        }



        function inviteErrorHandler(data, emailList, isUploaded) {
            // error message generation logic and display in modal
            if (thisInstance.isSuperAdmin) {
                var referCompany = 'of selected company'
            }
            else {
                var referCompany = 'your company’s';
            }
            var errorFunction = {
                domain_matching_failed: function (response) {
                    if (response.domainList.length > 1) {
                        if (isUploaded) {
                            var messageStart = "Uh oh! Your upload has email domains (";
                        }
                        else {
                            var messageStart = "Uh oh! Emails have domains (";
                        }
                        var message = messageStart
                            + response.domainList.map(function (domain) {
                                return ('@' + domain)
                            }).join(', ')
                            + ") that are not " + referCompany + ". Please check the email"
                            + ((emailList.length > 1) ? "s " : " ")
                            + "and try again.";
                    }
                    else {
                        if (isUploaded) {
                            var messageStart = "Uh oh! Your upload has email domain (";
                        }
                        else {
                            var messageStart = "Uh oh! Email" + ((emailList.length > 1) ? "s " : " ") + "has domain (";
                        }
                        var message = messageStart
                            + response.domainList.map(function (domain) {
                                return ('@' + domain)
                            }).join(', ')
                            + ") that is not " + referCompany + ". Please check the email"
                            + ((emailList.length > 1) ? "s " : " ")
                            + "and try again.";
                    }
                    showLoader(false);
                    showErrorModal(message);

                },
                invalid_format: function (response) {
                    var message = "Uh oh! Email" + ((response.emailList.length > 1) ? "s " : " ")
                        + response.emailList.join(', ')
                        + ((response.emailList.length > 1) ? " are " : " is ")
                        + "not valid. Please check the email"
                        + ((response.emailList.length > 1) ? "s " : " ")
                        + "and try again.";
                    showLoader(false);
                    showErrorModal(message);
                }
            };

            errorFunction[data.errorCode](data);
        }

        function addInviteesInPardot(inviteeList, companyPardotName, hash, companyPardotListId, timeStamp){
            var selector = thisInstance.constants.selector,
                url = $(selector.uploadAndSendInvite).data('add_invitee_in_pardot_url');
            $.ajax({
                type: 'post',
                url: url,
                data: {inviteeList: inviteeList, companyPardotName: companyPardotName, timeStamp: timeStamp, hash: hash, companyPardotListId: companyPardotListId}
            });
        }

    }

    function showErrorModal(errorMessage) {
        var selector = thisInstance.constants.selector,
            $errorModal = $(selector.errorModal);
        $errorModal.find(selector.message).text(errorMessage);
        $errorModal.modal('show');
    }

    function showSuccessModal() {
        var selector = thisInstance.constants.selector,
            $successModal = $(selector.successModal);
        $successModal.modal('show');
    }

    function readFile(file, successCallback) {
        var reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function (event) {
            var csv = event.target.result;
            parseCSV(csv, successCallback);

        }
    }

    function parseCSV(csv, successCallback) {
        var emailArray = csv.split(/[\n\t \r,]+/);
        successCallback(emailArray);
    }

    function validateEmailArray(emailArray, successCallback, errorCallback) {
        var invalidEmail = [],
            validEmail = [];
        for (var emailIndex in emailArray) {
            var email = emailArray[emailIndex].trim();
            if (email !== '') {
                if (validateEmail(email)) {
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
    }

    function readFileAndvalidateEmailArray(file, successCallback, errorCallback) {
        readFile(file, function (emailArray) {
            validateEmailArray(emailArray, successCallback, errorCallback)
        });
    }

    function validateEmail(email) {
        var emailRegex = /\S+@\S+\.\S+/i;
        return emailRegex.test(email);
    }
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
