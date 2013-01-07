define([ "route", "json!../state.json", "jquery.cookie", "json2" ], function(route, defaultState) {
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

        // TODO: special handling for favorites?

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
            fpage: 1
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
