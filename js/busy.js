define(['jquery', 'templates'], function($, templates) {

    var $blocker = null;

    var currentXHR = null;

    function cancel() {
        if (currentXHR) {
            currentXHR.abort();
            currentXHR = null;
        }
        $blocker.stop(true);
        $blocker.hide();
    }

    function wait(jqXHR, settings) {
        console.log('wait');
        if (currentXHR) {
            console.log('busy: unexpected overlapping request, canceling');
            currentXHR.abort();
        }
        currentXHR = jqXHR;
        $('#busyMessage').css('top', $(window).scrollTop() + $(window).height() / 3 + 'px');
        $blocker.delay(500).fadeIn(1000);
    }

    function done(jqXHR, textStatus) {
        console.log('done');
        if (currentXHR !== jqXHR) {
            console.log('busy: not expecting this XHR to complete, ignoring');
        } else {
            $blocker.stop(true);
            $blocker.hide();
            currentXHR = null;
        }
    }

    $.ajaxSetup({
        beforeSend: wait,
        complete: done
    });

    $(function() {
        $blocker = $(templates.render('busy')).appendTo('body');
        $blocker.find('button').on('click', cancel);
    });

    return {
        cancel: cancel,
        wait: wait,
        done: done
    };
});
