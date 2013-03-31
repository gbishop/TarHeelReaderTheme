
define([  "route",
          "page",
          "state",
          "templates",
          "ios",
          "history.adapter.jquery"
         ], function(route, page, state, templates, ios) {

    var History = window.History,
        document = window.document,
        rootUrl = null;

    if (!History.enabled) {
        console.log('History not enabled');
        state.set('classic', '1');  // switch them to classic mode so they have some hope of working
        return false;
    }

    // load a link or submit a form via Ajax so we don't leave the page
    function hijaxLink(event) {
        var $this = $(this),
            url,
            context = {}; // passed to the render function as this

        if ($this.is('a')) {
            // click on a link
            if ($this.attr('data-role') === 'back') {
                //console.log('going back');
                History.back();
                event.preventDefault();
                return false;
            }
            url = $this.attr('href');
            // allows me to mark URLs for local handling
            context.data_type = $this.attr('data-type');
            if (typeof(url) == 'undefined') {
                e.preventDefault();
                return true;
            }

        } else if ($this.is('form')) {
            // submiting a form
            var method = $this.attr('method') || 'get';
            if (method.toLowerCase() !== 'post') {
                // method is get
                var action = $this.attr('action');
                if (!action) {
                    action = '';
                }
                action = action.replace(/\?.*/, ''); // remove any query parameters as the browser apparently would
                url = action + '?' + $this.serialize();

            } else {
                //console.log('not hijaxing post');
                return true;
            }
        }

        // Disable shift click so I can use it for editing.
        if (event.shiftKey && $this.parents('ul').hasClass('reviewer')) {
            event.preventDefault();
            return true;
        }
       // Continue as normal for ctrl clicks or external links
        if (event.which === 2 || event.metaKey || event.ctrlKey ||
            ( url.substring(0,rootUrl.length) !== rootUrl && url.indexOf(':') !== -1 ) ||
            url.indexOf('#') !== -1 ) {
            //console.log('not hijaxing', url);
            return true;
        }

        // rewrite plain favorites links so they will be bookmarkable
        if (url == '/favorites/') {
            url = state.favoritesURL();
        }

        // hijax this link, pass in the context so it can be handed on
        History.pushState(context,'',url); // don't know the title here, fill it in later

        event.preventDefault();
        return false;
    }

    function gotoUrl(url, title, context) {
        History.pushState(context, title, url);
    }

    function stateChange() {
        // handle changes in the URL
        var hist = History.getState(),
            url = hist.url,
            bar = window.location.href,
            context = hist.data;

        ios.setLastUrl(url);

        //console.log("State changed...", url, context);
        if (url != bar && bar.indexOf('#') > -1) {
            //console.log('bar = ', bar);
            // I think we only get here in IE8
            // hack for hash mode urls
            var hashIndex = bar.indexOf('#');
            if (rootUrl != bar.slice(0, hashIndex)) {
                // try to fix the url
                url = rootUrl + bar.slice(hashIndex);
                //console.log('new url =', url);
                window.location.href = url;
            }
        }
        renderUrl(url, context).then(function(title) {
            document.title = title;
            _gaq.push(['_trackPageview', url.replace(rootUrl, '/')]);
        });
    }

    function renderUrl(url, context) {
        //console.log('renderUrl', url);
        var $pageReady = $.Deferred();

        // update my app internal state from the cookie and any query parameters
        state.update(url);

        // make sure we've got the right templates for the locale
        templates.setLocale().then(function() {

            // if there is a local handler for this url call it
            var $render = route.go('render', url, context);

            if ($render === false) { // no local handler was found, fetch the page from the server
                $render = $.Deferred();

                // request the page
                $.ajax({
                    url: url,
                    data: { ajax: 1 }, // signal this is a ajax request right in the URL
                    success: function(data, textStatus, jqXHR) {
                        //console.log('controller ajax gets data');
                        var $newPage = $(data),
                            cls = $newPage.attr('class'),
                            type = (cls && cls.match(/[-a-z]+-page/)[0]) || 'server-page',
                            $oldPage = page.getInactive(type);
                        $oldPage.replaceWith($newPage);
                        state.update(''); // pick up any cookie updates from the host
                        $render.resolve($newPage);
                    },

                    error: function(jqXHR, textStatus, errorThrown) {
                        console.log('ajax request failed for: ', url);
                        document.location.href = url;
                        $render.reject();
                    }
                }); // end ajax
            }
            // now the deferred with be resolved when the page has been rendered either locally or from the server
            $render.then(function($newPage, options) {
                //console.log('newPage', $newPage);
                // transition to the new page
                $newPage.trigger('PageRendered');
                page.transitionTo($newPage, options).then(function($newPage, title) {
                    $(window).off('beforeunload'); // be sure the beforeunload handler gets disabled
                    route.go('init', url, $newPage);
                    $(window).scrollTop(0);
                    $newPage.trigger('PageVisible');
                    $pageReady.resolve(title);
                });
            });
        });
        return $pageReady;
    } // end renderUrl

    // wait for the document
    $(function() {
        var $body = $(document.body);
        rootUrl = History.getRootUrl();

        $body.on('click', 'button.urlRetry', function(e) {
            //console.log('retry after error');
            e.preventDefault();
            stateChange();
            return false;
        });

        // hookup links
        $body.on('click', 'a:not(.no-ajaxy)', hijaxLink);

        // and forms
        $body.on('submit', 'form:not(.no-ajaxy)', hijaxLink);

        // hook into state changes
        $(window).on('statechange', stateChange);

    }); // end on dom ready

    return {
        stateChange: stateChange,
        gotoUrl: gotoUrl
    };
});
