<?php
/*
Template Name: BookAsJson

GET: Return the json for a book
*/

if($_SERVER['REQUEST_METHOD'] == 'GET') {
    // get the parameters
    $id = getParam('id', 0, '/\d+/');
    if ($id) {
        $post = get_post($id);
        if (!$post) {
            header("HTTP/1.0 404 Not Found");
            die();
        }
    } else {
        $slug = getParam('slug', '', '/[^\/]+/');
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
    if (!$book) {
        header("HTTP/1.0 404 Not Found");
        die();
    }

    $output = json_encode($book);
    header('Content-Type: application/json');
    header('Content-Size: ' . strlen($output));
    echo $output;
    die();
} elseif($_SERVER['REQUEST_METHOD'] == 'POST') {
    // posting a new or updated book
    $id = getParam('id', 0, '/\d+/', 'post');
    $publish = getParam('publish', 'false', '/false|true/', 'post');
    $content = json_decode(getParam('book', '', null, 'post'), true);
    // validate user
    if (!is_user_logged_in() || !current_user_can('publish_posts') || ($id && !current_user_can('edit_post', $id))) {
        header("HTTP/1.0 401 Not Authorized");
        die();
    }
    $current_user = wp_get_current_user();
    if ($id) {
        $post = get_post($id);
        $book = ParseBookPost($post);
        if (!$book) {
            header("HTTP/1.0 404 Not Found");
            die();
        }
    } else {
        $book = array();
    }
    $canPublish = $publish === 'true';
    $book['title'] = trim($content['title']);
    $canPublish = $canPublish && strlen($book['title']) > 0;
    $book['author'] = trim($content['author']);
    $canPublish = $canPublish && strlen($book['author']) > 0;
    // validate type
    if (!in_array($content['type'], array('T', 'C', 'O', ' '))) {
        header("HTTP/1.0 400 Bad Type");
        die();
    }
    $book['type'] = $content['type'];
    // validate audience
    if (!in_array($content['audience'], array('E', 'C', ' '))) {
        header("HTTP/1.0 400 Bad Audience");
        die();
    }
    $book['audience'] = $content['audience'];
    // validate reviewed
    $book['reviewed'] = current_user_can('edit_others_posts') && $content['reviewed'];

    // validate language
    if (!in_array($content['language'], $LangNameToLangCode) && $content['language'] != ' ') {
        header("HTTP/1.0 400 Bad Language");
        die();
    }
    $book['language'] = $content['language'];
    $canPublish = $canPublish && $book['language'] != ' ';
    // validate categories
    foreach($content['categories'] as $category) {
        if (!in_array($category, $CategoryAbbrv)) {
            header("HTTP/1.0 400 Bad Category");
            die();
        }
    }
    $book['categories'] = $content['categories'];
    if ($content['tags']) {
        $book['tags'] = $content['tags']; // TODO: Validate this
    }
    // validate pages
    $pageNo = 1;
    $pages = array();
    foreach($content['pages'] as $page) {
        if ($pageNo == 1 && $page['text'] != $book['title']) {
            header("HTTP/1.0 400 Bad Page");
            die();
        }
        $p = make_page(trim($page['text']), $page['url']);
        if ($p === false) {
            header("HTTP/1.0 500 Cache failure");
            die();
        }
        $canPublish = $canPublish && strlen($p['text']) > 0;
        $pages[] = $p;
        $pageNo += 1;
    }
    $book['pages'] = $pages;
    $canPublish = $canPublish && count($pages) > 3;

    $book['status'] = $publish && $canPublish ? 'publish' : 'draft';
    $book = SaveBookPost($id, $book);
    if ($book === false) {
        header("HTTP/1.0 400 Save Post Failed");
        die();
    }
    $id = $book['ID'];

    $output = json_encode($book);
    header('Content-Type: application/json');
    header('Content-Size: ' . mb_strlen($output));
    echo $output;
    if ($book['status'] == 'publish') {
        updateSpeech($book, 1, 2);  // generate audio for first two pages
        // then asynchronously generate speech for other pages
        $cmd = "/usr/bin/php " . ABSPATH . "theme/updateSpeech.php $id 3 > /tmp/updateSpeech.out &";
        exec($cmd);
    }
    die();
}
?>
