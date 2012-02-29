define([ "jquery.history" ], function () {

    var rootUrl = null;
    var routeMap = [];
    
    return {
        addRoute: function(re, renderHook, configureHook) {
            routeMap.push({
                re: re,
                render: renderHook,
                configure: configureHook
            });
        },
        doRoute: function(url, configureOnly) {
            if (!rootUrl) {
                rootUrl = window.History.getRootUrl();
                rootUrl = rootUrl.substring(0, rootUrl.length-1);
            }
            if (url.substring(0,rootUrl.length) === rootUrl) {
                url = url.substring(rootUrl.length);
            }
            for (var i=0; i<routeMap.length; i++) {
                var map = routeMap[i];
                var m = map.re.exec(url);
                if (m) {
                    try {
                        if (configureOnly || !map.render) {
                            if (map.configure) {
                                map.configure.apply(null, m);
                            }
                        } else if (map.render && map.render.apply(null, m)) {
                            if (map.configure) {
                                map.configure.apply(null, m);
                            }
                            return true;
                        }
                    }
                    catch(e) {
                        console.log('error', e);
                        return true;
                    }
                }
            }
            return false;
        }
    };
});