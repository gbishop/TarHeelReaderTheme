<?php thr_header(''); ?> <!-- search.php -->
	<?php if (have_posts()) : ?>

		<h2>Search Results</h2>
		<?php foreach($THRstuff as $stuff) { echo '<pre>', $stuff, '</pre>'; } ?>

		<?php include (TEMPLATEPATH . '/nav.php' ); ?>

		<?php while (have_posts()) : the_post(); ?>

			<article <?php post_class() ?> >

				<h2><?php the_title(); ?></h2>

				<?php include (TEMPLATEPATH . '/meta.php' ); ?>

				<div class="entry">

					<?php the_excerpt(); ?>

				</div>

			</article>

		<?php endwhile; ?>

		<?php include (TEMPLATEPATH . '/nav.php' ); ?>

	<?php else : ?>

		<h2>No posts found.</h2>

	<?php endif; ?>

<?php get_sidebar(); ?>

<?php get_footer(); ?>
