all: gb

build:
	python MakeMediaQueries.py > css/_mediaqueries.scss
	python BuildTemplate.py --lang=en --output=Templates.json templates/*.html searchForm.json readingForm.json categories.json languages.json ratings.json locales.json
	python BuildTemplate.py --lang=de --output=Templates.de.json templates/*.html searchForm.json readingForm.json categories.json languages.json ratings.json locales.json
	sass --style=compact style.scss style.css

translate:
	python BuildTemplate.py --lang=en --extract=languages/thr.pot --output=Templates.json templates/*.html searchForm.json readingForm.json categories.json languages.json ratings.json locales.json

copygb:
	rsync -az --delete . gbserver3:/var/www/tarheelreader/wp-content/themes/thr3
	launch.py http://gbserver3.cs.unc.edu/

copyproduction:
	rsync -az --delete . gbserver3:/var/www/TarHeelReader/wp-content/themes/thr3
	launch.py http://tarheelreader3.cs.unc.edu/

gb: build copygb

cenk: build
	rsync -az --delete . gbserver3s:/var/www/tarheelreader/wp-content/themes/thr3


optimized:
	rm -rf ../Theme-build/*
	cd js; node ../../r.js -o app.build.js
	cd ../Theme-build; make versioned

versioned: build
	python EditFileVersions.py --staticHost=$(STATICHOST) *.php js/main.js style.css Templates*.json

gbopt: optimized
	cd ../Theme-build; make copygb

production:
	make optimized STATICHOST=http://tarheelreader3s.cs.unc.edu
	cd ../Theme-build; make copyproduction
