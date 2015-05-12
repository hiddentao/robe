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
  Collection = Robe.Collection,
  Document = Robe.Document;


var test = utils.createTest(module);


test.beforeEach = function*() {
  this.db = yield Robe.connect('127.0.0.1/robe-test');

  this.collection = this.db.collection('test');

  yield this.collection.remove();
};

test.afterEach = function*() {
  yield Robe.closeAll();
}




test['constructor'] = function*() {
  var d = new Document(123, {
    name: 'john'
  });

  d.__col.should.eql(123);
  d.name.should.eql('john');
};



test['toJSON()'] = function*() {
  var d = new Document(123, {
    name: 'john'
  });

  d.toJSON().should.eql({
    name: 'john'
  });
};



test['changes()'] = function*() {
  var d = new Document(123, {
      name: 'john',
      age: 23,
      hasKids: true
  });

  d.changes().should.eql({});
};





test['change props'] = {
  beforeEach: function() {
    var d = this.d = new Document(123, {
      name: 'john',
      age: 23,
      father: 'eric',
      hasKids: true
    });

    d.name.should.eql('john');
    d.age.should.eql(23);
    d.father.should.eql('eric');
    d.hasKids.should.be.true;

    d.name = 'tim';
    d.mother = 'mary';
    d.father = null;
  },

  'updated getters': function*() {
    this.d.name.should.eql('tim');
    this.d.mother.should.eql('mary');
    should.equal(this.d.father, null);
  },

  'toJSON()': function*() {
    this.d.toJSON().should.eql({
      name: 'tim',
      mother: 'mary',
      father: null,
      age: 23,
      hasKids: true
    });
  },

  'changes()': function*() {
    this.d.changes().should.eql({
      name: 'tim',
      mother: 'mary',
      father: null
    });
  },

  'reset()': function*() {
    this.d.reset();

    this.d.changes().should.eql({});
    this.d.name.should.eql('john');
    expect(this.d.mother).to.be.defined;

    this.d.toJSON().should.eql({
      name: 'john',
      age: 23,
      father: 'eric',
      hasKids: true
    })
  },

  'markChanged()': function*() {
    var d = new Document(123, {
      name: 'john',
      age: 23,
      father: 'eric',
      hasKids: true
    });

    d.markChanged('name', 'age', 'father');
    d.father = 'mike';

    d.changes().should.eql({
      name: 'john',
      age: 23,
      father: 'mike',
    });

    d.reset();

    d.changes().should.eql({});
  },
};



test['save'] = {
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

  'calls through to collection': function*() {
    var doc = yield this.collection.findOne({
      name: 'Jimmy'
    });

    doc.dead = 12;
    doc.farmer = true;

    var spy = this.mocker.spy(this.collection, 'update');

    yield doc.save();

    spy.should.have.been.calledOnce;
    spy.should.have.been.calledWithExactly({
      _id: doc._id
    }, {
      $set: {
        dead: 12,
        farmer: true,
      }
    });

    var newdoc = yield this.collection.findOne({
      _id: doc._id
    });

    newdoc.dead.should.eql(12);
    newdoc.farmer.should.be.true;
  },

  'actually updates the data': function*() {
    var doc = yield this.collection.findOne({
      name: 'Jimmy'
    });

    doc.dead = 12;
    doc.farmer = true;

    yield doc.save();

    var newdoc = yield this.collection.findOne({
      _id: doc._id
    });

    newdoc.dead.should.eql(12);
    newdoc.farmer.should.be.true;
  },

  'resets instance once updated': function*() {
    var doc = yield this.collection.findOne({
      name: 'Jimmy'
    });

    doc.dead = 12;
    doc.farmer = true;

    yield doc.save();

    doc.toJSON().should.eql({
      _id: doc._id,
      name: 'Jimmy',
      dead: 12,
      farmer: true,
    });

    doc.changes().should.eql({});
  }

};




test['remove'] = {
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

  'calls through to collection': function*() {
    var doc = yield this.collection.findOne({
      name: 'Jimmy'
    });

    var spy = this.mocker.spy(this.collection, 'remove');

    yield doc.remove();

    spy.should.have.been.calledOnce;
    spy.should.have.been.calledWithExactly({
      _id: doc._id
    });
  },

  'actually removes the entry': function*() {
    var doc = yield this.collection.findOne({
      name: 'Jimmy'
    });

    var spy = this.mocker.spy(this.collection, 'remove');

    yield doc.remove();

    spy.should.have.been.calledOnce;
    spy.should.have.been.calledWithExactly({
      _id: doc._id
    });

    var newdoc = yield this.collection.findOne({
      _id: doc._id
    });

    expect(newdoc).to.be.null;
  },
};





test['reload'] = {
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

  'calls through to collection in raw mode': function*() {
    var doc = yield this.collection.findOne({
      name: 'Jimmy'
    });

    var id = doc._id;

    var spy = this.mocker.stub(this.collection, 'findOne', function() {
      return Q.resolve({});
    });

    yield doc.reload();

    spy.should.have.been.calledOnce;
    spy.should.have.been.calledWithExactly({
      _id: id
    }, {
      rawMode: true
    });
  },

  'reloads data': function*() {
    var doc = yield this.collection.findOne({
      name: 'Jimmy'
    });

    doc.name = 'Bucky';

    doc.changes().should.eql({
      name: 'Bucky'
    });

    yield this.collection.update({
      _id: doc._id
    }, {
      name: 'Martha',
      dead: false,
    });

    yield doc.reload();

    doc.changes().should.eql({});

    doc.name.should.eql('Martha');
    doc.dead.should.be.false;
  },
};





