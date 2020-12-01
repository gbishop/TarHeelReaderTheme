# -*- coding: utf-8 -*-
"""Generate the speech files for the site speech folder"""

import urllib.request, urllib.parse, urllib.error
import json
import sys
import os.path as osp
import argparse

parser = argparse.ArgumentParser(
    description="Process Templates*.json to produce locale specific speech mp3."
)
parser.add_argument("templates", nargs="+")
args = parser.parse_args()

languages = json.load(open("languages.json"))
has_speech = {}
for lang in languages:
    has_speech[lang["value"]] = lang["speech"]

for template in args.templates:
    lang = osp.basename(template).split(".")[1]
    if not has_speech[lang]:
        continue
    T = json.load(open(template))
    siteSpeech = T["siteSpeech"]
    for key, info in list(siteSpeech.items()):
        message = info["text"]
        url = info["url"]
        parts = url.split("/")
        path = "/".join(parts[2:])
        tag, voice = key.split("-")
        voice = {"c": "child", "f": "female", "m": "male"}[voice]
        request = {"voice": voice, "language": lang, "text": message.encode("utf-8")}
        data = urllib.parse.urlencode(request).encode("utf-8")
        fp = urllib.request.urlopen("https://tarheelreader.org/synth/", data)
        if fp.code != 200:
            print("bad result", fp.code)
            sys.exit(1)
        bytes = fp.read()
        fout = open(path, "wb")
        fout.write(bytes)
        fout.close()
