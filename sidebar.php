<?php 
$view = array();
$view['loggedIn'] = is_user_logged_in();
$view['findUrl'] = get_find_url();
echo template_render('sidebar', $view);
?>