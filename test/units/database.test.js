var _ = require('lodash'),
  monk = require('monk'),
  Q = require('bluebird');


var utils = require('../testutils'),
  assert = utils.assert,
  expect = utils.expect,
  should = utils.should,
  sinon = utils.sinon;

var Robe = utils.Robe,
  Database = Robe.Database;


var test = module.exports = {};


test.beforeEach = function(done) {
  this._db = monk('127.0.0.1');
  this.db = new Database(this._db);

  this._db.once('open', done);
};

test.afterEach = function(done) {
  this._db.close(done);
};



test['constructor'] = function*() {
  this.db.db.should.eql(this._db);
};


test['close'] = function*() {
  expect( _.deepGet(this._db, 'driver._state') ).to.eql(2);

  yield this.db.close();

  expect( _.deepGet(this._db, 'driver._state') ).to.not.eql(2);
};


test['collection'] = function*() {
  var collection = this.db.collection('test');

  collection.should.be.instanceOf(Robe.Collection);
};







