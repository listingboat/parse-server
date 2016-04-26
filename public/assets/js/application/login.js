function LoginModule () {
    this.init = function() {
        $('#login-form-link').click(function (e) {
            $("#login-form").delay(100).fadeIn(100);
            $("#register-form").fadeOut(100);
            $('#register-form-link').removeClass('active');
            $(this).addClass('active');
            e.preventDefault();
        });
        $('#login-form').submit(function (e) {
            var $this = $(this);
            $('#register-submit').attr('disabled', 'disabled').addClass('disabled');
            $('.js-login-loader').show();
        });
        $('#register-form-link').click(function (e) {
            $("#register-form").delay(100).fadeIn(100);
            $("#login-form").fadeOut(100);
            $('#login-form-link').removeClass('active');
            $(this).addClass('active');
            e.preventDefault();
        });
        $('#register-form').submit(function (e) {
            var $this = $(this);
            var password = $this.find('input[name="password"]').val();
            var confirmPassword = $this.find('input[name="confirm_password"]').val();
            if (password === confirmPassword) {
                $('#register-submit').attr('disabled', 'disabled').addClass('disabled');
                $('.js-register-loader').show();
            }
            else {
                e.preventDefault();
                $('.js-register-error-container').show().find('.js-error').text("Passwords do not match!!");
            }
        });
    };
}
