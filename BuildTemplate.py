import sys
import os.path as osp
import json

def php_dumps(d):
    lines = []
    for key in sorted(d.keys()):
        lines.append("'%s' => '%s'" % (key, d[key]))

    return '''<?php
$Templates = array(
    %s
);
?>''' % (',\n'.join(lines))


templates = {}
for fname in sys.argv[1:]:
    value = file(fname, 'r').read().strip()
    key = osp.basename(osp.splitext(fname)[0])
    templates[key] = value

file('Templates.php', 'w').write(php_dumps(templates))
file('Templates.json', 'w').write(json.dumps(templates))