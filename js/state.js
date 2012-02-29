define([ "jquery", "route", "json!../state.json", "jquery.cookie", "json2" ], function($, route, defaultState) {
    var state;

    function find_url(page) {
        var q = {};
        var ps = ["search", "category", "reviewed", "audience", "language"];
        for(var i=0; i<ps.length; i++) {
            var p = ps[i];
            q[p] = state[p];
        }
        if (!page) {
            page = state['page'];
        }
        q['page'] = page;
        var qs = $.param(q);
        var url = '/find/';
        if (qs) {
            url += '?' + qs;
        }
        return url;
    }

    function parseQuery(qstring) {
        var result = {},
            e,
            r = /([^&=]+)=?([^&]*)/g,
            d = function (s) { return decodeURIComponent(s.replace(/\+/g, " ")); },
            q = qstring.substring(1);
        e = r.exec(q);
        while (e) {
            result[d(e[1])] = d(e[2]);
            e = r.exec(q);
        }
        return result;
    }

    function stateUpdate(url, qstring) {

        // get the old value
        var cookie = $.cookie('thr');
        var cookieValue = $.parseJSON(cookie);
        state = cookieValue || $.extend({}, defaultState);

        // update from the query string
        if (qstring) {
            qvals = parseQuery(qstring);
            for(var k in state) {
                if (k in qvals) {
                    state[k] = qvals[k];
                }
            }
        }
        state['page'] = parseInt(state['page'], 10); // page is an int

        // update the cookie
        $.cookie('thr', JSON.stringify(state), {path: '/'});
    }

    route.addRoute(/^[^?]*(\?.*)?$/, null, stateUpdate);

    return {
        get: function(key) { return state[key]; },
        find_url: find_url
    };
});