<?php
/*
Template Name: ReadingControls

Allow users to configure reading
*/
?>
<?php thr_header(''); ?>
<!-- reading-controls.php -->
<?php

// get the id if any
$ID = getParam('id', '', '/^\d+$/');
$backto = getParam('backto', '/find/');
$settingsFormData = setFormFromState($Templates['readingForm']);
$settingsFormData['action'] = parse_url($backto, PHP_URL_PATH);
$view = array();
$view['settingsForm'] = template_render('form', $settingsFormData);
$view['ID'] = $ID;
$view['backto'] = $backto;
echo template_render('readingControls', $view);
?>
<?php thr_footer(); ?>
