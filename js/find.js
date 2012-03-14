/*
generate the find page locally and enable switch selection of items
*/

define(["jquery",
         "route",
         "templates",
         "state",
         "keyboard",
         "speech",
         "page",
         "jquery.scrollIntoView"
        ], function($, route, templates, state, keys, speech, page) {

    // handle find locally
    function findRender(url, query) {
        console.log('findRender', url);
        var view = {},
            $def = $.Deferred();
        view.searchForm = templates.searchForm(); // sets the selects based on the state

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
                view.bookList = templates.render('bookList', data);
                var pageNumber = state.get('page');
                if (data.more) {
                    view.nextLink = state.find_url(pageNumber + 1);
                }
                if (pageNumber > 1) {
                    view.backLink = state.find_url(pageNumber - 1);
                }
                var $newPage = page.getInactive('find-page');
                $newPage.empty()
                    .append(templates.get('heading'))
                    .append('<div class="content-wrap">' +
                            templates.render('find', view) +
                            '</div>');
                $def.resolve($newPage, {title: 'Find - Tar Heel Reader', colors: true});
            }
        });
        return $def;
    }
    function moveSelection(direction) {
        // operate on the active page only
        var $page = $('.active-page');
        // stop any animation of the preview and remove it
        $('#preview').stop(true, false).remove();
        // get a list of the selectable elements
        var targets = $page.find('.selectable');
        // and find the selected one
        var selected = $page.find('.selected');
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
                // compute the resulting book size
                var b = 11 * fs;
                // get the final coordinates for the book
                var left = (ww - b) / 2;
                var top = wt + (wh - b) / 2;
                toSelect.clone()
                .attr('id', 'preview') // make a copy of the selected book
                    .appendTo($page.find('.thr-book-list')) // add it to the end of the list
                    .css({
                        position: 'absolute',
                        margin: 0,
                        zIndex: 10
                    })
                    .css(toSelect.offset()) // position it over the original
                    .delay(200) // wait a bit so we can see the highlight move
                    .animate({ // animate the book zooming up to final size
                        top: top,
                        left: left,
                        fontSize: fs
                    }, 300) // not too slow or it jiggles a lot
                    .delay(8000) // hold there so we can see it
                    .fadeOut(500, function() { // fade it away
                        $(this).remove(); // then remove it.
                    });
                // replace the images with high res versions
                $page.find('#preview')
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
        // setup the show search button for small screens
        var $page = $(this);
        var $form = $page.find('.searchForm');
        console.log('findConfigure');
        $page.find('a.searchShowButton').click(function(e){
            console.log('click');
            e.preventDefault();
            $form.slideDown('fast');
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

        return {title: 'Find - Tar Heel Reader', colors: true};
    }
    route.add('render', /^\/find\/(\?.*)?$/, findRender);
    route.add('init', /^\/find\/(\?.*)?$/, findConfigure);

    // I don't really need to define anything but I need it to be called before main runs.
    return {};
});
