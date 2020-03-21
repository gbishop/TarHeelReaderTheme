<!DOCTYPE html>
<?php
$manifest = 'manifest="/theme/manifest.appcache"';
$manifest = '';
$classic = "";
if (THR('classic')) {
    $classic = " classic";
}
?>
<!--[if lt IE 7 ]> <html class="ie ie6 ie6-7 no-js unsupported" <?php language_attributes(); ?>> <![endif]-->
<!--[if IE 7 ]>    <html class="ie ie7 ie6-7 no-js unsupported" <?php language_attributes(); ?>> <![endif]-->
<!--[if IE 8 ]>    <html class="ie ie8 no-js<?php echo $classic; ?>" <?php language_attributes(); ?>> <![endif]-->
<!--[if IE 9 ]>    <html class="ie ie9 no-js<?php echo $classic; ?>" <?php language_attributes(); ?>> <![endif]-->
<!--[if gt IE 9]><!--><html <?php echo $manifest; ?> class="no-js<?php echo $classic; ?>" <?php language_attributes(); ?>><!--<![endif]-->
<!-- the "no-js" class is for Modernizr. -->

<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=4">
    <title>Tar Heel Shared Reader</title>
    <link rel="shortcut icon" href="/theme/images/favicon.ico">
    <link rel="apple-touch-icon" href="/theme/images/apple-touch-icon.png">
    <link rel="stylesheet" href="/theme/style.css">
    <?php
    $view = array(
        'pageColor' => THR('pageColor'),
        'textColor' => THR('textColor')
    );
    echo template_render('styleColor', $view);

    if (THR('debug')) {
        echo '    <script src="http://152.2.129.207:8008/target/target-script-min.js#anonymous"></script>';
    }
    ?>
    <link rel="stylesheet" href="//ajax.googleapis.com/ajax/libs/jqueryui/1.11.2/themes/smoothness/jquery-ui.min.css">
    <?php if (!THR('classic')): ?>
        <![if gt IE 7]>
        <script src="/theme/js/modernizr.custom.js"></script>
        <script src="/theme/js/json2.min.js"></script>
        <script src="//code.jquery.com/jquery-1.11.2.min.js"></script>
        <script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.11.2/jquery-ui.min.js"></script>
        <script>
            var require = { waitSeconds: 200 };
            if (!window.console) window.console = {};
            if (!window.console.log) window.console.log = function () { };
        </script>
        <script data-main="/theme/js/main" src="/theme/js/require.min.js"></script>
        <![endif]>
    <?php endif; ?>
    <?php wp_head(); ?>

    <!-- Global site tag (gtag.js) - Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=UA-6128682-1"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'UA-6128682-1');
    </script>

    <script>
        function logMessage(msg) {
            console.log('logMessage', msg);
        }
        function logEvent(category, action, label, value) {
            gtag('event', action, {
              'event_category': category,
              'event_label': label,
              'value': value
            });
            console.log('logEvent', category, action, label, value);
        }
    </script>
</head>
