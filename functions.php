<?php 

require('state.php'); // manage shared state in a cookie so both client and host have access

$LangNameToLangCode = array(
    'Arabic' => 'ar',
    'Basque' => 'eu',
    'Catalan' => 'ca',
    'Danish' => 'da',
    'English' => 'en',
    'Filipino' => 'fil',
    'Finnish' => 'fi',
    'French' => 'fr',
    'Galician' => 'gl',
    'German' => 'de',
    'Greek' => 'el',
    'Hebrew' => 'he',
    'Italian' => 'it',
    'Japanese' => 'ja',
    'Latin' => 'la',
    'Polish' => 'pl',
    'Portuguese' => 'pt',
    'Spanish' => 'es',
    'Swedish' => 'sv'
);

$LangCodeToLangName = array();
foreach($LangNameToLangCode as $name => $code) {
    $LangCodeToLangName[$code] = $name;
}

$SynthLanguages = array('en', 'fr', 'de', 'it', 'pt', 'es', 'sv');

$CategoryAbbrv = array('Alphabet' => 'Alph',
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
                       'Sports' => 'Spor');
$CategoryNames = array();
foreach($CategoryAbbrv as $CN=>$CA) {
    $CategoryNames[$CA] = $CN;
}

function thr_colors() {
    $t = THR('textColor');
    $p = THR('pageColor');
    echo "style=\"color: #$t; background-color: #$p; border-color: #$t\"";
}

function thr_title() {
    if (function_exists('is_tag') && is_tag()) {
       single_tag_title("Tag Archive for &quot;"); echo '&quot; - '; }
    elseif (is_archive()) {
       wp_title(''); echo ' Archive - '; }
    elseif (is_search()) {
       echo 'Search for &quot;'.wp_specialchars($s).'&quot; - '; }
    elseif (!(is_404()) && (is_single()) || (is_page())) {
       wp_title(''); echo ' - '; }
    elseif (is_404()) {
       echo 'Not Found - '; }
    if (is_home()) {
       bloginfo('name'); echo ' - '; bloginfo('description'); }
    else {
        bloginfo('name'); }
    if ($paged>1) {
       echo ' - page '. $paged; }
}

