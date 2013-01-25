<?php
/* Build the BookSearch DB */

require_once('../../../../wp-load.php');

ini_set('memory_limit','512M');

function BSBuild($create, $count, $start, $limit) {
  global $wpdb, $LangNameToLangCode, $post, $CategoryAbbrv;
  $wpdb->show_errors();
  // set up some constants
  $Reviewed = 612;
  $Caution = 608;
  $Everybody = 607;

  $table_name = $wpdb->prefix . 'book_search';

  if($create) {
    $sql = "DROP TABLE IF EXISTS $table_name";
    echo "$sql\n";
    $r = $wpdb->query($sql);
    echo 'result = ' . $r . "\n";
    $sql = "CREATE TABLE {$table_name} (
              ID bigint NOT NULL,
              content text NOT NULL,
              json text NOT NULL,
              categories text NOT NULL,
              language char(3) NOT NULL,
              reviewed char(1) NOT NULL,
              audience char(1) NOT NULL,
              type char(1) NOT NULL,
              PRIMARY KEY  (ID),
              FULLTEXT KEY content (content),
              FULLTEXT KEY categories (categories),
              INDEX (language)
             ) ENGINE=MyISAM DEFAULT CHARSET=utf8";
    echo "$sql\n";
    $r = $wpdb->query($sql);
    echo 'result = ' . $r . "\n";
  }

  while(1) {
    if ($limit > 0 && $start > $limit) {
      echo "limiting\n";
      break;
    }
/*
    $posts = $wpdb->get_results("
SELECT p.*
  FROM wpreader_posts p
  WHERE
    ((SELECT COUNT(1) FROM wpreader_term_relationships
      WHERE term_taxonomy_id IN (3) AND object_id = p.ID) = 1 ) AND
    p.post_status = 'publish'
  LIMIT $start,$count");

    if (count($posts) == 0) {
      echo "done\n";
      break;
    }
*/
    $t0 = microtime(1);

    $query = new WP_Query(array(
        'cat'=>3,
        'post_type' => 'post',
        'post_status' => 'publish',
        'posts_per_page' => $count,
        'paged' => $start,
        'order' => 'ASC',
        'orderby' => 'ID'));
    if ($query->post_count == 0) {
      echo "done\n";
      break;
    }
    // process each book
    while($query->have_posts()) {
      $query->the_post();
      $book = ParseBookPost($post);

      if ($book['status'] == 'draft') {
        continue;
      }

      $json = json_encode($book);
      $content = array();
      foreach($book['pages'] as $page) {
        $content[] = html_entity_decode($page['text']);
      }
      foreach($book['tags'] as $tag) {
        $content[] = preprocess_tag(html_entity_decode($tag));
      }
      $content[] = $book['author'];
      $content = implode(' ', $content);

      $row = array( );
      $row['ID'] = $post->ID;
      $row['content'] = $content;
      $row['json'] = $json;
      $row['categories'] = implode(' ', $book['categories']);
      $row['reviewed'] = $book['reviewed'] ? 'R' : 'N';
      $row['audience'] = $book['audience'];
      $row['language'] = $book['language'];
      $row['type'] = $book['type'];
      //print_r($row);
      $rows_affected = $wpdb->insert($table_name, $row);
      if ($rows_affected == 0) {
        print_r($row);
      }
    }
    $tper = (microtime(1) - $t0) / $count;
    echo "$start $tper\n";
    $start = $start + 1;
  }
}

if (count($argv) > 1) {
  $start = intval($argv[1]);
  $limit = intval($argv[2]);
} else {
  $start = 1;
  $limit = -1;
}
BSBuild(false && $start == 1, 100, $start, $limit);

/*
$r = $wpdb->get_results("SELECT * FROM wpreader_book_search");
print_r($r);
*/

?>

