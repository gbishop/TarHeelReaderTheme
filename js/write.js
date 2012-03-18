define(['jquery',
        'route'
        ],
    function($, route) {

        var galleryData = {};
        var galleryUrl = '';

        function fetchAnotherGallery(step) {
            galleryData.page += step;
            $.ajax({
                url: galleryUrl,
                data: galleryData,
                dataType: 'jsonp',
                jsonp: 'jsoncallback',
                success: function (result) {
                    console.log('success!', result);
                    var p = result.photos;
                    var g = $('#gallery');
                    if (galleryData.page > 1) {
                        g.css('height', g.height() + 'px');
                    } else {
                        g.css('height', 'auto');
                    }
                    g.empty();
                    $.each(p.photo, function (index, photo) {
                        var url = '/photo' + photo.farm + '/' + photo.server + '/' + photo.id + '_' + photo.secret;
                        $('<a rel="gallery"></a>')
                            .append($('<img>').prop('src', url + '_s.jpg').prop('class', 'myThumbnail'))
                            .prop('href', url + '.jpg')
                            .prop('title', photo.title)
                            .appendTo(g);
                        g.find('a').addClass('no-ajaxy');
                    });
                    $('#gallery-back').button(p.page > 1 ? 'enable' : 'disable');
                    $('#gallery-more').button(p.page < p.pages ? 'enable' : 'disable');

                    //TODO: clear loading here
                }
            });
        }

        function fetchGallery(options) {
            console.log('fetchGallery', options);
            // TODO: set loading here
            galleryData = {
                page: 1,
                per_page: 16
            };
            if ('query' in options) {
                galleryData.tags = options.query;
                galleryUrl = '/photoSearch/';
            } else if ('user_id' in options) {
                galleryData.user_id = options.user_id;
                galleryUrl = '/photoSearchPeople/';
            } else {
                console.log('error');
                return false;
            }
            fetchAnotherGallery(0);

        }
        function writeInit(url, query) {
            // nested require so these are only loaded by users who want to write.
            // TODO: set loading here so user knows to wait
            var $page = this;

            // load the jquery-ui css
            $('<link>', {
                rel: 'stylesheet',
                type: 'text/css',
                href: 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/themes/base/jquery-ui.css',
                id: 'theme'
            }).appendTo('head');

            require(['jquery-ui', 'jquery.image-gallery'],
                function() {
                    // TODO: Clear loading here
                    // Initialize the accordian look
                    $('.accordion').each(function(index, item) {
                        $(item).accordion({
                            collapsible: true,
                            active: false,
                            clearStyle: true }); });

                    // Initialize the Image Gallery widget:
                    $('#gallery').imagegallery({
                        buttons: {
                            "Add to book": function() { $(this).dialog("close"); },
                            "Go back to search": function() { $(this).dialog("close"); },
                            "Previous picture": function() { $('#gallery').imagegallery('prev'); },
                            "Next picture": function() { $('#gallery').imagegallery('next'); }
                        }
                    });
                    var $form = $page.find('form');
                    $form.submit(function(e) {
                        e.preventDefault();
                        console.log('submit');
                        var query = $page.find('input[name=query]').val();
                        if (query.match(/^.*@.*$/)) {
                            fetchGallery({ user_id: query });
                        } else {
                            fetchGallery({ query: query });
                        }
                        return false;
                    });

                    $('.accordion a:first').click();
                    $('.button', '#writing-controls').button().button('disable');
                    $('#gallery-back').click(function() {
                        fetchAnotherGallery(-1);
                        return false;
                    });
                    $('#gallery-more').click(function() {
                        fetchAnotherGallery(+1);
                        return false;
                    });

                    $('#writing-controls').css('visibility', 'visible');
                });
        }

        route.add('init', /^\/write\/$/, writeInit);

    });
