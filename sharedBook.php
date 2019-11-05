<?php

global $log;
global $wpdb;

/*
Template Name: SharedBook

GET: Return the json for a shared book
*/
$current_user = wp_get_current_user();

if($_SERVER['REQUEST_METHOD'] == 'GET') {
    // get the parameters
    $id = getParam('id', 0, '/\d+/');
    $slug = getParam('slug', '', '/[^\/]+/');
    if ($id) {
        $post = get_post($id);
    } else if ($slug) {
        $post = get_page_by_path($slug, '', 'post');
    } else {
        header("HTTP/1.0 400 Bad Parameter");
        die();
    }
    $book = ParseBookPost($post);
    if (!$book) {
        header("HTTP/1.0 404 Not Found");
        die();
    }

    $ID = $book['ID'];
    $toEdit = getParam('edit', '0', '/^[01]$/');
    if ($toEdit == '1') {
        $userID = $current_user->ID;
        $q = "select * from wpreader_shared where ID = $ID and owner = $userID";
    } else {
        $q = "select * from wpreader_shared where ID = $ID and status = 'published'";
    }
    // $log->logError($q);
    $rows = $wpdb->get_results($q);
    $comments = [];
    $owners = [];
    foreach($rows as $row) {
        $owner = get_user_by('ID', $row->owner)->user_login;
        foreach(json_decode($row->comments) as $comment) {
            $comment[0] = $comment[0];
            $comments[] = $comment;
            $owners[] = $owner;
        }
    }
    if (count($comments) == 0) {
        $comments[] = array_fill(0, count($book['pages']), '');
        $owners[] = $current_user->login;
    }
    $book['pages'][0] = $book['pages'][1];
    $book['pages'][0]['text'] = $book['title'];
    $result = array(
        'comments' => $comments,
        'owners' => $owners,
        'slug' => $book['slug'],
        'pages' => $book['pages'],
        'title' => $book['title'],
        'status' => 'published',
        'author' => $book['author'],
        'owner' => 'junk',
        "level" => 'level'
    );

    $output = json_encode($result);
    header('Content-Type: application/json');
    header('Content-Size: ' . strlen($output));
    echo $output;
    die();
} elseif($_SERVER['REQUEST_METHOD'] == 'POST') {
    // posting a new or updated book
    $json_str = file_get_contents('php://input');
    // $log->logError($json_str);
    $data = json_decode($json_str, true);
    $slug = $data['slug'];
    // $log->logError($slug);
    $post = get_page_by_path($slug, '', 'post');
    if (!$post) {
        header("HTTP/1.0 404 Not Found");
        die();
    }
    $bookID = $post->ID;
    // $log->logError($bookID);
    $status = $data['status'];
    // validate user
    if (!is_user_logged_in() || !current_user_can('publish_posts')) {
        header("HTTP/1.0 401 Not Authorized");
        die();
    }
    // get unique owners
    $owners = [];
    foreach($data['owners'] as $owner) {
        $owners[$owner] = 1;
    }
    $owners = array_keys($owners);
    // $log->logError(print_r($owners, true));

    // iterate over owners updating if necessary
    foreach($owners as $owner) {
        $ownerID = get_user_by('login', $owner)->ID;
        // $log->logError('ownerid ' . $ownerID);
        if ($ownerID == $current_user->ID || current_user_can('administrator')) {
            // gather this owner's comments
            // $log->logError('getting comments');
            $user_comments = [];
            foreach ($data['comments'] as $i=>$comments) {
                if ($data['owners'][$i] == $owner) {
                    $empty = true;
                    foreach($comments as $comment) {
                        if ($comment != '') {
                            $empty = false;
                        }
                    }
                    if (!$empty) {
                        $user_comments[] = $comments;
                    }
                }
            }
            $sql = "insert into wpreader_shared (ID, owner, comments, status)
                values (%d, %d, %s, %s) on duplicate key
                update comments = %s, status = %s";
            $json = json_encode($user_comments);
            $sql = $wpdb->prepare($sql, $bookID, $ownerID,
                $json,
                $status,
                $json,
                $status);
            // $log->logError($sql);
            $wpdb->query($sql);
        }
    }
    echo "ok";
    die();
}
?>
