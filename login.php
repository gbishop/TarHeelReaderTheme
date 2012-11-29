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
<?php thr_header(''); ?>
<!-- login.php -->
<?php
if ( ! is_user_logged_in() ): ?>
<h2>Login to Tar Heel Reader</h2>
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
<?php
    wp_register('<br/>', '<br/>');
else:
    wp_loginout( home_url() ); // display log out link
    wp_register('<br/>', '<br/>');
endif;

thr_footer(true, true); ?>