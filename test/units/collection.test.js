var _ = require('lodash'),
  monk = require('monk'),
  Q = require('bluebird');


var utils = require('../utils'),
  assert = utils.assert,
  expect = utils.expect,
  should = utils.should,
  sinon = utils.sinon;

var Robe = utils.Robe,
  Database = Robe.Database,
  Collection = Robe.Collection;


var test = module.exports = {};


test.beforeEach = function(done) {
  var self = this;

  this._db = monk('127.0.0.1');
  this.db = new Database(this._db);

  this._db.once('open', function(err) {
    if (err) return done(err);

    // drop test data
    Q.join(self._db.get('test').remove())
      .then(function() {
        // get collection
        self.collection = self.db.collection('test');
      })
      .done(done);
  });
};

test.afterEach = function(done) {
  this._db.close(done);
};



test['constructor'] = function*() {
  _.deepGet(this.collection, 'collection.name').should.eql('test');

  _.deepGet(this.collection, 'collection.manager.driver').should.eql(
    _.deepGet(this._db, 'driver')
  );
};


test['insert - no schema'] = function*() {
  var hookSpy = this.mocker.spy(this.collection, '_runHook');

  var attrs = {
    name: 'Jimmy'
  };

  var res = yield this.collection.insert(attrs);

  hookSpy.should.have.been.calledTwice;

  var args = hookSpy.getCall(0).args;
  args.should.eql(['before', 'insert', attrs]);

  args = hookSpy.getCall(1).args;
  args.slice(0,2).should.eql(['after', 'insert']);
  args[2].name.should.eql('Jimmy');
  args[2]._id.should.be.defined;

  res.should.eql(args[2]);
};


test['find'] = {
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

  'filter - found': function*() {
    var res = yield this.collection.find({
      dead: true
    });

    res.length.should.eql(3);
    _.pluck(res, 'name').should.eql(['Jimmy', 'Doug', 'Amanda']);
    (3 === _.pluck(res, 'id').length).should.be.true;
  },


  'filter - not found': function*() {
    var res = yield this.collection.find({
      dead: 123
    });

    res.length.should.eql(0);
  },


  'filter - sort': function*() {
    var res = yield this.collection.find({
    }, {
      sort: {
        dead: 1,
        name: 1,
      }
    });

    res.length.should.eql(5);
    _.pluck(res, 'name').should.eql(['Mark', 'Tom', 'Amanda', 'Doug', 'Jimmy']);
    _.pluck(res, 'dead').should.eql([false, false, true, true, true]);
  },

  'filter - limit': function*() {
    var res = yield this.collection.find({
      dead: true
    }, {
      sort: {
        name: 1
      },
      limit: 1,
    });

    res.length.should.eql(1);
    _.pluck(res, 'name').should.eql(['Amanda']);
    _.pluck(res, 'dead').should.eql([true]);
  },

  'filter - skip': function*() {
    var res = yield this.collection.find({
      dead: true
    }, {
      sort: {
        name: 1
      },
      skip: 1,
      limit: 1,
    });

    res.length.should.eql(1);
    _.pluck(res, 'name').should.eql(['Doug']);
    _.pluck(res, 'dead').should.eql([true]);
  },

  'filter - fields': function*() {
    var res = yield this.collection.find({
      dead: true
    }, {
      fields: {
        name: 1,
      },
      limit: 1,
    });

    res.length.should.eql(1);
    _.pluck(res, 'name').should.eql(['Jimmy']);
    _.pluck(res, 'dead').should.eql([undefined]);
  },

};

