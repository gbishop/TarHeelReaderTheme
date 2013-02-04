<?php thr_header(''); ?> <!-- page.php -->

<?php if (have_posts()) : while (have_posts()) : the_post(); ?>

	<article>

		<div class="post" >

			<h2><?php the_title(); ?></h2>

			<div class="entry">

				<?php the_content(); ?>

			</div>

			<?php edit_post_link('Edit this entry.', '<p>', '</p>'); ?>

		</div>

	</article>

	<?php endwhile; endif; ?>

<?php thr_footer(); ?>
