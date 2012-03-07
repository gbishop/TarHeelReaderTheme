<?php
/*
Template Name: ReadingControls

Allow users to configure reading
*/
?>
<?php thr_header(false, '', true); ?>
<?php

// get the id if any
$ID = getGet('id', '', '/[0-9]+/');
$settingsFormData = setFormFromState($Templates['readingForm']);
$settingsFormData['action'] = history(1);
$view = array();
$view['settingsForm'] = mustache('formTable', $settingsFormData);
$view['ID'] = $ID;
echo mustache('readingControls', $view);
?>
<?php thr_footer(false, true); ?>
