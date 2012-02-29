define(["jquery"], function($) {

    // find or create an inactive page of the indicated type
    function getInactive(type) {
        var selector = '.' + type + ':not(.active-page)',
            $page = $(selector);
        if ($page.length === 0) {
            // not found create it and add it to the body
            $page = $('<div class="' + type + ' page-wrap"></div>').appendTo('body');
        }
        return $page;
    }

    function transitionTo($page) {
        console.log('transitionTo', $page);
        $('.active-page').animate({opacity: 0}, 100, function() {
            $(this).removeClass('active-page');
            $page.css('opacity', 0).addClass('active-page').animate({opacity:1},100);
        });
    }

    return {
        getInactive: getInactive,
        transitionTo: transitionTo
    };
});