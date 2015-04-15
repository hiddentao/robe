var _ = require('lodash'),
  monk = require('monk'),
  ReplicaSet = require('mongo-replica-set').ReplicaSet,
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


test.before = function*() {
  this.timeout(6000);

  this.mocker = sinon.sandbox.create();

  this.rs = new ReplicaSet({
    numInstances: 2,
    startPort: 37117,
    // verbose: true
  });

  yield this.rs.start();
  yield Q.delay(2000);

  var hosts = this.rs.getHosts().map(function(h) {
    return h + '/robe-test';
  });

  this.db = yield Robe.connect(hosts);
};

test.after = function*() {
  this.mocker.restore();
  yield this.db.close();  
  yield this.db2.close();  

  yield this.rs.stop();
};


test['oplog'] = {
  before: function*() {
    this.timeout(3000);

    this.oplog = yield this.db.oplog();
  },

  beforeEach: function*() {
    this.callback = this.mocker.spy();
  },

  'one collection': {
    beforeEach: function*() {
      this.oplog.on('*', this.callback);      
    },

    afterEach: function*() {
      this.oplog.off('*', this.callback);
    },

    'on insert': function*() {
      this.timeout(5000);

      // todo

      yield Q.delay(3000);

      this.callback.should.have.been.calledOnce;
      this.callback.should.have.been.calledWithExactly(
        'insert', {
          name: 'james'
        }
      );
    },
  }

};

