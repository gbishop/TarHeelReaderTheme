<?php
/*
Template Name: Drafts
*/
?>
<?php

function returnJson($result) {
    if (!is_array($result)) {
        $result = array('result' => $result);
    }
    $output = json_encode($result);
    header('Content-Type: application/json');
    header('Content-Size: ' . strlen($output));
    echo $output;
    die();
}

$userid = getParam('tarheel_user_id', '');
$token = getParam('token', '');

/* validate the token here */

if($userid && $token == MONARCH_TOKEN) {
    // list drafts
    $BookCat = get_cat_id('Books');
    $my_drafts = query_posts("cat=$BookCat&author=$userid&orderby=title&posts_per_page=-1&post_status=draft");
    $drafts = Array();
    foreach ($my_drafts as $post) {
        $drafts[] = ParseBookPost($post);
    }
    returnJson($drafts);
} else {
  header("HTTP/1.0 404 Not Found");
}
die();
