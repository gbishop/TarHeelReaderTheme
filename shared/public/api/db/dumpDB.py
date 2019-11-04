#!/usr/bin/python3
"""
Dump the old db to json for import into THR
"""

from db import with_db
import json


@with_db
def dump(db):
    """
    Dump the db
    """
    books = db.execute(
        """
        select S.slug, S.status, S.level, S.owner, S.sharedid, B.bookid, B.pages
        from books B, shared S
        where B.bookid = S.bookid
    """
    ).fetchall()
    for book in books:
        npages = book["pages"]
        comments = db.execute(
            """
            select comment from comments
            where sharedid = ?
            order by reading, pageno
            """,
            [book["sharedid"]],
        ).fetchall()
        if not comments:
            book["comments"] = [[""] * npages]
        else:
            book["comments"] = [
                [c["comment"] for c in comments[i : i + npages]]
                for i in range(0, len(comments), npages)
            ]
    return books


data = dump()
json.dump(data, open("shared.json", "w"), indent=2)
