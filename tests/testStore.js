var assert = chai.assert;
// hack for ie8 with no console
if(!window.console) {
    window.console = {
        log: function() {}
    };
}
describe('store module', function() {
    var store = null; // put the module here after loading test
    var capable = false;
    var ids = [97375, 96351, 94348, 94147, 94031];

    console.log('here');
    before(function(done) {
        console.log('there');
        require([
            'store'
        ], function(mystore) {
            console.log('loaded');
            store = mystore;
            store.offlineCapable().then(function(result) {
                console.log('result=', result);
                capable = result;
                done();
            }, function(err) {
                done(err);
            });
        });
    });

    describe('offlineCapable', function() {
        it('should return boolean', function(done) {
            assert.typeOf(capable, 'boolean');
            done();
        });
    });

    describe('addBooksToOffline', function() {
        this.timeout(30000);

        before(function(done) {
            store.reset();
            done();
        });
        it("should return the same ids it is given on a cold start", function(done) {
            this.timeout(60000);
            store.addBooksToOffline(ids).then(function(results) {
                assert.deepEqual(results, ids);
                done();
            }, function(err) {
                done(err);
            });
        });
        it("should return the same ids it is given on a warm start", function(done) {
            this.timeout(30000);
            store.addBooksToOffline(ids).then(function(results) {
                assert.deepEqual(results, ids);
                //expect(results).to.deep.equal(ids);
                done();
            }, function(err) {
                done(err);
            });
        });
    });

    describe('fetchBook', function() {
        // get the state module so we can switch offline status
        var state = null;
        before(function(done) {
            require(['state'], function(st) {
                state = st;
                done();
            });
        });

        var cached_slug = 'the-frog-prince-2',
            uncached_slug = 'micheal';
        it('should fetch a book when online', function(done) {
            state.set('offline', '0'); // online now
            store.fetchBook(uncached_slug).then(function(book) {
                assert.equal(book.slug, uncached_slug);
                done();
            });
        });
        it('should fetch a book when offline', function(done) {
            state.set('offline', '1'); // offline now
            store.fetchBook(cached_slug).then(function(book) {
                assert.equal(book.slug, cached_slug);
                done();
            });
        });
        it('should fail when fetching an uncached book offline', function(done) {
            state.set('offline', '1');
            store.fetchBook(uncached_slug).then(function(book) {
                assert.isTrue(false); // fail
                done();
            }, function() {
                assert.isTrue(true);
                done();
            });
        });
    });

    describe('find', function() {
        // get the state module so we can switch offline status
        var state = null;
        before(function(done) {
            require(['state'], function(st) {
                state = st;
                done();
            });
        });

        it('should return only the cached ids', function(done) {
            state.set('offline', '1');
            store.find('/find/?json=1').then(function(result) {
                rids = result.books.map(function(book) { return book.ID; });
                assert.deepEqual(rids, ids);
                done();
            }, function(err) {
                done(err);
            });
        });
    });

    describe('removeBooksFromOffline', function() {
        var ids = [97375, 96351, 94348, 94147];
        before(function(done) {
            this.timeout(60000);
            store.reset().then(function() {
                return store.addBooksToOffline(ids);
            }).then(function() {
                done();
            }, function(err) {
                console.log('error', err);
                done(err);
            });
        });

        it('should remove a book from the cache', function(done) {
            this.timeout(30000);
            rids = [94348, 96351];
            store.removeBooksFromOffline(rids).then(function() {
                store.listBooks().then(function(books) {
                    console.log('books', books);
                    nids = books.map(function(b) { return b.ID; });
                    assert.notInclude(nids, rids[0]);
                    assert.notInclude(nids, rids[1]);
                    done();
                });
            }, function(err) {
                done(err);
            });
        });
    });
});

var runner = mocha.run();
var failedTests = [];
runner.on('end', function(){
  window.mochaResults = runner.stats;
  window.mochaResults.reports = failedTests;
});

runner.on('fail', logFailure);

function logFailure(test, err){

  var flattenTitles = function(test){
    var titles = [];
    while (test.parent.title){
      titles.push(test.parent.title);
      test = test.parent;
    }
    return titles.reverse();
  };

  failedTests.push({name: test.title, result: false, message: err.message, stack: err.stack, titles: flattenTitles(test) });
};
