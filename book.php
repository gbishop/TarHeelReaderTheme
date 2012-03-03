<?php
/*
Template Name: BookAsJson

GET: Return the json for a book
*/

if($_SERVER['REQUEST_METHOD'] == 'GET') {
    // get the parameters
    $id = getGet('id', 0, '/\d+/');
    if ($id) {
        $post = get_post($id);
        if (!$post) {
            header("HTTP/1.0 404 Not Found");
            die();
        }
    } else {
        $slug = getGet('slug', '', '/[^\/]+/');
        if ($slug) {
            query_posts("cat=3&name=$slug");
            if(have_posts()) {
                the_post();
            } else {
                header("HTTP/1.0 404 Not Found");
                die();
            }
        } else {
            header("HTTP/1.0 400 Bad Parameter");
            die();
        }
    }
    $book = ParseBookPost($post);
    $output = json_encode($book);
    header('Content-Type: application/json');
    header('Content-Size: ' . strlen($output));
    echo $output;
    die();
}
// TODO: Handle Post
?>
