<?php

$collections_table = $wpdb->prefix . 'book_collections';
$search_table = $wpdb->prefix . 'book_search';

// setup logging
date_default_timezone_set('EST');
require 'KLogger.php';
$log = new KLogger('/var/tmp/tarheelreader', KLogger::WARN);

require 'state.php'; // manage shared state in a cookie so both client and host have access

if (THR('debug') == 1) {
    $log = new KLogger('/var/tmp/tarheelreader', KLogger::DEBUG);
}

$locale = THR('locale');
if ($locale != 'en') {
    $content = file_get_contents(
        "Templates.$locale.json",
        FILE_USE_INCLUDE_PATH
    );
}
if ($locale == 'en' || !$content) {
    $content = file_get_contents("Templates.en.json", FILE_USE_INCLUDE_PATH);
}
$Templates = json_decode($content, true);
require_once "Mustache.php";
$mustache = new Mustache();

function template_render($name, $data = array())
{
    global $mustache, $Templates;
    return $mustache->render($Templates[$name], $data);
}

$LangNameToLangCode = array();
$SynthLanguages = array();
$lang = $Templates['languages'];
foreach ($lang as $row) {
    $LangNameToLangCode[$row['tag']] = $row['value'];
    if ($row['speech']) {
        if (array_key_exists('synth', $row)) {
            $SynthLanguages[$row['value']] = $row['synth'];
        } else {
            $SynthLanguages[$row['value']] = $row['value'];
        }
    }
}
function has_speech($lang)
{
    global $SynthLanguages;
    $r = array_key_exists($lang, $SynthLanguages);
    if ($r) {
        return $SynthLanguages[$lang];
    }
    return $r;
}

$CategoryAbbrv = array(
    'Alphabet' => 'Alph',
    'Animals and Nature' => 'Anim',
    'Art and Music' => 'ArtM',
    'Biographies' => 'Biog',
    'Fairy and Folk Tales' => 'Fair',
    'Fiction' => 'Fict',
    'Foods' => 'Food',
    'Health' => 'Heal',
    'History' => 'Hist',
    'Holidays' => 'Holi',
    'Math and Science' => 'Math',
    'Nursery Rhymes' => 'Nurs',
    'People and Places' => 'Peop',
    'Poetry' => 'Poet',
    'Recreation and Leisure' => 'Recr',
    'Sports' => 'Spor'
);
$CategoryNames = array();
foreach ($CategoryAbbrv as $CN => $CA) {
    $CategoryNames[$CA] = $CN;
}

function thr_colors()
{
    $t = THR('textColor');
    $p = THR('pageColor');
    echo "style=\"color: #$t; background: #$p; border-color: #$t\"";
}

function thr_title()
{
    bloginfo('name');
    echo ' | ';
    is_front_page() ? bloginfo('description') : wp_title('');
}

