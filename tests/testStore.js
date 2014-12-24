define([
    'store'
], function(store) {
    console.log('start testStore');
    var assert = chai.assert;

    describe('store', function() {
        var ids = [97375, 96351, 94348, 94147, 94031];
        this.timeout(10000);

        before(function(done) {
            store.reset().then(function() {
                done();
            })['catch'](function(err) {
                done(err);
            });
        });
        describe('addBooksToOffline cold start', function() {
            it("should return the same ids it is given", function(done) {
                this.timeout(10000);
                store.addBooksToOffline(ids).then(function(results) {
                    assert.deepEqual(results, ids);
                    done();
                })['catch'](function(err) {
                    done(err);
                });
            });
        });
        describe('addBooksToOffline warm start', function() {
            it("should return the same ids it is given", function(done) {
                this.timeout(5000);
                store.addBooksToOffline(ids).then(function(results) {
                    assert.deepEqual(results, ids);
                    //expect(results).to.deep.equal(ids);
                    done();
                })['catch'](function(err) {
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
});