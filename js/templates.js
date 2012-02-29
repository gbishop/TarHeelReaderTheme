define([ "state",
         "requirejs.mustache",
         "text!../form.mustache",
         "json!../searchForm.json",
         "text!../heading.mustache",
         "text!../bookList.mustache",
         "text!../find.mustache",
         "text!../preview.mustache",
         "text!../flash.mustache"
         ],
        function(state, mustache, form, searchD, heading, bookList, find, preview, flash) {
            return {
                mustache: mustache,
                searchForm: function() {
                    for (var j=0; j<searchD.controls.length; j++) {
                        var control = searchD.controls[j];
                        if (control.type != 'hidden' && 'name' in control) {
                            control.value = state.get(control.name);
                        }
                        if ('options' in control) {
                            for(var i=0; i<control.options.length; i++) {
                                var option = control.options[i];
                                option.selected = control.value == option.value;
                            }
                        }
                    }
                    return mustache.render(form, searchD);
                },
                heading: function() { return heading; },
                bookList: function(data) { return mustache.render(bookList, data); },
                find: function(view) {
                  return mustache.render(find, view);
                },
                preview: function(book) {
                    return mustache.render(preview, book);
                },
                flash: function(mp3) {
                    return mustache.render(flash, { mp3: encodeURIComponent(mp3) });
                }
            };
        });