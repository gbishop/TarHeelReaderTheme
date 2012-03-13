define(['jquery',
        'route'
        ],
    function($, route, page){

        function fetchGallery(options) {
            console.log('fetchGallery', options);
            // TODO: set loading here
            var data = {
                page: 1,
                per_page: 16
            };
            var url;
            if ('query' in options) {
                data.tags = options.query;
                url = '/photoSearch/';
            } else if ('user_id' in options) {
                data.user_id = options.user_id;
                url = '/photoSearchPeople/';
            } else {
                console.log('error');
                return false;
            }
            $.ajax({
                url: url,
                data: data,
                dataType: 'jsonp',
                jsonp: 'jsoncallback',
                success: function (data) {
                    console.log('success!', data);
                    $('#gallery').empty();
                    $.each(data.photos.photo, function (index, photo) {
                        var url = '/photo' + photo.farm + '/' + photo.server + '/' + photo.id + '_' + photo.secret;
                        $('<a rel="gallery"></a>')
                            .append($('<img>').prop('src', url + '_s.jpg').prop('class', 'myThumbnail'))
                            .prop('href', url + '.jpg')
                            .prop('title', photo.title)

                            .appendTo('#gallery');
                        $('#gallery a').addClass('no-ajaxy');
                    });
                    //TODO: clear loading here
                }
            });

        }
        function writeInit(url, query) {
            // nested require so these are only loaded by users who want to write.
            // TODO: set loading here so user knows to wait
            var $page = this;

            // load the jquery-ui css
            $('<link>', {
                rel: 'stylesheet',
                type: 'text/css',
                href: 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/themes/south-street/jquery-ui.css',
                id: 'theme'
            }).appendTo('head');

            require(['jquery-ui', 'jquery.image-gallery'],
                function() {
                    // TODO: Clear loading here
                    // Initialize the Image Gallery widget:
                    $('#gallery').imagegallery({
                        buttons: {
                            "Add to book": function() { $(this).dialog("close"); },
                            "Go back to gallery": function() { $(this).dialog("close"); },
                            "Next picture": function() { $('#gallery').imagegallery('next'); },
                            "Previous picture": function() { $('#gallery').imagegallery('prev'); }
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
                });
        }

        route.add('init', /^\/write\/$/, writeInit);

    });
