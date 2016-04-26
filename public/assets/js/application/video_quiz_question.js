function QuestionVideoModule(){
    var thisInstance = this;
    thisInstance.constants = {
        selector: {
            playVideo: '.js-play-video',
            videoSection: '.js-video-section',
            closeVideo: '.js-close-video',
            radioButton: ".js-radio",
            playVideoButton: ".js_video_play_button",
            videoImage: ".js_video_question_image"
        }
    };

    this.init = function (container) {
        var selector = thisInstance.constants.selector;
        (new CommonModule()).reloadImage($(selector.playVideoButton));
        container = container || document;
        playVideoClickBinding(container);
        addVideoThumbnail(container);
        $(container).find(selector.playVideo).on('click', function (e) {
            e.preventDefault();
            $(container).find(selector.videoSection).removeClass('hidden').find('iframe').attr('src', $(this).data('video-url'));
        });

        closeVideoBinding(container);
    };

    function addVideoThumbnail(container){
        var selector = thisInstance.constants.selector, videoUri, thumbnailUri;
        videoUri = $(container).find(selector.playVideo).data("video-url");
        if(videoUri.indexOf("youtube") > -1){
            var youtubeVideoId = (videoUri).match(/youtube\.com.*(\?v=|\/embed\/)(.{11})/).pop();
            if (youtubeVideoId.length == 11) {  // show the image if id found
                $(container).find(selector.videoImage).attr("src", "https://img.youtube.com/vi/" + youtubeVideoId + "/0.jpg");
            }
        }
        //TODO when wistia videos are added add this functionality and check if it is working
        //else if(videoUri.indexOf("wistia.com") > -1){
        //    thumbnailUri = (videoUri.split(".bin"))[0] + ".jpg?video_still_time=0";
        //    $(container).find(selector.videoImage).attr("src", thumbnailUri);
        //}
    }

    function playVideoClickBinding(container){
        var selector = thisInstance.constants.selector;
        $(container).find(selector.playVideo).on('click', function (e) {
            e.preventDefault();
            $(container).find(selector.videoSection).removeClass('hidden').find('iframe').attr('src', $(this).data('video-url'));
        });
    }

    function closeVideoBinding(container){
        var selector = thisInstance.constants.selector;
        $(container).find(selector.closeVideo).on('click', function (e) {
            e.preventDefault();
            $(container).find(selector.videoSection).addClass('hidden').find('iframe').attr('src', '');
        });
        $(container).find(selector.radioButton).on("change", function(){
            $(container).find(selector.videoSection).addClass('hidden').find('iframe').attr('src', '');
        })
    }

}
