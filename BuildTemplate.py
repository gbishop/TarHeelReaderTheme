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

templates = {}
strings = []

for fname in args.templates:
    base = osp.basename(fname)
    key, ext = osp.splitext(base)

    lines = []
    for lineNumber, text in enumerate(file(fname, 'r')):
        def translate(m):
            s = m.group(1)
            strings.append((lineNumber, fname, s))
            r = t.gettext(s)
            return r

        text = re.sub(r'_\(([^)]+)\)', translate, text)
        lines.append(text)
    value = '\n'.join(lines)

    if ext == '.json':
        value = json.loads(value)
    templates[key] = value

file(args.output, 'w').write(json.dumps(templates))

if args.extract:
    fp = file(args.extract, 'w')
    for lineNumber, fname, string in strings:
        print >>fp, '# %s %d' % (fname, lineNumber)
        print >>fp, 'msgid "%s"' % string
        print >>fp, 'msgstr ""'
