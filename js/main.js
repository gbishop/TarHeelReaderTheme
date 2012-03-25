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
          "busy"
          ],
    function($, route, state) {
        $(function() {
            var url = window.location.href;
            // run any configure hooks
            route.go('init', url, $('.active-page'));
        });
    });
