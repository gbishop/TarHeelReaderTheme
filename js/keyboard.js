/*
    Convert keyboard input into events used by other modules for switch selection
*/
define(["jquery", "pubsub"], function($) {

    var keyDown = {};
    var keyMap = {};
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

    $(document).on('keydown', function(e) {
        if ($(document.activeElement).is("input:focus,textarea:focus")) {
            return true;
        }

        // defeat key repeat
        var code = e.keyCode || e.which;
        if (keyDown[code]) {
            return false;
        }
        keyDown[code] = true;

        var name = keyName[code];
        if (name && name in keyMap) {
            e.preventDefault();
            $.publish(keyMap[name], [ name, code ] );
            //return false;
        }
        return true;
    });
    $(document).on('keyup', function(e) {
        var code = e.keyCode || e.which;
        keyDown[code] = false;
        return true;
    });

    function setKeyMap(map) {
        keyMap = map;
    }

    function getKeyMap() {
        return keyMap;
    }
    return {
        setMap: setKeyMap,
        getMap: getKeyMap
    };
});
