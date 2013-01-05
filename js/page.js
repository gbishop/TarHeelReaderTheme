/* page.js manage multiple pages in the DOM */

define(["jquery", "state"], function($, state) {

    // find or create an inactive page of the indicated type
    function getInactive(type) {
        var selector = 'body > .' + type + ':not(.active-page):first',
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
                $('.thr-colors').css({
                    color: '#' + state.get('textColor'),
                    backgroundColor: '#' + state.get('pageColor'),
                    borderColor: '#' + state.get('textColor')
                });
                setHoverColors($page);  // set the hover colors as well
                console.log('Hover colors are set');
            }
            $('.active-page').removeClass('active-page');
            $page.css('display', 'none').addClass('active-page').fadeIn(0);
            var title = options.title || $page.attr('data-title');
            $def.resolve($page, title);
            /*
            console.log('options', options, title);
            if (title) {
                document.title = title;
                try {
                    document.getElementsByTagName('title')[0].innerHTML = title;
                }
                catch ( Exception ) { }
            } */
        });
        return $def;
    }
    
    // set text and background color of a jQuery element
    function setHoverColors($page) {
        var pageColor = "#" + state.get('pageColor'),
            textColor = "#" + state.get('textColor');

        // swap text and background colors on hover
        $page.find(".thr-back-link, .thr-next-link, .findPageNavButton, .decoratedList > li").hover(function() {
            $(this).css({ background: textColor, color: pageColor })
                   .find("a")
                   .css({color: pageColor });
        }, function() {
            $(this).css({ background: pageColor, color: textColor })
                   .find("a")
                   .css({color: textColor });
        }); // end hover
        
        $(document).keypress(function(e) {
            $page.find(".thr-colors > li.selected")
                 .css({background: textColor, color: pageColor })
                 .find("a")
                 .css({color: pageColor });
            
            $page.find(".thr-colors > li:not(.selected)")
                 .css({background: pageColor, color: textColor })
                 .find("a")
                 .css({color: textColor });
        }); // end keypress
    }

    return {
        getInactive: getInactive,
        transitionTo: transitionTo,
        setHoverColors: setHoverColors // needed by read.js in case the user refreshes the page while reading a book
    };
});
