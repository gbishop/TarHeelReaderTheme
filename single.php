<?php
if (in_category('books')):
	include('single-book.php');
else:
	thr_header('', true);
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

		</div>
	</article>

	<?php endwhile; endif; ?>

<?php thr_footer(true, true); ?>
<?php endif; ?>
