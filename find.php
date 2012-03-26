<?php
/*
Template Name: FindBooks

GET: Return a list of books that match the query
*/
?>
<?php
// construct the where clause
$where = array();
foreach(array('language', 'reviewed', 'type', 'audience') as $field) {
	$value = THR($field);
	if ($value) {
		$where[] = "s.$field = '$value'";
	}
}

$terms = array();

$query = stripslashes(THR('search'));
if ($query) {
	$words = array();
	$i = preg_match_all('/[\w\'*]+/', $query, $words);
	foreach($words[0] as $word) {
		if (strpos($word, "'") !== false) {
  			$terms[] = '+"' . $word . '"';
		} else {
			$terms[] = '+' . $word;
		}
	}
}

if (count($terms) > 0) {
    $qstring = mysql_real_escape_string(implode(' ', $terms));
    $where[] = "MATCH(s.content) AGAINST('$qstring' IN BOOLEAN MODE)";
}

if (THR('category')) {
    $where[] = "MATCH(s.categories) AGAINST('" . THR('category') . "' IN BOOLEAN MODE)";
}

if (count($where) > 0) {
	$where = 'WHERE ' . implode(' AND ', $where);
} else {
	$where = '';
}

$json = array_key_exists('json', $_GET) && $_GET['json'] == 1;
$count = 24;
$cp1 = $count + 1; // ask for one more to determine if there are more
$page = THR('page');
$offset = ($page - 1) * $count;

$sql = "
SELECT p.*
  FROM wpreader_posts p
  JOIN wpreader_book_search s ON p.ID = s.ID
  $where
  ORDER BY p.post_date DESC
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
	$po['pages'] = count($book['pages']);
	$po['language'] = $book['language'];
	$po['has_speech'] = $book['has_speech'];
	$books[] = $po;
}

$result = array(); // result object
$result['books'] = $books;
$result['queries2'] = get_num_queries();
$result['time'] = timer_stop(0);
$result['more'] = $more;

if ($json) {
    if (0) { // force an error for testing
        header("HTTP/1.0 500 Internal Error");
        die();
    }
    if (0) { // delay for testing
        sleep(10);
    }
	$output = json_encode($result);
	header('Content-Type: application/json');
	header('Content-Size: ' . strlen($output));
	echo $output;
	die();
}
$searchFormData = setFormFromState($Templates['searchForm']);
?>
<?php thr_header('find-page', true);
$view = array();
$view['searchForm'] = template_render('form', $searchFormData);
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
	$view['backLink'] = get_find_url($page-1);
}
if ($more) {
	$view['nextLink'] = get_find_url($page+1);
}
echo template_render('find', $view);

thr_footer(false, false);
?>
