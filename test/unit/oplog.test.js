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


var test = utils.createTest(module);

// if running in an environment which doesn't allow us to setup a replica set then quit
if (process.env.NO_REPLICA_SETS) {
  test['skip due to inability to setup replica sets'] = true;

  return;
}


test.before = function*() {
  this.timeout(6000);

  this.rs = new ReplicaSet({
    numInstances: 2,
    startPort: 37117,
    // verbose: true,
    // useColors: true,
  });

  yield this.rs.start();
  yield Q.delay(2000);

  var hosts = this.rs.getHosts().map(function(h) {
    return h + '/robe-test';
  });

  this.mongoShellExec = function(dbName, query) {
    if (1 === arguments.length) {
      query = dbName;
      dbName = 'robe-test';
    }

    return new Q(function(resolve, reject) {
      shell.exec('mongo --port 37117 --eval "' + query + '" ' + dbName, function(code, output) {
        if (0 !== code) {
          reject(new Error('Exit: ' + code, output));
        } 

        resolve([code, output]);
      });
    });
  };

  this.db = yield Robe.connect(hosts);

  this.oplog = yield this.db.oplog();
};

test.after = function*() {
  this.timeout(10000);

  yield Robe.closeAll();
};



test['oplog'] = {
  'not yet started': {
    'can be paused': function*() {
      this.oplog.pause();
    },
    'can be resumed': function*() {
      this.oplog.resume();
    },
    'can be stopped': function*() {
      yield this.oplog.stop();
    },
    'does nothing': function*() {
      var callback = this.mocker.spy();

      this.oplog.onAny(callback);

      yield this.mongoShellExec('db.oplogtest.insert({a:123})');

      yield Q.delay(100);

      callback.callCount.should.eql(0);
    },
  },
  'once started': {
    before: function*() {
      yield this.oplog.start();
    },

    after: function*() {
      this.timeout(10000);
      
      yield this.rs.stop();
    },

    beforeEach: function*() {
      this.oplog.resume();
    },

    afterEach: function*() {
      this.oplog.pause();

      yield this.mongoShellExec('db.oplogtest.remove({})');
      yield this.mongoShellExec('db.oplogtest2.remove({})');
      yield this.mongoShellExec('db.oplogtest3.remove({})');

      this.oplog.removeAllListeners();
    },

    'ignores stuff for other databases': function*() {
      var spy = this.mocker.spy();

      this.oplog.onAny(spy);      

      yield this.mongoShellExec('otherdb', 'db.oplogtest2.insert({a:123})');

      yield Q.delay(100);

      spy.should.not.have.been.called;
    },

    'any collection': {
      beforeEach: function*() {
        this.callback = this.mocker.spy();

        this.oplog.onAny(this.callback);
      },

      'default': function*() {
        yield this.mongoShellExec('db.oplogtest.insert({a:123})');
        yield this.mongoShellExec('db.oplogtest.update({a:123}, {a:456})');
        yield this.mongoShellExec('db.oplogtest2.insert({a:123})');
        yield this.mongoShellExec('db.oplogtest2.remove({})');

        yield Q.delay(100);

        this.callback.callCount.should.eql(4);
        expect( _.deepGet(this.callback.getCall(0), 'args.0') ).to.eql('oplogtest');
        expect( _.deepGet(this.callback.getCall(0), 'args.1') ).to.eql('insert');
        expect( _.deepGet(this.callback.getCall(1), 'args.0') ).to.eql('oplogtest');
        expect( _.deepGet(this.callback.getCall(1), 'args.1') ).to.eql('update');
        expect( _.deepGet(this.callback.getCall(2), 'args.0') ).to.eql('oplogtest2');
        expect( _.deepGet(this.callback.getCall(2), 'args.1') ).to.eql('insert');
        expect( _.deepGet(this.callback.getCall(3), 'args.0') ).to.eql('oplogtest2');
        expect( _.deepGet(this.callback.getCall(3), 'args.1') ).to.eql('delete');
      },

    },

    'single collection': {
      'any event': {
        beforeEach: function*() {
          this.callback = this.mocker.spy();

          this.oplog.on('oplogtest:*', this.callback);
        },
        'insert': function*() {
          yield this.mongoShellExec('db.oplogtest.insert({a:123})');

          yield Q.delay(100);

          this.callback.should.have.been.calledOnce;
          expect( _.deepGet(this.callback.getCall(0), 'args.0') ).to.eql('oplogtest');
          expect( _.deepGet(this.callback.getCall(0), 'args.1') ).to.eql('insert');
          expect( _.deepGet(this.callback.getCall(0), 'args.2.a') ).to.eql(123);
        },
        'update': function*() {
          yield this.mongoShellExec('db.oplogtest.insert({a:123})');
          yield this.mongoShellExec('db.oplogtest.update({a:123}, {a:456})');

          yield Q.delay(100);

          this.callback.should.have.been.calledTwice;
          expect( _.deepGet(this.callback.getCall(0), 'args.0') ).to.eql('oplogtest');
          expect( _.deepGet(this.callback.getCall(0), 'args.1') ).to.eql('insert');
          expect( _.deepGet(this.callback.getCall(1), 'args.0') ).to.eql('oplogtest');
          expect( _.deepGet(this.callback.getCall(1), 'args.1') ).to.eql('update');
        },
        'delete': function*() {
          yield this.mongoShellExec('db.oplogtest.insert({a:123})');
          yield this.mongoShellExec('db.oplogtest.remove({a:123})');

          yield Q.delay(100);

          this.callback.should.have.been.calledTwice;
          expect( _.deepGet(this.callback.getCall(0), 'args.0') ).to.eql('oplogtest');
          expect( _.deepGet(this.callback.getCall(0), 'args.1') ).to.eql('insert');
          expect( _.deepGet(this.callback.getCall(1), 'args.0') ).to.eql('oplogtest');
          expect( _.deepGet(this.callback.getCall(1), 'args.1') ).to.eql('delete');
        },
      },

      'specific event': {
        beforeEach: function*() {
          this.callback = this.mocker.spy();
          this.oplog.on('oplogtest:update', this.callback);
        },

        'default': function*() {
          yield this.mongoShellExec('db.oplogtest.insert({a:123})');
          yield this.mongoShellExec('db.oplogtest.update({a:123}, {a:456})');
          yield this.mongoShellExec('db.oplogtest.remove({a:456})');

          yield Q.delay(100);

          this.callback.should.have.been.calledOnce;
          expect( _.deepGet(this.callback.getCall(0), 'args.0') ).to.eql('oplogtest');
          expect( _.deepGet(this.callback.getCall(0), 'args.1') ).to.eql('update');
        },

      },
    },
  },
};

