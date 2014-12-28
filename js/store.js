define(['state', 'templates'], function(state, templates) {

    /* initialize the db and return it */
    var holdDb = null;
    function initDB(name) {
        if (holdDb) {
            return $.when(holdDb);
        }
        var $def = $.Deferred();
        if (!window.indexedDB) {
            $def.reject('no indexedDB');
            return $def;
        }
        var request = indexedDB.open(name, 3);

        request.onerror = function(event) {
            $def.reject('open failed');
        };

        request.onupgradeneeded = function(event) {
            var db = event.target.result;
            var bookStore = db.createObjectStore("books", { keyPath: "ID"});
            bookStore.createIndex('slug', 'slug', {unique: true});
            db.createObjectStore("images");
        };

        request.onsuccess = function(event) {
            var db = event.target.result;
            //holdDb = db;
            var PersistentStorage = navigator.webkitPersistentStorage || undefined;
            if (false && PersistentStorage && PersistentStorage.requestQuota) {
                PersistentStorage.requestQuota(100*1024*1024,
                    function(allocated) {
                        $def.resolve(db);
                    },
                    function(error) {
                        console.log('quota error ' + error);
                    });
            } else {
                $def.resolve(db);
            }
        }
        return $def;
    }

    /* delete the database for testing so I can start clean */
    function deleteDB(name) {
        var $def = $.Deferred();
        if (holdDb) {
            holdDb.close();
            holdDb = null;
        }
        var req = indexedDB.deleteDatabase(name);
        req.onsuccess = function () {
            $def.resolve();
        };
        req.onerror = function () {
            $def.reject('error on delete');
        };
        req.onblocked = function () {
            $def.reject('delete blocked');
        };
        return $def;
    }

    var bookAsJson = '/book-as-json/?id=',
        findPage = '/find/?json=1&search=&category=' +
                    '&reviewed=R&audience=E&language=en&page=';

    /* ajax request from the server */
    function get(uri, type) {
        var $def = $.Deferred();
        var xhr = new XMLHttpRequest();
        xhr.open('GET', uri, true);
        xhr.responseType = type;
        xhr.onload = function() {
            var result = xhr.response;
            if (type === 'json' && typeof result === 'string') {
                result = JSON.parse(result);
            }
            $def.resolve(result);
        };
        xhr.onerror = function() {
            console.log('fetchImage failed ' + uri);
            $def.reject('fetchImage failed');
        };
        //log('loading ' + uri);
        xhr.send();
        return $def;
    }
    /* keep track of some stats */
    var imageCount = 0,
        imageBlobSize = 0,
        imageDataSize = 0;

    /* use the file name for now */
    function uriToKey(uri) {
        return uri.split('/').slice(-1)[0].split('.')[0];
    }

    /* read a record from the db */
    function readDb(db, table, key) {
        var $def = $.Deferred();
        var transaction = db.transaction([table], 'readonly'),
            store = transaction.objectStore(table),
            req = store.get(key);
        req.onsuccess = function(e) {
            $def.resolve(e.target.result);
        };
        req.onerror = function(e) {
            $def.reject();
        };
        return $def;
    }

    /* write the image to the db */
    function writeDb(db, table, key, data) {
        var $def = $.Deferred();
        try {
            var transaction = db.transaction([table], 'readwrite');
            transaction.onerror = function(e) {
                $def.reject('image write failed');
            };
            transaction.onabort = function(e) {
                var error = event.target.error; // DOMError
                if (error.name == 'QuotaExceededError') {
                  // Fallback code comes here
                  console.log('quota exceeded');
                }
                $def.reject(error.name);
            }
            transaction.oncomplete = function(event) {
                $def.resolve(key);
            };
            transaction.objectStore(table).put(data, key);
        } catch(e) {
            $def.reject('write exception');
        }
        return $def;
    }

    /* delete the record from the db */
    function deleteDbRecord(db, table, key) {
        var $def = $.Deferred();
        var transaction = db.transaction([table], 'readwrite');
        var req = transaction.objectStore(table).delete(key);
        req.onerror = function(e) {
            $def.reject('delete record failed');
        };
        transaction.oncomplete = function(event) {
            $def.resolve(key);
        };
        return $def;
    }

    /* visit every record in the db */
    function visitDbRecords(db, table, visitor) {
        var $def = $.Deferred();
        var transaction = db.transaction([table], "readonly"),
            store = transaction.objectStore(table),
            cursorRequest = store.openCursor();

        transaction.oncomplete = function(e) {
            $def.resolve();
        };

        cursorRequest.onerror = function(error) {
            console.log('cursorRequest error', error);
            $def.reject();
        };

        cursorRequest.onsuccess = function(e) {
            var cursor = e.target.result;
            if (cursor) {
                visitor(cursor);
                cursor['continue']();
            }
        };
        return $def;
    }

    /* base64 encode a blog */
    function encodeBlob(blob) {
        var $def = $.Deferred();
        var reader = new FileReader();
        reader.onload = function(event) {
            $def.resolve(event.target.result);
        };
        reader.readAsDataURL(blob);
        return $def;
    }

    /* cache a single image in the db */
    function cacheImage(db, uri) {
        var $def = $.Deferred();
        var transaction = db.transaction(['images'], 'readonly'),
            store = transaction.objectStore('images'),
            key = uriToKey(uri),
            req = store.get(key);
        req.onsuccess = function(e) {
            var image = e.target.result;
            if (image) {
                $def.resolve(key);
            } else {
                get(uri, 'blob').then(function(blob) {
                    // attempt to store as a blob
                    writeDb(db, 'images', key, blob).then(function(key) {
                        imageCount += 1;
                        imageBlobSize += blob.size;
                        $def.resolve(key);
                    }, function(e) {
                        // storing blob failed so write as base64
                        encodeBlob(blob).then(function(data) {
                            writeDb(db, 'images', key, data).then(function(key) {
                                imageCount += 1;
                                imageBlobSize += blob.size;
                                imageDataSize += data.length;
                                $def.resolve(key);
                            }, function(error) {
                                console.log('write base64 failed');
                            });
                        });
                    });
                });
            }
        };
        return $def;
    }

    /* promise-based sequential map */
    function pmap(values, func) {
        var results = [];
        return values.reduce(function(sequence, item) {
            return sequence.then(function() {
                return func(item);
            }).then(function(result) {
                results.push(result);
            });
        }, $.when()).then(function() {
            return results;
        });
    }

    /* promise-based parallel map */
    function pmapp(values, func) {
        return $.when.apply($, values.map(func));
    }

    /* cache a single book and its images */
    function cacheOneBook(db, id) {
        var $def = $.Deferred();
        readDb(db, 'books', id).then(function(book) {
            if (book) {
                $def.resolve({ ID: id, added: false });
            } else {
                get(bookAsJson + id, 'json').then(function(book) {
                    // cache all the images first
                    pmap(book.pages, function(page) {
                        return cacheImage(db, page.url);
                    }).then(function(results) {
                        // now save the json for the book
                        var transaction = db.transaction(['books'], 'readwrite'),
                            objectStore = transaction.objectStore('books');
                        transaction.oncomplete = function(event) {
                            $def.resolve({ ID: book.ID, added: true} );
                        };
                        transaction.onerror = function(event) {
                            console.log('book save error');
                            console.log(event);
                            $def.reject('db write failed');
                        };
                        objectStore.put(book);
                    }, function(err) {
                        console.log('error', err);
                    });
                });
            }
        });
        return $def;
    }

    /* cache all the books in the list of ids,
       the progress function will be called with each id */
    function cacheBooks(db, ids, progress) {
        return pmap(ids, function(id) {
            return cacheOneBook(db, +id).then(function(r) {
                if(progress) {
                    progress(r.ID, r.added);
                }
                return id;
            });
        });
    }

    /* remove books from the cache */
    function unCacheBooks(db, ids, progress) {
        var imagesInUse = {}, // all the images used by books
            imagesInStore = {}; // all the images in the store
        return pmap(ids, function(id) {
            return deleteDbRecord(db, 'books', +id).then(function(key) {
                if(progress) {
                    progress(id);
                }
                return id;
            });
        }).then(function() {
            // accumulate all the images from the books in a dictionary
            return visitDbRecords(db, 'books', function(cursor) {
                var book = cursor.value;
                for (var i=0; i<book.pages.length; i++) {
                    imagesInUse[uriToKey(book.pages[i].url)] = true;
                }
            });
        }).then(function() {
            // accumulate all the images from the store in a dictionary
            return visitDbRecords(db, 'images', function(cursor) {
                var key = cursor.primaryKey;
                imagesInStore[key] = true;
            });
        }).then(function() {
            // remove the keys that are in use
            for (var key in imagesInUse) {
                delete imagesInStore[key];
            }
            // clean up those remaining
            return pmap(Object.keys(imagesInStore), function(key) {
                return deleteDbRecord(db, 'images', key);
            });
        });
    }

    /* display the title page for a book, I'm using it for progress */
    function displayImage(id) {
        //log('display ' + key);
        return initDB('thr').then(function(db) {
            return readDb(db, 'books', id).then(function(book) {
                var key = uriToKey(book.pages[0].url);
                return readDb(db, 'images', key).then(function(result) {
                    var $img = $('<img>');
                    if (result instanceof Blob) {
                        result = window.URL.createObjectURL(result);
                    }
                    $img.attr('src', result);
                    return $img;
                });
            });
        });
    }

    /* a hack to get some legal id's for testing */
    function getBookIds(count) {
        var result = [];
        function getOneFindPage(page) {
            return get(findPage + page, 'json').then(function(data) {
                for(var i=0; i<data.books.length && result.length < count; i++) {
                    result.push(data.books[i].ID);
                }
                if (result.length < count) {
                    return getOneFindPage(page+1);
                }
            });
        }
        return getOneFindPage(1).then(function() {
            return result;
        });
    }

    /* reproduce the find results from the server */
    function bookToFindResult(book) {
        // copied from the php
        var fr = {};
        fr.title = book.title;
        fr.ID = book.ID;
        fr.slug = book.slug;
        fr.link = book.link;
        fr.author = book.author;
        fr.rating = templates.rating_info(book.rating_value);
        fr.tags = book.tags;
        fr.categories = book.categories;
        fr.reviewed = book.reviewed;
        fr.audience = book.audience;
        fr.caution = book.audience == 'C';
        fr.cover = book.pages[0];
        fr.preview = book.pages[1];
        fr.preview.text = fr.title;
        fr.pages = book.pages.length;
        fr.language = book.language;
        fr.bust = book.bust;

        return fr;
    }

    /* get all the text from the book into one string */
    function bookText(b) {
        var lines = b.pages.map(function(p) { return p.text; });
        lines.push(b.title);
        lines.push(b.author);
        var s = lines.join(' ');
        return s;
    }

    /* true is all the words occur in the text in any order */
    function allWordsInText(words, text) {
        for(var i=0; i<words.length; i++) {
            var target = new RegExp('\\b' + words[i] + '\\b', 'i');
            if (!target.test(text))
                return false;
        }
        return true;
    }

    /* select books that match the query */
    function filterBook(q, b) {
        var searchWords = q.search && q.search.split(/\s+/) || [];
        return (q.reviewed != 'R' || b.reviewed) &&
            (!q.audience || q.audience == b.audience) &&
            (q.language == b.language) &&
            (!q.category || b.categories.indexOf(q.category) != -1) &&
            (searchWords && allWordsInText(searchWords, bookText(b)));
    }

    function localizeFindResult(db, fr) {
        return pmap([fr.cover.url, fr.preview.url], function(url) {
                        return localizeImage(db, url);
                    }).then(function(urls) {
                        fr.cover.url = urls[0];
                        fr.preview.url = urls[1];
                        return fr;
                    });
    }

    function favoritesLocal() {
        var $def = $.Deferred(),
            result = {
                books: []
            };
        initDB('thr').then(function(db) {
            pmap(state.favoritesArray(), function(id) {
                return readDb(db, 'books', +id).then(function(book) {
                    if (book) {
                        var fr = bookToFindResult(book);
                        result.books.push(fr);
                    }
                });
            }).then(function()  {
                pmap(result.books, function(fr) {
                    return localizeFindResult(db, fr);
                }).then(function() {
                    $def.resolve(result);
                });
            });
        });
        return $def;
    }

    function findLocal(url) {
        // simply list the books in the db for starters
        var qp = state.queryParameters();
        var $def = $.Deferred();
        initDB('thr').then(function(db) {
            var transaction = db.transaction(['books'], "readonly"),
                store = transaction.objectStore('books'),
                cursorRequest = store.openCursor(null, 'prev'),
                result = {
                    books: []
                };

            transaction.oncomplete = function(e) {
                pmap(result.books, function(fr) {
                    return localizeFindResult(db, fr);
                }).then(function() {
                    $def.resolve(result);
                });
            };

            cursorRequest.onerror = function(error) {
                console.log('cursorRequest error', error);
            };

            cursorRequest.onsuccess = function(e) {
                var cursor = e.target.result;
                if (cursor) {
                    var book = cursor.value;
                    if (filterBook(qp, book)) {
                        var fr = bookToFindResult(book);
                        result.books.push(fr);
                    }
                    cursor['continue']();
                }
            };
        });
        return $def;
    }

    function localizeImage(db, uri) {
        var key = uriToKey(uri);
        return readDb(db, 'images', key).then(function(result) {
            if (result instanceof Blob) {
                result = window.URL.createObjectURL(result);
            }
            return result;
        });
    }

    function localizeBook(slug) {
        // find the book and update its image urls
        var $def = $.Deferred();
        initDB('thr').then(function(db) {
            var transaction = db.transaction(['books'], 'readonly'),
                store = transaction.objectStore('books'),
                index = store.index('slug'),
                req = index.get(encodeURI(slug).toLowerCase());
            req.onsuccess = function(e) {
                var book = req.result;
                if (!book) {
                    $def.reject(slug + ' not found');
                } else {
                    pmap(book.pages, function(page) {
                        return localizeImage(db, page.url).then(function(result) {
                            page.url = result;
                        });
                    }).then(function() {
                        $def.resolve(book);
                    });
                }
            };
            req.onerror = function(e) {
                $def.reject();
            }
        });
        return $def;
    }

    /* External interface */

    var book = null; // current book

    /* Return a book's json given its slug */

    function fetchBook(slug) {
        var $def = $.Deferred();
        if (book && book.slug == encodeURI(slug).toLowerCase()) {
            $def.resolve(book);
        } else if (state.offline()) {
            console.log('offline');
            localizeBook(slug).then(function(data) {
                //book = data;
                $def.resolve(data);
            }, function(err) {
                $def.reject(err);
            });
        } else {
            console.log('online');
            $.ajax({
                url: '/book-as-json/',
                data: {
                    slug: slug
                },
                dataType: 'json'
            }).done(function(data) {
                //book = data;
                $def.resolve(data);
            });
        }
        return $def;
    }

    /* return books that match the query */

    function find(url) {
        if (!state.offline()) {
            console.log('online', state);
            return $.ajax({
                url: url,
                data: 'json=1',
                dataType: 'json',
                timeout: 30000,
            });
        } else if (url.match(/favorites/)) {
            console.log('offline favs');
            return favoritesLocal();
        } else {
            console.log("offline");
            return findLocal(url);
        }
    }

    /* add the listed books to the offline storage */

    function addBooksToOffline(ids, progress) {
        return initDB('thr').then(function(db) {
            return cacheBooks(db, ids, progress);
        }, function() {
            return ids;
        });
    }

    function removeBooksFromOffline(ids, progress) {
        return initDB('thr').then(function(db) {
            return unCacheBooks(db, ids, progress);
        }, function() {
            console.log('failed');
            return ids;
        });
    }

    function offlineCapable() {
        var $def = $.Deferred();
        initDB('thr').then(function(db) {
            $def.resolve(true);
        }, function() {
            $def.resolve(false);
        });
        return $def;
    }

    function listBooks() {
        return initDB('thr').then(function(db) {
            var $def = $.Deferred();
            var transaction = db.transaction(['books'], "readonly"),
                store = transaction.objectStore('books'),
                cursorRequest = store.openCursor(),
                books = [];

            transaction.oncomplete = function(e) {
                $def.resolve(books);
            };

            cursorRequest.onerror = function(error) {
                console.log('cursorRequest error', error);
            };

            cursorRequest.onsuccess = function(e) {
                var cursor = e.target.result;
                if (cursor) {
                    var book = cursor.value;
                    books.push({ID: book.ID, title:book.title});
                    cursor['continue']();
                }
            };
            return $def;
        });
    }

        /* return the title for a book, I'm using it for progress */
    function bookTitle(id) {
        //log('display ' + key);
        return initDB('thr').then(function(db) {
            return readDb(db, 'books', +id).then(function(book) {
                return { ID: book.ID, title: book.title };
            });
        });
    }

    /* for testing */

    function clearStore(db, table) {
        var $def = $.Deferred(),
            transaction = db.transaction([table], "readwrite"),
            store = transaction.objectStore(table),
            req = store.clear();
        transaction.oncomplete = function(event) {
            $def.resolve();
        };
        transaction.onerror = function(err) {
            $def.reject(err);
        };
        return $def;
    }

    function reset() {
        return initDB('thr').then(function(db) {
            clearStore(db, 'books').then(function() {
                clearStore(db, 'images');
            });
        });
    }

    /* some data for testing */
    if (false) {
        db.then(function(db) {
            getBookIds(10).then(function(ids) {
                var tstart = +new Date();
                cacheBooks(db, ids, function(id) {
                    displayImage(id);
                }).then(function(ids) {
                    console.log((+new Date() - tstart)/1000);
                    //log(performance.now()/1000);
                    console.log('count = ' + imageCount);
                    console.log('average blob size = ' + imageBlobSize / imageCount);
                    console.log('total blob size = ' + imageBlobSize);
                    console.log('average data size = ' + imageDataSize / imageCount);
                    console.log('total data size = ' + imageDataSize);
                });
            });
        }, function(msg) {
            console.log('failed ' + msg);
        });
    }

    return {
       find: find,
       fetchBook: fetchBook,
       addBooksToOffline: addBooksToOffline,
       removeBooksFromOffline: removeBooksFromOffline,
       displayImage: displayImage,
       reset: reset,
       offlineCapable: offlineCapable,
       listBooks: listBooks,
       bookTitle: bookTitle
    };
});
