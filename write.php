<?php
/*
Template Name: Write

Allow users to write books
*/
?>
<?php thr_header(false, 'write-page', true); ?>
<?php

// get the id if any
$ID = getGet('id', '', '/[0-9]+/');
?>
<h1>Write a book</h1>
<noscript>
    <p>You must have Javascript enabled in order to write a book.</p>
</noscript>
<p>Check to be sure they are logged in too</p>

<form method="get">
    <input type="search" name="query" />
    <input type="submit" value="Search" />
</form>
<div id="gallery"></div>

<?php thr_footer(false, true); ?>
