<?php
/*
Template Name: MigrateForm

Display the migration form
*/
?>
<?php
global $log;

$view = array();
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $log->logDebug("post");
    $user = wp_signon();
    $user_id = $user->ID;
    $goto = getParam('redirect_uri', '', '', 'post');
    $migrate_token = getParam('migrate_token', '', '', 'post');
    $log->logDebug("goto=$goto");
    $log->logDebug("migrate=$migrate_token");
    if (is_wp_error($user)) {
        $log->logDebug("failed");
        $view['failed'] = 1;
        $view['logged_in'] = false;
        $view['wplogin'] = wp_login_url();
        $view['migrate_token'] = $migrate_token;
        $view['redirect'] = $goto;

        thr_header('login-page');
        echo template_render('migrate', $view);
        thr_footer();
        die();
    } else {
        if ($goto && $migrate_token) {
          $log->logDebug("here");
            $key = base64_decode(MONARCH_KEY);
            $iv = base64_decode(MONARCH_IV);
            $exchange = openssl_encrypt($user_id, 'aes-256-cbc', $key, 0, $iv);
            $log->logDebug("redirecting exchange=$exchange");
            wp_redirect(add_query_arg(array(
              'migrate_token' => $migrate_token,
              'exchange' => $exchange,
            ), $goto));
            die();
        }
    }
}
$migrate_token = getParam('migrate_token', '');
$log->logDebug("migrate=$migrate_token");
if ($migrate_token) {
  $goto = getParam('redirect_uri', '');
  $log->logDebug("goto=$goto");
  if ($goto) {
    $view['logged_in'] = false;
    $view['wplogin'] = wp_login_url();
    $view['migrate_token'] = $migrate_token;
    $view['redirect'] = $goto;

    thr_header('login-page');
    echo template_render('migrate', $view);
    thr_footer();
    die();
  }
}
$log->logDebug('dying');
die();
