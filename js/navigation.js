// Code for navigation and settings menus
require(["jquery", "state", "controller", "templates"], function($, state, controller, templates) {
    
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
            currentURL,
            hostname = location.hostname;
            
        initNavKeybindings(); // initialize the keybindings for the menu
        
        /*
         * Begin Navigation Code
         */
        
        $body.on("click", ".thr-well-icon img", function(e, data) {
            
            var $contentWrap = $(".active-page .content-wrap"),
                $navigation = $contentWrap.find(".navigationMenu"),
                $hiddenContent = $contentWrap.find(".hiddenContent");
            
            if($navigation.length === 0) { // nav doesn't exist, load it
                $contentWrap.wrapInner("<div class='hiddenContent' />").
                             prepend(templates.render('navigation', null));
                
                $(".active-page").find(".navigationMenu").
                                  hide().slideDown(600).end().
                                  find(".hiddenContent").fadeOut(200);
                              
            } else if(!$navigation.is(":visible")) {
                $hiddenContent.fadeOut(function() {
                    $navigation.slideDown();
                }); // end fadeOut
                
            } else {
                $navigation.slideUp(600, function() {
                    $hiddenContent.fadeIn();
                }); // end slideUp
            }
            
            return false; // for those who have JavaScript enabled, don't allow the click to go to the navigation page
        });
        
        $body.on("click", ".active-page .navigationMenu:visible .more", function() {
            var $secondaryNav = $(".active-page .secondaryNav"),
                $this = $(this);
            
            if(!$secondaryNav.is(":visible")) {
                $this.parent("li").addClass("divider").end().text("Less");
                $secondaryNav.slideDown(300);
                $("html, body").animate({ scrollTop: 1000 }, 600);
                
            } else {
                $this.parent("li").removeClass("divider").end().text("More");
                $secondaryNav.slideUp(300);
                $("html, body").animate({ scrollTop: 0 }, 600);
            }
        });
        
        $body.on("PageRendered", ".find-page", function() {
            $(this).find(".navigationMenu").show();
        });
        
        // update current URL
        $body.on("PageVisible", function() {
            currentURL = $(location).attr("href");
        });
        
       $body.on("click", ".active-page .navigationMenu a:not(.more)", function() {
            var href = $(this).attr("href"),
                strippedURL = currentURL.substring(currentURL.indexOf(hostname)).replace(hostname, ""),
                newPage = true;
                
            console.log(href);
            console.log(strippedURL);
            
            if(href === "/") { // exact match of home page?
                newPage = strippedURL === "/" ? false : true; // is currentURL also the home page? Then we're not going to a new page
        
            } else if(strippedURL.indexOf(href) > -1) {
                newPage = false;
            }
            // if it's a new page, then just slide the navigation up; else, slide up navigation and show hiddenContent
            newPage ? $(".active-page .navigationMenu").slideUp(100) : 
                                        $(".active-page .thr-well-icon img").trigger("click", href);
        });
        /*
         * End Navigation Code
         */
        /* 
         * Begin Settings Code
         */
        $body.on("click", ".thr-settings-icon img", function(e, data) {
            updateCheckedOptions(); // update currently selected setting options marked with a check accordingly
            data === 'keybind' ? $(".active-page #mainSettings").slideDown() : $(".active-page #mainSettings").slideToggle();
            //$(".active-page .navigationMenu:visible").slideUp(); // hide navigation
            $(".submenu:visible").hide();
            return false; // for those who have JavaScript enabled, don't allow the click to go to the settings page
        });
        
        $body.on("click", ".active-page #mainSettings:visible > li", function(e) {
             $(".submenu:visible, .innerSubmenu:visible").hide();
             $(this).find(".submenu").show();
        });
        
        $body.on("click", ".active-page #mainSettings:visible > li > .submenu:visible > li", function(e) {
            $(".innerSubmenu:visible").hide();
            $(this).find(".innerSubmenu").show();
            return false;
        }); 
        
        $body.on("click", ".active-page #mainSettings:visible", function(e) { // if the click was made inside one of the menus, don't close the menu
            e.stopPropagation();
        });
        
        // the user is changing a setting, adjust settings and update accordingly
        $body.on("click", "#speechOptions li > a, #pageColorsOptions li > a, #textColorsOptions li > a", function() {
            // deal with the anchor's parent <li>
            var $parent = $(this).parent();
            changeSetting($parent, $parent.text().toLowerCase());
            return false;
        });

        $body.on("click", ".active-page #mainSettings:visible #default", function() { resetSettings(); });
        
        $(document).on("click", "head, body", function(e) { // if the user clicks anywhere other than one of the menus, hide the menus
            $("#mainSettings").slideUp();
            e.stopPropagation();
        }); 
        /*
         * End Settings Code
         */
      
      }); // end ready
      
      function changeSetting($element, text) {
          var parentID = $element.parent().attr("id").toLowerCase().replace("#", ""),
              value;

          // which option are we dealing with?
          if(parentID == "speechoptions") {
              value = getOptionValue("speech", text);
              state.set("voice", value);
              
          } else if(parentID == "pagecolorsoptions") {
              value = getOptionValue("colors", text);
              state.set("pageColor", value);
              
          } else if(parentID == "textcolorsoptions") {
              value = getOptionValue("colors", text);
              state.set("textColor", value);
          } else {// not a valid option, return
              return; 
          }
          
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
          $("#speechOptions " + "#" + currentSettings.speech).addClass("checked");
          $("#pageColorsOptions " + "." + options.getKeyByValue("colors", currentSettings.pageColor)).addClass("checked");
          $("#textColorsOptions " + "." + options.getKeyByValue("colors", currentSettings.textColor)).addClass("checked");
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
                             this[key].index = 0;
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
              keyCode;

          $.extend(true, settingsState, navState); // create the new object with deep copy
          console.log('Deeply copied object');
          
          console.log('Setting bounds');
          navState.setBounds($(".active-page .navigationMenu > li").length, 'mainMenu');
          settingsState.setBounds($(".active-page #mainSettings > li").length, 'mainMenu');
          
          // open up navigation or settings menu on tab
            $("body").on("keydown", ".thr-well-icon, .thr-settings-icon", function(e) {
               
               eyCode = e.keyCode || e.which;
              if(keyCode == 9) { // if tab is pressed...
                  
                  var $this = $(this);
                  console.log($this);
                  if($this.css("opacity") == 0) { return true; } // only show the corresponding menu if its icon is visible
                  console.log($this.css("opacity"));
                  
                  $this.find("img").trigger('click', 'keybind');
                  if($this.is($(".thr-well-icon"))) {
                      console.log('resetting indices');
                      navState.resetIndices();
                      $(".active-page .navigationMenu:visible > li:first-child").addClass("selectedLink");
                  } else {
                      console.log('resetting settings');
                      settingsState.resetIndices();
                      $(".active-page #mainSettings:visible > li:first-child").addClass("selectedLink");
                  }
              }
             
          }); // end on
          
          $("body").on("keydown", function(e) {
             keyCode = e.keyCode || e.which;
              
              // are any of the menus open?
             if((isNavMenuOpen = $(".active-page .navigationMenu").is(":visible")) || $(".active-page #mainSettings").is(":visible")) { 
                // decide which menu is open
                if(isNavMenuOpen) {
                    $openMenu = $(".active-page .navigationMenu:visible");
                    openMenuState = navState;
                } else {
                    $openMenu = $(".active-page #mainSettings:visible");
                    openMenuState = settingsState;
                }
                
                isSubMenuOpen = $openMenu.find(".submenu").is(":visible");
                if(isSubMenuOpen) openMenuState.setBounds($(".submenu:visible > li").length, 'subMenu'); // set bounds
                
                isInnerSubMenuOpen = isSubMenuOpen && $openMenu.find(".submenu:visible .innerSubmenu").is(":visible");
                if(isInnerSubMenuOpen) openMenuState.setBounds($(".submenu:visible .innerSubmenu:visible > li").length, 'innerSubMenu');
                
                // handle the key events
                if(keyCode == 38) { // UP KEY
                    $(".selectedLink").removeClass("selectedLink");
                    
                    if(isSubMenuOpen && !isInnerSubMenuOpen) {
                        openMenuState.decrementIndex('subMenu');
                        $openMenu.children("li").find(".submenu:visible > li")
                                                .eq(openMenuState.getIndex('subMenu'))
                                                .addClass("selectedLink");
                    } else if(isSubMenuOpen && isInnerSubMenuOpen) {
                        openMenuState.decrementIndex('innerSubMenu');
                        $openMenu.children("li").find(".submenu:visible .innerSubmenu:visible > li")
                                                .eq(openMenuState.getIndex('innerSubMenu'))
                                                .addClass("selectedLink");
                        console.log(openMenuState.getIndex('innerSubMenu'));
                    } else {
                        openMenuState.decrementIndex('mainMenu');
                        $openMenu.children("li").eq(openMenuState.getIndex('mainMenu'))
                                                .addClass("selectedLink");

                    }
                    
                    return false;
                    
                 } else if(keyCode == 40) { // DOWN KEY
                    $(".selectedLink").removeClass("selectedLink");
                    
                    if(isSubMenuOpen && !isInnerSubMenuOpen) {
                        console.log('submenu is open');
                        openMenuState.incrementIndex('subMenu');
                        $openMenu.children("li").find(".submenu:visible > li")
                                                .eq(openMenuState.getIndex('subMenu'))
                                                .addClass("selectedLink");
                                        
                    } else if(isSubMenuOpen && isInnerSubMenuOpen) {
                        openMenuState.incrementIndex('innerSubMenu');
                        $openMenu.children("li").find(".submenu:visible .innerSubmenu:visible > li")
                                                .eq(openMenuState.getIndex('innerSubMenu'))
                                                .addClass("selectedLink");
                        console.log(openMenuState.getIndex('innerSubMenu'));
                    } else {
                        openMenuState.incrementIndex('mainMenu');
                        $openMenu.children("li").eq(openMenuState.getIndex('mainMenu'))
                                                .addClass("selectedLink");

                    }
                    
                    return false;
                    
                 } else if(keyCode == 37 && $openMenu.is(".active-page .navigationMenu:visible")  || // LEFT for navigation
                                (keyCode == 39 && $openMenu.is(".active-page #mainSettings:visible"))) { // RIGHT for mainSettings
                                    
                     $(".selectedLink").removeClass("selectedLink");
                    
                    if(isSubMenuOpen && !isInnerSubMenuOpen) {
                        $(".submenu").hide();
                        openMenuState.setIndex(0, 'subMenu');
                        $openMenu.children("li").eq(openMenuState.getIndex('mainMenu'))
                                                .addClass("selectedLink");
                                        
                    } else if(isSubMenuOpen && isInnerSubMenuOpen) {
                        $(".innerSubmenu").hide();
                        openMenuState.setIndex(0, 'innerSubMenu');
                        $openMenu.find(".submenu:visible > li").eq(openMenuState.getIndex('subMenu'))
                                                                .addClass("selectedLink");
                    } else { // only mainMenu is open
                       // Do nothing if we are on the main menu
                    }
                     
                 } else if(keyCode == 39 && $openMenu.is(".active-page .navigationMenu:visible")  || // RIGHT for navigation
                                (keyCode == 37 && $openMenu.is(".active-page #mainSettings:visible"))) { // LEFT for settings
                                    
                     $(".selectedLink").removeClass("selectedLink");
                    
                    if(isSubMenuOpen && !isInnerSubMenuOpen) {
                        var submenuLink = $openMenu.children("li").find(".submenu:visible > li")
                                          .eq(openMenuState.getIndex('subMenu')),
                            innerSubmenu;
                        if((innerSubmenu = submenuLink.find(".innerSubmenu")).length > 0) { // is there an innerSubmenu?
                            submenuLink.trigger('click');
                            innerSubmenu.children("li").first()
                                                       .addClass("selectedLink");
                        } else { // if not execute the action
                            submenuLink.find("a").trigger('click');
                        }
                                        
                    } else if(isSubMenuOpen && isInnerSubMenuOpen) {
                        $(".innerSubmenu:visible > li").eq(openMenuState.getIndex("innerSubMenu"))
                                                       .find("a")
                                                       .click();
                            console.log(openMenuState.getIndex("innerSubMenu"));
                        
                    } else { // only mainMenu is open
                       var mainMenuLink = $openMenu.children("li").eq(openMenuState.getIndex('mainMenu'));
                       
                       if(mainMenuLink.find(".submenu").length > 0) { // does the link have a submenu?
                           mainMenuLink.trigger('click')
                                       .find('.submenu li:first-child')
                                       .addClass('selectedLink');
                       } else {
                           mainMenuLink.find("a").trigger('click');
                       }
                        
                    }
                 } else if(keyCode == 9 && $openMenu.is(".active-page #mainSettings:visible")) { // tab pressed and mainSettings is open
                    $openMenu.slideUp();
                    console.log("tab pressed, mainSettings visible")
                 } // end if clauses for key codes
              } // end isNavMenu open or isSettingsMenu open if
          }); // end on keydown
          
      } // end initNavKeyBinds
      
}); // end require