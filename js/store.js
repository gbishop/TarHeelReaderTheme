define(['state', 'templates', 'promise'], function(state, templates) {

    /* log to the dom so I can see on the iPad */
    function log(s) {
        //$('#log').append(s + '\n');
        console.log(s);
    }
    log('start');

    /* delete the database for testing so I can start clean */
    function deleteDB(name, fake) {
        return new Promise(function(resolve, reject) {
            if (fake) {
                resolve();
            } else {
                log('delete DB');
                var req = indexedDB.deleteDatabase(name);
                req.onsuccess = function () {
                    log('delete success');
                    resolve();
                };
                req.onerror = function () {
                    log('delete failed');
                    reject('error on delete');
                };
                req.onblocked = function () {
                    log('delete blocked');
                    reject('delete blocked');
                };
            }

        });
    }

    /* initialize the db and return it */
    function initDB(name) {
        return new Promise(function(resolve, reject) {
            log('initDB starts');
            var request = indexedDB.open(name, 3);

            request.onerror = function(event) {
                reject('open failed');
            };

            request.onupgradeneeded = function(event) {
                log('upgrading');
                var db = event.target.result;
                var bookStore = db.createObjectStore("books", { keyPath: "ID"});
                bookStore.createIndex('slug', 'slug', {unique: true});
                db.createObjectStore("images");
            };

            request.onsuccess = function(event) {
                log('db initialized');
                resolve(event.target.result);
            }
        });
    }

    var host = 'http://gbserver3.cs.unc.edu',
        bookAsJson = '/book-as-json/?id=',
        findPage = '/find/?json=1&search=&category=&reviewed=R&audience=E&language=en&page=';

    function get(uri, type) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', uri, true);
            xhr.responseType = type;
            xhr.onload = function() {
                resolve(xhr.response);
            };
            xhr.onerror = function() {
                log('fetchImage failed ' + uri);
                reject('fetchImage failed');
            };
            //console.log('loading ' + uri);
            xhr.send();
        });
    }
    /* keep track of some stats */
    var imageCount = 0,
        imageBlobSize = 0,
        imageDataSize = 0;

    /* use the file name for now */
    function uriToKey(uri) {
        return uri.split('/').slice(-1)[0].split('.')[0];
    }

    function readDb(db, table, key) {
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction([table], 'readonly'),
                store = transaction.objectStore(table),
                req = store.get(key);
            req.onsuccess = function(e) {
                resolve(e.target.result);
            };
            req.onerror = function(e) {
                reject();
            };
        });
    }

    /* write the image to the db */
    function writeDb(db, table, key, data) {
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction([table], 'readwrite');
            transaction.onerror = function(e) {
                reject('image write failed');
            };
            transaction.oncomplete = function(event) {
                resolve(key);
            };
            transaction.objectStore(table).put(data, key);
        });
    }

    /* base64 encode a blog */
    function encodeBlob(blob) {
        return new Promise(function(resolve, reject) {
            var reader = new FileReader();
            reader.onload = function(event) {
                resolve(event.target.result);
            };
            reader.readAsDataURL(blob);
        })
    }

    /* cache a single image in the db */
    function cacheImage(db, uri) {
        return new Promise(function(resolve, reject) {
            var transaction = db.transaction(['images'], 'readonly'),
                store = transaction.objectStore('images'),
                key = uriToKey(uri),
                req = store.get(key);
            req.onsuccess = function(e) {
                var image = e.target.result;
                if (image) {
                    //console.log('already got ' + key);
                    resolve(key);
                } else {
                    get(uri, 'blob').then(function(blob) {
                        // attempt to store as a blob
                        writeDb(db, 'images', key, blob).then(function(key) {
                            imageCount += 1;
                            imageBlobSize += blob.size;
                            resolve(key);
                        }).catch(function(e) {
                            // storing blob failed so write as base64
                            encodeBlob(blob).then(function(data) {
                                writeDb(db, 'images', key, data).then(function(key) {
                                    imageCount += 1;
                                    imageBlobSize += blob.size;
                                    imageDataSize += data.length;
                                    resolve(key);
                                });
                            });
                        });
                    });
                }
            };
        });
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
        }, Promise.resolve()).then(function() {
            return results;
        });
    }

    /* promise-based parallel map */
    function pmapp(values, func) {
        return Promise.all(values.map(func));
    }

    /* cache a single book and its images */
    function cacheOneBook(db, id) {
        return new Promise(function(resolve, reject) {
            readDb(db, 'books', id).then(function(book) {
                if (book) {
                    log('already got ' + id);
                    resolve(id);
                } else {
                    get(host + bookAsJson + id, 'json').then(function(book) {
                        // cache all the images first
                        pmapp(book.pages, function(page) {
                            return cacheImage(db, host + page.url);
                        }).then(function(results) {
                            // now save the json for the book
                            var transaction = db.transaction(['books'], 'readwrite'),
                                objectStore = transaction.objectStore('books');
                            transaction.oncomplete = function(event) {
                                resolve(book.ID);
                            };
                            transaction.onerror = function(event) {
                                console.log('book save error');
                                //console.log(event);
                                reject('db write failed');
                            };
                            objectStore.put(book);
                        }).catch(function(err) {
                            console.log('error', err);
                        });
                    });
                }
            });
        });
    }

    /* cache all the books in the list of ids, the progress function will be called with
       each id */
    function cacheBooks(db, ids, progress) {
        return pmap(ids, function(id) {
            return cacheOneBook(db, id, progress).then(function(id) {
                if(progress) {
                    progress(id);
                }
                return id;
            });
        });
    }

    /* display the title page for a book, I'm using it for progress */
    function displayImage(db, id) {
        //log('display ' + key);
        return new Promise(function(resolve, reject) {
            readDb(db, 'books', id).then(function(book) {
                var key = uriToKey(book.pages[0].url);
                readDb(db, 'images', key).then(function(result) {
                    var $img = $('<img>');
                    if (result instanceof Blob) {
                        result = window.URL.createObjectURL(result);
                    }
                    $img.attr('src', result);
                    $img.appendTo('#images');
                    resolve();
                });
            });
        });
    }

    /* a hack to get some legal id's for testing */
    function getBookIds(count) {
        var result = [];
        function getOneFindPage(page) {
            return get(host + findPage + page, 'json').then(function(data) {
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

    function bookToFindResult(book) {
        // copied from the php
        var fr = {};
        //console.log(book);
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

        //console.log(fr);
        return fr;
    }

    function findLocal(url) {
        // simply list the books in the db for starters
        return new Promise(function(resolve, reject) {
            //console.log('findLocal', url);
            initDB('thr').then(function(db) {
                //console.log('db ready');
                var transaction = db.transaction(['books'], "readonly"),
                    store = transaction.objectStore('books'),
                    cursorRequest = store.openCursor(),
                    result = {
                        books: []
                    };

                transaction.oncomplete = function(e) {
                    //console.log('transaction complete', result);
                    pmap(result.books, function(book) {
                        return pmap([book.cover.url, book.preview.url], function(url) {
                            return localizeImage(db, url);
                        }).then(function(urls) {
                            book.cover.url = urls[0];
                            book.preview.url = urls[1];
                            return book;
                        });
                    }).then(function() {
                        //console.log('resolving', result);
                        resolve(result);
                    });
                };

                cursorRequest.onerror = function(error) {
                    console.log('cursorRequest error', error);
                };

                cursorRequest.onsuccess = function(e) {
                    var cursor = e.target.result;
                    if (cursor) {
                        var fr = bookToFindResult(cursor.value);
                        result.books.push(fr);
                        cursor.continue();
                    }
                };
            });
        });
    }

    function find(url) {
        if (state.get('offline') == "0") {
            console.log('online', state);
            return $.ajax({
                url: url,
                data: 'json=1',
                dataType: 'json',
                timeout: 30000,
            });
        } else {
            console.log("offline");
            return findLocal(url);
        }
    }

    function localizeImage(db, uri) {
        console.log('localizeImage', uri);
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
        return new Promise(function(resolve, reject) {
            console.log('slug', slug);
            initDB('thr').then(function(db) {
                var transaction = db.transaction(['books'], 'readonly'),
                    store = transaction.objectStore('books'),
                    index = store.index('slug'),
                    req = index.get(encodeURI(slug).toLowerCase());
                req.onsuccess = function(e) {
                    var book = req.result;
                    if (!book) {
                        reject(slug + ' not found');
                    } else {
                        pmap(book.pages, function(page) {
                            return localizeImage(db, page.url).then(function(result) {
                                page.url = result;
                            });
                        }).then(function() {
                            resolve(book);
                        });
                    }
                };
                req.onerror = function(e) {
                    console.log('book fetch failed', e);
                    reject();
                }
            });
        });
    }

    var book = null; // current book

    function fetchBook(slug) {
        return new Promise(function(resolve, reject) {
            if (book && book.slug == encodeURI(slug).toLowerCase()) {
                resolve(book);
            } else if (state.get('offline') == "1") {
                console.log('offline');
                localizeBook(slug).then(function(data) {
                    //book = data;
                    resolve(data);
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
                    resolve(data);
                });
            }
        });
    }

    /* hack test fixture */
    if (true) {
        console.log('creating test data');
        deleteDB('thr', true).then(function() {
            //log('deleted the db');
            return initDB('thr');
        }).then(function(db) {
            log('opened the db');
            getBookIds(10).then(function(ids) {
                console.log('ids', ids);
                var tstart = +new Date();
                cacheBooks(db, ids, function(id) {
                    displayImage(db, id);
                }).then(function(ids) {
                    log((+new Date() - tstart)/1000);
                    console.log('cached', ids);
                    //log(performance.now()/1000);
                    log('count = ' + imageCount);
                    log('average blob size = ' + imageBlobSize / imageCount);
                    log('total blob size = ' + imageBlobSize);
                    log('average data size = ' + imageDataSize / imageCount);
                    log('total data size = ' + imageDataSize);
                });
            });
        }).catch(function(msg) {
            log('failed ' + msg);
        });
    }

    return {
       find: find,
       fetchBook: fetchBook
    };
});
