'''Extract strings from the templates, translate them, and generate a list of messages to be spoken

_(Message to translate|Context of the message for the translator):FileNameForSpeech

'''
import re
import os.path as osp
import json
import argparse
import gettext
import sys

parser = argparse.ArgumentParser(description="Process templates to produce locale specific json files.")
parser.add_argument('--lang')
parser.add_argument('--extract')
parser.add_argument('-compact', action='store_true')
parser.add_argument('templates', nargs='+')
parser.add_argument('--output')
args = parser.parse_args()

t = gettext.translation('thr', 'locale', [args.lang], fallback=args.lang == 'en')

templates = {}
strings = {}
speech_strings = {}

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
            if len(s) == 2:
                r = t.gettext(s[1] + "\x04" + s[0])
                rr = r.split("\x04")
                if len(rr) == 2:
                    r = rr[1]
            else:
                r = t.gettext(s[0])
            if m.group(2):
                phrase = m.group(2)[1:]
                for voice in ['c', 'f', 'm']:
                    name = phrase + '-' + voice
                    speech_strings[name] = {
                        'text': r,
                        'url': '/theme/speech/%s-%s-%s.mp3' % (args.lang, phrase, voice)
                    }
            return r

        text = re.sub(r'_\(([^\)]+)\)(:[0-9a-z]+)?', translate, text)
        text = re.sub(r' +', ' ', text)
        lines.append(text)
    value = ''.join(lines)

    if ext == '.json':
        try:
            value = json.loads(value)
        except:
            print 'error', fname
            print value
            sys.exit(1)
    templates[key] = value

templates['siteSpeech'] = speech_strings

if args.output:
    if args.compact:
        file(args.output, 'w').write(json.dumps(templates, sort_keys=True, separators=(',', ':')))
    else:
        file(args.output, 'w').write(json.dumps(templates, sort_keys=True, indent=2))

poHeader = r'''
msgid ""
msgstr ""
"Project-Id-Version: Foo\n"
"PO-Revision-Date: 2012-03-06 09:49-0500\n"
"Last-Translator: Gary Bishop <gb@cs.unc.edu>\n"
"Language-Team: English\n"
"Language: en\n"
"MIME-Version: 1.0\n"
"Content-Type: text/plain; charset=ASCII\n"
"Content-Transfer-Encoding: 8bit\n"
"Plural-Forms: nplurals=2; plural=(n != 1);\n"
'''

if args.extract:
    toSort = [(locs, string) for string, locs in strings.iteritems()]
    toSort.sort()
    fp = file(args.extract, 'w')
    print >>fp, poHeader
    for locs, string in toSort:
        print >>fp, '\n#', ', '.join(['%s:%d' % (fname, lineNumber) for fname, lineNumber in locs])
        if len(string) == 2:
            print >>fp, 'msgctxt "%s"' % string[1]
        print >>fp, 'msgid "%s"' % string[0]
        print >>fp, 'msgstr ""'
