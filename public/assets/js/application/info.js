function InfoModule() {
    this.init = function () {
        var loader = $('.js-loader'),
            assesmentBtn = $('.js-start-assessment'),
            backBtn = $('.js-back-assessment'),
            params = getQueryDict();
        loader.hide();
        if (params.hasOwnProperty('start')) {
            var showStart = params.start[0];
            if (showStart == "0") {
                assesmentBtn.hide();
                backBtn.show();
            } else {
                assesmentBtn.show();
                backBtn.hide();
            }
        } else {
            assesmentBtn.hide();
            backBtn.show();
        }

        assesmentBtn.click(function (e) {
            e.preventDefault();
            $(this).prop('disabled', true);
            var hideLoader = function () {
                loader.hide();
            };
            (new UTILS.User()).newAssessment(hideLoader, function () {
                hideLoader();
                assesmentBtn.prop('disabled', false);
            });
            loader.show();
        });

        backBtn.click(function (e) {
            e.preventDefault();
            $(this).prop('disabled', true);
            loader.show();
            history.go(-1);
        });
    };
}
