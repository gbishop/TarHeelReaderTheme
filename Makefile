all: test

test:
	python MakeMediaQueries.py > _mediaqueries.scss
	python BuildTemplate.py --lang=en --extract=languages/thr.pot --output=Templates.json --speech=../Speech/site/en.txt templates/*.html searchForm.json readingForm.json categories.json languages.json
	sass --style=compact style.scss style.css
	rsync -az --delete . gbserver3:/var/www/tarheelreader/wp-content/themes/thr3
	scp -q js/command.js gbserver3:/var/tmp/command.js
	launch.py http://gbserver3.cs.unc.edu/

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
