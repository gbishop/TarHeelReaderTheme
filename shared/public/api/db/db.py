'''
db wrapper for shared reader
'''
import sqlite3
import os
import urllib.request
import json
from datetime import datetime
import types

try:
    import uwsgi  # noqa: F401
    if '-dev' in os.getcwd():
        print('Dev')
        DBNAME = '/var/local/thsr-dev/thsr.db'
    else:
        print('Production')
        DBNAME = '/var/local/thsr/thsr.db'
except ImportError:
    print('Testing')
    DBNAME = '/var/tmp/thsr.db'

DBFLAGS = sqlite3.PARSE_COLNAMES | sqlite3.PARSE_DECLTYPES


def dict_factory(cursor, row):
    '''Return a dict for each row'''
    return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}


# a decorator to manage db access
def with_db(func):
    '''Add an extra argument with a database connection'''
    def func_wrapper(*args, **kwargs):
        db = sqlite3.connect(DBNAME, detect_types=DBFLAGS)
        db.row_factory = dict_factory
        result = func(*args, **dict(kwargs, db=db))
        if not isinstance(result, types.GeneratorType):
            db.commit()
            db.close()
        return result
    return func_wrapper


def insert(db, table, insertVerb='insert', **fields):
    sql = '%s into %s (%s) values (%s)' % (
        insertVerb, table, ', '.join(fields.keys()),
        ', '.join(['?'] * len(fields)))
    return db.execute(sql, tuple(fields.values()))


@with_db
def createTables(db):
    # log activity
    db.execute('''create table if not exists log
        (logid integer primary key,
         time timestamp,
         teacher text,
         student text,
         comment text,
         slug text,
         reading integer,
         page integer,
         response text
        )''')

    db.execute('''create table if not exists comments
        (commentid integer primary key,
         sharedid integer,      -- index of the sharedbook
         reading integer,
         pageno integer,
         comment text,
         foreign key(sharedid) references shared(id)
        )''')

    # thr content copied here so it can't change
    db.execute('''create table if not exists books
        (bookid integer primary key,
         thrslug text,      -- the slug of the original book
         title text,
         author text,
         image text,        -- cover picture url
         pages number   -- number of pages
        )''')

    # each page has an entry
    db.execute('''create table if not exists pages
        (pageid integer primary key,
         bookid integer,
         pageno integer,    -- 0 relative
         caption text,
         image text,        -- url
         width integer,     -- image size
         height integer,
         foreign key(bookid) references books(bookid)
        )''')

    # map from slug to book content
    db.execute('''create table if not exists shared
        (sharedid integer primary key,
         slug text unique,          -- same as THR slug except for dups
         level text,
         status text,               -- published or draft
         owner text,                -- teacher who created
         bookid integer,            -- index of the content
         created timestamp,
         modified timestamp,
         foreign key(bookid) references books(bookid)
        )''')
    # cache for tokens
    db.execute('''create table if not exists cache
        (token text primary key,
         user text,
         role text,
         expires timestamp
        )''')


@with_db
def loadTables(db):
    URL = 'https://shared.tarheelreader.org/api/sharedbooks/'
    count = db.execute('''
        select count(*) from shared
    ''').fetchone()
    if count['count(*)'] == 0:
        r = urllib.request.urlopen(URL + 'index.json').read()
        index = json.loads(r.decode('utf-8'))
        for sbi in index:
            fp = urllib.request.urlopen(URL + sbi['slug'] + '.json')
            d = fp.read().decode('utf-8')
            b = json.loads(d)
            # add the book to the book table
            c = insert(db, 'books', thrslug=b['slug'], title=b['title'],
                       author=b['author'],
                       image=b['pages'][0]['url'], pages=len(b['pages']))
            bookid = c.lastrowid
            # add the pages to the pages table
            for pn, page in enumerate(b['pages']):
                insert(db, 'pages', bookid=bookid, pageno=pn,
                       caption=page['text'],
                       image=page['url'], width=page['width'],
                       height=page['height'])
            # create the shared book entry
            c = insert(db, 'shared', slug=b['slug'], level=b['sheet'],
                       status='published', owner='clds', bookid=bookid,
                       created=datetime.now(), modified=datetime.now())
            sharedid = c.lastrowid
            try:
                for p, page in enumerate(b['pages']):
                    for r, reading in enumerate(b['readings']):
                        insert(db, 'comments', sharedid=sharedid,
                               reading=r + 1, pageno=p + 1,
                               comment=reading['comments'][p])
            except IndexError:
                print('skip', b['slug'])
                db.rollback()
                continue
            db.commit()


createTables()
loadTables()
