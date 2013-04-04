'''Edit files in Theme-build to add newlines for error reporting'''

import os.path as osp
import re
import argparse

parser = argparse.ArgumentParser(description="Add newlines to compressed js.")
parser.add_argument('files', nargs='+')
args = parser.parse_args()

target = re.compile(r'''(?<=[,;])(define\(|require\()''')

for fname in args.files:
    p, ext = osp.splitext(fname)
    obytes = file(fname, 'r').read()
    nbytes = target.sub(r'\n\1', obytes)
    if obytes != nbytes:
        print fname
        file(fname, 'w').write(nbytes)
