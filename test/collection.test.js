var _ = require('lodash'),
  monk = require('monk'),
  Q = require('bluebird');


var utils = require('./utils'),
  assert = utils.assert,
  expect = utils.expect,
  should = utils.should,
  sinon = utils.sinon;

var Robe = utils.Robe,
  Database = Robe.Database,
  Collection = Robe.Collection;


var test = utils.createTest(module);


test.beforeEach = function(done) {
  var self = this;

  this._db = monk('127.0.0.1');
  this.db = new Database(this._db);

  this._db.once('open', function(err) {
    if (err) return done(err);

    self.collection = self.db.collection('test');

    done();
  });
};

test.afterEach = function(done) {
  this._db.close(done);
};



test['constructor'] = function*() {
  _.deepGet(this.collection, 'collection.name').should.eql('test');
  
  _.deepGet(this.collection, 'collection.manager.driver').should.eql(
    _.deepGet(this._db, 'driver')
  );
};

