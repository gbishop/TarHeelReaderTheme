#!/usr/bin/python3
"""
A simple db for Tar Heel Shared Reader
"""

import bottle
from bottle import Bottle, request, HTTPError
from datetime import datetime, timedelta
from db import with_db, insert
import urllib.request
import json
import re
import itertools

app = application = Bottle()

# enable debugging
bottle.debug(True)

THR = "https://tarheelreader.org/"
# THR = 'https://gbserver3.cs.unc.edu/'


roles = {"admin": 3, "author": 2, "participant": 1}


def auth(min_role):
    """Validate auth and add user and role arguments"""

    def decorator(func):
        def func_wrapper(*args, **kwargs):
            try:
                # parse the authentication header
                ah = request.headers.get("Authentication", "")
                m = re.match(
                    r"^MYAUTH "
                    r'user:"([a-zA-Z0-9 ]+)", '
                    r'role:"([a-z]+)", '
                    r'token:"([0-9a-f]+)"',
                    ah,
                )
                if not m:
                    print("no header")
                    raise HTTPError
                # validate the user
                name, role, token = m.groups()
                # check the cache
                db = kwargs["db"]
                row = db.execute(
                    """
                    select * from cache
                        where token = ?""",
                    [token],
                ).fetchone()
                if (
                    not row
                    or row["user"] != name
                    or row["role"] != role
                    or row["expires"] < datetime.now()
                ):
                    print("revalidate")
                    # cache failed so validate with THR
                    url = THR + "login?{}".format(
                        urllib.parse.urlencode(
                            {"shared": 2, "login": name, "role": role, "hash": token}
                        )
                    )
                    r = urllib.request.urlopen(url).read()
                    resp = json.loads(r.decode("utf-8"))
                    if not resp["ok"]:
                        print("not ok")
                        raise HTTPError
                    role = resp["role"]
                    token = resp["hash"]
                    insert(
                        db,
                        "cache",
                        insertVerb="replace",
                        token=token,
                        user=name,
                        role=role,
                        expires=datetime.now() + timedelta(hours=1),
                    )
                # check the role
                if roles.get(role, 0) < roles[min_role]:
                    print("auth", role)
                    raise HTTPError
            except HTTPError:
                raise HTTPError(403, "Forbidden")
            return func(*args, **dict(kwargs, user=name, role=role))

        return func_wrapper

    return decorator


@app.route("/students")
@with_db
@auth("participant")
def students(db, user, role):
    """
    return a list of student ids
    """
    result = db.execute(
        """
        select distinct student from log
          where teacher = ? and student != ''
          order by student
    """,
        [user],
    ).fetchall()
    return {"students": [r["student"] for r in result]}


@app.route("/students", method="POST")
@with_db
@auth("participant")
def addStudent(db, user, role):
    """
    Add a students for this teacher
    """
    data = request.json
    teacher, student = user, data["student"]
    insert(db, "log", time=datetime.now(), teacher=teacher, student=student)
    return {"status": "ok"}


@app.route("/books")
@with_db
@auth("participant")
def getBooksIndex(db, user, role):
    """
    List all books
    """
    teacher = request.query.get("teacher")
    result = {"recent": [], "yours": [], "books": []}
    if teacher:
        # 8 most recently read books
        recent = db.execute(
            """
            select B.title, B.author, B.pages, S.slug, S.level, B.image,
                S.status, S.owner
            from books B, shared S
            where B.bookid = S.bookid and
              S.status = 'published' and S.slug in
                (select distinct slug from log
                 where teacher = ?
                 order by time desc
                 limit 8)
        """,
            [user],
        ).fetchall()
        result["recent"] = recent
        # books owned by this teacher
        yours = db.execute(
            """
            select B.title, B.author, B.pages, S.slug, S.level, B.image,
                S.status, S.owner
            from books B, shared S
            where B.bookid = S.bookid and
                S.owner = ?
        """,
            [user],
        ).fetchall()
        result["yours"] = yours
    else:
        results = db.execute(
            """
            select B.title, B.author, B.pages, S.slug, S.level, B.image,
                S.status, S.owner
            from books B, shared S
            where B.bookid = S.bookid and
                S.status = 'published'
        """
        ).fetchall()
        result["books"] = results
    return result


