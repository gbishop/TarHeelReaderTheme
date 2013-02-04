define(['templates'], function(templates) {

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
        //console.log('ajax start');
        if (currentXHR) {
            console.log('busy: unexpected overlapping request, canceling');
            logEvent('error', 'ajax error', 'overlapped request canceled');
            cancel();
        }
        currentXHR = jqXHR;
        //$blocker.height($(document).height()).addClass('isBusy').removeClass('isError');
        //$('.busyMessage')
        $blocker.addClass('isBusy').removeClass('isError')
            .css('top', $(window).scrollTop() + $(window).height() / 3 + 'px');
        $blocker.delay(500).fadeIn(1000);
    }

    function done(jqXHR, textStatus) {
        //console.log('ajax complete', textStatus);
        if (currentXHR !== jqXHR) {
            console.log('busy: not expecting this XHR to complete, ignoring');
        } else if (textStatus == 'success') {
            $blocker.stop(true);
            $blocker.hide();
            currentXHR = null;
        }
    }

    function error(jqXHR, textStatus, errorThrown) {
        //console.log('ajax error');
        logEvent('error', 'ajax error', textStatus + ': ' + errorThrown);
        if (currentXHR !== jqXHR) {
            console.log('busy: not expecting error on this XHR, ignoring');
        } else {
            $('.errorMessage span').html(textStatus + ': ' + errorThrown);
            $blocker.removeClass('isBusy').addClass('isError');
        }
    }

    $.ajaxSetup({
        beforeSend: wait,
        complete: done,
        error: error
    });

    $(function() {
        $blocker = $(templates.render('busy')).appendTo('body').hide();
        $blocker.find('button.ajaxCancel').on('click', cancel);
    });

    return {
        cancel: cancel,
        wait: wait,
        done: done
    };
});
