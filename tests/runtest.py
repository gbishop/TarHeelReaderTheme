import requests
from requests.auth import HTTPBasicAuth
import argparse
import os
import json
import time

browsers = {
    'ipad': ["OS X 10.9", "iPad", "8.1"],
    'ie11': [ "Windows 2012 R2", "Internet Explorer", "11"],
    'ie8': ["Windows 2003", "Internet Explorer", "8"],
    'macchrome': ["OS X 10.10", "googlechrome", ""],
    'win7chrome': ["Windows 7", "googlechrome", ""],
    'macsafari': ["OS X 10.10", "Safari", "8"],
    'macfirefox': ["OS X 10.10", "Firefox", ""],
    'win7firefox': ["Windows 7", "Firefox", ""],
    'win8firefox': ["Windows 8", "Firefox", ""],
    'win8chrome': ["Windows 8", "googlechrome", ""]
}

parser = argparse.ArgumentParser(
    description='Run a unit test on Saucelabs and report the result')
parser.add_argument('--user', default=os.environ.get('SAUCE_USER', 'gbthr'))
parser.add_argument('--key', default=os.environ.get('SAUCE_KEY'))
parser.add_argument('browser')
parser.add_argument('url')

args = parser.parse_args()

url = 'https://saucelabs.com/rest/v1/%s/js-tests' % args.user
headers = {'content-type': 'application/json'}
data = {
    'platforms': [ browsers[args.browser] ],
    'framework': 'mocha',
    'url': args.url
}
auth = HTTPBasicAuth(args.user, args.key)
resp = requests.post(url, auth=auth, data=json.dumps(data),
    headers=headers)

r = resp.json()
print r
id = r['js tests'][0]
while True:
    time.sleep(10)
    rsp = requests.post(url+'/status', auth=auth, headers=headers,
        data=json.dumps(r))
    s = rsp.json()
    if s['completed']:
        break
print s

'''
starts like this:
{
    u'completed': False,
    u'js tests': [
        {   u'status': u'test queued',
            u'platform': [u'OS X 10.9', u'iPad', u'8.1'],
            u'id': u'1473696d5f044b4eae65ceb7d4adf426',
            u'job_id': u'job not ready'
        }
    ]
}

transitions to this:
{   u'completed': False,
    u'js tests': [
        {   u'url': u'https://saucelabs.com/jobs/d8c3c9a5760f44498a7f3cf2d28491f0',
            u'platform': [u'OS X 10.9', u'iPad', u'8.1'],
            u'status': u'test session in progress',
            u'id': u'1473696d5f044b4eae65ceb7d4adf426',
            u'job_id': u'd8c3c9a5760f44498a7f3cf2d28491f0'
        }
    ]
}

ends like this:
{   u'completed': True,
    u'js tests': [
        {   u'url': u'https://saucelabs.com/jobs/d8c3c9a5760f44498a7f3cf2d28491f0',
            u'platform': [u'OS X 10.9', u'iPad', u'8.1'],
            u'result': {
                u'suites': 3,
                u'tests': 2,
                u'end': {},
                u'passes': 2,
                u'reports': [],
                u'start': {},
                u'duration': 20082,
                u'failures': 0,
                u'pending': 0
            },
            u'job_id': u'd8c3c9a5760f44498a7f3cf2d28491f0',
            u'id': u'1473696d5f044b4eae65ceb7d4adf426'
        }
    ]
}
'''







