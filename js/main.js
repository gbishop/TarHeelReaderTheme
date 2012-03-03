require([ "jquery", "route", "controller", "state", "find", "read", "remoteCommand"], function($, route) {
    // run any configure hooks
    route.go('init', window.location.href, $('.active-page'));
});