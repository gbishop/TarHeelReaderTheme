define(['jquery.ui.touch-punch'], function() {
    $(function() {
        $(document).on('click', '.help,.help-text', function(e) {
            // dialog doc claims it restores the source element but it does not do that for me, clone below
            var $openTips = $('.ui-dialog .help-text:visible');
            if ($openTips.length > 0) {
                $openTips.dialog('destroy');
                return;
            }
            var $this = $(this);
            window.foo = $this;
            var offset = $this.offset(),
                ww = $(window).width(),
                tw = Math.max(200, ww/3),
                $tip = $this.next('.help-text').clone().dialog({
                    position: [offset.left - tw - 20, offset.top - $(window).scrollTop()],
                    width: tw
                });
                //console.log('help', $tip);
        });
    });
    return {};
});
