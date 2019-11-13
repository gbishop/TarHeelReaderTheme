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
    $cid = (int)getParam('cid', '', '/\d+|-1/');
    $slug = getParam('slug', '', '/[^\/]+/');
    if ($slug) {
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
    if ($cid != '') {
        $q = "select * from wpreader_shared where ID = $ID and cid = $cid";
    } else {
        $q = "select * from wpreader_shared where ID = $ID and status = 'published'";
    }
    // $log->logError($q);
    if ($cid == -1) {
        $rows = [];
    } else {
        $rows = $wpdb->get_results($q);
    }
    $comments = [];
    $owners = [];
    $cids = [];
    foreach($rows as $row) {
        $owner = get_user_by('ID', $row->owner)->user_login;
        $cids[] = array('owner'=> $owner, 'cid'=> (int)$row->CID);
        foreach(json_decode($row->comments) as $comment) {
            $comment[0] = $comment[0];
            $comments[] = $comment;
            $owners[] = $owner;
        }
    }
    if (count($comments) == 0) {
        $comments[] = array_fill(0, count($book['pages']), '');
    }
    $book['pages'][0] = $book['pages'][1];
    $book['pages'][0]['text'] = $book['title'];
    $result = array(
        'comments' => $comments,
        'owners' => $owners,
        'cids' => $cids,
        'slug' => $book['slug'],
        'ID' => $ID,
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
    $cid = -1;
    $owner = $current_user->user_login;
    $n = count($data['cids']);
    if ($n > 1) {
        header("HTTP/1.0 400 Invalid parameter");
        die();
    } else if ($n == 1) {
        $cid = $data['cids'][0]['cid'];
        $owner = $data['cids'][0]['owner'];
    }
    $bookID = $post->ID;
    // $log->logError($bookID);
    $status = $data['status'];
    // validate user
    if (!is_user_logged_in() || !current_user_can('publish_posts')) {
        header("HTTP/1.0 401 Not Authorized");
        die();
    }

    $ownerID = get_user_by('login', $owner)->ID;
    // $log->logError('ownerid ' . $ownerID);
    if ($ownerID == $current_user->ID || current_user_can('administrator')) {
        // gather this owner's comments
        // $log->logError('getting comments');
        $user_comments = [];
        foreach ($data['comments'] as $comments) {
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
        if (count($user_comments) == 0) {
            /* delete it */
            if ($cid >= 0) {
                $sql = "delete from wpreader_shared where CID = $cid";
                $wpdb->query($sql);
                $action = 'deleted';
            } else {
                $action = 'ignored';
            }
        } else {
            $json = json_encode($user_comments);
            if ($cid == -1) {
                $sql = "insert into wpreader_shared (ID, owner, comments, status)
                    values (%d, %d, %s, %s)";
                $sql = $wpdb->prepare($sql, $bookID, $ownerID,
                    $json,
                    $status);
                $wpdb->query($sql);
                $cid = $wpdb->insert_id;
                $action = 'inserted';
            } else {
                $sql = "update wpreader_shared
                    set comments = %s, status = %s
                    where CID = %d";
                $sql = $wpdb->prepare($sql, $json, $status, $cid);
                $wpdb->query($sql);
                $action = 'updated';
            }
        }
    }
    $result = array('action'=> $action, 'slug'=>$slug, 'cid'=>$cid);
    $output = json_encode($result);
    header('Content-Type: application/json');
    header('Content-Size: ' . strlen($output));
    echo $output;
    die();
}
?>
