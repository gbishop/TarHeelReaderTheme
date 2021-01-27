"""Edit files in Theme-build so that references are versioned to enable caching in production"""

import os.path as osp
import pickle
import hashlib
import re
import argparse

parser = argparse.ArgumentParser(description="Edit urls to include version numbers")
parser.add_argument("--staticHost", default="")
parser.add_argument("--db", default="../gbVersion.pkl")
parser.add_argument("--used")
parser.add_argument("files", nargs="+")
args = parser.parse_args()

staticHost = args.staticHost

target = re.compile(r"""(?<=['"(])/theme(V[0-9]+)?/([^'"\\)]*)""")

db = pickle.load(open(args.db, "rb"))

used = {}


def insertVersion(m):
    name = m.group(2)
    fullname = name
    useStaticHost = True
    if fullname == "js/main":
        fullname = fullname + ".js"
        useStaticHost = False
    elif fullname.endswith(".json") or fullname.endswith(".swf"):
        useStaticHost = False
    if not osp.exists(fullname):
        # print 'missing', fname, name
        return m.group(0)

    newhash = hashlib.md5(open(fullname, "rb").read()).hexdigest()
    if fullname not in db:
        version = 1
        db[fullname] = (version, newhash)
    else:
        version, oldhash = db[fullname]
        if oldhash != newhash:
            version += 1
            db[fullname] = (version, newhash)

    if useStaticHost:
        prefix = "%s/themeV%d/" % (staticHost, version)
    else:
        prefix = "/themeV%d/" % version

    used[prefix + fullname] = True
    return prefix + name


for fname in args.files:
    p, ext = osp.splitext(fname)
    obytes = open(fname, "r").read()
    nbytes = target.sub(insertVersion, obytes)
    if obytes != nbytes:
        print(fname)
        open(fname, "w").write(nbytes)
pickle.dump(db, open(args.db, "wb"))

if args.used:
    open(args.used, "w").write("\n".join(sorted(used.keys())))
