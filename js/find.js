/*
generate the find page locally and enable switch selection of items
*/

define(["jquery",
         "route",
         "templates",
         "state",
         "keyboard",
         "speech",
         "jquery.scrollIntoView"
        ], function($, route, templates, state, keys, speech) {

    // handle find locally
    function findRender(url, query) {
        var view = {};
        view.heading = templates.heading();
        view.searchForm = templates.searchForm(); // sets the selects based on the state

        $('#find-page').animate({opacity:0}, 500);
        // fetch the json for the current set of books
        $.ajax({
            url: url,
            data: 'json=1',
            dataType: 'json',
            success: function(data, textStatus, jqXHR) {
                // TODO: print a message when none are found

                // setup the image width and height for the template
                var voice = state.get('voice').substring(0,1);
                for(var i=0; i<data.books.length; i++) {
                    var c = data.books[i].cover;
                    if (c.width > c.height) {
                        c.pw = 100;
                        c.ph = 100*c.height/c.width;
                        c.pm = (100 - c.ph) / 2;
                    } else {
                        c.ph = 100;
                        c.pw = 100*c.width/c.height;
                        c.pm = 0;
                    }
                }
                view.bookList = templates.bookList(data);
                var page = state.get('page');
                if (data.more) {
                    view.nextLink = state.find_url(page + 1);
                }
                if (page > 1) {
                    view.backLink = state.find_url(page - 1);
                }
                var $content = $('#find-page');
                if ($content.length === 0) {
                    $('body').append('<div id="find-page" class="page-wrap"></div>');
                    $content = $('#find-page');
                } else {
                    $content.empty();
                }
                // TODO: use a better transition

                $content.append(templates.find(view));
                $('.active-page').removeClass('active-page');
                $content.addClass('active-page');
                $content.animate({opacity:1}, 500);
            }
        });
        return true;
    }
    function moveSelection(direction) {
        // stop any animation of the preview and remove it
        $('#preview').stop(true, false).remove();
        // get a list of the selectable elements
        var targets = $('.selectable');
        // and find the selected one
        var selected = $('.selected');
        var i = 0;
        var toSelect = direction > 0 ? $(targets[0]) : $(targets[targets.length -1]);
        if (selected.length > 0) {
            i = targets.index(selected);
            if (direction > 0) {
                i = (i + 1) % targets.length;
            } else {
                i = (i - 1);
                if (i < 0) {
                    i = targets.length - 1;
                }
            }
            toSelect = $(targets[i]);
            selected.removeClass('selected');
        }
        toSelect.addClass('selected');
        // speak the title
        var voice = state.get('voice').substr(0,1);
        if (toSelect.attr('data-has-speech') === '1') {
            var id = toSelect.attr('data-id');
            var lang = toSelect.attr('lang');
            speech.play(id, lang, voice, 1);
        }
        // make sure it is visible
        toSelect.scrollIntoView({
            duration: 100,
            complete: function () {
                // when the scrolling is complete, compute the parameters of the preview
                var $window = $(window);
                var ww = $window.width();
                var wh = $window.height();
                var wt = $window.scrollTop();
                // calculate the font size that would make the book cover fill the screen with 50 pixels margin
                var fs = (Math.min(ww,wh) - 50) / 11; // the book is 11ems wide and tall
                // comnpute the resulting book size
                var b = 11 * fs;
                // get the final coordinates for the book
                var left = (ww - b) / 2;
                var top = wt + (wh - b) / 2;
                toSelect.clone()
                .attr('id', 'preview') // make a copy of the selected book
                    .appendTo('.thr-book-list') // add it to the end of the list
                    .css('background-color', '#' + state.get('pageColor')) // make the background solid
                    .css(toSelect.offset()) // position it over the original
                    .delay(200) // wait a bit so we can see the highlight move
                    .animate({ // animate the book zooming up to final size
                        top: top,
                        left: left,
                        fontSize: fs
                    }, 300) // not too slow or it jiggles a lot
                    .delay(8000) // hold there so we can see it
                    .fadeOut(500); // fade it away

                // replace the images with high res versions
                $('#preview')
                    .find('img')
                    .each(function(i, img){
                        img.src = img.src.replace('_t', '');
                    });
            }
        });
    }
    // set up bindings for movement and selection, these are published from the keyboard handler
    $.subscribe('/find/next', function(e, name, code) {
        moveSelection(1);
    });
    $.subscribe('/find/prev', function(e, name, code) {
        moveSelection(-1);
    });
    $.subscribe('/find/select', function(e, name, code) {
        var selected = $('.selected');
        var link;
        if (selected.length > 0) {
            if (selected.is('a'))
                link = selected;
            else
                link = selected.find('a');
            link.click();
        }
    });

    function findConfigure(url, query) {
        // set the colors based on the state
        $('body').css({
            color: '#' + state.get('textColor'),
            backgroundColor: '#' + state.get('pageColor'),
            borderColor: '#' + state.get('textColor')
        });
        // setup the show search button for small screens
        $('#searchShowButton').click(function(e){
            e.preventDefault();
            $('#searchForm').slideDown('fast');
            $(this).hide();
        });
        // configure the keyboard controls
        keys.setMap({
            'left': '/find/select',
            'right': '/find/next',
            'up': '/find/prev',
            'space': '/find/next',
            'enter': '/find/select',
            'c': '/find/select',
            'm': '/find/next'
        });
    }
    route.addRoute(/^\/find\/(\?.*)?$/, findRender, findConfigure);

    // I don't really need to define anything but I need it to be called before main runs.
    return {};
});