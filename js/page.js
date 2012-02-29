/* page.js manage multiple pages in the DOM */

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

    // simple minded fade transition to a new page
    function transitionTo($page, options) {
        // fade out, deactive old, then activate new and fade it in
        // Update the title
        options = $.extend({title:null, effect: 'fade'}, options);
        $('.active-page').animate({opacity: 0}, 100, function() {
            $(this).removeClass('active-page');
            var title = options.title || $page.attr('data-title');
            if (title) {
                document.title = title;
                try {
                    document.getElementsByTagName('title')[0].innerHTML = title;
                }
                catch ( Exception ) { }
            }
            $page.css('opacity', 0).addClass('active-page').animate({opacity:1},100);
        
        });
    }

    return {
        getInactive: getInactive,
        transitionTo: transitionTo
    };
});