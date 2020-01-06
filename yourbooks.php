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
    thr_setcookie();
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
    $action = getParam('c_action', '', '/[-a-z]+/', 'post');
    $id = getParam('c_id', 'new', '/\d+/', 'post');
    if ($action == 'delete-draft' && $id != 'new') {
        $post = get_post($id);
        if($post && $post->post_author == $userid) {
            $r = wp_delete_post($id);
            returnJson($r !== false);
        } else {
            returnJson(0);
        }
    } elseif ($action == 'update-collection') {
        $title = getParam('c_title', '', null, 'post');
        $description = getParam('c_description', '', null, 'post');
        $result = false;
        if ($title) {
            $data = array(
                'title' => $title,
                'description' => $description);
            if ($id == 'new') {
                $favs = THR('favorites');
                $data['booklist'] = $favs;
                $slug = substr(sanitize_title_with_dashes($title), 0, 195);
                // make slug unique
                $alt_slug = $slug;
                $num = 1;
                while (true) {
                    $slug_check = $wpdb->get_var($wpdb->prepare( "SELECT slug FROM $collections_table WHERE slug = %s", $alt_slug ) );
                    if (! $slug_check) break;
                    $num = $num + 1;
                    $alt_slug = $slug . '-' . $num;
                } while($slug_check);
                $data['slug'] = $alt_slug;
                $data['owner'] = $userid;
                // get the language of all the books in the collection
                $lang = 'xx';
                $data['language'] = $lang;  // compute from the books included, used 'xx' if they aren't all the same
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
        if (count($row) == 0 || !is_admin() && $row->owner != $userid) {
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

thr_header('your-books-page');
$view = Array();
if($userid != 0) {
    $view['user'] = $userid;

    // list drafts
    $BookCat = get_cat_id('Books');
    $my_drafts = query_posts("cat=$BookCat&author=$userid&orderby=title&posts_per_page=-1&post_status=draft");
    $drafts = Array();
    foreach ($my_drafts as $post) {
        $author = trim(get_post_meta($id, 'author_pseudonym', true));
        if (!$author) {
            $author_id = $post->post_author;
            $authordata = get_userdata($author_id);
            $author = $authordata->display_name;
        }
        $author = preg_replace('/^[bB][yY]:?\s*/', '', $author);
        $drafts[] = Array(
            'title' => $post->post_title,
            'ID' => $post->ID,
            'link' => get_permalink($post->ID),
            'author' => $author
        );
    }
    $view['drafts'] = $drafts;
    $view['has_drafts'] = count($drafts) > 0;

    // list published
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

    $sql = "select c.CID, c.status, p.post_title, p.post_name
              from wpreader_shared c, wpreader_posts p
              where c.ID = p.ID and c.owner = $userid";
    $rows = $wpdb->get_results($sql);
    $mycoms = array();
    foreach ($rows as $row) {
        $mycoms[] = array(
            'slug' => $row->post_name,
            'CID' => $row->CID,
            'status' => $row->status,
            'title' => $row->post_title);
    }
    $view['comments'] = $mycoms;
    $view['has_comments'] = count($mycoms) > 0;
}

echo template_render('yourbooks', $view);
thr_footer();
?>
