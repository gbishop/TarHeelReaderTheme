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
if (getParam('shared', 0, '/1/') == 1) {
    if (is_user_logged_in()) {
        $current_user = wp_get_current_user();
        $login = $current_user->user_login;
        $role = shared_role($current_user);
        $hash = hash('sha256', $login . $role . AUTH_KEY);
        $resp = array('login' => $login,
            'role' => $role,
            'hash' => $hash
        );
    } else {
        $resp = array('login' => '');
    }
    $output = json_encode($resp);
    header('Content-Type: application/json');
    header('Content-Size: ' . strlen($output));
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header("Access-Control-Allow-Credentials: true");
    echo $output;
    die;
}
if (getParam('shared', 0, '/2/') == 2) {
    $login = getParam('login', '', '/[a-zA-Z0-9 ]+/');
    $role = getParam('role', '', '/[a-z]+/');
    $hash = getParam('hash', '', '/[0-9a-f]+/');
    $check = hash('sha256', $login . $role . AUTH_KEY);
    $user = get_user_by('login', $login);
    $current_role = $user && shared_role($user);
    $resp = array('login' => $login,
        'role' => $role,
        'hash' => $hash,
        'ok' => $check == $hash && $role == $current_role
    );
    $output = json_encode($resp);
    header('Content-Type: application/json');
    header('Content-Size: ' . strlen($output));
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header("Access-Control-Allow-Credentials: true");
    echo $output;
    die;
}

$current_user = wp_get_current_user();
$view['username'] = $current_user->user_login;
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
