<?php
/*
Template Name: Write

Allow users to write books
*/
?>
<?php thr_header('write-page', true); ?>
<?php

// get the id if any
$ID = getGet('id', '', '/[0-9]+/');
$view = array();
$view['ID'] = $ID;
$view['loggedIn'] = true;

echo template_render('write', $view);
?>
<?php thr_footer(false, true); ?>
