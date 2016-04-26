
function ZeroClipBoardModule() {
    this.init = function () {
        // ZeroClipboard JS starts here
        zeroClipboardBindings();
        adjustModal();
        setClipboardValue($('.js-small-badge'));
    };

    //preventing appending modal-open class on body
    function adjustModal() {
        $('#quiz-help').on('shown.bs.modal', function (e) {
            $('body').removeClass('modal-open');
            $('body').css('padding-right','0');
        });
    }
    // set image and signature according to selected radio button
    function setImageAndSignature() {
        var badgeId = $(' .js-custom-radio input[type="radio"]:checked').attr('id');    // id of the selected radio button
        if (badgeId == "large-badge") {    // if selected radio button is the large one
            $('.js-large-badge').show();    // show the large badge
            $('.js-small-badge').hide();    // hide the small badge
            setClipboardValue($('.js-large-badge'));    // set the value of clipboard to the large image source
        }
        else {    // if selected radio button is the small one
            $('.js-small-badge').show();    // show the small badge
            $('.js-large-badge').hide();    // hide the large badge
            setClipboardValue($('.js-small-badge'));    // set the value of clipboard to the small badge source
        }
    }


    // functionality of zeroClipboard
    function zeroClipboardBindings() {
        //zeroClipboard Fallback for flash support
        ZeroClipboard.on("error", function (e) {
            $('#js-copy-button').text('SELECT').click(function () {
                $(this).siblings('#js-copy-me').select();
            });
        });
        ZeroClipboard.config({forceEnhancedClipboard: true});
        var client = new ZeroClipboard(document.getElementById("js-copy-button"), {moviePath: 'ZeroClipboard.swf'});
        client.on("ready", function (readyEvent) {
            // alert( "ZeroClipboard SWF is ready!" );
            client.on("aftercopy", function (event) {
                $('#js-copy-button').text('COPIED');
                setTimeout(function () {
                    $('#js-copy-button').text('COPY');
                }, 2000);
            });
        });
    }

    // function to set clipboard value
    function setClipboardValue(selectedImage) {
        var signature = "<a href = '" + $('#js-copy-me').data('public_profile_url') + "'>",// TODO: when pq page for third user is created, add link of page in href of a tag
            imageSource = selectedImage.prop('src');
        signature += "<img src='" + $(".js_badge_gif").prop("src") + "'>";
        signature += "<img src='" + imageSource + "'></a> <br>";

        $('#js-copy-me').val(signature);
        $('#copy-me').html(signature);    // sets the elements to be copied in 'copy-me' div
    }
}
