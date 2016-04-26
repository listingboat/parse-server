function UserAccountSettingsModule() {    // module for registration form
    this.init = function (options) {
        $(".selectpicker").selectpicker();   // initialize selectpicker for fast load
        if(options.success){
            makePardotCall(options.data);
            $("#update-success-modal").modal('show');
        }
        validationBindings();    // validate every filed on focus out
    };

    function validationBindings(){
        $('#first_name').on('focusout', function(){    // validates first name
            validateFirstName();
        });

        $('#last_name').on('focusout', function(){    // validates last name
            validateLastName();
        });

        $('#position_title').on('focusout', function(){    // validates position title
            validatePositionTitle();
        });

        $('#phone_number').on('focusout', function(){    // validates position title
            validatePhoneNumber();
        });

        $('#update_form').submit(function (event) {    // when from is submitted
            if(!validateForm()) {    //if form is not valid then
                event.preventDefault();    // stop form rom submitting and shows errors
            }
        });

        $('#update_form').find("select").on("change", function(){
            $(this).closest(".form-group").removeClass('error-wrap');
        });
    }

    // if first_name is not valid then it'll add error wrap class otherwise it'll remove error-wrap class
    function validateFirstName(){
        // Validates First Name
        first_name = $('#first_name');
        first_name.val($.trim(first_name.val()));
        if (first_name.val()== '') {
            first_name.closest('.form-group').find('.error-text-wrap').text('*Required');
            first_name.parent().addClass('error-wrap');
            return false;
        }
        first_name.parent().removeClass('error-wrap');
        return true;
    }

    // if last_name is not valid then it'll add error wrap class otherwise it'll remove error-wrap class
    function validateLastName(){
         // Validates Last Name
        last_name = $('#last_name');
        last_name.val($.trim(last_name.val()));
        if (last_name.val()== ''){
            last_name.closest('.form-group').find('.error-text-wrap').text('*Required');
            last_name.parent().addClass('error-wrap');
            return false;
        }
        last_name.parent().removeClass('error-wrap');
        return true;

    }

    // if position title is not valid then it'll add error wrap class otherwise it'll remove error-wrap class
    function validatePositionTitle(){
         // Validates Position Title
        position_title = $('#position_title');
        position_title.val($.trim(position_title.val()));
        if (position_title.val()== ''){
            position_title.closest('.form-group').find('.error-text-wrap').text('*Required');
            position_title.parent().addClass('error-wrap');
            return false;
        }
        position_title.parent().removeClass('error-wrap');
        return true;
    }

    // if phone number is not valid then it'll add error wrap class otherwise it'll remove error-wrap class
    function validatePhoneNumber() {
        var phoneNumberRegex1 = /^\d{3}([- .]?)\d{3}\1\d{4}$/,    // xxx-xxx-xxxx
            phoneNumberRegex2 = /^\(\d{3}\)\s?\d{3}-\d{4}$/,    // (xxx)-xxx-xxxx
            $phoneNumber = $('#phone_number'),
            phoneNumberValue = $.trim($phoneNumber.val()); // get user phone number and removes extra spaces
        if ($phoneNumber.val()== ''){
            $phoneNumber.closest(".form-group").find('.error-text-wrap').text('*Required');
            $phoneNumber.closest(".form-group").addClass('error-wrap');
            return false;
        }
        else if (phoneNumberRegex1.test(phoneNumberValue) || phoneNumberRegex2.test(phoneNumberValue)) {
            $phoneNumber.parent().removeClass('error-wrap');
            return true;
        }
        else { // if phone number doesn't match any of the allowed formats
            $phoneNumber.parent().find('.error-text-wrap').text('Phone number must be in format xxx-xxx-xxxx, (xxx) xxx-xxxx, xxx xxx xxxx, xxx.xxx.xxxx or xxxxxxxxxx');
            $phoneNumber.parent().addClass('error-wrap');
            return false;
        }
    }


    // checks if every field is valid then return true
    function validateForm() {
        firstNameCheck = validateFirstName();
        lastNameCheck = validateLastName();
        positionTitleCheck = validatePositionTitle();
        phoneNumberCheck = validatePhoneNumber();
        return firstNameCheck && lastNameCheck && positionTitleCheck && phoneNumberCheck;
    }

    function makePardotCall(data){
        $.ajax({
            type: "post",
            url: $(".js_pardot_url").data("update_pardot_prospect_url"),
            data: data
        });

    }
}
