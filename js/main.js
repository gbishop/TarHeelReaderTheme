require([ "route",
          "state",
          "controller",
          "find",
          "read",
          "write",
          "busy",
          "navigation",
          "help",
          "yourbooks"
          ],
    function(route, state, controller) {
        $(function() {
            var url = window.location.href,
                $page = $('.active-page');
            if (url != window.History.getRootUrl) {
                // ie refresh hack
                url = url.replace('#', '');
                controller.stateChange();
            } else {
                // run any configure hooks
                $page.trigger('PageRendered');
                route.go('init', url, $page);
                $page.trigger('PageVisible');
            }
        });
    });
