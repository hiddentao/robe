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


var test = utils.createTest(module);


test.beforeEach = function*() {
  this.db = yield Robe.connect('127.0.0.1/robe-test');

  this.collection = this.db.collection('test');

  yield this.collection.remove();
  
  var e = this.e = {
    each: (fn) => {
      e._each = fn;
    },
    then: (fn) => {
      e._then = fn;
    },
    catch: (fn) => {
      e._catch = fn;
    },
  };  
};


test.afterEach = function*() {
  yield Robe.closeAll();
}



test['constructor'] = function*() {
  var c = new Cursor(this.collection, this.e);
};



test['results'] = {
  beforeEach: function*() {    
    var c = this.c = new Cursor(this.collection, this.e);
  },
  'default': function*() {
    var e = this.e,
      c = this.c;

    var acc = [];

    c.on('result', function(r) {
      acc.push(r);
    });

    e._each({ name: 'john' });
    e._each({ name: 'tim' });

    acc.length.should.eql(2);

    acc[0].should.be.instanceOf(Document);
    acc[0].name.should.eql('john');
    acc[1].name.should.eql('tim');
  },
  'raw - local': function*() {
    var e = this.e,
      c = this.c;

    c.options.rawMode = true;

    var acc = [];

    c.on('result', function(r) {
      acc.push(r);
    });

    e._each({ name: 'john' });

    acc.length.should.eql(1);

    acc[0].should.not.be.instanceOf(Document);
    acc[0].name.should.eql('john');
  },
  'raw - on collection': function*() {
    var e = this.e,
      c = this.c;

    this.collection.options.rawMode = true;

    var acc = [];

    c.on('result', function(r) {
      acc.push(r);
    });

    e._each({ name: 'john' });

    acc.length.should.eql(1);

    acc[0].should.not.be.instanceOf(Document);
    acc[0].name.should.eql('john');
  },
};



test['error'] = function(done) {
  var c = new Cursor(this.collection, this.e);

  var error = null;

  c.on('error', function(error) {
    try {
      _.deepGet(error, 'message', '').should.eql('test');
      
      done();
    } catch (err) {
      done(err);
    }
  });

  this.e._catch(new Error('test')); 
};



test['end'] = function(done) {
  var c = new Cursor(this.collection, this.e);

  c.on('end', done);

  this.e._then();
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

      cursor.on('end', function() {
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
