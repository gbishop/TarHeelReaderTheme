define([ "route", "json!../state.json", "jquery.cookie" ], function(route, rules) {
    var state = {};

    // set up the defaults
    for(var param in rules) {
        state[param] = rules[param]['default'];
    }

    function parseQuery(qstring) {
        var result = {},
            e,
            r = /([^&=]+)=?([^&#]*)/g,
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
        // console.log('url', url);

        // get the old value
        var cookieJson = $.cookie('thr');
        var cookie = $.parseJSON(cookieJson);
        // validate the incoming state from the cookie
        for(var param in cookie) {
            set(param, cookie[param]);
        }

        // update from the query string
        var i = url.indexOf('?');
        if (i > 0) {
            qvals = parseQuery(url.substring(i));
            if (! ('p' in qvals)) {
                for(var k in qvals) {
                    set(k, qvals[k]);
                }
            }
        }
    }

    function set(key, value) {
        if (key in rules) {
            var rule = rules[key],
                pattern = rule.pattern ? new RegExp(rule.pattern) : null,
                old = state[key];
            if (old !== value) {
                if (!pattern || pattern.test(value)) {
                    state[key] = value;
                    setCookie();
                } else {
                    logEvent('set error', key, value);
                }
            }
        }
    }

    function setCookie() {
        var args = {path: '/'};
        if (state.lastURL) {
            args.expires = 1;
        }
        $.cookie('thr', JSON.stringify(state), args);
    }

    function dump(msg) {
        console.log('state dump', msg, state);
    }

    function addFavorite(id) {
        var favList = state['favorites'].split(',');
        if ($.inArray(id, favList) === -1) {
            if (favList[0]) {
                favList.push(id);
            } else {
                favList[0] = id;
            }
            set('favorites', favList.join(','));
        }
        set('collection', ''); // clear collection if favorites changes
    }

    function removeFavorite(id) {
        var favList = state['favorites'].split(','),
            index = $.inArray(id, favList);
        if (index !== -1) {
            favList.splice(index, 1);
            set('favorites', favList.join(','));
        }
        set('collection', ''); // clear collection if favorites changes
    }

    function isFavorite(id) {
        return new RegExp('(^|,)' + id + '(,|$)').test(state['favorites']);
    }

    function favoritesArray() {
        var r = state['favorites'].match(/\d+/g);
        if (! r) {
            r = [];
        }
        return r;
    }

    function favoritesURL() {
        var p = {
            voice: state.voice,
            pageColor: state.pageColor,
            textColor: state.textColor,
            fpage: state.fpage
        };
        if (state.collection) {
            p.collection = state.collection;
        } else {
            p.favorites = state.favorites;
        }
        return '/favorites/?' + $.param(p);
    }

    stateUpdate(window.location.href);

    return {
        get: function(key) { return state[key]; },
        set: set,
        update: stateUpdate,
        dump: dump,
        addFavorite: addFavorite,
        removeFavorite: removeFavorite,
        isFavorite: isFavorite,
        favoritesArray: favoritesArray,
        favoritesURL: favoritesURL
    };
});
