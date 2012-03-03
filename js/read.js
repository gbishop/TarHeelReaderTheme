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
            var newPage;
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
                newPage = templates.render('bookPage', view);
            } else {
                if (pageNumber === N+1) {
                    view.question = "What would you like to do now?";
                    view.choices = [
                        { text: 'Read this book again.',
                          href: book.link },
                        { text: 'Rate this book.',
                          href: pageLink(book.link, pageNumber+1) },
                        { text: 'Read another book.',
                          href: state.find_url() }
                    ];
                } else if (pageNumber === N+2) {
                    view.question = "How do you rate this book?";
                    var link = pageLink(book.link, pageNumber+1) + '?rating=';
                    view.choices = [
                        { text: '1 star',
                          image: { url: '1stars.png', cls: 'thr-stars', alt: '1 star'},
                          href: link+1 },
                        { text: '2 stars',
                          image: { url: '2stars.png', cls: 'thr-stars', alt: '2 stars'},
                          href: link+2 },
                        { text: '3 stars',
                          image: { url: '3stars.png', cls: 'thr-stars', alt: '3 stars'},
                          href: link+3 }
                    ];
                } else if (pageNumber === N+3) {
                    view.thanks = 'Thank you for your opinion.';
                    view.rating = book.rating_value;
                    view.averageText = 'Average rating';
                    view.question = 'What would you like to do now?';
                    view.choices = [
                        { text: 'Read this book again.',
                          href: book.link },
                        { text: 'Read another book.',
                          href: state.find_url() }
                    ];
                } else {
                    view.question = 'How did we get here?';
                }
                newPage = templates.render('choicePage', view);
            }
            var $oldPage = page.getInactive('thr-book-page');
            $oldPage.empty().html(newPage);
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