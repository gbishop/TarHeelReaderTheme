/* ios.js hacks to support ios devices, especially voiceover */

define(["state"], function(state) {
    // detect iOS to implement hacks
    // mobile safari is the ie6 of our day
    var iOS = navigator && navigator.platform &&
              navigator.platform.match(/^(iPad|iPod|iPhone)$/);

    var nop = function(){}; // doing nothing is the default unless we detect we are iOS

    var res = {
        setLastUrl: nop,
        focusVoiceOverOnText: nop,
        focusMenu: nop,
        cancelNav: nop
    };

    if (iOS) {
        res.setLastUrl = function(url) {
            state.set('lastURL', url);
        };

        var cleanupHiddenLinks = false;
        res.focusVoiceOverOnText = function($page) {
            $page.find('.VOHide').attr('aria-hidden', 'true');
            cleanupHiddenLinks = true;

            setTimeout(function(){
                $('.active-page .VOSay:not(:focus)').focus();
            }, 500);
        };

        // cleanup any links we hid above
        $(document).on('focus', '.thr-book-page.active-page .VOSay', function() {
            if (cleanupHiddenLinks) {
                $('.active-page .VOHide').attr('aria-hidden', 'false');
                cleanupHiddenLinks = false;
            }
        });

        res.focusMenu = function($page) {
            $page.find('.thr-well-icon').focus();
        };

        var lastName = null;
        var lastTime = +new Date();
        res.cancelNav = function(ev) {
            // On ios6 with voiceover enabled, I get multiple click events for the same click
            // The first is targeted at the anchor, the second at the image. So I'm looking at
            // the target and canceling when it is not the same and happens soon after
            var currentName = ev.target.nodeName,
                currentTime = +new Date(),
                dt = currentTime - lastTime,
                cancel = lastName && lastName != currentName && dt < 5000;
            if (!cancel) {
                lastName = currentName;
                lastTime = currentTime;
            }
            return cancel;
        };

    }

    return res;
});

