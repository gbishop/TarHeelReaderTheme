define(['page', 'templates', 'route'], function(page, templates, route) {
    function homeRender(url, query) {
        console.log('homeRender', url);
        var $def = $.Deferred(),
            $newPage = page.getInactive('home-page'),
            view = {
                'wellicon': '<img src="/theme/images/well.png" class="tinyicon" title="old well icon" alt=" "/>',
                'gearicon': '<img src="/theme/images/settings.png" class="tinyicon" title="gear icon" alt=" "/>',
                'Flickr': '<a class="onlineOnly" href="http://flickr.com">Flickr</a>',
                'locales': templates.get('locales'),
                'content': '',
                'announcements': '',
                'local': true
            };

        //TODO maybe return an existing one?
        if (true || $newPage.find('.content-wrap').length == 0) {
            $newPage.empty()
                .append(templates.render('heading',
                    {settings:true, chooseFavorites:false}))
                .append('<div class="content-wrap">' +
                        templates.render('frontPage', view) +
                        '</div>');
        }
        $def.resolve($newPage, {title: 'Tar Heel Reader', colors: false});
        return $def;
    }
    route.add('render', /^\/(\?.*)?$/, homeRender);
});