requirejs.config({
    paths: {
        'jquery': 'https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min'
    }
});

require([ "jquery",
          "route",
          "controller",
          "state",
          "find",
          "read"/*,
          "remoteCommand"*/
          ],
    function($, route) {
        // run any configure hooks
        $(function() {
            route.go('init', window.location.href, $('.active-page'));
        });
    });
