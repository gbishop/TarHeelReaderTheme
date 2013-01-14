import urllib
import json
import os
import os.path as osp
import sys
from datetime import datetime
import time


# todo: work this out instead of coding it here
HOST = 'http://gbserver3a.cs.unc.edu'
ROOT = '/var/www/gbserver3a/cache'


supportedLanguages = ['en', 'es', 'ga', 'fr', 'de', 'sv', 'fi', 'it', 'po']

if len(sys.argv) == 2:
    startPage = int(sys.argv[1])
    print 'startPage is', startPage
else:
    startPage = 1

dtmax = 0
for language in supportedLanguages:
    page = startPage
    while True:
        # call out for a chunk of books
        url = '%s/find/?json=1&search=&category=&reviewed=&audience=&language=%s&page=%d'
        url = url % (HOST, language, page)
        print url
        indexResp = urllib.urlopen(url).read()
        indexData = json.loads(indexResp)
        books = indexData['books']
        if len(books) == 0:
            break
        for book in books:
            # call out for the book content
            ID = book['ID']
            url = '%s/book-as-json/?id=%s' % (HOST, ID)
            contentResp = urllib.urlopen(url).read()
            contentData = json.loads(contentResp)
            modified = datetime.strptime(contentData['modified'], '%Y-%m-%d %H:%M:%S')
            modified = time.mktime(modified.timetuple())
            folder = osp.join(ROOT, 'speech/%s/%s' % (ID[-2:], ID))
            try:
                texts = [p['text'] for p in contentData['pages']]
            except TypeError:
                print 'failed on', ID, url
                continue
            updated = 0
            tStart = time.time()
            for i, text in enumerate(texts):
                text = text[:160]   # limit the maximum length we synth
                for voice in ['child', 'female', 'male']:
                    # see if the audio already exists potentially saving myself some time
                    base = '%d-%s.mp3' % (i + 1, voice[0])
                    fname = osp.join(folder, base)
                    if not osp.exists(fname) or osp.getmtime(fname) < modified:
                        updated += 1
                        # call out for the speech synthesis
                        data = {
                            'language': language,
                            'voice': voice,
                            'text': text.encode('utf-8')
                        }
                        #print 'open', data
                        speechFp = urllib.urlopen('http://gbserver3.cs.unc.edu/synth/', urllib.urlencode(data))
                        code = speechFp.getcode()
                        #print code, ID, i
                        if code != 200:
                            print 'bad response', ID, text.encode('utf-8')
                            continue

                        speechResp = speechFp.read()
                        if (len(speechResp) < 2 or
                            ord(speechResp[0]) != 0xff or ord(speechResp[1]) != 0xe3):
                            print 'not mp3 response', ID, text.encode('utf-8')
                            continue
                        if not osp.exists(folder):
                            os.makedirs(folder)
                        file(fname, 'wb').write(speechResp)
            dt = round(time.time() - tStart, 2)
            dtmax = max(dt, dtmax)
            print ID, updated / 3, dt, dtmax, contentData['modified']
            sys.stdout.flush()
        page += 1
    startPage = 1