@app.route("/books/:slug")
@with_db
@auth("participant")
def getBook(db, user, role, slug):
    """
    Return json for a book
    """
    book = db.execute(
        """
        select B.title, S.slug, S.status, S.level, B.author, S.owner,
            S.sharedid, B.bookid
        from books B, shared S
        where B.bookid = S.bookid and S.slug = ?
    """,
        [slug],
    ).fetchone()
    if not book:
        raise HTTPError(404, "Book not found")
    pages = db.execute(
        """
        select caption as text, image as url, width, height
        from pages
        where bookid = ?
        order by pageno
    """,
        [book["bookid"]],
    ).fetchall()
    comments = db.execute(
        """
        select comment from comments
        where sharedid = ?
        order by reading, pageno
    """,
        [book["sharedid"]],
    ).fetchall()
    npages = len(pages)
    if len(comments) == 0:
        book["comments"] = [[""] * npages]
    else:
        book["comments"] = [
            [c["comment"] for c in comments[i : i + npages]]
            for i in range(0, len(comments), npages)
        ]
    book["pages"] = pages
    return book


@app.route("/books/:slug", method="PUT")
@with_db
@auth("author")
def updateBook(db, user, role, slug):
    """
    Update the comments on a book
    """
    data = request.json
    comments = data["comments"]
    level = data["level"]
    status = data["status"]
    # validate the slug
    book = db.execute(
        """
        select sharedid, owner
            from shared
            where slug = ?""",
        [slug],
    ).fetchone()
    if not book:
        raise HTTPError(404, "Not found")
    sharedid = book["sharedid"]
    # and the owner
    if user != book["owner"] and role != "admin":
        raise HTTPError(403, "Forbidden")

    # delete the old comments
    db.execute(
        """
        delete from comments
            where sharedid = ?""",
        [book["sharedid"]],
    )
    # keep only readings that have at least one non-empty comment
    comments = [reading for reading in comments if any(r.strip() for r in reading)]
    # write the new comments
    for r, reading in enumerate(comments):
        for p, comment in enumerate(reading):
            insert(
                db,
                "comments",
                sharedid=sharedid,
                reading=r + 1,
                pageno=p + 1,
                comment=comment,
            )
    db.execute(
        """
        update shared
            set modified=?, level=?, status=?
            where sharedid = ?""",
        [datetime.now(), level, status, sharedid],
    )
    return {"slug": slug}


@app.route("/books", method="POST")
@with_db
@auth("author")
def newBook(db, user, role):
    """
    Create a new book
    """
    data = request.json
    thrslug = data["slug"]
    teacher = user  # FIX ME
    # get the book content from THR
    url = THR + "book-as-json?slug=%s" % thrslug
    try:
        r = urllib.request.urlopen(url).read()
    except urllib.error.HTTPError as e:
        raise HTTPError(e.code, e.reason)
    b = json.loads(r.decode("utf-8"))
    # add the content to our tables
    c = insert(
        db,
        "books",
        thrslug=thrslug,
        title=b["title"],
        author=b["author"],
        image=b["pages"][0]["url"],
        pages=len(b["pages"]),
    )
    bookid = c.lastrowid
    for pn, page in enumerate(b["pages"]):
        insert(
            db,
            "pages",
            bookid=bookid,
            pageno=pn,
            caption=page["text"],
            image=page["url"],
            width=page["width"],
            height=page["height"],
        )
    # create a unique slug
    slugs = db.execute(
        """
        select slug from shared S, books B
            where S.bookid = B.bookid and B.thrslug = ?
            order by slug
        """,
        [thrslug],
    ).fetchall()
    if len(slugs) > 0:
        slug = slugs[0]["slug"] + ".{}".format(len(slugs) + 1)
    else:
        slug = thrslug
    # create the shared entry
    c = insert(
        db,
        "shared",
        slug=slug,
        status="draft",
        owner=teacher,
        bookid=bookid,
        level="",
        created=datetime.now(),
        modified=datetime.now(),
    )
    return {"slug": slug}


