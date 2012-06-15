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
global $current_user;
get_currentuserinfo();
$view = array();
$view['ID'] = $ID;
$view['loggedIn'] = is_user_logged_in();
$view['categories'] = $Templates['categories'];
$view['languages'] = $Templates['languages'];
$view['user'] = $current_user->display_name;

echo template_render('write', $view);
?>
<?php thr_footer(false, true); ?>
