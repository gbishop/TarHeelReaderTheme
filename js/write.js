define(['jquery',
        'route',
        'templates',
        'jquery.inlineedit'
        ],
    function($, route, templates) {

        var galleryData = {};
        var galleryUrl = '';
        var $editDialog = null;
        var $galleryDialog = null;

        function fetchAnotherGallery(step) {
            galleryData.page += step;
            $.ajax({
                url: galleryUrl,
                data: galleryData,
                dataType: 'jsonp',
                jsonp: 'jsoncallback',
                success: function (result) {
                    console.log('success!', result);
                    var p = result.photos,
                        g = $('#gallery'),
                        gwidth = g.width(),
                        iwidth = Math.round(gwidth * (gwidth > 480 ? 0.12 : 0.24) - 8);
                    if (galleryData.page > 1) {
                        g.css('height', g.height() + 'px');
                    } else {
                        g.css('height', 'auto');
                    }
                    g.empty();
                    $.each(p.photo, function (index, photo) {
                        var url = '/photo' + photo.farm + '/' + photo.server + '/' + photo.id + '_' + photo.secret,
                            ow = parseInt(photo.o_width, 10),
                            oh = parseInt(photo.o_height, 10),
                            scale = 500.0 / Math.max(ow, oh),
                            w = Math.round(ow * scale),
                            h = Math.round(oh * scale);
                        $('<img>').prop('src', url + '_s.jpg')
                            .prop('title', photo.title)
                            .attr('data-width', w)
                            .attr('data-height', h)
                            .css({width: iwidth + 'px', height: iwidth + 'px', border: '1px solid black', marginRight: '1px'})
                            .appendTo(g);
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
                per_page: 16,
                extras: 'o_dims'
            };
            if ('query' in options) {
                galleryData.tags = options.query.replace(/[ ,"']+/g, ',').replace(/^,+/,'').replace(/,+$/,'').replace(/,+/,',');
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

        function showGalleryPreview(startIndex) {
            var index = startIndex;

            function showPreviewImage() { // display the currently selected image in the preview dialog
                // get all the images
                var $imgs = $('#gallery img');
                // restrict the index to the range
                if (index >= $imgs.length) {
                    index = 0;
                } else if (index < 0) {
                    index = $imgs.length - 1;
                }
                // get the current image
                var $img = $($imgs.get(index));
                // extract image parameters
                var url = $img.prop('src'),
                    width = $img.attr('data-width'),
                    height = $img.attr('data-height'),
                    prop = width > height ? 'width' : 'height';
                // create the preview image with the same
                var $dimg = $('<img />')
                    .prop('src', url.replace('_s', ''))
                    .css(prop, '100%')
                    .attr('data-width', width)
                    .attr('data-height', height);
                // insert into the preview dialog
                $galleryDialog.find('>img').replaceWith($dimg);
                // display the image clipped title on the preview dialog
                var title = $img.attr('title');
                if (title.length > 32) {
                    title = title.substr(0,30) + '...';
                }
                $galleryDialog.dialog('option', 'title', title);
            }

            if (!$galleryDialog) {
                // create the dialog if it doesn't already exist
                $galleryDialog = $('<div class="galleryPreviewDialog"><img /></div>').dialog({
                    width: 'auto',
                    resizable: false,
                    modal: true,
                    draggable: false,
                    autoOpen: false,
                    open: function() {
                        $(this).parents('.ui-dialog-buttonpane button:eq(2)').focus();
                    },
                    buttons: [
                        {
                            text: $('#wlPrevious').html(),
                            click: function() { index -= 1; showPreviewImage(); }
                        },
                        {
                            text: $('#wlAddToBook').html(),
                            click: function() {
                                var $img = $(this).find('>img');
                                console.log('img', $img);
                                var page = {
                                    url: $img.attr('src').replace('_s', ''),
                                    width: $img.attr('data-width'),
                                    height: $img.attr('data-height'),
                                    text: ''
                                };
                                console.log('page', page);
                                addPage(page);
                                // confirm the page creation in the dialog title
                                $(this).dialog('option', 'title', $('#wlPageAdded').html());
                                var step2 = $('#step2').offset();
                                $img.clone().appendTo('body')
                                    .css({
                                        position: 'absolute',
                                        margin: 0,
                                        zIndex: 1003,
                                        width: $img.width() + 'px',
                                        height: $img.height() + 'px'
                                    }).css($img.offset())
                                    .animate({
                                        top: step2.top,
                                        left: step2.left + 100,
                                        width: '40px',
                                        height: '40px',
                                        opacity: 0
                                    },1000, function() {
                                        $(this).remove();
                                        $('#step2 h3').effect('highlight', {}, 1000);
                                    });
                            }
                        },
                        {
                            text: $('#wlNext').html(), // pulling the labels from the page
                            click: function() { index += 1; showPreviewImage(); }
                        }
                    ]
                });
            }
            // insert the first image
            showPreviewImage();
            $galleryDialog.dialog('open');
        }

        // add a page to the book
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
        // initialize book pages from an existing book
        function initializeBookState(book) {
            console.log('initBook', book);
            $('input[title]').val(book.title);
            $.each(book.pages.slice(1), function (index, page) {
                addPage(page);
            });
        }
        // edit a book page
        function editPage(e) {
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
            var index = $('#write-pages li').index(this);
            function setupEditContent() {
                var $wp = $('#write-pages li');
                if (index < 0) {
                    index = $wp.length - 1;
                } else if (index >= $wp.length) {
                    index = 0;
                }
                var $this = $($wp.get(index));
                var $img = $this.find('img');
                var caption = $this.find('p.thr-caption').html();
                console.log('eP', $this, $img, caption);
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
                $editDialog.empty().append($('#wEditHelp').html()).append($content);
            }

            var $window = $(window),
                ww = $window.width(),
                wh = $window.height(),
                pw = ww/(48 + 4),
                ph = wh/(36 + 10),
                p = Math.min(pw, ph);
            console.log('p', p, ph, pw, ww, wh);
            setupEditContent();
            $editDialog.on('click', 'a.thr-back-link', function() {
                index -= 1;
                setupEditContent();
            });
            $editDialog.on('click', 'a.thr-next-link', function() {
                index += 1;
                setupEditContent();
            });
            $editDialog.css('font-size', p + 'px');
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

            require(['jquery-ui', 'jquery.ui.touch-punch'],
                function() {
                    // TODO: Clear loading here
                    // Initialize the accordian look
                    $('.accordion').accordion({
                            collapsible: true,
                            active: false,
                            clearStyle: true });

                    $('#gallery').on('click', 'img', function(e) {
                        var $imgs = $('#gallery img'),
                            index = $imgs.index(this);
                        showGalleryPreview(index);
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

                    $('body').on('click', '.help,.help-text', function(e) {
                        // dialog doc claims it restores the source element but it does not do that for me, clone below
                        var $openTips = $('.ui-dialog .help-text:visible');
                        if ($openTips.length > 0) {
                            $openTips.dialog('destroy');
                            return;
                        }
                        var $this = $(this),
                            offset = $this.offset(),
                            ww = $(window).width(),
                            tw = Math.max(200, ww/3),
                            $tip = $this.next().clone().dialog({
                                position: [offset.left - tw - 20, offset.top],
                                width: tw
                            });
                            console.log('help', $tip);
                    });

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
