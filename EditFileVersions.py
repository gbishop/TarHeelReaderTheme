'''Edit files in Theme-build so that references are versioned to enable caching in production'''

import os
import os.path as osp
import json
import re

versionFile = '../version.json'
staticHost = "http://tarheelreader3s.cs.unc.edu"

versionInfo = json.loads(file(versionFile, 'r').read())
version = versionInfo['version'] + 1

for root, dirs, files in os.walk('../Theme-build'):
    if '.git' in dirs:
        dirs.remove('.git')
    for fname in files:
        p, ext = osp.splitext(fname)
        if ext not in ['.php', '.js', '.json', '.css']:
            continue
        path = osp.join(root, fname)
        obytes = file(path, 'r').read()
        nbytes = re.sub(r'(%s)?/theme(V\d+)?/' % staticHost, '%s/themeV%d/' % (staticHost, version), obytes)
        nbytes = nbytes.replace('{{staticHost}}', staticHost)
        if obytes != nbytes:
            print fname
            file(path, 'w').write(nbytes)

versionInfo['version'] = version
file(versionFile, 'w').write(json.dumps(versionInfo) + '\n')
