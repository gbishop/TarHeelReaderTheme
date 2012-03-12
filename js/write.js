define(['jquery',
        'route'
        ],
    function($, route, page){

        function fetchGallery(query) {
            console.log('fetchGallery', query);
            // TODO: set loading here
            $.ajax({
                url: '/photoSearch/',
                data: {
                    //use_id: '26671200@N08',
                    tags: query,
                    page: 1,
                    per_page: 16
                },
                dataType: 'jsonp',
                jsonp: 'jsoncallback',
                //dataType: 'json',
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
                        var query = $page.find('input[name=query]').val();
                        fetchGallery(query);
                        return false;
                    });
                });
        }

        route.add('init', /^\/write\/$/, writeInit);

    });
