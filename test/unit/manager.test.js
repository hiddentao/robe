var _ = require('lodash'),
  ReplicaSet = require('mongo-replica-set').ReplicaSet,
  Q = require('bluebird');


var utils = require('../testutils'),
  assert = utils.assert,
  expect = utils.expect,
  should = utils.should,
  sinon = utils.sinon;

var Robe = utils.Robe,
  Database = Robe.Database;



var test = utils.createTest(module);


test.afterEach = function*() {
  yield Robe.closeAll();
}



test['connect'] = {
  'valid': function*() {
    var db = yield Robe.connect('127.0.0.1:37127/robe-test');
  
    db.should.be.instanceOf(Robe.Database);
  },
  'bad': function*() {
    try {
      yield Robe.connect('127.0.0.3:37127', {
        timeout: 1
      });
  
      throw new Error('Should not be here');
    } catch (err) {
      err.message.should.contain('Failed to connect to db');
    }
  },
  'replica set': {
    before: function*() {
      this.rs = new ReplicaSet({
        numInstances: 2,
        startPort: 37137,
        // verbose: true,
        // useColors: true,
      });
  
      yield this.rs.start();
      yield Q.delay(2000);
  
      this.hosts = this.rs.getHosts().map((h) => `${h}/robe-test?replicaSet=${this.rs.name}`);
    },
    after: function*() {
      yield this.rs.stop();
    },
    success: function*() {
      var db = yield Robe.connect(this.hosts);
  
      db.should.be.instanceOf(Robe.Database);          
    },
  },
};




