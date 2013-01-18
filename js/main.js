require([
        "route",
        "state",
        "controller",
        "find",
        "read",
        "write",
        "busy",
        "navigation",
        "help",
        "yourbooks"
    ],
    function(route, state, controller, find, read) {
        $(function() {

            // Resize Hack
            $(window).on('resize orientationchange', function() {
                // the goal here is to avoid many calls during a resize
                if (this.resizeTO) {
                    clearTimeout(this.resizeTO);
                }
                this.resizeTO = setTimeout(function() {
                    $(this).trigger('resizeEnd');
                }, 20);
            });
            function resize(e) {
                var $window = $(window),
                    dpr = window.devicePixelRatio || 1,
                    ww = $window.width(),
                    wh = $window.height(),
                    breakpoint = 640 / dpr,
                    cw = ww <= breakpoint ? 36 : 48,  // breakpoint
                    fs = Math.min(ww/(cw+2), wh/36);
                console.log('resize ww=' + ww + ' wh=' + wh + ' fs=' + fs);
                console.log('inner ' + window.innerWidth);
                $('body').css('fontSize', fs + 'px')
                    .toggleClass('tiny', ww <= breakpoint);
                // I bet the following could be done with css
                read.scalePicture();
            }
            $(window).on('resizeEnd', resize);
            resize();
            $('body').css('visibility', 'visible');
            // End Resize Hack


            var url = window.location.href,
                $page = $('.active-page');
            // run any configure hooks
            $page.trigger('PageRendered');
            route.go('init', url, $page);
            $page.trigger('PageVisible');
        });
    });
