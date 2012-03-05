define([ "state",
         "requirejs.mustache",
         "json!../Templates.json"
         ],
        function(state, mustache, Templates) {
            return {
                render: function(name, view) {
                    return mustache.render(Templates[name], view);
                },
                searchForm: function() {
                    var searchD = Templates['searchForm'];
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
                    return mustache.render(Templates.form, searchD);
                },
                get: function(name) {
                    return Templates[name];
                },
                setImageSizes: function(p) {
                    if (p.width > p.height) {
                        p.pw = 100;
                        p.ph = 100*p.height/p.width;
                        p.pm = (100 - p.ph) / 2;
                    } else {
                        p.ph = 100;
                        p.pw = 100*p.width/p.height;
                        p.pm = 0;
                    }
                }
            };
        });