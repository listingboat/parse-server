function PasswordUpdateSettingModule() {    // module for registration form
    this.init = function (options) {
        if(options.success){
            $("#password-updated-modal").modal('show');
        }

        $('#password-update-form').submit(function (event) {    // when from is submitted
            if(!validateForm()) {    //if form is not valid then
                event.preventDefault();    // stop form rom submitting and shows errors
            }
        });

        validationBindings();    // validate every filed on focus out
    };

    function validationBindings(){
        $('#old_password').on('focusout', function(){    // validates password1
            validateOldPassword();
        });

        $('#password1').on('focusout', function(){    // validates password1
            validatePassword1();
        });

        $('#password2').on('focusout', function(){    // validate password 2
            validatePassword2();
        });
    }

    // if first_name is not valid then it'll add error wrap class otherwise it'll remove error-wrap class
    function validateOldPassword(){
        // Validates First Name
        var oldPassword = $('#old_password');
        if (oldPassword.val()== '') {
            oldPassword.closest('.form-group').find('.error-text-wrap').text('*Required');
            oldPassword.parent().addClass('error-wrap');
            return false;
        }
        oldPassword.parent().removeClass('error-wrap');
        return true;
    }

    // if password1 is not valid then it'll add error wrap class otherwise it'll remove error-wrap class
    function validatePassword1() {
        // Validates password
        var passwordValidator = /(^(?=.*\d).{8,}$)/;
        password1 = $('#password1');
        if (!password1.val().match(passwordValidator)) {
            password1.closest('.form-group').find('.error-text-wrap').text('password must be at least 8 characters long and must contain at least one number');
            password1.parent().addClass('error-wrap');
            return false;
        }
        password1.parent().removeClass('error-wrap');
        return true;
    }

    // if password2 is not valid then it'll add error wrap class otherwise it'll remove error-wrap class
    function validatePassword2(){
         // Validates password
        var password1 = $('#password1'),
            password2 = $('#password2');
        if (password1.val() != password2.val()){
            password2.closest('.form-group').find('.error-text-wrap').text("Password didn't match");
            password2.parent().addClass('error-wrap');
            return false;
        }
        password2.parent().removeClass('error-wrap');
        return true;
    }

    // checks if every field is valid then return true
    function validateForm() {
        var password1Check = validatePassword1(),
            password2Check = validatePassword2();

        return password1Check && password2Check
    }

}
