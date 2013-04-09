<?php
/*
Template Name: Collections

Handle reading collections of books.
*/
?>
<?php

$collections_table = $wpdb->prefix . 'book_collections';

$where = array();
$page = 1;
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    $query = getParam('q', '');
    $terms = array();
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
        $where[] = "MATCH(title,description) AGAINST('$qstring' IN BOOLEAN MODE)";
    }
    $page = getParam('cpage', '1', '/\d+/');
    $page = intval($page);
}

// construct the query
if (count($where) > 0) {
    $where = 'WHERE ' . implode(' AND ', $where);
} else {
    $where = '';
}

$count = 24; // set small to force paging, should be much larger
$cp1 = $count + 1; // ask for one more to determine if there are more
$offset = ($page - 1) * $count;

$sql = "
SELECT *
  FROM $collections_table
  $where
  ORDER BY title
  LIMIT $offset,$cp1";

$rows = $wpdb->get_results($sql);
$nrows = $wpdb->num_rows;

$view = array();
$view['has_collections'] = $nrows > 0;
if ($nrows > $count) {
    $more = 1;
    $nrows = $count;
} else {
    $more = 0;
}

$collections = array();
for($i=0; $i<$nrows; $i++) {
    $row = $rows[$i];

    $collections[] = array(
        'title' => $row->title,
        'description' => $row->description,
        'slug' => $row->slug);
}
$view['collections'] = $collections;

// assemble the next and previous links
$params = array();
if ($query) {
    $params['search'] = $query;
}
if ($page > 1) {
    $params['cpage'] = $page - 1;
    $view['prevLink'] = '/collections/?' . http_build_query($params);
}
if ($more) {
    $params['cpage'] = $page + 1;
    $view['nextLink'] = '/collections/?' . http_build_query($params);
}

// finally render the page
thr_header('collections-page');

echo template_render('collections', $view);
thr_footer();

?>
