define([ "state",
         "requirejs.mustache",
         "json!../Templates.en.json"
         ],
        function(state, mustache, Templates) {
            var localeTemplates = {};
            localeTemplates['en'] = Templates;
            var uniqueID = 0;

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
            function completeSearchForm() {
                // flesh out the searchForm data with categories and language
                var searchD = getTemplate('searchForm');
                // only do this work once
                if ('completed' in searchD) return;
                for (var j=0; j<searchD.controls.length; j++) {
                    var control = searchD.controls[j];
                    if (control.name == 'category') {
                        control.options = control.options.slice(0,1).concat(getTemplate('categories'));
                    } else if (control.name == 'language') {
                        control.options = getTemplate('languages');
                    }
                }
                searchD.completed = true;
            }
            function searchForm() {
                var searchD = getTemplate('searchForm');
                for (var j=0; j<searchD.controls.length; j++) {
                    var control = searchD.controls[j];
                    control.unique = uniqueID;
                    uniqueID += 1;
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
                    p.ph = Math.round(100*p.height/p.width);
                    p.pm = (100 - p.ph) / 2;
                } else {
                    p.ph = 100;
                    p.pw = Math.round(100*p.width/p.height);
                    p.pm = 0;
                }
            }
            function setTemplateLocale() {
                var $def = $.Deferred();
                var locale = state.get('locale');
                if (locale in localeTemplates) {
                    completeSearchForm();
                    $def.resolve();
                } else {
                    var locales = getTemplate('locales');
                    var url = '';
                    for(var i=0; i < locales.length; i++) {
                        if (locales[i].value == locale) {
                            url = locales[i].templates;
                            break;
                        }
                    }
                    if (url) {
                        $.get(url,
                            function(data) {
                                localeTemplates[locale] = data;
                                completeSearchForm();
                                $def.resolve();
                            }, 'json');
                    } else {
                        console.log('setTemplateLocale failed on', locale);
                        completeSearchForm();
                        $def.resolve();
                    }
                }
                return $def;
            }

            function rating_info(rating_value) {
                ratings = getTemplate('ratings');
                if (rating_value === 0) {
                    return ratings[0];
                } else {
                    index = Math.round(rating_value * 2) - 1;
                    return ratings[index];
                }
            }

            return {
                render: renderTemplate,
                searchForm: searchForm,
                get: getTemplate,
                setImageSizes: setImageSizes,
                setLocale: setTemplateLocale,
                rating_info: rating_info
            };
        });
