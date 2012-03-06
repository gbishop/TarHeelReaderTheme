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
strings = {}

for fname in args.templates:
    base = osp.basename(fname)
    key, ext = osp.splitext(base)

    lines = []
    for lineNumber, text in enumerate(file(fname, 'r')):
        def translate(m):
            s = tuple(m.group(1).split('|'))
            locs = strings.get(s, [])
            locs.append((fname, lineNumber + 1))
            strings[s] = locs
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
    toSort = [(locs, string) for string, locs in strings.iteritems()]
    toSort.sort()
    fp = file(args.extract, 'w')
    for locs, string in toSort:
        print >>fp, '\n#', ', '.join(['%s:%d' % (fname, lineNumber) for fname, lineNumber in locs])
        if len(string) == 2:
            print >>fp, 'msgctxt "%s"' % string[1]
        print >>fp, 'msgid "%s"' % string[0]
        print >>fp, 'msgstr ""'
