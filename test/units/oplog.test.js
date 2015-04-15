var _ = require('lodash'),
  monk = require('monk'),
  shell = require('shelljs'),
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

  this.mongoShellExec = function(query) {
    return new Q(function(resolve, reject) {
      shell.exec('mongo --port 37117 --eval "' + query + '" robe-test', function(code, output) {
        if (0 !== code) {
          reject(new Error('Exit: ' + code, output));
        } 

        resolve([code, output]);
      });
    });
  };

  this.db = yield Robe.connect(hosts);
};

test.after = function*() {
  this.mocker.restore();

  yield this.db.close();  
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
      this.oplog.on('oplogtest:*', this.callback);      
    },

    afterEach: function*() {
      this.oplog.off('oplogtest:*', this.callback);
    },

    'on insert': function*() {
      yield this.mongoShellExec('db.oplogtest.insert({a:123})');

      yield Q.delay(100);

      this.callback.should.have.been.calledOnce;
      expect( _.deepGet(this.callback.getCall(0), 'args.0.a') ).to.eql(123);
    },
  }

};

