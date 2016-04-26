function landing_page_init(){
	$('.js-input-text').focus(function(){
		$(this).closest('.js-input-group').addClass('focus-wrap');
	});
	$('.js-input-text').blur(function(){
		$(this).closest('.js-input-group').removeClass('focus-wrap');
	});
	$('input').placeholder();
}

function successModalInit() {
	$('.js-join-btn').click(function(){
		var $this = $(this).closest('.js-join-form');
		$this.fadeOut(200, function() {
			$this.siblings('.js-success-wrap').addClass('animate-wrap');
		});
	});
}
