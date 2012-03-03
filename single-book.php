<?php thr_header(true, 'thr-book-page', false); ?>

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

            $pageNumber = $page;
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
                $view['image'] = $book['pages'][max(1, $pageNumber-1)];
                $view['caption'] = $view['image']['text'];
                if ($pageNumber == 1) {
                    $view['backLink'] = get_find_url();
                    $view['nextLink'] = pageLink($book['link'], 2);
                } else {
                    $view['backLink'] = pageLink($book['link'], $pageNumber-1);
                    $view['nextLink'] = pageLink($book['link'], $pageNumber+1);
                }
                setImageSizes($view['image']);
                echo mustache('bookPage', $view);
            } else {
                if ($pageNumber == $N+1) {
                    $view['question'] = "What would you like to do now?";
                    $view['choices'] = array(
                        array('text' => 'Read this book again.',
                              'href' => $book['link']),
                        array('text' => 'Rate this book.',
                              'href' => pageLink($book['link'], $pageNumber+1)),
                        array('text' => 'Read another book.',
                              'href' => get_find_url()));
                } elseif ($pageNumber == $N+2) {
                    $view['question'] = 'How do you rate this book?';
                    $link = pageLink($book['link'], $pageNumber+1) + '?rating=';
                    $view['choices'] = array(
                        array('text' => '1 star',
                              'image' => array('url' => '1stars.png',
                                               'cls' => 'thr-stars',
                                               'alt' => '1 star'),
                              'href' => link+1),
                        array('text' => '2 stars',
                              'image' => array('url' => '2stars.png',
                                               'cls' => 'thr-stars',
                                               'alt' => '2 stars'),
                              'href' => link+2),
                        array('text' => '3 stars',
                              'image' => array('url' => '3stars.png',
                                               'cls' => 'thr-stars',
                                               'alt' => '3 stars'),
                              'href' => link+3));
                } elseif ($pageNumber == $N+3) {
                    $view['thanks'] = 'Thank you for your opinion.';
                    $view['rating'] = $book['rating_value'];
                    $view['averageText'] = 'Average rating';
                    $view['question'] = 'What would you like to do now?';
                    $view['choices'] = array(
                        array('text' => 'Read this book again.',
                              'href' => $book['link']),
                        array('text' => 'Read another book.',
                              'href' => get_find_url()));
                } else {
                    $view['question'] = 'How did we get here?';
                }
                echo mustache('choicePage', $view);
            }
    endwhile; endif;
thr_footer(false, false); ?>
