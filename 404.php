<?php
    $s = getParam('s', '');
    if ($s) {
        header("Location: /find/?search=$s");
        die();
    }
?>
<?php
thr_header('navigation'); ?>
<script>logEvent('404', document.location.pathname + document.location.search, document.referrer);</script>
<?php
echo template_render('navigation', array('notfound'=>true));
thr_footer();
?>
