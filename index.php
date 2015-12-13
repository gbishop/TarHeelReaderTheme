<?php
$json = array_key_exists('json', $_GET) && $_GET['json'] == 1;

if ($json) {
    $items = array();
    if (have_posts()) {
        while (have_posts() && count($items) < 5) {
            the_post();
            $item = array('title'=>get_the_title(),
                          'link'=>get_permalink());
            $items[] = $item;
        }
    $result = array('announcements'=>$items);
    $output = json_encode($result);
    header('Content-Type: application/json');
    header('Content-Size: ' . strlen($output));
    echo $output;
    die();
    }
}
?>
<?php thr_header(''); ?>
<!-- index.php -->

    <?php if (have_posts()) : while (have_posts()) : the_post(); ?>

        <article <?php post_class() ?> >

            <h2><a href="<?php the_permalink() ?>"><?php the_title(); ?></a></h2>

            <?php include (TEMPLATEPATH . '/meta.php' ); ?>

            <div class="entry">
                <?php the_content(); ?>
            </div>

            <footer class="postmetadata">
                <?php the_tags('Tags: ', ', ', '<br />'); ?>
                Posted in <?php the_category(', ') ?> |
            </footer>

        </article>

    <?php endwhile; ?>

    <div class="navigation">
        <div class="prev-posts"><?php next_posts_link('&laquo; Older Entries') ?></div>
        <div class="next-posts"><?php previous_posts_link('Newer Entries &raquo;') ?></div>
    </div>

    <?php else :
        echo template_render('navigation', array('notfound'=>true));
    endif; ?>

<?php thr_footer(); ?>
