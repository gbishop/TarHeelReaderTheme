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
          "write"/*,
          "remoteCommand"*/
          ],
    function($, route, state) {
        // run any configure hooks
        $(function() {
            // update my app internal state from the cookie and any query parameters
            var url = window.location.href;
            state.update(url);
            route.go('init', url, $('.active-page'));
        });
    });
