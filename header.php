<!DOCTYPE html>

<!--[if lt IE 7 ]> <html class="ie ie6 ie6-7 no-js unsupported" <?php language_attributes(); ?>> <![endif]-->
<!--[if IE 7 ]>    <html class="ie ie7 ie6-7 no-js unsupported" <?php language_attributes(); ?>> <![endif]-->
<!--[if IE 8 ]>    <html class="ie ie8 no-js" <?php language_attributes(); ?>> <![endif]-->
<!--[if IE 9 ]>    <html class="ie ie9 no-js" <?php language_attributes(); ?>> <![endif]-->
<!--[if gt IE 9]><!--><html class="no-js" <?php language_attributes(); ?>><!--<![endif]-->
<!-- the "no-js" class is for Modernizr. -->

<!-- Small hack for favorites-icon in IE8 and below -->
<!--[if lte IE 8]>
<style>
	.js .find-page .thr-favorites-icon, .js .favorites-page .thr-favorites-icon, .front-page.favoriteYes .thr-favorites-icon, .front-page.favoriteNo .thr-favorites-icon { background: none !important; }
</style>
<![endif]-->

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
	<![if gt IE 7]>
	<script src="/theme/js/modernizr.custom.js"></script>
	<![endif]>
	<!-- <script src="https://getfirebug.com/firebug-lite.js#startOpened"></script> -->
	<!-- <script src="http:/152.2.129.225:8080/target/target-script-min.js"></script> -->
	<?php wp_head(); ?>

</head>
