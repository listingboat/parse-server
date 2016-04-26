function ContestModule(){
    var thisInstance = this;
    thisInstance.constants = {
        selector: {
            companySelect: ".js_company_select",  // company drop-down
            formFieldDiv: ".js_contest_fields_area",  // section in which we put contest result after company select
            contestDetailDiv: ".js_contest_detail_div",   // contest detail div
            contestDetailButtonSection: ".js_contest_detail_button_section",  // buttons section which is shown when contest detail is being shown
            createContestButtonSection: ".js_create_contest_button_section",  // buttons section which is shown when new contest is being shown
            createContestFormDiv: ".js_contest_create_field_section",  // div which contains new contest div
            modalCompanyNameSection: ".js_company_name_section",
            modalContestTextSection: ".js_contest_text_section",
            modalAwardDetailSection: ".js_award_detail_section",
            modalEndDateSection: ".js_contest_end_date_section",
            cancelContestLink: ".js_cancel_contest_link",
            startContestLink: ".js_start_contest_link",
            cancelContestConfirmationModal: "#end-contest-confirmation",
            startContestConfirmationModal: "#start-contest-confirmation",
            contestTypeRadio: ".js_contest_type_radio",
            contestTypeTextField: ".js_contest_type_text",
            contestAwardField: ".js_contest_award_field",
            contestEndDateField: ".js_contest_end_date_field",
            errorModal: "#error-modal",
            modalErrorMessageSection: ".js_message",
            startContestConfirmButton: ".js_stat_contest_confirm",
            endContestConfirmButton: ".js_end_contest_confirm",
            newContestForm: ".js_new_contest_form",
            contestStartedModal: "#contest-started",
            contestCanceledModal: "#contest-canceled",
            top7DayPQContestType: ".js_top_7_day_pq_contest_type",
            errorStateDiv: ".js_error_state_div",
            errorMessageDiv: ".js_error_message_div",
            contestBoxWrap: ".js_contest_box_wrap"
        },
        classes: {
            errorStateEnable: "error-field",
            contestDetailStyleClass: "existing-contest-wrap"
        }
    };

    thisInstance.init = function(){
        changeCompanyBindings();
    };

    // function to fetch contest result (current running contest detail or new contest form) for selected company
    function changeCompanyBindings(){

        var selector = thisInstance.constants.selector;
        // chen new company is selected on company drop-down
        $(selector.companySelect).on("change", function(){
            cleanOldContestDetailOrForm();
            $.ajax({  // ajax call to get company current contest detail or new contest form if no contest is running right now
                url: $(selector.companySelect).data("get_company_contest_url"),
                method: "post",
                data: {
                    companyId: $(this).val().trim()
                },
                success: function(data){
                    if(data.success){
                        if(data.contestFound){
                            $(selector.contestDetailButtonSection).removeClass("hide");
                            $(selector.formFieldDiv).append(data.partial);
                            $(selector.contestBoxWrap).addClass(thisInstance.constants.classes.contestDetailStyleClass);
                            cancelContestBindings(data.options);
                        }
                        else{
                            $(selector.createContestButtonSection).removeClass("hide");
                            $(selector.formFieldDiv).append(data.partial);
                            $(selector.contestBoxWrap).removeClass(thisInstance.constants.classes.contestDetailStyleClass);
                            newContestBindings(data.datePickerStartDate);
                        }
                    }
                    else{
                        showError("Something Went Wrong.");
                    }
                },
                error: function(error){
                    if(error && error.status === 401){
                        location.reload();
                    }
                    else {
                        showError("Something Went Wrong.");
                    }
                }
            });
        });
    }


    // function to clean previously selected company's contest result
    function cleanOldContestDetailOrForm(){
        var selector = thisInstance.constants.selector;
        $(selector.contestDetailDiv).remove();  // removes contest detail section
        $(selector.createContestFormDiv).remove();  // removes create new contest form
        $(selector.contestDetailButtonSection).addClass("hide");  // hides button sections of contest detail
        $(selector.createContestButtonSection).addClass("hide");  // hides button sections of new contest form
        $(selector.startContestConfirmButton).unbind("click");
        $(selector.endContestConfirmButton).unbind("click");
        cleanErrors()
    }

    // bindings when already running contest found
    function cancelContestBindings(options){
        var selector = thisInstance.constants.selector,
            companyName = $(selector.companySelect + " option:selected").text(),  // get selected company name
            $cancelContestConfirmationModal = $(selector.cancelContestConfirmationModal),
            companyId = $(selector.companySelect + " option:selected").val(),
            contestId = $(selector.contestDetailDiv).data("contest_id");

        // update modal with current running contest detail
        $cancelContestConfirmationModal.find(selector.modalContestTextSection).text(options.contestHeading);
        $cancelContestConfirmationModal.find(selector.modalAwardDetailSection).text(options.contestAward);
        $cancelContestConfirmationModal.find(selector.modalEndDateSection).text(options.formattedEndDate + " 11:59:59 PM CST");
        $cancelContestConfirmationModal.find(selector.modalCompanyNameSection).text(companyName);

        // show the modal on click of cancel contest button on contest page
        $(selector.contestDetailButtonSection).find(selector.cancelContestLink).on("click", function(event){
            event.preventDefault();
            $cancelContestConfirmationModal.modal("show");
        });

        // when end contest confirm button is clicked it makes delete contest request to beck end with current contest and company id
        $(selector.endContestConfirmButton).on("click", function(event){
            var $this = $(this);
            if(!$this.hasClass("disabled")) {
                $this.addClass("disabled");
                event.preventDefault();
                $.ajax({
                    url: $(selector.companySelect).data("cancel_contest_url"),
                    method: "post",
                    data: {companyId: companyId, contestId: contestId},
                    success: function (data) {
                        if (data.success) {  // if contest created successfully
                            $cancelContestConfirmationModal.modal("hide");  // hide the confirmation modal
                            cleanOldContestDetailOrForm();  // clean form section
                            $(selector.createContestButtonSection).removeClass("hide");  // shows new contest form button section
                            $(selector.formFieldDiv).append(data.partial);  // add new contest form
                            $(selector.contestBoxWrap).removeClass(thisInstance.constants.classes.contestDetailStyleClass);
                            newContestBindings(data.datePickerStartDate);   // bindings for new contest form
                            setTimeout(function(){
                                $(selector.contestCanceledModal).modal("show");  // show contest started modal
                            },1000);
                        }
                        else {
                            $cancelContestConfirmationModal.modal("hide");
                            setTimeout(function(){
                                showError(data.errorMessage);
                            },1000);
                        }
                    },
                    error: function () {
                        $cancelContestConfirmationModal.modal("hide");
                        setTimeout(function(){
                            showError("Something Went Wrong.");
                        },1000);
                    }
                }).always(function () {
                    $this.removeClass("disabled");
                });
            }
        });
    }


    // function to und bindings for new contest form and modals
    function newContestBindings(datePickerStartDate){
        var datePickerStartDate = new Date(datePickerStartDate),
            dateAfterAWeek = new Date(datePickerStartDate);
        dateAfterAWeek.setDate(dateAfterAWeek.getDate() + 7);
        // initialize datepicker
        $('.contest-date-input').datepicker({
            startDate: datePickerStartDate,
            autoclose: true
        });

        var selector = thisInstance.constants.selector,
            companyName = $(selector.companySelect + " option:selected").text(),
            $startContestConfirmationModal = $(selector.startContestConfirmationModal);  // sets the company name on confirmation modal
        $startContestConfirmationModal.find(selector.modalCompanyNameSection).text(companyName);  // set company name in modal
        var companyId = $(selector.companySelect + " option:selected").val(), formData;

        // when contest type is selected
        $(selector.contestTypeRadio).on("change", function(){
            cleanErrors();
            if($(this).hasClass("js_top_7_day_pq_contest_type")){
                $(selector.contestEndDateField).val((dateAfterAWeek.getMonth() + 1) +"/"+ dateAfterAWeek.getDate() +"/"+ dateAfterAWeek.getFullYear());
                $(selector.contestEndDateField).prop("disabled", true);
            }
            else{
                $(selector.contestEndDateField).prop("disabled", false);
                $(selector.contestEndDateField).val("");
            }
        });

        // clean errors from from if any event occur
        $(selector.contestTypeTextField).on("input", cleanErrors);
        $(selector.contestAwardField).on("input", cleanErrors);
        $(selector.contestEndDateField).on("focus", cleanErrors);

        $(selector.startContestLink).on("click", function(event){
            event.preventDefault();
            formData = validateNewContestForm();  // validate form and returns validate contest data
            if(formData.isValid){    // if form is valid
                // update modal with form info
                $startContestConfirmationModal.find(selector.modalContestTextSection).text(formData.contestText + " Wins");
                $startContestConfirmationModal.find(selector.modalAwardDetailSection).text(formData.contestAward);
                $startContestConfirmationModal.find(selector.modalEndDateSection).text(formData.contestEndDate + " 11:59:59 PM CST");
                $startContestConfirmationModal.modal("show");  // show confirmation modal
            }
        });

        // chen user clicks start contest button on confirmation modal
        $(selector.startContestConfirmButton).on("click", function(event){
            var $this = $(this);
            if(!$this.hasClass("disabled")){
                event.preventDefault();
                if(formData.isValid) {  // if contest data is valid
                    $this.addClass("disabled");
                    formData.companyId = companyId;
                    $.ajax({
                        url: $(selector.companySelect).data("create_new_contest_url"),
                        method: "post",
                        data: formData,
                        success: function (data) {
                            if (data.success) {  // if contest created successfully
                                sendContestStartAnnouncementMail(companyId, data.options.contestId);
                                $(selector.startContestConfirmationModal).modal("hide");  // hide the confirmation modal
                                cleanOldContestDetailOrForm();  // clean form section
                                $(selector.contestDetailButtonSection).removeClass("hide");
                                $(selector.formFieldDiv).append(data.partial);  // add contest detail on the page
                                $(selector.contestBoxWrap).addClass(thisInstance.constants.classes.contestDetailStyleClass);
                                cancelContestBindings(data.options);  // add contest detail section bindings
                                setTimeout(function() {
                                    $(selector.contestStartedModal).modal("show");  // show contest started modal
                                }, 1000);
                            }
                            else {
                                $(selector.startContestConfirmationModal).modal("hide");
                                setTimeout(function() {
                                    showError(data.errorMessage);
                                }, 1000);
                            }
                        },
                        error: function () {
                            $(selector.startContestConfirmationModal).modal("hide");
                            setTimeout(function() {
                                showError("Something Went Wrong.");
                            }, 1000);
                        }
                    }).always(function () {
                        formData = {};
                        $this.removeClass("disabled");
                    });
                }
            }
        });
    }

    // validate new contest form
    function validateNewContestForm(){

        cleanErrors();  // remove old errors

        var selector = thisInstance.constants.selector,
            contestType = $(selector.contestTypeRadio + ":checked").val(),
            dateRegex = /(\d{1,2}\/){2}\d{4}/,
            contestAward = $(selector.contestAwardField).val(),
            contestEndDate = $(selector.contestEndDateField).val(),
            contestText = $(selector.contestTypeRadio + ":checked").data("text_value"),
            isFormValid = true, errorMessage = "";

        // validate contest type
        if(contestType.trim() === ""){
            showError("Please select a <span>contest type</span>.", $(selector.contestTypeRadio));
            isFormValid = false;
        }
        else if(contestType.toLowerCase().trim() === "other"){  // if other type selected and no description added
            contestText = $(selector.contestTypeTextField).val();
            if(contestText.trim() === "") {
                showError("Please enter <span>other contest type description</span>.", $(selector.contestTypeRadio));
                isFormValid = false;
            }

        }

        if(contestAward === ""){
            showError("Please select the <span>award</span>.", $(selector.contestAwardField));
            isFormValid = false;
        }

        // check if date is in correct format
        if(!dateRegex.test(contestEndDate)){
            showError("Please select a valid <span>contest end date</span>.", $(selector.contestEndDateField));
            isFormValid = false;
        }

        // show error modal if form is not valid
        if(!isFormValid){
            showError(errorMessage);
        }

        return{
            isValid: isFormValid,
            contestType: contestType,
            contestAward: contestAward,
            contestText: contestText,
            contestEndDate: contestEndDate
        }
    }

    function showError(errorMessage, $inputField){
        var selector = thisInstance.constants.selector,
        $errorMessageDiv = $(selector.errorMessageDiv);
        errorMessage = errorMessage || "";
        $errorMessageDiv.append("<p>" + errorMessage + "</p>");
        $errorMessageDiv.removeClass("hide");

        if($inputField){
            $inputField.closest(selector.errorStateDiv).addClass(thisInstance.constants.classes.errorStateEnable);
        }
    }

    // function to send contest Start Announcement email
    function sendContestStartAnnouncementMail(companyId, contestId){
        var selector = thisInstance.constants.selector;
        $.ajax({
            url: $(selector.companySelect).data("contest_start_mail_request_url"),
            method: "post",
            data: {
                contestId: contestId,
                companyId: companyId
            }
        });
    }

    // function to clean errors from form
    function cleanErrors(){
        var selector = thisInstance.constants.selector;
        $(selector.errorMessageDiv).html("");
        $(selector.errorMessageDiv).addClass("hide");
        $(selector.errorStateDiv).removeClass(thisInstance.constants.classes.errorStateEnable);
    }
}
