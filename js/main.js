requirejs.config({
    paths: {
        'jquery': 'https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min'
    }
});

require([ "jquery",
          "route",
          "state",
          "controller",
          "find",
          "read"/*,
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
