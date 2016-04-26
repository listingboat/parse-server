function QuizResultModule(){
    var thisInstance = this;
    thisInstance.gradientChange = null;
    thisInstance.count = 1;

    thisInstance.constants = {
        selector: {
            animateBackground : '.js-animate-background'
        }
    };
    this.init = function() {
        var $gradientElem = $(thisInstance.constants.selector.animateBackground);
        var skillCount = 1, skillUnderstand = false , skillConnect = false, skillIdentify = false;

        var allClasses = $gradientElem.attr('class');
        var array = $.map(allClasses.split(' '),$.trim);
        for(var i=0;i<array.length;i++)
        {
            if (array[i].match('skill-connect'))
                skillConnect = true;
            if (array[i].match('skill-identify'))
                skillIdentify = true;
            if (array[i].match('skill-understand'))
                skillUnderstand = true;
        }

        if(skillConnect && skillIdentify) {
            var outgoingSkill = 'skill-connect';
            var incomingSkill = 'skill-identify';
            var otherSkill = null;
            skillCount=2;
        }
        if(skillConnect && skillUnderstand) {
            var outgoingSkill = 'skill-connect';
            var incomingSkill = 'skill-understand';
            var otherSkill = null;
            skillCount=2;
        }
        if(skillUnderstand && skillIdentify) {
            var outgoingSkill = 'skill-understand';
            var incomingSkill = 'skill-identify';
            var otherSkill = null;
            skillCount=2;
        }
        if(skillConnect && skillIdentify && skillUnderstand) {
            var outgoingSkill = 'skill-connect';
            var incomingSkill = 'skill-identify';
            var otherSkill = 'skill-understand';
            skillCount=3;
        }
        if(skillCount >= 2) {
            if($("html").hasClass("ie9")) {
                $gradientElem.removeClass('skill-identify').removeClass('skill-understand').addClass('skill-connect');
            }
            else {
                changeBackgroundGradient(outgoingSkill, incomingSkill, otherSkill);
            }
        }
        if($(".js-data-container").data('is_first_quiz')){
            showPqUnlockModal();
        }

    };

    function showPqUnlockModal() {
        // function taken from https://github.com/zeroclipboard/zeroclipboard/issues/159
        (function ($) {
            var proto = $.fn.modal.Constructor.prototype;
            // Aggregious hack
            proto.enforceFocus = function () {
                var that = this;
                $(document).on('focusin.modal', function (e) {
                    if (that.$element[0] !== e.target && !that.$element.has(e.target).length && !$(e.target).closest('[id ^= "global-zeroclipboard-html-bridge"]').length) {
                        that.$element.focus();
                    }
                });
            };
        })(window.jQuery);
        $("#profile-unlocked-modal").modal('show');
        (new ZeroClipBoardModule()).init();
    }

    function changeBackgroundGradient(outgoingSkill, incomingSkill, otherSkill) { // private
        var $gradientElem = $(thisInstance.constants.selector.animateBackground);
        var count = thisInstance.count;
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

        curr_left = gradients[outgoingSkill]['left'];
        curr_right = gradients[outgoingSkill]['right'];

        next_left = gradients[incomingSkill]['left'];
        next_right = gradients[incomingSkill]['right'];

        setInterval(function() {
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
                step=0, gradientSpeed = 0.01;
                if(otherSkill != null) {
                    switch(count) {
                    case 1 :
                        curr_left = gradients[incomingSkill]['left'];
                        curr_right = gradients[incomingSkill]['right'];
                        next_left = gradients[otherSkill]['left'];
                        next_right = gradients[otherSkill]['right']; 
                        count++;
                        break;

                    case 2:
                        curr_left = gradients[otherSkill]['left'];
                        curr_right = gradients[otherSkill]['right'];
                        next_left = gradients[outgoingSkill]['left'];
                        next_right = gradients[outgoingSkill]['right'];
                        count++;
                        break;

                    case 3:
                        curr_left = gradients[outgoingSkill]['left'];
                        curr_right = gradients[outgoingSkill]['right'];
                        next_left = gradients[incomingSkill]['left'];
                        next_right = gradients[incomingSkill]['right'];
                        count=1;
                        break;
                    }
                }
                else {
                    if(count%2 == 0){
                        curr_left = gradients[outgoingSkill]['left'];
                        curr_right = gradients[outgoingSkill]['right'];
                        next_left = gradients[incomingSkill]['left'];
                        next_right = gradients[incomingSkill]['right']; 
                        count++;
                    }
                    else {
                        curr_left = gradients[incomingSkill]['left'];
                        curr_right = gradients[incomingSkill]['right'];
                        next_left = gradients[outgoingSkill]['left'];
                        next_right = gradients[outgoingSkill]['right'];
                        count++;
                    }
                }
            }
        }, 100);
    }
}
