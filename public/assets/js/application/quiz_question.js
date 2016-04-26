function QuestionModule(){
    var thisInstance = this;
    thisInstance.curr_color_left = null;
    thisInstance.curr_color_right = null;
    thisInstance.gradientChange = null;

    thisInstance.constants = {
        selector: {
            gradientBackground: ".js-quiz-background",
            cycleSlidShow: ".cycle-slideshow",
            radioButton: ".js-radio",
            radioButtonWrap: ".js_options_wrap",
            radioButtonLabel: ".js-radio-label",
            optionInput: ".js_option_input",
            optionSelectFill: ".js-option-fill",
            optionsWrap: ".js_options_wrap",
            questionsWrap: ".js_question_wrap",
            questionWrapContainer: ".js_question_wrap_container",
            nextButton: '.js_next',
            quesCount: '.js_ques_count',
            quesNextButton: '.js_next_ques_btn',
            quesFinishButton: '.js_ques_finish_btn',
            quizHelp: "#quiz-help",
            questionBoxWrap: ".js-question-box",
            restoreQuizMessage: ".js_restore_quiz_message",
            loaderContainer: "#loader-container",
            bubble_width: ".js-cal-width",
            pq_score_bubble: ".js-result-bubble",
            image_option_container: "#image-option-container",
            image_option: '.js-image-option',
            audio_player: '#audio-player',
            optionsContainer: '.js-options-container',
            optionsText: '.js-option-text',
            activeSlide: ".cycle-slide-active"
        }
    };

    this.init = function () {
        optionSelect(); // bindings to set response at backend and fetch result of question
        fetchNextQuestion(); //bindings to fetch next question and slide to it
        startSlide(); // binds sliding to next question
        slideReloadFromSession(); // slides up restoring quiz from session message

    };




    function multiMediaQuestionBindings(questionData){
        if(questionData.questionType == "video_question"){
            (new QuestionVideoModule()).init(questionData.container);
        }
        else if(questionData.questionType == "audio_question"){
            (new QuestionModule()).adjustMediaBoxSize(questionData.container);
            (new QuestionModule()).audioQuizQuestionBindings(questionData.container);
        }
        else if(questionData.questionType == "image_options_1x4" || questionData.questionType == "image_options_2x2"){
            (new QuestionModule()).imageQuizQuestionBindings(questionData.container);
        }

    }

    //Javascript for Image Based Quiz Question Statics
    this.imageQuizQuestionBindings = function($this) {
        var selector = thisInstance.constants.selector,
            response_flag = false,
            $container = $($this).find(selector.image_option_container),
            $articles = $container.find(selector.image_option);
        $articles.on('mouseenter', function(event) {
            var $article = $(this);
                if (response_flag) return false;
                $articles.not($article).removeClass('active').addClass('blur');
                $article.removeClass('blur').addClass('active');
                $container.on('mouseleave', function(event) {
                    if(!response_flag){
                        $articles.removeClass('active blur');
                    }   
                });
        });
        $($this).on('click',selector.image_option,function(){
            if (!response_flag)
            $(this).find(selector.optionSelectFill).animate({
                width: '70%'
            },3000);
            response_flag = true;
        });
    };

    this.audioQuizQuestionBindings = function($this){
             var audioPlayer = new $($this).find(thisInstance.constants.selector.audio_player).mediaelementplayer({
            alwaysShowControls: true,
            features: ['playpause','progress','volume'],
            audioVolume: 'horizontal',
            iPadUseNativeControls: true,
            iPhoneUseNativeControls: true,
            AndroidUseNativeControls: true
        });
        $($this).find(thisInstance.constants.selector.radioButton).on("change", function(){
            audioPlayer[0].stop();
        });
    };

    this.adjustMediaBoxSize = function($this){
        var selector = thisInstance.constants.selector;
         $($this).find(selector.optionsText).each(function(){
            $$this = $(this);
            var text_len = $$this.text().length;
            var parent_wrap = $$this.closest(selector.optionsContainer);
            if(text_len > 120) {
                parent_wrap.css('width','47%').find(selector.optionsText).css('max-width','350px');
                parent_wrap.prev().css('width','53%');
            }
        });
    }

    thisInstance.resize_bubble = function () {
        var selector = thisInstance.constants.selector;
        var width= $(selector.bubble_width).innerWidth();
        $(selector.pq_score_bubble).height(width).width(width);
    };

    function QueueProcessingModule(){
        var thisInstance = this;
        thisInstance.isQueueOn = false;
        thisInstance.queueIndex = 0;
        thisInstance.queue = []

        function process(){
            if(thisInstance.queueIndex < thisInstance.queue.length){
                thisInstance.isQueueOn = true;
                thisInstance.queue[thisInstance.queueIndex](function () {
                    thisInstance.queueIndex++;
                    process();
                });
            }
            else{
                thisInstance.isQueueOn = false;
            }
        }

        //  Task must have a successCallback as argument and call successCallback at end of task.
        thisInstance.addTask = function(value){
            thisInstance.queue.push(value)
        };

        thisInstance.start = function(){
            if(!thisInstance.isQueueOn){
                process();
            }
        }
    }

    function optionSelect() { // private function
        var queueProcessInstance = new QueueProcessingModule();

        var selector = thisInstance.constants.selector,
            ajaxCallLock = false;
        $(document).on('change', selector.radioButton, function () {
            var $this = $(this),
                $radioWrap = $this.closest(selector.radioButtonWrap),
                $questionWrap = $this.closest('.js-question-wrap'),
                questionCount = $questionWrap.find(selector.quesCount).data("ques_index"),
                maxQuizQuestion = $questionWrap.find(selector.quesCount).data("max_quiz_question"),
                questionId = $radioWrap.closest(selector.optionsWrap).data('question_id');
            if (!ajaxCallLock) {
                ajaxCallLock = true;
                $.ajax({
                    type: 'get',
                    url: $radioWrap.closest(selector.optionsWrap).data('validation_path'),
                    data: {
                        optionId: $this.closest(selector.radioButtonLabel).find(selector.optionInput).val()
                    },
                    dataType: "json",
                    beforeSend: function () {
                        $this.closest(selector.radioButtonLabel).find(selector.optionSelectFill).animate({
                            'width': '70%'
                        }, 5000);
                    },
                    error: function(error){
                        if(error && error.status === 401){
                            location.reload();
                        }
                        else {
                            $this.closest(selector.radioButtonLabel).find(selector.optionSelectFill).animate({
                                'width': '0%'
                            });
                        }
                    }
                }).done(function (data) {
                    if(questionCount < maxQuizQuestion){
                        afterValidate($this, data.validationHtml);
                        queueProcessInstance.addTask(function(successCallback){
                            recalculateScoreCall($radioWrap.closest(selector.optionsWrap).data('score_recalculation_path'), questionId, data.changedScoreData, data.questionSkillId, data.questionPersonalityId, data.hash, function(){
                                successCallback();
                            });
                        });
                    }
                    else{
                        queueProcessInstance.addTask(function(successCallback){
                            recalculateScoreCall($radioWrap.closest(selector.optionsWrap).data('score_recalculation_path'), questionId, data.changedScoreData, data.questionSkillId, data.questionPersonalityId, data.hash, function(){
                                afterValidate($this, data.validationHtml);
                                successCallback();
                            });
                        });
                    }
                    queueProcessInstance.start();
                }).always(function () {
                    ajaxCallLock = false;
                });
            }
        });

        $(document).on('click', selector.radioButtonLabel, function() {
            $(this).find('input').prop('checked', true).trigger('change');
        });
    }

    function afterValidate($this, validationHtml){
        var selector = thisInstance.constants.selector,
            $radioWrap = $this.closest(selector.radioButtonWrap);
        $this.closest(selector.radioButtonLabel).find(selector.optionSelectFill).stop(true, false).animate({
            'width': '100%'
        }, 300, function () {
            if (validationHtml.trim() !== '') {
                var $questionWrap = $radioWrap.closest(selector.questionsWrap);
                $questionWrap.replaceWith(validationHtml);
                thisInstance.resize_bubble();
                $(selector.nextButton).removeClass('hide');
            }
        });
    }

    function recalculateScoreCall(url, questionId, changedScoreData, questionSkillId, questionPersonalityId, hash, alwaysCallback){

        var selector = thisInstance.constants.selector;
        $.ajax({
            type: 'post',
            url: url,
            data: JSON.stringify({
                questionId: questionId,
                changedScoreData: changedScoreData,
                questionSkillId: questionSkillId,
                questionPersonalityId: questionPersonalityId,
                hash: hash
            }),
            contentType: "application/json; charset=utf-8"
        }).done(function (data) {
            if(!data.success) {
                (new RecalculateScoreModule()).init({
                    batchCount: data.batchCount,
                    hashTimeStamp: data.hashTimeStamp,
                    batchCountHash: data.batchCountHash,
                    getUserResponsesUrl: data.getUserResponsesUrl,
                    recalculateCacheTableUrl: data.recalculateCacheTableUrl,
                    successCallback: alwaysCallback,
                    errorCallback: alwaysCallback
                });
            }
            else{
                alwaysCallback();
            }
        }).fail(function(error){
            if(error && error.status === 401){
                location.reload();
            }
            else {
                alwaysCallback();
            }
        });
    }

    function slideReloadFromSession() {
        setTimeout(function () {
            $(thisInstance.constants.selector.restoreQuizMessage).slideUp('slow');
        }, 5000);
    }

    function fetchNextQuestion(){
        var selector = thisInstance.constants.selector;
        $(document).on('click', selector.quesNextButton, function (e){
            e.preventDefault();
            if(!$(this).hasClass('disabled')) {
                var $this = $(this),
                    $questionBoxWrap = $(selector.questionBoxWrap);
                $this.addClass('disabled');    // disable next btn
                $.ajax({
                    type: 'get',
                    url: $questionBoxWrap.data('next_ques_url'),
                    data: {
                        optionId: $this.closest(selector.radioButtonLabel).find(selector.optionInput).val()
                    },
                    success: function (validationHtml) {
                        $(selector.cycleSlidShow).cycle('add', validationHtml);
                        $(selector.cycleSlidShow).cycle('next');

                    },
                    error: function (error) {
                        if(error && error.status === 401){
                            location.reload();
                        }
                        else {
                            $this.removeClass('disabled');
                        }
                    }
                });
            }
        });
    }

    function startSlide() { // private function
        var selector = thisInstance.constants.selector;
        $(selector.questionWrapContainer).addClass('init-transition');
        multiMediaQuestionBindings({questionType: $(selector.questionWrapContainer).data('question_type'), container: selector.activeSlide});
        $(selector.questionWrapContainer).addClass('init-transition');

        $(selector.cycleSlidShow).on('cycle-before', function(event, optionHash, outgoingSlideEl, incomingSlideEl, forwardFlag) {
            var outgoingSkill = $(outgoingSlideEl).data('skill-class');
            setTimeout(function(){
                $(incomingSlideEl).addClass('init-transition');
                $(outgoingSlideEl).addClass('hide-transition');
                multiMediaQuestionBindings({questionType: $(incomingSlideEl).data('question_type'), container: incomingSlideEl});

            },0);
            var incomingSkill = $(incomingSlideEl).data('skill-class');

            if (outgoingSkill != incomingSkill) {
                $(selector.quizHelp).removeClass(outgoingSkill).addClass(incomingSkill);

                if($("html").hasClass("ie9")) {
                    $(selector.gradientBackground).removeClass(outgoingSkill).addClass(incomingSkill);
                }
                else {
                    changeSkillColor(outgoingSkill, incomingSkill, thisInstance.curr_color_left, thisInstance.curr_color_right);
                }
            }
        });
        $(selector.cycleSlidShow).on('cycle-after', function(event, optionHash, outgoingSlideEl, incomingSlideEl, forwardFlag) {
            $(incomingSlideEl).removeClass('next-question-wrap').addClass('prev-question-wrap');
        });
    }

    function changeSkillColor(outgoingSkill, incomingSkill, currentColorLeft, currentColorRight) { // private
        var $gradientElem = $(thisInstance.constants.selector.gradientBackground);

        var gradients = {
            "skill-connect": {
                left: [12, 145, 205],
                right: [0, 167, 128]
            },
            "skill-identify": {
                left: [241, 228, 49],
                right: [225, 89, 89]
            },
            "skill-understand": {
                left: [209, 28, 92],
                right: [128, 54, 139]
            }
        };

        var curr_left, curr_right, next_left, next_right, step = 0, gradientSpeed = 0.01;
        if( currentColorLeft && currentColorRight ) {
            curr_left = currentColorLeft.replace(/^rgba?\(|\s+|\)$/g,'').split(',').map(function(item) {
                return parseInt(item);
            });
            curr_right = currentColorRight.replace(/^rgba?\(|\s+|\)$/g,'').split(',').map(function(item) {
                return parseInt(item);
            });
        }
        curr_left = gradients[outgoingSkill]['left'];
        curr_right = gradients[outgoingSkill]['right'];

        next_left = gradients[incomingSkill]['left'];
        next_right = gradients[incomingSkill]['right'];

        if (thisInstance.gradientChange) {
            clearInterval(thisInstance.gradientChange);
        }
        thisInstance.gradientChange = setInterval(function() {
            var istep = 1 - step;

            var r1 = Math.round(istep * curr_left[0] + step * next_left[0]);
            var g1 = Math.round(istep * curr_left[1] + step * next_left[1]);
            var b1 = Math.round(istep * curr_left[2] + step * next_left[2]);
            var color1 = "rgb("+r1+","+g1+","+b1+")";
            thisInstance.curr_color_left = color1;

            var r2 = Math.round(istep * curr_right[0] + step * next_right[0]);
            var g2 = Math.round(istep * curr_right[1] + step * next_right[1]);
            var b2 = Math.round(istep * curr_right[2] + step * next_right[2]);
            var color2 = "rgb("+r2+","+g2+","+b2+")";
            thisInstance.curr_color_right = color2;

            $gradientElem.css({
                background: "-moz-linear-gradient(45deg, "+color1+" 0%, "+color2+" 97%)"
            }).css({
                background: "-webkit-gradient(linear, left bottom, right top, color-stop(0%, "+color1+"), color-stop(97%, "+color2+"))"
            }).css({
                background: "-webkit-linear-gradient(45deg, "+color1+" 0%, "+color2+" 97%)"
            }).css({
                background: "-o-linear-gradient(45deg, "+color1+" 0%, "+color2+" 97%)"
            }).css({
                background: "-ms-linear-gradient(45deg, "+color1+" 0%, "+color2+" 97%)"
            }).css({
                background: "linear-gradient(45deg, "+color1+" 0%, "+color2+" 97%)"
            });

            step += gradientSpeed;
            step = parseFloat(step.toFixed(3));
            if ( step > 1 ) {
                $gradientElem.removeClass(outgoingSkill).addClass(incomingSkill).css({
                    background: "",
                    filter: ""
                });
                thisInstance.curr_color_left = thisInstance.curr_color_right = null;
                clearInterval(thisInstance.gradientChange);
                thisInstance.gradientChange = null;
            }
        }, 10);
    }
}
