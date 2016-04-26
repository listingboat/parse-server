function ForgotPasswordModule(){
    this.init = function(){
        validationBinding();
        ajaxFormSubmitCall()
    };


    function validationBinding() {
        $('#user-email').on('focusout', function () {    // validates user email
            validateUserEmail();
        });
    }


    function ajaxFormSubmitCall() {
        $("#forgot-password").submit(function (event) {
            event.preventDefault();
            if (validateUserEmail()) {    // if email is valid
                $.ajax({    // ajax call for reset password
                    type: "GET",
                    url: $(this).attr('action'),
                    data: $(this).serialize(),    // data for request
                    success: function (result) {    // on success
                        if (result.success) {    // if email sent successfully
                            $('.modal').modal('hide');
                        }
                        else {    // if error occurred
                            $('#user-email').closest('.form-group').find('.error-text-wrap').text(result.message);
                            $('#user-email').parent().addClass('error-wrap');
                        }
                    }
                });
            }
        });
    }

    function validateUserEmail(){
          // Validates User email
        var emailValidator = /\S+@\S+\.\S+/i,
            user_email = $('#user-email');
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
};
