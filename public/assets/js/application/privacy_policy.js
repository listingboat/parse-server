function policyModule() {
    this.init = function() {
        $('.js-topic-list a').click(function(e){
            e.preventDefault();
            $this = $(this);
            $('html, body').animate({
                scrollTop: $($this.attr('href')).offset().top
            }, 500);
        });
    }
}