function is_ajax() {
    return (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') 
        || (isset($_GET['ajax']) && $_GET['ajax']);
}

require_once "Mustache.php";
require_once "Templates.php";
$mustache = new Mustache();

function mustache($name, $data=array()) {
    global $mustache, $Templates;
    return $mustache->render($Templates[$name], $data);
}

// output the header with some tweaks 
function thr_header($colors, $pageType, $heading, $disableCache=true) {
    // tell IE8 how to render and to prefer chrome frame
    header('X-UA_Compatible: IE=edge,chrome=1');

    if (!$pageType) {
        $pageType = 'server-page';
    }

    // disable caching on our dynamically generated pages
    if ($disableCache) {
        header('Cache-Control: max-age=10'); // 10 seconds should allow a quick forward and back without a trip to the server
    }
    $body_style = '';
    if ($colors) {
        $pc = THR('pageColor');
        $tc = THR('textColor');
        $body_style = "style=\"color: #$tc; background-color: #$pc; border-color: #$tc;\"";
    }

    if (is_ajax()) {
        // this is a ajax request for the page, give it the mininimum header
        echo "<div class=\"$pageType page-wrap\" data-title=\"";
        thr_title();
        echo "\">\n";

    } else {
        // this is a request from a browser for the full page.
        get_header();
        echo "<body $body_style >\n";
        echo "<div class=\"$pageType page-wrap active-page\">\n";
    }
    if ($heading) {
        echo mustache('heading');
    }
}

function thr_footer($sidebar, $full) {
    if (is_ajax()) {
        // this is a ajax request for the page, give it the mininimum header
        if ($sidebar) {
            get_sidebar();
        }
        echo "</div>\n";
    } else {
        if ($sidebar) {
            get_sidebar();
        }
        if ($full) {
            include('footing.php');
        }
        get_footer();
    }        
}

function convert_image_url($url) {
    $root = '/var/www/TarHeelReader';

    if(preg_match('/http:\\/\\/farm([0-9])\\.static\\.flickr\\.com\\/([0-9a-f]+)\\/([0-9a-f]+)_([0-9a-f]+)(_[stmbo])?\\.jpg/', $url, $m)) {
        $size = $m[5];
        if (!$size) {
            $size = '';
        }
        $nurl = '/cache/images/' . substr($m[3], -2) . '/' . $m[3] . '_' . $m[4] . $size . '.jpg';
        $path = $root . $nurl;
    } elseif(preg_match('/http:.*\\/wp-content(\\/uploads\\/.*)(_[ts])?\\.jpg/', $url, $m)) {
        $nurl = $m[1] . $m[2] . '.jpg';
        $path = $root . '/wp-content' . $nurl;
        $nurl = preg_replace('/ /', '%20', $nurl);
    }
    return array($nurl, $path);
}

function make_page($text, $url) {
    list($nurl, $path) = convert_image_url($url);
    if (!file_exists($path)) {
        // try to fetch it
        if (substr($nurl, 0, 6) == '/cache') {
            copy('http://tarheelreader.org' . $nurl, $path);
        } elseif (substr($nurl, 0, 8) == '/uploads') {
            copy('http://tarheelreader.org/wp-content' . $nurl, $path);
        } else {
            echo "not found $nurl $path\n";
        }
    }
    list($width, $height, $type, $attr) = getimagesize($path);

    return array('text'=>$text, 'url'=>$nurl, 'width'=>$width, 'height'=>$height);
}

function get_img($page, $cls, $scale=false) {
    if ($scale) {
        $f = 100;
        if ($page['width'] > $page['height']) {
            $p = round($f * $page['height'] / $page['width']);
            $m = round((100 - $p) / 2);
            if ($m > 0) {
                $style="width: $f%; height: $p%; padding-top: $m%;";
            } else {
                $style="width: $f%; height: $p%;";
            }
        } else {
            $p = round($f * $page['width'] / $page['height']);
            $style="width: $p%; height: $f%;";
        }
        $img = "<img style=\"$style\" class=\"$cls\" src=\"{$page['url']}\" data-width=\"{$page['width']}\" data-height=\"{$page['height']}\" />";
        $box = "<div class=\"$cls-box\">$img</div>";
        return $box;
    } else {
        $img = "<img class=\"$cls\" src=\"{$page['url']}\" width=\"{$page['width']}\" height=\"{$page['height']}\" />";
        return $img;
    }
}

function echo_img($page, $cls, $scale=false) {
    echo get_img($page, $cls, $scale);
}

function striptrim_deep($value)
{
    if(isset($value)) {
        $value = is_array($value) ?
            array_map('striptrim_deep', $value) :
            trim(stripslashes($value));
    }
    return $value;
}

function ParseBookPost($post) {
    global $LangNameToLangCode, $SynthLanguages;

    $id = $post->ID;

    // parse the post
    $nimages = preg_match_all('/(?:width="(\d+)" height="(\d+)" )?src="([^"]+)"\\/?>([^<]*)/', $post->post_content, $matches);
    $image_urls = $matches[3];
    $image_widths = $matches[1];
    $image_heights = $matches[2];
    $captions = striptrim_deep(array_slice($matches[4], 1));
    $title = trim($post->post_title);
    $status = $post->post_status;
    $author_id = $post->post_author;
    //TODO: strip by: off the front of these
    $author = trim(get_post_meta($id, 'author_pseudonym', true));
    if(!$author) {
        $authordata = get_userdata($author_id);
        $author = $authordata->display_name;
    }
    $author = preg_replace('/^[bB][yY]:?\s*/', '', $author);

    $rating_count = get_post_meta($id, 'book_rating_count', true);
    if(!$rating_count) {
        $rating_count = 0;
    } else {
        $rating_count = intval($rating_count);
    }
    $rating_value = get_post_meta($id, 'book_rating_value', true);
    if(!$rating_value) {
        $rating_value = 0;
    } else {
        $rating_value = floatval($rating_value);
    }
    $tags = array();
    $language = '??';
    foreach(wp_get_post_tags($id) as $tag) {
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
    foreach(get_the_category($id) as $cat) {
        if ($cat->cat_ID != 3) {
            $n = $cat->cat_name;
            if ($n == 'Reviewed') {
                $reviewed = true;
            } else if ($n == 'Rated E/Everyone') {
                $audience = 'E';
            } else if ($n == 'Rated C/Caution') {
                $audience = 'C';
            } else if ($n == 'Conventional') {
                $type = 'C';
            } else if ($n == 'Transitional') {
                $type = 'T';
            } else if ($n == 'Other') {
                $type = 'O';
            } else {
                $categories[] = $n;
            }
        }
    }
    $modified = $post->post_modified;
    $created = $post->post_date;
    $slug = $post->post_name;
    $link = get_permalink($id);
    $pages = array();
    $pages[] = make_page($title, $image_urls[0]);
    for($i = 1; $i < count($image_urls); $i++) {
        $pages[] = make_page($captions[$i-1], $image_urls[$i]);
    }
    $res = array('title'=>$title, 
                 'author'=>$author, 
                 'author_id'=>$author_id, 
                 'status'=>$status, 
                 'type'=>$type, 
                 'audience'=>$audience, 
                 'reviewed'=>$reviewed, 
                 'language'=>$language,
                 'has_speech'=>intval(in_array($language, $SynthLanguages)),
                 'modified'=>$modified, 
                 'created'=>$created, 
                 'tags'=>$tags, 
                 'categories'=>$categories, 
                 'ID'=>$id, 
                 'slug'=>$slug,
                 'link'=>$link,
                 'rating_count' => $rating_count,
                 'rating_total' => intval($rating_count * $rating_value),
                 'rating_value' => round_rating($rating_value),
                 'pages'=>$pages);
    return $res;
}

function preprocess_tag($tag) {
    // prepare tags for indexing with fulltext
    return preg_replace("/[-,:.`~!@#$%^&*()_=+\[{}\];?<>]+/", '', $tag);
}

function round_rating($r) {
    return round(round($r * 2) * 0.5, 1);
}

function update_book_rating($id, $rating) {
    $cnt = get_post_meta($id, 'book_rating_count', true);
    if(!$cnt) { /* first rating */
        add_post_meta($id, 'book_rating_count', 1);
        add_post_meta($id, 'book_rating_value', $rating);
        return array($rating, 1);
    } else {
        $value = get_post_meta($id, 'book_rating_value', true);
        if(!$value) { /* should not happen */
           $value = 2;
        }
        $total = ($value * $cnt);
        $total = $total + $rating;
        $cnt = $cnt + 1;
        $value = $total / $cnt;
        update_post_meta($id, 'book_rating_count', $cnt);
        update_post_meta($id, 'book_rating_value', $value);
        return array(round_rating($value), $cnt);
    }
}

function getGet($key, $default = null, $rule = null)
{
    if(isset($_GET[$key])) {
        if(is_array($_GET[$key])) {
            $result = $_GET[$key];
            for($i=0; $i<count($result); $i++)
                if($rule && !preg_match($rule, $result[$i]))
                    return $default;
        } else {
            $result = trim($_GET[$key]);
            if($rule && !preg_match($rule, $result))
                return $default;
        }
        return $result;
    }
    return $default;
}

function flashAudio($mp3) { 
    $tp = get_bloginfo('template_directory'); ?>
    <object class="thr-player" type="application/x-shockwave-flash" data="<?php echo $tp ?>/player_mp3_mini.swf" width="1" height="1">
         <param name="movie" value="<?php echo $tp ?>/player_mp3_mini.swf" />
         <param name="bgcolor" value="#ff0000" />
         <param name="FlashVars" value="mp3=<?php echo urlencode($mp3) ?>&amp;autoplay=1" />
    </object>
    <?php
}

function setFormFromState($FormData) {
    foreach($FormData['controls'] as &$control) {
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

function THRoption($label, $value, $var) {
    global $THRState;
    $selected = $THRState[$var] == $value ? 'selected' : '';
    echo "<option value=\"$value\" $selected>$label</option>\n";
}

        // Translations can be filed in the /languages/ directory
        load_theme_textdomain( 'html5reset', TEMPLATEPATH . '/languages' );
 
        $locale = get_locale();
        $locale_file = TEMPLATEPATH . "/languages/$locale.php";
        if ( is_readable($locale_file) )
            require_once($locale_file);
	
// Clean up the <head>
function removeHeadLinks() {
    remove_action('wp_head', 'rsd_link'); // Might be necessary if you or other people on this site use remote editors.
    remove_action('wp_head', 'feed_links', 2); // Display the links to the general feeds: Post and Comment Feed
    remove_action('wp_head', 'feed_links_extra', 3); // Display the links to the extra feeds such as category feeds
    remove_action('wp_head', 'index_rel_link'); // Displays relations link for site index
    remove_action('wp_head', 'wlwmanifest_link'); // Might be necessary if you or other people on this site use Windows Live Writer.
    remove_action('wp_head', 'start_post_rel_link', 10, 0); // Start link
    remove_action('wp_head', 'parent_post_rel_link', 10, 0); // Prev link
    remove_action('wp_head', 'adjacent_posts_rel_link_wp_head', 10, 0); // Display relational links for the posts adjacent to the current post.
    remove_filter( 'the_content', 'capital_P_dangit' ); // Get outta my Wordpress codez dangit!
    remove_filter( 'the_title', 'capital_P_dangit' );
    remove_filter( 'comment_text', 'capital_P_dangit' );
    // Hide the version of WordPress you're running from source and RSS feed // Want to JUST remove it from the source? Try: 
    remove_action('wp_head', 'wp_generator');

}
add_action('init', 'removeHeadLinks');
remove_action('wp_head', 'wp_generator');

function fixupLogInOut($link) {
    return str_replace('<a ', '<a class="no-ajaxy" ', $link);
}
add_filter('loginout', 'fixupLogInOut');
add_filter('register', 'fixupLogInOut');

function my_login_redirect() {
  return get_bloginfo('url');
}
add_filter('login_redirect', 'my_login_redirect');

    
?>