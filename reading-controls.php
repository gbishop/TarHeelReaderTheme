<?php
/*
Template Name: ReadingControls

Allow users to configure reading
*/
?>
<?php thr_header('', true); ?>
<?php

// get the id if any
$ID = getGet('id', '', '/[0-9]+/');
$settingsFormData = setFormFromState($Templates['readingForm']);
$settingsFormData['action'] = history(1);
$view = array();
$view['settingsForm'] = template_render('form', $settingsFormData);
$view['ID'] = $ID;
echo template_render('readingControls', $view);
?>
<?php thr_footer(false, true); ?>
