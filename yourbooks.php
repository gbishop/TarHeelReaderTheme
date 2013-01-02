<?php
/*
Template Name: YourBooks
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

/*
Service side operations

delete-draft id
new-collection title description uses favs
update-collection id title description
merge-collection id uses favs
set-collection id uses favs
*/

$userid = get_current_user_id();
$collections_table = $wpdb->prefix . 'book_collections';

if ($_SERVER['REQUEST_METHOD'] == 'POST' &&  $userid != 0) {
    $action = getParam('action', '', '/[-a-z]+/', 'post');
    $id = getParam('id', 'new', '/\d+/', 'post');
    if ($action == 'delete' && $id != 'new') {
        $post = get_post($id);
        if($post && $post->post_author == $userid) {
            $r = wp_delete_post($id);
            returnJson($r !== false);
        } else {
            returnJson(0);
        }
    } elseif ($action == 'update-collection') {
        $title = getParam('title', '', null, 'post');
        $description = getParam('description', '', null, 'post');
        $result = false;
        if ($title) {
            $data = array(
                'title' => $title,
                'description' => $description);
            if ($id == 'new') {
                $data['booklist'] = THR('favorites');
                $slug = substr(sanitize_title_with_dashes($title), 0, 195);
                // TODO: make it unique
                $data['slug'] = $slug;
                $data['owner'] = $userid;
                $data['language'] = 'en';  // compute from the books included, used 'xxx' if they aren't all the same
                $r = $wpdb->insert($collections_table, $data);
                if ($r == 1) {
                    $result = $wpdb->insert_id;
                }
            } else {
                $where = array('ID' => $id);
                if (!is_admin()) {
                    $where['owner'] = $userid;
                }
                $r = $wpdb->update($collections_table, $data, $where);
                if ($r == 1) {
                    $result = $id;
                }
            }
        }
        returnJson($result);

    } elseif ($action == 'set-collection' || $action == 'merge-collection' || $action == 'add-collection') {
        if ($id == 'new') {
            returnJson(false);
        }
        $row = $wpdb->get_row("SELECT * from $collections_table WHERE ID = $id");
        if (count($row) == 0 || !is_admin() && $row->owner != userid) {
            returnJson(false);
        }
        if ($action == 'merge-collection') {
            $favs = splitFavorites(THR('favorites'));
            $coll = splitFavorites($row->booklist);
            $coll = array_unique(array_merge($favs, $coll));
            $booklist = implode(',', $coll);
        } elseif ($action == 'add-collection') {
            $favs = splitFavorites(THR('favorites'));
            $coll = splitFavorites($row->booklist);
            $favs = array_unique(array_merge($favs, $coll));
            $favs = implode(',', $favs);
            setTHR('favorites', $favs);
            returnJson(1);
        } else {
            $booklist = THR('favorites');
        }
        $r = $wpdb->update($collections_table, array('booklist'=>$booklist), array('ID'=>$id));
        returnJson($r == 1);


    } elseif ($action == 'delete-collection') {
        $r = $wpdb->query("DELETE FROM $collections_table WHERE ID=$id AND owner=$userid");
        returnJson($r == 1);

    } else {
        returnJson(0);
    }
}

$view = Array();
if($userid != 0) {
    $view['user'] = $userid;

    // list drafts
    $my_drafts = $wpdb->get_results("SELECT ID, post_title FROM $wpdb->posts
                                     WHERE post_status = 'draft' AND
                                           post_author = $userid");
    $drafts_list = Array();
    foreach ($my_drafts as $post) {
        $drafts[] = Array(
            'title' => $post->post_title,
            'ID' => $post->ID
        );
    }
    $view['drafts'] = $drafts;
    $view['has_drafts'] = count($drafts) > 0;

    // list published
    $BookCat = get_cat_id('Books');
    $my_published = query_posts("cat=$BookCat&author=$userid&orderby=title&posts_per_page=-1");
    $published = Array();
    foreach ($my_published as $post) {
        $published[] = Array(
            'title' => $post->post_title,
            'ID' => $post->ID,
            'link' => get_permalink($post->ID)
        );
    }
    $view['published'] = $published;
    $view['has_published'] = count($published) > 0;

    // list collections
    $view['count'] = count(splitFavorites(THR('favorites')));

    $rows = $wpdb->get_results("SELECT ID, title, description, slug, owner, booklist FROM $collections_table WHERE owner = $userid");
    BuG("rows = " . print_r($rows, 1));

    $mycols = array();
    foreach ($rows as $row) {
        $mycols[] = array(
            'title' => $row->title,
            'ID' => $row->ID,
            'description' => $row->description,
            'count' => count(splitFavorites($row->booklist)),
            'slug' => $row->slug);
    }
    $view['collections'] = $mycols;
}

thr_header('your-books-page');
?>
<!-- yourbooks.php -->
<?php
echo template_render('yourbooks', $view);
thr_footer(false, false);
?>
