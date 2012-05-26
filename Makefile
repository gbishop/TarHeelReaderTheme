all: test

test:
	python MakeMediaQueries.py > _mediaqueries.scss
	python BuildTemplate.py --lang=en --extract=languages/thr.pot --output=Templates.json templates/*.html searchForm.json readingForm.json
	sass --style=compact style.scss style.css
	rsync -az --delete . gbserver3:/var/www/tarheelreader/wp-content/themes/thr3
	scp -q js/command.js gbserver3:/var/tmp/command.js
	xdotool search --onlyvisible --name "Tar Heel Reader" windowactivate -sync key shift+ctrl+r

production:
	cd js; node ../../r.js -o app.build.js
	cd ../Theme-build; make deploy

deploy:
	python MakeMediaQueries.py > _mediaqueries.scss
	python BuildTemplate.py --lang=en --extract=languages/thr.pot --output=Templates.json templates/*.html searchForm.json readingForm.json
	sass --style=compressed style.scss style.css
	python EditFileVersions.py
	rsync -az --delete . gbserver3:/var/www/TarHeelReader/wp-content/themes/thr3
