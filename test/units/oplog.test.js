var _ = require('lodash'),
  monk = require('monk'),
  Q = require('bluebird');


var utils = require('../testutils'),
  assert = utils.assert,
  expect = utils.expect,
  should = utils.should,
  sinon = utils.sinon;

var Robe = utils.Robe,
  Database = Robe.Database,
  Oplog = Robe.Oplog;


var test = module.exports = {};


test.beforeEach = function*() {
  this.mocker = sinon.sandbox.create();

  this.db = yield Robe.connect('127.0.0.1/robe-test');
  this.db2 = yield Robe.connect('127.0.0.1/robe-test');
  this.collection = this.db2.collection('oplog-test');
};

test.afterEach = function*() {
  this.mocker.restore();
  yield this.db.close();  
  yield this.db2.close();  
};


test['oplog'] = {
  beforeEach: function*() {
    this.callback = this.mocker.spy();
    this.oplog = yield this.db.oplog();
  },

  // 'oplog auto-starts': function(done) {
  //   this.oplog.on('started', done);
  // },

  'on insert': function*() {
    yield this.collection.insert({
      name: 'james'
    });    

    this.callback.should.have.been.calledOnce;
    this.callback.should.have.been.calledWithExactly(
      'insert', {
        name: 'james'
      }
    );
  },
};

