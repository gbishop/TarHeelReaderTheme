<?php
if (in_category('books')):
    include('single-book.php');
else:
    thr_header('');
    if (have_posts()) : while (have_posts()) : the_post(); ?>

    <article>
        <div <?php post_class() ?> >

            <h1 class="entry-title"><?php the_title(); ?></h1>

            <div class="entry-content">

                <?php the_content(); ?>

                <?php wp_link_pages(array('before' => 'Pages: ', 'next_or_number' => 'number')); ?>

                <?php the_tags( 'Tags: ', ', ', ''); ?>

                <?php include (TEMPLATEPATH . '/meta.php' ); ?>

            </div>

            <?php edit_post_link('Edit this entry','','.'); ?>
            <div class="navigation">
                <div class="next-posts"><?php next_post_link('%link', 'Next post', TRUE) ?></div>
                <div class="prev-posts"><?php previous_post_link('%link', 'Previous post', TRUE) ?></div>
            </div>

        </div>
    </article>

    <?php endwhile; endif; ?>

<?php thr_footer(); ?>
<?php endif; ?>
