test: style.css
	python MakeMediaQueries.py > _mediaqueries.scss
	python BuildTemplate.py *.mustache
	sass style.scss style.css
	rsync -az . gbserver3:/var/www/TarHeelReader/wp-content/themes/thr3
	scp js/command.js gbserver3:/var/tmp/command.js
	xdotool search --onlyvisible --name "Tar Heel Reader" windowactivate

style.css: style.scss
	sass style.scss style.css

