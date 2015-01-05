define([
    'state',
    'route',
    'page',
    'store',
    'templates',
    'busy'
    ], function(state, route, page, store, templates, busy) {

    function offlineList() {
        return store.listBooks().then(function(books) {
            return templates.render('offlineList', { books: books });
        }, function(err) {
            console.log('offlineList', err);
        });
    }

    function updateOfflineList($page) {
        return offlineList().then(function(result) {
            $page.find('#offlineBooks').html(result);
        });
    }

    function offlineRender() {
        var $def = $.Deferred(),
            view = {};

        offlineList().then(function(list) {
            view = { list: list };
        }).fail(function(error) {
            console.log('open failed');
            view = { openFailed: true, list: [] }
        }).always(function() {
            var $newPage = page.getInactive('offline-page');
            $newPage.empty()
                .append(templates.render('heading',
                    {settings:false, chooseFavorites:false}))
                .append('<div class="content-wrap">' +
                        templates.render('offline', view) +
                        '</div>');
            $def.resolve($newPage, {title: 'Tar Heel Reader | Offline', colors: false});
        });
        return $def;
    }

    function offlineConfigure() {
        var $page = $(this),
            favs = state.favoritesArray();

        $page.find('button#addFavorites')
            .prop('disabled', favs.length === 0)
            .on('click', function(e) {
                busy.wait();
                $page.find('li#noOfflineBooks').remove();
                logEvent('offline', 'addFavorites', 'count', favs.length);
                return store.addBooksToOffline(favs, function(id, added) {
                    if (added) {
                        store.bookTitle(id).then(function(book) {
                            var li = templates.render('offlineList', { books: [ book ]});
                            $page.find('#offlineBooks').append(li);
                        });
                    }
                }).then(function() {
                    busy.done();
                });
            });

        $page.find('button#goOffline')
            .on('click', function(e) {
                logEvent('offline', 'go offline', 'count', $('#offlineBooks li').length);
                state.set('offline', '1');
                $('html').addClass('offline');
            });

        $page.find('button#goOnline')
            .on('click', function(e) {
                logEvent('offline', 'go online');
                state.set('offline', '0');
                $('html').removeClass('offline');
            });

        $page.find('button#clearOffline')
            .on('click', function(e) {
                busy.wait();
                store.reset().then(function() {
                    return updateOfflineList($page).then(function() {
                        busy.done();
                    });
                });
            });

        $page.find('button#clearSelected')
            .on('click', function(e) {
                var ids = $page.find('input:checked')
                    .map(function() { return +$(this).val()}).toArray();
                busy.wait();
                store.removeBooksFromOffline(ids, function(id) {
                    $page.find('#offlineBooks input')
                        .filter(function() { return this.value == id})
                        .parent()
                        .parent()
                        .remove();
                }).then(function() {
                    busy.done();
                });
            });
    }

    $(function() {
        if (state.offline()) {
            $('html').addClass('offline');
        }
    });

    route.add('render', /^\/offline\/(\?.*)?$/, offlineRender);
    route.add('init', /^\/offline\/(\?.*)?$/, offlineConfigure);
});

