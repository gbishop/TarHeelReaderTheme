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
            var $tip = $this.next('.help-text').dialog({
                    position: {
                        my: "right top",
                        at: "left bottom",
                        of: $this
                    },
                    width: "15em"
                });
        });
    });
    return {};
});
