require([ "jquery", "route", "controller", "state", "find", "remoteCommand"], function($, route) {
    // run any configure hooks
    route.doRoute(window.location.href, true);
});