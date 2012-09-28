
define([ "jquery",
          "route",
          "page",
          "state",
          "templates",
          "busy",
          "history.adapter.jquery",
         ], function($, route, page, state, templates, busy) {

    var History = window.History,
        document = window.document,
        rootUrl = null,
        alreadyRendered = false;

    if (!History.enabled) {
        console.log('History not enabled');
        return false;
    }

    // load a link or submit a form via Ajax so we don't leave the page
    function hijaxLink(event) {
        var $this = $(this),
            url;

        if ($this.is('a')) {
            // click on a link
            if ($this.attr('data-role') === 'back') {
                console.log('going back');
                History.back();
                event.preventDefault();
                return false;
            }
            url = $this.attr('href');
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
                console.log('not hijaxing post');
                return true;
            }
            
        }

       // Continue as normal for ctrl clicks or external links
        if (event.which === 2 || event.metaKey || event.ctrlKey ||
            ( url.substring(0,rootUrl.length) !== rootUrl && url.indexOf(':') !== -1 ) ||
            url.indexOf('#') !== -1 ) {
            console.log('not hijaxing', url);
            return true;
        }

        // hijax this link
        renderUrl(url).then(function(title) {
            alreadyRendered = true;
            busy.setPageLoaded(false); // Page has not fully loaded yet in any browser
            
            History.pushState(null,title,url); // Normal Behavior: trigger stateChange() inside pushState (fails to do this in IE)
           
            // IE still hasn't called stateChanged yet
            alreadyRendered = false;

        });
        
        event.preventDefault();
        return false;
    }

    function gotoUrl(url, title) {
        History.pushState(null, title, url);
        
    }

    function stateChange() {
        console.log("State changed... alreadyRendered is " +  alreadyRendered);
        console.log("busy.pageLoaded is " + busy.isPageLoaded());
        
        var url = History.getState().url;
        if (!alreadyRendered && !busy.isPageLoaded()) { // only render it if the page has not loaded yet
            renderUrl(url);
        } else  { 
            //   Normal Behavior: stateChange is called when alreadyRendered is true
            // this will allow busy.js to set pageLoaded to false, thus allowing 'Back' to work
            //   IE Behavior: if alreadyRendered is false, that means stateChanged was called sometime after renderUrl.then()
            // so set pageLoaded to false to allow back button to work
            alreadyRendered ? busy.setPageLoaded(true) : busy.setPageLoaded(false);
        }
        
    }

    function renderUrl(url) {
        console.log('renderUrl', url);
        var $pageReady = $.Deferred();

        // update my app internal state from the cookie and any query parameters
        state.update(url);

        // make sure we've got the right templates for the locale
        templates.setLocale().then(function() {

            // if there is a local handler for this url call it
            var $render = route.go('render', url);

            if ($render === false) { // no local handler was found, fetch the page from the server
                $render = $.Deferred();

                // request the page
                $.ajax({
                    url: url,
                    data: { ajax: 1 }, // signal this is a ajax request right in the URL
                    success: function(data, textStatus, jqXHR) {
                        console.log('controller ajax gets data');
                        var $newPage = $(data),
                            cls = $newPage.attr('class'),
                            type = (cls && cls.match(/[-a-z]+-page/)[0]) || 'server-page',
                            $oldPage = page.getInactive(type);
                        $oldPage.replaceWith($newPage);
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
                console.log('newPage', $newPage);
                // transition to the new page
                page.transitionTo($newPage, options).then(function($newPage, title) {
                    $(window).off('beforeunload'); // be sure the beforeunload handler gets disabled
                    route.go('init', url, $newPage);
                    $(window).scrollTop(0);
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
            console.log('retry after error');
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
