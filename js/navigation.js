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
                    getKeyByValue: function(category, value) { // function to color option by value
                        var object = this[category];
                        for(var option in object) {
                           if(object.hasOwnProperty(option) ) {
                               if(object[option] === value)
                                    return option;
                             }
                        }
                    }
                  };

    $(function() {
        var $body = $("body"),
            currentSettings = getCurrentSettings(),
            pathname;

        initNavKeybindings(); // initialize the keybindings for the menu

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

        // hack for .find-page since we reuse this page
        $body.on("PageRendered", ".find-page", function() {
            $(this).find(".navigationMenu").show().end()
                   .find(".mainSettings").hide();
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
            $(".find-page:visible").find(".navigationMenu").hide() // hack for find.page
                                   .end().find(".hiddenContent").show();
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
            e.stopPropagation();
            e.preventDefault();
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
              option = "";

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

          state.set(option, value);
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
          state.set("voice", options.speech.silent);
          state.set("pageColor", options.colors.white);
          state.set("textColor", options.colors.black);
          controller.stateChange();
          updateCheckedOptions();
      }

      function updateCheckedOptions() {
          $(".checked").removeClass("checked");
          var currentSettings = getCurrentSettings();

          // update the currently set options with a check mark next to them
          $(".speechOptions ." + currentSettings.speech).addClass("checked");
          $(".pageColorsOptions ." + options.getKeyByValue("colors", currentSettings.pageColor)).addClass("checked");
          $(".textColorsOptions ." + options.getKeyByValue("colors", currentSettings.textColor)).addClass("checked");
          $('.thr-colors').css({ // update .thr-colors
                 color: '#' + currentSettings.textColor,
                 backgroundColor: '#' + currentSettings.pageColor,
                 borderColor: '#' + currentSettings.textColor
         });
      }

      // function for navigation via key bindings
      function initNavKeybindings() {
         var navState = {
                  mainMenu: {
                      index: 0,
                      bounds: 0
                  },
                  subMenu: {
                      index: 0,
                      bounds: 0
                  },
                  innerSubMenu: {
                      index: 0,
                      bounds: 0
                  },
                  resetIndices: function() {
                      for(var key in this) {
                         if(this.hasOwnProperty(key) && typeof this[key] !== "function") {
                             this[key].index = this[key] === this.mainMenu ? -1 : 0;
                         }
                      }
                  }, // end function
                  decrementIndex: function(key) {
                      if(this.hasOwnProperty(key) && typeof this[key] !== "function") {
                          this[key].index = (this[key].index == 0) ? this[key].bounds - 1 : this[key].index - 1;
                      }
                  }, // end function
                  incrementIndex: function(key) {
                      if(this.hasOwnProperty(key) && typeof this[key] !== "function") {
                          this[key].index = (this[key].index == this[key].bounds - 1) ? 0 : this[key].index + 1;
                      }
                  }, // end function
                  getIndex: function(key) {
                      if(this.hasOwnProperty(key) && typeof this[key] !== "function") {
                          return this[key].index;
                      }
                  }, // end function
                  setIndex: function(num, key) {
                      if(!isNaN(num) && this.hasOwnProperty(key) && typeof this[key] !== "function") {
                         this[key].index = num;
                         return this; // to allow for cascading
                     }
                  }, // end function
                  setBounds: function(num, key) {
                     if(!isNaN(num) && this.hasOwnProperty(key) && typeof this[key] !== "function") {
                         this[key].bounds = num;
                         return this; // to allow for cascading
                     }
                  }
              },
              settingsState = {},
              isNavMenuOpen,
              isSubMenuOpen,
              isInnerSubMenuOpen,
              $openMenu,
              openMenuState,
              keyCode,
              menuString,
              selectorString,
              selectedClassName = "selectedLink",
              $mainMenuLink,
              $submenuLink,
              $innerSubmenuLink,
              $submenu,
              $innerSubmenu;

          navState.resetIndices();
          $.extend(true, settingsState, navState); // create the new object with deep copy

          // open up navigation or settings menu on enter
          $("body").on("keydown", ".thr-well-icon, .thr-settings-icon", function(e) {

              keyCode = e.keyCode || e.which;
              if(keyCode === 13) { // if enter is pressed on an icon, show menu
                  var $this = $(this),
                      $activePage = $(".active-page");

                  if($this.is(":focus") && !($activePage.find(".navigationMenu").is(":visible")) &&
                                            !($activePage.find(".mainSettings").is(":visible"))) {
                      $this.find("img").trigger('click', 'keybind');
                      if($this.is($(".thr-well-icon"))) {
                         navState.resetIndices();
                      } else if($this.is($(".thr-settings-icon"))){
                         settingsState.resetIndices();
                      }
                      return false;
                  }
              }

          }); // end on

          $("body").on("keydown", function(e) {
             keyCode = e.keyCode || e.which;
             isNavMenuOpen = $(".active-page .navigationMenu").is(":visible");

              // are any of the menus open?
             if(isNavMenuOpen || $(".active-page .mainSettings").is(":visible")) {
                if(isNavMenuOpen) { // decide which menu is open
                    openMenuState = navState;
                    $openMenu = $('.active-page .navigationMenu:visible');
                    navState.setBounds($openMenu.children('li').length, 'mainMenu');

                } else {
                    openMenuState = settingsState;
                    $openMenu = $('.active-page .mainSettings:visible');
                    settingsState.setBounds($openMenu.children('li').length, 'mainMenu');
                }

                isSubMenuOpen = $openMenu.find(".submenu").is(":visible");
                if(isSubMenuOpen) {
                    openMenuState.setBounds($(".submenu:visible > li").length, 'subMenu'); // set bounds
                }

                isInnerSubMenuOpen = isSubMenuOpen && $openMenu.find(".submenu:visible .innerSubmenu").is(":visible");
                if(isInnerSubMenuOpen) {
                    openMenuState.setBounds($(".submenu:visible .innerSubmenu:visible > li").length, 'innerSubMenu');
                }

                // handle the key events
                if(keyCode === 38) { // Up Arrow: Previous Choice
                    $("." + selectedClassName).removeClass(selectedClassName);

                    if(isSubMenuOpen && !isInnerSubMenuOpen) { // only .submenu open
                        menuString = "subMenu";
                        selectorString = ".submenu:visible > li";
                    } else if(isSubMenuOpen && isInnerSubMenuOpen) { // both .submenu and .innerSubmenu open
                        menuString = "innerSubMenu";
                        selectorString = "submenu:visible .innerSubmenu:visible > li";

                    } else {
                        openMenuState.decrementIndex('mainMenu');
                        $openMenu.children("li").eq(openMenuState.getIndex('mainMenu'))
                                                .addClass("selectedLink");
                        return false;
                    }

                    openMenuState.decrementIndex(menuString);
                    $openMenu.children("li").find(selectorString)
                                            .eq(openMenuState.getIndex(menuString))
                                            .addClass(selectedClassName);

                    return false;

                 } else if(keyCode === 32 || keyCode === 39) { // Space/Right Arrow: Next Choice
                    $("." + selectedClassName).removeClass(selectedClassName);

                    if(isSubMenuOpen && !isInnerSubMenuOpen) { // only .submenu open
                        menuString = "subMenu";
                        selectorString = ".submenu:visible > li";
                    } else if(isSubMenuOpen && isInnerSubMenuOpen) { // both .submenu and .innerSubmenu open
                        menuString = "innerSubMenu";
                        selectorString = ".submenu:visible .innerSubmenu:visible > li";

                    } else {
                        openMenuState.incrementIndex('mainMenu');
                        $openMenu.children("li").eq(openMenuState.getIndex('mainMenu'))
                                                .addClass("selectedLink");
                        return false;
                    }

                    openMenuState.incrementIndex(menuString);
                    $openMenu.children("li").find(selectorString)
                                            .eq(openMenuState.getIndex(menuString))
                                            .addClass(selectedClassName);
                    return false;

                  } else if(keyCode === 37) { // Left Arrow: Back one level/Close menu

                    $("." + selectedClassName).removeClass(selectedClassName);

                    if(isSubMenuOpen && !isInnerSubMenuOpen) {
                        $(".submenu").hide();
                        openMenuState.setIndex(0, 'subMenu');
                        $openMenu.children("li").eq(openMenuState.getIndex('mainMenu'))
                                                .addClass(selectedClassName);

                    } else if(isSubMenuOpen && isInnerSubMenuOpen) {
                        $(".innerSubmenu").hide();
                        openMenuState.setIndex(0, 'innerSubMenu');
                        $openMenu.find(".submenu:visible > li").eq(openMenuState.getIndex('subMenu'))
                                                                .addClass(selectedClassName);
                    } else { // only mainMenu is open, hide it
                       var $activePage = $(".active-page");
                       if($openMenu.is($activePage.find(".mainNav")) || $openMenu.is($activePage.find(".secondaryNav"))) {
                           $activePage.find(".thr-well-icon img").trigger("click");
                       } else {
                           $activePage.find(".thr-settings-icon img").trigger("click");
                       }
                    }

                 } else if(keyCode === 13 || keyCode === 40) { // Enter or Down Arrow: Chooser

                    $("." + selectedClassName).removeClass(selectedClassName);

                    if(isSubMenuOpen && !isInnerSubMenuOpen) { // only .submenu open
                        $submenuLink = $openMenu.children("li").find(".submenu:visible > li")
                                                               .eq(openMenuState.getIndex('subMenu'));
                        $innerSubmenu = $submenuLink.find(".innerSubmenu");

                        if($innerSubmenu.length > 0) { // is there an innerSubmenu?
                            $submenuLink.trigger('click'); // then click the link
                            $innerSubmenu.children("li").first()
                                                        .addClass(selectedClassName);
                        } else {
                            // if no .innerSubmenu exists, execute the action
                            var $anchor = $submenuLink.find("a"),
                                $element =  $anchor ? $anchor : $submenuLink.find("span");


                            $element.trigger("click").parent().addClass(selectedClassName)

                        }

                    } else if(isSubMenuOpen && isInnerSubMenuOpen) { // both .innerSubmenu and .submenu are open, click it
                        $(".innerSubmenu:visible > li").eq(openMenuState.getIndex("innerSubMenu"))
                                                       .find("span").trigger("click")
                                                       .parent().addClass(selectedClassName);

                    } else { // only mainMenu is open
                       var $mainMenuLink = $openMenu.children("li").eq(openMenuState.getIndex("mainMenu")),
                           $submenu = $mainMenuLink.find(".submenu");


                       if($submenu.length > 0) { // does the link have a submenu?
                           $mainMenuLink.trigger("click");
                           $submenu.find("li:first-child").addClass(selectedClassName);
                       } else {
                           $mainMenuLink.find("a").trigger("click")
                                        .end().addClass(selectedClassName);
                       }
                    }
                    return false;
                 } // end Enter or Down Arrow key events
              } // end isNavMenu open or isSettingsMenu open if
          }); // end on keydown

      } // end initNavKeyBinds

}); // end require
