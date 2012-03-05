import re
import os.path as osp
import json
import argparse
import gettext

parser = argparse.ArgumentParser(description="Process templates to produce locale specific json files.")
parser.add_argument('--lang')
parser.add_argument('--extract')
parser.add_argument('templates', nargs='+')
parser.add_argument('--output', default='Templates.json')
args = parser.parse_args()

t = gettext.translation('thr', 'locale', [args.lang], fallback=True)

strings = {}


def translate(m):
    s = m.group(1)
    strings[s] = True
    r = t.gettext(s)
    return r

templates = {}
for fname in args.templates:
    value = file(fname, 'r').read().strip()
    base = osp.basename(fname)
    key, ext = osp.splitext(base)
    value = re.sub(r'_\(([^)]+)\)', translate, value)
    if ext == '.json':
        value = json.loads(value)
    templates[key] = value

file('Templates.json', 'w').write(json.dumps(templates))

if args.extract:
    fp = file(args.extract, 'w')
    for key in sorted(strings.keys()):
        print >>fp, '#'
        print >>fp, 'msgid "%s"' % key
        print >>fp, 'msgstr ""'
