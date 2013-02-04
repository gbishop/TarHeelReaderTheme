<?php
    $s = getParam('s', '');
    if ($s) {
        header("Location: /find/?search=$s");
        die();
    }
?>
<?php
thr_header('navigation'); ?>
<script>logEvent('Error', '404', 'page: ' + document.location.pathname + document.location.search + ' ref: ' + document.referrer);</script>
<?php
echo template_render('navigation', array('notfound'=>true));
thr_footer();
?>
