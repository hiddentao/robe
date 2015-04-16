var _ = require('lodash'),
  monk = require('monk'),
  Q = require('bluebird');


var utils = require('../testutils'),
  assert = utils.assert,
  expect = utils.expect,
  should = utils.should,
  sinon = utils.sinon;

var EventEmitter = require('events').EventEmitter;

var Robe = utils.Robe,
  Database = Robe.Database,
  Cursor = Robe.Cursor,
  Collection = Robe.Collection,
  Document = Robe.Document;


var test = module.exports = {};


test.beforeEach = function*() {
  this.db = yield Robe.connect('127.0.0.1/robe-test');

  this.collection = this.db.collection('test');

  yield this.collection.remove();
};


test.afterEach = function*() {
  yield Robe.closeAll();
}



test['constructor'] = function*() {
  var e = new EventEmitter();

  var c = new Cursor(this.collection, e);
};



test['results'] = {
  beforeEach: function*() {
    var e = this.e = new EventEmitter();
    var c = this.c = new Cursor(this.collection, e);
  },
  'default': function*() {
    var e = this.e,
      c = this.c;

    var acc = [];

    c.on('result', function(r) {
      acc.push(r);
    });

    e.emit('each', { name: 'john' });
    e.emit('each', { name: 'tim' });

    acc.length.should.eql(2);

    acc[0].should.be.instanceOf(Document);
    acc[0].name.should.eql('john');
    acc[1].name.should.eql('tim');
  },
  'raw': function*() {
    var e = this.e,
      c = this.c;

    this.collection.options.rawMode = true;

    var acc = [];

    c.on('result', function(r) {
      acc.push(r);
    });

    e.emit('each', { name: 'john' });

    acc.length.should.eql(1);

    acc[0].should.not.be.instanceOf(Document);
    acc[0].name.should.eql('john');
  }
};



test['error'] = function*() {
  var e = new EventEmitter();
  var c = new Cursor(this.collection, e);

  var error = null;

  c.on('error', function(err) {
    error = err;
  });

  e.emit('error', new Error('test'));

  _.deepGet(error, 'message').should.eql('test');
};



test['success'] = function*() {
  var e = new EventEmitter();
  var c = new Cursor(this.collection, e);

  var done = null;

  c.on('success', function() {
    done = true;
  });

  e.emit('success');

  done.should.be.true;
};


test['real data'] = {
  beforeEach: function*() {
    var data = [
      {
        name: 'Jimmy',
        dead: true        
      },
      {
        name: 'Mark',
        dead: false        
      },
      {
        name: 'Tom',
        dead: false        
      },
      {
        name: 'Doug',
        dead: true        
      },
      {
        name: 'Amanda',
        dead: true        
      },
    ];

    for (var i=0; i<data.length; ++i) {
      yield this.collection.insert(data[i]);
    }
  },
  'fetch': function*() {
    var cursor = yield this.collection.findStream();

    yield new Q(function(resolve, reject){
      var acc = [];

      cursor.on('result', function(doc) {
        acc.push(doc);
      });

      cursor.on('error', reject);

      cursor.on('success', function() {
        try {
          _.pluck(acc, 'name').should.eql(['Jimmy', 'Mark', 'Tom', 'Doug', 'Amanda']);

          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  },
  'close()': function*() {
    var cursor = yield this.collection.findStream();

    yield cursor.close();
  }  
};
