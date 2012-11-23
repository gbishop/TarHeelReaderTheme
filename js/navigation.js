// Code for navigation and settings menus
require(["jquery", "state", "controller", "hoverIntent"], function($, state, controller) {
    
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
            selectorString = ".navigation > li, .mainSettings > li",
            currentSettings = getCurrentSettings();
            
        // initialize the keybindings
        initNavKeybindings();
        
        /*
         * Begin Navigation Code
         */
        $body.on("click", selectorString, function(e) { // on click, show the submenus accordingly
             $(".submenu:visible, .innerSubmenu:visible").hide();
             $(this).find(".submenu").show();
             console.log("clicked submenu");
        });
        
        $body.on("click", ".mainSettings > li > .submenu > li", function(e) {
            $(".innerSubmenu:visible").hide();
            $(this).find(".innerSubmenu").show();
            return false;
        }); 
    
        $body.on("click", ".navigation, .mainSettings", function(e) { // if the click was made inside one of the menus, don't close the menu
            if($(this).is(":visible")) {
                e.stopPropagation();
            }
        });
        
        // Show the nav panel on home icon click, and the settings panel on settings icon click
        $body.on('click', ".thr-home-icon img", function(e, data) {
            data === 'keybind' ? $(".navigation").slideDown() : $(".navigation").slideToggle();
            $(".mainSettings:visible").slideUp(); // hide settings
            $(".submenu").hide();
            
            /*
             *              Why is the click event fired multiple times when it 
             *              is clearly only fired once (console verifies that it is triggered only once)?
             * 
             */
            console.log(data || "not triggered by a keypress");
            console.log(e.target);
            return false; // for those who have JavaScript enabled, don't allow the click to go to the home page
        });
        
        $body.on("click", ".thr-settings-icon img", function(e, data) {
            updateCheckedOptions(); // update currently selected setting options marked with a check accordingly
            data === 'keybind' ? $(".mainSettings").slideDown() : $(".mainSettings").slideToggle();
            $(".navigation:visible").slideUp(); // hide navigation
            $(".submenu").hide();
            return false; // for those who have JavaScript enabled, don't allow the click to go to the settings page
        });

        $(document).on("click", "head, body", function(e) { // if the user clicks anywhere other than one of the menus, hide the menus
            $(".navigation, .mainSettings").slideUp();
            e.stopPropagation();
        }); 
        /*
         * End Navigation Code
         */
        
        /* 
         * Begin Settings Code
         */
        
        // the user is changing a setting, adjust settings and update accordingly
        $body.on("click", "#speechOptions li > a, #pageColorsOptions li > a, #textColorsOptions li > a", function() {
            // deal with the anchor's parent <li>
            var $parent = $(this).parent();
            changeSetting($parent, $parent.text().toLowerCase());
            return false;
        });
        
        $body.on("click", ".mainSettings #default", function() {
            resetSettings();
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
          /*
          // allows us to create two objects that will inherit from menuState
          if(typeof Object.create !== 'function') {
              Object.create = function(object) {
                  var F = function() {};
                  F.prototype = object;
                  return new F();
              };
          }
          */

          $.extend(true, settingsState, navState); // create the new object with deep copy
          console.log('Deeply copied object');
          
          console.log('Setting bounds');
          navState.setBounds($(".navigation > li").length, 'mainMenu');
          settingsState.setBounds($(".mainSettings > li").length, 'mainMenu');
          
          // open up navigation or settings menu on tab
          //$("body").off("keypress", ".thr-home-icon").on("keypress", ".thr-home-icon", function(e) {
            $("body").on("keydown", ".thr-home-icon, .thr-settings-icon", function(e) {
               keyCode = e.keyCode || e.which;
              
              //if(!$(".navigation").is(":visible")) navState.resetIndices();
              
              if(keyCode == 9) { // if tab is pressed...
                  //$(".thr-home-icon img").trigger('click', "keybind");
                  
                  var $this = $(this);
                  console.log($this);
                  $this.find("img").trigger('click', 'keybind');
                  if($this.is($(".thr-home-icon"))) {
                      console.log('resetting indices');
                      navState.resetIndices();
                      $(".navigation > li:first-child").addClass("selectedLink");
                  } else {
                      console.log('resetting settings');
                      settingsState.resetIndices();
                      $(".mainSettings > li:first-child").addClass("selectedLink");
                  }
              }
              
             //e.stopPropagation();
          }); // end on
          
          $("body").on("keydown", function(e) {
             keyCode = e.keyCode || e.which;
              
              // are any of the menus open?
             if((isNavMenuOpen = $(".navigation").is(":visible")) || $(".mainSettings").is(":visible")) { 
                // decide which menu is open
                if(isNavMenuOpen) {
                    $openMenu = $(".navigation:visible");
                    openMenuState = navState;
                } else {
                    $openMenu = $(".mainSettings:visible");
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
                        $openMenu.children("li").find(".submenu:visible .innerSubmenu > li")
                                                .eq(openMenuState.getIndex('innerSubMenu'))
                                                .addClass("selectedLink");
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
                        $openMenu.children("li").find(".submenu:visible .innerSubmenu > li")
                                                .eq(openMenuState.getIndex('innerSubMenu'))
                                                .addClass("selectedLink");
                    } else {
                        openMenuState.incrementIndex('mainMenu');
                        $openMenu.children("li").eq(openMenuState.getIndex('mainMenu'))
                                                .addClass("selectedLink");

                    }
                    
                    return false;
                    
                 } else if(keyCode == 37 && $openMenu.is(".navigation:visible")  || // LEFT for navigation
                                (keyCode == 39 && $openMenu.is(".mainSettings:visible"))) { // RIGHT for mainSettings
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
                     
                 } else if(keyCode == 39 && $openMenu.is(".navigation:visible")  || // RIGHT for navigation
                                (keyCode == 37 && $openMenu.is(".mainSettings:visible"))) { // LEFT for settings
                                    
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
                 }
              }
          }); // end on keydown
          
      } // end initNavKeyBinds
      
}); // end require