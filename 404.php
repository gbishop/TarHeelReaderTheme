<?php
    $s = getParam('s', '');
    if ($s) {
        header("Location: /find/?search=$s");
        die();
    }
?>
<?php
thr_header('navigation');
echo template_render('navigation', array('notfound'=>true));
thr_footer(false, true);
?>
