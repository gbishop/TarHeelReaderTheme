define([ "history",
         "history.html4",
         "history.adapter.jquery"
         ], function () {

    var rootUrl = null;
    var routeMaps = {};

    function addRoute(map, re, action) {
        if (!(map in routeMaps)) {
            routeMaps[map] = [];
        }
        routeMaps[map].push({ re: re, action: action });
    }

    function doRoute(map, url, context) {
        if (!(map in routeMaps)) return false;

        if (!rootUrl) {
            rootUrl = window.History.getRootUrl();
            rootUrl = rootUrl.substring(0, rootUrl.length-1);
        }
        if (url.substring(0,rootUrl.length) === rootUrl) {
            url = url.substring(rootUrl.length);
        }
        var candidates = routeMaps[map];
        for(var i = 0; i < candidates.length; i++) {
            var match = candidates[i].re.exec(url);
            if (match) {
                var r = candidates[i].action.apply(context, match);
                // allow the action to reject the call by returning false
                if (r !== false) {
                    return r;
                }
            }
        }
        return false;
    }

    return {
        add: addRoute,
        go: doRoute
    };
});
