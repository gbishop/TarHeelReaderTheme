<?php
/*
Template Name: Write

Allow users to write books
*/
?>
<?php

// get the id if any
global $current_user;
get_currentuserinfo();

$view = array();
$view['loggedIn'] = is_user_logged_in();
$view['canReview'] = current_user_can('edit_others_posts');
$view['categories'] = $Templates['categories'];
$view['languages'] = $Templates['languages'];
$view['user'] = $current_user->display_name;

thr_header('write-page');
echo template_render('write', $view);
thr_footer();

?>
