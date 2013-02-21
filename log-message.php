<?php
/*
Template Name: Log Message

log a message
*/
?>
<?php
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $msg = getParam('message', '', null, 'post');
    if ($msg) {
        $log->logDebug($msg);
    }
}
die();
