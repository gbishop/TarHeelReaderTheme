all: testprod

manifest:
	python tools/manifest.py > manifest.appcache

transifex:
	tx pull -f -l es_MX,fr_FR,de,pt_PT,tr,it,zh
	mv languages/fr_FR.po languages/fr.po
	mv languages/pt_PT.po languages/pt.po
	mv languages/es_MX.po languages/es.po

locale/%/LC_MESSAGES/thr.mo: languages/%.po
	mkdir -p $(dir $@)
	msgfmt $< --output-file $@

Templates.en.json: templates/*.html searchForm.json readingForm.json categories.json languages.json ratings.json locales.json
	python tools/BuildTemplate.py -compact --lang=en --output=$@ $^

Templates.%.json: languages/%.po locale/%/LC_MESSAGES/thr.mo templates/*.html searchForm.json readingForm.json categories.json languages.json ratings.json locales.json
	python tools/BuildTemplate.py -compact --lang=$* --output=$@ templates/*.html searchForm.json readingForm.json categories.json languages.json ratings.json locales.json

build: Templates.en.json Templates.de.json Templates.fr.json Templates.tr.json Templates.es.json Templates.it.json Templates.pt.json Templates.zh.json style.css
	rm -f manifest.appcache

style.css: tools/MakeMediaQueries.py style.scss css/_allmediaqueries.scss css/_classes.scss css/_collections.scss css/_fileuploader.scss css/_ie.scss css/_image-gallery.scss css/_map-page.scss css/_mixins.scss css/_reset.scss css/_writebooks.scss css/_yourbooks.scss css/_offline.scss
	python tools/MakeMediaQueries.py > css/_mediaqueries.scss
	sass --style=compressed style.scss style.css

translate:
	python tools/BuildTemplate.py --lang=en --extract=languages/thr.pot templates/*.html searchForm.json readingForm.json categories.json languages.json ratings.json locales.json

copygb:
	rsync -az --exclude .git --exclude tests/robot --delete . gbserver3:/var/www/tarheelreader/wp-content/themes/thr3
	#launch.py http://gbserver3a.cs.unc.edu/

copyproduction:
	rsync -az --delete ../Theme-build/ gbserver3:/var/www/tarheelreader3/wp-content/themes/thr3
	#launch.py http://tarheelreader.org/

optimized: build
	rm -rf ../Theme-build/*
	nodejs ../r.js -o js/app.build.js
	cp --parents -r *.php *.json EPub PowerPoint js/main-combined.js js/json2.min.js js/modernizr.custom.js js/require.min.js *.swf *.png images speech style.css ../Theme-build
	mv ../Theme-build/js/main-combined.js ../Theme-build/js/main.js
	make versioned
	python tools/manifest.py ../Theme-build/used.txt > ../Theme-build/manifest.appcache

versioned:
	cd ../Theme-build; python ../Theme/tools/EditFileVersions.py --used used.txt *.php js/main.js style.css Templates*.json

testprod:
	make optimized
	rsync -az --delete ../Theme-build/ gbserver3:/var/www/test.tarheelreader.org/wp-content/themes/thr3

production:
	make optimized
	cd ../Theme-build; make copyproduction

siteSpeech: build
	python tools/makeSiteSpeech.py Templates.*.json
	# if the speech file is too short, the flash player loops, need a better fix than this
	lame --quiet --preset phon+ speech/en-1star-c.mp3 speech/foo.mp3
	mv speech/foo.mp3 speech/en-1star-c.mp3
	lame --quiet --preset phon+ speech/en-1star-f.mp3 speech/foo.mp3
	mv speech/foo.mp3 speech/en-1star-f.mp3
