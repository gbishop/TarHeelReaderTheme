<!-- footer.php -->
    </div>

    <?php wp_footer(); ?>

    <?php if (!THR('classic')) : ?>
        <![if gt IE 7]>
        <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
        <script src="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.min.js"></script>
        <script>var require = { waitSeconds: 200 };</script>
        <script data-main="/theme/js/main" src="/theme/js/require.js"></script>
        <![endif]>
    <?php else : ?>
        <script>
            logEvent('classicmode', 'on', 'now');
        </script>
    <?php endif ?>
</body>
</html>
