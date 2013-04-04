// Code for navigation and settings menus
define(["state", "controller", "templates", "ios"], function(state, controller, templates, ios) {
    // list of settings
    var settings = ["voice", "pageColor", "textColor"], // the settings that we are concerned with (voice = speech)
        options = { // list of available options
            speech: {
                silent: 'silent',
                child: 'child',
                woman: 'female',
                man: 'male'
            },
            colors: {
                black: '000',
                blue: '00f',
                cyan: '0ff',
                green: '0f0',
                magenta: 'f0f',
                red: 'f00',
                white: 'fff',
                yellow: 'ff0'
            },
            getKeyByValue: function(category, value) { // function to retrieve option by value
                var object = this[category];
                for(var option in object) {
                   if(object.hasOwnProperty(option) ) {
                       if(object[option] === value)
                            return option;
                     }
                }
            },
            getOptionByValue: function(category, selectedOption) {
                for(var option in this[category]) {
                    if(option === selectedOption) {
                        return this[category][option];
                    }
                }
                return null;
            }
        },
        defaultOptions = {
            voice: options.speech.silent,
            pageColor: options.colors.white,
            textColor: options.colors.black
        };

    function showNav() {
        $('.active-page .hiddenContent').fadeOut(function() {
            $('.active-page .navigationMenu').slideDown().attr('aria-hidden', 'false');
        }).attr('aria-hidden', 'true'); // end fadeOut
    }

    function hideNav() {
        $('.active-page .navigationMenu').fadeOut(50, function() {
            $('.active-page .hiddenContent').fadeIn().attr('aria-hidden', 'false');
        }).attr('aria-hidden', 'true'); // end slideUp
    }


    $(function() {
        var $body = $('body'),
            currentSettings = getCurrentSettings(),
            pathname = "/";

        initKeyControls(); // initialize the key bindings for the menu/settings

        /*
         * Begin Navigation Code
         */

         $body.on("click", "a.thr-well-icon", function(ev, data) {
            // toggling navigation on the navigation page doesn't make sense (IE8 fix: IE8 doesn't like :not selector)
            //console.log('menu click');
            var $navPage = $("body > div.navigation");
            if($navPage.length !== 0 && $navPage.hasClass("active-page")) {
                //console.log('bail here');
                return false;
            }

            var $contentWrap = $(".active-page .content-wrap"),
                $navigation = $contentWrap.find(".navigationMenu"),
                $hiddenContent = $contentWrap.find(".hiddenContent");

            if (ios.cancelNav(ev)) {
                return false;
            }
            //console.log(1);
            if($navigation.length === 0) { // nav doesn't exist, load it
                templates.setLocale().then(function() {
                    //console.log('create nav');
                    $contentWrap.wrapInner("<div class='hiddenContent' />")
                                .prepend(templates.render('navigation', null));

                    $(".active-page").find(".navigationMenu").hide();
                    showNav();
                }); // end then()
                //console.log(2);
            } else if(!$navigation.is(":visible")) {
                //console.log(3);
                showNav();
            } else {
                //console.log(4);
                hideNav();
            }
            return false; // for those who have JavaScript enabled, don't allow the click to go to the navigation page
        });


        $body.on("PageVisible", function() {
            pathname = $(location).attr("pathname"); // update current URL
            $(".thr-well-icon, .thr-settings-icon").attr("href", ""); // fix iPad "/navigation" blinking bug
        });

        $body.on("click", ".active-page .navigationMenu a, a.homeLink", function() {
            var href = $(this).attr("href"),
                newPage = true;

            if(href === "/") { // exact match of home page?
                newPage = pathname === "/" ? false : true; // is pathname also the home page? Then we're not going to a new page

            } else if(pathname.indexOf(href) > -1) {
                newPage = false;
            }

            hideNav();
        });
        /*
         * End Navigation Code
         */

        /*
         * Begin Settings Code
         */
        $body.on("click", ".thr-settings-icon", function(ev, data) {
            if (ios.cancelNav(ev)) {
                return false;
            }

            updateCheckedOptions(); // update currently selected setting options marked with a check accordingly
            $(".active-page .submenu, .active-page .innerSubmenu").hide();

            if (data === 'keybind') {
                $(".active-page .mainSettings").slideDown();
            } else {
                $(".active-page .mainSettings").slideToggle();
            }
            return false; // for those who have JavaScript enabled, don't allow the click to go to the settings page
        });

        $body.on("click", ".active-page .mainSettings:visible > li", function(e) {
             $(".submenu:visible, .innerSubmenu:visible").hide();
             $(this).find(".submenu").show();
        });

        $body.on("click", ".active-page .mainSettings:visible > li > .submenu:visible > li", function(e) {
            $(".innerSubmenu:visible").hide();
            $(this).find(".innerSubmenu").show();
            e.stopPropagation(); // so that the menu does not close (see above handler)
        });

        // slide up when a download type is clicked
        $body.on("click", ".active-page .downloadOptions a ", function() {
            $(".active-page .mainSettings:visible").slideUp();
            logEvent('read', 'download', $(this).attr('data-log'));
        });

        // if the click was made inside one of the menus, don't close the menu
        $body.on("click", ".active-page .mainSettings:visible", function(e) {
            e.stopPropagation();
        });

        // the user is changing a setting, adjust settings and update accordingly
        $body.on("click", ".speechOptions li > span, .pageColorsOptions li > span, .textColorsOptions li > span", function() {
            var $this = $(this);
            changeSetting($this.parent(), $this.attr('class').toLowerCase().replace('.', ''));
            return false;
        });

        $body.on("click", ".active-page .mainSettings:visible .default", function() {
            resetSettings();
            $(".active-page .mainSettings").slideUp();

            // hack for find-page
            if($(".find-page").is(":visible") && $(".find-page").find(".navigationMenu").length !== 0) {
                $(".active-page .thr-well-icon").click(); // this makes sure navigation is closed upon display
            }
        });

        $body.on("click", ".active-page .mainSettings:visible .more", function() {
            var id = $(this).attr('data-id');
            controller.gotoUrl('/reading-controls/?id=' + id);
        });

        // touchstart for touch-screen display
        $(document).on("click", "html, body", function(e) { // if the user clicks anywhere other than one of the menus, hide the menus
            var $menu = $(".active-page .mainSettings");
            if ($menu.is(":visible")) {
                $menu.slideUp();
                return false;
            }
        });
        /*
         * End Settings Code
         */
    }); // end ready

    function changeSetting($element, text) {
        var parentClass = $element.parent().attr("class").toLowerCase()
                            .replace(/inner|submenu|\s+/g, ""), // remove "submenu" and "innerSubmenu"
            value,
            option = "",
            currentSettings = getCurrentSettings();

        if(parentClass === "speechoptions") { // which option are we dealing with?
            value = options.getOptionByValue("speech", text);
            option = "voice";

        } else if(parentClass === "pagecolorsoptions") {
            value = options.getOptionByValue("colors", text);
            option = "pageColor";

        } else if(parentClass === "textcolorsoptions") {
            value = options.getOptionByValue("colors", text);
            option = "textColor";
        }

        if (option && value) {
            logEvent('read', 'setting', option + '=' + value);
            state.set(option, value);
        }
        updateFavoritesPageUrl();
        updateCheckedOptions(); // update the check marks next to the currently selected options
    }

    function getCurrentSettings() {
        return {
            speech: state.get(settings[0]),
            pageColor: state.get(settings[1]),
            textColor: state.get(settings[2])
        };
    }

    function resetSettings() {
        var currentSettings = getCurrentSettings();
        // set default options
        for(var option in defaultOptions) {
            state.set(option, defaultOptions[option]);
        }
        updateFavoritesPageUrl(); // update the url if we are on the favorites page
        updateCheckedOptions();
    }

    function updateCheckedOptions() {
        var currentSettings = getCurrentSettings(),
            view,
            needsMenu = $('.active-page div.header:not(:has(.mainSettings))');
        // create settings menu if it doesn't already exist
        if (needsMenu.length !== 0) {
            var id = needsMenu.attr('data-id'),
                voice = currentSettings.speech;
            needsMenu.append(templates.render('settings', {ID: id, voice: voice}));
        }
        $(".checked").removeClass("checked");
        // update the currently set options with a check mark next to them
        $(".speechOptions ." + options.getKeyByValue("speech", currentSettings.speech)).addClass("checked");
        $(".pageColorsOptions ." + options.getKeyByValue("colors", currentSettings.pageColor)).addClass("checked");
        $(".textColorsOptions ." + options.getKeyByValue("colors", currentSettings.textColor)).addClass("checked");
        // update the color stylesheet in the head
        view = {
            pageColor: currentSettings.pageColor,
            textColor: currentSettings.textColor
        };
        $('.styleColors').replaceWith(templates.render('styleColor', view));
    }

    function updateFavoritesPageUrl() {
        var $favPage = $(".favorites-page");
         // need to modify the URL here if we are on the favorites page
        if($favPage.length !== 0 && $favPage.hasClass("active-page")) {
            window.location.href = '/favorites/';
        } else {
            controller.stateChange();
        }
    }

    function initKeyControls() {
        var keyCode,
            url;
        // if ENTER is pressed on the well or gear icon, go to that page
        $('body').on('keydown', '.thr-well-icon, .thr-settings-icon', function(e) {
            keyCode = e.keyCode || e.which;
            if(keyCode === 13) {
                //console.log("clicked enter");
                window.location.href = $(this).is('.thr-well-icon') ? '/navigation/' : '/reading-controls/';
            }
        }); // end keydown on icons
    } // end initKeyControls
}); // end require
