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


test.beforeEach = function*() {
  this.db = yield Robe.connect('127.0.0.1/robe-test');
  this.db2 = yield Robe.connect('127.0.0.1/robe-test');
  this.collection = this.db2.collection('oplog-test');
};


test['add watcher'] = {
  beforeEach: function() {
    var spy = sinon.spy();

    this.db.watch('robe-test', spy);    
  },

  'kicks off the oplog watcher': function*() {
    this.db.oplog.should.be.defined;
  },

  'on insert': function*() {
    yield this.collection.insert({
      name: 'james'
    });    
  },

};