@app.route("/log", method="POST")
@with_db
def log(db):
    """
    Add a record to the log
    """
    d = request.json
    # get the actual comment
    if d["bookid"]:
        row = db.execute(
            """
            select C.comment from shared S, comments C
                where S.slug = ? and S.sharedid = C.sharedid and
                    C.pageno = ? and C.reading = ?
        """,
            (d["bookid"], d["page"], d["reading"]),
        ).fetchone()
        if row:
            d["comment"] = row["comment"]
    d["time"] = datetime.now()
    d["slug"] = d["bookid"]
    del d["bookid"]
    insert(db, "log", **d)
    return "ok"


csvHead = (
    """Date time,Duration,Teacher,Student,Slug,Comment,"""
    """Reading,Page,Response,# read,# Responses\n"""
)
csvRow = (
    """{time},{interval:.1f},"{teacher}","{student}",{slug},"""
    """{comment},{reading},{page},{response},,\n"""
)
csvSum = (
    """,{interval:.1f},"{teacher}","{student}",{slug},,,,,"""
    """{books},{responses}\n"""
)


def noNone(d):
    return {k: v if v is not None else "" for k, v in d.items()}


def formatRows(style, rows):
    yield csvHead
    for teacher, students in itertools.groupby(rows, key=lambda r: r["teacher"]):
        for student, books in itertools.groupby(students, key=lambda r: r["student"]):
            bookCount = 0
            studentResponses = 0
            studentInterval = 0
            for book, pages in itertools.groupby(books, key=lambda r: r["slug"]):
                bookCount += 1
                bookResponses = 0
                bookInterval = 0
                prior = noNone(next(pages))
                prior["interval"] = 0
                for page in pages:
                    page["interval"] = 0
                    interval = (page["time"] - prior["time"]).total_seconds()
                    if interval > 300:
                        interval = 0
                    prior["interval"] = interval
                    bookInterval += interval
                    if prior["response"]:
                        bookResponses += 1
                    yield csvRow.format(**prior)
                    prior = noNone(page)
                yield csvRow.format(**prior)
                yield csvSum.format(
                    **dict(
                        prior,
                        interval=bookInterval,
                        books=bookCount,
                        responses=bookResponses,
                    )
                )
                studentResponses += bookResponses
                studentInterval += bookInterval
            yield csvSum.format(
                **dict(
                    prior,
                    interval=studentInterval,
                    books=bookCount,
                    responses=studentResponses,
                    slug="",
                )
            )


@app.route("/log")
@with_db
@auth("admin")
def report(db, user, role):
    """
    dump the log into a csv
    """
    rows = db.execute(
        """
        select * from log
        where teacher <> '' and
              student <> '' and
              slug <> ''
        order by teacher, student, time
    """
    )
    bottle.response.content_type = "text/csv; charset=utf-8"
    bottle.response.headers["Content-Disposition"] = 'attachment; filename="log.csv"'
    return formatRows("csv", rows)


class StripPathMiddleware(object):
    """
    Get that slash out of the request
    """

    def __init__(self, a):
        self.a = a

    def __call__(self, e, h):
        e["PATH_INFO"] = e["PATH_INFO"].rstrip("/")
        return self.a(e, h)


if __name__ == "__main__":
    bottle.run(
        app=StripPathMiddleware(app),
        reloader=True,
        debug=True,
        host="localhost",
        port=5500,
    )
