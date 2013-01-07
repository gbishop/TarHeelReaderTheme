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
    function(route, state) {
        $(function() {
            var url = window.location.href,
                $page = $('.active-page');
            // run any configure hooks
            $page.trigger('PageRendered');
            route.go('init', url, $page);
            $page.trigger('PageVisible');
        });
    });
