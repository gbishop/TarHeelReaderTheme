<?php thr_header(true, 'thr-book-page', false); ?>

    <a class="thr-home-icon" href="/" title="Go home">
        <img src="/theme/images/home.png" width=32 height=32 alt="home"/>
    </a>
    <?php if (have_posts()): 
        while (have_posts()): 
            the_post();

            $book = ParseBookPost($post);
            $pages = $book['pages'];
            $Npages = count($pages);
            $link = get_permalink();
            $mp3 = null;
            if ($book['has_speech']) {
                $voice = THR('voice');
                if ($voice != 'silent') {
                    $v = $voice[0];
                    $id = $book['ID'];
                    $folder = substr($id, -2) . '/' . $id;
                    $language = $book['language'];
                    $mp3 = "/cache/speech/$folder/$language-$v-$page.mp3";
                    echo "<!-- $mp3 -->";
                }
            }
            ?>

                <?php if ($page == 1): ?>
                    <a href="/reading-controls/?id=<?php echo $ID ?>" class="thr-settings-icon" title="Settings"><img src="/theme/images/settings.png" width=32 height=32 alt="settings"/></a>
                    <h1><?php the_title(); ?></h1>
                    <p class="thr-author">by <?php echo $book['author']; ?></p>
                    <?php echo_img($pages[1], 'thr-pic', true); ?>
                    <a class="thr-credit" href="/photo-credits/?id=<?php echo $ID; ?>">Photo Credits</a>
                    <a class="thr-back-link" data-role="back" href="<?php find_url(); ?>"><img src="/theme/images/BackArrow.png" width="24" height="24" />Go back</a>
                    <a class="thr-next-link" href="<?php echo $link . ($page+1) . '/'; ?>"><img src="/theme/images/NextArrow.png" width="24" height="24" />Next page</a>
                    <?php if ($mp3) flashAudio($mp3) ?>
                <?php elseif ($page <= $Npages): ?>
                    <p class="thr-page-number"><?php echo $page; ?></p>
                    <?php echo_img($pages[$page-1], 'thr-pic', true); ?>
                    <a class="thr-credit" href="/photo-credits/?id=<?php echo $ID; ?>">Photo Credits</a>
                    <p class="thr-caption"><?php echo $pages[$page-1]['text']; ?></p>
                    <a class="thr-back-link" data-role="back" href="<?php echo $link . ($page-1) . '/'; ?>"><img src="/theme/images/BackArrow.png" width="24" height="24" />Go back</a>
                    <a class="thr-next-link" href="<?php echo $link . ($page+1) . '/'; ?>"><img src="/theme/images/NextArrow.png" width="24" height="24" />Next page</a>
                    <?php if ($mp3) flashAudio($mp3) ?>

                <?php elseif ($page == $Npages+1): ?>
                    <h1 class="thr-question">What would you like to do now?</h1>
                    <ul class="thr-choices">
                        <li><a href="<?php echo $link ?>">Read this book again.</a></li>
                        <li><a href="<?php echo $link . ($page+1) . '/'; ?>">Rate this book.</a></li>
                        <li><a href="<?php find_url(); ?>">Read another book.</a></li>
                    </ul>
                <?php elseif ($page == $Npages+2): ?>
                    <h1 class="thr-question">How do you rate this book?</h1>
                    <ul class="thr-choices">
                        <?php $np = $page + 1; $lk = $link . $np . '/?rating='; ?>
                        <li><a href="<?php echo $lk . 1; ?>">1 star</a></li>
                        <li><a href="<?php echo $lk . 2; ?>">2 stars</a></li>
                        <li><a href="<?php echo $lk . 3; ?>">3 stars</a></li>
                    </ul>
                <?php elseif ($page == $Npages+3):
                    $rating = getGet('rating', 0, '/^[123]$/');
                    if ($rating) {
                        list($avgrating, $nratings) = update_book_rating($post->ID, $rating);
                    } ?>
                    <h1>Thank you for your opinion.</h1>
                    <img src=""
                    <p class="thr-rating">Average rating: <?php echo $avgrating; ?></p>
                    <h1 class="thr-question">What would you like to do now?</h1>
                    <ul class="thr-choices">
                        <li><a href="<?php echo $link; ?>">Read this book again.</a></li>
                        <li><a href="<?php find_url() ?>">Read another book.</a></li>
                    </ul>
                <?php else: ?>
                    Outside
                <?php endif; ?>

    <?php endwhile; endif; ?>
<?php thr_footer(false, false); ?>
