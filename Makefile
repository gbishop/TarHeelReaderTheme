all: gb

build:
	python MakeMediaQueries.py > _mediaqueries.scss
	python BuildTemplate.py --lang=en --output=Templates.json templates/*.html searchForm.json readingForm.json categories.json languages.json
	sass --style=compact style.scss style.css

translate:
	python BuildTemplate.py --lang=en --extract=languages/thr.pot --output=Templates.json templates/*.html searchForm.json readingForm.json categories.json languages.json

gb: build
	rsync -az --delete . gbserver3:/var/www/tarheelreader/wp-content/themes/thr3
	launch.py http://gbserver3.cs.unc.edu/

cenk: build
	rsync -az --delete . gbserver3s:/var/www/tarheelreader/wp-content/themes/thr3


production:
	cd js; node ../../r.js -o app.build.js
	cd ../Theme-build; make deploy

deploy:
	python MakeMediaQueries.py > _mediaqueries.scss
	python BuildTemplate.py --lang=en --extract=languages/thr.pot --output=Templates.json templates/*.html searchForm.json readingForm.json categories.json languages.json
	sass --style=compressed style.scss style.css
	python EditFileVersions.py
	rsync -az --delete . gbserver3:/var/www/TarHeelReader/wp-content/themes/thr3
	launch.py http://tarheelreader3.cs.unc.edu/
