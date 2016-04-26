function assessmentCycleInit() {
	$(".js-cycle-slideshow").on('cycle-before', function(event, optionHash, outgoingSlideEl, incomingSlideEl, forwardFlag) {
		$('.js-curr-ques').text($(incomingSlideEl).data('question-no'));
	});

	$(document).on('click', '.js-clear-form', function(e) {
		e.preventDefault();

		var index = $(".js-cycle-slideshow").data("cycle.opts").currSlide;
		var $cycle_slides = $(".js-cycle-slideshow").find(".js-cycle-slide").not(".cycle-sentinel");

		$cycle_slides.eq(index).find('.js-rank-form')[0].reset();
	});

	var cycle_transition;
	$(document).on('click', ".js-cycle-next, .js-cycle-prev", function(e) {
		e.preventDefault();
		var index = $(".js-cycle-slideshow").data("cycle.opts").currSlide;
		var total_slides = $(".js-cycle-slideshow").data("cycle.opts").slideCount;
		var $cycle_slides = $(".js-cycle-slideshow").find(".js-cycle-slide").not(".cycle-sentinel");

		if($cycle_slides.eq(index).find('input:checked').length) {
			if($(e.target).hasClass("js-cycle-next")) {
				if(index == total_slides-1) {
					$("#assessment-success").modal('show');
				}
				else {
					$('.js-cycle-slideshow').cycle('next');
				}
			}
			else {
				$('.js-cycle-slideshow').cycle('prev');
			}
		}
		else {
			$("#assessment-error").modal('show');
		}
	});

}
