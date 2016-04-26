var UTILS = {};

function getQueryDict() {
    var queryDict = {};
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        var key = decodeURIComponent(pair[0]);
        if(key != ""){
            if (key in queryDict) {
                queryDict[key].push(decodeURIComponent(pair[1]));
            }
            else {
                queryDict[key] = [decodeURIComponent(pair[1])];
            }
        }
    }
    return queryDict;
}

function setCookie(cname, cvalue, exTime) {
    var d = new Date();
    d.setTime(d.getTime() + exTime);
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}

function disableForm(form, exclude) {
    $(form).find('input, select, textarea, button').not(exclude).attr('disabled', 'disabled');
}

function enableForm(form, exclude) {
    $(form).find('input, select, textarea, button').not(exclude).removeAttr('disabled');
}


function CommonModule() {
    var thisInstance = this;
    this.init = function () {
        headerNav();
        commonAjaxSettings();
        updateUserLastActivity();
        checkAndReport155Binding();
        checkNewContest();
    };

    function contestBannerBindings(){
        $('.js_dismiss_banner').click(function(event){
            event.preventDefault();
            var $rewardModal = $(this).closest('.js_rewards_banner'),
                contestId = $rewardModal.data('contest_id');
            $rewardModal.slideUp();
            setCookie('dismissed_contest', contestId); // set contest id for dismissed contest
        });
    }
    function checkNewContest(){
        var $body = $(".js_body_data_container"),
            contestUrl = $body.data("contest_url");
        if(contestUrl) {
            $.ajax({
                url: contestUrl
            }).done(function(response){
                if(response.success && getCookie('dismissed_contest') !== response.contest_id){
                    $('.js_rewards_banner').replaceWith(response.bannerHtml);
                    $('.js_rewards_banner').after(response.modalHtml);
                    $('.js_rewards_banner').slideDown();
                    contestBannerBindings();
                }
            });
        }
    }

    function updateUserLastActivity() {
        var $body = $(".js_body_data_container"),
            userLastActivity = parseInt($body.data("user_last_activity_time"));
        if (userLastActivity) {
            var currentTime = parseInt($body.data("current_time")),
                interval = parseInt($body.data("last_activity_update_interval"));
            if (currentTime - userLastActivity >= interval) {
                $.ajax({
                    type: "get",
                    url: $body.data("update_activity_url")
                })
            }
        }
    }

    function checkAndReport155Binding(){
        if($(".js_error_data").attr("data-report_url")){
            var data = $(".js_error_data").data();
            reportError(data["report_url"], data["report_hash"], data["report_time_stamp"]);
        }
    }

    function commonAjaxSettings() {
        $.ajaxSetup({
            // Disable caching of AJAX responses
            cache: false,
            error: function(error){
                if(error.responseText) {
                    var errorData = JSON.parse(error.responseText);
                    if (errorData.errorCode && errorData.errorCode == 155) {
                        reportError(errorData.reportUrl, errorData.reportHash, errorData.reportTimeStamp);
                    }
                }
        }
        });
    }

    function headerNav() {
        $(document).click(function (event) {
            var clickover = $(event.target).closest(".js-overflow-menu");
            var isMenuOpened = $(".js-overflow-menu").hasClass("in");
            var isIE9 = $("html").hasClass("ie9");
            if (!isIE9 && isMenuOpened && !clickover.length) {
                $(".js-nav-toggle").click();
            }
        });
    }

    // function to report request overflow
    function reportError(url, hash, timeStamp){
        $.ajax({
            type: "post",
            url: url,
            data: {hash: hash, timeStamp: timeStamp}
        })
    }

    thisInstance.reloadImage = function ($playButton){
        var uri = $($playButton).prop("src");
        uri = thisInstance.updateQueryStringParameter(uri, "time_stamp", (new Date()).getTime());
        $($playButton).prop("src", uri);
    };

    // function to add or update query parameter
    // http://stackoverflow.com/questions/5999118/add-or-update-query-string-parameter
    thisInstance.updateQueryStringParameter = function(uri, key, value) {
        var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
        var separator = uri.indexOf('?') !== -1 ? "&" : "?";
        if (uri.match(re)) {
            return uri.replace(re, '$1' + key + "=" + value + '$2');
        }
        else {
            return uri + separator + key + "=" + value;
        }
    }
}
