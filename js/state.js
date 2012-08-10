define([ "jquery", "route", "json!../state.json", "jquery.cookie", "json2" ], function($, route, defaultState) {
    var state;

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

    function stateUpdate(url) {

        // get the old value
        var cookie = $.cookie('thr');
        var cookieValue = $.parseJSON(cookie);
        state = cookieValue || $.extend({}, defaultState);

        // update from the query string
        var i = url.indexOf('?');
        if (i > 0) {
            qvals = parseQuery(url.substring(i));
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

    function set(key, value) {
        var old = state[key];
        if (old !== value) {
            state[key] = value;
            $.cookie('thr', JSON.stringify(state), {path: '/'});
        }
    }

    function dump(msg) {
        console.log('state dump', msg, state);
    }

    stateUpdate(window.location.href);

    return {
        get: function(key) { return state[key]; },
        set: set,
        update: stateUpdate,
        dump: dump
    };
});
