        <footer>
            <div class="footer clear">
                <!--
                <?php bloginfo('name'); ?> is proudly powered by <a href="http://wordpress.org/">WordPress</a> <a href="<?php bloginfo('rss2_url'); ?>">RSS Feed</a>. -->
                <?php if(current_user_can('level_10')) { echo get_num_queries(),' queries in ', timer_stop(0), ' seconds'; } ?>
            </div>
        </footer>

