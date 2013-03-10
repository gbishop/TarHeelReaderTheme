<?php
/* Revert books with lines that are too long */

require_once('../../../../wp-load.php');

ini_set('memory_limit','512M');

function RevertTooLong($count, $start, $limit) {
    global $wpdb, $post;
    $wpdb->show_errors();

    $revertCount = 0;
    $bookCount = 0;
    while(1) {
        if ($limit > 0 && $start > $limit) {
            echo "limiting\n";
            break;
        }

        $t0 = microtime(1);

        $query = new WP_Query(array(
            'cat'=>3,
            'post_type' => 'post',
            'post_status' => 'publish',
            'posts_per_page' => $count,
            'paged' => $start,
            'order' => 'ASC',
            'orderby' => 'ID'));
        if ($query->post_count == 0) {
            echo "done\n";
            break;
        }
        // process each book
        while($query->have_posts()) {
            $bookCount += 1;
            $query->the_post();
            $book = ParseBookPost($post);
            $id = $post->ID;
            if (!$book) {
                echo "book is $book $id\n";
                continue;
            }
            $tooLong = false;
            foreach($book['pages'] as $page) {
                if (strlen($page['text']) > 130) {
                    $tooLong = true;
                }
            }
            if ($tooLong) {
                $slug = $book['slug'];
                echo "revert $id $slug\n";
                $args = array();
                $args['ID'] = $id;
                $args['post_status'] = 'draft';
                wp_update_post($args);
                $revertCount += 1;
            }
        }
        $tper = (microtime(1) - $t0) / $count;
        echo "$start $tper\n";
        $start = $start + 1;
    }
    echo "reverted $revertCount of $bookCount\n";
}

if (count($argv) > 1) {
    $start = intval($argv[1]);
    $limit = intval($argv[2]);
} else {
    $start = 1;
    $limit = -1;
}
RevertTooLong(100, $start, $limit);
//RevertTooLong(2, 1, 2);

?>

