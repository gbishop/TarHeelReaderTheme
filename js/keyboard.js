/*
    Convert keyboard input into events used by other modules for switch selection
*/
define(["pubsub"], function() {

    var keyIsDown = {};
    var keyMaps = {};
    var keyName = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',
        65: 'a',
        67: 'c',
        68: 'd',
        77: 'm',
        78: 'n',
        80: 'p',
        82: 'r',
        49: '1',
        50: '2',
        51: '3',
        32: 'space',
        13: 'enter'
    };

    function onKeyDown(e) {
        var selector = e.data,
            selected = $(selector);
        if (!selector || selected.length === 0) {
            return true;
        }
        if (e.target && e.target.nodeName == 'INPUT' && $.contains(selected.get(0), e.target)) {
            // don't handle events from input fields on the current page
            return true;
        }

        // defeat key repeat
        var code = e.keyCode || e.which;
        if (keyIsDown[code]) {
            return false;
        }
        keyIsDown[code] = true;

        var keyMap = keyMaps[selector];

        var name = keyName[code];
        if (name && name in keyMap) {
            e.preventDefault();
            $.publish(keyMap[name], [ name, code ] );
            //return false;
        }
        return true;
    }
    function onKeyUp(e) {
        var code = e.keyCode || e.which;
        keyIsDown[code] = false;
        return true;
    }
    $(document).on('keyup', onKeyUp);

    // add swipe as an event
    var touchStart = null;

    function onTouchStart(e) {
        var selector = e.data;
        if (!selector || $(selector).length === 0) return true;

        var touch = e.originalEvent.changedTouches[0];
        touchStart = { t: e.timeStamp, x: touch.clientX, y: touch.clientY };
    }

    function onTouchMove(e) {
        if (!touchStart) return;

        var selector = e.data;
        if (!selector || $(selector).length === 0) return true;

        e.preventDefault();
    }

    function onTouchEnd(e) {
        if (!touchStart) return;

        var selector = e.data;
        if (!selector || $(selector).length === 0) return true;

        var keyMap = keyMaps[selector];
        var touch = e.originalEvent.changedTouches[0],
            dt = e.timeStamp - touchStart.t,
            dx = touch.clientX - touchStart.x,
            dy = touch.clientY - touchStart.y;
        if (dt < 2000 && Math.abs(dx) > 50 && Math.abs(dy) < Math.abs(dx)) {
            $.publish(keyMap['swipe'], [dx, dy]);
        }
        touchStart = null;
    }

    function setKeyMap(selector, map) {
        //console.log('setKeyMap', selector, map);
        keyMap = {};
        for (var key in map) {
            var keys = key.split(' ');
            for(var i=0; i<keys.length; i++) {
                keyMap[keys[i]] = map[key];
            }
        }
        keyMaps[selector] = keyMap;
        $(document).on('keydown', null, selector, onKeyDown);
        if ('swipe' in keyMap && 'ontouchend' in document) {
            $(document).on('touchstart', null, selector, onTouchStart);
            $(document).on('touchend', null, selector, onTouchEnd);
            $(document).on('touchmove', null, selector, onTouchMove);
        }
    }

    return {
        setMap: setKeyMap
    };
});
