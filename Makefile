all: test

test: style.css
	python MakeMediaQueries.py > _mediaqueries.scss
	python BuildTemplate.py --lang=en --extract=languages/thr.pot --output=Templates.json templates/*.mustache searchForm.json readingForm.json
	sass --style=compact style.scss style.css
	rsync -az --delete . gbserver3:/var/www/TarHeelReader/wp-content/themes/thr3
	scp js/command.js gbserver3:/var/tmp/command.js
	xdotool search --onlyvisible --name "Tar Heel Reader" windowactivate

style.css: style.scss
	sass style.scss style.css

production:
	cd js; node ../../r.js -o app.build.js
	cd ../Theme-build; make deploy

deploy:
	python MakeMediaQueries.py > _mediaqueries.scss
	python BuildTemplate.py --lang=en --extract=languages/thr.pot --output=Templates.json templates/*.mustache searchForm.json readingForm.json
	sass --style=compressed style.scss style.css
	rsync -az --delete . gbserver3:/var/www/TarHeelReader/wp-content/themes/thr3
