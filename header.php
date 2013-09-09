<!DOCTYPE html>
<?php
    $classic = "";
    if (THR('classic')) {
        $classic = " classic";
    }
?>
<!--[if lt IE 7 ]> <html class="ie ie6 ie6-7 no-js unsupported" <?php language_attributes(); ?>> <![endif]-->
<!--[if IE 7 ]>    <html class="ie ie7 ie6-7 no-js unsupported" <?php language_attributes(); ?>> <![endif]-->
<!--[if IE 8 ]>    <html class="ie ie8 no-js<?php echo $classic;?>" <?php language_attributes(); ?>> <![endif]-->
<!--[if IE 9 ]>    <html class="ie ie9 no-js<?php echo $classic;?>" <?php language_attributes(); ?>> <![endif]-->
<!--[if gt IE 9]><!--><html class="no-js<?php echo $classic;?>" <?php language_attributes(); ?>><!--<![endif]-->
<!-- the "no-js" class is for Modernizr. -->

<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=4">
    <title><?php thr_title(); ?></title>
    <link rel="shortcut icon" href="/theme/images/favicon.ico">
    <link rel="apple-touch-icon" href="/theme/images/apple-touch-icon.png">
    <link rel="stylesheet" href="/theme/style.css">
    <?php
        $view = array(
            'pageColor'=>THR('pageColor'),
            'textColor'=>THR('textColor')
        );
        echo template_render('styleColor', $view);
    ?>
    <link rel="stylesheet" href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/themes/base/jquery-ui.css">
    <script>
        if (!window.console) window.console = {};
        if (!window.console.log) window.console.log = function () { };
    </script>
    <?php if (!THR('classic')) : ?>
        <![if gt IE 7]>
        <script src="/theme/js/modernizr.custom.js"></script>
        <script src="/theme/js/json2.min.js"></script>
        <![endif]>
    <?php endif ?>
    <?php wp_head(); ?>

    <script>
        // Google Analytics
        var _gaq = _gaq || [];
        _gaq.push(['_setAccount', 'UA-6128682-1']);

        <?php if ($_SERVER['HTTP_X_PURPOSE'] != 'preview' &&
                  $_SERVER['HTTP_X_MOZ'] != 'prefetch' &&
                  $_SERVER['HTTP_X_PURPOSE'] != 'instant') : ?>
        _gaq.push(['_trackPageview']);
        <?php endif; ?>

        (function() {
          var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
          ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
          var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
        })();

        var __E__ = [];
        function _E_(n) {
            __E__.push(n);
        }
        <?php if (THR('debug') == 1): ?>
            function logMessage(msg) {
                console.log(msg);
                $.post('/log-message/', {message: msg});
            }
            window.onerror = function(message, url, line) {
                logEvent('onerror', message, url+" ("+line+")");
                return true;
            };
            function logEvent(category, label, arg) {
                logMessage(category + '|' + label + '|' + arg);
            }
        <?php else: ?>
            function logMessage(msg) {
            }
            window.onerror = function(message, url, line) {
                if (typeof(_gaq) === "object" && url.match(/theme|jquery/)) {
                    logEvent('onerror', message,
                        url+" ("+line+':'+__E__.slice(-20).join()+")");
                }
                return true;
            };
            function logEvent(category, label, arg) {
                _gaq.push(["_trackEvent", category, label, arg, 0, true]);
            }
        <?php endif; ?>

    </script>
</head>
