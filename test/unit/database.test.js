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


var test = utils.createTest(module);


test.beforeEach = function*() {
  this.db = yield Robe.connect('127.0.0.1/robe-test');
};

test.afterEach = function*() {
  yield Robe.closeAll();
}



test['constructor'] = function*() {
  this.db.db.should.be.defined;
};


test['close'] = function*() {
  expect( _.deepGet(this.db.db, '_state', '') ).to.eql('open');

  yield this.db.close();

  expect( _.deepGet(this.db.db, '_state', '') ).to.eql('closed');
};


test['collection'] = function*() {
  var collection = this.db.collection('test');

  collection.should.be.instanceOf(Robe.Collection);
};







