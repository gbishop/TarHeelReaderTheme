<?php
/*
Template Name: LoginForm

Display the login form
*/
?>
<?php
$view = array();
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $user = wp_signon();
    if ( is_wp_error($user) ) {
        $view['failed'] = 1;
    } else {
        wp_redirect('/');
    }
}
$view['logged_in'] = is_user_logged_in();
$view['admin'] = is_admin();
$view['logoutURL'] = wp_logout_url("/");

thr_header('login-page'); ?>
<!-- login.php -->
<?php

echo template_render('login', $view);

thr_footer(true, true); ?>
