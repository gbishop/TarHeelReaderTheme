define([
    'route',
    'state',
    'controller',
    "jquery.scrollIntoView"
], function(route, state, controller) {

     $('body').on('PageRendered', '.your-books-page', function() {
        var $this = $(this),
            $quickNav = $this.find('.quickNavigation'),
            numDraftBooks = $this.find('.draftBooks').children().length,
            numPublishedBooks = $this.find('.publishedBooks').children().length,
            scrollTop = 0;

        // show the div for quick navigation if the added total of books equals or exceeds 20
        if((numDraftBooks + numPublishedBooks) >= 20) {
            $quickNav.slideDown()
                     .find('li')
                     .on('click', function() {
                            scrollTop = $('.' + $(this).attr('class').replace('Link', '')).offset().top;
                            $('html, body').animate({scrollTop: scrollTop}, 400); // header should be at the top of the screen
                        }); // end click
        }
    }); // end PageRendered

    function hideControls() {
        $('.active-page .controlList li.active').removeClass('active')
                                                .find("div")
                                                .slideUp(300);
    }

    // display the controls on click
    $(document).on('click', '.controlList li span', function(ev) {
        var $parentLi = $(this).parent(),
            $optionsDiv = $parentLi.find("div");

        // hide any that are shown
        hideControls();

        // signal that it is open so I can validate the state of some buttons
        $parentLi.addClass("active").trigger('activated');
        // scroll into view and show the options div
        $optionsDiv.slideDown(300, "swing", function() {
            $optionsDiv.scrollIntoView();
        });
    });

    // hide the controls on cancel
    $(document).on('click', '.controlList button[data-action="cancel"]', function(event) {
        hideControls();
    });

    // enable save and update buttons after text changes and is legal
    function initYourBooks(url, query) {
        //console.log('initYourBooks');
        $('.active-page .collectionsList input').on('keyup', function(event) {
            var $this = $(this),
                $div = $this.parent('div'),
                title = $div.find('input[name="title"]').val(),
                $buttons = $div.find('.validateTitle');
            $buttons.prop('disabled', !/\w/.test(title));
        });
        $('.active-page .collectionsList li').on('activated', function(event) {
            var $this = $(this),
                favCount = state.favoritesArray().length,
                $buttons = $this.find('.requireFavs');
            $buttons.prop('disabled', favCount === 0);
        });
    }

    // function to remove the book from the list so we don't need a page refresh to update the lists
    function removeFromList(data, status, $li, $div) {
        var success = true,
            $bookList;

        if(status === 'success' && data) {
            // all of the results in the data object must be true to indicate success
            for(var key in data) {
                if(!data[key]) {
                    success = false;
                }
            }
            if(success) { // remove the list item
                $div.slideUp(300, "swing", function() {
                    $li.remove();
                    $bookList = $(".active-page .draftBooks");
                    if(!$bookList.children("li").length) { // there are no more books, remove the list altogether
                        $bookList.replaceWith("<p>If you had any books saved as drafts they would appear here.</p>");
                    }
                }); // end slideUp
            } else { // something went wrong... just slide up
                $li.removeClass("active");
                $div.slideUp(300);
            }
        }
    }

    route.add('init', /^\/your-books\/(\?.*)?$/, initYourBooks);

    // handle drafts/books buttons
    $(document).on('click', '.controlList.booksList button[data-action!="cancel"]', function(event) {
        var $this = $(this),
            $li = $(this).parents('li'),
            bookID = $this.parents('li').attr('data-id'),
            link = $this.parents('li').attr('data-link'),
            action = $this.attr('data-action');

        if(action === 'edit') {
            controller.gotoUrl("/write/?id=" + bookID); // simply change URL, this is all we need to do, right?
        } else if(action === 'delete') {
            $.post('/your-books/', {action: action + '-draft', id: bookID }, function(data, status) {
               // removeFromList(data, status, $li, $li.find('div')); // we can use this for deletion without reload
               window.location.reload(false);  // keep the deletion behavior consistent: refresh page
            }, 'json');
        } else if(action === 'read') {
            controller.gotoUrl(link);
        }
    }); // end click

    // handle collections buttons
    $(document).on('click', '.controlList.collectionsList button[data-action!="cancel"]', function(event) {
        var $this = $(this),
            $li = $this.parents('li'),
            id = $li.attr('data-id'),
            $div = $li.find('div'),
            action = $this.attr('data-action'),
            args = {};

        if (action == 'save') {
            args = {
                action: 'update-collection',
                id: id,
                title: $div.find('input[name="title"]').val(),
                description: $div.find('textarea[name="description"]').val()
            };
        } else if (action == 'merge' || action == 'replace' || action == 'delete' || action == 'add') {
            args = {
                action: action + '-collection',
                id: id
            };
        } else if (action == 'clear') {
            state.set('favorites', '');
            state.set('collection', '');
            window.location.reload(false);
            return;
        }
        if (args) {
            $.post('/your-books/', args, function(data, txtStatus) {
                window.location.reload(false);
            }, 'json');
        }
    });

    return {};
});
