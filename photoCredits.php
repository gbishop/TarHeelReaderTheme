<?php
/*
Template Name: PhotoCredits

Link back to Flickr to give photographers credit
*/
?>
<?php thr_header(''); ?>
<!-- photoCredits.php -->
<?php
    if (have_posts()) : while (have_posts()) : the_post(); ?>

    <article>
        <div <?php post_class() ?> >

            <h2 class="entry-title"><?php the_title(); ?></h2>

            <div class="entry-content">

                <?php the_content(); ?>
<?php

// get the bookid
$ID = getParam('id', '', '/^\d+$/');
if ($ID) {
    $post = get_post($ID);
    $book = ParseBookPost($post);
    if ($book) {
        $view = array();
        $view['title'] = $book['title'];
        $view['ID'] = $ID;
        $photos = array_slice($book['pages'], 1);
        foreach ($photos as &$photo) {
            if (strpos($photo['url'], '/uploads/') === false) {
                $parts = explode('/', $photo['url']);
                $photoID = explode('_', $parts[count($parts)-1]);
                $photoID = $photoID[0];
                $photo['infolink'] = "http://flickr.com/photo.gne?id=$photoID";
            }
            setImageSizes($photo);
        }
        $view['photos'] = $photos;
        echo template_render('photoCredits', $view);
        $backto = get_permalink($ID);
        echo "<a href=\"$backto\">Back to your book</a>";
    }
}
?>
            </div>
        </div>
    </article>
<?php
    endwhile; endif; ?>
<?php thr_footer(); ?>
