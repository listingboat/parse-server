function JoinWaitListModule() {    // module for registration form
    this.init = function () {
        $('#join_waitlist_form').submit(function (event) {    // when from is submitted
            if(!validateForm()) {    //if form is not valid then
                event.preventDefault();    // stop form rom submitting and shows errors
            }
            else{
                $('.loader-wrap').show();
                $('.waitlist-register-wrap').hide();
            }
        });

        ValidationBindings();    // validate every filed on focus out
    };

    function ValidationBindings(){
        $('#first_name').on('focusout', function(){    // validates first name
            validateFirstName();
        });

        $('#last_name').on('focusout', function(){    // validates last name
            validateLastName();
        });

        $('#user_email').on('focusout', function(){    // validates user email
            validateUserEmail();
        });

        $('#company').on('focusout', function(){    // validates company name
            validateCompany();
        });

        $('#phone_number').on('focusout', function(){    // validates phone number
            validatePhoneNumber();
        });
    }

    // if first_name is not valid then it'll add error wrap class otherwise it'll remove error-wrap class
    function validateFirstName(){
        // Validates First Name
        var first_name = $('#first_name');
        first_name.val(first_name.val().trim());
        if (first_name.val()== '') {
            first_name.parent().find('.error-text-wrap').text('*Required');
            first_name.parent().addClass('error-wrap');
            return false;
        }
        first_name.parent().removeClass('error-wrap');
        return true;
    }

    // if last_name is not valid then it'll add error wrap class otherwise it'll remove error-wrap class
    function validateLastName(){
         // Validates Last Name
        var last_name = $('#last_name');
        last_name.val(last_name.val().trim());
        if (last_name.val()== ''){
            last_name.parent().find('.error-text-wrap').text('*Required');
            last_name.parent().addClass('error-wrap');
            return false;
        }
        last_name.parent().removeClass('error-wrap');
        return true;

    }

    // if user_email is not valid then it'll add error wrap class otherwise it'll remove error-wrap class
    function validateUserEmail(){
          // Validates User email
        var emailValidator = /\S+@\S+\.\S+/i,
            user_email = $('#user_email');
        user_email.val(user_email.val().trim());
        if (user_email.val()== ''){
            user_email.parent().find('.error-text-wrap').text('*Required');
            user_email.parent().addClass('error-wrap');
            return false;
        }
        if(!user_email.val().match(emailValidator)) {
            user_email.parent().find('.error-text-wrap').text('Invalid Format');
            user_email.parent().addClass('error-wrap');
            return false;
        }
        user_email.parent().removeClass('error-wrap');
        return true;
    }

    // if company is not valid then it'll add error wrap class otherwise it'll remove error-wrap class
    function validateCompany(){
         // Validates company
        var company = $('#company');
        company.val(company.val().trim());
        if (company.val()== ''){
            company.parent().find('.error-text-wrap').text('*Required');
            company.parent().addClass('error-wrap');
            return false;
        }
        company.parent().removeClass('error-wrap');
        return true;
    }

    // if phone number is not valid then it'll add error wrap class otherwise it'll remove error-wrap class
    function validatePhoneNumber() {
        // Validates password
        var phoneNumberRegex1 = /^\d{3}([- .]?)\d{3}\1\d{4}$/,    // allows xxx-xxx-xxxx, xxx.xxx.xxxx, xxx xxx xxxx, xxxxxxxxxx
            phoneNumberRegex2 = /^\(\d{3}\)\s?\d{3}-\d{4}$/,    // (xxx)-xxx-xxxx
            phoneNumber = $('#phone_number'),
            phoneNumberValue = phoneNumber.val();
        if (phoneNumberRegex1.test(phoneNumberValue) || phoneNumberRegex2.test(phoneNumberValue)) {
            phoneNumber.parent().removeClass('error-wrap');
            return true;
        }
        else {
            phoneNumber.parent().find('.error-text-wrap').text('Phone number must be in format xxx-xxx-xxxx, (xxx) xxx-xxxx, xxx xxx xxxx, xxx.xxx.xxxx or xxxxxxxxxx');
            phoneNumber.parent().addClass('error-wrap');
            return false;
        }
    }

    // checks if every field is valid then return true
    function validateForm() {
        firstNameCheck = validateFirstName();
        lastNameCheck = validateLastName();
        userEmailCheck = validateUserEmail();
        companyCheck = validateCompany();
        phoneNumberCheck = validatePhoneNumber();

        if(firstNameCheck && lastNameCheck && userEmailCheck && companyCheck && phoneNumberCheck){
            return true;
        }
        else{
            return false;
        }
    }

}
