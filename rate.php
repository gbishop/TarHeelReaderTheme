<?php
/*
Template Name: RateAjax

GET: update the book rating, return nothing
*/

if($_SERVER['REQUEST_METHOD'] == 'GET') {
    // get the parameters
    $id = getParam('id', 0, '/\d+/');
    $rating = getParam('rating', '', '/[123]/');
    if ($id && $rating) {
        $rating = intval($rating, 10);
        update_book_rating($id, $rating);
        die();
    }
}
header("HTTP/1.0 400 Bad Parameter");
die();
