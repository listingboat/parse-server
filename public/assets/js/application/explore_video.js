function PlayExploreVideoModule(){
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

    this.init = function(eventData) {
        var selector = thisInstance.constants.selector;
        playVideoClickBinding();
        (new CommonModule()).reloadImage($(selector.playVideoButton));
        $(document).on('click', selector.playVideo, function (e) {
            gaVideoEventTracking(eventData);
            window._wq = window._wq || [];
            _wq.push({ '_all' : function(video) {
                video.ready(function() {
                    var videoDuration = parseInt(video.duration());
                    video.bind("secondchange", function(s) {
                        if (s >= videoDuration) {
                            $(selector.closeVideo).click();
                        }
                    });
                });
            }});
        });
        closeVideoBinding();
    };

    function playVideoClickBinding(){
        var selector = thisInstance.constants.selector;
        $(document).on('click', selector.playVideo, function (e) {
            e.preventDefault();
            $(selector.videoSection).removeClass('hidden').find('iframe').attr('src', $(this).data('video-url'));
        });
    }

    function closeVideoBinding(){
        var selector = thisInstance.constants.selector;
        $(document).on('click', selector.closeVideo, function (e) {
            e.preventDefault();
            $(selector.videoSection).addClass('hidden').find('iframe').attr('src', '');
        });
    }

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
