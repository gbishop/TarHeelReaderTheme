<?php
/*
Template Name: Favorites

GET: Return a list of books that match the query
*/
?>
<?php
// construct the where clause
$where = array();
$where[] = "p.post_status = 'publish'";
$where[] = "p.id in (" . THR('favorites') . ")";

$where = 'WHERE ' . implode(' AND ', $where);

$json = array_key_exists('json', $_GET) && $_GET['json'] == 1;
$count = 24;
$cp1 = $count + 1; // ask for one more to determine if there are more
$page = THR('page');
$offset = ($page - 1) * $count;

$sql = "
SELECT p.*
  FROM wpreader_posts p
  $where
  LIMIT $offset,$cp1";

$posts = $wpdb->get_results($sql);
$nrows = $wpdb->num_rows;

if ($nrows > $count) {
	$more = 1;
	$nrows = $count;
} else {
	$more = 0;
}

$books = array();
for($i=0; $i<$nrows; $i++) {
	$post = $posts[$i];
	$book = ParseBookPost($post);
	$po = array();
	$po['title'] = $book['title'];
	$po['ID'] = $post->ID;
	$po['slug'] = $book['slug'];
	$po['link'] = $book['link'];
	$po['author'] = $book['author'];
	$po['rating'] = round(round($book['rating_value']*2)/2, 1);
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
	$books[] = $po;
}

$result = array(); // result object
$result['books'] = $books;
$result['queries2'] = get_num_queries();
$result['time'] = timer_stop(0);
$result['more'] = $more;

if (0) { // force an error for testing
    header("HTTP/1.0 500 Internal Error");
    die();
}
if (0) { // delay for testing
    sleep(3);
}
if ($json) {
	$output = json_encode($result);
    header('Cache-Control: max-age=600');
	header('Content-Type: application/json');
	header('Content-Size: ' . strlen($output));
	echo $output;
	die();
}
setTHR('findAnotherLink', favorites_url());
?>
<?php thr_header('favorites-page', true);
$view = array();
$view['searchForm'] = '';
// edit the data to create the view for the template
foreach( $result['books'] as &$book ) {
    $c = &$book['cover'];
    if ($c['width'] > $c['height']) {
        $c['pw'] = 100;
        $c['ph'] = 100*$c['height']/$c['width'];
        $c['pm'] = (100 - $c['ph']) / 2;
    } else {
        $c['ph'] = 100;
        $c['pw'] = 100*$c['width']/$c['height'];
        $c['pm'] = 0;
    }
}
$view['bookList'] = template_render('bookList', $result);
if ($page > 1) {
	$view['backLink'] = favorites_url($page-1);
}
if ($more) {
	$view['nextLink'] = favorites_url($page+1);
}
echo template_render('find', $view);

thr_footer(false, false);
?>
