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


test.beforeEach = function*() {
  this.timeout(6000);

  this.mocker = sinon.sandbox.create();

  this.rs = new ReplicaSet({
    numInstances: 2,
    startPort: 37117,
  });
  yield this.rs.start();

  yield Q.delay(2000);

  var hosts = this.rs.getHosts().map(function(h) {
    return h + '/robe-test';
  });

  this.db = yield Robe.connect(hosts);
  this.db2 = yield Robe.connect(hosts);
  this.collection = this.db2.collection('oplog-test');
};

test.afterEach = function*() {
  this.mocker.restore();
  yield this.db.close();  
  yield this.db2.close();  

  yield this.rs.stop();
};


test['oplog'] = {
  beforeEach: function*() {
    this.callback = function() {
      console.log(arguments);
    };
    this.oplog = yield this.db.oplog();
  },

  // 'oplog auto-starts': function(done) {
  //   this.oplog.on('started', done);
  // },

  'on insert': function*() {
    this.timeout(6000);
    
    yield this.collection.insert({
      name: 'james'
    });    

    yield Q.delay(5000);

    // this.callback.should.have.been.calledOnce;
    // this.callback.should.have.been.calledWithExactly(
    //   'insert', {
    //     name: 'james'
    //   }
    // );
  },
};

