function PlayVideoModule() {
    var thisInstance = this;
    thisInstance.constants = {
        selector: {
            playVideo: '.js-play-video',
            videoSection: '.js-video-section',
            closeVideo: '.js-close-video',
            videoModal: '#id-video-modal',
            nextStepButton: '#next-step-btn',
            playVideoButton: ".js_video_play_button"
        }
    };

    function bannerVideoBindings(eventLabel, eventValue) {
        var selector = thisInstance.constants.selector;
        var next_step_link = $(selector.nextStepButton).attr('href');
        $(selector.nextStepButton).attr('href','');

        // this functions sets 'show_next_button=true' in cookie if not set
        // if 'show_next_button=true' already exist then enables the next button
        function cookieBinding(){

            var selector = thisInstance.constants.selector;
            if(getCookie("show_next")){
                $(selector.nextStepButton).removeClass('disabled').attr('href',next_step_link);
            }
            setCookie("show_next", "true", (2 * 60 * 60 * 1000));
            $(selector.nextStepButton).on('click', function(){
                setCookie("show_next", "true", -1);
            })

        }

        cookieBinding();
        $(document).on('click', selector.playVideo, function (e) {
            e.preventDefault();
            $(selector.videoSection).removeClass('hidden').find('iframe').attr('src', $(this).data('video-url'));
            if($(this).hasClass('show-next-button')) {

                window._wq = window._wq || [];
                _wq.push({ '_all' : function(video) {
                    video.ready(function(){
                        ga('send', {
                            hitType: 'event',
                            eventCategory: 'Videos',
                            eventAction: 'play',
                            eventLabel: eventLabel,
                            eventValue: eventValue
                        });
                        setTimeout(function(){
                            $(selector.nextStepButton).removeClass('disabled').attr('href',next_step_link).unbind('click');
                        },10000);
                    });
                }});
            }
        });

    }

    this.init = function (eventLabel, eventValue) {
        (new CommonModule()).reloadImage($(thisInstance.constants.selector.playVideoButton));
        bannerVideoBindings(eventLabel, eventValue);
    };

    this.initVideoModal = function(eventLable, eventValue) {
        var selector = $(thisInstance.constants.selector.nextStepButton).attr('href');

        $(selector.videoModal).on('show.bs.modal', function() {
            $(this).find('iframe').attr('src', $(selector.playVideo).data('video-url'));
        }).on('hide.bs.modal', function() {
            $(this).find('iframe').attr('src', '');
        })
    };

    function gaVideoEventTracking(eventData){
        ga('send', {
            hitType: 'event',
            eventCategory: 'Videos',
            eventAction: 'play',
            eventLabel: eventData.eventLabel,
            eventValue: eventData.eventValue
        });
    }
    
}
