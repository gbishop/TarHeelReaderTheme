<?php
/*
Template Name: YourBooks
*/
?>
<?php
if($_SERVER['REQUEST_METHOD'] == 'POST' && is_user_logged_in()) {
    $ids = getPost('del', array());
    foreach ($ids as $id) {
        $post = get_post($id);
        if($post && $post->post_author == $user_ID) {
            wp_delete_post($id);
        }
    }
}

$view = Array();
if(is_user_logged_in()) {
    $view['user'] = $user_ID;

    // list drafts
    $my_drafts = $wpdb->get_results("SELECT ID, post_title FROM $wpdb->posts
                                     WHERE post_status = 'draft' AND
                                           post_author = $user_ID");
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
    $my_published = query_posts("cat=$BookCat&author=$user_ID&orderby=title&posts_per_page=-1");
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
}

thr_header('your-books-page');
echo template_render('yourbooks', $view);
thr_footer(false, false);
?>