function is_ajax()
{
    return (isset($_SERVER['HTTP_X_REQUESTED_WITH']) &&
        strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') ||
        (isset($_GET['ajax']) && $_GET['ajax']) ||
        (isset($_POST['ajax']) && $_POST['ajax']);
}

// output the header with some tweaks
function thr_header($pageType, $view = array())
{
    thr_setcookie();

    // tell IE8 how to render and to prefer chrome frame
    header('X-UA_Compatible: IE=edge,chrome=1');

    if (!$pageType) {
        $pageType = 'server-page';
    }

    // disable caching on our dynamically generated pages
    /*
        I keep forgetting why we need this so I'll write it down. Anytime you return different content for the same URL
        you must disable caching, otherwise the user may see the wrong content. For example, we switch languages with a query parameter
        but we don't require the parameter on every page, instead we remember the state in a cookie. For example, consider the following
        sequence:
            1. visit / see the English content
            2. switch languages by going to /?locale=de, see the German content
            3. Later return to / expecting to see the German content but see the cached English content instead.

        The only way I see around this is to carry the query paramters that determine content everywhere.
    */
    header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
    header("Cache-Control: post-check=0, pre-check=0", false);

    if (is_ajax()) {
        // this is a ajax request for the page, give it the mininimum header
        echo "<div class=\"$pageType page-wrap\" data-title=\"";
        thr_title();
        echo "\">\n";
    } else {
        // this is a request from a browser for the full page.
        get_header();
        echo "<body>\n";
        echo "<div class=\"$pageType page-wrap active-page loading\" >\n";
    }
    echo template_render('heading', $view);
    echo "<div class=\"content-wrap\">\n";
}

function thr_footer()
{
    if (is_ajax()) {
        // this is a ajax request for the page, give it the mininimum header
        echo "</div></div>\n";
    } else {
        echo "</div>\n";
        get_footer();
    }
}

function convert_image_url($url)
{
    global $log;
    $root = ABSPATH;

    if (preg_match('/^\\/cache\\/images.*$|^\\/uploads.*$/', $url)) {
        $nurl = $url;
        $path = $root . $nurl;
    } elseif (
        preg_match(
            '/\\/photo([0-9]+)\\/([0-9a-f]+)\\/([0-9a-f]+)_([0-9a-f]+)(_[stmbo])?\\.jpg/',
            $url,
            $m
        )
    ) {
        $size = $m[5];
        if (!$size) {
            $size = '';
        }
        $nurl =
            '/cache/images/' .
            substr($m[3], -2) .
            '/' .
            $m[3] .
            '_' .
            $m[4] .
            $size .
            '.jpg';
        $path = $root . $nurl;
        if (!file_exists($path)) {
            $furl = preg_replace(
                '/\\/photo([0-9]+)/',
                'https://farm$1.static.flickr.com',
                $url
            );
            $r = copy($furl, $path);
            if (!$r) {
                $log->logError(
                    'copy from Flickr failed',
                    $furl . ' -> ' . $path
                );
                $nurl = '/cache/images/lost.jpg';
                $path = $root . $nurl;
            }
        }
    } elseif (
        preg_match(
            '/https?:\\/\\/farm([0-9])\\.static\\.flickr\\.com\\/([0-9a-f]+)\\/([0-9a-f]+)_([0-9a-f]+)(_[stmbo])?\\.jpg/',
            $url,
            $m
        )
    ) {
        $size = $m[5];
        if (!$size) {
            $size = '';
        }
        $nurl =
            '/cache/images/' .
            substr($m[3], -2) .
            '/' .
            $m[3] .
            '_' .
            $m[4] .
            $size .
            '.jpg';
        $path = $root . $nurl;
    } elseif (
        preg_match(
            '/https?:.*\\/wp-content(\\/uploads\\/.*)(_[ts])?\\.jpg/',
            $url,
            $m
        )
    ) {
        $nurl = $m[1] . $m[2] . '.jpg';
        $nurl = str_replace(' ', '_', $nurl);
        $path = $root . $nurl;
        //$nurl = preg_replace('/ /', '%20', $nurl);
    }
    return array($nurl, $path);
}

function resizeImage($im, $maxSide, $scaleUp)
{
    $w = imagesx($im);
    $h = imagesy($im);
    $xo = $yo = 0;
    if (!$scaleUp && $w < $maxSide && $h < $maxSide) {
        $nim = $im;
        $nw = $w;
        $nh = $h;
    } else {
        $r = $w / $h;
        if ($r < 1) {
            $nh = $maxSide;
            $nw = $maxSide * $r;
        } else {
            $nw = $maxSide;
            $nh = $maxSide / $r;
        }
        $nim = imagecreatetruecolor($nw, $nh);
        imagecopyresampled($nim, $im, 0, 0, $xo, $yo, $nw, $nh, $w, $h);
    }
    return array($nim, $nw, $nh);
}

function create_thumbnail($tpath)
{
    $path = str_replace('_t.jpg', '.jpg', $tpath);
    if (file_exists($path)) {
        $im = imagecreatefromjpeg($path);
        list($nim) = resizeImage($im, 100, true);
        imagejpeg($nim, $tpath);
        return true;
    }
    return false;
}

function make_page($text, $url)
{
    global $log;
    if (!$url) {
        return false;
    }
    list($nurl, $path) = convert_image_url($url);
    if (!file_exists($path)) {
        // special case the thumbnail
        $log->logInfo("not found path='$path' url='$url'");
        if (substr($path, -6) == '_t.jpg') {
            if (!create_thumbnail($path)) {
                $log->logError('thumbnail create failed');
                return false;
            }
        } elseif (!copy($url, $path)) {
            $log->logError("Copy failed '$url' -> '$path'");
            return false;
        }
    }
    list($width, $height) = getimagesize($path);

    return array(
        'text' => $text,
        'url' => $nurl,
        'width' => $width,
        'height' => $height
    );
}

function get_img($page, $cls, $scale = false)
{
    if ($scale) {
        $f = 100;
        if ($page['width'] > $page['height']) {
            $p = round(($f * $page['height']) / $page['width']);
            $m = round((100 - $p) / 2);
            if ($m > 0) {
                $style = "width: $f%; height: $p%; padding-top: $m%;";
            } else {
                $style = "width: $f%; height: $p%;";
            }
        } else {
            $p = round(($f * $page['width']) / $page['height']);
            $style = "width: $p%; height: $f%;";
        }
        $img = "<img style=\"$style\" class=\"$cls\" src=\"{$page['url']}\" data-width=\"{$page['width']}\" data-height=\"{$page['height']}\" />";
        $box = "<div class=\"$cls-box\">$img</div>";
        return $box;
    } else {
        $img = "<img class=\"$cls\" src=\"{$page['url']}\" width=\"{$page['width']}\" height=\"{$page['height']}\" />";
        return $img;
    }
}

function echo_img($page, $cls, $scale = false)
{
    echo get_img($page, $cls, $scale);
}

function striptrim_deep($value)
{
    if (isset($value)) {
        $value = is_array($value)
            ? array_map('striptrim_deep', $value)
            : trim(stripslashes($value));
    }
    return $value;
}

function ParseBookPost($post)
{
    global $LangNameToLangCode, $CategoryAbbrv;
    global $wpdb, $search_table;
    global $log;

    if (!$post || !$post->ID || !in_category('books', $post)) {
        return false;
    }

    $id = $post->ID;
    $author_id = $post->post_author;

    $row = $wpdb->get_row("SELECT * from $search_table WHERE ID = $id");
    if ($row) {
        $res = json_decode($row->json, true);
        $res['reviewed'] = $row->reviewed == 'R';
        $res['language'] = $row->language;
    } else {
        // parse the old format
        preg_match_all(
            '/(?:width="(\d+)" height="(\d+)" )?src="([^"]+)"\\/?>([^<]*)/',
            $post->post_content,
            $matches
        );
        $image_urls = $matches[3];
        $captions = striptrim_deep(array_slice($matches[4], 1));
        $title = trim($post->post_title);
        $pages = array();
        $page = make_page($title, $image_urls[0]);
        if ($page !== false) {
            $pages[] = $page;
        }
        for ($i = 1; $i < count($image_urls); $i++) {
            $page = make_page($captions[$i - 1], $image_urls[$i]);
            if ($page !== false) {
                $pages[] = $page;
            }
        }
        foreach ($pages as $page) {
            if ($page === false) {
                // something went wrong with the images in this book
                $log->logError("bad book $id");
                wp_update_post(array('ID' => $id, 'post_status' => 'draft'));
                $post->post_status = 'draft';
                break;
            }
        }
        $author = trim(get_post_meta($id, 'author_pseudonym', true));
        if (!$author) {
            $authordata = get_userdata($author_id);
            $author = $authordata->display_name;
        }
        $author = preg_replace('/^[bB][yY]:?\s*/', '', $author);

        $tags = array();
        $language = '??';
        foreach (wp_get_post_tags($id) as $tag) {
            $n = $tag->name;
            if (array_key_exists($n, $LangNameToLangCode)) {
                $language = $LangNameToLangCode[$n];
            } else {
                $tags[] = $n;
            }
        }
        $audience = ' ';
        $reviewed = false;
        $type = ' ';
        $categories = array();
        foreach (get_the_category($id) as $cat) {
            if ($cat->cat_ID != 3) {
                $n = $cat->cat_name;
                if ($n == 'Reviewed') {
                    $reviewed = true;
                } elseif ($n == 'Rated E/Everyone') {
                    $audience = 'E';
                } elseif ($n == 'Rated C/Caution') {
                    $audience = 'C';
                } elseif ($n == 'Conventional') {
                    $type = 'C';
                } elseif ($n == 'Transitional') {
                    $type = 'T';
                } elseif ($n == 'Other') {
                    $type = 'O';
                } else {
                    $categories[] = $CategoryAbbrv[$n];
                }
            }
        }
        $res = array(
            'title' => $title,
            'author' => $author,
            'type' => $type,
            'audience' => $audience,
            'reviewed' => $reviewed,
            'language' => $language,
            'tags' => $tags,
            'categories' => $categories,
            'pages' => $pages
        );
    }

    $res['author_id'] = $author_id;
    $res['status'] = $post->post_status;

    $rating_count = get_post_meta($id, 'book_rating_count', true);
    if (!$rating_count) {
        $rating_count = 0;
    } else {
        $rating_count = intval($rating_count);
    }
    $res['rating_count'] = $rating_count;

    $rating_value = get_post_meta($id, 'book_rating_value', true);
    if (!$rating_value) {
        $rating_value = 0;
    } else {
        $rating_value = floatval($rating_value);
    }
    $res['rating_value'] = round_rating($rating_value);
    $res['rating_total'] = intval($rating_count * $rating_value);

    $res['modified'] = $post->post_modified;
    $res['created'] = $post->post_date;
    $res['slug'] = $post->post_name;
    $res['link'] = preg_replace(
        '/https?:\/\/[a-zA-Z0-9.]+/',
        '',
        get_permalink($id)
    );
    $res['ID'] = $id;
    $res['bust'] = mysql2date('ydmHis', $post->post_modified, false); // cache bust for speech

    return $res;
}

function SaveBookPost($id, $book)
{
    global $log;
    $args = array(
        'post_title' => $book['title'],
        'post_status' => $book['status'],
        'post_excerpt' => 'A new book at Tar Heel Reader',
        'post_category' => array(3)
    );
    if ($id) {
        $args['ID'] = $id; // force update instead of insert
        $id = wp_update_post($args, true);
    } else {
        $args['post_content'] = 'Content is json';
        $id = wp_insert_post($args, true);
    }

    if (is_wp_error($id)) {
        $log->logError('SaveBookPost failed');
        $log->logError(print_r($book, true));
        $log->logError(print_r($id, true));
        return false;
    }
    $book['ID'] = $id;

    updateIndex($book);

    $post = get_post($id);
    $book = ParseBookPost($post);

    return $book;
}

function updateSpeech($book, $startPage = 0, $endPage = 0)
{
    if (!$startPage) {
        $startPage = 1;
    }
    if (!$endPage) {
        $endPage = count($book['pages']);
    }

    if ($book['status'] == 'publish') {
        $id = $book['ID'];
        // update speech
        $synthLang = has_speech($book['language']);
        if ($synthLang) {
            // make sure we have the folder
            $folder = $id . '';
            $pfolder = substr($folder, -2);
            $path = ABSPATH . 'cache/speech/' . $pfolder;
            if (!is_dir($path)) {
                mkdir($path);
            }
            $path .= '/' . $folder;
            if (!is_dir($path)) {
                mkdir($path);
            } elseif ($startPage === 1) {
                // cleanup the old files before generating new ones
                $files = glob($path . "/*");
                foreach ($files as $file) {
                    if (is_file($file)) {
                        unlink($file);
                    }
                }
            }
            $lang = $synthLang;
            $data = array('language' => $lang);
            for ($i = $startPage; $i <= $endPage; $i++) {
                $page = $book['pages'][$i - 1];
                $data['text'] = substr($page['text'], 0, 160); // limit the length that we synth
                foreach (array('child', 'female', 'male') as $voice) {
                    $data['voice'] = $voice;
                    // ask the speech server to generate a mp3
                    $params = array(
                        'http' => array(
                            'method' => 'POST',
                            'content' => http_build_query($data)
                        )
                    );
                    $ctx = stream_context_create($params);
                    // it gets hung going through nginx so go direct
                    // $mp3 = fopen(WP_SITEURL . '/synth/', 'rb', false, $ctx);
                    $mp3 = fopen('http://localhost:8888/synth/', 'rb', false, $ctx);
                    // save it
                    $fname = "$path/$i-" . substr($voice, 0, 1) . ".mp3";
                    file_put_contents($fname, $mp3);
                }
            }
        }
    }
}

function updateIndex($book)
{
    global $wpdb;
    global $log;
    $table_name = $wpdb->prefix . 'book_search';

    $content = array();
    foreach ($book['pages'] as $page) {
        $content[] = html_entity_decode($page['text']);
    }
    foreach ($book['tags'] as $tag) {
        $content[] = preprocess_tag(html_entity_decode($tag));
    }
    $content[] = $book['author'];
    $content = implode(' ', $content);

    $categories = implode(' ', $book['categories']);
    $row = array();
    $row['ID'] = $book['ID'];
    $row['content'] = $content;
    $row['categories'] = $categories;
    $row['reviewed'] = $book['reviewed'] ? 'R' : 'N';
    $row['audience'] = $book['audience'];
    $row['language'] = $book['language'];
    $row['type'] = $book['type'];
    $row['json'] = json_encode($book);
    //print_r($row);
    $id = $book['ID'];
    // delete it first
    $wpdb->query("DELETE FROM $table_name WHERE ID = $id");
    // then insert
    $rows_affected = $wpdb->insert($table_name, $row);
    if ($rows_affected == 0) {
        $log->logError("update failed $id");
    }
}

function rating_info($rating_value)
{
    global $Templates;
    $ratings = $Templates['ratings'];
    if ($rating_value == 0) {
        $result = $ratings[0];
    } else {
        $index = intval(round(2 * $rating_value) - 1);
        $result = $ratings[$index];
    }
    return $result;
}

// factored out of find, favorites, and collections
function posts_to_find_results($posts, $nrows, $count)
{
    global $log;
    if ($nrows > $count) {
        $more = 1;
        $nrows = $count;
    } else {
        $more = 0;
    }

    $books = array();
    for ($i = 0; $i < $nrows; $i++) {
        $post = $posts[$i];
        $book = ParseBookPost($post);
        if (!$book) {
            $log->logError("bad book in posts_to_find_results " . $post->ID);
            continue;
        }

        $po = array();
        $po['title'] = $book['title'];
        $po['ID'] = $post->ID;
        $po['slug'] = $book['slug'];
        $po['link'] = $book['link'];
        $po['author'] = $book['author'];
        $po['rating'] = rating_info($book['rating_value']);
        $po['tags'] = $book['tags'];
        $po['categories'] = $book['categories'];
        $po['reviewed'] = $book['reviewed'] == 'R';
        $po['audience'] = $book['audience'];
        $po['caution'] = $book['audience'] == 'C';
        $po['cover'] = $book['pages'][0];
        $po['preview'] = $book['pages'][1];
        $po['preview']['text'] = $po['title'];
        $po['pages'] = count($book['pages']);
        $po['language'] = $book['language'];
        $po['bust'] = $book['bust'];
        $books[] = $po;
    }

    $result = array(); // result object
    $result['books'] = $books;
    $result['queries2'] = get_num_queries();
    $result['time'] = timer_stop(0);
    $result['more'] = $more;
    $result['reviewer'] = current_user_can('edit_others_posts');
    return $result;
}

function preprocess_tag($tag)
{
    // prepare tags for indexing with fulltext
    return preg_replace("/[-,:.`~!@#$%^&*()_=+\[{}\];?<>]+/", '', $tag);
}

function round_rating($r)
{
    return round(round($r * 2) * 0.5, 1);
}

function update_book_rating($id, $rating)
{
    $cnt = get_post_meta($id, 'book_rating_count', true);
    if (!$cnt) {
        /* first rating */
        add_post_meta($id, 'book_rating_count', 1);
        add_post_meta($id, 'book_rating_value', $rating);
        return round_rating($rating);
    } else {
        $value = get_post_meta($id, 'book_rating_value', true);
        if (!$value) {
            /* should not happen */
            $value = 2;
        }
        $total = $value * $cnt;
        $total = $total + $rating;
        $cnt = $cnt + 1;
        $value = $total / $cnt;
        update_post_meta($id, 'book_rating_count', $cnt);
        update_post_meta($id, 'book_rating_value', $value);
        return round_rating($value);
    }
}

function getParam($key, $default = null, $rule = null, $method = 'get')
{
    $ary = $method == 'get' ? $_GET : $_POST;
    if (!isset($ary[$key])) {
        return $default;
    }
    $result = $ary[$key];
    if ($method == 'post') {
        $result = stripslashes($result);
    }
    $result = trim($result);
    if ($rule && !preg_match($rule, $result)) {
        return $default;
    }
    return $result;
}

function audio($mp3)
{
    $view = array('url' => $mp3, 'eurl' => urlencode($mp3));
    return template_render('flash', $view);
}

function setFormFromState($FormData)
{
    foreach ($FormData['controls'] as &$control) {
        $control['unique'] = uniqid();
        if (!isset($control['value']) && isset($control['name'])) {
            $control['value'] = THR($control['name']);
        }
        if (isset($control['options'])) {
            foreach ($control['options'] as &$option) {
                $option['selected'] = $option['value'] === $control['value'];
            }
        }
    }
    return $FormData;
}

function THRoption($label, $value, $var)
{
    global $THRState;
    $selected = $THRState[$var] == $value ? 'selected' : '';
    echo "<option value=\"$value\" $selected>$label</option>\n";
}

function setImageSizes(&$c)
{
    if ($c['width'] > $c['height']) {
        $c['pw'] = 100;
        $c['ph'] = (100 * $c['height']) / $c['width'];
        $c['pm'] = (100 - $c['ph']) / 2;
    } else {
        $c['ph'] = 100;
        $c['pw'] = (100 * $c['width']) / $c['height'];
        $c['pm'] = 0;
    }
}

function pageLink($link, $page)
{
    if ($page == 1) {
        return $link;
    }
    if (substr($link, 0, 4) == '/?p=') {
        return $link . "&page=$page";
    }
    return $link . $page . '/';
}
// Translations can be filed in the /languages/ directory
load_theme_textdomain('html5reset', TEMPLATEPATH . '/languages');

$locale = get_locale();
$locale_file = TEMPLATEPATH . "/languages/$locale.php";
if (is_readable($locale_file)) {
    require_once $locale_file;
}

// Clean up the <head>
function removeHeadLinks()
{
    remove_action('wp_head', 'rsd_link'); // Might be necessary if you or other people on this site use remote editors.
    remove_action('wp_head', 'feed_links', 2); // Display the links to the general feeds: Post and Comment Feed
    remove_action('wp_head', 'feed_links_extra', 3); // Display the links to the extra feeds such as category feeds
    remove_action('wp_head', 'index_rel_link'); // Displays relations link for site index
    remove_action('wp_head', 'wlwmanifest_link'); // Might be necessary if you or other people on this site use Windows Live Writer.
    remove_action('wp_head', 'start_post_rel_link', 10, 0); // Start link
    remove_action('wp_head', 'parent_post_rel_link', 10, 0); // Prev link
    remove_action('wp_head', 'adjacent_posts_rel_link_wp_head', 10, 0); // Display relational links for the posts adjacent to the current post.
    remove_filter('the_content', 'capital_P_dangit'); // Get outta my Wordpress codez dangit!
    remove_filter('the_title', 'capital_P_dangit');
    remove_filter('comment_text', 'capital_P_dangit');
    // Hide the version of WordPress you're running from source and RSS feed // Want to JUST remove it from the source? Try:
    remove_action('wp_head', 'wp_generator');
    // remove emoji crap
    remove_action('wp_head', 'print_emoji_detection_script', 7);
    remove_action('admin_print_scripts', 'print_emoji_detection_script');
    remove_action('wp_print_styles', 'print_emoji_styles');
    remove_action('admin_print_styles', 'print_emoji_styles');
    remove_action('template_redirect', 'rest_output_link_header', 11, 0);
    wp_deregister_script('wp-embed');
    remove_action('wp_head', 'rest_output_link_wp_head', 10);
    remove_action('wp_head', 'wp_oembed_add_discovery_links', 10);
}
add_action('init', 'removeHeadLinks');
add_filter('show_admin_bar', '__return_false'); // disable the wordpress bar

// remove pingback header
function remove_x_pingback($headers)
{
    unset($headers['X-Pingback']);
    return $headers;
}
add_filter('wp_headers', 'remove_x_pingback');

function fixupLogInOut($link)
{
    return str_replace('<a ', '<a class="no-ajaxy" ', $link);
}
add_filter('loginout', 'fixupLogInOut');
add_filter('register', 'fixupLogInOut');

// fix the email return address
function thr_mail_from()
{
    return "tarheelreader@cs.unc.edu";
}
function thr_mail_from_name()
{
    return "Tar Heel Reader";
}
add_filter('wp_mail_from', 'thr_mail_from');
add_filter('wp_mail_from_name', 'thr_mail_from_name');

// I suddenly started getting redirect loops when accessing / this seems to fix it.
remove_filter('template_redirect', 'redirect_canonical');

// exclude books from blog
add_action('pre_get_posts', 'thr_modify_query');
function thr_modify_query($query)
{
    if (!is_admin() && $query->is_main_query() && !$query->get('cat')) {
        $query->set('cat', '-3');
    }
}
// modify more posts links
function thr_get_pagenum_link($link)
{
    return str_replace('?ajax=1', '', $link);
}
add_filter('get_pagenum_link', 'thr_get_pagenum_link');

// disable wordpress search
function disable_search($query, $error = true)
{
    if (is_search()) {
        $query->is_search = false;
        $query->query_vars['s'] = false;
        $query->query['s'] = false;

        if ($error == true) {
            $query->is_404 = true;
        }
    }
}
if (!is_admin()) {
    add_action('parse_query', 'disable_search');
}

function thr_login_redirect($redirect_to)
{
    if (strpos($redirect_to, 'wp-admin') !== false) {
        $redirect_to = '/';
    }
    return $redirect_to;
}
add_filter('login_redirect', 'thr_login_redirect', 10, 3);

add_action('admin_init', 'no_mo_dashboard');
function no_mo_dashboard()
{
    if (
        !current_user_can('manage_options') &&
        $_SERVER['DOING_AJAX'] != '/wp-admin/admin-ajax.php'
    ) {
        wp_redirect('/');
        exit();
    }
}

// modify the registration form
function my_custom_login_logo()
{
    echo '<style type="text/css">
    h1 a {background-image:url(/theme/images/apple-touch-icon.png) !important; margin:0 auto;}
    </style>';
}
add_filter('login_head', 'my_custom_login_logo');

// Require the access code
add_action('register_form', 'my_register_form');
function my_register_form()
{
?>
    <p>
        <label for="access_code">Registration Code<br />
            <input type="text" name="access_code" id="access_code" class="input" size="25" value="<?php if (isset($_POST['access_code'])) {
                                                                                                        echo $_POST['access_code'];
                                                                                                    } ?>" />
        </label>
    </p>
    <p>
        <label for="first_name">First Name<br />
            <input type="text" name="first_name" id="first_name" class="input" size="25" value="<?php if (isset($_POST['first_name'])) {
                                                                                                    echo $_POST['first_name'];
                                                                                                } ?>" />
        </label>
    </p>
    <p>
        <label for="last_name">Last Name<br />
            <input type="text" name="last_name" id="last_name" class="input" size="25" value="<?php if (isset($_POST['last_name'])) {
                                                                                                    echo $_POST['last_name'];
                                                                                                } ?>" />
        </label>
    </p>
    <p>
        <label for="about">About Yourself<br />
            <textarea name="about" id="about" rows="5" cols="30"><?php if (isset($_POST['about'])) {
                                                                        echo $_POST['about'];
                                                                    } ?></textarea>
        </label>
    </p>
    <p>
        <label>Copyright Policy <br />
            I understand that Tar Heel Reader is a copyright-free environment.
            I agree to seek permission from copyright holders before posting any copy written
            materials to the site.<br />
            <input name="license" value="1" type="checkbox" /> I agree.
        </label>
    </p>

