<?php
/* Construct the table for comments in the shared read */

require_once('../../../../wp-load.php');

ini_set('memory_limit','512M');

$shared = json_decode(file_get_contents("../shared/api/db/shared.json"), true);

$wpdb->show_errors();

$table_name = $wpdb->prefix . 'shared';

$sql = "DROP TABLE IF EXISTS $table_name";
echo "$sql\n";
$r = $wpdb->query($sql);
echo 'result = ' . $r . "\n";
$sql = "CREATE TABLE {$table_name} (
          CID int auto_increment primary key,
          ID bigint,
          owner bigint,
          status text,
          comments json,
          INDEX(ID)
         ) ENGINE=MyISAM DEFAULT CHARSET=utf8";
echo "$sql\n";
$r = $wpdb->query($sql);
echo 'result = ' . $r . "\n";

foreach ($shared as $book) {
  $slug = $book['slug'];
  $slug = preg_replace('/\.\d+$/', '', $slug);
  $posts = get_posts(array('name' => $slug));
  if ($posts) {
    $bookID = $posts[0]->ID;
  } else {
    echo "bad slug " . $book['slug'] . "\n";
    continue;
  }
  $userID = get_user_by('login', $book['owner'])->ID;
  $userLogin = $book['owner'];
  if (!$userID) {
    echo "bad user " . $book['owner'] . "\n";
    print_r($book);
    break;
    continue;
  }
  $empty = True;
  foreach($book['comments'] as $comments) {
    foreach($comments as $comment) {
      if ($comment != '') {
        $empty = False;
      }
    }
  }
  if (!$empty) {

    $comments = json_encode($book['comments']);

    $row = array( );
    $row['ID'] = $bookID;
    $row['owner'] = $userID;
    $row['status'] = $book['status'];
    $row['comments'] = $comments;
    $rows_affected = $wpdb->insert($table_name, $row);
    if ($rows_affected == 0) {
      print_r($row);
    }
  }
}

?>

