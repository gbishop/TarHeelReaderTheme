import glob
import re
from datetime import datetime

Manifest = '''
CACHE MANIFEST

# generated %s

CACHE:
http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/themes/base/jquery-ui.css
http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js
http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.min.js

state.json
Templates.*.json

js/*.js

images/*.png
images/loading.gif
images/Settings_colors/*.png

style.css
'''

Manifest = Manifest % datetime.now()

lines = []
for line in Manifest.split('\n'):
    matches = glob.glob(line)
    #print matches
    if matches:
        for match in matches:
            lines.append('/theme/' + match)
    else:
        lines.append(line)

print '\n'.join(lines).strip()
print '''
NETWORK:
*
'''