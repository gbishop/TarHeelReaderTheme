    <?php if (have_posts()):
        while (have_posts()):
            the_post();

            $book = ParseBookPost($post);
            $pages = $book['pages'];
            $Npages = count($pages);
            $link = $book['link'];
            $preview = substr($link, 0, 4) == '/?p=';

            if ($preview) {
                $findLink = '/your-books/';
            } else {
                $findLink = THR('findAnotherLink');
            }
            $mp3 = null;
            if (has_speech($book['language'])) {
                $voice = THR('voice');
                if ($voice != 'silent') {
                    $v = $voice[0];
                    $id = $book['ID'];
                    $folder = substr($id, -2) . '/' . $id;
                    $bust = $book['bust'];
                    $mp3 = "/cache/speech/$folder/$page-$v.mp3?bust=$bust";
                    echo "<!-- $mp3 -->";
                }
            }
            $pageNumber = $page;
            // setup page classes
            $addClass = '';
            if ($pageNumber == 1) {
                $addClass = ' front-page';
            } elseif ($pageNumber > $Npages) {
                $addClass = ' choice-page';
            }
            $hview = array();
            $hview['noTitle'] = true;
            if ($pageNumber == 1) {
                $hview['isFavorite'] = preg_match('/(^|,)' . $id . '(,|$)/', THR('favorites'));
                $hview['ID'] = $book['ID']; // book ID for download/settings links in the menu
                $hview['settings'] = true;
            }
            thr_header('thr-book-page thr-colors' . $addClass, $hview);

            $view = array();
            $view['frontPage'] = $pageNumber == 1;
            $view['title'] = $book['title'];
            $view['textColor'] = THR('textColor');
            $view['pageColor'] = THR('pageColor');
            $view['ID'] = $book['ID'];
            $N = count($book['pages']);
            if ($pageNumber <= $N) {
                $view['author'] = $book['author'];
                $view['pageNumber'] = $pageNumber;
                $view['backto'] = urlencode($link);
                $view['image'] = $book['pages'][max(1, $pageNumber-1)];
                $view['caption'] = $view['image']['text'];
                if ($pageNumber == 1) {
                    $view['backLink'] = $findLink;
                    $view['nextLink'] = pageLink($link, 2);
                } else {
                    $view['backLink'] = pageLink($link, $pageNumber-1);
                    $view['nextLink'] = pageLink($link, $pageNumber+1);
                }
                setImageSizes($view['image']);
                if ($mp3) $view['audio'] = audio($mp3);
                echo template_render('bookPage', $view);
            } else {
                $view['nextLink'] = pageLink($link, $pageNumber+1);
                $view['link'] = $link;
                $view['findLink'] = $findLink;
                $view['what'] = $pageNumber == $N+1;
                $view['rate'] = $pageNumber == $N+2;
                $view['thanks'] = $pageNumber >= $N+3;
                $rating = getParam('rating', '', '/[123]/');
                if ($rating && $view['thanks']) {
                    $rating = intval($rating, 10);
                    $view['rating'] = rating_info(update_book_rating($post->ID, $rating));
                } else {
                    $view['rating'] = rating_info($book['rating_value']);
                }
                echo template_render('choicePage', $view);
            }
    endwhile; endif;
thr_footer(); ?>
