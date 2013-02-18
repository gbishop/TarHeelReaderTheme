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
$backto = $ID ? get_permalink($ID) : '/find/';
$settingsFormData = setFormFromState($Templates['readingForm']);
$settingsFormData['action'] = parse_url($backto, PHP_URL_PATH);
$view = array();
$view['settingsForm'] = template_render('form', $settingsFormData);
$view['ID'] = $ID;
$view['voice'] = THR('voice');
$view['loggedIn'] = is_user_logged_in();
$view['canEdit'] = current_user_can('edit_post', $ID);
$view['backto'] = $backto;
echo template_render('readingControls', $view);
?>
<?php thr_footer(); ?>
