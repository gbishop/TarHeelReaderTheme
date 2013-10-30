'''Edit files in Theme-build so that references are versioned to enable caching in production'''

import os.path as osp
import shelve
import hashlib
import re
import argparse

parser = argparse.ArgumentParser(description="Process templates to produce locale specific json files.")
parser.add_argument('--staticHost', default='')
parser.add_argument('--db', default='../gbVersion')
parser.add_argument('files', nargs='+')
args = parser.parse_args()

staticHost = args.staticHost

target = re.compile(r'''(?<=['"(])/theme(V[0-9]+)?/([^'"\\)]*)''')

db = shelve.open(args.db)


def insertVersion(m):
    name = m.group(2)
    fullname = name
    useStaticHost = True
    if fullname == 'js/main':
        fullname = fullname + '.js'
        useStaticHost = False
    elif fullname.endswith('.json') or fullname.endswith('.swf'):
        useStaticHost = False
    if not osp.exists(fullname):
        print 'missing', fname, name
        return m.group(0)

    newhash = hashlib.md5(file(fullname).read()).hexdigest()
    if fullname not in db:
        version = 1
        db[fullname] = (version, newhash)
    else:
        version, oldhash = db[fullname]
        if oldhash != newhash:
            version += 1
            db[fullname] = (version, newhash)

    if useStaticHost:
        name = ('%s/themeV%d/' % (staticHost, version)) + name
    else:
        name = ('/themeV%d/' % version) + name
    return name

for fname in args.files:
    p, ext = osp.splitext(fname)
    obytes = file(fname, 'r').read()
    nbytes = target.sub(insertVersion, obytes)
    if obytes != nbytes:
        print fname
        file(fname, 'w').write(nbytes)
db.close()
