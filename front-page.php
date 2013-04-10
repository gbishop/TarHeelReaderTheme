<?php
// check for a restart from an iOS device
global $log;

if (!is_ajax() && array_key_exists('thr', $_COOKIE)) {
    $json = $_COOKIE['thr'];
    $json = stripslashes($json); // magic quotes?
    $value = json_decode($json, true);
    if (array_key_exists('lastURL', $value)) {
    	thr_setcookie(1);
        $home = home_url();
        $url = $value['lastURL'];
        $log->info("home=$home");
        $log->info("url=$url");
        if (strpos($url, $home) === 0) {
            $url = substr($url, strlen($home));
            $log->info("relative=$url");
            if ($url != '/') {
                $log->info('ios restart redirect');
                header('Location: ' . $url);
                die();
            }
        }
    }
}
thr_header('home-page'); ?> <!-- front-page.php -->

<?php
	$content = '';
	if (have_posts()) {
		while (have_posts()) {
			the_post();
			$content .= get_the_content();
		}
	}
	query_posts("cat=9&posts_per_page=4");
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
					'wellicon' => '<img src="/theme/images/well.png" class="tinyicon" title="old well icon" alt=" "/>',
					'gearicon' => '<img src="/theme/images/settings.png" class="tinyicon" title="gear icon" alt=" "/>',
					'Flickr' => '<a href="http://flickr.com">Flickr</a>',
					'locales' => $Templates['locales'],
					'content' => $content,
					'announcements' => $announcements
				);
				echo template_render('frontPage', $view);
				?>
			</div>
		</div>

	</article>

<?php thr_footer(); ?>
