define(['page', 'templates', 'route', 'state'], function(page, templates, route, state) {
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
    function homeInit(url, query) {
        // update the announcements unless offline
        var $page = $(this);
        if (!state.offline()) {
            $.ajax('/blog/', {
                data: { json: 1 },
                dataType: 'json',
                global: false
            }).then(function(data) {
                $page.find('div.announcements').empty()
                    .append(templates.render('announcements', data))
            });
        }
    }
    route.add('render', /^\/(\?.*)?$/, homeRender);
    route.add('init', /^\/(\?.*)?$/, homeInit);
});