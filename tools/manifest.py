import glob
import re
from datetime import datetime
import argparse

parser = argparse.ArgumentParser(description="Construct the manifest file")
parser.add_argument('used')
args = parser.parse_args()

used = [ s.strip() for s in file(args.used, 'r').readlines() if '.mp3' not in s ]

ManifestHead = '''
CACHE MANIFEST

# generated %s

CACHE:
http://code.jquery.com/jquery-1.11.2.min.js
http://ajax.googleapis.com/ajax/libs/jqueryui/1.11.2/themes/smoothness/jquery-ui.min.css
http://ajax.googleapis.com/ajax/libs/jqueryui/1.11.2/jquery-ui.min.js
'''

ManifestTail = '''
NETWORK:
*

FALLBACK:
/blog/json=1 /theme/empty.json
'''
ManifestHead = ManifestHead % datetime.now()

ManifestMiddle = '\n'.join(used)

print ManifestHead.strip()
print ManifestMiddle
print ManifestTail