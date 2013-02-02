all: build copygba

locale/de/LC_MESSAGES/thr.mo: languages/de.po
	msgfmt languages/de.po --output-file locale/de/LC_MESSAGES/thr.mo

Templates.de.json: languages/de.po locale/de/LC_MESSAGES/thr.mo Templates.en.json
	python tools/BuildTemplate.py --lang=de --output=Templates.de.json templates/*.html searchForm.json readingForm.json categories.json languages.json ratings.json locales.json

Templates.en.json: templates/*.html searchForm.json readingForm.json categories.json languages.json ratings.json locales.json
	python tools/BuildTemplate.py --lang=en --output=Templates.en.json --extract=languages/thr.pot templates/*.html searchForm.json readingForm.json categories.json languages.json ratings.json locales.json

build: Templates.en.json Templates.de.json
	python tools/MakeMediaQueries.py > css/_mediaqueries.scss
	sass --style=compact style.scss style.css

translate:
	python tools/BuildTemplate.py --lang=en --extract=languages/thr.pot --output=Templates.json templates/*.html searchForm.json readingForm.json categories.json languages.json ratings.json locales.json

copyameem:
	rsync -az --delete . gbserver3:/var/www/tarheelreader/wp-content/themes/thr3
	#launch.py http://gbserver3.cs.unc.edu/

copygba:
	rsync -az --delete . gbserver3:/var/www/gbserver3a/wp-content/themes/thr3
	launch.py http://gbserver3a.cs.unc.edu/

copyproduction:
	rsync -az --delete . gbserver3:/var/www/tarheelreader3/wp-content/themes/thr3
	launch.py http://tarheelreader3.cs.unc.edu/

gb: build copygb

cenk: build
	rsync -az --delete . gbserver3s:/var/www/tarheelreader/wp-content/themes/thr3


optimized:
	rm -rf ../Theme-build/*
	cd js; node ../../r.js -o app.build.js
	cd ../Theme-build; make build
	make versioned

versioned:
	cd ../Theme-build; python tools/EditFileVersions.py --staticHost=$(STATICHOST) *.php js/main.js style.css Templates*.json

gbopt: optimized
	cd ../Theme-build; make copygb

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
