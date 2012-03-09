/* book.js render a book page */

define(["jquery",
        "route",
        "page",
        "templates",
        "keyboard",
        "state",
        "speech"
        ], function($, route, page, templates, keys, state, speech) {

    var book = null; // current book

    function fetchBook(slug) {
        var $def = $.Deferred();
        if (book && book.slug === slug) {
            $def.resolve(book);
        } else {
            $.ajax({
                url: '/book-as-json/',
                data: {
                    slug: slug
                },
                dataType: 'json'
            }).done(function(data) {
                book = data;
                $def.resolve(book);
            });
        }
        return $def;
    }

    function pageLink(link, page) {
        if (page === 1) {
            return link;
        } else {
            return link + page + '/';
        }
    }

    function renderBook(url, slug, pageNumber) {
        console.log('renderBook', url, slug, pageNumber);
        var $def = $.Deferred();
        fetchBook(slug).then(function(book) {

            var view = {};
            if (!pageNumber) {
                pageNumber = 1;
            } else {
                pageNumber = parseInt(pageNumber, 10);
            }
            view.frontPage = pageNumber === 1;
            view.title = book.title;
            view.textColor = state.get('textColor');
            view.pageColor = state.get('pageColor');
            view.ID = book.ID;
            var newContent;
            var N = book.pages.length;
            if (pageNumber <= N) {
                view.author = book.author;
                view.pageNumber = pageNumber;
                view.image = book.pages[Math.max(1, pageNumber-1)];
                view.caption = view.image.text;
                if (pageNumber === 1) {
                    view.backLink = state.find_url();
                    view.nextLink = pageLink(book.link, pageNumber+1);
                } else {
                    view.backLink = pageLink(book.link, pageNumber-1);
                    view.nextLink = pageLink(book.link, pageNumber+1);
                }
                templates.setImageSizes(view.image);
                newContent = templates.render('bookPage', view);
            } else {
                view.nextPage = pageNumber+1;
                view.link = book.link;
                view.findLink = state.find_url();
                view.rating = book.rating_value; // TODO: handle updating the rating
                view.what = pageNumber === N+1;
                view.rate = pageNumber === N+2;
                view.thanks = pageNumber >= N+3;
                newContent = templates.render('choicePage', view);
            }
            var $oldPage = page.getInactive('thr-book-page');
            $oldPage.empty().append('<div class="content-wrap">' + newContent + '</div>');
            $def.resolve($oldPage);
        });
        return $def;
    }

    function scalePicture ($page) {
        var $box = $page.find('.thr-pic-box');
        if ($box.length === 0) return;

        var $window = $(window),
            ww = $window.width(),
            wh = $window.height(),
            b = $box.width(),
            bt = $box.offset().top,
            available,
            $caption = $page.find('.thr-caption'),
            ct, ch, gap, $credit;

        if ($caption.length === 1) {
            ct = $caption.length > 0 ? $caption.offset().top : 0;
            ch = $caption.height();
            gap = ct - bt - b;
            available = Math.min(ww, wh - bt - ch - gap);
        } else {
            $credit = $page.find('.thr-credit');
            gap = $credit.offset().top - bt - b + $credit.outerHeight() + 4;
            available = Math.min(ww, wh - bt - gap);
        }
        $box.css({width: available + 'px', height: available + 'px'});
    }

    function configureBook(url, slug, pageNumber) {
        console.log('configureBook', url, slug, pageNumber);
        var $page = $(this);
        scalePicture($page);
        $page.find('.thr-pic').fadeIn(1000);
    }

    route.add('render', /^\/\d+\/\d+\/\d+\/([^\/]+)\/(?:(\d+)\/(\?rating=\d)?)?$/, renderBook);
    route.add('init', /^\/\d+\/\d+\/\d+\/([^\/]+)\/(?:(\d+)\/(\?rating=\d)?)?$/, configureBook);

    return {};
});
