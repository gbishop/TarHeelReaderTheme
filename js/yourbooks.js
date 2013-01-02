define([
    'jquery',
    'route',
    'state',
    "jquery.scrollIntoView"
], function($, route, state) {

    function hideControls() {
        $('.active-page .controlList li.active').removeClass('active')
                                                .find("div").slideUp(300);

    }

    // display the controls on click
    $(document).on('click', '.controlList li span', function(ev) {
        var $parentLi = $(this).parent(),
            $optionsDiv = $parentLi.find("div");

        // hide any that are shown
        hideControls();

        // scroll into view and show the options div
        $optionsDiv.slideDown(300, "swing", function() {
            /* disable for now, it mostly works without it
                $(this).scrollIntoView(200, "swing", function() {
                var parentList = $parentLi.parent();
                $optionsDiv.parents("ul").animate({scrollTop: $optionsDiv.position().top - parentList.position().top}, 600);
            }); */
        }); // can't chain functions here


        // signal that it is open so I can validate the state of some buttons
        $parentLi.addClass("active").trigger('activated');
    });

    // hide the controls on cancel
    $(document).on('click', '.controlList button[data-action="cancel"]', function(event) {
        hideControls();
    });

    // enable save and update buttons after text changes and is legal
    function initYourBooks(url, query) {
        console.log('initYourBooks');
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
            $buttons.prop('disabled', favCount == 0);
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


    /* This is what I originally intended, but it is probably safer to check that the ajax call succeeded
     * and that the deletion was also successful
     *
     *
     * if it is a delete button, update the list accordingly without needing a page refresh
     $(document).on('click', '.controlList.bookList button[data-action="delete"]', function(event) {
        var $li = $(this).parents('li'),
            $div = $li.find('div');

        $div.slideUp(300, function() {
            $li.remove(); // remove the list item entirely
        });

    });*/

    // handle drafts/books buttons
    $(document).on('click', '.controlList.booksList button[data-action!="cancel"]', function(event) {
        var $this = $(this),
            $li = $(this).parents('li'),
            bookID = $this.parents('li').attr('data-id'),
            action = $this.attr('data-action');

        if(action === 'edit') {
           window.location.pathname = "/write/?id=" + bookID; // simply change URL, this is all we need to do, right?
        } else if(action === 'delete') {
           $.post('/your-books/', {action: action, id: bookID }, function(data, status) {
               removeFromList(data, status, $li, $li.find('div')); // remove from list if successful
           }, 'json');
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
                description: $div.find('textarea[name="description"]').val(),
            }
        } else if (action == 'merge' || action == 'replace' || action == 'delete' || action == 'add') {
            args = {
                action: action + '-collection',
                id: id
            }
        } else if (action == 'clear') {
            state.set('favorites', '');
        }
        if (args) {
            $.post('/your-books/', args, function(data, txtStatus) {
                window.location.reload(false);    // do we need this if we can just update the list without a refresh?
            }, 'json');
        }
    });

    return {};
});
