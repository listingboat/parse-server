function PersonalityPredictorModule() {  // module to handle events and triggers for personality predictor page
    var thisInstance = this;
    thisInstance.constants = {  // object for keeping constants
        selector: {
            content: '.js_content',
            fetchQuestionsButton: '.js_fetch_questions',
            initialOption: '.js_initial_option',
            option: '.js_option',
            typeContainerA: '.js_type_a',
            typeContainerB: '.js_type_b',
            radioWrap: '.js-radio-wrap',
            radioLabel: '.js-radio-label',
            cycleContainer: '.js_cycle',
            cyclePrev: '.js-prev',
            finishUrl: '.js_finish_url'
        },
        classes: {
            initialOption: 'js_initial_option'
        }
    };

    thisInstance.init = function () {  // function to initialize the module
        fetchQuestionsBindings();    // binding to fetch questions on click of get start buggon
    };

    function selectedOption(currentSlide) { // fetch selected option in given slide
        var selector = thisInstance.constants.selector,
            type = $(selector.initialOption + ":checked").val(),
            selectedOption = null,
            $cycle = $(selector.cycleContainer);
        if (currentSlide !== 1) {  // if current slide is not first slide
            var $currentBlock = $cycle.find('.js_block_' + currentSlide);
            if (type == 'type_a') {  // if first question flow is selected
                selectedOption = $currentBlock.find(selector.typeContainerA).find(selector.option + ":checked").val();
            }
            else if (type == 'type_b') {   // if second question flow selected
                selectedOption = $currentBlock.find(selector.typeContainerB).find(selector.option + ":checked").val();
            }
        }
        else if (type) {
            selectedOption = type;  // return selected type of flow for first slide
        }
        return selectedOption;
    }

    function calculatePersonality(){
        function tuple(array){ // convert array to string type to be used as key to object
            return array.join(',');
        }
        function reorderAndSliceArray(array){ // function to order array such that repeated options are placed earlier
            if(array[0] == array[1]){
                return array.slice(0, 2);
            }
            else if (array[1] == array[2]){
                return array.slice(1, 3);
            }
            else if (array[2] == array[0]){
                return [array[2], array[0]];
            }
            else{
                return array
            }
        }
        var personalityForOptions = {
            type_a: {},
            type_b: {}
        };
        personalityForOptions.type_a[tuple(['option_a', 'option_a'])] = 'organizer';
        personalityForOptions.type_a[tuple(['option_b', 'option_b'])] = 'advisor';
        personalityForOptions.type_a[tuple(['option_c', 'option_c'])] = 'doer';
        personalityForOptions.type_b[tuple(['option_a', 'option_a'])] = 'connector';
        personalityForOptions.type_b[tuple(['option_b', 'option_b'])] = 'original';

        var selectedFlow = selectedOption(1),
            selectedOptions = [selectedOption(2), selectedOption(3), selectedOption(4)],
            personality = personalityForOptions[selectedFlow][tuple(reorderAndSliceArray(selectedOptions))];
        if(!personality){ // set personality type dreamer if user is none of above personality
            personality = 'dreamer';
        }
        return personality;
    }

    function fetchAndDisplayResult(personality) {
        var selector = thisInstance.constants.selector;
        $.ajax({   // ajax call to fetch result partial
            url: $(selector.finishUrl).data('finish_url'),
            data: {personality: personality},
            type: 'GET'
        }).done(function (html) {
            $(selector.content).html(html);
            fetchQuestionsBindings();
        }).always(function (){
            $(selector.option).removeAttr('disabled');
        });
    }

    function cycleBindings() {  // function intialized cycle and binds event on click of next and prev buttons
        var selector = thisInstance.constants.selector,
            $cycle = $(selector.cycleContainer);
        $cycle.cycle({});  // initialize cycle
        $(selector.option).change(function (event) {

            var $this = $(this),
                $radioWrap = $this.closest(selector.radioWrap);
            $radioWrap.find(selector.radioLabel).removeClass('selected');  // removed selected state from all in radio wrap
            $radioWrap.find(selector.option + ":checked").closest(selector.radioLabel).addClass('selected');  // add selected state to check radio button label

            // to toggle flow of question when initial option is selected
            if($this.hasClass(thisInstance.constants.classes.initialOption)) {
                var type = $(selector.initialOption + ":checked").val();
                if (type == 'type_a') {  // first flow of questions
                    $(selector.typeContainerA).removeClass('hide');
                    $(selector.typeContainerB).addClass('hide');
                }
                else if (type == 'type_b') {  // second flow of questions
                    $(selector.typeContainerB).removeClass('hide');
                    $(selector.typeContainerA).addClass('hide');
                }
            }

            var cycleOptions = $cycle.data("cycle.opts"),
                currentSlide = cycleOptions.currSlide + 1,
                totalSlide = cycleOptions.slideCount;

            if (selectedOption(currentSlide)) {  // if option is selected in current slide
                $cycle.cycle('next');
                if (currentSlide == 1) {  // if current slide is first slide
                    $(selector.cyclePrev).removeClass('hide');
                }
                if (currentSlide == totalSlide) {
                    fetchAndDisplayResult(calculatePersonality());
                }
                $radioWrap.find(selector.option).attr('disabled', 'disabled')
            }
        });

        $(selector.radioLabel).click(function() {
            $(this).find("input").prop('checked', true).trigger('change');
        });

        $(selector.cyclePrev).click(function (event) {
            event.preventDefault();

            var cycleOptions = $cycle.data("cycle.opts"),
                currentSlide = cycleOptions.currSlide + 1,
                $prevBlock = $cycle.find('.js_block_' + (currentSlide - 1));

            if (currentSlide == 2) {   // if current slide is second slide
                $(selector.cyclePrev).addClass('hide');

            }
            $prevBlock.find(selector.option).removeAttr('disabled').prop('checked', false);
            $prevBlock.find(selector.radioLabel).removeClass('selected');

            $cycle.cycle('prev');
        });
    }

    // function to bind event to get start button to fetch question of personalty predictor
    function fetchQuestionsBindings(){
        var selector = thisInstance.constants.selector,
            ajaxLock = false;
        $(selector.fetchQuestionsButton).click(function(e){  // bind event on click of 'Get started' button predictor start page
            e.preventDefault();
            if(!ajaxLock) {
                ajaxLock = true;
                var $this = $(this),
                    fetchQuestionsUrl = $this.data('fetch_questions_url');
                $.ajax({   // ajax call to fetch questions partial
                    url: fetchQuestionsUrl,
                    type: 'GET'
                }).done(function (html) {
                    $(selector.content).html(html);
                    cycleBindings();  // binding to set events related to cycle
                }).always(function () {
                    ajaxLock = true;
                });
            }
        });
    }
}
