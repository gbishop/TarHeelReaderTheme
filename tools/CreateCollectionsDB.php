<?php
/* Build the Collections DB */

require_once('../../../../wp-load.php');

function BCBuild($create) {
  global $wpdb;
  $wpdb->show_errors();

  $table_name = $wpdb->prefix . 'book_collections';

  if($create) {
    $sql = "DROP TABLE IF EXISTS $table_name";
    echo "$sql\n";
    $r = $wpdb->query($sql);
    echo 'result = ' . $r . "\n";
    $sql = "CREATE TABLE {$table_name} (
              ID bigint NOT NULL AUTO_INCREMENT,
              title text NOT NULL,
              slug varchar(200) NOT NULL,
              description text NOT NULL,
              owner bigint,
              language char(3) NOT NULL,
              booklist text NOT NULL,
              PRIMARY KEY (ID),
              FULLTEXT KEY title (title),
              FULLTEXT KEY description (description),
              UNIQUE (slug)
             ) ENGINE=MyISAM DEFAULT CHARSET=utf8";
    echo "$sql\n";
    $r = $wpdb->query($sql);
    echo 'result = ' . $r . "\n";
  }
}

BCBuild(0);
?>

