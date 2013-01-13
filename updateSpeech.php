<?php
/* Create speech files for a book */

require_once('wp-load.php');

$id = $argv[1];
$start = intval($argv[2]);
$post = get_post($id);
$book = ParseBookPost($post);
updateSpeech($book, $start);

?>
