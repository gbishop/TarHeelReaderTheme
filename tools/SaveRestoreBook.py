import urllib
import urllib2
import cookielib
import argparse
import json
import re
import sys
import os
import os.path as osp


class wp(object):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 5.0; en-GB; ' +
          'rv:1.8.1.12) Gecko/20080201 Firefox/2.0.0.12',
        'Accept': 'text/xml,application/xml,application/xhtml+xml,' +
          'text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5' +
          'application/json;q=0.4',
        'Accept-Language': 'en-us,en;q=0.5',
        'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.7',
        'Connection': 'keep-alive'
    }

    def __init__(self, host):
        self.host = 'http://' + host
        self.cookies = cookielib.CookieJar()

    def request(self, url, opts={}, post=False):
        data = urllib.urlencode(opts)
        if post:
            request = urllib2.Request(url, data, self.headers)
        else:
            request = urllib2.Request(url + '?' + data, headers=self.headers)
        cookie_handler = urllib2.HTTPCookieProcessor(self.cookies)
        redirect_handler = urllib2.HTTPRedirectHandler()
        opener = urllib2.build_opener(redirect_handler, cookie_handler)
        response = opener.open(request)
        self.cookies.extract_cookies(response, request)
        return response.read()

    def login(self, name, passwd):
        url = self.host + "/login/"
        opts = {
            'log': name,
            'pwd': passwd,
            'rememberme': 1,
            'ajax': 1
        }
        resp = self.request(url, opts, True)
        resp = json.loads(resp)
        return resp['r']

    def fetchBook(self, key):
        url = self.host + '/book-as-json/'
        opts = {
            'ajax': 1
        }
        if re.match(r'[0-9]+$', key):
            opts['id'] = key
        else:
            opts['slug'] = key

        resp = self.request(url, opts)
        return json.loads(resp)

    def saveBook(self, id, book):
        url = self.host + '/book-as-json/'
        opts = {}
        opts['id'] = id
        if book['status'] == 'publish':
            opts['publish'] = 'true'
        else:
            opts['publish'] = 'false'
        opts['book'] = json.dumps(book)
        resp = self.request(url, opts, post=True)
        return resp

    def fetchData(self, url):
        url = self.host + url
        return self.request(url)


parser = argparse.ArgumentParser(description="Save and Restore books")
parser.add_argument('--host', default='gbserver3a.cs.unc.edu')
parser.add_argument('--user')
parser.add_argument('--password')
parser.add_argument('--save')
parser.add_argument('--update')
parser.add_argument('--new')
parser.add_argument('--dir', default='.')

args = parser.parse_args()

s = wp(args.host)
if args.user and args.password:
    result = s.login(args.user, args.password)
    if not result:
        print 'login failed'
        sys.exit(1)

if args.save:
    book = s.fetchBook(args.save)
    # save the content
    json.dump(book, file(osp.join(args.dir, str(book['ID']) + '.json'), 'w'), indent=2,
        sort_keys=True)
    # save the images
    for page in book['pages']:
        url = page['url']
        path = osp.join(args.dir, *osp.split(url[1:]))
        if not osp.exists(path):
            data = s.fetchData(url)
            folder = osp.join(*osp.split(path)[:-1])
            if not osp.exists(folder):
                os.makedirs(folder)
            file(path, 'wb').write(data)

elif args.update:
    book = json.load(file(osp.join(args.dir, args.update)))
    print s.saveBook(book['ID'], book)

elif args.new:
    book = json.load(file(osp.join(args.dir, args.new)))
    print s.saveBook('', book)

