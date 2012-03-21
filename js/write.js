define(['jquery',
        'route',
        'templates',
        'jquery.inlineedit'
        ],
    function($, route, templates) {

        var galleryData = {};
        var galleryUrl = '';
        var $editDialog = null;

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

        function addPage(page) {
            var view = {
                image: page,
                caption: page.text
            };
            templates.setImageSizes(view.image);
            var $p = $('<li class="thr-book-page">' + templates.render('bookPage', view) + '</li>');
            $p.find('a').remove();
            $('#write-pages').append($p);
            $('#noPicturesMessage').hide();
        }

        function initializeBookState(book) {
            console.log('initBook', book);
            $('input[title]').val(book.title);
            $.each(book.pages.slice(1), function (index, page) {
                addPage(page);
            });
        }

        function editPage(e) {
            var $this = $(this);
            var $img = $this.find('img');
            var caption = $this.find('p.thr-caption').html();
            console.log('eP', $img, caption);
            var view = {
                image: {
                    url: $img.attr('src'),
                    width: $img.attr('data-width'),
                    height: $img.attr('data-height')
                },
                caption: caption
            };
            templates.setImageSizes(view.image);
            var $content = $(templates.render('bookPage', view));
            foo = $content;
            $content.filter('a.thr-credit,a.thr-home-icon,a.thr-settings-icon').hide();
            if (!$editDialog) {
                $editDialog = $('<div class="thr-book-page edit-page"></div>').dialog({
                    width: 'auto',
                    resizable: false,
                    modal: true,
                    draggable: false,
                    autoOpen: false,
                    open: function(event, ui) {
                        $(this).find('.thr-caption').inlineEdit({
                            buttons: '',
                            saveOnBlur: true,
                            control: 'textarea'
                        });

                    }
                });
            }
            $editDialog.empty().append($content);
            $editDialog.dialog('open');
        }

        function writeInit(url, id) {
            // nested require so these are only loaded by users who want to write.
            // TODO: set loading here so user knows to wait
            var $page = this;

            var bookContent = {};
            if (id) { // if an id was provided, fetch that book for editing
                bookContent = $.ajax({
                    url: '/book-as-json/',
                    data: {
                        id: id
                    },
                    dataType: 'json'
                });
            }

            // load the jquery-ui css
            $('<link>', {
                rel: 'stylesheet',
                type: 'text/css',
                href: 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/themes/base/jquery-ui.css',
                id: 'theme'
            }).appendTo('head');

            require(['jquery-ui', 'jquery.image-gallery', 'jquery.ui.touch-punch'],
                function() {
                    // TODO: Clear loading here
                    // Initialize the accordian look
                    $('.accordion').accordion({
                            collapsible: true,
                            active: false,
                            clearStyle: true });

                    // Initialize the Image Gallery widget:
                    $('#gallery').imagegallery({
                        buttons: {
                            "Add to book": function() {
                                var $img = $(this).find('img');
                                var page = {
                                    url: $img.attr('src').replace('_s', ''),
                                    width: $img.attr('width'),
                                    height: $img.attr('height'),
                                    text: ''
                                };
                                addPage(page);
                                $('#step2').accordion('activate');
                            },
                            "Go back to search": function() { $(this).dialog("close"); },
                            "Previous picture": function() { $('#gallery').imagegallery('prev'); },
                            "Next picture": function() { $('#gallery').imagegallery('next'); }
                        },
                        show: {effect: 'fade', duration: 1 },
                        hide: {effect: 'fade', duration: 100 }
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

                    $('.button', '#writing-controls').button().button('disable');
                    $('#gallery-back').click(function() {
                        fetchAnotherGallery(-1);
                        return false;
                    });
                    $('#gallery-more').click(function() {
                        fetchAnotherGallery(+1);
                        return false;
                    });
                    $('#write-pages').on('click', 'li', editPage);
                    $('#write-pages').sortable();

                    $.when(bookContent).then(function(book) {

                        if (book.ID) { // editing an existing book
                            initializeBookState(book);
                        }
                        // ie8 insists I made this visible before activating the control
                        $('#writing-controls').css('visibility', 'visible');

                        if (book.ID) {
                            // open step 2
                            $('#step2').accordion('activate');
                        } else {
                            // open step 1
                            $('#step1').accordion('activate');
                        }
                    });

                });
        }

        route.add('init', /^\/write\/(?:\?id=(\d+))?$/, writeInit);

    });