<?php
}

// Validate the access code
add_filter('registration_errors', 'my_registration_errors', 10, 3);
function my_registration_errors($errors)
{
    if (
        empty($_POST['access_code']) ||
        strtolower(trim($_POST['access_code'])) != ACCESS_CODE
    ) {
        $errors->add(
            'access_code_error',
            '<strong>ERROR</strong>: You must include the access code.'
        );
    }
    if (empty($_POST['first_name']) || trim($_POST['first_name']) == '') {
        $errors->add(
            'first_name_error',
            '<strong>ERROR</strong>: You must include a first name.'
        );
    }
    if (empty($_POST['last_name']) || trim($_POST['last_name']) == '') {
        $errors->add(
            'last_name_error',
            '<strong>ERROR</strong>: You must include a last name.'
        );
    }
    if (empty($_POST['license'])) {
        $errors->add(
            'license_error',
            '<strong>ERROR</strong>: You must agree to the license.'
        );
    }

    return $errors;
}
add_action('user_register', 'my_user_register');
function my_user_register($user_id)
{
    if (!empty($_POST['first_name'])) {
        update_user_meta($user_id, 'first_name', trim($_POST['first_name']));
    }
    if (!empty($_POST['last_name'])) {
        update_user_meta($user_id, 'last_name', trim($_POST['last_name']));
    }
    if (!empty($_POST['about'])) {
        update_user_meta($user_id, 'description', trim($_POST['about']));
    }
}

