define(['jquery',
        'route',
        'page'
        ],
    function($, route, page){
        function writeRender(url, query) {
            var $def = $.Deferred();
            console.log('called write');
            require(['jquery-ui', 'jquery.image-gallery'],
                function(jqueryUI, imageGallery) {
                    console.log('write', jqueryUI, imageGallery);
                    var $newPage = page.getInactive('write-page');
                    $newPage.html('hi there');
                    $def.resolve($newPage);
                });
            return $def;
        }
        console.log('register callback for write');
        route.add('render', /^\/write\/$/, writeRender);

    });
