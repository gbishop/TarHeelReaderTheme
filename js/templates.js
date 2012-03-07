define([ "state",
         "requirejs.mustache",
         "json!../Templates.json"
         ],
        function(state, mustache, Templates) {
            var localeTemplates = {};
            localeTemplates['en'] = Templates;

            function getTemplate(name) {
                var locale = state.get('locale');
                var Templates;
                if (locale in localeTemplates) {
                    Templates = localeTemplates[locale];
                } else {
                    Templates = localeTemplates['en'];
                }
                return Templates[name];
            }

            function renderTemplate(name, view) {
                return mustache.render(getTemplate(name), view);
            }
            function searchForm() {
                var searchD = getTemplate('searchForm');
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
                return mustache.render(getTemplate('form'), searchD);
            }
            function setImageSizes(p) {
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
            function setTemplateLocale() {
                var $def = $.Deferred();
                var locale = state.get('locale');
                if (locale in localeTemplates) {
                    $def.resolve();
                } else {
                    $.get('/theme/Templates.' + locale + '.json',
                            function(data) {
                                localeTemplates[locale] = data;
                                $def.resolve();
                            }, 'json');
                }
                return $def;
            }

            return {
                render: renderTemplate,
                searchForm: searchForm,
                get: getTemplate,
                setImageSizes: setImageSizes,
                setLocale: setTemplateLocale
            };
        });