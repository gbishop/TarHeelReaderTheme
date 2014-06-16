all: build copygb

locale/de/LC_MESSAGES/thr.mo: languages/de.po
	mkdir -p locale/de/LC_MESSAGES
	msgfmt languages/de.po --output-file locale/de/LC_MESSAGES/thr.mo

Templates.de.json: languages/de.po locale/de/LC_MESSAGES/thr.mo Templates.en.json
	python tools/BuildTemplate.py -compact --lang=de --output=Templates.de.json templates/*.html searchForm.json readingForm.json categories.json languages.json ratings.json locales.json

locale/es/LC_MESSAGES/thr.mo: languages/es.po
	mkdir -p locale/es/LC_MESSAGES
	msgfmt languages/es.po --output-file locale/es/LC_MESSAGES/thr.mo

Templates.es.json: languages/es.po locale/es/LC_MESSAGES/thr.mo Templates.en.json
	python tools/BuildTemplate.py -compact --lang=es --output=Templates.es.json templates/*.html searchForm.json readingForm.json categories.json languages.json ratings.json locales.json

locale/fr/LC_MESSAGES/thr.mo: languages/fr.po
	mkdir -p locale/fr/LC_MESSAGES
	msgfmt languages/fr.po --output-file locale/fr/LC_MESSAGES/thr.mo

Templates.fr.json: languages/fr.po locale/fr/LC_MESSAGES/thr.mo Templates.en.json
	python tools/BuildTemplate.py -compact --lang=fr --output=Templates.fr.json templates/*.html searchForm.json readingForm.json categories.json languages.json ratings.json locales.json

locale/it/LC_MESSAGES/thr.mo: languages/it.po
	mkdir -p locale/it/LC_MESSAGES
	msgfmt languages/it.po --output-file locale/it/LC_MESSAGES/thr.mo

Templates.it.json: languages/it.po locale/it/LC_MESSAGES/thr.mo Templates.en.json
	python tools/BuildTemplate.py -compact --lang=it --output=Templates.it.json templates/*.html searchForm.json readingForm.json categories.json languages.json ratings.json locales.json

locale/tr/LC_MESSAGES/thr.mo: languages/tr.po
	mkdir -p locale/tr/LC_MESSAGES
	msgfmt languages/tr.po --output-file locale/tr/LC_MESSAGES/thr.mo

Templates.tr.json: languages/tr.po locale/tr/LC_MESSAGES/thr.mo Templates.en.json
	python tools/BuildTemplate.py -compact --lang=tr --output=Templates.tr.json templates/*.html searchForm.json readingForm.json categories.json languages.json ratings.json locales.json

Templates.en.json: tools/BuildTemplate.py templates/*.html searchForm.json readingForm.json categories.json languages.json ratings.json locales.json
	python tools/BuildTemplate.py -compact --lang=en --output=Templates.en.json --extract=languages/thr.pot templates/*.html searchForm.json readingForm.json categories.json languages.json ratings.json locales.json

build: Templates.en.json Templates.de.json Templates.fr.json Templates.tr.json Templates.es.json Templates.it.json style.css

style.css: tools/MakeMediaQueries.py style.scss css/_allmediaqueries.scss css/_classes.scss css/_collections.scss css/_fileuploader.scss css/_ie.scss css/_image-gallery.scss css/_map-page.scss css/_mixins.scss css/_reset.scss css/_writebooks.scss css/_yourbooks.scss
	python tools/MakeMediaQueries.py > css/_mediaqueries.scss
	sass --style=compact style.scss style.css

translate:
	python tools/BuildTemplate.py --lang=en --extract=languages/thr.pot --output=Templates.json templates/*.html searchForm.json readingForm.json categories.json languages.json ratings.json locales.json

copyameem:
	rsync -az --delete . gbserver3:/var/www/tarheelreader/wp-content/themes/thr3
	#launch.py http://gbserver3.cs.unc.edu/

copygb:
	rsync -az --delete . gbserver3:/var/www/tarheelreader/wp-content/themes/thr3
	#launch.py http://gbserver3a.cs.unc.edu/

copyproduction:
	rsync -az --delete . gbserver3:/var/www/tarheelreader3/wp-content/themes/thr3
	launch.py http://tarheelreader.org/

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