// fix the registration email by removing <> around url
add_filter('retrieve_password_message', 'my_password_message', 10, 2);
function my_password_message($message)
{
    $message = preg_replace('/<([^>]+)>/', "$1", $message);
    return $message;
}

// add user meta data for shared reading
function sr_custom_define()
{
    $custom_meta_fields = array();
    $custom_meta_fields['sharedrole'] = 'Shared Role';
    return $custom_meta_fields;
}
function sr_columns($defaults)
{
    $meta_number = 0;
    $custom_meta_fields = sr_custom_define();
    foreach ($custom_meta_fields as $meta_disp_name) {
        $meta_number++;
        $defaults['sr-usercolumn-' . $meta_number . ''] = __(
            $meta_disp_name,
            'user-column'
        );
    }
    return $defaults;
}

function sr_custom_columns($value, $column_name, $id)
{
    $meta_number = 0;
    $custom_meta_fields = sr_custom_define();
    foreach (array_keys($custom_meta_fields) as $meta_field_name) {
        $meta_number++;
        if ($column_name == 'sr-usercolumn-' . $meta_number . '') {
            return get_the_author_meta($meta_field_name, $id);
        }
    }
    $value; // ignore it
}

function sr_show_extra_profile_fields($user)
{
    print '<h3>Extra profile information</h3>';

    print '<table class="form-table">';

    $meta_number = 0;
    $custom_meta_fields = sr_custom_define();
    foreach ($custom_meta_fields as $meta_field_name => $meta_disp_name) {
        $meta_number++;
        print '<tr>';
        print '<th><label for="' .
            $meta_field_name .
            '">' .
            $meta_disp_name .
            '</label></th>';
        print '<td>';
        print '<input type="text" name="' .
            $meta_field_name .
            '" id="' .
            $meta_field_name .
            '" value="' .
            esc_attr(get_the_author_meta($meta_field_name, $user->ID)) .
            '" class="regular-text" /><br />';
        print '<span class="description"></span>';
        print '</td>';
        print '</tr>';
    }
    print '</table>';
}

