function RegistrationModule() {    // module for registration form

    this.init = function (options) {
        validationBindings();    // validate every filed on focus out
        agreementBindings();
        thisInstance.enableDepartmentCheck = (options.enableDepartmentCheck) ? true : false;
    };

    var thisInstance = this;
    thisInstance.enableDepartmentCheck = false;
    thisInstance.selector = {
        agreeTermsOfService: "#agree_terms_of_service",
        openAgreementLink : ".js_open_agreement",
        agreement: ".js_agreement_section",
        closeAgreement : ".js_agreement_close",
        acceptAgreement: "#accept_agreement",
        registerButton: "#register",
        registrationForm: "#registration_form"
    };

    function validationBindings(){
        var selector = thisInstance.selector,
            $form = $(selector.registrationForm);

        $form.submit(function (event) {    // when from is submitted
            event.preventDefault();
            if (validateForm()) {    //if form is not valid then
                $('.loader-wrap').show();
                $('.js-register-wrap').hide();

                registerAjaxCall(this);
            }
        });

       $form.find(":input").on('input', function(){
            $(this).closest(".form-group").removeClass('error-wrap');
        });

        selectChangeEventBinding();

        $('#user_email').on("change", function(){
            if(validateUserEmail()) {
                getDepartments($.trim($('#user_email').val()));
            }
        });

    }

    function agreementBindings(){

        var selector = thisInstance.selector;

        // binds terms of service text box to enable register button only if user agree terms of services
        $(selector.agreeTermsOfService).on("change", function(){
            if($(this).prop("checked")){
                $(selector.registerButton).attr("disabled", false);
            }
            else{
                $(selector.registerButton).attr("disabled", true);
            }
        });

        // binds open agreement link
        $(selector.openAgreementLink).on("click", function(){
            $(selector.registrationForm).addClass("hide");
            $(selector.agreement).removeClass("hide");
        });

        // binds close agreement link
        $(selector.closeAgreement).on("click", function(){
            $(selector.registrationForm).removeClass("hide");
            $(selector.agreeTermsOfService).prop("checked", false);
            $(selector.registerButton).attr("disabled", true);
            $(selector.agreement).addClass("hide");
        });

        // accept terms or service button binding
        $(selector.acceptAgreement).on("click", function(){
            $(selector.registrationForm).removeClass("hide");
            $(selector.agreement).addClass("hide");
            $(selector.agreeTermsOfService).prop("checked", true);
            $(selector.registerButton).attr("disabled", false);
        })
    }

    function selectChangeEventBinding(){
         $('#registration_form').find("select").on("change", function(){
            $(this).closest(".form-group").removeClass('error-wrap');
        });
    }

    // if first_name is not valid then it'll add error wrap class otherwise it'll remove error-wrap class
    function validateFirstName(){
        // Validates First Name
        var $firstName = $('#first_name');
        $firstName.val($firstName.val().trim());
        if ($firstName.val()== '') {
            $firstName.closest(".form-group").find('.error-text-wrap').text('*Required');
            $firstName.closest(".form-group").addClass('error-wrap');
            return false;
        }
        return true;
    }

    // if last_name is not valid then it'll add error wrap class otherwise it'll remove error-wrap class
    function validateLastName(){
         // Validates Last Name
        var $lastName = $('#last_name');
        $lastName.val($lastName.val().trim());
        if ($lastName.val()== ''){
            $lastName.closest(".form-group").find('.error-text-wrap').text('*Required');
            $lastName.closest(".form-group").addClass('error-wrap');
            return false;
        }
        return true;

    }

    // if user_email is not valid then it'll add error wrap class otherwise it'll remove error-wrap class
    function validateUserEmail(){
          // Validates User email
        var emailValidator = /\S+@\S+\.\S+/i,
            $userEmail = $('#user_email');
        $userEmail.val($userEmail.val().trim());
        if ($userEmail.val()== ''){
            $userEmail.closest(".form-group").find('.error-text-wrap').text('*Required');
            $userEmail.closest(".form-group").addClass('error-wrap');
            return false;
        }
        if(!$userEmail.val().match(emailValidator)) {
            $userEmail.closest(".form-group").find('.error-text-wrap').text('Invalid Format');
            $userEmail.closest(".form-group").addClass('error-wrap');
            return false;
        }
        return true;
    }

    // if phone number is not valid then it'll add error wrap class otherwise it'll remove error-wrap class
    function validatePhoneNumber() {
        var phoneNumberRegex1 = /^\d{3}([- .]?)\d{3}\1\d{4}$/,// allows xxx-xxx-xxxx, xxx.xxx.xxxx, xxx xxx xxxx, xxxxxxxxxx
            phoneNumberRegex2 = /^\(\d{3}\)\s?\d{3}-\d{4}$/,    // (xxx)-xxx-xxxx or (xxx)-xxx-xxxx
            $phoneNumber = $('#phone_number'),
            phoneNumberValue = $.trim($phoneNumber.val()); // get user phone number and removes extra spaces
        if ($phoneNumber.val()== ''){
            $phoneNumber.closest(".form-group").find('.error-text-wrap').text('*Required');
            $phoneNumber.closest(".form-group").addClass('error-wrap');
            return false;
        }
        else if (phoneNumberRegex1.test(phoneNumberValue) || phoneNumberRegex2.test(phoneNumberValue)) {
            return true;
        }
        else { // if phone number doesn't match any of the allowed formats
            $phoneNumber.parent().find('.error-text-wrap').text('Phone number must be in format xxx-xxx-xxxx, (xxx) xxx-xxxx, xxx xxx xxxx, xxx.xxx.xxxx or xxxxxxxxxx');
            $phoneNumber.parent().addClass('error-wrap');
            return false;
        }
    }

    // if position title is not valid then it'll add error wrap class otherwise it'll remove error-wrap class
    function validatePositionTitle(){
         // Validates Position Title
        var $positionTitle = $('#position_title');
        $positionTitle.val($positionTitle.val().trim());
        if ($positionTitle.val()== ''){
            $positionTitle.closest(".form-group").find('.error-text-wrap').text('*Required');
            $positionTitle.closest(".form-group").addClass('error-wrap');
            return false;
        }
        return true;
    }

    // if password1 is not valid then it'll add error wrap class otherwise it'll remove error-wrap class
    function validatePassword1() {
        // Validates password
        var passwordValidator = new RegExp(/(^(?=.*\d).{8,}$)/),
            $password1 = $('#password1');
        if (!$password1.val().match(passwordValidator)) {
            $password1.closest(".form-group").find('.error-text-wrap').text('Password must be at least 8 character long and must contain at least one number');
            $password1.closest(".form-group").addClass('error-wrap');
            return false;
        }
        return true;
    }

    // if password2 is not valid then it'll add error wrap class otherwise it'll remove error-wrap class
    function validatePassword2(){
         // Validates password
        var $password1 = $('#password1'),
            $password2 = $('#password2');
        if ($password1.val() != $password2.val()){
            $password2.closest(".form-group").find('.error-text-wrap').text("Password didn't match");
            $password2.closest(".form-group").addClass('error-wrap');
            return false;
        }
        return true;
    }

    function validateDepartment(){
        var $department = $("#department");
        if($department.val() && $.trim($department.val) != ""){
            return true;
        }
        else{
            $department.closest(".form-group").find('.error-text-wrap').text('*Required');
            $department.closest(".form-group").addClass('error-wrap');
            return false;
        }
    }

    // checks if every field is valid then return true
    function validateForm() {
        var firstNameCheck = validateFirstName(),
        lastNameCheck = validateLastName(),
        userEmailCheck = validateUserEmail(),
        phoneNumberCheck = validatePhoneNumber(),
        positionTitleCheck = validatePositionTitle(),
        password1Check = validatePassword1(),
        password2Check = validatePassword2(),
        departmentCheck = true;
        if(thisInstance.enableDepartmentCheck) {
            departmentCheck = validateDepartment();
        }
        return (firstNameCheck && lastNameCheck && userEmailCheck && phoneNumberCheck && positionTitleCheck && password1Check && password2Check && departmentCheck);
    }

    function registerAjaxCall(form){
        $.ajax({
            type: 'POST',
            data: $(form).serialize(),
            success: function(result) {
                if(result.status){
                    addUserInPardotCall(result);
                    migrateUserCall();
                }
                else {
                    $(".container").replaceWith(result.partial);
                    $('.loader-wrap').hide();
                    $('.js-register-wrap').show();
                    $('.selectpicker').selectpicker();
                    validationBindings();
                    agreementBindings();
                }
            },
            error: function(resuest, status, error){
                $('.loader-wrap').hide();
                $('.js-register-wrap').show();
                $("#form-error").text('Registration unsuccessful.');
            }
        });
    }

    function getDepartments(email){
        $.ajax({
            type: 'post',
            url: $(".js_url_container").data('get_departments_url'),
            data : {email: email},
            success: function(data){
                if(data.success) {
                    thisInstance.enableDepartmentCheck = true;
                    $("#js_department_div").removeClass("error-wrap");
                    $("#js_department_div").removeClass("hide");
                    $("#js_department_div").html(data.partial);
                    selectChangeEventBinding();
                    $('.selectpicker').selectpicker();
                }
                else{
                    thisInstance.enableDepartmentCheck = false;
                    $("#js_department_div").html(data.partial);
                    $("#js_department_div").addClass("hide");
                }
            }
        })
    }

    function migrateUserCall(){
        $.ajax({
            type: 'GET',
            url: $(".js_url_container").data('migrate_url'),
            success: function(result) {
                if (result.success) {
                    if(result.isNewUser) {
                        addUserInPardotCall(result);
                    }
                    window.location = $(".js_url_container").data('on_boarding_url');
                }
                else{
                    modalBingding();
                }
            },
            error: function(resuest, status, error){
                modalBingding();
            }
        })
    };

    function addUserInPardotCall(data){
        $.ajax({
            type: "post",
            url: $(".js_url_container").data('add_user_in_pardot_url'),
            data: data
        });
    }

    // shows the modal with two buttons
    // Try Again button makes the user migration call
    // retake assessment button redirects to on-boarding 1 page
    function modalBingding(){
        $("#migration-fail").modal('show');

        $("#try-again").click(function(){

            migrateUserCall();
        });

        $("#retake-assessment").click(function(){
            window.location = $(".js_url_container").data('on_boarding_url');
        });
    }

}
