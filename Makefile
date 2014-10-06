all: build copygb

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

style.css: tools/MakeMediaQueries.py style.scss css/_allmediaqueries.scss css/_classes.scss css/_collections.scss css/_fileuploader.scss css/_ie.scss css/_image-gallery.scss css/_map-page.scss css/_mixins.scss css/_reset.scss css/_writebooks.scss css/_yourbooks.scss
	python tools/MakeMediaQueries.py > css/_mediaqueries.scss
	sass --style=compact style.scss style.css

translate:
	python tools/BuildTemplate.py --lang=en --extract=languages/thr.pot templates/*.html searchForm.json readingForm.json categories.json languages.json ratings.json locales.json

copyameem:
	rsync -az --delete . gbserver3:/var/www/tarheelreader/wp-content/themes/thr3
	#launch.py http://gbserver3.cs.unc.edu/

copygb:
	rsync -az --delete . gbserver3:/var/www/tarheelreader/wp-content/themes/thr3
	#launch.py http://gbserver3a.cs.unc.edu/

copyproduction:
	rsync -az --delete . gbserver3:/var/www/tarheelreader3/wp-content/themes/thr3
	#launch.py http://tarheelreader.org/

gb: build copygb

cenk: build
	rsync -az --delete . gbserver3s:/var/www/tarheelreader/wp-content/themes/thr3


optimized:
	rm -rf ../Theme-build/*
	cd js; nodejs ../../r.js -o app.build.js
	cd ../Theme-build; make build
	cd ../Theme-build; python tools/AddNewlines.py js/main.js
	make versioned

versioned:
	cd ../Theme-build; python tools/EditFileVersions.py *.php js/main.js style.css Templates*.json

gbopt:
	make optimized STATICHOST=http://tarheelreader3s.cs.unc.edu
	cd ../Theme-build; make copygba

testprod:
	rm -rf ../Theme-build/*
	cd js; nodejs ../../r.js -o app.build.js
	cd ../Theme-build; make build
	cd ../Theme-build; make copygba

production:
	make optimized STATICHOST=http://tarheelreader3s.cs.unc.edu
	cd ../Theme-build; make copyproduction

siteSpeech: build
	python tools/makeSiteSpeech.py Templates.*.json
	# if the speech file is too short, the flash player loops, need a better fix than this
	lame --quiet --preset phon+ speech/en-1star-c.mp3 speech/foo.mp3
	mv speech/foo.mp3 speech/en-1star-c.mp3
	lame --quiet --preset phon+ speech/en-1star-f.mp3 speech/foo.mp3
	mv speech/foo.mp3 speech/en-1star-f.mp3
