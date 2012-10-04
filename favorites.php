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
$favorites = THR('favorites');
if ($favorites) {
  $where[] = "p.id in (" . THR('favorites') . ")";
} else {
  $where[] = "p.id = 0";
}

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

thr_footer(false, false);
?>
