<!-- footer.php -->
    </div>

    <?php wp_footer(); ?>

    <?php if (!THR('classic')) : ?>
        <![if gt IE 7]>
        <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
        <script src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.min.js"></script>
        <script data-main="/theme/js/main" src="/theme/js/require.js"></script>
        <![endif]>
    <?php else : ?>
        <script>
            logEvent('classicmode', 'on', 'now');
        </script>
    <?php endif ?>
    <script type="text/javascript">
        console.log('here');
        var logStart = +new Date();
        function logMessage(msg) {
            return;
            var dt = (new Date() - logStart) + ' ';
            console.log(msg);
            var $msg = $('.message');
            if ($msg.length === 0) {
                $('body').append('<div class="message"></div>');
                $msg = $('.message');
                $msg.css({position:'absolute', top:'4em', left:0, width:'200px', height:'200px',zIndex: 1000, background: 'white'});
            }
            $msg.append(dt + msg + '<br/>');
            //$.ajax('/log-message/', { type: 'post', data: {message: dt + msg}, global: false, async: false });
        }
        logMessage('start logging');
    </script>
</body>
</html>
