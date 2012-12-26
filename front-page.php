<?php
thr_header(''); ?> <!-- front-page.php -->

<?php
	$content = '';
	BuG('here');
	if (have_posts()) {
		while (have_posts()) {
			BuG('here2');
			the_post();
			$content .= get_the_content();
			BuG("content = '$content'");
		}
	}
	BuG('there');
	query_posts("cat=9&posts_per_page=2");
	$announcements = array();
	if (have_posts()) {
		while (have_posts()) {
			the_post();
			$ann = array(
				'title' => get_the_title(),
				'link' => get_permalink());
			$announcements[] = $ann;
		}
	}
?>

	<article>

		<div class="post" >

			<div class="entry">

				<?php
				// construct the view for the template
				$view = array(
					'wellicon' => '<img src="/theme/images/well.png" class="tinyicon" title="old well icon" />',
					'gearicon' => '<img src="/theme/images/settings.png" class="tinyicon" title="gear icon" />',
					'Flickr' => '<a href="http://flickr.com">Flickr</a>',
					'content' => $content,
					'announcements' => $announcements
				);
				echo template_render('frontPage', $view);
				?>
			</div>

			<?php edit_post_link('Edit this entry.', '<p>', '</p>'); ?>

		</div>

	</article>

<?php thr_footer(true, true); ?>
