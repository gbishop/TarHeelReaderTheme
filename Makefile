HOST=gbserver.cs.unc.edu

dev: DOMAIN=dev-shared.tarheelreader.org
dev: SRC=.
dev: build copy copyshared

production: DOMAIN=shared.tarheelreader.org
production: SRC=../Theme-build/
production: optimized copy symbols

copy:
	rsync -az --delete --exclude .git --exclude tests/robot $(SRC) $(HOST):/var/www/$(DOMAIN)/theme/

copyshared:
	rsync -az --exclude .git shared/build/ $(HOST):/var/www/$(DOMAIN)/theme/shared/

manifest:
	python tools/manifest.py > manifest.appcache

transifex:
	tx pull -f -l es_MX,fr_FR,de,pt_PT,tr,it,zh,nb
	mv languages/fr_FR.po languages/fr.po
	mv languages/pt_PT.po languages/pt.po
	mv languages/es_MX.po languages/es.po
	mv languages/nb.po languages/no.po

locale/%/LC_MESSAGES/thr.mo: languages/%.po
	mkdir -p $(dir $@)
	msgfmt $< --output-file $@

Templates.en.json: templates/*.html searchForm.json readingForm.json categories.json languages.json ratings.json locales.json
	python tools/BuildTemplate.py -compact --lang=en --output=$@ $^

Templates.%.json: languages/%.po locale/%/LC_MESSAGES/thr.mo templates/*.html searchForm.json readingForm.json categories.json languages.json ratings.json locales.json
	python tools/BuildTemplate.py -compact --lang=$* --output=$@ templates/*.html searchForm.json readingForm.json categories.json languages.json ratings.json locales.json

build: Templates.en.json Templates.de.json Templates.fr.json Templates.tr.json Templates.es.json Templates.it.json Templates.pt.json Templates.zh.json Templates.no.json style.css
	rm -f manifest.appcache
	cd shared; npm run build

style.css: tools/MakeMediaQueries.py style.scss css/_allmediaqueries.scss css/_classes.scss css/_collections.scss css/_fileuploader.scss css/_ie.scss css/_image-gallery.scss css/_map-page.scss css/_mixins.scss css/_reset.scss css/_writebooks.scss css/_yourbooks.scss css/_offline.scss
	python tools/MakeMediaQueries.py > css/_mediaqueries.scss
	sass --style=compressed style.scss style.css

translate:
	python tools/BuildTemplate.py --lang=en --extract=languages/thr.pot templates/*.html searchForm.json readingForm.json categories.json languages.json ratings.json locales.json

optimized: build
	rm -rf ../Theme-build/*
	node ../r.js -o js/app.build.js
	cp --parents -r *.php *.json EPub PowerPoint js/main-combined.js js/json2.min.js js/modernizr.custom.js js/require.min.js *.swf *.png images speech style.css ../Theme-build
	mv ../Theme-build/js/main-combined.js ../Theme-build/js/main.js
	make versioned
	cp -a shared/build/ ../Theme-build/shared

versioned:
	cd ../Theme-build; python ../Theme/tools/EditFileVersions.py --used used.txt *.php js/main.js style.css Templates*.json

release: optimized
	cd ../Theme-build; tar czf /home/gb/Sync/gbservers/roles/wordpress/files/thsr-theme.bz2 --exclude=.git --exclude=test .

symbols:
	rsync ../../symbols.dynavox/* gbserver:/var/www/shared.tarheelreader.org/shared/symbols

siteSpeech: build
	python tools/makeSiteSpeech.py Templates.*.json
	# if the speech file is too short, the flash player loops, need a better fix than this
	lame --quiet --preset phon+ speech/en-1star-c.mp3 speech/foo.mp3
	mv speech/foo.mp3 speech/en-1star-c.mp3
	lame --quiet --preset phon+ speech/en-1star-f.mp3 speech/foo.mp3
	mv speech/foo.mp3 speech/en-1star-f.mp3
