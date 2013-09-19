<?php
/*
Template Name: FindBooks

GET: Return a list of books that match the query
*/
?>
<?php
// construct the where clause
$where = array();
$where[] = "p.post_status = 'publish'";
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
    $i = preg_match_all('/[\w0-9\'*]+|"[\w0-9\'* ]+"/', $query, $words);
    foreach($words[0] as $word) {
        if (strlen($word) < 3) {
            $esc = mysql_real_escape_string($word);
            $where[] = "s.content REGEXP '[[:<:]]" . $esc . "[[:>:]]'";
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
$nrows = min($wpdb->num_rows, count($posts));  // why do I need this?

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
// construct the searchForm view object
$searchFormData = $Templates['searchForm'];
foreach( $searchFormData['controls'] as &$control) {
    if ($control['name'] == 'category') {
        $control['options'] = array_merge($control['options'], $Templates['categories']);
    } elseif ($control['name'] == 'language') {
        $control['options'] = $Templates['languages'];
    }
}
$searchFormData = setFormFromState($searchFormData);
setTHR('findAnotherLink', find_url()); // set the return to link to come back to this state
?>
<?php thr_header('find-page', array('settings'=>true, 'chooseFavorites'=>true)); ?>
<!-- find.php -->
<?php
$view = array();
$view['searchForm'] = template_render('form', $searchFormData);
// edit the data to create the view for the template
foreach( $result['books'] as &$book ) {
    $c = &$book['cover'];
    setImageSizes($c);
}
$view['bookList'] = template_render('bookList', $result);

if ($page > 1) {
    $view['backLink'] = find_url($page-1);
}
if ($result['more']) {
    $view['nextLink'] = find_url($page+1);
}
echo template_render('find', $view);

thr_footer();
?>
