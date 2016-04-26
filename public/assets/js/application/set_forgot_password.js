function SetNewPasswordModule() {    // module for registration form
    this.init = function () {
        $('#form').submit(function (event) {    // when from is submitted
            if(!validateForm()) {    //if form is not valid then
                event.preventDefault();    // stop form rom submitting and shows errors
            }
        });

        ValidationBindings();    // validate every filed on focus out
    };

    function ValidationBindings(){

        $('#password1').on('focusout', function(){    // validates password1
            validatePassword1();
        });

        $('#password2').on('focusout', function(){    // validate password 2
            validatePassword2();
        });
    }

    // if password1 is not valid then it'll add error wrap class otherwise it'll remove error-wrap class
    function validatePassword1() {
        // Validates password
        passwordValidator = new RegExp(/(^(?=.*\d).{8,}$)/);
        password1 = $('#password1');
        if (!passwordValidator.test(password1.val())) {
            password1.closest('.form-group').find('.error-text-wrap').text('Password must be at least 8 character long with at least one number');
            password1.closest('.form-group').addClass('error-wrap');
            return false;
        }
        password1.closest('.form-group').removeClass('error-wrap');
        return true;
    }

    // if password2 is not valid then it'll add error wrap class otherwise it'll remove error-wrap class
    function validatePassword2(){
         // Validates password
        password1 = $('#password1');
        password2 = $('#password2');
        if (password1.val() != password2.val()){
            password2.closest('.form-group').find('.error-text-wrap').text("Password didn't match");
            password2.closest('.form-group').addClass('error-wrap');
            return false;
        }
        password2.closest('.form-group').removeClass('error-wrap');
        return true;
    }

    // checks if every field is valid then return true
    function validateForm() {
        password1Check = validatePassword1();
        password2Check = validatePassword2();

        return password1Check && password2Check;
    }

}


function ParseSetForgotPasswordModule() {
    this.init = function() {
        var urlParams = {};
        (function () {
            var pair, // Really a match. Index 0 is the full match; 1 & 2 are the key & val.
                tokenize = /([^&=]+)=?([^&]*)/g,
            // decodeURIComponents escapes everything but will leave +s that should be ' '
                re_space = function (s) {
                    return decodeURIComponent(s.replace(/\+/g, " "));
                },
            // Substring to cut off the leading '?'
                querystring = window.location.search.substring(1);

            while (pair = tokenize.exec(querystring))
                urlParams[re_space(pair[1])] = re_space(pair[2]);
        })();

        var base = 'https://www.parse.com';
        var id = urlParams['id'];
        document.getElementById('form').setAttribute('action', base + '/apps/' + id + '/request_password_reset');
        document.getElementById('username').value = urlParams['username'];
        document.getElementById('token').value = urlParams['token'];
    }
}
