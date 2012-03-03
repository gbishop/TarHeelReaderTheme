/* page.js manage multiple pages in the DOM */

define(["jquery", "state"], function($, state) {

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

    // simple minded fade transition to a new page, returns a promise that is fulfilled when the new page is active
    function transitionTo($page, options) {
        // fade out, deactive old, then activate new and fade it in
        // Update the title
        var defaults = {
            title: null,
            effect: 'fade',
            colors: false
        };
        var $def = $.Deferred();
        options = $.extend({title:null, effect:'fade'}, options);
        $('.active-page').fadeOut(0, function() {
            if (options.colors) {
                $('body').css({
                    color: '#' + state.get('textColor'),
                    backgroundColor: '#' + state.get('pageColor'),
                    borderColor: '#' + state.get('textColor')
                });
            } else {
                $('body').attr('style', '');
            }
            $('.active-page').removeClass('active-page');
            $page.css('display', 'none').addClass('active-page').fadeIn(0);
            $def.resolve($page);
            var title = options.title || $page.attr('data-title');
            if (title) {
                document.title = title;
                try {
                    document.getElementsByTagName('title')[0].innerHTML = title;
                }
                catch ( Exception ) { }
            }
        });
        return $def;
    }

    return {
        getInactive: getInactive,
        transitionTo: transitionTo
    };
});