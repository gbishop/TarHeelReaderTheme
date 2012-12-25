requirejs.config({
    paths: {
        'jquery': 'http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min',
        'jquery-ui': 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.min'
    }
});

require([ "jquery",
          "route",
          "state",
          "controller",
          "find",
          "read",
          "write",
          "busy",
          "navigation"
          ],
    function($, route, state) {
        $(function() {
            var url = window.location.href,
                $page = $('.active-page');
            // run any configure hooks
            $page.trigger('PageRendered');
            route.go('init', url, $page);
            $page.trigger('PageVisible');
        });
    });
