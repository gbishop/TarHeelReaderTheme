<?php
/*
Template Name: LoginForm

Display the login form
*/
?>
<?php if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $user = wp_signon();
    if ( is_wp_error($user) ) {
        if ( is_ajax() ) {
            echo 'No';
            exit;
        } else {
            $msg = 'Login failed';
        }
    } else {
        if ( is_ajax() ) {
            echo 'OK';
            exit;
        } else {
            wp_redirect('/');
            exit;
        }
    }
}
?>
<?php thr_header(false, '', true); ?>
<h1>Login to Tar Heel Reader</h1>
<p><?php echo $msg ?></p>
<form class="loginForm" action="/login/" method="post">
    <p>
        <label>Username<br />
        <input type="text" name="log" class="input" value="" size="20" tabindex="10" /></label>
    </p>
    <p>
        <label>Password<br />

        <input type="password" name="pwd" class="input" value="" size="20" tabindex="20" /></label>
    </p>
    <p class="forgetmenot"><label><input name="rememberme" type="checkbox" value="forever" tabindex="90" /> Remember Me</label></p>
    <p class="submit">
        <input type="submit" name="wp-submit" class="button-primary" value="Log In" tabindex="100" />
        <input type="hidden" name="redirect_to" value="/" />
        <input type="hidden" name="testcookie" value="1" />
    </p>
</form>
<?php thr_footer(true, true); ?>
