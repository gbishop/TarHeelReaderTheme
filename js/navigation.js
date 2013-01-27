// Code for navigation and settings menus
require(["state", "controller", "templates"], function(state, controller, templates) {
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
                    }
          },
          defaultOptions = {
              voice: {
                  newValue: options.speech.silent
              },
              pageColor: {
                  newValue: options.colors.white
              },
              textColor: {
                  newValue: options.colors.black
              }
          };

    $(function() {
        var $body = $("body"),
            currentSettings = getCurrentSettings(),
            pathname;

        initKeyControls(); // initialize the keybindings for the menu/settings

        /*
         * Begin Navigation Code
         */
        $body.on("click", ".thr-well-icon img", function(e, data) {
            e.preventDefault();
            var $contentWrap = $(".active-page .content-wrap"),
                $navigation = $contentWrap.find(".navigationMenu"),
                $hiddenContent = $contentWrap.find(".hiddenContent");

            if($navigation.length === 0) { // nav doesn't exist, load it
                $contentWrap.wrapInner("<div class='hiddenContent' />").
                             prepend(templates.render('navigation', null));

                $(".active-page").find(".navigationMenu")
                                 .hide()
                                 .slideDown()
                                 .end()
                                 .find(".hiddenContent")
                                 .fadeOut(200);

            } else if(!$navigation.is(":visible")) {
                $hiddenContent.fadeOut(function() {
                    $navigation.slideDown();
                }); // end fadeOut
            } else {
                $navigation.fadeOut(50, function() {
                    $hiddenContent.fadeIn();
                }); // end slideUp
            }
            $navigation.find(".secondaryNav").hide();

            return false; // for those who have JavaScript enabled, don't allow the click to go to the navigation page
        });

        $body.on("PageVisible", function() {
            pathname = $(location).attr("pathname"); // update current URL
            $(".thr-well-icon, .thr-settings-icon").attr("href", ""); // fix iPad "/navigation" blinking bug
            if($(".content-wrap").length === 1) { return; } // initial entrance to website, avoid "double slidedown" bug

            $(".active-page").find(".content-wrap")
                             .hide()
                             .slideDown(600, "swing");
        });

       $body.on("click", ".active-page .navigationMenu a, a.homeLink", function() {
            var href = $(this).attr("href"),
                newPage = true;

            if(href === "/") { // exact match of home page?
                newPage = pathname === "/" ? false : true; // is pathname also the home page? Then we're not going to a new page

            } else if(pathname.indexOf(href) > -1) {
                newPage = false;
            }
            // if it's a new page, then just slide the navigation up; else, slide up navigation and show .hiddenContent
            newPage ? $(".active-page .navigationMenu").slideUp(150) : $(".active-page .thr-well-icon img").trigger("click", href);
        });
        /*
         * End Navigation Code
         */

        /*
         * Begin Settings Code
         */
        $body.on("click", ".thr-settings-icon img", function(e, data) {
            updateCheckedOptions(); // update currently selected setting options marked with a check accordingly
            $(".active-page .submenu, .active-page .innerSubmenu").hide();

            data === 'keybind' ? $(".active-page .mainSettings").slideDown() : $(".active-page .mainSettings").slideToggle();
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
        });

        // if the click was made inside one of the menus, don't close the menu
        $body.on("click touchstart", ".active-page .mainSettings:visible", function(e) {
            e.stopPropagation();
        });

        // the user is changing a setting, adjust settings and update accordingly
        $body.on("click", ".speechOptions li > span, .pageColorsOptions li > span, .textColorsOptions li > span", function() {
            var $parent = $(this).parent(); // deal with the anchor's parent <li>
            changeSetting($parent, $parent.text().toLowerCase());
            return false;
        });

        $body.on("click", ".active-page .mainSettings:visible .default", function() {
            resetSettings();
            $(".active-page .mainSettings").slideUp();

            // hack for find-page
            if($(".find-page").is(":visible") && $(".find-page").find(".navigationMenu").length !== 0) {
                $(".active-page .thr-well-icon img").click(); // this makes sure navigation is closed upon display
            }
        });

        // touchstart for touch-screen display
        $(document).on("click touchstart", "html, body", function(e) { // if the user clicks anywhere other than one of the menus, hide the menus
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
              optionObj = {},
              option = "",
              currentSettings = getCurrentSettings();

          if(parentClass === "speechoptions") { // which option are we dealing with?
              value = getOptionValue("speech", text);
              option = "voice";

          } else if(parentClass === "pagecolorsoptions") {
              value = getOptionValue("colors", text);
              option = "pageColor";

          } else if(parentClass === "textcolorsoptions") {
              value = getOptionValue("colors", text);
              option = "textColor";
          } else { // not a valid option, return
              return;
          }
          
          optionObj[option] = {prevValue: state.get(option), newValue: value};
          state.set(option, value);
          updateFavoritesPageUrl(optionObj);
          controller.stateChange(); // update the page
          updateCheckedOptions(); // update the check marks next to the currently selected options
      }

      function getCurrentSettings() {
         return {
             speech: state.get(settings[0]),
             pageColor: state.get(settings[1]),
             textColor: state.get(settings[2])
         }
      }

      function getOptionValue(category, selectedOption) {
          for(option in options[category]) {
              if(option === selectedOption) {
                  return options[category][option];
              }
          }
          return null;
      }

      function resetSettings() {
          var currentSettings = getCurrentSettings();
          // set default options
          for(var option in defaultOptions) {
              defaultOptions[option].prevValue = currentSettings[option]; // update previous value
              state.set(option, defaultOptions[option].newValue);
          }
          updateFavoritesPageUrl(defaultOptions); // update the url if we are on the favorites page
          controller.stateChange();
          updateCheckedOptions();
      }

      function updateCheckedOptions() {
          var currentSettings = getCurrentSettings(),
              view;
              
          $(".checked").removeClass("checked");
          // update the currently set options with a check mark next to them
          $(".speechOptions ." + currentSettings.speech).addClass("checked");
          $(".pageColorsOptions ." + options.getKeyByValue("colors", currentSettings.pageColor)).addClass("checked");
          $(".textColorsOptions ." + options.getKeyByValue("colors", currentSettings.textColor)).addClass("checked");
          // update the color stylesheet in the head
          view = {
              pageColor: currentSettings.pageColor,
              textColor: currentSettings.textColor
          };
          $('.styleColors').replaceWith(templates.render('styleColor', view));
      }
      
      function updateFavoritesPageUrl(optionsObject) {
          var url = window.location.href,
              innerObj;
          // need to modify the URL here if we are on the favorites page
          if(window.location.search.indexOf("favorites") !== -1) {
              for(var option in optionsObject) {
                  innerObj = optionsObject[option];
                  url = url.replace(option + "=" + innerObj.prevValue, option + "=" + innerObj.newValue);
              }
              window.location.href = url; // update the URl
          }
      }
      
      function initKeyControls() {
          var keyCode;
          // if ENTER is pressed on the well or gear icon, go to that page
          $('body').on('keydown', '.thr-well-icon, .thr-settings-icon', function(e) {
            keyCode = e.keyCode || e.which;
            if(keyCode === 13) {
                window.location.href = $(this).is('.thr-well-icon') ? '/navigation' : '/reading-controls/';
            }
          }); // end keydown on icons
      } // end initKeyControls
}); // end require
