<?php
/*
Template Name: Favorites

GET: Return a list of books that match the query
*/
?>
<?php
// handle converting old format favorites URL's to new format
function new_favorites_url($q) {
    $p = array();
    if (array_key_exists('books', $q)) {
        $v = $q['books'];
        $p[] = "favorites=$v";
    } else {
        return favorites_url();
    }
    foreach (array('bgcolor'=>'pageColor', 'fgcolor'=>'textColor') as $old=>$new) {
        if (array_key_exists($old, $q)) {
            $cname = $q[$old];
            $c = array('black'=>'000', 'blue'=>'00f', 'green'=>'0f0', 'cyan'=>'0ff', 'red'=>'f00', 'magenta'=>'f0f', 'yellow'=>'ff0', 'white'=>'fff');
            $d = array('pageColor'=>'fff', 'textColor'=>'000');
            $v = $c[$cname] ?: $d[$new];
            $p[] = "$new=$v";
        }
    }
    if (array_key_exists('speech', $q)) {
        $voice = array('silent', 'child', 'woman', 'man');
        $v = $voice[$q['speech'] + 0];
        $p[] = "voice=$v";
    }
    $result = '/favorites/?' . implode('&', $p);
    return $result;
}
?>
<?php
// redirect on old style favorites URLs to convert them to new style
if (array_key_exists('books', $_GET)) { // old format URL, convert it before redirect
    $loc = new_favorites_url($_GET);
    header('Location: ' . $loc);
    die();
}

// redirect on an empty URL so the page is bookmarkable
if (! array_key_exists('favorites', $_GET) && ! array_key_exists('collection', $_GET) && THR('favorites')) {
    $loc = favorites_url();
    header('Location: ' . $loc);
    die();
}

// redirect on A or R URLs so the resulting URL reflects the state
if (array_key_exists('favorites', $_GET) && preg_match('/^[AR]/', $_GET['favorites'])) {
    $loc = favorites_url();
    header('Location: ' . $loc);
    die();
}

// construct the where clause
$where = array();
$where[] = "p.post_status = 'publish'";
$collection = THR('collection');
if ($collection) {
    $favorites = $wpdb->get_var($wpdb->prepare("SELECT booklist FROM $collections_table WHERE slug = %s", $collection));
    setTHR('favorites', $favorites);
} else {
    $favorites = THR('favorites');
}
if ($favorites) {
    $where[] = "p.id in (" . $favorites . ")";
} else {
    $where[] = "p.id = 0";
}

$where = 'WHERE ' . implode(' AND ', $where);

$json = array_key_exists('json', $_GET) && $_GET['json'] == 1;
$count = 24;
$cp1 = $count + 1; // ask for one more to determine if there are more
$page = THR('fpage');
$offset = ($page - 1) * $count;

$sql = "
SELECT p.*
    FROM wpreader_posts p
    $where
    LIMIT $offset,$cp1";

$posts = $wpdb->get_results($sql);
$nrows = $wpdb->num_rows;

$result = posts_to_find_results($posts, $nrows, $count);

if (0) { // force an error for testing
    header("HTTP/1.0 500 Internal Error");
    die();
}
if (0) { // delay for testing
        sleep(3);
}
if ($json) {
    $output = json_encode($result);
    header('Content-Type: application/json');
    header('Content-Size: ' . strlen($output));
    echo $output;
    die();
}
setTHR('findAnotherLink', '/favorites/');
?>
<?php
    thr_header('favorites-page', array('settings'=>true, 'chooseFavorites'=>true));
?>
<!-- favorites.php -->
<?php
$view = array();
$view['searchForm'] = '';
// edit the data to create the view for the template
foreach( $result['books'] as &$book ) {
    $c = &$book['cover'];
    setImageSizes($c);
}
$result['favorites'] = true;
$view['bookList'] = template_render('bookList', $result);
if ($page > 1) {
    $view['backLink'] = favorites_url($page-1);
}
if ($result['more']) {
    $view['nextLink'] = favorites_url($page+1);
}
echo template_render('find', $view);

thr_footer();
?>
