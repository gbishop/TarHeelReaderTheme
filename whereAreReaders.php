<?php
/*
Template Name: Where are readers
*/
?>
<?php
$userID = get_current_user_id();
$mine = getParam('mine', 0, '/1/') == '1';

$base = ABSPATH;

if ($userID && $mine) {
    $mapname = "$base/Maps/Readers-$userID.html";
} else {
    $mapname = "$base/Maps/Readers-all.html";
}
$exists = true; // file_exists($mapname);
thr_header('map-page');
$view = array(
  'user' => $userID,
  'mine' => $mine,
  'map' => $exists
  );

echo template_render('whereAreReaders', $view);

if ($exists) {
    include $mapname;
}
thr_footer(false, false);
?>
