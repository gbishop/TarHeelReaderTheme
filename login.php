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
    if (is_ajax()) {
        $resp = array('r' => !is_wp_error($user));
        $output = json_encode($resp);
        header('Content-Type: application/json');
        header('Content-Size: ' . strlen($output));
        echo $output;
        die;
    }
    if ( is_wp_error($user) ) {
        $view['failed'] = 1;
    } else {
        $goto = getParam('redirect_to', '/', '/^\/([-a-z]+\/)?$/', 'post');
        wp_redirect($goto);
    }
}
$out = getParam('out', 0, '/1/');
if ($out) {
    wp_logout();
    wp_redirect('/');
    die;
}
if (is_ajax()) {
    if (is_user_logged_in()) {
        $current_user = wp_get_current_user();
        $resp = array('login' => $current_user->user_login,
            'role' => get_the_author_meta('sharedrole', $current_user->ID));
    } else {
        $resp = array('login' => '');
    }
    $output = json_encode($resp);
    header('Content-Type: application/json');
    header('Content-Size: ' . strlen($output));
    echo $output;
    die;
}

$view['logged_in'] = is_user_logged_in();
$view['admin'] = is_admin();
$view['logoutURL'] = '/login/?out=1';
$goto = getParam('goto', '/', '/^[-a-z]+$/');
if ($goto != '/') {
    $goto = '/' . $goto . '/';
}
$view['redirect'] = $goto;

thr_header('login-page'); ?>
<!-- login.php -->
<?php

echo template_render('login', $view);

thr_footer(); ?>
