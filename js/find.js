/*
generate the find page locally and enable switch selection of items
*/

define([ "route",
         "templates",
         "state",
         "keyboard",
         "speech",
         "page",
         "ios",
         "jquery.scrollIntoView"
        ], function(route, templates, state, keys, speech, page, ios) {

    // return the url that will restore the find page state
    function find_url(page) {
        var q = {};
        var ps = ["search", "category", "reviewed", "audience", "language"];
        for(var i=0; i<ps.length; i++) {
            var p = ps[i];
            q[p] = state.get(p);
        }
        if (!page) {
            page = +state.get('page');
        }
        q['page'] = page;
        var qs = $.param(q);
        var url = '/find/';
        if (qs) {
            url += '?' + qs;
        }
        return url;
    }

    // handle find locally
    function findRender(url, query) {
        //console.log('findRender', url);
        var view = {},
            $def = $.Deferred();
        // record the state so we can come back here
        state.set('findAnotherLink', find_url());
        view.searchForm = templates.searchForm(); // sets the selects based on the state

        // fetch the json for the current set of books
        $.ajax({
            url: url,
            data: 'json=1',
            dataType: 'json',
            timeout: 30000,
            success: function(data, textStatus, jqXHR) {
                // setup the image width and height for the template
                for(var i=0; i<data.books.length; i++) {
                    templates.setImageSizes(data.books[i].cover);
                }
                view.bookList = templates.render('bookList', data);
                var pageNumber = +state.get('page');
                if (data.more) {
                    view.nextLink = find_url(pageNumber + 1);
                }
                if (pageNumber > 1) {
                    view.backLink = find_url(pageNumber - 1);
                }
                var $newPage = page.getInactive('find-page');
                $newPage.empty()
                    .append(templates.render('heading',
                        {settings:true, chooseFavorites:true}))
                    .append('<div class="content-wrap">' +
                            templates.render('find', view) +
                            '</div>');
                $def.resolve($newPage, {title: 'Tar Heel Reader | Find', colors: true});
            }
        });
        return $def;
    }
    function moveSelection(direction) {
        // operate on the active page only
        var $page = $('.active-page');
        // stop any animation of the preview and remove it
        $('.preview').stop(true, false).remove();
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
        var voice = state.get('voice');
        if (toSelect.attr('data-speech')) {
            if (speech.hasSpeech[state.get('locale')]) {
                speech.play('site', voice, toSelect.attr('data-speech'));
            }
        } else {
            var id = toSelect.attr('data-id'),
                lang = toSelect.attr('lang'),
                bust = toSelect.attr('data-bust');
            if (speech.hasSpeech[lang]) {
                speech.play(id, voice, 1, bust);
            }
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
                toSelect.clone() // make a copy of the selected book
                    .addClass('preview')
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
                $page.find('.preview')
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
        var selected = $('.active-page .selected:first');
        var link;
        if (selected.length > 0) {
            if (selected.is('a'))
                link = selected;
            else
                link = selected.find('a');
            //console.log('clicking', link);
            link.click();
        }
    });

    // configure the keyboard controls
    function setFindKeyMap(page) {
        keys.setMap(page, {
            'left down enter c': '/find/select',
            'right space m': '/find/next',
            'up': '/find/prev'
        });
    }
    setFindKeyMap('.active-page.find-page');
    setFindKeyMap('.active-page.favorites-page');

    function findConfigure(url, query) {
        // set the colors based on the state
        // setup the show search button for small screens
        var $page = $(this);
        var $form = $page.find('.searchForm');
        //console.log('findConfigure', $page);
        $form.submit(function(){ $('input:focus').blur(); });
        $page.find('a.searchShowButton').click(function(e){
            //console.log('click');
            e.preventDefault();
            //$form.slideDown('fast');
            $form.show();
            $(this).hide();
            return false;
        });
        $page.attr('data-key', url);
        // signal if book is in favorites
        $page.find('li.selectable')
            .removeClass('favoriteYes favoriteNo')
            .each(function(i, li) {
                var $li = $(li),
                    id = $li.attr('data-id');
                if (state.isFavorite(id)) {
                    $li.addClass('favoriteYes');
                } else {
                    $li.addClass('favoriteNo');
                }
            });

        return {title: 'Find - Tar Heel Reader', colors: true};
    }
    $(document).on('click', '.chooseFavorites img.favoriteNo, .chooseFavorites img.favoriteYes', function(ev) {
        //console.log('favorite click', ev);
        var $li = $(ev.target).parent('li'),
            id = $li.attr('data-id');
        if ($li.hasClass('favoriteNo')) {
            $li.removeClass('favoriteNo').addClass('favoriteYes');
            state.addFavorite(id);
        } else if ($li.hasClass('favoriteYes')) {
            $li.removeClass('favoriteYes').addClass('favoriteNo');
            state.removeFavorite(id);
        }
    });
    $(document).on('click',
        '.find-page .thr-favorites-icon, .favorites-page .thr-favorites-icon',
        function(ev) {
            //console.log('click favorites icon');
            if (ios.cancelNav(ev)) {
                // avoid ios double click bug
                return false;
            }
            $('.active-page').toggleClass('chooseFavorites');
            ev.preventDefault();
    });
    $(document).on('click', '.favorites-page.chooseFavorites .thr-favorites-icon', function(ev) {
        window.location.href = '/favorites/'; // force a refresh after changing favorites on favorites page
    });
    $(document).on('click', '.reviewer li', function(ev) {
        if (!ev.shiftKey) return true;
        ev.preventDefault();
        var $li = $(this),
            id = $li.attr('data-id');
        window.location.href = '/write/?id=' + id;
        return false;
    });

    route.add('render', /^\/find\/(\?.*)?$/, findRender);
    route.add('init', /^\/find\/(\?.*)?$/, findConfigure);
    route.add('init', /^\/favorites\/(\?.*)?$/, findConfigure);

    // I don't really need to define anything but I need it to be called before main runs.
    return {};
});
