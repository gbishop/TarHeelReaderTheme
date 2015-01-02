import glob
import re
from datetime import datetime
import argparse
import shelve

parser = argparse.ArgumentParser(description="Construct the manifest file")
parser.add_argument('--db', default='../gbVersion')
args = parser.parse_args()

db = shelve.open(args.db)

ManifestHead = '''
CACHE MANIFEST

# generated %s

CACHE:
http://code.jquery.com/jquery-1.11.2.min.js
http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/themes/base/jquery-ui.css
http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.min.js
'''

ManifestTail = '''
NETWORK:
*

FALLBACK:
/blog/json=1 /theme/empty.json
'''
ManifestHead = ManifestHead % datetime.now()

files = [ ]
for name in sorted(db.keys()):
    if name.endswith('.mp3'):
        continue
    if 'analytics' in name:
        continue
    version, fhash = db[name]
    path = '/themeV%d/%s' % (version, name)
    files.append(path)

ManifestMiddle = '\n'.join(files)

print ManifestHead.strip()
print ManifestMiddle
print ManifestTail