function sr_save_extra_profile_fields($user_id)
{
    if (!current_user_can('edit_user', $user_id)) {
        return false;
    }

    $meta_number = 0;
    $custom_meta_fields = sr_custom_define();
    foreach (array_keys($custom_meta_fields) as $meta_field_name) {
        $meta_number++;
        update_user_meta($user_id, $meta_field_name, $_POST[$meta_field_name]);
    }
}
add_action('show_user_profile', 'sr_show_extra_profile_fields');
add_action('edit_user_profile', 'sr_show_extra_profile_fields');
add_action('personal_options_update', 'sr_save_extra_profile_fields');
add_action('edit_user_profile_update', 'sr_save_extra_profile_fields');
add_action('manage_users_custom_column', 'sr_custom_columns', 15, 3);
add_filter('manage_users_columns', 'sr_columns', 15, 1);

remove_action('login_init', 'send_frame_options_header');

function shared_role($current_user)
{
    $role = strtolower($current_user->roles[0]);
    if ($role == 'administrator') {
        $role = 'admin';
    } elseif ($role == 'editor' || $role == 'author') {
        $role = 'author';
    } else {
        $role = '';
    }
    return $role;
}

// they have added a "page" parameter that breaks my search
// kill it here
function remove_page_paramter($request)
{
    unset($request['page']);
    return $request;
}
add_filter('request', 'remove_page_paramter');
?>
