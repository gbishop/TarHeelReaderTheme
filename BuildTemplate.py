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
            s = m.group(1).split('|')
            strings.append((lineNumber + 1, fname, s))
            r = t.gettext(s[0])
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
        print >>fp, '\n# %s %d' % (fname, lineNumber)
        if len(string) == 2:
            print >>fp, 'msgctxt "%s"' % string[1]
        print >>fp, 'msgid "%s"' % string[0]
        print >>fp, 'msgstr ""'
