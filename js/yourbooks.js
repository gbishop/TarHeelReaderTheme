define([
    'jquery',
    'route',
    'state',
    "jquery.scrollIntoView"
], function($, route, state) {

    function hideControls() {
        $('.active-page .controlList li').removeClass('active');
    }

    // display the controls on click
    $(document).on('click', '.controlList li span', function(ev) {
        // we need a cool transition here. Maybe the controls could slide into view?
        // I'm going to do the simple stupid thing

        // hide any that are shown
        hideControls();

        // activate this one
        $(this).parent().addClass('active').scrollIntoView();

        // signal that it is open so I can validate the state of some buttons
        $(this).parent().trigger('activated');

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

    route.add('init', /^\/your-books\/(\?.*)?$/, initYourBooks);


    // handle collections buttons
    $(document).on('click', '.controlList.collectionsList button', function(event) {
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
                window.location.reload(false);
            }, 'json');
        }
    });

    return {};
});
