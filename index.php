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
