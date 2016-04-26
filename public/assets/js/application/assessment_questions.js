
// Assessment Module that gets initialised on assessment question page load.
function AssessmentModule() {
    var thisInstance = this;

    thisInstance.constants = {
        selector: {
            cycleSlidShow: ".cycle-slideshow",
            nextButton: ".js-cycle-next",
            prevButton: ".js-cycle-prev",
            assessmentErrorWrap: "#assessment-error",
            onboardingWrap: ".js-onboarding-wrap",
            assessmentContainer: ".js-assessment-container",
            rankForm: "#rank-form",
            questionCountWrap: ".js-ques-count",
            currentQuestion: ".js-curr-ques",
            assessmentModalTextWrap: ".js-assessment-modal-text"
        }
    };

    // Function that clears the visible form on 'Clear' button click.
    function clearForm() { // private function
        var selector = thisInstance.constants.selector;
        $(document).on('click', '.js-clear-form', function(e) {
            e.preventDefault();
            var $cycleSlideshow = $(selector.cycleSlidShow),
                index = $cycleSlideshow.data("cycle.opts").currSlide,
                $cycleSlides = $cycleSlideshow.find(".js-cycle-slide").not(".cycle-sentinel");
            $cycleSlides.eq(index).find('.js-rank-form')[0].reset();
        });
    }

    // Function to fade in and out the slides during transition
    function fadeSlideOnTransit() {
        $(thisInstance.constants.selector.cycleSlidShow).on('cycle-before', function(event, optionHash, outgoingSlideEl, incomingSlideEl, forwardFlag) {
            setTimeout(function(){
                $(incomingSlideEl).addClass('init-transition');
                $(outgoingSlideEl).addClass('hide-transition');
            },0);
        }).on('cycle-after', function(event, optionHash, outgoingSlideEl, incomingSlideEl, forwardFlag) {
            $(incomingSlideEl).removeClass('next-question-wrap').addClass('prev-question-wrap');
        });
    }

    // Function that removes all the INACTIVE cycles from markup.
    function removeNonActiveCycleDivs(){
        var selector = thisInstance.constants.selector,
            $cycleSlideshow = $(selector.cycleSlidShow);

        $.each($cycleSlideshow.find('.js-cycle-slide'), function(index){
            if($(this).hasClass('cycle-slide-active')){
            }
            else {
                $cycleSlideshow.cycle('remove', index);
            }
        });
    }

    // Function that ensures user has selected single option for each rank.
    function checkSingleRowSelection(){
        $(document).on('click', "input[type=radio]", function() {
            $("input[data-row='" + $(this).data('row') + "']").prop("checked", false);
            $(this).prop("checked", true);
        });
        $(document).on('click', ".js-radio-circle", function() {
            $("input[data-row='" + $(this).find("input").data('row') + "']").prop("checked", false);
            $(this).find('input').prop("checked", true);
        });
    }

    // Function that is used to validate if answers are in sequence.
    function getResponses(form) {
        var answers = [];

        answers.push(parseInt(form.find('input[type="radio"][data-row="1"]:checked').val(), 10) || null);
        answers.push(parseInt(form.find('input[type="radio"][data-row="2"]:checked').val(), 10) || null);
        answers.push(parseInt(form.find('input[type="radio"][data-row="3"]:checked').val(), 10) || null);
        answers.push(parseInt(form.find('input[type="radio"][data-row="4"]:checked').val(), 10) || null);
        answers.push(parseInt(form.find('input[type="radio"][data-row="5"]:checked').val(), 10) || null);
        answers.push(parseInt(form.find('input[type="radio"][data-row="6"]:checked').val(), 10) || null);
        return answers;
    }

    // Function that validates if answers are in sequence or not.
    function checkResponseValidity(response) {
        var max = -1;
        response.forEach(function (elem) {
            if (elem > max) {
                max = elem;
            }
        });
        for (var idx = 1; idx < max + 1; idx++) {
            if (!(response.indexOf(idx) > -1)) {
                return false;
            }
        }
        return true;
    }

    // Function that creates Answers data for recently attempted question.
    function createRanksData(form){
        var options = {};
        form.find('.js-rank-wrap').each(function(index){
            var $checkedRadioCircle = $(this).find('input:checked');
            options['rank_answer'+(index+1)] = parseInt($checkedRadioCircle.val(), 10) || null;
        });
        return options;
    }

    // Function that sets Old answers for already attempted question.
    function setPrevAnswers(form, prevAnswers){
        $.each(form.find('.js-rank-wrap'), function(index){
            var $prevRank = prevAnswers['rank_answer'+ (index+1)];
            if($prevRank != null){
                $(this).find('input[type="radio"][value="' + $prevRank + '"]').prop("checked", true);
            }
        });
    }

    function changeButtonTextIfLastQuestionOnLoad() {
        var selector = thisInstance.constants.selector;
        var $cycleSlideshow = $(selector.cycleSlidShow);
        if($cycleSlideshow.find('.cycle-slide-active').data('question-no') == thisInstance.MAX_QUESTIONS_IN_ASSESSMENT){
            $cycleSlideshow.find('.cycle-slide-active').find(selector.onboardingWrap).find(selector.nextButton).text('SUBMIT');
        }
    }

    function submitAssessment(url, alwaysCallback){ // function to submit assessment on finish
        var selector = thisInstance.constants.selector,
            $assessmentError = $(selector.assessmentErrorWrap);
        $.ajax({
            url: url
        }).done(function (data) {
            if (data.success) {
                makePardotCall(data);
                window.location = data.assessmentCompleteUrl;
            }
        }).fail(function (error) {
            if(error && error.status === 401){
                location.reload();
            }
            else {
                $assessmentError.find(selector.assessmentModalTextWrap).text('Something went wrong. Please try again later.');
                $assessmentError.modal('show');
            }
        }).always(alwaysCallback);
    }
    // Function handling NEXT button click.
    function onNextButtonClick() {
        var selector = thisInstance.constants.selector,
            ajaxLock = false;

        $(document).on('click', selector.nextButton, function(e){
            e.preventDefault();
            if(!$(selector.nextButton).hasClass("is_clicked") && !$(selector.prevButton).hasClass("is_clicked")) {
                $(selector.nextButton).addClass("is_clicked");
                ajaxLock = true;
                var $this = $(this),
                    $cycleSlideshow = $(selector.cycleSlidShow),
                    $assessmentError = $(selector.assessmentErrorWrap),
                    index = $cycleSlideshow.data("cycle.opts").currSlide,
                    totalSlides = $cycleSlideshow.data("cycle.opts").slideCount,
                    $cycleSlides = $cycleSlideshow.find(".js-cycle-slide").not(".cycle-sentinel");

                if ($cycleSlides.eq(index).find('input:checked').length) {
                    var $thisContainer = $cycleSlideshow.find('.cycle-slide-active'),
                        $thisForm = $thisContainer.find(selector.rankForm),
                        answers = getResponses($thisForm);

                    // VALIDATION //
                    if (checkResponseValidity(answers)) {
                        var options = createRanksData($thisForm);

                        $.ajax({
                            type: 'get',
                            url: $this.data('question_next_url'),
                            data: {
                                presentQuestionNumber: $this.siblings(selector.questionCountWrap).find(selector.currentQuestion).text(),
                                options: options
                            },
                            success: function (data) {
                                removeNonActiveCycleDivs();
                                if(data.success) {
                                    if (data.finalPage) {
                                        // submit assessment to kahler api
                                        submitAssessment($this.data('submit_assessment_url'), function () { // always callback
                                            $(selector.nextButton).removeClass("is_clicked");
                                        });
                                    }
                                    else {
                                        var resultHtml = data.content.html;
                                        $cycleSlideshow.cycle('add', resultHtml);
                                        $cycleSlideshow.cycle('next');

                                        $this.siblings(selector.questionCountWrap).find(selector.currentQuestion).text($('.cycle-slide-active').data('question-no'));
                                        $this.siblings(selector.prevButton).removeClass('hide');

                                        if (data.content.prevAnswers) {
                                            var $thisForm = $cycleSlideshow.find('.cycle-slide-active').find('#rank-form');
                                            setPrevAnswers($thisForm, data.content.prevAnswers);
                                        }

                                        if ($this.siblings(selector.questionCountWrap).find(selector.currentQuestion).text() == thisInstance.MAX_QUESTIONS_IN_ASSESSMENT) {
                                            $cycleSlideshow.find('.cycle-slide-active').find(selector.onboardingWrap).find(selector.nextButton).text('SUBMIT');
                                        }
                                        $(selector.nextButton).removeClass("is_clicked")
                                    }
                                }
                                else{
                                    $assessmentError.find(selector.assessmentModalTextWrap).text(data.content);
                                    $assessmentError.modal('show');
                                    $(selector.nextButton).removeClass("is_clicked")
                                }
                            },
                            error: function (error) {
                                if(error && error.status === 401){
                                    location.reload();
                                }
                                else {
                                    $(selector.nextButton).removeClass("is_clicked");
                                    $assessmentError.find(selector.assessmentModalTextWrap).text(error.message);
                                    $assessmentError.modal('show');
                                }
                            }
                        });
                    }
                    else {
                        $assessmentError.find(selector.assessmentModalTextWrap).text('Ranks must start from 1 and must be sequential.');
                        $assessmentError.modal('show');
                        $(selector.nextButton).removeClass("is_clicked")
                    }
                }
                else {
                    $assessmentError.find(selector.assessmentModalTextWrap).text('Please select at least one answer.');
                    $assessmentError.modal('show');
                    $(selector.nextButton).removeClass("is_clicked")
                }
            }
        });
    }

    // Function handling PREVIOUS button click.
    function onPreviousButtonClick() {
        var selector = thisInstance.constants.selector,
            ajaxLock = false;

        $(document).on('click', selector.prevButton, function(e){
            e.preventDefault();
            if(!$(selector.prevButton).hasClass("is_clicked") && !$(selector.nextButton).hasClass("is_clicked")) {
                $(selector.prevButton).addClass("is_clicked");
                ajaxLock = true;
                var $this = $(this),
                    $cycleSlideshow = $(selector.cycleSlidShow),
                    $assessmentError = $(selector.assessmentErrorWrap),
                    index = $cycleSlideshow.data("cycle.opts").currSlide,
                    totalSlides = $cycleSlideshow.data("cycle.opts").slideCount,
                    $cycleSlides = $cycleSlideshow.find(".js-cycle-slide").not(".cycle-sentinel"),
                    ajaxData = {};


                var $thisContainer = $cycleSlideshow.find('.cycle-slide-active'),
                    $thisForm = $thisContainer.find(selector.rankForm),
                    answers = getResponses($thisForm);

                // VALIDATION
                if (checkResponseValidity(answers)) {
                    var options = createRanksData($thisForm);
                    ajaxData['presentQuestionNumber'] = $this.siblings(selector.questionCountWrap).find(selector.currentQuestion).text();
                    if($cycleSlides.eq(index).find('input:checked').length > 0) {   // sends options if at least one ans is selected
                        ajaxData['options'] = options;
                    }
                    // ajax call to fetch previous question and save present question respnse
                    $.ajax({
                        type: 'get',
                        url: $this.data('question_prev_url'),
                        data: ajaxData,
                        success: function (data) {
                            if(data.success) {
                                var resultHtml = data.content.html;
                                removeNonActiveCycleDivs();

                                $cycleSlideshow.cycle('add', resultHtml);
                                $cycleSlideshow.cycle('prev');
                                $this.siblings(selector.questionCountWrap).find(selector.currentQuestion).text($('.cycle-slide-active').data('question-no'));
                                $this.siblings(selector.prevButton).removeClass('hide');

                                if (data.content.prevAnswers) {
                                    var $thisForm = $cycleSlideshow.find('.cycle-slide-active').find('#rank-form');
                                    setPrevAnswers($thisForm, data.content.prevAnswers);
                                }
                            }
                            else{
                                $assessmentError.find(selector.assessmentModalTextWrap).text(data.content);
                                $assessmentError.modal('show');
                                $(selector.nextButton).removeClass("is_clicked")
                            }
                        },
                        error: function (error) {
                            if(error && error.status === 401){
                                location.reload();
                            }
                            else {
                                $assessmentError.find(selector.assessmentModalTextWrap).text(error.message);
                                $assessmentError.modal('show');
                            }
                        },
                        complete: function(){
                            $(selector.prevButton).removeClass("is_clicked");
                        }
                    });
                }
                else {
                    $(selector.prevButton).removeClass("is_clicked");
                    $assessmentError.find(selector.assessmentModalTextWrap).text('Ranks must start from 1 and must be sequential.');
                    $assessmentError.modal('show');
                }

            }

        });
    }

    thisInstance.init = function(option){
        thisInstance.MAX_QUESTIONS_IN_ASSESSMENT = 40;
        clearForm();
        fadeSlideOnTransit();
        if(option.answers){
            setPrevAnswers($(thisInstance.constants.selector.rankForm), option.answers);
        }
        onNextButtonClick();
        onPreviousButtonClick();
        checkSingleRowSelection();
        changeButtonTextIfLastQuestionOnLoad();
    };

    function makePardotCall(data){
        $.ajax({
            type: "post",
            url: data.pardotCallUrl,
            data: data
        });
    }
}
