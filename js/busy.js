define(['templates'], function(templates) {

    var $blocker = null;

    var busyXHR = [];

    function cancel() {
        logEvent('ajax error', 'cancel', busyXHR.length + ' ');
        for(var i=0; i<busyXHR.length; i++) {
            busyXHR[i].abort();
        }
        busyXHR = [];
        $blocker.stop(true);
        $blocker.hide();
    }

    function wait(jqXHR, settings) {
        //console.log('ajax start', jqXHR);
        busyXHR.push(jqXHR);
        $blocker.addClass('isBusy').removeClass('isError')
            .css('top', $(window).scrollTop() + $(window).height() / 3 + 'px');
        $blocker.delay(500).fadeIn(1000);
    }

    function removeBusy(jqXHR) {
        for (var i=0; i<busyXHR.length; i++) {
            if (jqXHR === busyXHR[i]) {
                //console.log('delete busy', i);
                busyXHR.splice(i, 1);
                break;
            }
        }
    }

    function done(jqXHR, textStatus) {
        //console.log('ajax complete', textStatus);
        removeBusy(jqXHR);
        if (textStatus == 'success' && busyXHR.length === 0) {
            $blocker.stop(true);
            $blocker.hide();
        }
    }

    function error(jqXHR, textStatus, errorThrown) {
        //console.log('ajax error');
        logEvent('ajax error', textStatus, errorThrown);
        removeBusy(jqXHR);
        $('.errorMessage span').html(textStatus + ': ' + errorThrown);
        $blocker.removeClass('isBusy').addClass('isError');
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
