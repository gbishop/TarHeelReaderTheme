<?php

/* handle requests for commands. */

session_start();
$file = '/var/tmp/command.js';
if (!file_exists($file)) {
    touch($file);
}

if (isset($_SESSION['lasttime']) && $_SESSION['lasttime'] == filemtime($file)) {
    $resp = 'no';
} else {
    $resp = file_get_contents($file);
    $_SESSION['lasttime'] = filemtime($file);
} 
echo $resp;
?>
