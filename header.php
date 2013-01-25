<!DOCTYPE html>

<!--[if lt IE 7 ]> <html class="ie ie6 no-js" <?php language_attributes(); ?>> <![endif]-->
<!--[if IE 7 ]>    <html class="ie ie7 no-js" <?php language_attributes(); ?>> <![endif]-->
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

	<?php if (is_search()) { ?>
	<meta name="robots" content="noindex, nofollow" />
	<?php } ?>

	<title><?php thr_title(); ?></title>

	<meta name="google-site-verification" content="">
	<!-- Speaking of Google, don't forget to set your site up: http://google.com/webmasters -->

	<link rel="shortcut icon" href="/theme/images/favicon.ico">
	<!-- This is the traditional favicon.
		 - size: 16x16 or 32x32
		 - transparency is OK
		 - see wikipedia for info on browser support: http://mky.be/favicon/ -->

	<link rel="apple-touch-icon" href="/theme/images/apple-touch-icon.png">
	<!-- The is the icon for iOS's Web Clip.
		 - size: 57x57 for older iPhones, 72x72 for iPads, 114x114 for iPhone4's retina display (IMHO, just go ahead and use the biggest one)
		 - To prevent iOS from applying its styles to the icon name it thusly: apple-touch-icon-precomposed.png
		 - Transparency is not recommended (iOS will put a black BG behind the icon) -->

	<!-- CSS: screen, mobile & print are all in the same file -->
	<link rel="stylesheet" href="/theme/style.css">
	<?php
		$view = array(
			'pageColor'=>THR('pageColor'),
			'textColor'=>THR('textColor')
		);
		echo template_render('styleColor', $view);
	?>
	<link rel="stylesheet" href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/themes/base/jquery-ui.css">
	<!-- For console bug in IE-->
	<script>
		if (!window.console) window.console = {};
        if (!window.console.log) window.console.log = function () { };
	</script>

	<!-- I'm not sure I need modernizr but include it for now. -->
	<script src="/theme/js/modernizr.custom.js"></script>
	<!-- <script src="https://getfirebug.com/firebug-lite.js#startOpened"></script> -->

	<?php wp_head(); ?>

</head>
