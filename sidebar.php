<div id="sidebar">
    <?php include('searchform.php'); ?>
    <h2>Reading</h2>
    <ul>
        <li><a href="<?php find_url() ?>">Find Books</a></li>
        <li><a href="/favorites/">Favorites</a></li>
        <li><a href="/reading-controls/">Setup</a></li>
    </ul>

    <h2>Writing</h2>
    <ul>
        <li><a href="/write/">Write a Book</a></li>
        <li><a href="/your-books/">Books you wrote</a></li>
    </uL>

    <h2>Info</h2>
    <ul>
        <li><a href="/blog/">Announcements</a></li>
        <li><a href="/frequently-asked-questions/">FAQ</a></li>
        <li><a href="/photo-credits/">Photo Credits</a></li>
    </ul>
            
	<h2>Admin</h2>
	<ul>
		<li><?php wp_register(); ?></li>
        <?php if ( is_user_logged_in() ): ?>
        <li><a href="<?php echo wp_logout_url( home_url() ); ?>" title="Log out" >Log out</a></li>
        <?php else: ?>
        <li><a href="/login/" title="Log in">Log in</a></li>
        <?php endif ?>
	</ul>
</div>
<div style="clear: both"></div>